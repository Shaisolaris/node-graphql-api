import { store } from '../db/store.js';
import { requireAuth } from '../auth/guards.js';
import { NotFoundError } from '../errors/index.js';
import { paginate } from '../utils/pagination.js';
import type { GQLContext, User, PaginationArgs, TaskStatus } from '../types/index.js';

export const userResolvers = {
  Query: {
    users(_: unknown, args: PaginationArgs, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const users = store.getUsersByTenant(auth.tenantId);
      return paginate(users, args);
    },

    user(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const user = store.getUser(args.id);
      if (!user || user.tenantId !== auth.tenantId) {
        throw new NotFoundError('User', args.id);
      }
      return user;
    },
  },

  User: {
    fullName(user: User) {
      return `${user.firstName} ${user.lastName}`;
    },

    async tenant(user: User, _: unknown, ctx: GQLContext) {
      return store.getTenant(user.tenantId);
    },

    async teams(user: User, _: unknown, ctx: GQLContext) {
      return ctx.loaders.userTeamsLoader.load(user.id);
    },

    async assignedTasks(
      user: User,
      args: PaginationArgs & { status?: TaskStatus },
      ctx: GQLContext,
    ) {
      let tasks = await ctx.loaders.tasksByAssigneeLoader.load(user.id);
      if (args.status) {
        tasks = tasks.filter((t) => t.status === args.status);
      }
      return paginate(tasks, args);
    },
  },
};
