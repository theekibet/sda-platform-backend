// src/modules/bible/bible-interactions.controller.ts
import { 
  Controller, Get, Post, Body, Param, UseGuards, Logger, NotFoundException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma.service';


@Controller('bible/verse')
export class BibleInteractionsController {
  private readonly logger = new Logger(BibleInteractionsController.name);

  constructor(private prisma: PrismaService) {}

  // ============ TEST ENDPOINT ============
  @Get('test')
  test() {
    return { message: 'Bible interactions controller is working!' };
  }

  // ============ LIKES ============

  @Get(':verseId/likes')
  @UseGuards(OptionalJwtAuthGuard)
  async getLikes(@Param('verseId') verseId: string) {
    // First check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const count = await this.prisma.verseLike.count({
      where: { verseId },
    });

    return { success: true, count };
  }

  @Post(':verseId/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUser() user: any,
    @Param('verseId') verseId: string,
  ) {
    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const existing = await this.prisma.verseLike.findUnique({
      where: {
        verseId_userId: {
          verseId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      // Unlike
      await this.prisma.verseLike.delete({
        where: {
          verseId_userId: {
            verseId,
            userId: user.id,
          },
        },
      });
      return { success: true, liked: false };
    } else {
      // Like
      await this.prisma.verseLike.create({
        data: {
          verseId,
          userId: user.id,
        },
      });
      return { success: true, liked: true };
    }
  }

  // ============ COMMENTS ============

  @Get(':verseId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  async getComments(@Param('verseId') verseId: string) {
    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const comments = await this.prisma.verseComment.findMany({
      where: { verseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isModerator: true,
            isSuperAdmin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, comments };
  }

  @Post(':verseId/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @CurrentUser() user: any,
    @Param('verseId') verseId: string,
    @Body('content') content: string,
  ) {
    if (!content || content.trim().length === 0) {
      return { success: false, message: 'Comment content is required' };
    }

    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const comment = await this.prisma.verseComment.create({
      data: {
        verseId,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: {
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

    return { success: true, comment };
  }

  // ============ USER INTERACTION STATUS ============

  @Get(':verseId/user-interaction')
  @UseGuards(JwtAuthGuard)
  async getUserInteraction(
    @CurrentUser() user: any,
    @Param('verseId') verseId: string,
  ) {
    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const [liked, bookmarked] = await Promise.all([
      this.prisma.verseLike.findUnique({
        where: {
          verseId_userId: {
            verseId,
            userId: user.id,
          },
        },
      }),
      this.prisma.verseBookmark.findUnique({
        where: {
          verseId_userId: {
            verseId,
            userId: user.id,
          },
        },
      }),
    ]);

    return {
      success: true,
      liked: !!liked,
      bookmarked: !!bookmarked,
    };
  }

  // ============ BOOKMARKS ============

  @Post(':verseId/bookmark')
  @UseGuards(JwtAuthGuard)
  async toggleBookmark(
    @CurrentUser() user: any,
    @Param('verseId') verseId: string,
  ) {
    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      throw new NotFoundException('Verse not found');
    }

    const existing = await this.prisma.verseBookmark.findUnique({
      where: {
        verseId_userId: {
          verseId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await this.prisma.verseBookmark.delete({
        where: {
          verseId_userId: {
            verseId,
            userId: user.id,
          },
        },
      });
      return { success: true, bookmarked: false };
    } else {
      // Add bookmark
      await this.prisma.verseBookmark.create({
        data: {
          verseId,
          userId: user.id,
        },
      });
      return { success: true, bookmarked: true };
    }
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  async getBookmarks(@CurrentUser() user: any) {
    const bookmarks = await this.prisma.verseBookmark.findMany({
      where: { userId: user.id },
      include: {
        verse: {
          include: {
            version: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { 
      success: true, 
      bookmarks 
    };
  }
}