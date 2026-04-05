// src/modules/announcements/dto/create-announcement.dto.ts
import { IsString, IsOptional, IsIn, IsArray, IsBoolean, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Content cannot exceed 10000 characters' })
  content: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'success', 'maintenance'])
  type?: 'info' | 'warning' | 'success' | 'maintenance';

  @IsOptional()
  @IsIn(['all', 'admin', 'user'])
  targetRole?: 'all' | 'admin' | 'user';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUsers?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()  
  @IsBoolean()   
  isActive?: boolean;
}