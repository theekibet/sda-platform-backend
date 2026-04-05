// src/modules/groups/groups.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { TagsService } from '../tags/tags.service';

// Simplified Author interface - no privacy fields
interface AuthorData {
  id: string;
  name: string;
  avatarUrl: string | null;
  locationName: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Simplified formatted author for frontend
interface FormattedAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  locationName: string | null;
  city: string | null;
}

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private tagsService: TagsService,
  ) {}

  /**
   * Helper method for distance calculation (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Format author for frontend - extract city from locationName
   */
  private formatAuthor(author: AuthorData | null): FormattedAuthor | null {
    if (!author) return null;
    
    let city: string | null = null;
    if (author.locationName) {
      city = author.locationName.split(',')[0].trim();
    }
    
    return {
      id: author.id,
      name: author.name,
      avatarUrl: author.avatarUrl,
      locationName: author.locationName,
      city: city,
    };
  }

  // ============ GROUP MANAGEMENT ============

  async createGroup(creatorId: string, dto: CreateGroupDto) {
    const { 
      name, 
      description, 
      tagNames, 
      isPrivate, 
      location, 
      rules, 
      requireApproval, 
      imageUrl,
      isLocationBased,
      meetingType,
    } = dto;

    // Handle tags
    let tags: Awaited<ReturnType<TagsService['findOrCreateTags']>> = [];
    if (tagNames && tagNames.length > 0) {
      tags = await this.tagsService.findOrCreateTags(tagNames);
    }

    const group = await this.prisma.group.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false,
        location,
        rules,
        requireApproval: requireApproval ?? false,
        imageUrl,
        createdById: creatorId,
        isLocationBased: isLocationBased || false,
        meetingType: meetingType || 'online',
        tags: {
          connect: tags.map(t => ({ id: t.id })),
        },
      },
      include: {
        tags: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
      },
    });

    // Increment tag usage counts
    if (tags.length > 0) {
      await this.tagsService.incrementUsageCount(tags.map(t => t.id));
    }

    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        memberId: creatorId,
        role: 'admin',
        status: 'approved',
      },
    });

    return this.getGroupById(group.id, creatorId);
  }

  async getGroupById(groupId: string, userId?: string) {
    // Fetch group with basic includes (tags, createdBy, counts)
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        tags: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
        _count: {
          select: {
            members: true,
            discussions: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Determine user membership
    let userMembership: any = null;
    if (userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });
      if (membership) {
        userMembership = membership;
      }
    }

    // Privacy check: if group is private and user is not a member, return only public-safe fields
    if (group.isPrivate && !userMembership) {
      const formattedCreatedBy = this.formatAuthor(group.createdBy as AuthorData);
      return {
        ...group,
        createdBy: formattedCreatedBy,
        members: [],
        recentDiscussions: [],
        userMembership: null,
        canPost: false,
        memberCount: group._count?.members || 0,
        discussionCount: group._count?.discussions || 0,
      };
    }

    // If user is a member or group is public, fetch the extra details
    const [members, recentDiscussions] = await Promise.all([
      this.prisma.groupMember.findMany({
        where: { groupId, status: 'approved' },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.discussion.findMany({
        where: { groupId, status: 'active' },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { comments: true, votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const formattedMembers = members.map(m => ({
      ...m,
      member: this.formatAuthor(m.member as AuthorData),
    })).filter(m => m.member !== null);

    const formattedCreatedBy = this.formatAuthor(group.createdBy as AuthorData);

    return {
      ...group,
      createdBy: formattedCreatedBy,
      members: formattedMembers,
      userMembership,
      memberCount: group._count?.members || 0,
      discussionCount: group._count?.discussions || 0,
      recentDiscussions,
      canPost: userMembership?.status === 'approved',
    };
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can update group settings');
    }

    // Handle tags update
    let tagConnect: { id: string }[] | undefined = undefined;
    if (dto.tagNames) {
      const tags = await this.tagsService.findOrCreateTags(dto.tagNames);
      tagConnect = tags.map(t => ({ id: t.id }));
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate,
        location: dto.location,
        rules: dto.rules,
        requireApproval: dto.requireApproval,
        imageUrl: dto.imageUrl,
        isLocationBased: dto.isLocationBased,
        meetingType: dto.meetingType,
        tags: tagConnect ? { set: tagConnect } : undefined,
      },
      include: {
        tags: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
      },
    });
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.createdById !== userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.role !== 'admin') {
        throw new ForbiddenException('Only the group creator or admin can delete the group');
      }
    }

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { message: 'Group deleted successfully' };
  }

  // ============ GROUP MEMBERSHIP ============

  async requestToJoin(userId: string, groupId: string, message?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`You already have a ${existing.status} membership`);
    }

    const status = group.requireApproval ? 'pending' : 'approved';

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId,
        memberId: userId,
        status,
        role: 'member',
      },
    });

    return membership;
  }

  async approveMember(adminId: string, groupId: string, memberId: string) {
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: adminId,
        },
      },
    });

    if (!adminMembership || (adminMembership.role !== 'admin' && adminMembership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can approve members');
    }

    const membership = await this.prisma.groupMember.update({
      where: {
        groupId_memberId: {
          groupId,
          memberId,
        },
      },
      data: {
        status: 'approved',
      },
    });

    return membership;
  }

  async rejectMember(adminId: string, groupId: string, memberId: string) {
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: adminId,
        },
      },
    });

    if (!adminMembership || (adminMembership.role !== 'admin' && adminMembership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can reject members');
    }

    await this.prisma.groupMember.delete({
      where: {
        groupId_memberId: {
          groupId,
          memberId,
        },
      },
    });

    return { message: 'Member rejected' };
  }

  async leaveGroup(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    if (membership.role === 'admin') {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: 'admin',
          status: 'approved',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException('You are the last admin. Please promote another member or delete the group.');
      }
    }

    await this.prisma.groupMember.delete({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    return { message: 'Left group successfully' };
  }

  // ============ USER GROUPS ============

  async getUserGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        memberId: userId,
        status: 'approved',
      },
      include: {
        group: {
          include: {
            tags: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                locationName: true,
              },
            },
            _count: {
              select: {
                members: true,
                discussions: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const groupsWithDetails = await Promise.all(
      memberships.map(async (m) => {
        const formattedCreatedBy = this.formatAuthor(m.group.createdBy as AuthorData);

        return {
          ...m.group,
          createdBy: formattedCreatedBy,
          memberCount: m.group._count?.members || 0,
          discussionCount: m.group._count?.discussions || 0,
          userRole: m.role,
        };
      })
    );

    return groupsWithDetails;
  }

  async getUserGroupsWithStats(userId: string) {
    const groups = await this.getUserGroups(userId);
    
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const discussionsLastWeek = await this.prisma.discussion.count({
          where: {
            groupId: group.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });

        return {
          ...group,
          discussionsLastWeek,
          isActive: discussionsLastWeek > 5,
        };
      })
    );

    return groupsWithStats;
  }

  // ============ DISCOVERY (Tag-based) ============
  
  async getDiscoverGroups(userId?: string) {
    let userTags: string[] = [];
    let userCountry: string | null = null;

    if (userId) {
      const userMemberships = await this.prisma.groupMember.findMany({
        where: {
          memberId: userId,
          status: 'approved',
        },
        include: {
          group: {
            include: {
              tags: true,
            },
          },
        },
      });

      const allTagNames = userMemberships.flatMap(m => m.group.tags.map(t => t.name));
      userTags = [...new Set(allTagNames)];

      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { locationName: true },
      });

      if (user?.locationName) {
        const parts = user.locationName.split(',');
        userCountry = parts[parts.length - 1].trim();
      }
    }

    const recommendations: any = {
      forYou: [],
      popularInYourCountry: [],
      trending: [],
      newGroups: [],
    };

    // For You: Based on tags user is interested in
    if (userTags.length > 0) {
      recommendations.forYou = await this.prisma.group.findMany({
        where: {
          tags: {
            some: {
              name: { in: userTags },
            },
          },
          isPrivate: false,
          ...(userId ? {
            members: {
              none: {
                memberId: userId,
                status: 'approved',
              },
            },
          } : {}),
        },
        include: {
          tags: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
          _count: {
            select: { members: true, discussions: true },
          },
        },
        orderBy: { 
          members: {
            _count: 'desc',
          },
        },
        take: 5,
      });
    }

    // Popular in your country
    if (userCountry) {
      recommendations.popularInYourCountry = await this.prisma.group.findMany({
        where: {
          isPrivate: false,
          location: { contains: userCountry },
          ...(userId ? {
            members: {
              none: {
                memberId: userId,
                status: 'approved',
              },
            },
          } : {}),
        },
        include: {
          tags: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
          _count: {
            select: { members: true, discussions: true },
          },
        },
        orderBy: { 
          members: {
            _count: 'desc',
          },
        },
        take: 5,
      });
    }

    // Trending: Based on recent discussion activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingGroups = await this.prisma.group.findMany({
      where: {
        isPrivate: false,
        discussions: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
        ...(userId ? {
          members: {
            none: {
              memberId: userId,
              status: 'approved',
            },
          },
        } : {}),
      },
      include: {
        tags: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
        _count: {
          select: { 
            members: true, 
            discussions: { where: { createdAt: { gte: sevenDaysAgo } } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    recommendations.trending = trendingGroups;

    // New groups
    recommendations.newGroups = await this.prisma.group.findMany({
      where: {
        isPrivate: false,
        ...(userId ? {
          members: {
            none: {
              memberId: userId,
              status: 'approved',
            },
          },
        } : {}),
      },
      include: {
        tags: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
          },
        },
        _count: {
          select: { members: true, discussions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formatGroups = (groups: any[]) => groups.map(g => ({
      ...g,
      createdBy: this.formatAuthor(g.createdBy as AuthorData),
      memberCount: g._count?.members || 0,
      discussionCount: g._count?.discussions || 0,
      recentActivity: g._count?.discussions || 0,
      isOnline: g.meetingType === 'online' || g.location?.toLowerCase().includes('online'),
    }));

    return {
      forYou: formatGroups(recommendations.forYou),
      popularInYourCountry: formatGroups(recommendations.popularInYourCountry),
      trending: formatGroups(recommendations.trending),
      newGroups: formatGroups(recommendations.newGroups),
    };
  }

  // ============ GROUP DISCUSSIONS ============

  async getGroupDiscussions(groupId: string, userId: string, page: number = 1, limit: number = 20) {
    // Check membership for private groups
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { isPrivate: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.isPrivate) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.status !== 'approved') {
        throw new ForbiddenException('You must be a member to view discussions');
      }
    }

    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where: {
          groupId,
          status: 'active',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          tags: true,
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.discussion.count({
        where: {
          groupId,
          status: 'active',
        },
      }),
    ]);

    return {
      discussions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ MAIN GET GROUPS (Tag-based filtering) ============

  async getGroups(filters: {
    tagNames?: string[];
    location?: string;
    search?: string;
    meetingType?: 'online' | 'in-person' | 'hybrid';
    sort?: 'popular' | 'new' | 'active';
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const { 
      tagNames,
      location, 
      search,
      meetingType,
      sort = 'popular',
      page = 1, 
      limit = 20, 
      userId,
    } = filters;
    
    const skip = (page - 1) * limit;
    const where: any = {};

    if (tagNames && tagNames.length > 0) {
      where.tags = {
        some: {
          name: {
            in: tagNames.map(t => t.toLowerCase().trim()),
          },
        },
      };
    }

    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (meetingType) where.meetingType = meetingType;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      {
        tags: {
          some: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
    if (!userId) where.isPrivate = false;

    let orderBy: any = { members: { _count: 'desc' } };
    if (sort === 'new') orderBy = { createdAt: 'desc' };
    else if (sort === 'active') orderBy = { updatedAt: 'desc' };

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          tags: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
            },
          },
          members: userId ? {
            where: { memberId: userId },
            select: { role: true, status: true },
          } : false,
          _count: {
            select: { members: true, discussions: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    const formattedGroups = await Promise.all(groups.map(async group => {
      const userMembership = userId && group.members && group.members.length > 0 ? group.members[0] : null;
      
      const formattedCreatedBy = this.formatAuthor(group.createdBy as AuthorData);
      
      return {
        ...group,
        createdBy: formattedCreatedBy,
        members: undefined,
        userMembership: userMembership ? {
          role: userMembership.role,
          status: userMembership.status,
        } : null,
        memberCount: group._count?.members || 0,
        discussionCount: group._count?.discussions || 0,
        isOnline: group.meetingType === 'online',
      };
    }));

    return {
      groups: formattedGroups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ HELPER METHODS ============

  private async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });
    return !!(membership && membership.status === 'approved');
  }
}