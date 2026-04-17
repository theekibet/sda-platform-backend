// src/modules/bible/bible.controller.ts
import { 
  Controller, Get, Post, Body, Query, Param, 
  UseGuards, HttpCode, HttpStatus, Logger, ForbiddenException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BibleApiService } from './bible-api.service';
import { BibleVerseService } from './bible-verse.service';
import { PrismaService } from '../../prisma.service';

@Controller('bible')
export class BibleController {
  private readonly logger = new Logger(BibleController.name);

  constructor(
    private readonly bibleApi: BibleApiService,
    private readonly bibleVerseService: BibleVerseService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Public endpoint - anyone can view verses
   */
  @Get('verse')
  @UseGuards(OptionalJwtAuthGuard)
  async getVerse(
    @Query('reference') reference: string,
    @Query('translation') translation: string = 'kjv',
  ) {
    const decodedReference = decodeURIComponent(reference);
    this.logger.log(`Fetching verse: "${decodedReference}" (${translation})`);
    
    const verse = await this.bibleVerseService.getOrCreateVerse(decodedReference, translation);
    return { success: true, data: verse };
  }

  /**
   * Get a random verse (for landing page)
   */
  @Get('random')
  async getRandomVerse(
    @Query('translation') translation: string = 'kjv',
  ) {
    try {
      const verse = await this.bibleApi.getRandomVerse(translation);
      return { success: true, data: verse };
    } catch (error) {
      this.logger.error(`Error in getRandomVerse: ${error.message}`);
      return { 
        success: true, 
        data: {
          reference: "John 3:16",
          book: "John",
          chapter: 3,
          verse: 16,
          text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
          translation: "King James Version",
          translationCode: "kjv"
        },
        isFallback: true 
      };
    }
  }

  /**
   * Get chapter verses
   */
  @Get('chapter')
  async getChapter(
    @Query('book') book: string,
    @Query('chapter') chapter: string,
    @Query('translation') translation: string = 'kjv',
  ) {
    const verses = await this.bibleVerseService.getChapter(
      book,
      parseInt(chapter),
      translation
    );
    return { success: true, data: verses };
  }

  /**
   * Get available translations
   */
  @Get('translations')
  getTranslations() {
    return { success: true, data: this.bibleApi.getTranslations() };
  }

  /**
   * Submit a verse to the queue (requires login)
   */
  @Post('share')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async shareVerse(
    @CurrentUser() user: any,
    @Body() body: { 
      verseId: string;
      comment?: string;
    },
  ) {
    const { verseId, comment } = body;
    
    // Check if verse exists
    const verse = await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
    });
    
    if (!verse) {
      return { success: false, message: 'Verse not found' };
    }
    
    // Check if user already submitted this verse
    const existing = await this.prisma.sharedVerse.findFirst({
      where: {
        verseId,
        userId: user.id,
        status: { in: ['pending', 'approved', 'scheduled'] },
      },
    });
    
    if (existing) {
      return { 
        success: false, 
        message: 'You have already submitted this verse' 
      };
    }
    
    // Check if verse was used recently
    const recentlyUsed = await this.bibleVerseService.wasVerseUsedRecently(verseId);
    
    if (recentlyUsed) {
      return { 
        success: false, 
        message: 'This verse was used in the last 30 days. Please choose another.' 
      };
    }
    
    // Get queue position
    const queuePosition = await this.bibleVerseService.getQueuePosition();
    
    // Create submission
    const sharedVerse = await this.prisma.sharedVerse.create({
      data: {
        verseId,
        userId: user.id,
        comment,
        status: 'pending',
      },
      include: {
        verse: {
          include: {
            version: true,
          },
        },
      },
    });
    
