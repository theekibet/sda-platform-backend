// src/modules/community/dto/community-response.dto.ts
import { IsString, IsOptional, IsIn, MaxLength, IsNotEmpty } from 'class-validator';

export class CommunityResponseDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['support'])  
  response: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  comment?: string;
}