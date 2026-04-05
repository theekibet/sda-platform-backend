import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  // Simplified: Update user location (no privacy settings)
  async updateUserLocation(userId: string, locationData: UpdateLocationDto) {
    // Update with provided data
    return this.prisma.member.update({
      where: { id: userId },
      data: {
        locationName: locationData.locationName,
        latitude: locationData.latitude ?? null,
        longitude: locationData.longitude ?? null,
        locationLastUpdated: new Date(),
      },
      select: {
        id: true,
        name: true,
        locationName: true,
        latitude: true,
        longitude: true,
        locationLastUpdated: true,
      },
    });
  }

  async getLocationStats() {
    const totalWithLocation = await this.prisma.member.count({
      where: { 
        locationName: { not: null }
      }
    });

    const totalMembers = await this.prisma.member.count();

    return {
      totalMembers,
      withLocation: totalWithLocation,
      percentage: totalMembers > 0 ? Math.round((totalWithLocation / totalMembers) * 100) : 0,
      lastUpdated: new Date(),
    };
  }
}