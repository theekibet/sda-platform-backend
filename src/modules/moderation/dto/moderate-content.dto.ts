import { IsString, IsOptional, IsBoolean, IsIn, MaxLength } from 'class-validator';

export class ModerateContentDto {
  @IsIn(['approve', 'remove', 'warn', 'flag', 'dismiss'])
  action: 'approve' | 'remove' | 'warn' | 'flag' | 'dismiss';

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;

  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;

  @IsOptional()
  @IsBoolean()
  sendWarning?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Warning message cannot exceed 500 characters' })
  warningMessage?: string;
}