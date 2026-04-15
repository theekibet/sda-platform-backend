// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // ============ REGISTER WITH EMAIL VERIFICATION ============
  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password, phone, dateOfBirth, gender } = registerDto;
  
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Check email conflict
    if (email) {
      const existingEmail = await this.prisma.member.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }
    
    // Check phone conflict
    if (phone) {
      const existingPhone = await this.prisma.member.findUnique({
        where: { phone },
        select: { id: true },
      });
      if (existingPhone) {
        throw new ConflictException('A user with this phone number already exists');
      }
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

    // Generate email verification token (valid for 24 hours)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);
  
    const user = await this.prisma.member.create({
      data: {
        name: fullName,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        age: age,
        gender,
        dateOfBirth: birthDate,
        isActive: true,
        lastActiveAt: new Date(),
        username: null,
        lastUsernameChange: null,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
        authProvider: 'email',      // ✅ explicit
        lastLoginMethod: null,
        lastLoginAt: null,
      },
    });

    // Send verification email (if email exists)
    if (email) {
      await this.emailService.sendEmailVerificationEmail(email, emailVerificationToken, fullName);
    }
  
    const { password: _, ...result } = user;
  
    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      user: result,
    };
  }
  
  // ============ VERIFY EMAIL ============
  async verifyEmail(token: string) {
    const user = await this.prisma.member.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.prisma.member.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { success: true, message: 'Email verified successfully. You can now log in.' };
  }

  // ============ LOGIN WITH EMAIL VERIFICATION CHECK ============
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const { email, password } = loginDto;
  
    // Find user with explicit selection including role flags and username
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
        username: true,
        lastUsernameChange: true,
        emailVerified: true,
      },
    });
  
    let success = false;
    let failureReason: string | null = null;
    let userId: string | null = null;
    let userEmail: string = email;
    let isSuspendedAccount = false;

    // Validate credentials and determine outcome
    if (!user) {
      failureReason = 'User not found';
    } else {
      userId = user.id;
      userEmail = user.email || email;
      
      // Check email verification first
      if (!user.emailVerified) {
        failureReason = 'Email not verified. Please check your inbox for the verification link.';
        success = false;
      } else {
        const now = new Date();
        const isSuspended = user.isSuspended && (
          !user.suspendedUntil || user.suspendedUntil > now
        );

        if (isSuspended) {
          isSuspendedAccount = true;
          failureReason = `Account suspended${user.suspensionReason ? ': ' + user.suspensionReason : ''}`;
          if (user.suspendedUntil) {
            failureReason += ` until ${user.suspendedUntil.toLocaleDateString()}`;
          }
          this.logger.warn(`Suspended user attempted login: ${user.id}`);
        } else {
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            failureReason = 'Invalid password';
          } else {
            success = true;
          }
        }
      }
    }

    // Log the login attempt
    await this.prisma.loginAttempt.create({
      data: {
        email: userEmail,
        ipAddress,
        userAgent,
        success,
        failureReason,
        userId: userId,
      },
    });

    if (!success) {
      throw new UnauthorizedException(failureReason || 'Invalid credentials');
    }

    if (isSuspendedAccount) {
      throw new UnauthorizedException(failureReason);
    }

    // Update user's last login info and auth provider
    await this.prisma.member.update({
      where: { id: user!.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginMethod: 'email',
        authProvider: 'email',
        lastActiveAt: new Date(),
      },
    });

    // Create user session
    const sessionToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.userSession.create({
      data: {
        userId: user!.id,
        token: sessionToken,
        ipAddress: ipAddress,
        userAgent: userAgent,
        expiresAt: expiresAt,
        lastActive: new Date(),
        isRevoked: false,
      },
    });
  
    const token = this.generateToken(user!);
  
    const { password: _, ...result } = user!;
  
    return {
      ...result,
      token,
    };
  }

  /**
   * Generate JWT token with user ID, role flags, and username
   */
  generateToken(user: any) {
    const payload = {
      sub: user.id,
      username: user.username || null,
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
        username: true,
        emailVerified: true,
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
        username: true,
        emailVerified: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const now = new Date();
    const isSuspended = user.isSuspended && (
      !user.suspendedUntil || user.suspendedUntil > now
    );
    if (isSuspended) throw new UnauthorizedException('Account suspended');

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const token = this.generateToken(user);
    return { token };
  }

  async logout(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.member.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
    return { success: true, message: 'Logged out successfully' };
  }

  // ============ GOOGLE OAUTH (emails are already verified by Google) ============
  async validateOAuthUser(googleProfile: any) {
    const { googleId, email, name, avatarUrl, firstName, lastName } = googleProfile;

    // Check if user exists with this googleId
    let user = await this.prisma.member.findUnique({
      where: { googleId },
    });

    if (!user && email) {
      // Check if user exists with this email
      user = await this.prisma.member.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.member.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    }

    if (!user) {
      // Create new user – Google verified email, so set emailVerified = true
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await this.prisma.member.create({
        data: {
          googleId,
          email,
          name: name || `${firstName} ${lastName}`,
          password: hashedPassword,
          avatarUrl: avatarUrl || null,
          isActive: true,
          lastActiveAt: new Date(),
          username: null,
          emailVerified: true,
          authProvider: 'google',
          lastLoginMethod: null,
          lastLoginAt: null,
        },
      });
    }

    // Check if suspended
    const now = new Date();
    const isSuspended = user.isSuspended && (!user.suspendedUntil || user.suspendedUntil > now);
    if (isSuspended) {
      throw new UnauthorizedException('Account suspended');
    }

    // Update last login info
    await this.prisma.member.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginMethod: 'google',
        authProvider: 'google',
        lastActiveAt: new Date(),
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);
    
    // Remove password from response
    const { password: _, ...result } = user;
    
    return {
      ...result,
      token,
    };
  }
}