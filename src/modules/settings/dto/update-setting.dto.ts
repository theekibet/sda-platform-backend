import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Key cannot exceed 100 characters' })
  key: string;

  value: any;

  @IsOptional()
  @IsIn(['string', 'number', 'boolean', 'json'])
  type?: 'string' | 'number' | 'boolean' | 'json';

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Category cannot exceed 50 characters' })
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;
}