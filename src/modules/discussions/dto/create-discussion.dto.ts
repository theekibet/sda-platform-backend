import { IsString, IsOptional, IsBoolean, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateDiscussionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagNames?: string[];

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}