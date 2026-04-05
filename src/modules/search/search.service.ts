import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export type SearchResultType = 'all' | 'discussions' | 'groups' | 'tags';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public search – only returns content from public groups or standalone discussions.
   * Private group content is excluded entirely.
   */
  async globalSearch(
    query: string,
    type: SearchResultType = 'all',
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return {
        query,
        results: { discussions: [], groups: [], tags: [] },
        total: 0,
        page,
        limit,
      };
    }

    const results: any = { discussions: [], groups: [], tags: [] };
    let totalCount = 0;

    // ----- Discussions (only public groups or standalone) -----
    if (type === 'all' || type === 'discussions') {
      const whereDiscussions: any = {
        status: 'active',
        AND: [
          {
            OR: [
              { groupId: null }, // standalone
              { group: { isPrivate: false } }, // public group
            ],
          },
          {
            OR: [
              { searchText: { contains: searchQuery } },
              { title: { contains: searchQuery } },
            ],
          },
        ],
      };

      const [discussions, count] = await Promise.all([
        this.prisma.discussion.findMany({
          where: whereDiscussions,
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
            group: { select: { id: true, name: true } },
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: { upvotes: 'desc' },
          skip: type === 'discussions' ? skip : 0,
          take: type === 'discussions' ? limit : 5,
        }),
        this.prisma.discussion.count({ where: whereDiscussions }),
      ]);

      results.discussions = discussions;
      if (type === 'discussions') totalCount = count;
    }

    // ----- Groups (only public groups) -----
    if (type === 'all' || type === 'groups') {
      const whereGroups: any = {
        OR: [
          { name: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { tags: { some: { name: { contains: searchQuery } } } },
        ],
        isPrivate: false,
      };

      const [groups, count] = await Promise.all([
        this.prisma.group.findMany({
          where: whereGroups,
          include: {
            createdBy: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
            _count: { select: { members: true, discussions: true } },
          },
          orderBy: { memberCount: 'desc' },
          skip: type === 'groups' ? skip : 0,
          take: type === 'groups' ? limit : 5,
        }),
        this.prisma.group.count({ where: whereGroups }),
      ]);

      results.groups = groups;
      if (type === 'groups') totalCount = count;
    }

    // ----- Tags (always public) -----
    if (type === 'all' || type === 'tags') {
      const whereTags: any = {
        OR: [
          { name: { contains: searchQuery } },
          { description: { contains: searchQuery } },
        ],
      };

      const [tags, count] = await Promise.all([
        this.prisma.tag.findMany({
          where: whereTags,
          orderBy: { usageCount: 'desc' },
          skip: type === 'tags' ? skip : 0,
          take: type === 'tags' ? limit : 5,
        }),
        this.prisma.tag.count({ where: whereTags }),
      ]);

      results.tags = tags;
      if (type === 'tags') totalCount = count;
    }

    // Calculate total for 'all' type using the same privacy filters
    if (type === 'all') {
      const [dCount, gCount, tCount] = await Promise.all([
        this.prisma.discussion.count({
          where: {
            status: 'active',
            AND: [
              { OR: [{ groupId: null }, { group: { isPrivate: false } }] },
              { OR: [{ searchText: { contains: searchQuery } }, { title: { contains: searchQuery } }] },
            ],
          },
        }),
        this.prisma.group.count({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { description: { contains: searchQuery } },
            ],
            isPrivate: false,
          },
        }),
        this.prisma.tag.count({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { description: { contains: searchQuery } },
            ],
          },
        }),
      ]);

      totalCount = dCount + gCount + tCount;
    }

    return {
      query,
      type,
      results,
      total: totalCount,
      page,
      limit,
      hasMore: totalCount > page * limit,
    };
  }

  /**
   * Authenticated search – includes private groups the user belongs to.
   */
  async searchWithUserContext(
    query: string,
    userId: string,
    type: SearchResultType = 'all',
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return {
        query,
        results: { discussions: [], groups: [], tags: [] },
        total: 0,
        page,
        limit,
      };
    }

    const results: any = { discussions: [], groups: [], tags: [] };
    let totalCount = 0;

    // Get user's approved group memberships
    const userMemberships = await this.prisma.groupMember.findMany({
      where: { memberId: userId, status: 'approved' },
      select: { groupId: true },
    });
    const userGroupIds = userMemberships.map((m) => m.groupId);

    // ----- Discussions (public + user's private groups) -----
    if (type === 'all' || type === 'discussions') {
      const whereDiscussions: any = {
        status: 'active',
        AND: [
          {
            OR: [
              { groupId: null },
              { group: { isPrivate: false } },
              { groupId: { in: userGroupIds } },
            ],
          },
          {
            OR: [
              { searchText: { contains: searchQuery } },
              { title: { contains: searchQuery } },
            ],
          },
        ],
      };

      const [discussions, count] = await Promise.all([
        this.prisma.discussion.findMany({
          where: whereDiscussions,
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
            group: { select: { id: true, name: true, isPrivate: true } },
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: { upvotes: 'desc' },
          skip: type === 'discussions' ? skip : 0,
          take: type === 'discussions' ? limit : 5,
        }),
        this.prisma.discussion.count({ where: whereDiscussions }),
      ]);

      results.discussions = discussions;
      if (type === 'discussions') totalCount = count;
    }

    // ----- Groups (public + user's private groups) -----
    if (type === 'all' || type === 'groups') {
      const whereGroups: any = {
        OR: [
          { name: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { tags: { some: { name: { contains: searchQuery } } } },
        ],
      };

      const [groups, count] = await Promise.all([
        this.prisma.group.findMany({
          where: whereGroups,
          include: {
            createdBy: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
            _count: { select: { members: true, discussions: true } },
          },
          orderBy: { memberCount: 'desc' },
          skip: type === 'groups' ? skip : 0,
          take: type === 'groups' ? limit : 5,
        }),
        this.prisma.group.count({ where: whereGroups }),
      ]);

      results.groups = groups;
      if (type === 'groups') totalCount = count;
    }

    // ----- Tags (always public) -----
    if (type === 'all' || type === 'tags') {
      const whereTags: any = {
        OR: [
          { name: { contains: searchQuery } },
          { description: { contains: searchQuery } },
        ],
      };

      const [tags, count] = await Promise.all([
        this.prisma.tag.findMany({
          where: whereTags,
          orderBy: { usageCount: 'desc' },
          skip: type === 'tags' ? skip : 0,
          take: type === 'tags' ? limit : 5,
        }),
        this.prisma.tag.count({ where: whereTags }),
      ]);

      results.tags = tags;
      if (type === 'tags') totalCount = count;
    }

    // Calculate total for 'all' type using same filters
    if (type === 'all') {
      const [dCount, gCount, tCount] = await Promise.all([
        this.prisma.discussion.count({
          where: {
            status: 'active',
            AND: [
              {
                OR: [
                  { groupId: null },
                  { group: { isPrivate: false } },
                  { groupId: { in: userGroupIds } },
                ],
              },
              {
                OR: [
                  { searchText: { contains: searchQuery } },
                  { title: { contains: searchQuery } },
                ],
              },
            ],
          },
        }),
        this.prisma.group.count({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { description: { contains: searchQuery } },
            ],
          },
        }),
        this.prisma.tag.count({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { description: { contains: searchQuery } },
            ],
          },
        }),
      ]);

      totalCount = dCount + gCount + tCount;
    }

    return {
      query,
      type,
      results,
      total: totalCount,
      page,
      limit,
      hasMore: totalCount > page * limit,
    };
  }

  // Stubbed for now – implement if needed
  async getRecentSearches(userId: string, limit: number = 10) {
    return [];
  }

  async getTrendingSearches(limit: number = 10) {
    return [];
  }
}