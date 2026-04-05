// src/modules/notifications/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  // Primary creation method
  async create(dto: CreateNotificationDto) {
    this.logger.log(`Creating notification for user ${dto.userId}: ${dto.type}`);
    
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data ? JSON.stringify(dto.data) : null,
          userId: dto.userId,
        },
      });

      this.logger.log(`✅ Notification created with ID: ${notification.id}`);

      // Send real-time notification if user is online
      try {
        this.notificationGateway.sendToUser(
          dto.userId, 
          'NEW_NOTIFICATION', 
          notification
        );
        this.logger.log(`📨 Real-time notification sent to user ${dto.userId}`);
      } catch (wsError) {
        this.logger.error(`❌ Failed to send real-time notification: ${wsError.message}`);
      }

      return notification;
    } catch (error) {
      this.logger.error(`❌ Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  // Alias for create (used by other modules)
  async createNotification(dto: CreateNotificationDto) {
    return this.create(dto);
  }

  async createBulk(dtos: CreateNotificationDto[]) {
    this.logger.log(`📦 Creating ${dtos.length} notifications in bulk`);
    
    if (dtos.length === 0) {
      this.logger.log('⚠️ No notifications to create');
      return { count: 0 };
    }

    try {
      const notifications = await this.prisma.notification.createMany({
        data: dtos.map(d => ({
          type: d.type,
          title: d.title,
          message: d.message,
          data: d.data ? JSON.stringify(d.data) : null,
          userId: d.userId,
        })),
      });

      this.logger.log(`✅ Successfully created ${notifications.count} notifications`);

      // Send real-time notifications to each user
      dtos.forEach(dto => {
        try {
          this.notificationGateway.sendToUser(
            dto.userId, 
            'NEW_NOTIFICATION', 
            { 
              id: `temp-${Date.now()}`,
              type: dto.type,
              title: dto.title,
              message: dto.message,
              data: dto.data,
              createdAt: new Date(),
              isRead: false,
            }
          );
        } catch (wsError) {
          this.logger.debug(`Could not send real-time to user ${dto.userId}: ${wsError.message}`);
        }
      });

      return notifications;
    } catch (error) {
      this.logger.error(`❌ Error in createBulk: ${error.message}`);
      throw error;
    }
  }

  async createBulkNotifications(dtos: CreateNotificationDto[]) {
    return this.createBulk(dtos);
  }

  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    this.logger.log(`Fetching notifications for user ${userId}`);
    
    const { page = 1, limit = 20, unreadOnly = false, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: false,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(type ? { type } : {}),
    };

    try {
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });

      const parsedNotifications = notifications.map(notif => {
        try {
          return {
            ...notif,
            data: notif.data ? JSON.parse(notif.data) : null,
          };
        } catch (e) {
          return { ...notif, data: null };
        }
      });

      return {
        notifications: parsedNotifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() },
      });
      
      this.notificationGateway.sendToUser(
        userId,
        'notificationUpdated',
        { id: notificationId, isRead: true }
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    this.logger.log(`Marking all notifications as read for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      
      this.notificationGateway.sendToUser(
        userId,
        'allNotificationsRead',
        { timestamp: new Date() }
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async archive(userId: string, notificationId: string) {
    this.logger.log(`Archiving notification ${notificationId} for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isArchived: true },
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to archive notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  async delete(userId: string, notificationId: string) {
    this.logger.log(`Deleting notification ${notificationId} for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.delete({
        where: { id: notificationId, userId },
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  // ============ NOTIFICATION PREFERENCES ============

  async getPreferences(userId: string) {
    this.logger.log(`Getting notification preferences for user ${userId}`);
    
    try {
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences) {
        this.logger.log(`No preferences found for user ${userId}, creating defaults`);
        return this.createDefaultPreferences(userId);
      }

      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async updatePreferences(userId: string, data: any) {
    this.logger.log(`Updating notification preferences for user ${userId}`);
    
    try {
      const existing = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!existing) {
        return this.prisma.notificationPreference.create({
          data: { userId, ...data },
        });
      }

      return this.prisma.notificationPreference.update({
        where: { userId },
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async createDefaultPreferences(userId: string) {
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        communityPosts: true,
        communityResponses: true,
        postMentions: true,
        discussionReplies: true,
        prayerResponses: true,
        announcements: true,
        digestFrequency: 'daily',
      },
    });
  }
}