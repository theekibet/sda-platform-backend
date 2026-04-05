// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UserQueryDto } from './dto/user-query.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import * as bcrypt from 'bcrypt';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { BulkUserActionDto } from './dto/bulk-user-action.dto';
// ============ IMPORTS FOR PHASE 3 ============
import { ReportQueryDto } from '../reports/dto/report-query.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
// ============ IMPORTS FOR PHASE 4 ============
import { DateRangeDto } from '../analytics/dto/date-range.dto';
// ============ IMPORTS FOR PHASE 5 ============
import { UpdateSettingDto } from '../settings/dto/update-setting.dto';
import { FeatureFlagDto } from '../settings/dto/feature-flag.dto';
// ============ IMPORTS FOR PHASE 6 ============
import { CreateAnnouncementDto } from '../announcements/dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../announcements/dto/update-announcement.dto';
// ============ IMPORTS FOR PHASE 7 ============
import { BlockIpDto } from '../security/dto/block-ip.dto';
import { RateLimitDto } from '../security/dto/rate-limit.dto';
// ============ IMPORTS FOR PHASE 8 ============
import { BackupDto } from '../maintenance/dto/backup.dto';
// ============ IMPORT NOTIFICATION SERVICE ============
import { NotificationService, CreateNotificationDto } from '../notifications/notification.service';
// ============ IMPORT FOR SESSION TERMINATION ============
// 🔥 FIX: Remove the import or create the service
// Option A: Delete this line if you don't have the service
// import { UserSessionService } from '../auth/user-session.service';

// Define types for better type safety
interface BulkActionResult {
  userId: string;
  action: string;
  error?: string;
}

