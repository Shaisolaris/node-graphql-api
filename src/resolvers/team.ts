import { v4 as uuidv4 } from 'uuid';
import { store } from '../db/store.js';
import { requireAuth, requireRole } from '../auth/guards.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import type { GQLContext, Team } from '../types/index.js';
import { logger } from '../logger/index.js';

interface CreateTeamInput {
  name: string;
  description?: string;
}

interface AddTeamMemberInput {
  teamId: string;
  userId: string;
  role?: 'lead' | 'member';
}

export const teamResolvers = {
  Query: {
    teams(_: unknown, __: unknown, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      return store.getTeamsByTenant(auth.tenantId);
    },

    team(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const team = store.getTeam(args.id);
      if (!team || team.tenantId !== auth.tenantId) {
        throw new NotFoundError('Team', args.id);
      }
      return team;
    },
  },

  Mutation: {
    createTeam(_: unknown, args: { input: CreateTeamInput }, ctx: GQLContext) {
      const auth = requireRole(ctx, 'owner', 'admin');
      const now = new Date().toISOString();

      if (!args.input.name.trim()) {
        throw new ValidationError('Team name is required');
      }

      const team: Team = {
        id: uuidv4(),
        tenantId: auth.tenantId,
        name: args.input.name.trim(),
        description: args.input.description?.trim() ?? null,
        createdAt: now,
        updatedAt: now,
      };

      store.teams.set(team.id, team);
      logger.info('Team created', { teamId: team.id, tenantId: auth.tenantId });
      return team;
    },

    addTeamMember(_: unknown, args: { input: AddTeamMemberInput }, ctx: GQLContext) {
      const auth = requireRole(ctx, 'owner', 'admin');
      const team = store.getTeam(args.input.teamId);
      if (!team || team.tenantId !== auth.tenantId) {
        throw new NotFoundError('Team', args.input.teamId);
      }

      const user = store.getUser(args.input.userId);
      if (!user || user.tenantId !== auth.tenantId) {
        throw new NotFoundError('User', args.input.userId);
      }

      const existing = store.teamMembers.find(
        (tm) => tm.teamId === team.id && tm.userId === user.id,
      );
      if (existing) {
        throw new ValidationError('User is already a member of this team');
      }

      store.teamMembers.push({
        teamId: team.id,
        userId: user.id,
        role: args.input.role || 'member',
        joinedAt: new Date().toISOString(),
      });

      logger.info('Team member added', { teamId: team.id, userId: user.id });
      return team;
    },

    removeTeamMember(
      _: unknown,
      args: { teamId: string; userId: string },
      ctx: GQLContext,
    ) {
      const auth = requireRole(ctx, 'owner', 'admin');
      const team = store.getTeam(args.teamId);
      if (!team || team.tenantId !== auth.tenantId) {
        throw new NotFoundError('Team', args.teamId);
      }

      const idx = store.teamMembers.findIndex(
        (tm) => tm.teamId === args.teamId && tm.userId === args.userId,
      );
      if (idx === -1) {
        throw new NotFoundError('Team member');
      }

      store.teamMembers.splice(idx, 1);
      logger.info('Team member removed', { teamId: args.teamId, userId: args.userId });
      return team;
    },
  },

  Team: {
    async members(team: Team, _: unknown, ctx: GQLContext) {
      return ctx.loaders.teamMembersLoader.load(team.id);
    },

    async projects(team: Team, _: unknown, ctx: GQLContext) {
      return ctx.loaders.projectsByTeamLoader.load(team.id);
    },

    async tenant(team: Team) {
      return store.getTenant(team.tenantId);
    },
  },
};
