import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class CreateTagDto {
  name: string;
  description?: string;
}

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async getAllTags() {
    return this.tagsService.getAllTags();
  }

  @Get('trending')
  async getTrendingTags(@Query('limit') limit?: string) {
    return this.tagsService.getTrendingTags(limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  async getTagById(@Param('id') id: string) {
    return this.tagsService.getTagById(id);
  }

  @Get('by-name/:name')
  async getTagByName(@Param('name') name: string) {
    return this.tagsService.getTagByName(name);
  }

  @Get(':id/discussions')
  async getDiscussionsByTag(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tagsService.getDiscussionsByTag(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTag(@Body() dto: CreateTagDto) {
    return this.tagsService.createTag(dto);
  }
}