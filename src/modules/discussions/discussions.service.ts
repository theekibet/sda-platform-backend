import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class DiscussionsService {
  constructor(
    private prisma: PrismaService,
    private tagsService: TagsService,
  ) {}

  // ============ HELPERS ============

  /**
   * Computes a Reddit-style hot score for in-memory sorting.
   * score = upvotes / (hoursOld + 2)^1.8
   * Higher upvotes win, but recency matters — older posts decay.
   */
  private computeHotScore(upvotes: number, createdAt: Date): number {
    const hoursOld =
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return upvotes / Math.pow(hoursOld + 2, 1.8);
  }

  /**
   * Shared include block for discussion list queries.
   */
  private get discussionListInclude() {
    return {
      author: {
        select: { id: true, name: true, avatarUrl: true },
      },
      tags: true,
      group: {
        select: { id: true, name: true, isPrivate: true },
      },
      _count: {
        select: { comments: true, votes: true },
      },
    };
  }

  // ============ CRUD ============

  async createDiscussion(
    userId: string,
    dto: {
      title: string;
      content: string;
      groupId?: string;
      tagNames?: string[];
      isAnonymous?: boolean;
    },
  ) {
    // If group specified, verify it exists and check membership rules
    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      if (group.isPrivate) {
        const membership = await this.prisma.groupMember.findUnique({
          where: {
            groupId_memberId: { groupId: dto.groupId, memberId: userId },
          },
        });

        if (!membership || membership.status !== 'approved') {
          throw new ForbiddenException(
            'You must be a member of this private group to post',
          );
        }
      }
    }

    // Resolve tags
    let tags: { id: string }[] = [];
    if (dto.tagNames && dto.tagNames.length > 0) {
      tags = await this.tagsService.findOrCreateTags(dto.tagNames);
    }

    // Build searchText so the search service can query it
    const searchText = `${dto.title} ${dto.content}`.toLowerCase();

    const discussion = await this.prisma.discussion.create({
      data: {
        title: dto.title,
        content: dto.content,
        searchText,
        authorId: userId,
        groupId: dto.groupId ?? null,
        isAnonymous: dto.isAnonymous ?? false,
        tags: { connect: tags.map((t) => ({ id: t.id })) },
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: true,
        _count: { select: { comments: true, votes: true } },
      },
    });

    // Keep Group.discussionCount in sync
    if (dto.groupId) {
      await this.prisma.group
        .update({
          where: { id: dto.groupId },
          data: { discussionCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    // Increment tag usage counts (fire-and-forget)
    if (tags.length > 0) {
      this.tagsService.incrementUsageCount(tags.map((t) => t.id)).catch(() => {});
    }

    return discussion;
  }

  async getDiscussions(filters: {
    groupId?: string;
    tagId?: string;
    authorId?: string;
    page?: number;
    limit?: number;
    sort?: 'new' | 'popular' | 'trending' | 'hot';
  }) {
    const { groupId, tagId, authorId, page = 1, limit = 20, sort = 'new' } = filters;
    const skip = (page - 1) * limit;

    const where: any = { status: 'active' };
    if (groupId) where.groupId = groupId;
    if (authorId) where.authorId = authorId;
    if (tagId) where.tags = { some: { id: tagId } };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { upvotes: 'desc' };
    } else if (sort === 'trending') {
      orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'hot') {
      // Fetch a larger pool then re-rank in memory
      const pool = await this.prisma.discussion.findMany({
        where,
        include: this.discussionListInclude,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit * 5, 200), // cap pool size
      });

      const total = await this.prisma.discussion.count({ where });

      const ranked = pool
        .map((d) => ({
          ...d,
          hotScore: this.computeHotScore(d.upvotes, d.createdAt),
        }))
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(skip, skip + limit)
        .map(({ hotScore, ...d }) => d);

      return {
        discussions: ranked,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        include: this.discussionListInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return {
      discussions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiscussionById(id: string, userId?: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: true,
        group: { select: { id: true, name: true, isPrivate: true } },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: { select: { replies: true } },
          },
          orderBy: { upvotes: 'desc' },
        },
        votes: true,
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Private group access check
    if (discussion.group?.isPrivate && discussion.groupId) {
      if (!userId) {
        throw new ForbiddenException('This discussion is in a private group');
      }

      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: { groupId: discussion.groupId, memberId: userId },
        },
      });

      if (!membership || membership.status !== 'approved') {
        throw new ForbiddenException('You are not a member of this private group');
      }
    }

    // Fire-and-forget view count
    this.prisma.discussion
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    // Resolve caller's vote status
    let userVote: number | null = null;
    if (userId) {
      const vote = await this.prisma.discussionVote.findUnique({
        where: { discussionId_userId: { discussionId: id, userId } },
      });
      userVote = vote?.value ?? null;
    }

    // Check if discussion is bookmarked by user
    let isBookmarked = false;
    if (userId) {
      const bookmark = await (this.prisma as any).discussionBookmark.findUnique({
        where: { userId_discussionId: { userId, discussionId: id } },
      });
      isBookmarked = !!bookmark;
    }

    // Hide author info for anonymous posts (except to the author themselves)
    const isOwnPost = userId && discussion.authorId === userId;
    const safeDiscussion =
      discussion.isAnonymous && !isOwnPost
        ? {
            ...discussion,
            author: { id: '', name: 'Anonymous', avatarUrl: null },
          }
        : discussion;

    return { ...safeDiscussion, userVote, isBookmarked };
  }

  async updateDiscussion(
    userId: string,
    discussionId: string,
    dto: {
      title?: string;
      content?: string;
      tagNames?: string[];
    },
  ) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own discussions');
    }

    let tagConnect: { id: string }[] | undefined;
    if (dto.tagNames) {
      const tags = await this.tagsService.findOrCreateTags(dto.tagNames);
      tagConnect = tags.map((t) => ({ id: t.id }));
    }

    // Rebuild searchText whenever title or content changes
    const searchText =
      dto.title || dto.content
        ? `${dto.title ?? discussion.title} ${dto.content ?? discussion.content}`.toLowerCase()
        : undefined;

    return this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        title: dto.title,
        content: dto.content,
        searchText,
        tags: tagConnect ? { set: tagConnect } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: true,
      },
    });
  }

  async deleteDiscussion(userId: string, discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { group: true },
    });

    if (!discussion) throw new NotFoundException('Discussion not found');

    const isAuthor = discussion.authorId === userId;

    if (!isAuthor) {
      // Allow group admin / moderator to delete
      if (!discussion.groupId) {
        throw new ForbiddenException('You can only delete your own discussions');
      }

      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: { groupId: discussion.groupId, memberId: userId },
        },
      });

      const canModerate =
        membership?.role === 'admin' || membership?.role === 'moderator';

      if (!canModerate) {
        throw new ForbiddenException('You can only delete your own discussions');
      }
    }

    await this.prisma.discussion.delete({ where: { id: discussionId } });

    // Keep Group.discussionCount in sync
    if (discussion.groupId) {
      await this.prisma.group
        .update({
          where: { id: discussion.groupId },
          data: { discussionCount: { decrement: 1 } },
        })
        .catch(() => {});
    }

    return { success: true };
  }

  // ============ VOTING ============

  async voteDiscussion(userId: string, discussionId: string, value: number) {
    if (value !== 0 && value !== 1) {
      throw new BadRequestException('Vote value must be 0 (remove) or 1 (upvote)');
    }

    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) throw new NotFoundException('Discussion not found');

    const existingVote = await this.prisma.discussionVote.findUnique({
      where: { discussionId_userId: { discussionId, userId } },
    });

    if (value === 0) {
      // Remove vote — only decrement if a vote actually existed
      if (!existingVote) return { voted: false };

      await this.prisma.discussionVote.delete({
        where: { discussionId_userId: { discussionId, userId } },
      });

      await this.prisma.discussion.update({
        where: { id: discussionId },
        data: { upvotes: { decrement: 1 } },
      });

      return { voted: false };
    }

    // Upvote — only increment if this is a NEW vote
    if (existingVote) {
      return { voted: true };
    }

    await this.prisma.discussionVote.create({
      data: { discussionId, userId, value },
    });

    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { upvotes: { increment: 1 } },
    });

    return { voted: true };
  }

  // ============ COMMENT VOTING ============

  async upvoteComment(userId: string, commentId: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if vote already exists
    const existingVote = await this.prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Remove the vote (toggle off)
      await this.prisma.commentVote.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
      await this.prisma.discussionComment.update({
        where: { id: commentId },
        data: {
          upvotes: {
            decrement: 1,
          },
        },
      });
      return { upvoted: false };
    } else {
      // Add new vote
      await this.prisma.commentVote.create({
        data: {
          commentId,
          userId,
        },
      });
      await this.prisma.discussionComment.update({
        where: { id: commentId },
        data: {
          upvotes: {
            increment: 1,
          },
        },
      });
      return { upvoted: true };
    }
  }

  // ============ SEARCH ============

  async searchDiscussions(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return { discussions: [], total: 0, page, totalPages: 0 };
    }

    const where: any = {
      status: 'active',
      OR: [
        { groupId: null },
        { group: { isPrivate: false } },
      ],
      AND: [
        {
          OR: [
            { searchText: { contains: searchQuery } },
            { title: { contains: searchQuery } },
            { tags: { some: { name: { contains: searchQuery } } } },
          ],
        },
      ],
    };

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        include: this.discussionListInclude,
        orderBy: { upvotes: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return { discussions, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ============ HOME FEED & DISCOVERY ============

  async getHomeFeed(userId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    let preferredTagIds: string[] = [];
    let userGroupIds: string[] = [];
    let userLocation: string | null = null;

    if (userId) {
      const [userDiscussions, memberships, user] = await Promise.all([
        this.prisma.discussion.findMany({
          where: { authorId: userId },
          select: { tags: { select: { id: true } } },
          take: 10,
        }),
        this.prisma.groupMember.findMany({
          where: { memberId: userId, status: 'approved' },
          select: { groupId: true },
        }),
        this.prisma.member.findUnique({
          where: { id: userId },
          select: { locationName: true },
        }),
      ]);

      preferredTagIds = [
        ...new Set(userDiscussions.flatMap((d) => d.tags.map((t) => t.id))),
      ];
      userGroupIds = memberships.map((m) => m.groupId);

      if (user?.locationName) {
        const parts = user.locationName.split(',');
        userLocation = parts[parts.length - 1].trim();
      }
    }

    const where: any = { status: 'active' };

    if (!userId) {
      where.OR = [{ groupId: null }, { group: { isPrivate: false } }];
    } else {
      where.OR = [
        { groupId: null },
        { group: { isPrivate: false } },
        { groupId: { in: userGroupIds } },
      ];
    }

    const poolSize = Math.min((page + 2) * limit, 200);

    const [pool, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        include: this.discussionListInclude,
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        take: poolSize,
      }),
      this.prisma.discussion.count({ where }),
    ]);

    const scored = pool
      .map((d) => {
        let score = this.computeHotScore(d.upvotes, d.createdAt);
        score += d._count.comments * 0.5;

        if (userId) {
          const matchCount = d.tags.filter((t) =>
            preferredTagIds.includes(t.id),
          ).length;
          score += matchCount * 3;

          if (d.groupId && userGroupIds.includes(d.groupId)) {
            score += 5;
          }
        }

        return { ...d, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(skip, skip + limit)
      .map(({ _score, ...d }) => d);

    return {
      discussions: scored,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      personalized: !!userId,
      userContext: userId
        ? {
            preferredTagsCount: preferredTagIds.length,
            groupsCount: userGroupIds.length,
            location: userLocation,
          }
        : null,
    };
  }

  async getTrendingNow(limit: number = 10) {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const discussions = await this.prisma.discussion.findMany({
      where: {
        status: 'active',
        createdAt: { gte: cutoff },
        OR: [{ groupId: null }, { group: { isPrivate: false } }],
      },
      include: this.discussionListInclude,
      orderBy: [{ upvotes: 'desc' }, { viewCount: 'desc' }],
      take: limit * 3,
    });

    return discussions
      .map((d) => ({
        ...d,
        hotScore: this.computeHotScore(d.upvotes, d.createdAt),
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, limit)
      .map(({ hotScore, ...d }) => d);
  }

  async getRecommendedForUser(userId: string, limit: number = 5) {
    const [userDiscussions, memberships] = await Promise.all([
      this.prisma.discussion.findMany({
        where: { authorId: userId },
        include: { tags: true },
        take: 10,
      }),
      this.prisma.groupMember.findMany({
        where: { memberId: userId, status: 'approved' },
        select: { groupId: true },
      }),
    ]);

    const userTagNames = [
      ...new Set(userDiscussions.flatMap((d) => d.tags.map((t) => t.name))),
    ];

    if (userTagNames.length === 0) {
      return this.getTrendingNow(limit);
    }

    const userGroupIds = memberships.map((m) => m.groupId);

    return this.prisma.discussion.findMany({
      where: {
        status: 'active',
        authorId: { not: userId },
        OR: [
          { groupId: null },
          { group: { isPrivate: false } },
          { groupId: { in: userGroupIds } },
        ],
        tags: { some: { name: { in: userTagNames } } },
      },
      include: this.discussionListInclude,
      orderBy: { upvotes: 'desc' },
      take: limit,
    });
  }

  // ============ BOOKMARKS ============

  async toggleBookmark(userId: string, discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) throw new NotFoundException('Discussion not found');

    const existing = await (this.prisma as any).discussionBookmark.findUnique({
      where: { userId_discussionId: { userId, discussionId } },
    });

    if (existing) {
      await (this.prisma as any).discussionBookmark.delete({
        where: { userId_discussionId: { userId, discussionId } },
      });
      return { bookmarked: false };
    }

    await (this.prisma as any).discussionBookmark.create({
      data: { userId, discussionId },
    });

    return { bookmarked: true };
  }

  async getUserBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      (this.prisma as any).discussionBookmark.findMany({
        where: { userId },
        include: {
          discussion: {
            include: this.discussionListInclude,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).discussionBookmark.count({ where: { userId } }),
    ]);

    return {
      discussions: bookmarks.map((b: any) => ({
        ...b.discussion,
        isBookmarked: true,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}