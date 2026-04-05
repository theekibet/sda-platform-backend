import { IsIP, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class BlockIpDto {
  @IsIP()
  ipAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}