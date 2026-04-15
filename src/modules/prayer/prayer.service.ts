import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  // FIXED: Always store authorId (even for anonymous) so user can edit/delete later
  async createPrayerRequest(userId: string | null, dto: CreatePrayerRequestDto, locationName?: string) {
    const { content, isAnonymous } = dto;
    return this.prisma.prayerRequest.create({
      data: {
        content,
        authorId: userId, // ✅ Always store, even if anonymous
        isAnonymous: isAnonymous || false,
        locationName: locationName || null,
      },
      include: {
        author: !isAnonymous ? {
          select: { id: true, name: true, avatarUrl: true },
        } : false,
      },
    });
  }

  // FIXED: Use prayedCount field directly (not _count)
  async getPrayerRequests(currentUserId: string | null, locationName?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = locationName ? { locationName } : {};

    const [requests, total] = await Promise.all([
      this.prisma.prayerRequest.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prayerRequest.count({ where }),
    ]);

    let userPrayerMap = new Map<string, boolean>();
    if (currentUserId) {
      const interactions = await this.prisma.prayerInteraction.findMany({
        where: {
          memberId: currentUserId,
          requestId: { in: requests.map(r => r.id) },
        },
        select: { requestId: true },
      });
      userPrayerMap = new Map(interactions.map(i => [i.requestId, true]));
    }

    return {
      requests: requests.map(r => ({
        ...r,
        // Hide author if anonymous
        author: r.isAnonymous ? null : r.author,
        prayedCount: r.prayedCount, // ✅ Use dedicated field
        hasPrayed: userPrayerMap.get(r.id) || false,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrayerRequestsByAuthor(authorId: string) {
    return this.prisma.prayerRequest.findMany({
      where: { authorId, isAnonymous: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true, prayedCount: true },
    });
  }

  // FIXED: Use prayedCount field
  async getPrayerRequestById(id: string, currentUserId?: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        prayers: {
          include: { member: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!request) throw new NotFoundException('Prayer request not found');

    let hasPrayed = false;
    if (currentUserId) {
      const existing = await this.prisma.prayerInteraction.findUnique({
        where: { requestId_memberId: { requestId: id, memberId: currentUserId } },
      });
      hasPrayed = !!existing;
    }

    return {
      ...request,
      author: request.isAnonymous ? null : request.author,
      prayedCount: request.prayedCount, // ✅ Use field
      hasPrayed,
    };
  }

  async updatePrayerRequest(userId: string, prayerId: string, dto: UpdatePrayerRequestDto) {
    const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: prayerId } });
    if (!prayer) throw new NotFoundException('Prayer request not found');
    // ✅ Now works for anonymous prayers because authorId is stored
    if (prayer.authorId !== userId) throw new ForbiddenException('You can only update your own prayer requests');

    const { content } = dto;
    return this.prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { content },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async deletePrayerRequest(userId: string, prayerId: string) {
    const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: prayerId } });
    if (!prayer) throw new NotFoundException('Prayer request not found');
    if (prayer.authorId !== userId) throw new ForbiddenException('You can only delete your own prayer requests');
    await this.prisma.prayerRequest.delete({ where: { id: prayerId } });
  }

  // ✅ FIXED: Transaction with increased timeout, notifications moved OUTSIDE
  async prayForRequest(userId: string, requestId: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
      include: { author: true },
    });
    if (!request) throw new NotFoundException('Prayer request not found');

    // Transaction with 10 second timeout - only database operations
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.prayerInteraction.findUnique({
        where: { requestId_memberId: { requestId, memberId: userId } },
      });
      if (existing) {
        return { alreadyPrayed: true };
      }

      await tx.prayerInteraction.create({ data: { requestId, memberId: userId } });
      await tx.prayerRequest.update({
        where: { id: requestId },
        data: { prayedCount: { increment: 1 } },
      });

      return { alreadyPrayed: false };
    }, { timeout: 10000 }); // 10 seconds timeout

    if (result.alreadyPrayed) {
      return { message: 'You already prayed for this request', alreadyPrayed: true };
    }

    // ✅ Send notification AFTER transaction (fire and forget)
    if (request.authorId && !request.isAnonymous) {
      this.notificationService.createNotification({
        userId: request.authorId,
        type: 'prayer_response',
        title: 'Someone prayed for your request',
        message: `Your prayer request "${request.content.substring(0, 50)}..." received a prayer.`,
        data: { prayerRequestId: requestId },
      }).catch(err => console.error('Failed to send prayer notification:', err));
    }

    return { message: 'Prayer recorded', alreadyPrayed: false };
  }

  // FIXED: Use prayedCount field for ordering
  async getTrendingPrayers(currentUserId: string | null, limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const requests = await this.prisma.prayerRequest.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { prayedCount: 'desc' }, // ✅ Order by dedicated field
      take: limit,
    });

    let userPrayerMap = new Map<string, boolean>();
    if (currentUserId) {
      const interactions = await this.prisma.prayerInteraction.findMany({
        where: {
          memberId: currentUserId,
          requestId: { in: requests.map(r => r.id) },
        },
        select: { requestId: true },
      });
      userPrayerMap = new Map(interactions.map(i => [i.requestId, true]));
    }

    return requests.map(r => ({
      ...r,
      author: r.isAnonymous ? null : r.author,
      prayedCount: r.prayedCount, // ✅ Use field
      hasPrayed: userPrayerMap.get(r.id) || false,
    }));
  }

  // ============ TESTIMONIES ============

  async createTestimony(userId: string, dto: CreateTestimonyDto) {
    const { title, content, prayerRequestId } = dto;
    const data: any = { title, content, authorId: userId };
    if (prayerRequestId && prayerRequestId.trim() !== '') {
      const prayerRequest = await this.prisma.prayerRequest.findUnique({ where: { id: prayerRequestId } });
      if (!prayerRequest) throw new NotFoundException('Prayer request not found');
      data.prayerRequestId = prayerRequestId;
    }
    return this.prisma.testimony.create({
      data,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        prayerRequest: { select: { id: true, content: true } },
      },
    });
  }

  // FIXED: Use encouragedCount field directly
  async getTestimonies(currentUserId: string | null, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [testimonies, total] = await Promise.all([
      this.prisma.testimony.findMany({
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          prayerRequest: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.testimony.count(),
    ]);

    let userEncouragementMap = new Map<string, boolean>();
    if (currentUserId) {
      const encouragements = await this.prisma.encouragement.findMany({
        where: {
          memberId: currentUserId,
          testimonyId: { in: testimonies.map(t => t.id) },
        },
        select: { testimonyId: true },
      });
      userEncouragementMap = new Map(encouragements.map(e => [e.testimonyId, true]));
    }

    return {
      testimonies: testimonies.map(t => ({
        ...t,
        encouragedCount: t.encouragedCount, // ✅ Use dedicated field
        hasEncouraged: userEncouragementMap.get(t.id) || false,
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
      select: { id: true, title: true, content: true, createdAt: true, encouragedCount: true },
    });
  }

  async updateTestimony(userId: string, testimonyId: string, dto: UpdateTestimonyDto) {
    const testimony = await this.prisma.testimony.findUnique({ where: { id: testimonyId } });
    if (!testimony) throw new NotFoundException('Testimony not found');
    if (testimony.authorId !== userId) throw new ForbiddenException('You can only update your own testimonies');

    const { title, content, prayerRequestId } = dto;
    const updateData: any = { title, content };
    if (prayerRequestId) {
      const prayerRequest = await this.prisma.prayerRequest.findUnique({ where: { id: prayerRequestId } });
      if (!prayerRequest) throw new NotFoundException('Prayer request not found');
      updateData.prayerRequestId = prayerRequestId;
    }
    return this.prisma.testimony.update({
      where: { id: testimonyId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        prayerRequest: { select: { id: true, content: true } },
      },
    });
  }

  async deleteTestimony(userId: string, testimonyId: string) {
    const testimony = await this.prisma.testimony.findUnique({ where: { id: testimonyId } });
    if (!testimony) throw new NotFoundException('Testimony not found');
    if (testimony.authorId !== userId) throw new ForbiddenException('You can only delete your own testimonies');
    await this.prisma.testimony.delete({ where: { id: testimonyId } });
  }

  // ✅ FIXED: Transaction with increased timeout, notifications moved OUTSIDE
  async encourageTestimony(userId: string, testimonyId: string) {
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
      include: { author: true },
    });
    if (!testimony) throw new NotFoundException('Testimony not found');

    // Transaction with 10 second timeout - only database operations
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.encouragement.findUnique({
        where: { testimonyId_memberId: { testimonyId, memberId: userId } },
      });
      if (existing) {
        return { alreadyEncouraged: true };
      }

      await tx.encouragement.create({ data: { testimonyId, memberId: userId } });
      await tx.testimony.update({
        where: { id: testimonyId },
        data: { encouragedCount: { increment: 1 } },
      });

      return { alreadyEncouraged: false };
    }, { timeout: 10000 }); // 10 seconds timeout

    if (result.alreadyEncouraged) {
      return { message: 'You already encouraged this testimony', alreadyEncouraged: true };
    }

    // ✅ Send notification AFTER transaction (fire and forget)
    if (testimony.authorId) {
      this.notificationService.createNotification({
        userId: testimony.authorId,
        type: 'testimony_encouragement',
        title: 'Someone encouraged your testimony',
        message: `Your testimony "${testimony.title}" received encouragement.`,
        data: { testimonyId },
      }).catch(err => console.error('Failed to send encouragement notification:', err));
    }

    return { message: 'Encouragement recorded', alreadyEncouraged: false };
  }
}