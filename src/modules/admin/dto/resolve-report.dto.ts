import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class ResolveReportDto {
  @IsIn(['dismiss', 'warn_user', 'suspend_user', 'remove_content', 'ban_user'])
  action: 'dismiss' | 'warn_user' | 'suspend_user' | 'remove_content' | 'ban_user';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;

  @IsOptional()
  @IsString()
  suspensionDuration?: string;

  @IsOptional()
  @IsString()
  warningMessage?: string;
}