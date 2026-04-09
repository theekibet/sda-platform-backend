// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password, phone, dateOfBirth, gender } = registerDto;
  
    const fullName = `${firstName} ${lastName}`.trim();
    
    const existingUser = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { phone: phone || '' },
        ],
      },
    });
  
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let age: number | null = null;
    let birthDate: Date | null = null;
    
    if (dateOfBirth) {
      birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
  
    const user = await this.prisma.member.create({
      data: {
        name: fullName,
        email,
        phone,
        password: hashedPassword,
        age: age,
        gender,
        dateOfBirth: birthDate,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    this.autoJoinGeneralGroup(user.id).catch(error => {
      this.logger.error(`Failed to auto-join group for user ${user.id}: ${error.message}`);
    });
  
    const token = this.generateToken(user);
  
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
      message: 'Registration successful! Welcome to the community.',
    };
  }
  
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
  
    // Find user with explicit selection including role flags
    const user = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email },
          { phone: email },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        locationName: true,
        latitude: true,
        longitude: true,
        dateOfBirth: true,
        isModerator: true,
        isSuperAdmin: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        createdAt: true,
        lastActiveAt: true,
        password: true,
      },
    });
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil || user.suspendedUntil > now
    );

    if (isSuspended) {
      let suspensionMessage = 'Account suspended';
      if (user.suspensionReason) {
        suspensionMessage += `: ${user.suspensionReason}`;
      }
      if (user.suspendedUntil) {
        suspensionMessage += ` until ${user.suspendedUntil.toLocaleDateString()}`;
      }
      this.logger.warn(`Suspended user attempted login: ${user.id}`);
      throw new UnauthorizedException(suspensionMessage);
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    await this.prisma.member.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });
  
    const token = this.generateToken(user);
  
    // Remove password from response
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
    };
  }

  /**
   * Generate JWT token with user ID and role flags
   * Roles are included so frontend can immediately know permissions without extra request
   */
  generateToken(user: any) {
    const payload = {
      sub: user.id,
      isModerator: user.isModerator || false,
      isSuperAdmin: user.isSuperAdmin || false,
      iat: Math.floor(Date.now() / 1000),
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isModerator: true,
        isSuperAdmin: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        locationName: true,
        lastActiveAt: true,
      },
    });

    if (!user) return null;

    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil || user.suspendedUntil > now
    );
    if (isSuspended) {
      this.logger.warn(`Suspended user attempted access: ${userId}`);
      return null;
    }
    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isModerator: true,
        isSuperAdmin: true,
        isSuspended: true,
        suspendedUntil: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil || user.suspendedUntil > now
    );
    if (isSuspended) throw new UnauthorizedException('Account suspended');

    const token = this.generateToken(user);
    return { token };
  }

  async logout(userId: string) {
    await this.prisma.member.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
    return { success: true, message: 'Logged out successfully' };
  }

  private async autoJoinGeneralGroup(userId: string) {
    try {
      let generalGroup = await this.prisma.group.findFirst({
        where: { name: 'General Discussion' }
      });
      if (!generalGroup) {
        const superAdmin = await this.prisma.member.findFirst({
          where: { isSuperAdmin: true }
        });
        generalGroup = await this.prisma.group.create({
          data: {
            name: 'General Discussion',
            description: 'Open conversations about faith, life, and everything. This is our community hub!',
            isPrivate: false,
            requireApproval: false,
            isDefault: true,
            allowAnonymous: true,
            createdById: superAdmin?.id || userId,
          },
        });
        this.logger.log('✅ Created General Discussion group');
      }
      const existingMember = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: generalGroup.id,
            memberId: userId,
          },
        },
      });
      if (!existingMember) {
        await this.prisma.groupMember.create({
          data: {
            groupId: generalGroup.id,
            memberId: userId,
            role: 'member',
            status: 'approved',
          },
        });
        await this.prisma.group.update({
          where: { id: generalGroup.id },
          data: { memberCount: { increment: 1 } },
        });
        this.logger.log(`✅ User ${userId} auto-joined General Discussion group`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to auto-join General Discussion group: ${error.message}`);
    }
  }
}