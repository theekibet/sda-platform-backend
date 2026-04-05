import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsString()
  discussionId: string;

  @IsString()
  @IsOptional()
  parentId?: string; // If provided, this is a reply to another comment
}