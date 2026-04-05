// src/modules/auth/password-reset.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createResetToken(email: string): Promise<void> {
    // Find user by email
    const user = await this.prisma.member.findUnique({
      where: { email },
    });

    // For security, don't reveal if user exists
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

      // Delete any existing reset tokens for this email
      await this.prisma.passwordReset.deleteMany({
        where: { email },
      });

      // Create new reset token
      await this.prisma.passwordReset.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Send email with reset link
      const emailResult = await this.emailService.sendPasswordResetEmail(
        email,
        token,
        user.name || 'User',
      );

      if (!emailResult.success) {
        this.logger.error(`Failed to send password reset email to ${email}: ${emailResult.message}`);
        // Don't throw error to avoid exposing email service issues
      } else {
        this.logger.log(`Password reset email sent to ${email}`);
        if (emailResult.previewUrl) {
          this.logger.log(`Preview URL: ${emailResult.previewUrl}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error creating password reset token for ${email}: ${error.message}`);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find the reset token
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      this.logger.warn(`Invalid password reset token used: ${token}`);
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is used
    if (resetRecord.used) {
      this.logger.warn(`Already used password reset token: ${token}`);
      throw new BadRequestException('This reset link has already been used');
    }

    // Check if token is expired
    if (resetRecord.expiresAt < new Date()) {
      this.logger.warn(`Expired password reset token: ${token}`);
      throw new BadRequestException('Reset link has expired. Please request a new one.');
    }

    // Find the user
    const user = await this.prisma.member.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      this.logger.error(`User not found for email: ${resetRecord.email} during password reset`);
      throw new NotFoundException('User not found');
    }

    // Check if user has an email (should have, but just in case)
    if (!user.email) {
      this.logger.error(`User ${user.id} has no email address`);
      throw new BadRequestException('User account has no email address. Please contact support.');
    }

    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update user password
        await tx.member.update({
          where: { id: user.id },
          data: { 
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            // Add admin note about password reset
            adminNotes: user.adminNotes 
              ? `${user.adminNotes}\n\n[${new Date().toISOString()}] Password reset via forgot password flow`
              : `[${new Date().toISOString()}] Password reset via forgot password flow`,
          },
        });

        // Mark reset token as used
        await tx.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true },
        });

        // Terminate all active sessions for security
        await tx.userSession.updateMany({
          where: { 
            userId: user.id, 
            isRevoked: false 
          },
          data: { isRevoked: true },
        });
      });

      this.logger.log(`Password reset successful for user: ${user.email}`);

      // Send confirmation email (optional, but good practice)
      await this.emailService.sendNotificationEmail(
        user.email, // ✅ Now guaranteed to be a string (checked above)
        user.name || 'User',
        'Password Reset Successful',
        'Your password has been successfully reset. If you did not perform this action, please contact support immediately.',
      );
    } catch (error) {
      this.logger.error(`Error resetting password for ${user.email}: ${error.message}`);
      throw new BadRequestException('Failed to reset password. Please try again.');
    }
  }

  async validateResetToken(token: string): Promise<boolean> {
    try {
      const resetRecord = await this.prisma.passwordReset.findUnique({
        where: { token },
      });

      if (!resetRecord) {
        return false;
      }

      // Check if token is valid (not used and not expired)
      const isValid = !resetRecord.used && resetRecord.expiresAt > new Date();
      
      if (!isValid) {
        this.logger.debug(`Invalid token validation: used=${resetRecord.used}, expired=${resetRecord.expiresAt < new Date()}`);
      }
      
      return isValid;
    } catch (error) {
      this.logger.error(`Error validating reset token: ${error.message}`);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.passwordReset.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired
            { used: true }, // Already used
          ],
        },
      });
      
      this.logger.log(`Cleaned up ${result.count} expired/used password reset tokens`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error cleaning up expired tokens: ${error.message}`);
      return 0;
    }
  }
}