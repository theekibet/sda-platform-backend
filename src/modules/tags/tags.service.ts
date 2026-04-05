import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async createTag(dto: { name: string; description?: string }) {
    const normalizedName = dto.name.toLowerCase().trim().replace(/\s+/g, '-');

    const existing = await this.prisma.tag.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new ConflictException('Tag already exists');
    }

    return this.prisma.tag.create({
      data: {
        name: normalizedName,
        description: dto.description,
      },
    });
  }

  async findOrCreateTags(tagNames: string[]) {
    const normalizedNames = tagNames.map(name => 
      name.toLowerCase().trim().replace(/\s+/g, '-')
    );

    const existingTags = await this.prisma.tag.findMany({
      where: {
        name: {
          in: normalizedNames,
        },
      },
    });

    const existingNames = existingTags.map(t => t.name);
    const newNames = normalizedNames.filter(name => !existingNames.includes(name));

    // Create missing tags one by one (SQLite doesn't support createMany)
    for (const name of newNames) {
      await this.prisma.tag.create({
        data: {
          name,
          description: null,
          usageCount: 0,
        },
      }).catch(() => {
        // Ignore duplicates
      });
    }

    // Return all tags (existing + newly created)
    return this.prisma.tag.findMany({
      where: {
        name: {
          in: normalizedNames,
        },
      },
    });
  }

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: {
        usageCount: 'desc',
      },
    });
  }

  async getTrendingTags(limit: number = 10) {
    return this.prisma.tag.findMany({
      orderBy: [
        { usageCount: 'desc' },
        { followerCount: 'desc' },
      ],
      take: limit,
    });
  }

  async getTagById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async getTagByName(name: string) {
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, '-');
    
    const tag = await this.prisma.tag.findUnique({
      where: { name: normalizedName },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async getDiscussionsByTag(tagId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where: {
          tags: {
            some: {
              id: tagId,
            },
          },
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
          tags: {
            some: {
              id: tagId,
            },
          },
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

  async incrementUsageCount(tagIds: string[]) {
    for (const id of tagIds) {
      await this.prisma.tag.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      }).catch(() => {
        // Ignore errors
      });
    }
  }

  async deleteTag(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        discussions: true,
        groups: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.discussions.length > 0 || tag.groups.length > 0) {
      throw new ConflictException('Cannot delete tag with existing discussions or groups');
    }

    return this.prisma.tag.delete({
      where: { id },
    });
  }
}