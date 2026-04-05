// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsDateString, IsIn, Matches, IsNotEmpty, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;
}