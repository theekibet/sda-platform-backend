import { 
  Controller, Get, Post, Delete, Body, Param, Query, 
  UseGuards, DefaultValuePipe, ParseIntPipe 
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { BlockIpDto } from './dto/block-ip.dto';
import { RateLimitDto } from './dto/rate-limit.dto';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ============ IP BLOCKING ============
  @Get('blocked-ips')
  getBlockedIPs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.securityService.getBlockedIPs(page, limit);
  }

  @Post('block-ip')
  blockIP(@Body() dto: BlockIpDto) {
    return this.securityService.blockIP(dto);
  }

  @Delete('block-ip/:ip')
  unblockIP(@Param('ip') ip: string) {
    return this.securityService.unblockIP(ip);
  }

  // ============ RATE LIMITING ============
  @Get('rate-limits')
  getRateLimits() {
    return this.securityService.getRateLimits();
  }

  @Post('rate-limits')
  updateRateLimit(@Body() dto: RateLimitDto) {
    return this.securityService.updateRateLimit(dto);
  }

  // ============ SESSION MANAGEMENT ============
  @Get('sessions')
  getActiveSessions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.securityService.getActiveSessions(page, limit);
  }

  @Delete('sessions/:sessionId')
  terminateSession(@Param('sessionId') sessionId: string) {
    return this.securityService.terminateSession(sessionId);
  }

  @Delete('sessions/user/:userId')
  terminateAllUserSessions(@Param('userId') userId: string) {
    return this.securityService.terminateAllUserSessions(userId);
  }

  // ============ LOGIN ATTEMPTS ============
  @Get('login-attempts')
  getLoginAttempts(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.securityService.getLoginAttempts(days, page, limit);
  }

  @Get('login-attempts/failed')
  getFailedLoginAttempts(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
  ) {
    return this.securityService.getFailedLoginAttempts(days);
  }
}