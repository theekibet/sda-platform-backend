// src/modules/admin/dto/user-query.dto.ts
import { IsOptional, IsString, IsBoolean, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isModerator?: boolean;  // ✅ CHANGED from isAdmin

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSuspended?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}