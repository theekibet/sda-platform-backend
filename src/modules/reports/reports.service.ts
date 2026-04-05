import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============ USER-FACING REPORT METHODS ============

  async createReport(userId: string, dto: CreateReportDto) {
    const { contentType, contentId, category, description } = dto;

    // Check if content exists
    await this.validateContentExists(contentType, contentId);

    // Check if user already reported this content
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reportedById: userId,
        contentType,
        contentId,
        status: { in: ['pending', 'investigating'] }
      }
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Get content snippet for preview
    const contentSnippet = await this.getContentSnippet(contentType, contentId);

    // Create the report
    const report = await this.prisma.report.create({
      data: {
        reportedById: userId,
        contentType,
        contentId,
        contentSnippet,
        category,
        description,
        status: 'pending',
        priority: 'medium', // Default priority
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Report submitted successfully',
      report,
    };
  }

  async getMyReports(userId: string, query: ReportQueryDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      reportedById: userId,
    };

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

  async getReportById(userId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: reportId,
        reportedById: userId, // Ensure user owns this report
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
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  // ============ HELPER METHODS ============
  private async validateContentExists(contentType: string, contentId: string) {
    let exists = false;
  
    switch (contentType) {
      case 'prayerRequest':
        const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: contentId } });
        exists = !!prayer;
        break;
      case 'testimony':
        const testimony = await this.prisma.testimony.findUnique({ where: { id: contentId } });
        exists = !!testimony;
        break;
      case 'discussion':
        const discussion = await this.prisma.discussion.findUnique({ where: { id: contentId } });
        exists = !!discussion;
        break;
      case 'user':
        const user = await this.prisma.member.findUnique({ where: { id: contentId } });
        exists = !!user;
        break;
      case 'communityPost':
        const post = await this.prisma.communityPost.findUnique({ where: { id: contentId } });
        exists = !!post;
        break;
      default:
        throw new BadRequestException(`Invalid content type: ${contentType}`);
    }
  
    if (!exists) {
      throw new NotFoundException(`${contentType} with ID ${contentId} not found`);
    }
  }
  
  private async getContentSnippet(contentType: string, contentId: string): Promise<string> {
    switch (contentType) {
      case 'prayerRequest':
        const prayer = await this.prisma.prayerRequest.findUnique({
          where: { id: contentId },
          select: { content: true }
        });
        return prayer?.content?.substring(0, 100) || 'Prayer request content';
        
      case 'testimony':
        const testimony = await this.prisma.testimony.findUnique({
          where: { id: contentId },
          select: { content: true }
        });
        return testimony?.content?.substring(0, 100) || 'Testimony content';
        
      case 'discussion':
        const discussion = await this.prisma.discussion.findUnique({
          where: { id: contentId },
          select: { title: true, content: true }
        });
        return discussion?.title || discussion?.content?.substring(0, 100) || 'Discussion content';
        
      case 'user':
        const user = await this.prisma.member.findUnique({
          where: { id: contentId },
          select: { name: true }
        });
        return `User: ${user?.name || 'Unknown'}`;
        
      case 'communityPost':
        const post = await this.prisma.communityPost.findUnique({
          where: { id: contentId },
          select: { description: true, title: true }
        });
        return post?.title || post?.description?.substring(0, 100) || 'Community post content';
        
      default:
        return 'Content preview not available';
    }
  }

  // ============ ADMIN METHODS ============

  async getAllReports(query: ReportQueryDto) {
    // Destructure with default values
    const { 
      status, 
      contentType, 
      priority, 
      page = 1, 
      limit = 20 
    } = query;
    
    const skip = (page - 1) * limit;
  
    // Build where clause dynamically
    const where: any = {};
  
    if (status) {
      where.status = status;
    }
    
    if (contentType) {
      // Handle both old and new content types for backward compatibility
      if (contentType === 'groupDiscussion') {
        // If filtering by groupDiscussion, include both old and new types
        where.contentType = {
          in: ['groupDiscussion', 'groupMessage']
        };
      } else if (contentType === 'groupMessage') {
        // If filtering by groupMessage, also include any old groupDiscussion records
        where.contentType = {
          in: ['groupMessage', 'groupDiscussion']
        };
      } else {
        // For all other content types, use as-is
        where.contentType = contentType;
      }
    }
    
    if (priority) {
      where.priority = priority;
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
          { createdAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);
  
    // Transform reports to ensure consistent content type naming
    const transformedReports = reports.map(report => ({
      ...report,
      // Map groupDiscussion to groupMessage for frontend consistency
      contentType: report.contentType === 'groupDiscussion' ? 'groupMessage' : report.contentType,
      // Add a helper flag to identify legacy reports if needed
      isLegacyContent: report.contentType === 'groupDiscussion',
    }));
  
    return {
      reports: transformedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      // Include applied filters in response for UI feedback
      appliedFilters: {
        status: status || null,
        contentType: contentType || null,
        priority: priority || null,
      },
    };
  }

  async updateReportStatus(reportId: string, adminId: string, status: string, resolution?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedById: adminId,
        resolvedAt: new Date(),
        resolution,
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
    });

    // Log the moderation action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: adminId,
        action: 'report_resolved',
        contentType: report.contentType,
        contentId: report.contentId,
        contentSnippet: report.contentSnippet,
        reason: resolution || 'Report resolved',
        targetUserId: report.reportedUserId,
      },
    });

    return updatedReport;
  }

  async deleteReport(reportId: string, adminId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.report.delete({
      where: { id: reportId },
    });

    return { success: true, message: 'Report deleted successfully' };
  }

  async getReportStats() {
    const [pending, investigating, resolved, dismissed] = await Promise.all([
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'investigating' } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count({ where: { status: 'dismissed' } }),
    ]);

    const byContentType = await this.prisma.report.groupBy({
      by: ['contentType'],
      _count: true,
    });

    const byPriority = await this.prisma.report.groupBy({
      by: ['priority'],
      _count: true,
    });

    return {
      total: pending + investigating + resolved + dismissed,
      byStatus: { pending, investigating, resolved, dismissed },
      byContentType: byContentType.reduce((acc, curr) => {
        acc[curr.contentType] = curr._count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, curr) => {
        acc[curr.priority] = curr._count;
        return acc;
      }, {}),
    };
  }
}