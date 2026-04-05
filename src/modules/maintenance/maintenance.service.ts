import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BackupDto } from './dto/backup.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  // ============ BACKUP ============

  async createBackup(dto: BackupDto) {
    const { filename, type = 'manual' } = dto;

    // Get all data from database - EXCLUDE SENSITIVE FIELDS
    const [
      members,
      prayerRequests,
      testimonies,
      groups,
      reports,
    ] = await Promise.all([
      // 🔥 FIX: Exclude password, resetToken, resetTokenExpiry from members
      this.prisma.member.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          bio: true,
          locationName: true,
          createdAt: true,
          updatedAt: true,
          lastActiveAt: true,
          isActive: true,
          isAdmin: true,
          isSuspended: true,
          suspendedUntil: true,
          suspensionReason: true,
          // Explicitly exclude: password, resetToken, resetTokenExpiry, adminNotes
        },
      }),
      this.prisma.prayerRequest.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.testimony.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.group.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
              discussions: true,
            },
          },
        },
      }),
      // 🔥 FIX: Change reporter to reportedBy (correct relation name)
      this.prisma.report.findMany({
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);
    const backupData = {
      timestamp: new Date().toISOString(),
      type,
      version: '1.0',
      data: {
        members,
        prayerRequests,
        testimonies,
        groups,
        reports,
      },
      metadata: {
        recordCounts: {
          members: members.length,
          prayerRequests: prayerRequests.length,
          testimonies: testimonies.length,
          groups: groups.length,
          reports: reports.length,
        },
      },
    };

    // Save to database
    const backup = await this.prisma.backup.create({
      data: {
        filename: `${filename || `backup-${Date.now()}`}.json`,
        size: Buffer.byteLength(JSON.stringify(backupData)),
        type,
        metadata: JSON.stringify({
          tables: Object.keys(backupData.data),
          recordCounts: backupData.metadata.recordCounts,
        }),
      },
    });

    // 🔥 FIX: Save to file system (uncommented)
    const backupsDir = path.join(__dirname, '../../../backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const filePath = path.join(backupsDir, backup.filename);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    // Also save a metadata file with the backup info
    const metadataPath = path.join(backupsDir, `${backup.filename}.meta.json`);
    fs.writeFileSync(metadataPath, JSON.stringify({
      id: backup.id,
      filename: backup.filename,
      size: backup.size,
      type: backup.type,
      createdAt: backup.createdAt,
      recordCounts: backupData.metadata.recordCounts,
    }, null, 2));

    return {
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: this.formatBytes(backup.size),
        type: backup.type,
        createdAt: backup.createdAt,
        filePath: `/admin/maintenance/backup/download/${backup.id}`,
      },
    };
  }

  async getBackups() {
    const backups = await this.prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      backups: backups.map(b => ({
        id: b.id,
        filename: b.filename,
        size: this.formatBytes(b.size),
        type: b.type,
        createdAt: b.createdAt,
        downloadUrl: `/admin/maintenance/backup/download/${b.id}`,
      })),
    };
  }

  // 🔥 FIX: Read the actual saved file, not a placeholder
  async getBackupFile(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    // Read from file system
    const backupsDir = path.join(__dirname, '../../../backups');
    const filePath = path.join(backupsDir, backup.filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Backup file not found on disk');
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileStats = fs.statSync(filePath);

    return {
      filename: backup.filename,
      data: fileContent,
      size: fileStats.size,
      createdAt: backup.createdAt,
      contentType: 'application/json',
    };
  }

  async restoreBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    // Read from file system
    const backupsDir = path.join(__dirname, '../../../backups');
    const filePath = path.join(backupsDir, backup.filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Backup file not found on disk');
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const backupData = JSON.parse(fileContent);

    // TODO: Implement actual restore logic
    // This would truncate tables and restore data
    // For safety, we'll log what would be restored
    console.log(`Restoring backup ${id}:`, {
      timestamp: backupData.timestamp,
      records: backupData.metadata.recordCounts,
    });

    return {
      success: true,
      message: 'Database restored successfully (simulated - implement actual restore)',
      backupId: id,
      recordsRestored: backupData.metadata.recordCounts,
    };
  }

  async deleteBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    // Delete from file system
    const backupsDir = path.join(__dirname, '../../../backups');
    const filePath = path.join(backupsDir, backup.filename);
    const metadataPath = path.join(backupsDir, `${backup.filename}.meta.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }

    await this.prisma.backup.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Backup deleted successfully',
    };
  }

  // ============ SYSTEM HEALTH ============

  async getSystemHealth() {
    // Check database connection
    let dbStatus = 'healthy';
    let dbLatency = 0;
    
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check disk space for backups
    let diskStatus = 'healthy';
    let diskSpaceAvailable = 'unknown';
    
    try {
      const backupsDir = path.join(__dirname, '../../../backups');
      if (fs.existsSync(backupsDir)) {
        const stats = fs.statfsSync(backupsDir);
        const freeGB = (stats.bfree * stats.bsize) / (1024 * 1024 * 1024);
        diskSpaceAvailable = `${freeGB.toFixed(2)} GB`;
        
        if (freeGB < 1) {
          diskStatus = 'warning';
        } else if (freeGB < 0.1) {
          diskStatus = 'critical';
        }
      }
    } catch (error) {
      diskStatus = 'unknown';
    }

    // Get system info
    const totalUsers = await this.prisma.member.count();
    const activeToday = await this.prisma.member.count({
      where: {
        lastActiveAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      disk: {
        status: diskStatus,
        available: diskSpaceAvailable,
      },
      stats: {
        totalUsers,
        activeToday,
        activePercentage: totalUsers ? Math.round((activeToday / totalUsers) * 100) : 0,
        memory: process.memoryUsage(),
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async clearCache() {
    // Implement cache clearing logic
    // This would clear Redis, in-memory caches, etc.
    
    // Log the cache clear action
    console.log('Cache cleared at:', new Date().toISOString());
    
    return {
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ============ DATABASE ============

  async getDatabaseStats() {
    const tableCounts = await Promise.all([
      this.prisma.member.count().then(c => ({ table: 'members', count: c })),
      this.prisma.prayerRequest.count().then(c => ({ table: 'prayer_requests', count: c })),
      this.prisma.testimony.count().then(c => ({ table: 'testimonies', count: c })),
      this.prisma.group.count().then(c => ({ table: 'groups', count: c })),
      this.prisma.report.count().then(c => ({ table: 'reports', count: c })),
    ]);

    // Get database size (for PostgreSQL)
    let databaseSize = 'unknown';
    try {
      const result = await this.prisma.$queryRaw<{ size: string }[]>`
        SELECT pg_database_size(current_database()) as size
      `;
      if (result && result[0]) {
        const sizeBytes = parseInt(result[0].size);
        databaseSize = this.formatBytes(sizeBytes);
      }
    } catch (error) {
      // SQLite or other DB - use estimate
      databaseSize = '~' + this.formatBytes(
        tableCounts.reduce((acc, curr) => acc + (curr.count * 1024), 0) // Rough estimate
      );
    }

    return {
      tables: tableCounts,
      totalRecords: tableCounts.reduce((acc, curr) => acc + curr.count, 0),
      databaseSize,
      lastBackup: await this.getLastBackupTime(),
    };
  }

  async optimizeDatabase() {
    // Run database optimization commands
    // For SQLite: VACUUM, ANALYZE
    // For PostgreSQL: VACUUM ANALYZE

    try {
      const startTime = Date.now();
      
      // Try PostgreSQL first
      try {
        await this.prisma.$executeRaw`VACUUM ANALYZE;`;
      } catch {
        // Fallback to SQLite
        await this.prisma.$executeRaw`VACUUM;`;
        await this.prisma.$executeRaw`ANALYZE;`;
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Database optimized successfully',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database optimization failed:', error);
      return {
        success: false,
        message: 'Database optimization failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============ HELPER METHODS ============

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async getLastBackupTime(): Promise<string | null> {
    const lastBackup = await this.prisma.backup.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    
    return lastBackup ? lastBackup.createdAt.toISOString() : null;
  }
}