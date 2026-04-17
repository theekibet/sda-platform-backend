// src/modules/announcements/controllers/member-announcements.controller.ts
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnnouncementsService } from '../announcements.service';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class MemberAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('active')
  getActiveAnnouncements(@CurrentUser() user: any) {
    // ✅ FIXED: Pass user.role as second parameter
    return this.announcementsService.getActiveAnnouncements(user?.id, user?.role);
  }

  @Post(':id/view')
  markAsViewed(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.announcementsService.markAsViewed(user.id, id);
  }
}