import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, IsArray, MaxLength } from 'class-validator';

export class FeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userGroups?: string[];
}