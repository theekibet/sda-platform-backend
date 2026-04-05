import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class GroupRequestDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message?: string;
}