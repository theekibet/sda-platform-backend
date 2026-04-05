import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreatePrayerRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Prayer request cannot exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}