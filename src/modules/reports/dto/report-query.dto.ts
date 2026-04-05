import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'investigating', 'resolved', 'dismissed'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['prayerRequest', 'testimony', 'groupMessage', 'communityPost', 'user'])
  contentType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsString()
  search?: string;

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
}