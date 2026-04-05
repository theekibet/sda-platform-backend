import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';

export class BulkUserActionDto {
  @IsIn(['suspend', 'unsuspend', 'delete', 'makeAdmin', 'removeAdmin'])
  action: 'suspend' | 'unsuspend' | 'delete' | 'makeAdmin' | 'removeAdmin';

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