import type { GQLContext, AuthPayload, User } from '../types/index.js';
import { AuthenticationError, ForbiddenError } from '../errors/index.js';

export function requireAuth(ctx: GQLContext): AuthPayload {
  if (!ctx.user) {
    throw new AuthenticationError();
  }
  return ctx.user;
}

export function requireRole(ctx: GQLContext, ...roles: User['role'][]): AuthPayload {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(' or ')}`);
  }
  return user;
}

export function requireTenant(ctx: GQLContext, resourceTenantId: string): AuthPayload {
  const user = requireAuth(ctx);
  if (user.tenantId !== resourceTenantId) {
    throw new ForbiddenError('Resource does not belong to your tenant');
  }
  return user;
}
