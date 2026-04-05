import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommunityService } from './community.service';

@Injectable()
export class CommunityCron {
  private readonly logger = new Logger(CommunityCron.name);

  constructor(private readonly communityService: CommunityService) {}

  /**
   * Archive expired community posts daily at 2:00 AM.
   * This runs automatically based on the cron schedule.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleArchiveExpiredPosts() {
    this.logger.log('Running cron job: archive expired community posts');
    try {
      const result = await this.communityService.archiveExpiredPosts();
      this.logger.log(`Archived ${result.archivedCount} expired posts`);
    } catch (error) {
      this.logger.error('Failed to archive expired posts', error.stack);
    }
  }
}