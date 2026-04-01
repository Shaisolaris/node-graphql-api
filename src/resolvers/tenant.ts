import { store } from '../db/store.js';
import { requireAuth } from '../auth/guards.js';
import type { GQLContext, Tenant } from '../types/index.js';

export const tenantResolvers = {
  Query: {
    tenant(_: unknown, __: unknown, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      return store.getTenant(auth.tenantId);
    },
  },

  Tenant: {
    plan(tenant: Tenant) {
      return tenant.plan.toUpperCase();
    },

    users(tenant: Tenant) {
      return store.getUsersByTenant(tenant.id);
    },

    teams(tenant: Tenant) {
      return store.getTeamsByTenant(tenant.id);
    },
  },
};
