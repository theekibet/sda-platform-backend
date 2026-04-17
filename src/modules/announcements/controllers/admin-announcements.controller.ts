// src/modules/announcements/controllers/admin-announcements.controller.ts
import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  UseGuards, DefaultValuePipe, ParseIntPipe 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnnouncementsService } from '../announcements.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminAnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly prisma: PrismaService,
  ) {}

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
    return this.announcementsService.getActiveAnnouncements(user?.id, user?.role);
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

// ✅ TEMPORARY: Create a separate public controller for debugging
@Controller('debug/announcements')
export class AnnouncementsDebugController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async debugAnnouncements() {
    const all = await this.prisma.announcement.findMany({
      select: {
        id: true,
        title: true,
        isActive: true,
        targetRole: true,
        scheduledAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const now = new Date();
    
    const analysis = all.map(a => ({
      ...a,
      checks: {
        isActive: a.isActive,
        scheduledOk: !a.scheduledAt || a.scheduledAt <= now,
        expiresOk: !a.expiresAt || a.expiresAt >= now,
        wouldShow: a.isActive && 
                   (!a.scheduledAt || a.scheduledAt <= now) && 
                   (!a.expiresAt || a.expiresAt >= now),
      }
    }));

    return {
      totalInDatabase: all.length,
      serverTime: now,
      announcements: analysis,
    };
  }
}