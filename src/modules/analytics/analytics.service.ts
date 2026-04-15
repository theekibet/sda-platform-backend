// src/modules/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DateRangeDto } from './dto/date-range.dto';

// Define types for better type safety
interface DailyActiveRecord {
  date: string;
  activeUsers: number;
}

interface GroupedPeriod {
  period: string;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ============ USER ANALYTICS ============

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
    const ageGroups = await this.getAgeDistribution();
    
    // Gender distribution
    const genderDistribution = await this.prisma.member.groupBy({
      by: ['gender'],
      _count: true,
      where: {
        gender: { not: null },
      },
    });

    // Location distribution using locationName
    const topLocations = await this.prisma.member.groupBy({
      by: ['locationName'],
      _count: true,
      where: {
        locationName: { not: null },
      },
      orderBy: {
        _count: {
          locationName: 'desc',
        },
      },
      take: 10,
    });

    const genderMap: Record<string, number> = {};
    genderDistribution.forEach(curr => {
      genderMap[curr.gender || 'unspecified'] = curr._count;
    });

    return {
      ageGroups,
      gender: genderMap,
      topCities: topLocations.map(l => ({
        city: l.locationName?.split(',')[0] || 'Unknown',
        count: l._count,
      })),
    };
  }

  // ============ CONTENT ANALYTICS ============

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
          prayedCount: p._count.prayers,
          createdAt: p.createdAt,
        })),
      },
    };
  }

  // ============ ENGAGEMENT ANALYTICS ============

  async getEngagementMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily active users
    const dailyActive = await this.getDailyActiveUsers(startDate, days);

    // User retention (users who came back)
    const retention = await this.getUserRetention(startDate);

    // Average session duration (placeholder - would need session tracking)
    const avgSessionDuration = await this.calculateAvgSessionDuration(startDate);

    return {
      period: `${days} days`,
      dailyActive,
      retention,
      avgSessionDuration,
    };
  }

  // ============ AUTHENTICATION ANALYTICS (NEW) ============

  async getAuthAnalytics() {
    // Total users by auth provider
    const authProviderStats = await this.prisma.member.groupBy({
      by: ['authProvider'],
      _count: true,
    });

    // Last 30 days logins by method
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastLoginMethodStats = await this.prisma.member.groupBy({
      by: ['lastLoginMethod'],
      where: {
        lastLoginAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Recent logins (last 10)
    const recentLogins = await this.prisma.member.findMany({
      where: { lastLoginAt: { not: null } },
      select: {
        name: true,
        email: true,
        lastLoginAt: true,
        lastLoginMethod: true,
        authProvider: true,
      },
      orderBy: { lastLoginAt: 'desc' },
      take: 10,
    });

    // Users who never logged in (registered but never logged in)
    const neverLoggedIn = await this.prisma.member.count({
      where: { lastLoginAt: null },
    });

    // Auth provider distribution percentages
    const totalUsers = await this.prisma.member.count();
    const providerDistribution = authProviderStats.map(stat => ({
      provider: stat.authProvider,
      count: stat._count,
      percentage: totalUsers ? (stat._count / totalUsers) * 100 : 0,
    }));

    return {
      summary: {
        totalUsers,
        neverLoggedIn,
        emailUsers: authProviderStats.find(s => s.authProvider === 'email')?._count || 0,
        googleUsers: authProviderStats.find(s => s.authProvider === 'google')?._count || 0,
      },
      providerDistribution,
      recentLogins,
      last30DaysLogins: lastLoginMethodStats,
    };
  }

  // ============ HELPER METHODS ============

  private async getDailyActiveUsers(startDate: Date, days: number): Promise<DailyActiveRecord[]> {
    const result: DailyActiveRecord[] = [];
    
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

      result.push({
        date: date.toISOString().split('T')[0],
        activeUsers: count,
      });
    }

    return result;
  }

  private async getUserRetention(startDate: Date) {
    // Users who joined in the last 30 days and were active in the last 7 days
    const thirtyDaysAgo = new Date(startDate);
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
      newUsers,
      retainedUsers,
      retentionRate: newUsers > 0 ? (retainedUsers / newUsers) * 100 : 0,
    };
  }

  private async calculateAvgSessionDuration(startDate: Date) {
    // This would require session tracking data
    // For now, return placeholder
    return {
      average: 12.5, // minutes
      note: 'Requires session tracking implementation',
    };
  }

  private async getAgeDistribution() {
    const members = await this.prisma.member.findMany({
      where: {
        age: { not: null },
      },
      select: {
        age: true,
      },
    });

    const groups: Record<string, number> = {
      '13-17': 0,
      '18-24': 0,
      '25-35': 0,
      '35+': 0,
      unknown: 0,
    };

    members.forEach(m => {
      if (!m.age) {
        groups.unknown++;
      } else if (m.age < 18) {
        groups['13-17']++;
      } else if (m.age < 25) {
        groups['18-24']++;
      } else if (m.age < 36) {
        groups['25-35']++;
      } else {
        groups['35+']++;
      }
    });

    return groups;
  }

  private groupByPeriod(items: any[], dateField: string, period: string): GroupedPeriod[] {
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
}