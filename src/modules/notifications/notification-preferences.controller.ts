import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private preferencesService: NotificationPreferencesService) {}

  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    const preferences = await this.preferencesService.getPreferences(user.id);
    return { success: true, data: preferences };
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const preferences = await this.preferencesService.updatePreferences(user.id, dto);
    return { success: true, data: preferences };
  }
}