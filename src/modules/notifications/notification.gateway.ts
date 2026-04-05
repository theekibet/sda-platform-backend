// src/modules/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * WebSocket Gateway for real-time notifications
 * 
 * This gateway handles:
 * - Authentication via JWT token
 * - User session management
 * - Real-time notification delivery
 * - Read receipts
 * 
 * Frontend connection: io('http://localhost:3000/notifications', { auth: { token } })
 */
@WebSocketGateway({
  namespace: 'notifications', // ← IMPORTANT: Matches frontend connection URL
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], // polling fallback for proxied environments
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();
  private readonly jwtSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private verifyToken(client: Socket): JwtPayload | null {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('WS: No token provided');
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      if (!decoded?.sub) {
        console.log('WS: Invalid token payload');
        return null;
      }

      return decoded;
    } catch (error) {
      console.log('WS: Token verification failed:', error.message);
      return null;
    }
  }

  private async checkUserSuspension(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { isSuspended: true, suspendedUntil: true },
      });

      if (!user) return true;
      if (!user.isSuspended) return false;
      if (!user.suspendedUntil) return true; // permanent
      return user.suspendedUntil > new Date(); // temporary
    } catch (error) {
      console.error('WS: Error checking suspension:', error);
      return true; // fail closed
    }
  }

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const payload = this.verifyToken(client);

      if (!payload) {
        client.emit('error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
        client.disconnect(true);
        return;
      }

      const userId = payload.sub;

      const isSuspended = await this.checkUserSuspension(userId);
      if (isSuspended) {
        client.emit('error', { message: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
        client.disconnect(true);
        return;
      }

      // Store socket with verified userId
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
      client.data.userId = userId;
      client.data.userEmail = payload.email;
      client.data.isAdmin = payload.isAdmin || false;

      console.log(
        `WS: User ${userId} connected. Total online users: ${this.userSockets.size}`,
      );

      // Send initial connection confirmation with unread count
      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });

      client.emit('connected', {
        userId,
        unreadCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('WS: Connection error:', error);
      client.emit('error', { message: 'Connection failed', code: 'CONNECTION_ERROR' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = client.data?.userId;
      if (!userId) return;

      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          console.log(`WS: User ${userId} fully disconnected`);
        }
      }
    } catch (error) {
      console.error('WS: Disconnect error:', error);
    }
  }

  // ── Message handlers ───────────────────────────────────────────────────────

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      if (!data?.token) {
        return { event: 'authenticated', data: { success: false, error: 'No token provided' } };
      }

      let payload: JwtPayload;
      try {
        payload = jwt.verify(data.token, this.jwtSecret) as JwtPayload;
      } catch {
        return { event: 'authenticated', data: { success: false, error: 'Invalid token' } };
      }

      if (!payload?.sub) {
        return { event: 'authenticated', data: { success: false, error: 'Invalid token payload' } };
      }

      const userId = payload.sub;

      const isSuspended = await this.checkUserSuspension(userId);
      if (isSuspended) {
        return { event: 'authenticated', data: { success: false, error: 'Account suspended' } };
      }

      // Update socket mapping if re-authenticating
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
      client.data.userId = userId;
      client.data.userEmail = payload.email;
      client.data.isAdmin = payload.isAdmin || false;

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });

      return {
        event: 'authenticated',
        data: {
          success: true,
          userId,
          unreadCount,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('WS: Authentication error:', error);
      return { event: 'authenticated', data: { success: false, error: 'Authentication failed' } };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const userId = client.data?.userId;
      if (!userId) {
        return { event: 'error', data: { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' } };
      }
      if (!data?.notificationId) {
        return { event: 'error', data: { message: 'Notification ID required', code: 'INVALID_REQUEST' } };
      }

      const notification = await this.prisma.notification.findFirst({
        where: { id: data.notificationId, userId },
      });

      if (notification && !notification.readAt) {
        await this.prisma.notification.update({
          where: { id: data.notificationId },
          data: { isRead: true, readAt: new Date() },
        });
      }

      // Broadcast to all user's connections that this notification was read
      this.server.to(`user:${userId}`).emit('notificationUpdated', {
        id: data.notificationId,
        readAt: new Date().toISOString(),
      });

      return {
        event: 'markedAsRead',
        data: { success: true, notificationId: data.notificationId },
      };
    } catch (error) {
      console.error('WS: Mark as read error:', error);
      return { event: 'error', data: { message: 'Failed to mark as read', code: 'INTERNAL_ERROR' } };
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data?.userId;
      if (!userId) {
        return { event: 'error', data: { message: 'Not authenticated', code: 'NOT_AUTHENTICATED' } };
      }

      await this.prisma.notification.updateMany({
        where: { userId, isRead: false, isArchived: false },
        data: { isRead: true, readAt: new Date() },
      });

      this.server.to(`user:${userId}`).emit('allNotificationsRead', {
        timestamp: new Date().toISOString(),
      });

      return { event: 'markedAllAsRead', data: { success: true } };
    } catch (error) {
      console.error('WS: Mark all as read error:', error);
      return { event: 'error', data: { message: 'Failed to mark all as read', code: 'INTERNAL_ERROR' } };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        userId: client.data?.userId || null,
      },
    };
  }

  // ── Send helpers ───────────────────────────────────────────────────────────

  /**
   * Send a notification to a specific user
   * @param userId - The user ID to send to
   * @param event - The event name (e.g., 'NEW_NOTIFICATION')
   * @param payload - The notification payload
   */
  async sendToUser(userId: string, event: string, payload: any) {
    try {
      const isSuspended = await this.checkUserSuspension(userId);
      if (isSuspended) return;

      const sockets = this.userSockets.get(userId);
      if (sockets && sockets.size > 0) {
        this.server.to(`user:${userId}`).emit(event, {
          ...payload,
          _meta: {
            timestamp: new Date().toISOString(),
            notificationId: payload.id || null,
          },
        });
      }
    } catch (error) {
      console.error(`WS: Failed to send to user ${userId}:`, error);
    }
  }

  /**
   * Send a notification to multiple users
   * @param userIds - Array of user IDs
   * @param event - The event name
   * @param payload - The notification payload
   */
  async sendToMultipleUsers(userIds: string[], event: string, payload: any) {
    const validUserIds: string[] = [];

    for (const userId of userIds) {
      const isSuspended = await this.checkUserSuspension(userId);
      if (!isSuspended) validUserIds.push(userId);
    }

    validUserIds.forEach(userId => {
      const sockets = this.userSockets.get(userId);
      if (sockets && sockets.size > 0) {
        this.server.to(`user:${userId}`).emit(event, {
          ...payload,
          _meta: {
            timestamp: new Date().toISOString(),
            targetUserId: userId,
          },
        });
      }
    });

    console.log(`WS: Notification sent to ${validUserIds.length} users`);
  }

  /**
   * Broadcast a notification to all connected clients
   * @param event - The event name
   * @param payload - The notification payload
   */
  async broadcastToAll(event: string, payload: any) {
    this.server.emit(event, {
      ...payload,
      _meta: {
        timestamp: new Date().toISOString(),
        isBroadcast: true,
      },
    });
  }

  /**
   * Get connection statistics for monitoring
   */
  getConnectionStats() {
    return {
      totalUsers: this.userSockets.size,
      totalConnections: Array.from(this.userSockets.values()).reduce(
        (acc, sockets) => acc + sockets.size,
        0,
      ),
      users: Array.from(this.userSockets.entries()).map(([userId, sockets]) => ({
        userId,
        connections: sockets.size,
      })),
    };
  }
}