// src/common/guards/super-admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('You must be logged in');
    }

    if (!user.isSuperAdmin) {
      throw new ForbiddenException(
        'This action requires super admin privileges',
      );
    }

    return true;
  }
}