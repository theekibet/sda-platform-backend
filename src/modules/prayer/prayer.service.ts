import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from './dto/update-prayer-request.dto';
import { CreateTestimonyDto } from './dto/create-testimony.dto';
import { UpdateTestimonyDto } from './dto/update-testimony.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class PrayerService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // ============ PRAYER REQUESTS ============

  async createPrayerRequest(userId: string | null, dto: CreatePrayerRequestDto, locationName?: string) {
    const { content, isAnonymous } = dto;

    return this.prisma.prayerRequest.create({
      data: {
        content,
        authorId: isAnonymous ? null : userId,
        isAnonymous: isAnonymous || false,
        locationName: locationName || null,
      },
      include: {
        author: !isAnonymous ? {
          select: {
            id: true,
            name: true,
          },
        } : false,
      },
    });
  }

  async getPrayerRequests(locationName?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = locationName ? { locationName } : {};

    const [requests, total] = await Promise.all([
      this.prisma.prayerRequest.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true },
          },
          _count: { select: { prayers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prayerRequest.count({ where }),
    ]);

    return {
      requests: requests.map(r => ({
        ...r,
        prayedCount: r._count?.prayers || 0,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrayerRequestsByAuthor(authorId: string) {
    const requests = await this.prisma.prayerRequest.findMany({
      where: { authorId, isAnonymous: false }, // exclude anonymous
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        prayedCount: true,
      },
    });
    return requests;
  }

  async getPrayerRequestById(id: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true },
        },
        prayers: {
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { prayers: true } },
      },
    });

    if (!request) throw new NotFoundException('Prayer request not found');

    return {
      ...request,
      prayedCount: request._count?.prayers || 0,
    };
  }

  async updatePrayerRequest(userId: string, prayerId: string, dto: UpdatePrayerRequestDto) {
    const prayer = await this.prisma.prayerRequest.findUnique({
      where: { id: prayerId },
    });
    if (!prayer) throw new NotFoundException('Prayer request not found');
    if (prayer.authorId !== userId) {
      throw new ForbiddenException('You can only update your own prayer requests');
    }

    // Only allow updating content (locationName is not in DTO)
    const { content } = dto;
    return this.prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deletePrayerRequest(userId: string, prayerId: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({
      where: { id: prayerId },
    });
    if (!prayer) throw new NotFoundException('Prayer request not found');
    if (prayer.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own prayer requests');
    }

    await this.prisma.prayerRequest.delete({ where: { id: prayerId } });
  }

  async prayForRequest(userId: string, requestId: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
      include: { author: true },
    });
    if (!request) throw new NotFoundException('Prayer request not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.prayerInteraction.findUnique({
        where: { requestId_memberId: { requestId, memberId: userId } },
      });
      if (existing) {
        return { message: 'You already prayed for this request', alreadyPrayed: true };
      }

      await tx.prayerInteraction.create({
        data: { requestId, memberId: userId },
      });
      await tx.prayerRequest.update({
        where: { id: requestId },
        data: { prayedCount: { increment: 1 } },
      });

      // Create notification for the author (if not anonymous)
      if (request.authorId && !request.isAnonymous) {
        await this.notificationService.createNotification({
          userId: request.authorId,
          type: 'prayer_response',
          title: 'Someone prayed for your request',
          message: `Your prayer request "${request.content.substring(0, 50)}..." received a prayer.`,
          data: { prayerRequestId: requestId },
        });
      }

      return { message: 'Prayer recorded', alreadyPrayed: false };
    });

    return result;
  }

  async getTrendingPrayers(limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const requests = await this.prisma.prayerRequest.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { prayers: true } },
      },
      orderBy: { prayers: { _count: 'desc' } },
      take: limit,
    });

    return requests.map(r => ({
      ...r,
      prayedCount: r._count?.prayers || 0,
    }));
  }

  // ============ TESTIMONIES ============

  async createTestimony(userId: string, dto: CreateTestimonyDto) {
    const { title, content, prayerRequestId } = dto;

    const data: any = { title, content, authorId: userId };

    if (prayerRequestId && prayerRequestId.trim() !== '') {
      const prayerRequest = await this.prisma.prayerRequest.findUnique({
        where: { id: prayerRequestId },
      });
      if (!prayerRequest) throw new NotFoundException('Prayer request not found');
      data.prayerRequestId = prayerRequestId;
    }

    return this.prisma.testimony.create({
      data,
      include: {
        author: { select: { id: true, name: true } },
        prayerRequest: { select: { id: true, content: true } },
      },
    });
  }

  async getTestimonies(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [testimonies, total] = await Promise.all([
      this.prisma.testimony.findMany({
        include: {
          author: { select: { id: true, name: true } },
          prayerRequest: { select: { id: true, content: true } },
          _count: { select: { encouragements: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.testimony.count(),
    ]);

    return {
      testimonies: testimonies.map(t => ({
        ...t,
        encouragedCount: t._count?.encouragements || 0,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTestimoniesByAuthor(authorId: string) {
    return this.prisma.testimony.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        encouragedCount: true,
      },
    });
  }

  async updateTestimony(userId: string, testimonyId: string, dto: UpdateTestimonyDto) {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
    });
    if (!testimony) throw new NotFoundException('Testimony not found');
    if (testimony.authorId !== userId) {
      throw new ForbiddenException('You can only update your own testimonies');
    }

    const { title, content, prayerRequestId } = dto;
    const updateData: any = { title, content };
    if (prayerRequestId) {
      const prayerRequest = await this.prisma.prayerRequest.findUnique({
        where: { id: prayerRequestId },
      });
      if (!prayerRequest) throw new NotFoundException('Prayer request not found');
      updateData.prayerRequestId = prayerRequestId;
    }

    return this.prisma.testimony.update({
      where: { id: testimonyId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
        prayerRequest: { select: { id: true, content: true } },
      },
    });
  }

  async deleteTestimony(userId: string, testimonyId: string) {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
    });
    if (!testimony) throw new NotFoundException('Testimony not found');
    if (testimony.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own testimonies');
    }

    await this.prisma.testimony.delete({ where: { id: testimonyId } });
  }

  async encourageTestimony(userId: string, testimonyId: string) {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
      include: { author: true },
    });
    if (!testimony) throw new NotFoundException('Testimony not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.encouragement.findUnique({
        where: { testimonyId_memberId: { testimonyId, memberId: userId } },
      });
      if (existing) {
        return { message: 'You already encouraged this testimony', alreadyEncouraged: true };
      }

      await tx.encouragement.create({
        data: { testimonyId, memberId: userId },
      });
      await tx.testimony.update({
        where: { id: testimonyId },
        data: { encouragedCount: { increment: 1 } },
      });

      // Create notification for the author
      if (testimony.authorId) {
        await this.notificationService.createNotification({
          userId: testimony.authorId,
          type: 'testimony_encouragement',
          title: 'Someone encouraged your testimony',
          message: `Your testimony "${testimony.title}" received encouragement.`,
          data: { testimonyId },
        });
      }

      return { message: 'Encouragement recorded', alreadyEncouraged: false };
    });

    return result;
  }
}