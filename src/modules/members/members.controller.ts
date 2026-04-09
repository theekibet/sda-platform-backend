// src/modules/members/members.controller.ts
import { 
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards,
  UnauthorizedException, UseInterceptors, UploadedFile, 
  BadRequestException, HttpCode, HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MembersService } from './members.service';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // ============ PROFILE ENDPOINTS ============
  
  @Get('profile/me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.membersService.getProfile(user.id);
  }

  @Patch('profile/me')
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    // Regular members update their own profile - isModerator defaults to false
    return this.membersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string
  ) {
    if (!currentPassword || !newPassword) {
      throw new UnauthorizedException('Both current and new password are required');
    }
    return this.membersService.changePassword(user.id, currentPassword, newPassword);
  }

  // ============ PROFILE PICTURE ENDPOINTS ============
  
  @Post('profile/picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const avatarUrl = await this.fileUploadService.uploadImage(file);
    const updatedUser = await this.membersService.updateProfilePicture(user.id, avatarUrl);
    
    return {
      success: true,
      message: 'Profile picture uploaded successfully',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  @Delete('profile/picture')
  @HttpCode(HttpStatus.OK)
  async removeProfilePicture(@CurrentUser() user: any) {
    await this.membersService.removeProfilePicture(user.id);
    return { 
      success: true, 
      message: 'Profile picture removed successfully' 
    };
  }

  // ============ SIMPLIFIED LOCATION ENDPOINT (Auto-detect only) ============
  
  @Patch('profile/location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @CurrentUser() user: any,
    @Body('locationName') locationName: string,
    @Body('latitude') latitude?: number,
    @Body('longitude') longitude?: number,
  ) {
    if (!locationName) {
      throw new BadRequestException('Location name is required');
    }
    return this.membersService.updateLocation(user.id, { locationName, latitude, longitude });
  }

  // ============ BASIC MEMBER ENDPOINTS ============
  
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }
}