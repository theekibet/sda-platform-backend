// src/modules/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    // Ensure secret exists
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    try {
      // Extract user ID from payload
      const userId = payload.sub;
      
      if (!userId) {
        this.logger.warn('JWT payload missing sub claim');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Live DB check on EVERY request - get fresh user data
      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isModerator: true,      // ✅ CHANGED from isAdmin
          isSuperAdmin: true,
          isSuspended: true,
          suspendedUntil: true,
          suspensionReason: true,
          locationName: true,
          lastActiveAt: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found for ID: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      // Check if user is suspended
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
        
        this.logger.warn(`Suspended user attempted access: ${userId}`);
        throw new UnauthorizedException(suspensionMessage);
      }

      // Update last active timestamp (fire and forget - don't await)
      this.prisma.member.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      }).catch(err => {
        this.logger.error(`Failed to update lastActiveAt for user ${user.id}: ${err.message}`);
      });

      // Return fresh user data from DB - this will be available in @CurrentUser() decorator
      // We include both `id` (for backward compatibility) and `userId` (for new controllers)
      return {
        id: user.id,
        userId: user.id,           // ✅ added for consistent user identification
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isModerator: user.isModerator,  // ✅ CHANGED from isAdmin
        isSuperAdmin: user.isSuperAdmin,
        locationName: user.locationName,
      };

    } catch (error) {
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}