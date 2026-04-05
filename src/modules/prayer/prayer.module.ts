import { Module } from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { PrayerController } from './prayer.controller';
import { PrismaService } from '../../prisma.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    NotificationModule, // for NotificationService
  ],
  controllers: [PrayerController],
  providers: [PrayerService, PrismaService],
})
export class PrayerModule {}