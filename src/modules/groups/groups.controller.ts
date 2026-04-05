// src/modules/groups/groups.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe, Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ============ GROUP CRUD ============

  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(@Request() req: any, @Body() dto: CreateGroupDto): Promise<any> {
    const group = await this.groupsService.createGroup(req.user.userId, dto);
    return { success: true, data: group };
  }

  @Get('my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@Request() req: any): Promise<any> {
    const groups = await this.groupsService.getUserGroups(req.user.userId);
    return { success: true, data: groups };
  }

  // ============ DISCOVERY ENDPOINTS ============

  @Get('discover/my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroupsWithStats(@Request() req: any): Promise<any> {
    const groups = await this.groupsService.getUserGroupsWithStats(req.user.userId);
    return { success: true, data: groups };
  }

  @Get('discover/suggestions')
  @UseGuards(OptionalJwtAuthGuard)
  async getDiscoverGroups(@Request() req: any): Promise<any> {
    const groups = await this.groupsService.getDiscoverGroups(req.user?.userId);
    return { success: true, data: groups };
  }

  // ============ GROUP DISCUSSIONS ============

  @Get(':groupId/discussions')
  @UseGuards(JwtAuthGuard)
  async getGroupDiscussions(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<any> {
    const discussions = await this.groupsService.getGroupDiscussions(
      groupId, req.user.userId, page, limit,
    );
    return { success: true, data: discussions };
  }

  // ============ GROUP DETAILS ============

  @Get(':groupId')
  @UseGuards(OptionalJwtAuthGuard)
  async getGroupById(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Promise<any> {
    const group = await this.groupsService.getGroupById(groupId, req.user?.userId);
    return { success: true, data: group };
  }

  // ============ MAIN GET GROUPS (Tag-based) ============

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getGroups(
    @Request() req: any,
    @Query('tags') tags?: string,
    @Query('location') location?: string,
    @Query('meetingType') meetingType?: 'online' | 'in-person' | 'hybrid',
    @Query('search') search?: string,
    @Query('sort') sort?: 'popular' | 'new' | 'active',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<any> {
    const tagNames = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

    const result = await this.groupsService.getGroups({
      tagNames,
      location,
      meetingType,
      search,
      sort,
      page,
      limit,
      userId: req.user?.userId,
    });
    return {
      success: true,
      data: result.groups,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  // ============ GROUP MANAGEMENT ============

  @Put(':groupId')
  @UseGuards(JwtAuthGuard)
  async updateGroup(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<any> {
    const group = await this.groupsService.updateGroup(req.user.userId, groupId, dto);
    return { success: true, data: group };
  }

  @Delete(':groupId')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Promise<any> {
    await this.groupsService.deleteGroup(req.user.userId, groupId);
    return { success: true, message: 'Group deleted successfully' };
  }

  // ============ GROUP MEMBERSHIP ============

  @Post(':groupId/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body('message') message?: string,
  ): Promise<any> {
    const membership = await this.groupsService.requestToJoin(req.user.userId, groupId, message);
    return { success: true, data: membership };
  }

  @Post(':groupId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ): Promise<any> {
    await this.groupsService.leaveGroup(req.user.userId, groupId);
    return { success: true, message: 'Left group successfully' };
  }

  @Post(':groupId/approve/:memberId')
  @UseGuards(JwtAuthGuard)
  async approveMember(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ): Promise<any> {
    await this.groupsService.approveMember(req.user.userId, groupId, memberId);
    return { success: true, message: 'Member approved' };
  }

  @Post(':groupId/reject/:memberId')
  @UseGuards(JwtAuthGuard)
  async rejectMember(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ): Promise<any> {
    await this.groupsService.rejectMember(req.user.userId, groupId, memberId);
    return { success: true, message: 'Member rejected' };
  }
}