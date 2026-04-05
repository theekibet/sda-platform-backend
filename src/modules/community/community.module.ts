import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaService } from '../../prisma.service';
import { CommunityCron } from './community.cron'; // 👈 Import the cron service

@Module({
  controllers: [
    CommunityController,  // ← Trending endpoint is now inside this controller
  ],
  providers: [
    CommunityService,
    PrismaService,
    CommunityCron,        // 👈 Add the cron job to providers
  ],
  exports: [
    CommunityService,      // ← Export if other modules need this service
  ],
})
export class CommunityModule {}