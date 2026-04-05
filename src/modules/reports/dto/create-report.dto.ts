import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsIn(['prayerRequest', 'testimony', 'groupMessage', 'communityPost', 'user'])
  contentType: 'prayerRequest' | 'testimony' | 'groupMessage' | 'communityPost' | 'user';

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsIn(['spam', 'harassment', 'inappropriate', 'hate speech', 'fake', 'other'])
  category: 'spam' | 'harassment' | 'inappropriate' | 'hate speech' | 'fake' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}