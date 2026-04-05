import { IsBoolean, IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  communityPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  communityResponses?: boolean;

  @IsOptional()
  @IsBoolean()
  postMentions?: boolean;

  @IsOptional()
  @IsBoolean()
  groupMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  prayerResponses?: boolean;

  @IsOptional()
  @IsBoolean()
  announcements?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'never'])
  digestFrequency?: string;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  quietHoursStart?: number;

  @IsOptional()
  @IsNumber()
  quietHoursEnd?: number;
}