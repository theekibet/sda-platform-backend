import { 
  Controller, Get, Post, Body, Param, Query, 
  UseGuards, DefaultValuePipe, ParseIntPipe, 
  BadRequestException 
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModeratorGuard } from '../../common/guards/moderator.guard'; // ✅ CHANGED from AdminGuard
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';
import { ModerationLogsQueryDto } from './dto/moderation-logs-query.dto';

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, ModeratorGuard) // ✅ CHANGED: All moderation is for moderators
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  getModerationQueue(@Query() query: ModerationQueryDto) {
    return this.moderationService.getModerationQueue(query);
  }

  @Get('content/:contentType/:contentId')
  getContentForReview(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: string,
  ) {
    return this.moderationService.getContentForReview(contentId, contentType);
  }

  @Post('content/:contentType/:contentId')
  moderateContent(
    @CurrentUser() admin: any,
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: string,
    @Body() dto: ModerateContentDto,
  ) {
    return this.moderationService.moderateContent(
      admin.id,
      contentId,
      contentType,
      dto,
    );
  }

  // 🔥 FIX: Replace query: any with typed ModerationLogsQueryDto
  @Get('logs')
  getModerationLogs(@Query() query: ModerationLogsQueryDto) {
    return this.moderationService.getModerationLogs(query);
  }

  // 🔥 FIX: Add validation and null check for authorId
  @Post('check-content')
  async checkContent(
    @Body('content') content: string,
    @Body('contentType') contentType: string,
    @Body('authorId') authorId?: string,
  ) {
    // Validate required fields
    if (!content || !contentType) {
      throw new BadRequestException('Content and contentType are required');
    }

    // 🔥 FIX: Only call checkContentForFlags if we have a real content ID
    // This endpoint should be used AFTER content is created, with the real ID
    if (!authorId) {
      return { 
        flagged: false, 
        message: 'Author ID not provided, skipping auto-flagging' 
      };
    }

    // Note: This is a placeholder - the real implementation should be called
    // with the actual contentId after the content is saved
    return this.moderationService.checkContentForFlags(content, contentType, authorId);
  }

  // 🔥 NEW: Bulk moderation endpoint
  @Post('bulk')
  async bulkModerate(
    @CurrentUser() admin: any,
    @Body('contentIds') contentIds: string[],
    @Body('contentType') contentType: string,
    @Body('action') action: 'approve' | 'remove' | 'warn' | 'flag' | 'dismiss',
    @Body('reason') reason?: string,
  ) {
    // Validate required fields
    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      throw new BadRequestException('contentIds array is required');
    }

    if (!contentType) {
      throw new BadRequestException('contentType is required');
    }

    if (!action) {
      throw new BadRequestException('action is required');
    }

    return this.moderationService.bulkModerate(
      admin.id,
      contentIds,
      contentType,
      action,
      reason,
    );
  }

  // 🔥 NEW: Get moderation stats
  @Get('stats')
  getModerationStats() {
    return this.moderationService.getModerationStats();
  }
}