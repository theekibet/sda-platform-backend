// src/modules/notifications/dto/create-notification.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Type cannot exceed 50 characters' })
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  userId: string;
}