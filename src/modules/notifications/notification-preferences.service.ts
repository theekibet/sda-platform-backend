import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if none exist
      return this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!existing) {
      return this.prisma.notificationPreference.create({
        data: { userId, ...dto },
      });
    }

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: dto,
    });
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