// src/modules/community/dto/create-community-post.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsDateString, 
  IsNumber, 
  Min, 
  Max, 
  IsEmail, 
  IsIn, 
  IsNotEmpty, 
  MaxLength 
} from 'class-validator';

export class CreateCommunityPostDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['event', 'support', 'donation', 'general'])  
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description: string;

  // Event fields (optional)
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Location cannot exceed 200 characters' })
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  goalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Items needed cannot exceed 1000 characters' })
  itemsNeeded?: string;

  // Contact info (optional)
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  contactPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  contactEmail?: string;

}