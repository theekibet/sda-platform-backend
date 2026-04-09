import { 
  Controller, Get, Post, Delete, Body, Param, Query, 
  UseGuards, Res, HttpStatus
} from '@nestjs/common';
// FIXED: Changed to import type
import type { Response } from 'express';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModeratorGuard } from '../../common/guards/moderator.guard'; // ✅ CHANGED from AdminGuard
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'; // ✅ ADDED
import { BackupDto } from './dto/backup.dto';

@Controller('admin/maintenance')
@UseGuards(JwtAuthGuard, ModeratorGuard) // ✅ CHANGED: Base guard allows moderators
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // ============ BACKUP (Super Admin Only) ============

  @Post('backup/create')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  createBackup(@Body() dto: BackupDto) {
    return this.maintenanceService.createBackup(dto);
  }

  @Get('backup/list')
  @UseGuards(SuperAdminGuard) // ✅ ADDED: Backup access is super admin only
  getBackups() {
    return this.maintenanceService.getBackups();
  }

  @Get('backup/download/:id')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  async downloadBackup(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const backup = await this.maintenanceService.getBackupFile(id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.filename}`);
    res.status(HttpStatus.OK).send(backup.data);
  }

  @Post('backup/restore/:id')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  restoreBackup(@Param('id') id: string) {
    return this.maintenanceService.restoreBackup(id);
  }

  @Delete('backup/:id')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  deleteBackup(@Param('id') id: string) {
    return this.maintenanceService.deleteBackup(id);
  }

  // ============ SYSTEM HEALTH (Moderator + Super Admin) ============

  @Get('health')
  getSystemHealth() {
    return this.maintenanceService.getSystemHealth();
  }

  // ============ CACHE (Super Admin Only) ============

  @Post('cache/clear')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  clearCache() {
    return this.maintenanceService.clearCache();
  }

  // ============ DATABASE ============

  @Get('database/stats')
  getDatabaseStats() {
    return this.maintenanceService.getDatabaseStats();
  }

  @Post('database/optimize')
  @UseGuards(SuperAdminGuard) // ✅ ADDED
  optimizeDatabase() {
    return this.maintenanceService.optimizeDatabase();
  }
}