import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { PostAnalyticsService } from './post-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CommunityResponseDto } from './dto/community-response.dto';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly postAnalyticsService: PostAnalyticsService,
  ) {}

  /**
   * ============================================
   * SPECIFIC ROUTES (must come BEFORE :id routes)
   * ============================================
   */

  /**
   * Get trending posts
   */
  @Get('posts/trending')
  @UseGuards(OptionalJwtAuthGuard)
  async getTrendingPosts(
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    const posts = await this.communityService.getTrendingPosts(
      timeframe || 'week',
      limit ? parseInt(limit) : 10,
    );
    return {
      success: true,
      data: posts,
    };
  }

  /**
   * Get local posts (radius-based search)
   */
  @Get('posts/local')
  @UseGuards(JwtAuthGuard)
  async getLocalPosts(
    @CurrentUser() user: any,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ): Promise<any> {
    const posts = await this.communityService.getLocalPosts(
      user.id,
      radius,
      limit,
    );
    return {
      success: true,
      data: { posts },
    };
  }

  /**
   * Get all posts with optional filters
   */
  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
    @Query('local') local?: string,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius?: number,
  ): Promise<any> {
    const result = await this.communityService.getPosts({
      type,
      page,
      limit,
      search,
      localOnly: local === 'true',
      userId: user?.id,
      radius,
    });
    return {
      success: true,
      data: result.posts,
      pagination: result.pagination,
    };
  }

  /**
   * ============================================
   * DYNAMIC ROUTES (with :id parameter)
   * These must come AFTER specific routes
   * ============================================
   */

  /**
   * Create a new post (requires login)
   */
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: any,
    @Body() dto: CreateCommunityPostDto,
  ): Promise<any> {
    // Validate event date is not in the past
    if (dto.type === 'event' && dto.eventDate) {
      const eventDate = new Date(dto.eventDate);
      const now = new Date();
      eventDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      if (eventDate < now) {
        throw new BadRequestException('Event date cannot be in the past');
      }
    }

    // Validate contact phone is required for donation posts
    if (dto.type === 'donation' && !dto.contactPhone) {
      throw new BadRequestException('Contact phone is required for donation posts');
    }

    // Validate donation goal amount
    if (dto.type === 'donation' && dto.goalAmount && dto.goalAmount <= 0) {
      throw new BadRequestException('Goal amount must be greater than 0');
    }

    const post = await this.communityService.createPost(user.id, dto);
    return {
      success: true,
      message: 'Post created successfully',
      data: post,
    };
  }

  /**
   * Update donation progress (requires login, only author or admin)
   */
  @Patch('posts/:id/donation')
  @UseGuards(JwtAuthGuard)
  async updateDonationProgress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ): Promise<any> {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const post = await this.communityService.updateDonationProgress(
      user.id,
      user.isAdmin || false,
      id,
      body.amount,
    );

    return {
      success: true,
      message: 'Donation progress updated successfully',
      data: post,
    };
  }

  /**
   * Get a single post by ID (public)
   * Includes user-specific data like whether the current user has supported
   */
  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPostById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    const post = await this.communityService.getPostById(id, user?.id);
    return {
      success: true,
      data: post,
    };
  }

  /**
   * Get post analytics (requires login, only author or admin)
   */
  @Get('posts/:id/analytics')
  @UseGuards(JwtAuthGuard)
  async getPostAnalytics(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    const analytics = await this.postAnalyticsService.getPostAnalytics(
      id,
      user.id,
      user.isAdmin || false,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Update a post (requires login, only author or admin)
   */
  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityPostDto,
  ): Promise<any> {
    // Validate event date if being updated
    if (dto.type === 'event' && dto.eventDate) {
      const eventDate = new Date(dto.eventDate);
      const now = new Date();
      eventDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      if (eventDate < now) {
        throw new BadRequestException('Event date cannot be in the past');
      }
    }

    const post = await this.communityService.updatePost(
      user.id,
      user.isAdmin || false,
      id,
      dto,
    );
    return {
      success: true,
      message: 'Post updated successfully',
      data: post,
    };
  }

  /**
   * Delete a post (requires login, only author or admin)
   */
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    return this.communityService.deletePost(
      user.id,
      user.isAdmin || false,
      id,
    );
  }

  /**
   * Add/update support to a post (requires login)
   * Users can only give "support" as the reaction type (🙏)
   * Optional comment can be added
   */
  @Post('posts/:id/responses')
  @UseGuards(JwtAuthGuard)
  async addResponse(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CommunityResponseDto,
  ): Promise<any> {
    const response = await this.communityService.addResponse(user.id, id, dto);
    return {
      success: true,
      message: 'Support added successfully',
      data: response,
    };
  }

  /**
   * Remove support from a post (requires login)
   */
  @Delete('posts/:id/responses')
  @UseGuards(JwtAuthGuard)
  async removeResponse(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    const result = await this.communityService.removeResponse(user.id, id);
    return {
      success: true,
      message: 'Support removed successfully',
      data: result,
    };
  }

  /**
   * Get posts by a specific user
   */
  @Get('users/:userId/posts')
  @UseGuards(JwtAuthGuard)
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ): Promise<any> {
    const result = await this.communityService.getUserPosts(userId, page, limit);
    return {
      success: true,
      data: result.posts,
      pagination: result.pagination,
    };
  }

  // ============ BOOKMARK ENDPOINTS ============

  /**
   * Check if a post is bookmarked by the current user
   */
  @Get('posts/:id/bookmark-status')
  @UseGuards(JwtAuthGuard)
  async getBookmarkStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    const isBookmarked = await this.communityService.getBookmarkStatus(user.id, id);
    return {
      success: true,
      data: { isBookmarked },
    };
  }

  /**
   * Bookmark a post
   */
  @Post('posts/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  async addBookmark(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    const bookmark = await this.communityService.addBookmark(user.id, id);
    return {
      success: true,
      data: bookmark,
      message: 'Post bookmarked successfully',
    };
  }

  /**
   * Remove bookmark from a post
   */
  @Delete('posts/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  async removeBookmark(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    await this.communityService.removeBookmark(user.id, id);
    return {
      success: true,
      message: 'Bookmark removed successfully',
    };
  }

  /**
   * Get all bookmarks for the current user
   */
  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  async getBookmarks(@CurrentUser() user: any): Promise<any> {
    const bookmarks = await this.communityService.getUserBookmarks(user.id);
    return {
      success: true,
      data: bookmarks,
    };
  }
}