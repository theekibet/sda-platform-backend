// src/modules/members/members.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Member } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<Member> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.member.findUnique({
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
        latitude: true,
        longitude: true,
        avatarUrl: true,
        createdAt: true,
        isModerator: true,
        isSuperAdmin: true,
        locationLastUpdated: true,
        dateOfBirth: true,
        username: true, // include username in profile
        lastUsernameChange: true,
      },
    });

    return {
      success: true,
      data: profile,
    };
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
    isModerator: boolean = false,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Handle password change if requested
    if (updateData.currentPassword && updateData.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        updateData.currentPassword,
        member.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      updateData.newPassword = await bcrypt.hash(updateData.newPassword, 10);
    }

    // Remove fields that users cannot edit (unless moderator/super admin)
    const { currentPassword, newPassword, locationName, dateOfBirth, email, ...cleanData } =
      updateData;

    const dataToUpdate: any = { ...cleanData };

    // Handle password update
    if (updateData.newPassword) {
      dataToUpdate.password = updateData.newPassword;
    }

    // Handle location update
    if (locationName !== undefined) {
      dataToUpdate.locationName = locationName;
      dataToUpdate.locationLastUpdated = new Date();
    }

    // Only moderators/super admins can update dateOfBirth or email
    if (isModerator) {
      if (dateOfBirth) dataToUpdate.dateOfBirth = new Date(dateOfBirth);
      if (email) dataToUpdate.email = email;
    }

    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        locationName: true,
        latitude: true,
        longitude: true,
        locationLastUpdated: true,
        dateOfBirth: true,
        isModerator: true,
        isSuperAdmin: true,
        isSuspended: true,
        createdAt: true,
        lastActiveAt: true,
        username: true,
        lastUsernameChange: true,
      },
    });

    return updated;
  }

  // ============ LOCATION METHODS ============

  async updateLocation(
    userId: string,
    data: { locationName: string; latitude?: number; longitude?: number },
  ) {
    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: {
        locationName: data.locationName,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        locationLastUpdated: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        locationName: true,
        latitude: true,
        longitude: true,
        avatarUrl: true,
        locationLastUpdated: true,
        dateOfBirth: true,
        username: true,
      },
    });

    return {
      success: true,
      message: 'Location updated successfully',
      data: updated,
    };
  }

  async updateProfilePicture(userId: string, avatarUrl: string): Promise<Member> {
    return this.prisma.member.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  async removeProfilePicture(userId: string): Promise<void> {
    await this.prisma.member.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.member.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  // ============ USERNAME METHODS ============

  async setInitialUsername(userId: string, username: string) {
    const existing = await this.prisma.member.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.member.update({
      where: { id: userId },
      data: {
        username,
        lastUsernameChange: new Date(),
      },
      select: { id: true, username: true, lastUsernameChange: true },
    });
    return user;
  }

  async updateUsername(userId: string, newUsername: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { username: true, lastUsernameChange: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Cooldown check (default 30 days, configurable via env)
    const COOLDOWN_DAYS = parseInt(process.env.USERNAME_CHANGE_COOLDOWN_DAYS || '30', 10);
    if (user.lastUsernameChange) {
      const nextChange = new Date(user.lastUsernameChange);
      nextChange.setDate(nextChange.getDate() + COOLDOWN_DAYS);
      if (nextChange > new Date()) {
        const daysLeft = Math.ceil((nextChange.getTime() - Date.now()) / (1000 * 3600 * 24));
        throw new BadRequestException(
          `You can change your username again in ${daysLeft} day(s).`,
        );
      }
    }

    const existing = await this.prisma.member.findUnique({
      where: { username: newUsername },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: {
        username: newUsername,
        lastUsernameChange: new Date(),
      },
      select: { id: true, username: true, lastUsernameChange: true },
    });
    return updated;
  }

  async getUsernameStatus(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { username: true, lastUsernameChange: true },
    });
    if (!user) throw new NotFoundException('User not found');
  
    const COOLDOWN_DAYS = parseInt(process.env.USERNAME_CHANGE_COOLDOWN_DAYS || '30', 10);
    let canChange = true;
    let nextChangeDate: Date | null = null;
    if (user.lastUsernameChange) {
      const nextChange = new Date(user.lastUsernameChange);
      nextChange.setDate(nextChange.getDate() + COOLDOWN_DAYS);
      if (nextChange > new Date()) {
        canChange = false;
        nextChangeDate = nextChange;
      }
    }
    return {
      username: user.username,
      canChange,
      nextChangeDate,
      cooldownDays: COOLDOWN_DAYS,
    };
  }
}