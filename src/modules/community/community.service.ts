import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CommunityResponseDto } from './dto/community-response.dto';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthorData {
  id: string;
  name: string;
  avatarUrl: string | null;
  locationName: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface FormattedAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  locationName: string | null;
  city: string | null;
}

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
}

interface DonationProgress {
  percentage: number;
  currentAmount: number;
  goalAmount: number;
  remainingAmount: number;
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private formatAuthor(author: AuthorData | null): FormattedAuthor | null {
    if (!author) return null;
    let city: string | null = null;
    if (author.locationName) {
      city = author.locationName.split(',')[0].trim();
    }
    return {
      id: author.id,
      name: author.name,
      avatarUrl: author.avatarUrl,
      locationName: author.locationName,
      city: city,
    };
  }

  private calculateExpirationDate(dto: CreateCommunityPostDto): Date | null {
    const now = new Date();
    switch (dto.type) {
      case 'event':
        return dto.eventDate ? new Date(dto.eventDate) : null;
      case 'donation':
        const donationExpiry = new Date(now);
        donationExpiry.setDate(now.getDate() + 60);
        return donationExpiry;
      default:
        const expiry = new Date(now);
        expiry.setDate(now.getDate() + 30);
        return expiry;
    }
  }

  private validatePostDates(dto: CreateCommunityPostDto): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dto.type === 'event' && dto.eventDate) {
      const eventDate = new Date(dto.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < now) {
        throw new BadRequestException('Event date cannot be in the past');
      }
    }

    if (dto.type === 'donation' && dto.goalAmount && dto.goalAmount <= 0) {
      throw new BadRequestException('Goal amount must be greater than 0');
    }

    if (dto.type === 'donation' && !dto.contactPhone) {
      throw new BadRequestException('Contact phone is required for donation posts');
    }
  }

  // ── Public methods ─────────────────────────────────────────────────────────
  async createPost(userId: string, dto: CreateCommunityPostDto) {
    this.validatePostDates(dto);
    const expiresAt = this.calculateExpirationDate(dto);
  
    const postData: any = {
      authorId: userId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: 'active',
      expiresAt: expiresAt,
    };
  
    if (dto.eventDate) postData.eventDate = new Date(dto.eventDate);
    if (dto.location) postData.location = dto.location;
    if (dto.goalAmount) postData.goalAmount = dto.goalAmount;
    if (dto.currentAmount) postData.currentAmount = dto.currentAmount;
    if (dto.itemsNeeded) postData.itemsNeeded = dto.itemsNeeded;
    if (dto.contactPhone) postData.contactPhone = dto.contactPhone;
    if (dto.contactEmail) postData.contactEmail = dto.contactEmail;
    // prayerRequestId removed - prayer posts are no longer allowed in community board
  
    const post = await this.prisma.communityPost.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
  
    return {
      ...post,
      author: this.formatAuthor(post.author as AuthorData),
    };
  }

  async getLocalPosts(userId: string, radius = 10, limit = 10) {
    const validRadius = Math.min(Math.max(radius, 1), 200);
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true, locationName: true },
    });
    if (!user?.latitude || !user?.longitude) return [];

    const nearbyUsers = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM members
      WHERE
        id != ${userId}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(${user.latitude})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${user.longitude})) +
            sin(radians(${user.latitude})) *
            sin(radians(latitude))
          )
        ) < ${validRadius}
    `;

    const userIds = nearbyUsers.map(u => u.id);
    if (userIds.length === 0) return [];

    const posts = await this.prisma.communityPost.findMany({
      where: { authorId: { in: userIds }, status: 'active' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return posts.map(post => {
      let distance: number | null = null;
      if (post.author?.latitude && post.author?.longitude) {
        distance = this.calculateDistance(
          user.latitude!,
          user.longitude!,
          post.author.latitude,
          post.author.longitude,
        );
      }
      
      const supportResponses = post.responses.filter(r => r.response === 'support');
      const commentsWithText = post.responses.filter(r => r.comment && r.comment.trim());
      
      const formattedAuthor = this.formatAuthor(post.author as AuthorData);
      return {
        ...post,
        author: formattedAuthor,
        stats: {
          supportCount: supportResponses.length,
          commentCount: commentsWithText.length,
        },
        distance,
        location: formattedAuthor?.locationName || 'Unknown location',
      };
    });
  }

  async getPosts(filters: {
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
    localOnly?: boolean;
    userId?: string;
    radius?: number;
  }) {
    const {
      type,
      page = 1,
      limit = 20,
      search,
      localOnly,
      userId,
      radius = 10,
    } = filters;

    const validRadius = Math.min(Math.max(radius, 1), 200);
    const skip = (page - 1) * limit;
    const where: any = { status: 'active' };

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let currentUser: UserLocation | null = null;
    if (userId) {
      currentUser = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true, locationName: true },
      });
    }

    if (localOnly && userId && currentUser?.latitude && currentUser?.longitude) {
      const nearbyUsers = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM members
        WHERE
          id != ${userId}
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians(${currentUser.latitude})) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians(${currentUser.longitude})) +
              sin(radians(${currentUser.latitude})) *
              sin(radians(latitude))
            )
          ) < ${validRadius}
      `;

      const userIds = nearbyUsers.map(u => u.id);
      if (userIds.length > 0) {
        where.authorId = { in: userIds };
      } else {
        return {
          posts: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
              latitude: true,
              longitude: true,
            },
          },
          responses: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    let postsWithFormattedAuthors: any[];
    if (currentUser?.latitude && currentUser?.longitude) {
      postsWithFormattedAuthors = posts.map(post => {
        let distance: number | null = null;
        if (post.author?.latitude && post.author?.longitude) {
          distance = this.calculateDistance(
            currentUser!.latitude!,
            currentUser!.longitude!,
            post.author.latitude,
            post.author.longitude,
          );
        }
        return {
          ...post,
          author: this.formatAuthor(post.author as AuthorData),
          distance,
        };
      });
    } else {
      postsWithFormattedAuthors = posts.map(post => ({
        ...post,
        author: this.formatAuthor(post.author as AuthorData),
        distance: null,
      }));
    }

    const postsWithStats = postsWithFormattedAuthors.map(post => {
      const responses = post.responses || [];
      const supportResponses = responses.filter((r: any) => r.response === 'support');
      const commentsWithText = responses.filter((r: any) => r.comment && r.comment.trim());
      
      // Calculate donation progress if applicable - FIXED TYPING
      let donationProgress: DonationProgress | null = null;
      if (post.type === 'donation' && post.goalAmount && post.goalAmount > 0) {
        const percentage = ((post.currentAmount || 0) / post.goalAmount) * 100;
        donationProgress = {
          percentage: Math.min(Math.round(percentage), 100),
          currentAmount: post.currentAmount || 0,
          goalAmount: post.goalAmount,
          remainingAmount: (post.goalAmount - (post.currentAmount || 0)),
        };
      }
      
      // Calculate urgency - FIXED TYPING
      let isUrgent = false;
      let daysUntilExpiry: number | null = null;
      if (post.expiresAt) {
        const daysLeft = Math.ceil((new Date(post.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        isUrgent = daysLeft <= 2 && daysLeft >= 0;
        daysUntilExpiry = daysLeft;
      }
      
      return {
        ...post,
        stats: {
          supportCount: supportResponses.length,
          commentCount: commentsWithText.length,
          totalResponses: responses.length,
          donationProgress,
          isUrgent,
          daysUntilExpiry,
        },
        userHasSupported: responses.some((r: any) => r.userId === userId && r.response === 'support'),
        responses: responses.map((response: any) => ({
          ...response,
          user: response.user
            ? { id: response.user.id, name: response.user.name, avatarUrl: response.user.avatarUrl }
            : null,
        })),
      };
    });

    return {
      posts: postsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(postId: string, userId?: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
        responses: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    let distance: number | null = null;
    if (userId) {
      const currentUser = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      });
      if (
        currentUser?.latitude &&
        currentUser?.longitude &&
        post.author?.latitude &&
        post.author?.longitude
      ) {
        distance = this.calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          post.author.latitude,
          post.author.longitude,
        );
      }
    }

    const responses = post.responses || [];
    const supportResponses = responses.filter(r => r.response === 'support');
    const commentsWithText = responses.filter(r => r.comment && r.comment.trim());
    
    // Calculate donation progress if applicable - FIXED TYPING
    let donationProgress: DonationProgress | null = null;
    if (post.type === 'donation' && post.goalAmount && post.goalAmount > 0) {
      const percentage = ((post.currentAmount || 0) / post.goalAmount) * 100;
      donationProgress = {
        percentage: Math.min(Math.round(percentage), 100),
        currentAmount: post.currentAmount || 0,
        goalAmount: post.goalAmount,
        remainingAmount: (post.goalAmount - (post.currentAmount || 0)),
      };
    }
    
    // Calculate urgency - FIXED TYPING
    let isUrgent = false;
    let daysUntilExpiry: number | null = null;
    if (post.expiresAt) {
      const daysLeft = Math.ceil((new Date(post.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      isUrgent = daysLeft <= 2 && daysLeft >= 0;
      daysUntilExpiry = daysLeft;
    }

    const stats = {
      supportCount: supportResponses.length,
      commentCount: commentsWithText.length,
      totalResponses: responses.length,
      donationProgress,
      isUrgent,
      daysUntilExpiry,
    };

    return {
      ...post,
      author: this.formatAuthor(post.author as AuthorData),
      responses: responses.map(response => ({
        ...response,
        user: response.user
          ? { id: response.user.id, name: response.user.name, avatarUrl: response.user.avatarUrl }
          : null,
      })),
      stats,
      distance,
      userHasSupported: responses.some(r => r.userId === userId && r.response === 'support'),
    };
  }

  async updatePost(
    userId: string,
    userIsAdmin: boolean,
    postId: string,
    dto: UpdateCommunityPostDto,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && !userIsAdmin) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (dto.type === 'event' && dto.eventDate) {
      const eventDate = new Date(dto.eventDate);
      const now = new Date();
      eventDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (eventDate < now) {
        throw new BadRequestException('Event date cannot be in the past');
      }
    }

    const updateData: any = { ...dto };
    if (dto.eventDate) updateData.eventDate = new Date(dto.eventDate);
    delete updateData.fromLocation;
    delete updateData.toLocation;
    delete updateData.departureTime;
    delete updateData.seatsAvailable;

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
      },
    });
  }

  async deletePost(userId: string, userIsAdmin: boolean, postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && !userIsAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.communityPost.delete({ where: { id: postId } });
    return { success: true, message: 'Post deleted successfully' };
  }

  // ============ DONATION PROGRESS ============

  async updateDonationProgress(
    userId: string,
    isAdmin: boolean,
    postId: string,
    amount: number,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('Only the post author or an admin can update donation progress');
    }

    if (post.type !== 'donation') {
      throw new BadRequestException('Donation progress can only be updated on donation posts');
    }

    const newAmount = (post.currentAmount || 0) + amount;
    if (post.goalAmount && newAmount > post.goalAmount) {
      throw new BadRequestException(`Cannot exceed goal amount of ${post.goalAmount}`);
    }

    const updatedPost = await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        currentAmount: newAmount,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
      },
    });

    return {
      ...updatedPost,
      author: this.formatAuthor(updatedPost.author as AuthorData),
    };
  }

  // ============ RESPONSES ============

  async addResponse(userId: string, postId: string, dto: CommunityResponseDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingResponse = await this.prisma.communityResponse.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    const includeUser = {
      user: { select: { id: true, name: true, avatarUrl: true } },
    };

    if (existingResponse) {
      return this.prisma.communityResponse.update({
        where: { postId_userId: { postId, userId } },
        data: { response: dto.response, comment: dto.comment },
        include: includeUser,
      });
    }

    return this.prisma.communityResponse.create({
      data: { postId, userId, response: dto.response, comment: dto.comment },
      include: includeUser,
    });
  }

  async removeResponse(userId: string, postId: string) {
    const response = await this.prisma.communityResponse.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (!response) throw new NotFoundException('Response not found');
    await this.prisma.communityResponse.delete({
      where: { postId_userId: { postId, userId } },
    });
    return { success: true, message: 'Response removed' };
  }

  async getUserPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
          responses: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where: { authorId: userId } }),
    ]);

    return {
      posts: posts.map(post => {
        const supportResponses = post.responses.filter(r => r.response === 'support');
        const commentsWithText = post.responses.filter(r => r.comment && r.comment.trim());
        
        return {
          ...post,
          author: this.formatAuthor(post.author as AuthorData),
          stats: {
            supportCount: supportResponses.length,
            commentCount: commentsWithText.length,
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicPosts(filters: {
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { type, page = 1, limit = 20, search } = filters;
    const skip = (page - 1) * limit;
    const where: any = { status: 'active' };

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
          responses: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    const sanitizedPosts = posts.map(post => {
      const { contactPhone, contactEmail, ...safePost } = post;
      const supportResponses = post.responses.filter(r => r.response === 'support');
      const commentsWithText = post.responses.filter(r => r.comment && r.comment.trim());
      
      return {
        ...safePost,
        author: this.formatAuthor(post.author as AuthorData),
        stats: {
          supportCount: supportResponses.length,
          commentCount: commentsWithText.length,
        },
      };
    });

    return {
      posts: sanitizedPosts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async archiveExpiredPosts() {
    const now = new Date();
    const result = await this.prisma.communityPost.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: now },
      },
      data: {
        status: 'expired',
      },
    });
    return { success: true, archivedCount: result.count };
  }

  // ============ TRENDING POSTS ============

  async getTrendingPosts(timeframe: string = 'week', limit: number = 10) {
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'day': startDate.setDate(now.getDate() - 1); break;
      case 'week': startDate.setDate(now.getDate() - 7); break;
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
      default: startDate.setDate(now.getDate() - 7);
    }

    const posts = await this.prisma.communityPost.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'active',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
        responses: true,
      },
      take: limit * 2,
    });

    const postsWithScore = posts.map(post => {
      const supportResponses = post.responses.filter(r => r.response === 'support');
      const responseScore = supportResponses.length * 2;
      const reportPenalty = (post.reportCount || 0) * 5;
      const ageHours = Math.ceil((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
      const ageScore = Math.max(0, 168 - ageHours);
      const trendingScore = Math.max(0, responseScore + ageScore - reportPenalty);

      return {
        ...post,
        trendingScore,
        stats: {
          supportCount: supportResponses.length,
          totalResponses: post.responses.length,
        },
      };
    });

    const trendingPosts = postsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    return trendingPosts;
  }

  // ============ BOOKMARK METHODS ============

  async getBookmarkStatus(userId: string, postId: string): Promise<boolean> {
    const bookmark = await this.prisma.communityBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!bookmark;
  }

  async addBookmark(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.communityBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) return existing;

    return this.prisma.communityBookmark.create({
      data: { userId, postId },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                locationName: true,
              },
            },
          },
        },
      },
    });
  }

  async removeBookmark(userId: string, postId: string) {
    const bookmark = await this.prisma.communityBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!bookmark) throw new NotFoundException('Bookmark not found');

    await this.prisma.communityBookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.communityBookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                locationName: true,
              },
            },
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return bookmarks.map(bookmark => {
      const supportResponses = bookmark.post.responses.filter(r => r.response === 'support');
      const commentsWithText = bookmark.post.responses.filter(r => r.comment && r.comment.trim());
      
      return {
        ...bookmark,
        post: {
          ...bookmark.post,
          stats: {
            supportCount: supportResponses.length,
            commentCount: commentsWithText.length,
          },
        },
      };
    });
  }
}