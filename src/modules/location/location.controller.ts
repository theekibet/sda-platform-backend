import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // SIMPLIFIED: Just update location - no privacy settings
  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentUser() user: any,
    @Body() locationData: UpdateLocationDto,
  ) {
    const updated = await this.locationService.updateUserLocation(user.id, locationData);
    return {
      success: true,
      message: 'Location updated successfully',
      data: updated,
    };
  }

  // OPTIONAL: Get location stats (admin only - keep if needed)
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getLocationStats() {
    const stats = await this.locationService.getLocationStats();
    return {
      success: true,
      data: stats,
    };
  }

  // DEPRECATED: Returns empty array (frontend no longer uses)
  @Get('privacy-options')
  getPrivacyOptions() {
    return {
      success: true,
      data: {
        levels: [],
        default: 'city',
      },
    };
  }
}