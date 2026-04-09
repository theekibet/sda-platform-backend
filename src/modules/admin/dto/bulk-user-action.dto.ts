// src/modules/admin/dto/bulk-user-action.dto.ts
import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';

export class BulkUserActionDto {
  @IsIn(['suspend', 'unsuspend', 'delete', 'makeModerator', 'removeModerator'])  // ✅ CHANGED
  action: 'suspend' | 'unsuspend' | 'delete' | 'makeModerator' | 'removeModerator';  // ✅ CHANGED

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds: string[];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  duration?: string; // For suspensions: '1', '7', '30', 'permanent'
}