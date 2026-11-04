import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isHrRole, isBossRole, isWebAdminRole, UserRole } from '@wr/contracts';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Không có @Roles() → cho phép tất cả authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      return false;
    }

    if (isHrRole(user.role) && requiredRoles.some((role) => isHrRole(role))) {
      return true;
    }

    if (isBossRole(user.role) && requiredRoles.some((role) => isBossRole(role))) {
      return true;
    }

    if (isWebAdminRole(user.role) && requiredRoles.some((role) => isWebAdminRole(role))) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
