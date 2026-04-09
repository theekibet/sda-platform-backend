// src/common/guards/moderator.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ModeratorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('You must be logged in');
    }

    // Allow if super admin OR moderator
    if (!user.isSuperAdmin && !user.isModerator) {
      throw new ForbiddenException(
        'This action requires moderator or super admin privileges',
      );
    }

    return true;
  }
}