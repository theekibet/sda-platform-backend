// src/modules/moderation/dto/moderation-query.dto.ts
import { IsOptional, IsString, IsIn, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ModerationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['prayerRequest', 'testimony', 'groupDiscussion', 'groupMessage', 'communityPost', 'user'])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'investigating', 'resolved', 'dismissed'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Search term cannot exceed 200 characters' })
  search?: string;
}