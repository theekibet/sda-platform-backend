import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, MinLength, IsArray } from 'class-validator';

export enum MeetingType {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
  HYBRID = 'hybrid',
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  @MinLength(3, { message: 'Group name must be at least 3 characters' })
  @MaxLength(100, { message: 'Group name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Group description is required' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  description: string;

  // REMOVED: @IsEnum(GroupCategory) - replaced with flexible tags
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagNames?: string[]; // e.g., ["prayer", "anxiety", "support"]

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Location cannot exceed 200 characters' })
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Rules cannot exceed 5000 characters' })
  rules?: string;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Image URL cannot exceed 500 characters' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isLocationBased?: boolean;

  @IsOptional()
  @IsString() // Changed from IsEnum to allow any string, or keep MeetingType enum
  meetingType?: MeetingType | string;
}