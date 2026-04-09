// src/modules/notifications/dto/update-preferences.dto.ts
import { IsBoolean, IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class UpdatePreferencesDto {
  // Global
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  // Community
  @IsOptional()
  @IsBoolean()
  communityPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  communityResponses?: boolean;

  @IsOptional()
  @IsBoolean()
  postMentions?: boolean;

  // Discussions
  @IsOptional()
  @IsBoolean()
  discussionReplies?: boolean;

  @IsOptional()
  @IsBoolean()
  discussionUpvotes?: boolean;

  @IsOptional()
  @IsBoolean()
  discussionMentions?: boolean;

  // Prayer
  @IsOptional()
  @IsBoolean()
  prayerResponses?: boolean;

  // Bible
  @IsOptional()
  @IsBoolean()
  versePublished?: boolean;

  // Groups
  @IsOptional()
  @IsBoolean()
  groupInvites?: boolean;

  // System
  @IsOptional()
  @IsBoolean()
  announcements?: boolean;

  // Digest
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'never'])
  digestFrequency?: string;

  // Quiet hours
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @IsIn([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])
  quietHoursStart?: number;

  @IsOptional()
  @IsNumber()
  @IsIn([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])
  quietHoursEnd?: number;
}