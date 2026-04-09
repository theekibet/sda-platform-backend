import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PostAnalyticsService } from './post-analytics.service';
import { PrismaService } from '../../prisma.service';
import { CommunityCron } from './community.cron';

@Module({
  controllers: [
    CommunityController,
  ],
  providers: [
    CommunityService,
    PostAnalyticsService,
    PrismaService,
    CommunityCron,
  ],
  exports: [
    CommunityService,
    PostAnalyticsService,
  ],
})
export class CommunityModule {}