// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not defined');
        }

        // Parse expiry from string to seconds
        const expiresInString = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        const expiresInSeconds = parseExpiryToSeconds(expiresInString);

        return {
          secret,
          signOptions: { 
            expiresIn: expiresInSeconds, // Now it's a number, which satisfies the type
          },
        };
      },
    }),
    EmailModule,
  ],
  controllers: [AuthController],  
  providers: [
    AuthService, 
    PrismaService, 
    JwtStrategy,
    PasswordResetService, // ✅ Added PasswordResetService to providers
  ],  
  exports: [AuthService],  
})
export class AuthModule {}

// Helper function to parse expiry string to seconds
function parseExpiryToSeconds(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return parseInt(expiry, 10) || 604800; // Default to 7 days
  }
}