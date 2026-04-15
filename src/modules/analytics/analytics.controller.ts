// src/modules/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ModeratorGuard } from '../../common/guards/moderator.guard';
import { DateRangeDto } from './dto/date-range.dto';

// Define return types
interface GroupedPeriod {
  period: string;
  count: number;
}

interface UserGrowthResponse {
  total: number;
  active30d: number;
  growth: GroupedPeriod[];
  period: string;
}

interface DailyActiveRecord {
  date: string;
  activeUsers: number;
}

interface EngagementMetricsResponse {
  period: string;
  dailyActive: DailyActiveRecord[];
  retention: {
    newUsers: number;
    retainedUsers: number;
    retentionRate: number;
  };
  avgSessionDuration: number | { average: number; note: string };
}

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user-growth')
  getUserGrowth(@Query() dateRange: DateRangeDto): Promise<UserGrowthResponse> {
    return this.analyticsService.getUserGrowth(dateRange);
  }

  @Get('demographics')
  getUserDemographics() {
    return this.analyticsService.getUserDemographics();
  }

  @Get('content')
  getContentAnalytics(@Query() dateRange: DateRangeDto) {
    return this.analyticsService.getContentAnalytics(dateRange);
  }

  @Get('engagement')
  getEngagementMetrics(@Query('days') days?: number): Promise<EngagementMetricsResponse> {
    return this.analyticsService.getEngagementMetrics(days || 30);
  }

  // ============ NEW: Authentication Analytics ============
  @Get('auth')
  async getAuthAnalytics() {
    return this.analyticsService.getAuthAnalytics();
  }
}