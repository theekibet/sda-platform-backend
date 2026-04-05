import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Church name cannot exceed 100 characters' })
  church?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Conference name cannot exceed 100 characters' })
  conference?: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsDateString()
  baptismDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}