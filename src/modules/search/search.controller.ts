import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

type SearchResultType = 'all' | 'discussions' | 'groups' | 'tags';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('type') type: string = 'all',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const validType = ['all', 'discussions', 'groups', 'tags'].includes(type) 
      ? type as SearchResultType 
      : 'all';

    return this.searchService.globalSearch(
      query || '',
      validType,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('authenticated')
  @UseGuards(JwtAuthGuard)
  async searchAuthenticated(
    @Request() req,
    @Query('q') query: string,
    @Query('type') type: string = 'all',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const validType = ['all', 'discussions', 'groups', 'tags'].includes(type) 
      ? type as SearchResultType 
      : 'all';

    return this.searchService.searchWithUserContext(
      query || '',
      req.user.userId,
      validType,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentSearches(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getRecentSearches(
      req.user.userId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('trending')
  async getTrendingSearches(@Query('limit') limit?: string) {
    return this.searchService.getTrendingSearches(
      limit ? parseInt(limit) : 10,
    );
  }
}