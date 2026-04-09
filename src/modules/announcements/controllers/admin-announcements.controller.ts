// src/modules/announcements/controllers/admin-announcements.controller.ts
import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  UseGuards, DefaultValuePipe, ParseIntPipe 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ModeratorGuard } from '../../../common/guards/moderator.guard'; // ✅ CHANGED from AdminGuard
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnnouncementsService } from '../announcements.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';

@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, ModeratorGuard) // ✅ CHANGED: Announcements for moderators + super admin
export class AdminAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  createAnnouncement(
    @CurrentUser() admin: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.createAnnouncement(admin.id, dto);
  }

  @Get()
  getAllAnnouncements(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('active') active?: string,
  ) {
    return this.announcementsService.getAllAnnouncements(page, limit, active);
  }

  @Get('active')
  getActiveAnnouncements(@CurrentUser() user: any) {
    // Moderators can also see active announcements if needed
    return this.announcementsService.getActiveAnnouncements(user?.id);
  }

  @Get(':id')
  getAnnouncementById(@Param('id') id: string) {
    return this.announcementsService.getAnnouncementById(id);
  }

  @Put(':id')
  updateAnnouncement(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.updateAnnouncement(admin.id, id, dto);
  }

  @Delete(':id')
  deleteAnnouncement(
    @CurrentUser() admin: any,
    @Param('id') id: string,
  ) {
    return this.announcementsService.deleteAnnouncement(admin.id, id);
  }
}