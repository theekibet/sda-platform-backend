import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from './dto/update-prayer-request.dto';
import { CreateTestimonyDto } from './dto/create-testimony.dto';
import { UpdateTestimonyDto } from './dto/update-testimony.dto';

@Controller('prayer')
@UseGuards(JwtAuthGuard)
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  // ============ PRAYER REQUESTS ============

  @Post('requests')
  createPrayerRequest(
    @CurrentUser() user: any,
    @Body() dto: CreatePrayerRequestDto,
  ) {
    return this.prayerService.createPrayerRequest(
      user?.id,
      dto,
      user?.locationName,
    );
  }

  @Get('requests')
  getPrayerRequests(
    @Query('city') city?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.prayerService.getPrayerRequests(city, page, limit);
  }

  @Get('requests/my')
  async getMyPrayerRequests(@CurrentUser() user: any) {
    return this.prayerService.getPrayerRequestsByAuthor(user.id);
  }

  @Get('requests/trending')
  getTrendingPrayers() {
    return this.prayerService.getTrendingPrayers();
  }

  @Get('requests/:id')
  getPrayerRequestById(@Param('id') id: string) {
    return this.prayerService.getPrayerRequestById(id);
  }

  @Post('requests/:id/pray')
  prayForRequest(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
  ) {
    return this.prayerService.prayForRequest(user.id, requestId);
  }

  @Put('requests/:id')
  async updatePrayerRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePrayerRequestDto,
  ) {
    return this.prayerService.updatePrayerRequest(user.id, id, dto);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePrayerRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.prayerService.deletePrayerRequest(user.id, id);
  }

  // ============ TESTIMONIES ============

  @Post('testimonies')
  createTestimony(
    @CurrentUser() user: any,
    @Body() dto: CreateTestimonyDto,
  ) {
    return this.prayerService.createTestimony(user.id, dto);
  }

  @Get('testimonies')
  getTestimonies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.prayerService.getTestimonies(page, limit);
  }

  @Get('testimonies/my')
  async getMyTestimonies(@CurrentUser() user: any) {
    return this.prayerService.getTestimoniesByAuthor(user.id);
  }

  @Post('testimonies/:id/encourage')
  encourageTestimony(
    @CurrentUser() user: any,
    @Param('id') testimonyId: string,
  ) {
    return this.prayerService.encourageTestimony(user.id, testimonyId);
  }

  @Put('testimonies/:id')
  async updateTestimony(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTestimonyDto,
  ) {
    return this.prayerService.updateTestimony(user.id, id, dto);
  }

  @Delete('testimonies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTestimony(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.prayerService.deleteTestimony(user.id, id);
  }
}