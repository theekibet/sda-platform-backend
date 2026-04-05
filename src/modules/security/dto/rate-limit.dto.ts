import { IsString, IsInt, Min, IsOptional, MaxLength } from 'class-validator';

export class RateLimitDto {
  @IsString()
  @MaxLength(100, { message: 'Endpoint cannot exceed 100 characters' })
  endpoint: string;

  @IsInt()
  @Min(1)
  limit: number;

  @IsInt()
  @Min(1)
  window: number; // in seconds

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Message cannot exceed 200 characters' })
  message?: string;
}