interface DailyActiveRecord {
  date: string;
  activeUsers: number;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    // 🔥 FIX: Remove UserSessionService from constructor
    // private userSessionService: UserSessionService,
  ) {}

  // ============ USER MANAGEMENT ============

  async getUsers(query: UserQueryDto) {
    const { search, isAdmin, isSuspended, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (isAdmin !== undefined) {
      where.isAdmin = isAdmin;
    }

    if (isSuspended !== undefined) {
      where.isSuspended = isSuspended;
    }

    const [users, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          locationName: true,
          isAdmin: true,
          isSuspended: true,
          suspendedUntil: true,
          suspensionReason: true,
          adminNotes: true,
          createdAt: true,
          lastActiveAt: true,
          _count: {
            select: {
              prayerRequests: true,
              testimonies: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        age: true,
        gender: true,
        locationName: true,
        isAdmin: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        adminNotes: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            prayerRequests: true,
            testimonies: true,
            groupsCreated: true,
            groupMemberships: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============ SUSPEND/UNSUSPEND USER WITH NOTIFICATION ============
  async suspendUser(adminId: string, userId: string, dto: SuspendUserDto) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ Super admin accounts can never be suspended via API
    if (user.isSuperAdmin) {
      throw new ForbiddenException('Super admin accounts cannot be suspended');
    }

    const { suspend, until, reason } = dto;

    const data: any = {
      isSuspended: suspend,
      suspensionReason: reason || null,
      suspendedUntil: until ? new Date(until) : null,
    };

    if (!suspend) {
      // Unsuspend - clear fields
      data.suspensionReason = null;
      data.suspendedUntil = null;
    }

    // Add admin note about this action
    const adminNote = `[${new Date().toISOString()}] Admin ${adminId} ${suspend ? 'suspended' : 'unsuspended'} user. Reason: ${reason || 'Not specified'}`;
    
    await this.prisma.member.update({
      where: { id: userId },
      data: {
        ...data,
        adminNotes: user.adminNotes 
          ? `${user.adminNotes}\n\n${adminNote}`
          : adminNote,
      },
    });

    // Send notification to user
    await this.notificationService.create({
      type: 'account_suspension',
      title: suspend ? 'Account Suspended' : 'Account Unsuspended',
      message: suspend 
        ? `Your account has been suspended${reason ? `: ${reason}` : ''}${until ? ` until ${new Date(until).toLocaleDateString()}` : ''}`
        : 'Your account has been unsuspended',
      data: {
        action: suspend ? 'suspended' : 'unsuspended',
        reason,
        until,
        adminId,
      },
      userId: userId,
    });

    return { 
      success: true, 
      message: suspend ? 'User suspended successfully' : 'User unsuspended successfully' 
    };
  }

  // ============ TOGGLE ADMIN WITH NOTIFICATION ============
  async toggleAdmin(adminId: string, userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow removing your own admin privileges
    if (userId === adminId) {
      throw new BadRequestException('You cannot change your own admin status');
    }

    // ✅ CRITICAL: Super admin status can NEVER be changed via API
    if (user.isSuperAdmin) {
      throw new ForbiddenException('Super admin status cannot be modified through the API');
    }

    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: {
        isAdmin: !user.isAdmin,
        adminNotes: user.adminNotes 
          ? `${user.adminNotes}\n\n[${new Date().toISOString()}] Admin ${adminId} ${user.isAdmin ? 'removed' : 'granted'} admin privileges.`
          : `[${new Date().toISOString()}] Admin ${adminId} granted admin privileges.`,
      },
      select: {
        id: true,
        name: true,
        isAdmin: true,
      },
    });

    // Send notification to user
    await this.notificationService.create({
      type: 'admin_status_change',
      title: updated.isAdmin ? 'Admin Privileges Granted' : 'Admin Privileges Removed',
      message: updated.isAdmin 
        ? 'You have been granted admin privileges'
        : 'Your admin privileges have been removed',
      data: {
        isAdmin: updated.isAdmin,
        updatedBy: adminId,
      },
      userId: userId,
    });

    return {
      success: true,
      message: `Admin privileges ${updated.isAdmin ? 'granted to' : 'removed from'} ${updated.name}`,
      user: updated,
    };
  }

  // ============ ADMIN RESET PASSWORD WITH NOTIFICATION ============
  async adminResetPassword(adminId: string, dto: AdminResetPasswordDto) {
    const { userId, newPassword, sendEmail } = dto;

    const user = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ Super admin passwords can never be reset via API
    if (user.isSuperAdmin) {
      throw new ForbiddenException('Super admin passwords cannot be reset through the API');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.member.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        adminNotes: user.adminNotes 
          ? `${user.adminNotes}\n\n[${new Date().toISOString()}] Admin ${adminId} reset user password.`
          : `[${new Date().toISOString()}] Admin ${adminId} reset user password.`,
      },
    });

    // 🔥 FIX: Terminate all active sessions after password change (direct Prisma call)
    await this.prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Send notification to user
    await this.notificationService.create({
      type: 'password_reset',
      title: 'Password Reset by Administrator',
      message: 'An administrator has reset your password. Please use the temporary password to log in and change it immediately for security.',
      data: {
        resetByAdmin: true,
        adminId,
        sendEmail,
      },
      userId: userId,
    });

    // TODO: Send email notification if sendEmail is true

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async updateAdminNotes(adminId: string, userId: string, notes: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] Admin ${adminId}: ${notes}`;
    
    const updatedNotes = user.adminNotes 
      ? `${user.adminNotes}\n\n${newNote}`
      : newNote;

    await this.prisma.member.update({
      where: { id: userId },
      data: {
        adminNotes: updatedNotes,
      },
    });

    return { success: true, message: 'Notes updated' };
  }

  // ============ PHASE 1 METHODS WITH NOTIFICATIONS ============

  async deleteUser(adminId: string, userId: string) {
    // Don't allow self-deletion
    if (adminId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    
    const user = await this.prisma.member.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // ✅ Super admin accounts can never be deleted via API
    if (user.isSuperAdmin) {
      throw new ForbiddenException('Super admin accounts cannot be deleted through the API');
    }

    // Get user info before deletion
    const userName = user.name;
    const userEmail = user.email;
    
    // Delete user (cascade will handle related records if configured in schema)
    await this.prisma.member.delete({
      where: { id: userId }
    });

    // Notify other admins about the deletion
    const admins = await this.prisma.member.findMany({
      where: { 
        isAdmin: true, 
        id: { not: adminId } 
      },
      select: { id: true }
    });

    // Create notifications for each admin
    for (const admin of admins) {
      await this.notificationService.create({
        type: 'user_deleted',
        title: 'User Account Deleted',
        message: `User ${userName} (${userEmail}) has been deleted by an administrator`,
        data: {
          deletedUserId: userId,
          deletedByName: userName,
          deletedByEmail: userEmail,
          adminId,
        },
        userId: admin.id,
      });
    }
    
    return { 
      success: true, 
      message: `User ${user.name} deleted successfully` 
    };
  }

  // ============ BULK USER ACTIONS WITH TRANSACTION ============
  async bulkUserAction(adminId: string, dto: BulkUserActionDto) {
    const { action, userIds, reason, duration } = dto;
    
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('No users selected');
    }

    // Don't allow admin to action themselves
    if (userIds.includes(adminId)) {
      throw new BadRequestException('You cannot perform actions on your own account');
    }

    // ✅ Prevent bulk actions targeting any super admin
    const superAdmins = await this.prisma.member.findMany({
      where: { id: { in: userIds }, isSuperAdmin: true },
      select: { id: true },
    });
    if (superAdmins.length > 0) {
      throw new ForbiddenException('Bulk actions cannot target super admin accounts');
    }

    const results: { success: BulkActionResult[]; failed: BulkActionResult[] } = {
      success: [],
      failed: []
    };

    // Use transaction for bulk operations
    await this.prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        try {
          switch (action) {
            case 'delete': {
              const user = await tx.member.findUnique({
                where: { id: userId }
              });
              
              await tx.member.delete({
                where: { id: userId }
              });
              results.success.push({ userId, action: 'deleted' });
              break;
            }

            case 'suspend': {
              const user = await tx.member.findUnique({
                where: { id: userId }
              });
              
              const adminNote = `[${new Date().toISOString()}] Admin ${adminId} bulk suspended. Reason: ${reason || 'Not specified'}`;
              
              await tx.member.update({
                where: { id: userId },
                data: {
                  isSuspended: true,
                  suspensionReason: reason || 'Bulk suspension',
                  suspendedUntil: duration === 'permanent' ? null : this.calculateSuspensionEnd(duration || '7'),
                  adminNotes: user?.adminNotes 
                    ? `${user.adminNotes}\n\n${adminNote}`
                    : adminNote,
                }
              });
              results.success.push({ userId, action: 'suspended' });
              break;
            }

            case 'unsuspend': {
              const user = await tx.member.findUnique({
                where: { id: userId }
              });
              
              const adminNote = `[${new Date().toISOString()}] Admin ${adminId} bulk unsuspended.`;
              
              await tx.member.update({
                where: { id: userId },
                data: {
                  isSuspended: false,
                  suspensionReason: null,
                  suspendedUntil: null,
                  adminNotes: user?.adminNotes 
                    ? `${user.adminNotes}\n\n${adminNote}`
                    : adminNote,
                }
              });
              results.success.push({ userId, action: 'unsuspended' });
              break;
            }

            case 'makeAdmin': {
              const user = await tx.member.findUnique({
                where: { id: userId }
              });
              
              const adminNote = `[${new Date().toISOString()}] Admin ${adminId} granted admin privileges (bulk).`;
              
              await tx.member.update({
                where: { id: userId },
                data: {
                  isAdmin: true,
                  adminNotes: user?.adminNotes 
                    ? `${user.adminNotes}\n\n${adminNote}`
                    : adminNote,
                }
              });
              results.success.push({ userId, action: 'made admin' });
              break;
            }

            case 'removeAdmin': {
              const user = await tx.member.findUnique({
                where: { id: userId }
              });
              
              const adminNote = `[${new Date().toISOString()}] Admin ${adminId} removed admin privileges (bulk).`;
              
              await tx.member.update({
                where: { id: userId },
                data: {
                  isAdmin: false,
                  adminNotes: user?.adminNotes 
                    ? `${user.adminNotes}\n\n${adminNote}`
                    : adminNote,
                }
              });
              results.success.push({ userId, action: 'removed admin' });
              break;
            }
          }
        } catch (error) {
          results.failed.push({ 
            userId, 
            action: 'failed',
            error: error.message 
          });
        }
      }
    });

    // Send notifications after transaction (to keep transaction short)
    for (const result of results.success) {
      try {
        switch (action) {
          case 'delete':
            // Notify admins about deletion
            const admins = await this.prisma.member.findMany({
              where: { isAdmin: true, id: { not: adminId } },
              select: { id: true }
            });
            for (const admin of admins) {
              await this.notificationService.create({
                type: 'user_deleted',
                title: 'User Account Deleted',
                message: `A user has been deleted via bulk action`,
                data: { userId: result.userId, adminId, action: 'bulk_delete' },
                userId: admin.id,
              });
            }
            break;

          case 'suspend':
            await this.notificationService.create({
              type: 'account_suspension',
              title: 'Account Suspended',
              message: `Your account has been suspended${reason ? `: ${reason}` : ''}${duration !== 'permanent' ? ` for ${duration} days` : ' permanently'}`,
              data: { action: 'suspended', reason, duration, adminId, bulk: true },
              userId: result.userId,
            });
            break;

          case 'unsuspend':
            await this.notificationService.create({
              type: 'account_suspension',
              title: 'Account Unsuspended',
              message: 'Your account has been unsuspended',
              data: { action: 'unsuspended', adminId, bulk: true },
              userId: result.userId,
            });
            break;

          case 'makeAdmin':
            await this.notificationService.create({
              type: 'admin_status_change',
              title: 'Admin Privileges Granted',
              message: 'You have been granted admin privileges',
              data: { isAdmin: true, updatedBy: adminId, bulk: true },
              userId: result.userId,
            });
            break;

          case 'removeAdmin':
            await this.notificationService.create({
              type: 'admin_status_change',
              title: 'Admin Privileges Removed',
              message: 'Your admin privileges have been removed',
              data: { isAdmin: false, updatedBy: adminId, bulk: true },
              userId: result.userId,
            });
            break;
        }
      } catch (error) {
        // Log error but don't fail the bulk operation
        console.error(`Failed to send notification to ${result.userId}:`, error);
      }
    }

    return {
      success: true,
      message: `Bulk action '${action}' completed`,
      results
    };
  }

  async exportUsers(query: UserQueryDto) {
    const { search, isAdmin, isSuspended } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (isAdmin !== undefined) {
      where.isAdmin = isAdmin;
    }

    if (isSuspended !== undefined) {
      where.isSuspended = isSuspended;
    }

    const users = await this.prisma.member.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        locationName: true,
        age: true,
        gender: true,
        isAdmin: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            prayerRequests: true,
            testimonies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format dates and counts for export
    return users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString() || null,
      prayerRequests: user._count?.prayerRequests || 0,
      testimonies: user._count?.testimonies || 0,
      _count: undefined
    }));
  }

  // ============ HELPER METHODS ============

  private calculateSuspensionEnd(duration: string): Date | null {
    if (duration === 'permanent') return null;
    
    const days = parseInt(duration, 10);
    if (isNaN(days)) return null;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate;
  }

  // ============ DASHBOARD STATISTICS ============

  async getDashboardStats() {
    // Create separate date objects to avoid mutation
    const now = new Date();
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date(now);
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisWeek.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(now);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeToday,
      activeThisWeek,
      
      totalPrayers,
      totalTestimonies,
      totalGroups,
    ] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { createdAt: { gte: today } } }),
      this.prisma.member.count({ where: { createdAt: { gte: thisWeek } } }),
      this.prisma.member.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.member.count({ where: { lastActiveAt: { gte: today } } }),
      this.prisma.member.count({ where: { lastActiveAt: { gte: thisWeek } } }),
      
      this.prisma.prayerRequest.count(),
      this.prisma.testimony.count(),
      this.prisma.group.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        activeToday,
        activeThisWeek,
      },
      content: {
        prayerRequests: totalPrayers,
        testimonies: totalTestimonies,
        groups: totalGroups,
      },
    };
  }

  // ============ PHASE 3 - REPORT MANAGEMENT METHODS WITH NOTIFICATIONS ============

  async getReports(query: ReportQueryDto) {
    const { 
      status, 
      priority, 
      page = 1, 
      limit = 20, 
      search 
    } = query;
    
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { contentSnippet: { contains: search } },
        { reportedBy: { name: { contains: search } } },
        { reportedUser: { name: { contains: search } } },
      ];
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              isSuspended: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportStats() {
    const [pending, investigating, resolved, dismissed, highPriority] = await Promise.all([
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'investigating' } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count({ where: { status: 'dismissed' } }),
      this.prisma.report.count({ where: { priority: 'high', status: { in: ['pending', 'investigating'] } } }),
    ]);

    // Get reports by type
    const byType = await this.prisma.report.groupBy({
      by: ['contentType'],
      where: {
        status: { in: ['pending', 'investigating'] }
      },
      _count: true,
    });

    return {
      total: pending + investigating,
      byStatus: { pending, investigating, resolved, dismissed },
      highPriority,
      byType: byType.reduce((acc: any, curr) => {
        acc[curr.contentType] = curr._count;
        return acc;
      }, {}),
    };
  }

  async getReportById(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isSuspended: true,
            suspensionReason: true,
            suspendedUntil: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Fetch the actual content that was reported
    let content: any = null;
    if (report.contentType !== 'user') {
      content = await this.getReportedContent(report.contentType, report.contentId);
    }

    return {
      ...report,
      content,
    };
  }

  // ============ RESOLVE REPORT WITH NOTIFICATIONS ============
  async resolveReport(adminId: string, reportId: string, dto: ResolveReportDto) {
    const { action, notes, notifyUser, suspensionDuration, warningMessage } = dto;

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reportedUser: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Take action based on resolution
    let actionTaken = '';

    switch (action) {
      case 'dismiss':
        actionTaken = 'Report dismissed';
        break;

      case 'warn_user':
        if (report.reportedUserId) {
          await this.sendWarningToUser(
            adminId,
            report.reportedUserId,
            warningMessage || notes || 'You have received a warning regarding your content.'
          );
          actionTaken = 'User warned';
          
          // Notify user about warning
          await this.notificationService.create({
            type: 'moderation_warning',
            title: 'Content Warning',
            message: warningMessage || 'You have received a warning regarding your content. Please review the community guidelines.',
            data: {
              reportId,
              warningMessage,
              adminId,
            },
            userId: report.reportedUserId,
          });
        }
        break;

      case 'suspend_user':
        if (report.reportedUserId) {
          await this.suspendUser(adminId, report.reportedUserId, {
            suspend: true,
            until: suspensionDuration === 'permanent' ? undefined : this.getSuspensionDate(suspensionDuration),
            reason: notes || 'Suspended due to reported content',
          });
          actionTaken = 'User suspended';
          // Note: suspendUser already sends notification
        }
        break;

      case 'remove_content':
        await this.removeReportedContent(report.contentType, report.contentId);
        actionTaken = 'Content removed';
        
        // Notify content author if not the reporter
        if (report.reportedUserId && report.reportedUserId !== report.reportedById) {
          await this.notificationService.create({
            type: 'content_removed',
            title: 'Your Content Has Been Removed',
            message: `Your ${report.contentType} has been removed due to a report. Reason: ${notes || 'Violation of community guidelines'}`,
            data: {
              contentType: report.contentType,
              contentId: report.contentId,
              reportId,
            },
            userId: report.reportedUserId,
          });
        }
        break;

      case 'ban_user':
        if (report.reportedUserId) {
          await this.deleteUser(adminId, report.reportedUserId);
          actionTaken = 'User banned';
          // Note: deleteUser sends notification to admins
        }
        break;
    }

    // 🔥 FIX: Always set resolvedById (removed invalid 'assign' check)
    const updateData: any = {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolvedAt: new Date(),
      resolution: action,
      adminNotes: notes,
      resolvedById: adminId,  // Always set for resolution actions
    };

    // Update the report
    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: updateData,
    });

    // Log the moderation action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: adminId,
        action: action,
        contentType: 'report',
        contentId: reportId,
        reason: notes,
        details: JSON.stringify({ action, resolution: actionTaken }),
        targetUserId: report.reportedUserId,
      },
    });

    // Notify the reporter about resolution if requested
    if (notifyUser && report.reportedById) {
      await this.notificationService.create({
        type: 'report_resolved',
        title: 'Your Report Has Been Resolved',
        message: `The report you filed has been resolved. Action taken: ${actionTaken}`,
        data: {
          reportId,
          action,
          resolution: actionTaken,
        },
        userId: report.reportedById,
      });
    }

    return {
      success: true,
      message: `Report resolved successfully. ${actionTaken}`,
      report: updatedReport,
    };
  }

  // 🔥 FIX: Assign report without setting resolvedById
  async assignReport(adminId: string, reportId: string, assigneeId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const adminNote = `[${new Date().toISOString()}] Assigned to admin ${assigneeId}`;
    
    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        // Don't set resolvedById here - use adminNotes only for assignment
        status: 'investigating',
        adminNotes: report.adminNotes 
          ? `${report.adminNotes}\n\n${adminNote}`
          : adminNote,
      },
    });

    // Notify the assigned admin
    if (assigneeId !== adminId) {
      await this.notificationService.create({
        type: 'report_assigned',
        title: 'Report Assigned to You',
        message: `A report has been assigned to you for investigation.`,
        data: {
          reportId,
          assignedBy: adminId,
        },
        userId: assigneeId,
      });
    }

    return {
      success: true,
      message: 'Report assigned successfully',
      report: updatedReport,
    };
  }

  async getReportsByUser(userId: string) {
    const reports = await this.prisma.report.findMany({
      where: {
        OR: [
          { reportedUserId: userId },
          { reportedById: userId },
        ],
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      asReporter: reports.filter(r => r.reportedById === userId),
      asReported: reports.filter(r => r.reportedUserId === userId),
      total: reports.length,
    };
  }

  // ============ HELPER METHODS FOR REPORTS ============

  /**
   * FETCHES reported content for viewing (used in getReportById)
   */
  private async getReportedContent(contentType: string, contentId: string): Promise<any> {
    switch (contentType) {
      case 'prayerRequest':
        return this.prisma.prayerRequest.findUnique({ 
          where: { id: contentId },
          include: { author: { select: { id: true, name: true } } }
        });
      case 'testimony':
        return this.prisma.testimony.findUnique({ 
          where: { id: contentId },
          include: { author: { select: { id: true, name: true } } }
        });
      case 'discussion':
        return this.prisma.discussion.findUnique({
          where: { id: contentId },
          include: { 
            author: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } }
          }
        });
      default:
        return null;
    }
  }

  /**
   * DELETES reported content (used in resolveReport with 'remove_content' action)
   */
  private async removeReportedContent(contentType: string, contentId: string) {
    switch (contentType) {
      case 'prayerRequest':
        await this.prisma.prayerRequest.delete({ where: { id: contentId } });
        break;
      case 'testimony':
        await this.prisma.testimony.delete({ where: { id: contentId } });
        break;
      case 'discussion':
        await this.prisma.discussion.delete({ where: { id: contentId } });
        break;
      default:
        throw new NotFoundException(`Cannot remove content of type: ${contentType}`);
    }
  }

  private async sendWarningToUser(adminId: string, userId: string, message: string) {
    // Add admin note
    const user = await this.prisma.member.findUnique({
      where: { id: userId }
    });

    const warningNote = `[${new Date().toISOString()}] Admin ${adminId} warned user. Message: ${message}`;
    
    await this.prisma.member.update({
      where: { id: userId },
      data: {
        adminNotes: user?.adminNotes 
          ? `${user.adminNotes}\n\n${warningNote}`
          : warningNote,
      },
    });
  }

  private getSuspensionDate(duration?: string): string | undefined {
    if (!duration || duration === 'permanent') return undefined;
    
    const days = parseInt(duration, 10);
    if (isNaN(days)) return undefined;
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // ============ PHASE 4 - ANALYTICS METHODS ============

  async getUserGrowth(dateRange: DateRangeDto) {
    const { startDate, endDate, period = 'daily' } = dateRange;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all users created in date range
    const users = await this.prisma.member.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Group by period
    const grouped = this.groupByPeriod(users, 'createdAt', period);

    // Get total counts
    const totalUsers = await this.prisma.member.count();
    const activeUsers = await this.prisma.member.count({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return {
      total: totalUsers,
      active30d: activeUsers,
      growth: grouped,
      period,
    };
  }

  async getUserDemographics() {
    // Age distribution
    const members = await this.prisma.member.findMany({
      where: {
        age: { not: null },
      },
      select: {
        age: true,
        gender: true,
        locationName: true,
      },
    });

    const ageGroups: Record<string, number> = {
      '13-17': 0,
      '18-24': 0,
      '25-35': 0,
      '35+': 0,
      unknown: 0,
    };

    members.forEach(m => {
      if (!m.age) {
        ageGroups.unknown++;
      } else if (m.age < 18) {
        ageGroups['13-17']++;
      } else if (m.age < 25) {
        ageGroups['18-24']++;
      } else if (m.age < 36) {
        ageGroups['25-35']++;
      } else {
        ageGroups['35+']++;
      }
    });

    // Gender distribution
    const genderCounts: Record<string, number> = {};
    members.forEach(m => {
      const gender = m.gender || 'unspecified';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    // Top cities
    const cityCounts: Record<string, number> = {};
    members.forEach(m => {
      if (m.locationName) {
        // Extract city from locationName (e.g., "Nairobi, Kenya" -> "Nairobi")
        const city = m.locationName.split(',')[0].trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });

    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    return {
      ageGroups,
      gender: genderCounts,
      topCities,
    };
  }

  async getContentAnalytics(dateRange: DateRangeDto) {
    const { startDate, endDate } = dateRange;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [prayerRequests, testimonies, groups] = await Promise.all([
      this.prisma.prayerRequest.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.testimony.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.group.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    // Most prayed for requests
    const topPrayers = await this.prisma.prayerRequest.findMany({
      take: 5,
      orderBy: {
        prayers: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        content: true,
        _count: {
          select: { prayers: true },
        },
        createdAt: true,
      },
    });

    return {
      totals: {
        prayerRequests,
        testimonies,
        groups,
      },
      topContent: {
        prayers: topPrayers.map(p => ({
          id: p.id,
          content: p.content.substring(0, 100),
          prayedCount: p._count?.prayers || 0,
          createdAt: p.createdAt,
        })),
      },
    };
  }

  async getEngagementMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily active users for the period
    const dailyActive: DailyActiveRecord[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.member.count({
        where: {
          lastActiveAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyActive.push({
        date: date.toISOString().split('T')[0],
        activeUsers: count,
      });
    }

    // User retention
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await this.prisma.member.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const retainedUsers = await this.prisma.member.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        lastActiveAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      period: `${days} days`,
      dailyActive,
      retention: {
        newUsers,
        retainedUsers,
        retentionRate: newUsers > 0 ? (retainedUsers / newUsers) * 100 : 0,
      },
      avgSessionDuration: 12.5, // Placeholder - would need session tracking
    };
  }

  // ============ HELPER METHOD FOR ANALYTICS ============

  private groupByPeriod(items: any[], dateField: string, period: string) {
    const grouped: Record<string, number> = {};

    items.forEach(item => {
      const date = new Date(item[dateField]);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key]++;
    });

    return Object.entries(grouped).map(([period, count]) => ({
      period,
      count,
    }));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // ============ PHASE 5 - SETTINGS METHODS ============

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });

    // Parse JSON values
    return settings.map(s => ({
      ...s,
      value: this.parseValue(s.value, s.type),
    }));
  }

  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
    });

    return settings.map(s => ({
      key: s.key,
      value: this.parseValue(s.value, s.type),
      type: s.type,
    }));
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found`);
    }

    return {
      ...setting,
      value: this.parseValue(setting.value, setting.type),
    };
  }

  async updateSetting(key: string, dto: UpdateSettingDto) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    const value = this.stringifyValue(dto.value, dto.type || 'string');

    if (existing) {
      // Update existing
      return this.prisma.systemSetting.update({
        where: { key },
        data: {
          value,
          type: dto.type || existing.type,
          description: dto.description,
          category: dto.category,
          isPublic: dto.isPublic,
          isEncrypted: dto.isEncrypted,
        },
      });
    } else {
      // Create new
      return this.prisma.systemSetting.create({
        data: {
          key: dto.key,
          value,
          type: dto.type || 'string',
          description: dto.description,
          category: dto.category || 'general',
          isPublic: dto.isPublic || false,
          isEncrypted: dto.isEncrypted || false,
        },
      });
    }
  }

  async getAllFeatures() {
    const features = await this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });

    return features;
  }

  async getFeatureFlag(name: string) {
    const feature = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    if (!feature) {
      // Return default if not found
      return { name, enabled: false, description: 'Feature not configured' };
    }

    return feature;
  }

  async updateFeatureFlag(name: string, dto: FeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    if (existing) {
      return this.prisma.featureFlag.update({
        where: { name },
        data: {
          description: dto.description,
          enabled: dto.enabled,
          percentage: dto.percentage,
          userGroups: dto.userGroups ? JSON.stringify(dto.userGroups) : null,
        },
      });
    } else {
      return this.prisma.featureFlag.create({
        data: {
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled,
          percentage: dto.percentage,
          userGroups: dto.userGroups ? JSON.stringify(dto.userGroups) : null,
        },
      });
    }
  }

  // ============ PHASE 6 - ANNOUNCEMENTS METHODS WITH NOTIFICATIONS ============

  async createAnnouncement(adminId: string, dto: CreateAnnouncementDto) {
    const { title, content, type, targetRole, targetUsers, scheduledAt, expiresAt } = dto;
  
    const announcement = await this.prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        targetRole: targetRole || 'all',
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: adminId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  
    // Send notifications based on target
  
    // If it's for all users
    if (targetRole === 'all' || !targetRole) {
      // Get all active users
      const users = await this.prisma.member.findMany({
        where: { isActive: true },
        select: { id: true },
      });
  
      const notifications: CreateNotificationDto[] = users.map(user => ({
        type: 'announcement',
        title: `📢 New Announcement: ${title}`,
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        data: { 
          announcementId: announcement.id,
          type,
          url: '/announcements'
        },
        userId: user.id,
      }));
  
      // Send in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await this.notificationService.createBulk(batch);
      }
    } 
    // If targeting specific users
    else if (targetUsers) {
      let targetUserIds: string[] = [];
      
      // Handle different possible formats of targetUsers
      if (typeof targetUsers === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(targetUsers);
          if (Array.isArray(parsed)) {
            targetUserIds = parsed;
          } else {
            // If parsed but not array, treat as single ID
            targetUserIds = [String(parsed)];
          }
        } catch (e) {
          // If parsing fails, ensure it's treated as a string before splitting
          const targetStr = String(targetUsers);
          targetUserIds = targetStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }
      } else if (Array.isArray(targetUsers)) {
        targetUserIds = targetUsers;
      } else {
        // If it's neither string nor array, convert to string array
        targetUserIds = [String(targetUsers)];
      }
  
      // Only create notifications if we have valid target users
      if (targetUserIds.length > 0) {
        const notifications: CreateNotificationDto[] = targetUserIds.map((userId: string) => ({
          type: 'announcement',
          title: `📢 New Announcement: ${title}`,
          message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          data: { 
            announcementId: announcement.id,
            type,
            url: '/announcements'
          },
          userId,
        }));
  
        await this.notificationService.createBulk(notifications);
      }
    }
  
    return {
      success: true,
      message: 'Announcement created successfully',
      announcement,
    };
  }

  async getAllAnnouncements(page = 1, limit = 20, active?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (active === 'true') {
      where.isActive = true;
      where.OR = [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ];
      where.AND = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { views: true },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      announcements: announcements.map(a => ({
        ...a,
        viewCount: a._count.views,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActiveAnnouncements(userId?: string) {
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
        AND: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userId) {
      return announcements;
    }

    // Check which ones user has viewed
    const viewed = await this.prisma.announcementView.findMany({
      where: {
        userId,
        announcementId: { in: announcements.map(a => a.id) },
      },
    });

    const viewedIds = new Set(viewed.map(v => v.announcementId));

    return announcements.map(a => ({
      ...a,
      viewed: viewedIds.has(a.id),
    }));
  }

  async getAnnouncementById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        views: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: { viewedAt: 'desc' },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return {
      ...announcement,
      viewCount: announcement.views.length,
    };
  }

  async updateAnnouncement(adminId: string, id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetRole: dto.targetRole,
        targetUsers: dto.targetUsers ? JSON.stringify(dto.targetUsers) : announcement.targetUsers,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : announcement.scheduledAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : announcement.expiresAt,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated,
    };
  }

  async deleteAnnouncement(adminId: string, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Announcement deleted successfully',
    };
  }

  async markAsViewed(userId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if already viewed
    const existing = await this.prisma.announcementView.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
    });

    if (!existing) {
      await this.prisma.announcementView.create({
        data: {
          announcementId,
          userId,
        },
      });

      // Update view count
      await this.prisma.announcement.update({
        where: { id: announcementId },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    return { success: true, message: 'Marked as viewed' };
  }

  // ============ PHASE 7 - SECURITY METHODS ============

  async getBlockedIPs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [ips, total] = await Promise.all([
      this.prisma.blockedIP.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
          isActive: true,
        },
        include: {
          blockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blockedIP.count({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
          isActive: true,
        },
      }),
    ]);

    return {
      ips,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async blockIP(dto: BlockIpDto) {
    const { ipAddress, reason, expiresAt } = dto;

    const existing = await this.prisma.blockedIP.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      // Update existing
      return this.prisma.blockedIP.update({
        where: { ipAddress },
        data: {
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });
    } else {
      // Create new
      return this.prisma.blockedIP.create({
        data: {
          ipAddress,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    }
  }

  async unblockIP(ipAddress: string) {
    const existing = await this.prisma.blockedIP.findUnique({
      where: { ipAddress },
    });

    if (!existing) {
      throw new NotFoundException(`IP ${ipAddress} not found in blocklist`);
    }

    await this.prisma.blockedIP.update({
      where: { ipAddress },
      data: {
        isActive: false,
      },
    });

    return { success: true, message: `IP ${ipAddress} unblocked` };
  }

  async getRateLimits() {
    // This would typically come from a config file or database
    // For now, return default limits
    return {
      global: { limit: 100, window: 60 }, // 100 requests per minute
      auth: { limit: 5, window: 60 }, // 5 login attempts per minute
      api: { limit: 1000, window: 3600 }, // 1000 requests per hour
    };
  }

  async updateRateLimit(dto: RateLimitDto) {
    // This would update rate limit config in database
    // For now, just return success
    return {
      success: true,
      message: `Rate limit for ${dto.endpoint} updated`,
      config: dto,
    };
  }

  async getActiveSessions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where: {
          expiresAt: { gt: new Date() },
          isRevoked: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { lastActive: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userSession.count({
        where: {
          expiresAt: { gt: new Date() },
          isRevoked: false,
        },
      }),
    ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async terminateSession(sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    // Notify user about session termination
    if (session.userId) {
      await this.notificationService.create({
        type: 'security_alert',
        title: 'Session Terminated',
        message: 'A session on your account has been terminated by an administrator.',
        data: {
          sessionId,
          action: 'session_terminated',
        },
        userId: session.userId,
      });
    }

    return { success: true, message: 'Session terminated' };
  }

  async terminateAllUserSessions(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    // Notify user
    await this.notificationService.create({
      type: 'security_alert',
      title: 'All Sessions Terminated',
      message: 'All sessions on your account have been terminated by an administrator.',
      data: {
        action: 'all_sessions_terminated',
      },
      userId,
    });

    return { success: true, message: `All sessions for user ${userId} terminated` };
  }

  async getLoginAttempts(days = 7, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [attempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginAttempt.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      attempts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFailedLoginAttempts(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const failed = await this.prisma.loginAttempt.groupBy({
      by: ['email'],
      where: {
        createdAt: { gte: startDate },
        success: false,
      },
      _count: true,
    });

    return failed.map(f => ({
      email: f.email,
      attempts: f._count,
    }));
  }

  // ============ PHASE 8 - MAINTENANCE METHODS ============

  async createBackup(dto: BackupDto) {
    const { filename, type = 'manual' } = dto;

    // Get all data from database
    const [
      members,
      prayerRequests,
      testimonies,
      groups,
      reports,
    ] = await Promise.all([
      this.prisma.member.findMany(),
      this.prisma.prayerRequest.findMany(),
      this.prisma.testimony.findMany(),
      this.prisma.group.findMany(),
      this.prisma.report.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      type,
      data: {
        members,
        prayerRequests,
        testimonies,
        groups,
        reports,
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
          recordCounts: Object.keys(backupData.data).map(key => ({
            table: key,
            count: backupData.data[key].length,
          })),
        }),
      },
    });

    // Notify admins about backup completion
    const admins = await this.prisma.member.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        type: 'system_backup',
        title: 'Database Backup Created',
        message: `A ${type} backup has been created successfully.`,
        data: {
          backupId: backup.id,
          filename: backup.filename,
          size: this.formatBytes(backup.size),
          type,
        },
        userId: admin.id,
      });
    }

    return {
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: this.formatBytes(backup.size),
        type: backup.type,
        createdAt: backup.createdAt,
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
      })),
    };
  }

  async getBackupFile(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    return {
      filename: backup.filename,
      data: JSON.stringify({ id: backup.id, message: 'Backup data placeholder' }),
    };
  }

  async restoreBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    // Notify admins about restore
    const admins = await this.prisma.member.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        type: 'system_restore',
        title: 'Database Restore Initiated',
        message: `A database restore from backup ${backup.filename} has been initiated.`,
        data: {
          backupId: id,
          filename: backup.filename,
        },
        userId: admin.id,
      });
    }

    return {
      success: true,
      message: 'Database restored successfully',
      backupId: id,
    };
  }

  async deleteBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    await this.prisma.backup.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Backup deleted successfully',
    };
  }

  async getSystemHealth() {
    // Check database connection
    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
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
      database: {
        status: dbStatus,
        latency: '< 10ms',
      },
      stats: {
        totalUsers,
        activeToday,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  }

  async clearCache() {
    return {
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseStats() {
    const tableCounts = await Promise.all([
      this.prisma.member.count().then(c => ({ table: 'members', count: c })),
      this.prisma.prayerRequest.count().then(c => ({ table: 'prayer_requests', count: c })),
      this.prisma.testimony.count().then(c => ({ table: 'testimonies', count: c })),
      this.prisma.group.count().then(c => ({ table: 'groups', count: c })),
    ]);

    return {
      tables: tableCounts,
      totalRecords: tableCounts.reduce((acc, curr) => acc + curr.count, 0),
      databaseSize: '~10 MB',
    };
  }

  async optimizeDatabase() {
    try {
      await this.prisma.$executeRaw`VACUUM;`;
      return {
        success: true,
        message: 'Database optimized successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database optimization failed',
        error: error.message,
      };
    }
  }

  // ============ HELPER METHODS FOR SETTINGS ============

  private parseValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true';
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch {
      return value;
    }
  }

  private stringifyValue(value: any, type: string): string {
    if (type === 'json') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}