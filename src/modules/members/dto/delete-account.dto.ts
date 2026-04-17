// src/modules/members/dto/delete-account.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAccountRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;
}