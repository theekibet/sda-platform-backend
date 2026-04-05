import { IsString, IsOptional, IsEmail, IsInt, IsUrl, MinLength, MaxLength, Min, Max, IsIn, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Type(() => Number)          // ← explicit transform, handles empty string too
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be valid' })
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}