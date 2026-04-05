import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    Patch,
    Delete,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { DiscussionCommentsService } from './discussion-comments.service';
  import { CreateCommentDto } from './dto/create-comment.dto';
  import { UpdateCommentDto } from './dto/update-comment.dto';
  import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
  
  @Controller('discussions/:discussionId/comments')
  export class DiscussionCommentsController {
    constructor(private readonly commentsService: DiscussionCommentsService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    async addComment(
      @Param('discussionId') discussionId: string,
      @Body() dto: CreateCommentDto,
      @Request() req,
    ) {
      if (dto.discussionId !== discussionId) {
        dto.discussionId = discussionId;
      }
      return this.commentsService.addComment(req.user.userId, dto);
    }
  
    @Get()
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
  
    @Post(':commentId/reply')
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
  
    @Post(':commentId/upvote')
    @UseGuards(JwtAuthGuard)
    async upvoteComment(
      @Param('commentId') commentId: string,
      @Request() req,
    ) {
      return this.commentsService.upvoteComment(req.user.userId, commentId);
    }
  }
  
  @Controller('comments')
  export class CommentsController {
    constructor(private readonly commentsService: DiscussionCommentsService) {}
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async updateComment(
      @Param('id') id: string,
      @Body() dto: UpdateCommentDto,
      @Request() req,
    ) {
      return this.commentsService.updateComment(req.user.userId, id, dto.content);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteComment(@Param('id') id: string, @Request() req) {
      return this.commentsService.deleteComment(req.user.userId, id);
    }
  }