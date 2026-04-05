import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MembersModule } from './modules/members/members.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { PrayerModule } from './modules/prayer/prayer.module';
import { GroupsModule } from './modules/groups/groups.module';
import { AdminModule } from './modules/admin/admin.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SecurityModule } from './modules/security/security.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { AuditLoggerMiddleware } from './common/middleware/audit-logger.middleware';
import { BibleModule } from './modules/bible/bible.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { PrismaModule } from './prisma.module'; // Import PrismaModule
// NEW: Reddit-style discussion modules
import { TagsModule } from './modules/tags/tags.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule, // ← Add this
    MembersModule,
    AuthModule,
    LocationModule,
    PrayerModule,
    GroupsModule,
    AdminModule,
    ModerationModule,
    ReportsModule,
    AnalyticsModule,
    SettingsModule,
    AnnouncementsModule,
    SecurityModule,
    MaintenanceModule,
    BibleModule,
    CommunityModule,
    NotificationModule,
    // NEW: Reddit-style discussion modules
    TagsModule,
    DiscussionsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Remove PrismaService from here - it's provided by PrismaModule
  ],
  // Remove exports - not needed in root module
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditLoggerMiddleware)
      .forRoutes('*');
  }
}