    return {
      success: true,
      message: 'Verse added to queue',
      data: {
        sharedVerse,
        queuePosition,
      },
    };
  }

  /**
   * Get user's submissions
   */
  @Get('my-submissions')
  @UseGuards(JwtAuthGuard)
  async getMySubmissions(@CurrentUser() user: any) {
    const submissions = await this.prisma.sharedVerse.findMany({
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
    
    return { success: true, data: submissions };
  }

  /**
   * Get detailed submission with queue position
   */
  @Get('my-submissions/:id')
  @UseGuards(JwtAuthGuard)
  async getSubmissionDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const submission = await this.prisma.sharedVerse.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        verse: {
          include: {
            version: true,
          },
        },
      },
    });

    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    let queuePosition: number | null = null;
    if (submission.status === 'pending') {
      queuePosition = await this.prisma.sharedVerse.count({
        where: {
          status: 'pending',
          createdAt: {
            lt: submission.createdAt,
          },
        },
      }) + 1;
    }

    return {
      success: true,
      data: {
        ...submission,
        queuePosition,
      },
    };
  }

  /**
   * Cancel a pending submission (delete from database)
   */
  @Post('my-submissions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubmission(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const submission = await this.prisma.sharedVerse.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    if (submission.status !== 'pending') {
      throw new ForbiddenException('Only pending submissions can be cancelled');
    }

    await this.prisma.sharedVerse.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Submission cancelled successfully',
    };
  }

  /**
   * Get queue statistics for user
   */
  @Get('my-submissions/queue/stats')
  @UseGuards(JwtAuthGuard)
  async getMyQueueStats(@CurrentUser() user: any) {
    const totalPending = await this.prisma.sharedVerse.count({
      where: {
        status: 'pending',
      },
    });

    const mySubmissions = await this.prisma.sharedVerse.findMany({
      where: {
        userId: user.id,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const submissionsWithPosition = await Promise.all(
      mySubmissions.map(async (sub) => {
        const position = await this.prisma.sharedVerse.count({
          where: {
            status: 'pending',
            createdAt: {
              lt: sub.createdAt,
            },
          },
        }) + 1;
        
        return {
          id: sub.id,
          position,
        };
      })
    );

    return {
      success: true,
      data: {
        totalPending,
        yourSubmissions: submissionsWithPosition,
      },
    };
  }

  /**
   * Get the current queue status
   */
  @Get('queue')
  async getQueueStatus() {
    const pending = await this.prisma.sharedVerse.count({
      where: { status: 'pending' },
    });
    
    const scheduled = await this.prisma.sharedVerse.count({
      where: { status: 'scheduled' },
    });
    
    const nextDate = await this.bibleVerseService.getNextAvailableDate();
    
    return {
      success: true,
      data: {
        pending,
        scheduled,
        nextAvailableDate: nextDate,
      },
    };
  }

  /**
   * Get today's verse (for landing page and dashboard)
   */
  @Get('today')
  async getTodaysVerse() {
    try {
      const today = new Date();
      
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      this.logger.log(`Looking for verses between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
      
      const todaysVerse = await this.prisma.sharedVerse.findFirst({
        where: {
          scheduledFor: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'published',
        },
        include: {
          verse: {
            include: {
              version: true,
            },
          },
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
        orderBy: {
          scheduledFor: 'asc',
        },
      });
      
      if (todaysVerse) {
        this.logger.log(`Found published verse for today: ${todaysVerse.verse.reference}`);
        return { success: true, data: todaysVerse };
      }
      
      const scheduledForToday = await this.prisma.sharedVerse.findFirst({
        where: {
          scheduledFor: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'scheduled',
        },
        include: {
          verse: {
            include: {
              version: true,
            },
          },
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
      
      if (scheduledForToday) {
        this.logger.log(`Auto-publishing scheduled verse for today: ${scheduledForToday.verse.reference}`);
        
        const published = await this.prisma.sharedVerse.update({
          where: { id: scheduledForToday.id },
          data: { status: 'published' },
          include: {
            verse: {
              include: {
                version: true,
              },
            },
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
        
        return { success: true, data: published };
      }
      
      this.logger.log('No verse found for today, returning random verse');
      const randomVerse = await this.bibleApi.getRandomVerse();
      return {
        success: true,
        data: {
          verse: randomVerse,
          isRandom: true,
          message: "No verse scheduled for today. Here's a random verse!"
        },
      };
    } catch (error) {
      this.logger.error(`Error in getTodaysVerse: ${error.message}`);
      
      return {
        success: true,
        data: {
          verse: {
            reference: "John 3:16",
            book: "John",
            chapter: 3,
            verse: 16,
            text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
            translation: "King James Version",
            translationCode: "kjv"
          },
          isRandom: true,
          isFallback: true
        },
      };
    }
  }
}