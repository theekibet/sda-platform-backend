// src/modules/admin/admin.controller.ts
import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  UseGuards, ParseIntPipe, DefaultValuePipe, Res, HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModeratorGuard } from '../../common/guards/moderator.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserQueryDto } from './dto/user-query.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { BulkUserActionDto } from './dto/bulk-user-action.dto';
import { ReportQueryDto } from '../reports/dto/report-query.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { DateRangeDto } from '../analytics/dto/date-range.dto';
import { UpdateSettingDto } from '../settings/dto/update-setting.dto';
import { FeatureFlagDto } from '../settings/dto/feature-flag.dto';
import { CreateAnnouncementDto } from '../announcements/dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../announcements/dto/update-announcement.dto';
import { BlockIpDto } from '../security/dto/block-ip.dto';
import { RateLimitDto } from '../security/dto/rate-limit.dto';
import { BackupDto } from '../maintenance/dto/backup.dto';

interface BulkActionResult {
  userId: string;
  action: string;
  error?: string;
}

interface BulkActionResponse {
  success: boolean;
  message: string;
  results: {
    success: BulkActionResult[];
    failed: BulkActionResult[];
  };
}

interface EngagementMetricsResponse {
  period: string;
  dailyActive: Array<{ date: string; activeUsers: number }>;
  retention: {
    newUsers: number;
    retainedUsers: number;
    retentionRate: number;
  };
  avgSessionDuration: number | { average: number; note: string };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ DASHBOARD (Super Admin Only) ============
  @Get('dashboard')
  @UseGuards(SuperAdminGuard)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============ USER MANAGEMENT ============
  @Get('users')
  getUsers(@Query() query: UserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:userId')
  getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users/:userId/suspend')
  suspendUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(admin.id, userId, dto);
  }

  @Post('users/:userId/toggle-moderator')
  @UseGuards(SuperAdminGuard)
  toggleModerator(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
  ) {
    return this.adminService.toggleModerator(admin.id, userId);
  }

  @Post('users/reset-password')
  @UseGuards(SuperAdminGuard)
  adminResetPassword(
    @CurrentUser() admin: any,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.adminService.adminResetPassword(admin.id, dto);
  }

  @Put('users/:userId/notes')
  updateAdminNotes(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body('notes') notes: string,
  ) {
    return this.adminService.updateAdminNotes(admin.id, userId, notes);
  }

