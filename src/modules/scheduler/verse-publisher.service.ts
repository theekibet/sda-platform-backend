// src/modules/scheduler/verse-publisher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VersePublisherService {
  private readonly logger = new Logger(VersePublisherService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 6 * * *') // 6:00 AM every day
  async publishTodayVerse() {
    this.logger.log('Running daily verse publishing job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      // FIX – publishedAt does not exist in the schema.
      // Use status='published' + scheduledFor within today's window as the idempotency check.
      const alreadyPublishedToday = await this.prisma.sharedVerse.findFirst({
        where: {
          status: 'published',
          scheduledFor: { gte: today, lt: tomorrow },
        },
      });

      if (alreadyPublishedToday) {
        this.logger.log(`Verse already published today: ${alreadyPublishedToday.id}`);
        return { success: false, message: 'A verse has already been published today' };
      }

      const scheduled = await this.prisma.sharedVerse.findFirst({
        where: {
          scheduledFor: { gte: today, lt: tomorrow },
          status: 'scheduled',
        },
      });

      if (!scheduled) {
        this.logger.log('No verse scheduled for today');
        return { success: false, message: 'No verse scheduled for today' };
      }

      // FIX – only update status; do not set publishedAt (not in schema)
      const published = await this.prisma.sharedVerse.update({
        where: { id: scheduled.id },
        data: { status: 'published' },
        include: { verse: true, user: true },
      });

      await this.prisma.moderationLog.create({
        data: {
          moderatorId: 'system',
          action: 'published',
          contentType: 'verse_submission',
          contentId: scheduled.id,
          reason: 'Published by cron job',
        },
      });

      this.logger.log(`Published verse: ${scheduled.id}`);
      return { success: true, message: 'Verse published successfully', data: published };
    } catch (error) {
      this.logger.error(`Failed to publish verse: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // Midnight cleanup – reset expired scheduled verses back to pending
  @Cron('0 0 * * *')
  async cleanupExpiredScheduledVerses() {
    this.logger.log('Running cleanup for expired scheduled verses...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    try {
      const expired = await this.prisma.sharedVerse.updateMany({
        where: {
          status: 'scheduled',
          scheduledFor: { lt: yesterday },
        },
        data: {
          status: 'pending',
          scheduledFor: null,
        },
      });

      if (expired.count > 0) {
        this.logger.log(`Reset ${expired.count} expired scheduled verses to pending`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup expired verses: ${error.message}`);
    }
  }
}