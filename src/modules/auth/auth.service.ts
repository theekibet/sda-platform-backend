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
  
    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Check if user already exists
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
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Calculate age from date of birth if provided
    let age: number | null = null;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      // Adjust if birthday hasn't occurred this year
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
  
    // Create user
    const user = await this.prisma.member.create({
      data: {
        name: fullName,
        email,
        phone,
        password: hashedPassword,
        age: age,
        gender,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    // Auto-join General Discussion group (fire and forget)
    this.autoJoinGeneralGroup(user.id).catch(error => {
      this.logger.error(`Failed to auto-join group for user ${user.id}: ${error.message}`);
    });
  
    // Generate JWT token with minimal claims - we'll rely on DB for fresh data
    const token = this.generateToken(user);
  
    // Remove password from response
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
      message: 'Registration successful! Welcome to the community.',
    };
  }
  
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
  
    // Find user by email or phone
    const user = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }, // Allow login with phone too
        ],
      },
    });
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // Check if user is suspended BEFORE allowing login
    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil || // Permanent suspension
      user.suspendedUntil > now // Active temporary suspension
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
  
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // Update last active timestamp
    await this.prisma.member.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });
  
    // Generate token with minimal claims
    const token = this.generateToken(user);
  
    // Remove password from response
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
    };
  }

  /**
   * Generate JWT token with MINIMAL claims
   * We only put the user ID in the token - everything else comes from DB on each request
   * This ensures suspended users are blocked immediately and admin changes take effect instantly
   */
  generateToken(user: any) {
    const payload = {
      sub: user.id, // Only the user ID - nothing else!
      // No email, no name, no isAdmin - these will be fetched fresh from DB
      iat: Math.floor(Date.now() / 1000), // Issued at time
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validate user for JWT strategy
   * This is called by JwtStrategy.validate() to get fresh user data
   */
  async validateUser(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        locationName: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check suspension - if suspended, return null so JwtStrategy rejects
    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil ||
      user.suspendedUntil > now
    );

    if (isSuspended) {
      this.logger.warn(`Suspended user attempted access: ${userId}`);
      return null;
    }

    return user;
  }

  /**
   * Refresh token - generate a new token for a user
   * Useful when you want to extend a session without re-login
   */
  async refreshToken(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isSuspended: true,
        suspendedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check suspension
    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil ||
      user.suspendedUntil > now
    );

    if (isSuspended) {
      throw new UnauthorizedException('Account suspended');
    }

    // Generate new token
    const token = this.generateToken(user);

    return { token };
  }

  /**
   * Logout - invalidate token on client side
   * Since we use stateless JWT, we just return success
   * Client should discard the token
   */
  async logout(userId: string) {
    // Optionally record logout time
    await this.prisma.member.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  private async autoJoinGeneralGroup(userId: string) {
    try {
      // Find or create General Discussion group
      let generalGroup = await this.prisma.group.findFirst({
        where: { name: 'General Discussion' }
      });

      if (!generalGroup) {
        // Find an admin to be the creator
        const admin = await this.prisma.member.findFirst({
          where: { isAdmin: true }
        });

        generalGroup = await this.prisma.group.create({
          data: {
            name: 'General Discussion',
            description: 'Open conversations about faith, life, and everything. This is our community hub!',
            isPrivate: false,
            requireApproval: false,
            isDefault: true,
            allowAnonymous: true,
            createdById: admin?.id || userId, // Use admin if exists, otherwise the new user
          },
        });
        this.logger.log('✅ Created General Discussion group');
      }

      // Check if already a member
      const existingMember = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: generalGroup.id,
            memberId: userId,
          },
        },
      });

      if (!existingMember) {
        // Add user to group
        await this.prisma.groupMember.create({
          data: {
            groupId: generalGroup.id,
            memberId: userId,
            role: 'member',
            status: 'approved',
          },
        });

        // Update member count
        await this.prisma.group.update({
          where: { id: generalGroup.id },
          data: { memberCount: { increment: 1 } },
        });

        this.logger.log(`✅ User ${userId} auto-joined General Discussion group`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to auto-join General Discussion group: ${error.message}`);
      // Don't throw - this is a background operation
    }
  }
}