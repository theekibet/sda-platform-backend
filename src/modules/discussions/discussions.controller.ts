// src/modules/discussions/discussions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { DiscussionCommentsService } from './comments/discussion-comments.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { DiscussionVoteDto } from './dto/discussion-vote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@Controller('discussions')
export class DiscussionsController {
  constructor(
    private readonly discussionsService: DiscussionsService,
    private readonly commentsService: DiscussionCommentsService, // Add this
  ) {}

  // ============ BOOKMARKS - MUST BE BEFORE :id ROUTE ============

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  async getUserBookmarks(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discussionsService.getUserBookmarks(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  async toggleBookmark(@Param('id') id: string, @Request() req) {
    return this.discussionsService.toggleBookmark(req.user.userId, id);
  }

  // ============ COMMENT VOTES ============

  @Post('comments/:commentId/upvote')
  @UseGuards(JwtAuthGuard)
  async upvoteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.discussionsService.upvoteComment(req.user.userId, commentId);
  }

  // ============ HOME FEED & DISCOVERY ============

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  async getHomeFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discussionsService.getHomeFeed(
      req.user?.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('trending/now')
  async getTrendingNow(@Query('limit') limit?: string) {
    return this.discussionsService.getTrendingNow(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommendedForUser(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.discussionsService.getRecommendedForUser(
      req.user.userId,
      limit ? parseInt(limit) : 5,
    );
  }

  // ============ CRUD ============

  @Post()
  @UseGuards(JwtAuthGuard)
  async createDiscussion(@Body() dto: CreateDiscussionDto, @Request() req) {
    return this.discussionsService.createDiscussion(req.user.userId, dto);
  }

  @Get()
  async getDiscussions(
    @Query('groupId') groupId?: string,
    @Query('tagId') tagId?: string,
    @Query('authorId') authorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'new' | 'popular' | 'trending' | 'hot',
  ) {
    return this.discussionsService.getDiscussions({
      groupId,
      tagId,
      authorId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sort: sort || 'new',
    });
  }

  @Get('search')
  async searchDiscussions(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      return { discussions: [], total: 0, page: 1, totalPages: 0 };
    }
    return this.discussionsService.searchDiscussions(
      query,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ============ COMMENTS ============

  @Get(':discussionId/comments')
  async getComments(
    @Param('discussionId') discussionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.getCommentsByDiscussion(
      discussionId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post(':discussionId/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('discussionId') discussionId: string,
    @Body() dto: { content: string; parentId?: string },
    @Request() req,
  ) {
    return this.commentsService.addComment(req.user.userId, {
      content: dto.content,
      discussionId,
      parentId: dto.parentId,
    });
  }

  @Post(':discussionId/comments/:commentId/reply')
  @UseGuards(JwtAuthGuard)
  async addReply(
    @Param('discussionId') discussionId: string,
    @Param('commentId') parentId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.commentsService.addComment(req.user.userId, {
      content,
      discussionId,
      parentId,
    });
  }

  // ============ DYNAMIC ROUTES - MUST BE AFTER STATIC ROUTES ============

  @Get(':id')
  async getDiscussionById(@Param('id') id: string, @Request() req) {
    return this.discussionsService.getDiscussionById(id, req.user?.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateDiscussion(
    @Param('id') id: string,
    @Body() dto: UpdateDiscussionDto,
    @Request() req,
  ) {
    return this.discussionsService.updateDiscussion(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteDiscussion(@Param('id') id: string, @Request() req) {
    return this.discussionsService.deleteDiscussion(req.user.userId, id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  async voteDiscussion(
    @Param('id') id: string,
    @Body() dto: DiscussionVoteDto,
    @Request() req,
  ) {
    return this.discussionsService.voteDiscussion(req.user.userId, id, dto.value);
  }
}