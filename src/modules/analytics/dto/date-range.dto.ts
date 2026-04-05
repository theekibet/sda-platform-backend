import { IsOptional, IsString, IsIn } from 'class-validator';

export class DateRangeDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}