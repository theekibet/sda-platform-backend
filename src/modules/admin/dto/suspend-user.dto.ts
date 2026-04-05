import { IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';

export class SuspendUserDto {
  @IsBoolean()
  suspend: boolean;

  @IsOptional()
  @IsDateString()
  until?: string; // ISO date string

  @IsOptional()
  @IsString()
  reason?: string;
}