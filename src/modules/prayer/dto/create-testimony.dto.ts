import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTestimonyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Testimony content cannot exceed 5000 characters' })
  content: string;

  @IsOptional()
  @IsString()
  prayerRequestId?: string;
}