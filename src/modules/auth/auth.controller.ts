// src/modules/auth/auth.controller.ts
import { 
  Controller, Post, Body, HttpCode, HttpStatus, Get, Query 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ============ PASSWORD RESET ENDPOINTS ============

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.passwordResetService.createResetToken(forgotPasswordDto.email);
    return {
      success: true,
      message: 'If an account exists with that email, you will receive password reset instructions.',
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
      message: 'Password reset successful. You can now log in with your new password.',
    };
  }

  @Get('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Query('token') token: string) {
    const isValid = await this.passwordResetService.validateResetToken(token);
    return { 
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired'
    };
  }
}