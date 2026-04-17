import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(adminId: string, dto: CreateAnnouncementDto) {
    const { title, content, type, targetRole, targetUsers, scheduledAt, expiresAt } = dto;

    const announcement = await this.prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        targetRole: targetRole || 'all',
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: adminId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Announcement created successfully',
      announcement,
    };
  }

  async getAllAnnouncements(page = 1, limit = 20, active?: string) {
    const skip = (page - 1) * limit;

    // ✅ SIMPLIFIED: Start with basic where
    let where: any = {};
    
    if (active === 'true') {
      const now = new Date();
      where = {
        isActive: true,
        // Simple approach: use NOT for the opposite conditions
        scheduledAt: {
          lte: now,
        },
        expiresAt: {
          gte: now,
        },
      };
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { views: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      announcements: announcements.map(a => ({
        ...a,
        viewCount: a._count.views,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ✅ SIMPLIFIED: Get active announcements with proper null handling
  async getActiveAnnouncements(userId?: string, userRole?: string) {
    const now = new Date();

    // First, get ALL active announcements (for debugging)
    const allActive = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[DEBUG] Total active announcements:', allActive.length);

    // Now filter in JavaScript instead of Prisma query
    const validAnnouncements = allActive.filter(a => {
      const scheduledOk = !a.scheduledAt || a.scheduledAt <= now;
      const expiresOk = !a.expiresAt || a.expiresAt >= now;
      
      // Role check
      const roleOk = !a.targetRole || 
                     a.targetRole === 'all' || 
                     a.targetRole === userRole ||
                     a.targetRole === null;

      return scheduledOk && expiresOk && roleOk;
    });

    console.log('[DEBUG] Valid announcements after filter:', validAnnouncements.length);

    // Check viewed status if userId provided
    if (userId && validAnnouncements.length > 0) {
      const viewed = await this.prisma.announcementView.findMany({
        where: {
          userId,
          announcementId: { in: validAnnouncements.map(a => a.id) },
        },
      });

      const viewedIds = new Set(viewed.map(v => v.announcementId));

      // Filter by specific target users
      const filtered = validAnnouncements.filter(a => {
        if (a.targetUsers) {
          try {
            const specificUsers = JSON.parse(a.targetUsers);
            if (Array.isArray(specificUsers) && specificUsers.length > 0) {
              return specificUsers.includes(userId);
            }
          } catch (e) {
            // Include if parsing fails
          }
        }
        return true;
      });

      return filtered.map(a => ({
        ...a,
        viewed: viewedIds.has(a.id),
      }));
    }

    return validAnnouncements;
  }

  async getAnnouncementById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        views: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: { viewedAt: 'desc' },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return {
      ...announcement,
      viewCount: announcement.views.length,
    };
  }

  async updateAnnouncement(adminId: string, id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetRole: dto.targetRole,
        targetUsers: dto.targetUsers ? JSON.stringify(dto.targetUsers) : announcement.targetUsers,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : announcement.scheduledAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : announcement.expiresAt,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated,
    };
  }

  async deleteAnnouncement(adminId: string, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Announcement deleted successfully',
    };
  }

  async markAsViewed(userId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const existing = await this.prisma.announcementView.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
    });

    if (!existing) {
      await this.prisma.announcementView.create({
        data: {
          announcementId,
          userId,
        },
      });

      await this.prisma.announcement.update({
        where: { id: announcementId },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    return { success: true, message: 'Marked as viewed' };
  }
}