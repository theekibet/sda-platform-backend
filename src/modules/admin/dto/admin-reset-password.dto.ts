import { IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}