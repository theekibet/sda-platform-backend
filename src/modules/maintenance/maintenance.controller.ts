import { 
  Controller, Get, Post, Delete, Body, Param, Query, 
  UseGuards, Res, HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { BackupDto } from './dto/backup.dto';

@Controller('admin/maintenance')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // ============ BACKUP ============
  @Post('backup/create')
  createBackup(@Body() dto: BackupDto) {
    return this.maintenanceService.createBackup(dto);
  }

  @Get('backup/list')
  getBackups() {
    return this.maintenanceService.getBackups();
  }

  @Get('backup/download/:id')
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
  restoreBackup(@Param('id') id: string) {
    return this.maintenanceService.restoreBackup(id);
  }

  @Delete('backup/:id')
  deleteBackup(@Param('id') id: string) {
    return this.maintenanceService.deleteBackup(id);
  }

  // ============ SYSTEM HEALTH ============
  @Get('health')
  getSystemHealth() {
    return this.maintenanceService.getSystemHealth();
  }

  // ============ CACHE ============
  @Post('cache/clear')
  clearCache() {
    return this.maintenanceService.clearCache();
  }

  // ============ DATABASE ============
  @Get('database/stats')
  getDatabaseStats() {
    return this.maintenanceService.getDatabaseStats();
  }

  @Post('database/optimize')
  optimizeDatabase() {
    return this.maintenanceService.optimizeDatabase();
  }
}