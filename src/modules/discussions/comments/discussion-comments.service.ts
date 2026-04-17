import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class DiscussionCommentsService {
  constructor(private prisma: PrismaService) {}

  async addComment(userId: string, dto: {
    content: string;
    discussionId: string;
    parentId?: string;
  }) {
    // Verify discussion exists and is active
    const discussion = await this.prisma.discussion.findUnique({
      where: { 
        id: dto.discussionId,
        status: 'active',
      },
      include: {
        group: {
          select: {
            id: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found or inactive');
    }

    // Check private group membership if applicable
    if (discussion.group?.isPrivate) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: discussion.group.id,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.status !== 'approved') {
        throw new ForbiddenException('You must be a member to comment on this discussion');
      }
    }

    // If parentId provided, verify it exists and belongs to same discussion
    if (dto.parentId) {
      const parentComment = await this.prisma.discussionComment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.discussionId !== dto.discussionId) {
        throw new BadRequestException('Parent comment does not belong to this discussion');
      }

      // Check nesting level - only allow 1 level of replies (2 levels total)
      if (parentComment.parentId) {
        throw new BadRequestException('Cannot reply to a reply - max 2 levels allowed');
      }
    }

    const comment = await this.prisma.discussionComment.create({
      data: {
        content: dto.content,
        discussionId: dto.discussionId,
        authorId: userId,
        parentId: dto.parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isModerator: true,
            isSuperAdmin: true,
          },
        },
        replies: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  async getCommentsByDiscussion(discussionId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Verify discussion exists
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    const [comments, total] = await Promise.all([
      this.prisma.discussionComment.findMany({
        where: {
          discussionId,
          parentId: null, // Only top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isModerator: true,
              isSuperAdmin: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  isModerator: true,
                  isSuperAdmin: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          upvotes: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.discussionComment.count({
        where: {
          discussionId,
          parentId: null,
        },
      }),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
      include: {
        discussion: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only author can edit
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Check if discussion is still active
    if (comment.discussion.status !== 'active') {
      throw new ForbiddenException('Cannot edit comments on inactive discussions');
    }

    return this.prisma.discussionComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isModerator: true,
            isSuperAdmin: true,
          },
        },
      },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
      include: {
        discussion: {
          include: {
            group: true,
          },
        },
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check permissions: author, discussion author, or group admin
    const isAuthor = comment.authorId === userId;
    const isDiscussionAuthor = comment.discussion.authorId === userId;

    let isGroupAdmin = false;
    if (comment.discussion.groupId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: comment.discussion.groupId,
            memberId: userId,
          },
        },
      });
      isGroupAdmin = membership?.role === 'admin' || membership?.role === 'moderator';
    }

    if (!isAuthor && !isDiscussionAuthor && !isGroupAdmin) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    // Delete all replies first (cascade)
    if (comment.replies.length > 0) {
      await this.prisma.discussionComment.deleteMany({
        where: {
          parentId: commentId,
        },
      });
    }

    await this.prisma.discussionComment.delete({
      where: { id: commentId },
    });

    return { success: true, deletedReplies: comment.replies.length };
  }

  /**
   * Toggle upvote for a comment using CommentVote model
   */
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
}