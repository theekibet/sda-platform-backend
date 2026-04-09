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

// Maps notification type strings to preference field names
const TYPE_TO_PREFERENCE_FIELD: Record<string, keyof any> = {
  // Community
  community_post: 'communityPosts',
  community_response: 'communityResponses',
  post_mention: 'postMentions',
  
  // Discussions
  discussion_reply: 'discussionReplies',
  discussion_upvote: 'discussionUpvotes',
  discussion_mention: 'discussionMentions',
  
  // Prayer
  prayer_response: 'prayerResponses',
  
  // Bible / Verse
  verse_published: 'versePublished',
  
  // Groups
  group_invite: 'groupInvites',
  
  // System
  announcement: 'announcements',
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create a notification (respects user preferences)
   * Returns null if user opted out (in-app or specific type)
   */
  async create(dto: CreateNotificationDto) {
    this.logger.log(`Creating notification for user ${dto.userId}: ${dto.type}`);

    // 1. Get user's preferences (or create defaults)
    const prefs = await this.getPreferences(dto.userId);

    // 2. Check if in-app notifications are enabled
    if (prefs.inAppEnabled === false) {
      this.logger.debug(`In-app notifications disabled for user ${dto.userId}`);
      return null;
    }

    // 3. Map notification type to preference field and check if enabled
    const prefField = TYPE_TO_PREFERENCE_FIELD[dto.type];
    if (prefField && prefs[prefField] === false) {
      this.logger.debug(`Notification type "${dto.type}" disabled for user ${dto.userId}`);
      return null;
    }

    // 4. Quiet hours check – skip if within quiet hours
    if (prefs.quietHoursEnabled === true) {
      const start = prefs.quietHoursStart;
      const end = prefs.quietHoursEnd;
      
      // Only check if both start and end are defined (not null)
      if (start !== null && start !== undefined && end !== null && end !== undefined) {
        const now = new Date();
        const currentHour = now.getHours();
        let isQuiet = false;
        
        if (start <= end) {
          isQuiet = currentHour >= start && currentHour < end;
        } else {
          isQuiet = currentHour >= start || currentHour < end;
        }
        
        if (isQuiet) {
          this.logger.debug(`Quiet hours active for user ${dto.userId}, skipping notification`);
          return null;
        }
      }
    }

    // 5. Create notification record
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

      // 6. Send real-time notification via WebSocket
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

      // 7. Send email if enabled (integrate with your email service)
      if (prefs.emailEnabled === true) {
        // await this.emailService.sendNotificationEmail(userEmail, dto.title, dto.message);
        this.logger.debug(`Email notification would be sent to user ${dto.userId}`);
      }

      return notification;
    } catch (error) {
      this.logger.error(`❌ Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  // Alias for backward compatibility
  async createNotification(dto: CreateNotificationDto) {
    return this.create(dto);
  }

  // Bulk creation (respects preferences per user)
  async createBulk(dtos: CreateNotificationDto[]) {
    this.logger.log(`📦 Creating ${dtos.length} notifications in bulk`);
    
    if (dtos.length === 0) {
      return { count: 0 };
    }

    // Group by user to fetch preferences once per user
    const userMap = new Map<string, CreateNotificationDto[]>();
    for (const dto of dtos) {
      if (!userMap.has(dto.userId)) userMap.set(dto.userId, []);
      userMap.get(dto.userId)!.push(dto);
    }

    const allowedNotifications: CreateNotificationDto[] = [];

    for (const [userId, userDtos] of userMap.entries()) {
      const prefs = await this.getPreferences(userId);
      if (prefs.inAppEnabled === false) continue;

      for (const dto of userDtos) {
        const prefField = TYPE_TO_PREFERENCE_FIELD[dto.type];
        if (prefField && prefs[prefField] === false) continue;
        allowedNotifications.push(dto);
      }
    }

    if (allowedNotifications.length === 0) {
      this.logger.log('No notifications allowed after preference filtering');
      return { count: 0 };
    }

    try {
      const result = await this.prisma.notification.createMany({
        data: allowedNotifications.map(d => ({
          type: d.type,
          title: d.title,
          message: d.message,
          data: d.data ? JSON.stringify(d.data) : null,
          userId: d.userId,
        })),
      });

      this.logger.log(`✅ Successfully created ${result.count} notifications`);

      // Send real-time for each
      allowedNotifications.forEach(dto => {
        try {
          this.notificationGateway.sendToUser(
            dto.userId,
            'NEW_NOTIFICATION',
            {
              id: `temp-${Date.now()}-${dto.userId}`,
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

      return result;
    } catch (error) {
      this.logger.error(`❌ Error in createBulk: ${error.message}`);
      throw error;
    }
  }

  async createBulkNotifications(dtos: CreateNotificationDto[]) {
    return this.createBulk(dtos);
  }

  // ============ USER NOTIFICATIONS METHODS ============
  
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

      // Safely parse JSON data field
      const parsedNotifications = notifications.map(notif => {
        let parsedData = null;
        try {
          parsedData = notif.data ? JSON.parse(notif.data) : null;
        } catch (e) {
          this.logger.warn(`Invalid JSON in notification ${notif.id}: ${notif.data}`);
          parsedData = null;
        }
        return { ...notif, data: parsedData };
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
        // Community
        communityPosts: true,
        communityResponses: true,
        postMentions: true,
        // Discussions
        discussionReplies: true,
        discussionUpvotes: true,
        discussionMentions: true,
        // Prayer
        prayerResponses: true,
        // Bible
        versePublished: true,
        // Groups
        groupInvites: true,
        // System
        announcements: true,
        digestFrequency: 'daily',
        quietHoursEnabled: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      },
    });
  }
}