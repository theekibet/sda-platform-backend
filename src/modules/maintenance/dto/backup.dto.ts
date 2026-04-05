import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, MaxLength } from 'class-validator';

export class BackupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Filename cannot exceed 255 characters' })
  filename: string;

  @IsOptional()
  @IsIn(['manual', 'scheduled', 'pre-update'], { message: 'Type must be manual, scheduled, or pre-update' })
  type?: 'manual' | 'scheduled' | 'pre-update';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeTables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeTables?: string[];
}