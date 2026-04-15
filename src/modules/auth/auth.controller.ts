// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  // ============ EMAIL VERIFICATION ENDPOINT ============
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Optional: GET method for convenience (clicking link in email)
  @Get('verify-email')
  async verifyEmailGet(@Query('token') token: string, @Res() res: Response) {
    const result = await this.authService.verifyEmail(token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Redirect to frontend verification page with result
    const encodedResult = encodeURIComponent(JSON.stringify(result));
    return res.redirect(`${frontendUrl}/verify-email?status=success&message=${encodedResult}`);
  }

  // ============ PASSWORD RESET ENDPOINTS ============

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.passwordResetService.createResetToken(forgotPasswordDto.email);
    return {
      success: true,
      message:
        'If an account exists with that email, you will receive password reset instructions.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return {
      success: true,
      message:
        'Password reset successful. You can now log in with your new password.',
    };
  }

  @Get('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Query('token') token: string) {
    const isValid = await this.passwordResetService.validateResetToken(token);
    return {
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired',
    };
  }

  // ============ GOOGLE OAUTH ENDPOINTS ============

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const user = await this.authService.validateOAuthUser(req.user);
    const { token, ...userWithoutToken } = user;
    const userEncoded = encodeURIComponent(JSON.stringify(userWithoutToken));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/google/callback?token=${token}&user=${userEncoded}`,
    );
  }

  // Optional: For frontend token exchange (if using popup method)
  @Post('google/token')
  async googleTokenExchange(@Body('idToken') idToken: string) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = await this.authService.validateOAuthUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
      firstName: payload.given_name,
      lastName: payload.family_name,
    });
    return user;
  }
}