  @Delete('users/:userId')
  @UseGuards(SuperAdminGuard)
  deleteUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
  ) {
    return this.adminService.deleteUser(admin.id, userId);
  }

  @Post('users/bulk')
  @UseGuards(SuperAdminGuard)
  bulkUserAction(
    @CurrentUser() admin: any,
    @Body() dto: BulkUserActionDto,
  ): Promise<BulkActionResponse> {
    return this.adminService.bulkUserAction(admin.id, dto);
  }

  @Get('users/export/csv')
  async exportUsersCSV(
    @Query() query: UserQueryDto,
    @Res() res: Response,
  ) {
    const users = await this.adminService.exportUsers(query);
    const csv = this.convertToCSV(users);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.status(HttpStatus.OK).send(csv);
  }

  @Get('users/export/json')
  async exportUsersJSON(
    @Query() query: UserQueryDto,
    @Res() res: Response,
  ) {
    const users = await this.adminService.exportUsers(query);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');
    res.status(HttpStatus.OK).json(users);
  }

  // ============ ACCOUNT DELETION REQUESTS ============
  @Get('deletion-requests')
  async getDeletionRequests(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getDeletionRequests({ status, page, limit });
  }

  @Get('deletion-requests/stats')
  async getDeletionRequestStats() {
    return this.adminService.getDeletionRequestStats();
  }

  @Post('deletion-requests/:requestId/approve')
  @UseGuards(SuperAdminGuard)
  async approveDeletionRequest(
    @CurrentUser() admin: any,
    @Param('requestId') requestId: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.adminService.processDeletionRequest(admin.id, requestId, 'approve', adminNotes);
  }

  @Post('deletion-requests/:requestId/reject')
  @UseGuards(SuperAdminGuard)
  async rejectDeletionRequest(
    @CurrentUser() admin: any,
    @Param('requestId') requestId: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.adminService.processDeletionRequest(admin.id, requestId, 'reject', adminNotes);
  }

  // ============ REPORT MANAGEMENT (Moderators can view and resolve reports) ============
  @Get('reports')
  getReports(@Query() query: ReportQueryDto) {
    return this.adminService.getReports(query);
  }

  @Get('reports/stats')
  getReportStats() {
    return this.adminService.getReportStats();
  }

  @Get('reports/:reportId')
  getReportById(@Param('reportId') reportId: string) {
    return this.adminService.getReportById(reportId);
  }

  @Post('reports/:reportId/resolve')
  resolveReport(
    @CurrentUser() admin: any,
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveReport(admin.id, reportId, dto);
  }

  @Post('reports/:reportId/assign')
  assignReport(
    @CurrentUser() admin: any,
    @Param('reportId') reportId: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.adminService.assignReport(admin.id, reportId, assigneeId);
  }

  @Get('reports/user/:userId')
  getReportsByUser(@Param('userId') userId: string) {
    return this.adminService.getReportsByUser(userId);
  }

  // ============ ANALYTICS (Super Admin Only) ============
  @Get('analytics/user-growth')
  @UseGuards(SuperAdminGuard)
  getUserGrowth(@Query() dateRange: DateRangeDto) {
    return this.adminService.getUserGrowth(dateRange);
  }

  @Get('analytics/demographics')
  @UseGuards(SuperAdminGuard)
  getUserDemographics() {
    return this.adminService.getUserDemographics();
  }

  @Get('analytics/content')
  @UseGuards(SuperAdminGuard)
  getContentAnalytics(@Query() dateRange: DateRangeDto) {
    return this.adminService.getContentAnalytics(dateRange);
  }

  @Get('analytics/engagement')
  @UseGuards(SuperAdminGuard)
  getEngagementMetrics(@Query('days') days?: number): Promise<EngagementMetricsResponse> {
    return this.adminService.getEngagementMetrics(days);
  }

  // ============ SETTINGS (Super Admin Only for write, read is public but settings read is admin) ============
  @Get('settings')
  getAllSettings() {
    return this.adminService.getAllSettings();
  }

  @Get('settings/public')
  getPublicSettings() {
    return this.adminService.getPublicSettings();
  }

  @Get('settings/:key')
  getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Put('settings/:key')
  @UseGuards(SuperAdminGuard)
  updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.adminService.updateSetting(key, dto);
  }

  @Get('features')
  getAllFeatures() {
    return this.adminService.getAllFeatures();
  }

  @Get('features/:name')
  getFeatureFlag(@Param('name') name: string) {
    return this.adminService.getFeatureFlag(name);
  }

  @Put('features/:name')
  @UseGuards(SuperAdminGuard)
  updateFeatureFlag(
    @Param('name') name: string,
    @Body() dto: FeatureFlagDto,
  ) {
    return this.adminService.updateFeatureFlag(name, dto);
  }

  // ============ ANNOUNCEMENTS (Super Admin Only) ============
  @Post('announcements')
  @UseGuards(SuperAdminGuard)
  createAnnouncement(
    @CurrentUser() admin: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.adminService.createAnnouncement(admin.id, dto);
  }

  @Get('announcements')
  @UseGuards(SuperAdminGuard)
  getAllAnnouncements(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('active') active?: string,
  ) {
    return this.adminService.getAllAnnouncements(page, limit, active);
  }

  @Get('announcements/active')
  @UseGuards(SuperAdminGuard)
  getActiveAnnouncements(@CurrentUser() user: any) {
    return this.adminService.getActiveAnnouncements(user?.id);
  }

  @Get('announcements/:id')
  @UseGuards(SuperAdminGuard)
  getAnnouncementById(@Param('id') id: string) {
    return this.adminService.getAnnouncementById(id);
  }

  @Put('announcements/:id')
  @UseGuards(SuperAdminGuard)
  updateAnnouncement(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.adminService.updateAnnouncement(admin.id, id, dto);
  }

  @Delete('announcements/:id')
  @UseGuards(SuperAdminGuard)
  deleteAnnouncement(
    @CurrentUser() admin: any,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteAnnouncement(admin.id, id);
  }

  // ============ SECURITY (Super Admin Only) ============
  @Get('security/blocked-ips')
  @UseGuards(SuperAdminGuard)
  getBlockedIPs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getBlockedIPs(page, limit);
  }

  @Post('security/block-ip')
  @UseGuards(SuperAdminGuard)
  blockIP(@Body() dto: BlockIpDto) {
    return this.adminService.blockIP(dto);
  }

  @Delete('security/block-ip/:ip')
  @UseGuards(SuperAdminGuard)
  unblockIP(@Param('ip') ip: string) {
    return this.adminService.unblockIP(ip);
  }

  @Get('security/rate-limits')
  @UseGuards(SuperAdminGuard)
  getRateLimits() {
    return this.adminService.getRateLimits();
  }

  @Post('security/rate-limits')
  @UseGuards(SuperAdminGuard)
  updateRateLimit(@Body() dto: RateLimitDto) {
    return this.adminService.updateRateLimit(dto);
  }

  @Get('security/sessions')
  @UseGuards(SuperAdminGuard)
  getActiveSessions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getActiveSessions(page, limit);
  }

  @Delete('security/sessions/:sessionId')
  @UseGuards(SuperAdminGuard)
  terminateSession(@Param('sessionId') sessionId: string) {
    return this.adminService.terminateSession(sessionId);
  }

  @Delete('security/sessions/user/:userId')
  @UseGuards(SuperAdminGuard)
  terminateAllUserSessions(@Param('userId') userId: string) {
    return this.adminService.terminateAllUserSessions(userId);
  }

  @Get('security/login-attempts')
  @UseGuards(SuperAdminGuard)
  getLoginAttempts(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getLoginAttempts(days, page, limit);
  }

  @Get('security/login-attempts/failed/grouped')
  @UseGuards(SuperAdminGuard)
  getFailedLoginAttempts(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
  ) {
    return this.adminService.getFailedLoginAttempts(days);
  }

  // ============ MAINTENANCE (Super Admin Only) ============
  @Post('maintenance/backup/create')
  @UseGuards(SuperAdminGuard)
  createBackup(@Body() dto: BackupDto) {
    return this.adminService.createBackup(dto);
  }

  @Get('maintenance/backup/list')
  @UseGuards(SuperAdminGuard)
  getBackups() {
    return this.adminService.getBackups();
  }

  @Get('maintenance/backup/download/:id')
  @UseGuards(SuperAdminGuard)
  async downloadBackup(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const backup = await this.adminService.getBackupFile(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.filename}`);
    res.status(HttpStatus.OK).send(backup.data);
  }

  @Post('maintenance/backup/restore/:id')
  @UseGuards(SuperAdminGuard)
  restoreBackup(@Param('id') id: string) {
    return this.adminService.restoreBackup(id);
  }

  @Delete('maintenance/backup/:id')
  @UseGuards(SuperAdminGuard)
  deleteBackup(@Param('id') id: string) {
    return this.adminService.deleteBackup(id);
  }

  @Get('maintenance/health')
  @UseGuards(SuperAdminGuard)
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Post('maintenance/cache/clear')
  @UseGuards(SuperAdminGuard)
  clearCache() {
    return this.adminService.clearCache();
  }

  @Get('maintenance/database/stats')
  @UseGuards(SuperAdminGuard)
  getDatabaseStats() {
    return this.adminService.getDatabaseStats();
  }

  @Post('maintenance/database/optimize')
  @UseGuards(SuperAdminGuard)
  optimizeDatabase() {
    return this.adminService.optimizeDatabase();
  }

  private convertToCSV(users: any[]): string {
    if (users.length === 0) return '';
    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(user =>
      Object.values(user).map(value =>
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  }
}