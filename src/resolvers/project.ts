import { v4 as uuidv4 } from 'uuid';
import { store } from '../db/store.js';
import { requireAuth, requireRole } from '../auth/guards.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import { paginate } from '../utils/pagination.js';
import type { GQLContext, Project, PaginationArgs, ProjectStatus, TaskStatus } from '../types/index.js';
import { logger } from '../logger/index.js';

interface CreateProjectInput {
  name: string;
  description?: string;
  teamId: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

function toDbStatus(gqlStatus: string): Project['status'] {
  const map: Record<string, Project['status']> = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
  };
  return map[gqlStatus] ?? 'planning';
}

export const projectResolvers = {
  Query: {
    projects(
      _: unknown,
      args: PaginationArgs & { status?: string },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      let projects = store.getProjectsByTenant(auth.tenantId);
      if (args.status) {
        const dbStatus = toDbStatus(args.status);
        projects = projects.filter((p) => p.status === dbStatus);
      }
      return paginate(projects, args);
    },

    project(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const project = store.getProject(args.id);
      if (!project || project.tenantId !== auth.tenantId) {
        throw new NotFoundError('Project', args.id);
      }
      return project;
    },
  },

  Mutation: {
    createProject(_: unknown, args: { input: CreateProjectInput }, ctx: GQLContext) {
      const auth = requireAuth(ctx);

      if (!args.input.name.trim()) {
        throw new ValidationError('Project name is required');
      }

      const team = store.getTeam(args.input.teamId);
      if (!team || team.tenantId !== auth.tenantId) {
        throw new NotFoundError('Team', args.input.teamId);
      }

      const now = new Date().toISOString();
      const project: Project = {
        id: uuidv4(),
        tenantId: auth.tenantId,
        teamId: args.input.teamId,
        name: args.input.name.trim(),
        description: args.input.description?.trim() ?? null,
        status: args.input.status ? toDbStatus(args.input.status) : 'planning',
        startDate: args.input.startDate ?? null,
        endDate: args.input.endDate ?? null,
        createdById: auth.userId,
        createdAt: now,
        updatedAt: now,
      };

      store.projects.set(project.id, project);
      logger.info('Project created', { projectId: project.id, tenantId: auth.tenantId });
      return project;
    },

    updateProject(
      _: unknown,
      args: { id: string; input: UpdateProjectInput },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      const project = store.getProject(args.id);
      if (!project || project.tenantId !== auth.tenantId) {
        throw new NotFoundError('Project', args.id);
      }

      const now = new Date().toISOString();
      const updated: Project = {
        ...project,
        name: args.input.name?.trim() ?? project.name,
        description: args.input.description !== undefined
          ? (args.input.description?.trim() ?? null)
          : project.description,
        status: args.input.status ? toDbStatus(args.input.status) : project.status,
        startDate: args.input.startDate !== undefined ? (args.input.startDate ?? null) : project.startDate,
        endDate: args.input.endDate !== undefined ? (args.input.endDate ?? null) : project.endDate,
        updatedAt: now,
      };

      store.projects.set(project.id, updated);
      logger.info('Project updated', { projectId: project.id });
      return updated;
    },

    deleteProject(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireRole(ctx, 'owner', 'admin');
      const project = store.getProject(args.id);
      if (!project || project.tenantId !== auth.tenantId) {
        throw new NotFoundError('Project', args.id);
      }

      // Delete associated tasks and comments
      const tasks = store.getTasksByProject(project.id);
      for (const task of tasks) {
        const comments = store.getCommentsByTask(task.id);
        for (const comment of comments) {
          store.comments.delete(comment.id);
        }
        store.tasks.delete(task.id);
      }

      store.projects.delete(project.id);
      logger.info('Project deleted', { projectId: project.id });
      return true;
    },
  },

  Project: {
    status(project: Project) {
      return project.status.toUpperCase();
    },

    async team(project: Project, _: unknown, ctx: GQLContext) {
      return ctx.loaders.teamLoader.load(project.teamId);
    },

    async createdBy(project: Project, _: unknown, ctx: GQLContext) {
      return ctx.loaders.userLoader.load(project.createdById);
    },

    async tasks(
      project: Project,
      args: PaginationArgs & { status?: string },
      ctx: GQLContext,
    ) {
      let tasks = await ctx.loaders.tasksByProjectLoader.load(project.id);
      if (args.status) {
        const dbStatus = args.status.toLowerCase() as TaskStatus;
        tasks = tasks.filter((t) => t.status === dbStatus);
      }
      return paginate(tasks, args);
    },

    async tenant(project: Project) {
      return store.getTenant(project.tenantId);
    },
  },
};
