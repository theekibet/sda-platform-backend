// src/modules/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [
    NotificationController,
    NotificationPreferencesController,
  ],
  providers: [
    NotificationService,
    NotificationPreferencesService,
    NotificationGateway,
    PrismaService,
  ],
  exports: [
    NotificationService,
    NotificationGateway,
    NotificationPreferencesService,
  ],
})
export class NotificationModule {}