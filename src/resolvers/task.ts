import { v4 as uuidv4 } from 'uuid';
import { store } from '../db/store.js';
import { requireAuth } from '../auth/guards.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import { paginate } from '../utils/pagination.js';
import { pubsub, EVENTS } from './pubsub.js';
import type { GQLContext, Task, PaginationArgs, TaskStatus, TaskPriority } from '../types/index.js';
import { logger } from '../logger/index.js';

interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  dueDate?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

function toDbTaskStatus(gql: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
  };
  return map[gql] ?? 'todo';
}

function toDbPriority(gql: string): TaskPriority {
  const map: Record<string, TaskPriority> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  };
  return map[gql] ?? 'medium';
}

export const taskResolvers = {
  Query: {
    tasks(
      _: unknown,
      args: PaginationArgs & { status?: string; priority?: string },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      let tasks = store.getTasksByTenant(auth.tenantId);
      if (args.status) {
        const dbStatus = toDbTaskStatus(args.status);
        tasks = tasks.filter((t) => t.status === dbStatus);
      }
      if (args.priority) {
        const dbPriority = toDbPriority(args.priority);
        tasks = tasks.filter((t) => t.priority === dbPriority);
      }
      return paginate(tasks, args);
    },

    task(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const task = store.getTask(args.id);
      if (!task || task.tenantId !== auth.tenantId) {
        throw new NotFoundError('Task', args.id);
      }
      return task;
    },

    myTasks(
      _: unknown,
      args: PaginationArgs & { status?: string },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      let tasks = store.getTasksByAssignee(auth.userId);
      if (args.status) {
        const dbStatus = toDbTaskStatus(args.status);
        tasks = tasks.filter((t) => t.status === dbStatus);
      }
      return paginate(tasks, args);
    },
  },

  Mutation: {
    createTask(_: unknown, args: { input: CreateTaskInput }, ctx: GQLContext) {
      const auth = requireAuth(ctx);

      if (!args.input.title.trim()) {
        throw new ValidationError('Task title is required');
      }

      const project = store.getProject(args.input.projectId);
      if (!project || project.tenantId !== auth.tenantId) {
        throw new NotFoundError('Project', args.input.projectId);
      }

      if (args.input.assigneeId) {
        const assignee = store.getUser(args.input.assigneeId);
        if (!assignee || assignee.tenantId !== auth.tenantId) {
          throw new NotFoundError('Assignee', args.input.assigneeId);
        }
      }

      const now = new Date().toISOString();
      const task: Task = {
        id: uuidv4(),
        tenantId: auth.tenantId,
        projectId: args.input.projectId,
        assigneeId: args.input.assigneeId ?? null,
        title: args.input.title.trim(),
        description: args.input.description?.trim() ?? null,
        status: 'todo',
        priority: args.input.priority ? toDbPriority(args.input.priority) : 'medium',
        dueDate: args.input.dueDate ?? null,
        completedAt: null,
        createdById: auth.userId,
        createdAt: now,
        updatedAt: now,
      };

      store.tasks.set(task.id, task);
      logger.info('Task created', { taskId: task.id, projectId: task.projectId });

      pubsub.publish(EVENTS.TASK_CREATED, { taskCreated: task });
      return task;
    },

    updateTask(
      _: unknown,
      args: { id: string; input: UpdateTaskInput },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      const task = store.getTask(args.id);
      if (!task || task.tenantId !== auth.tenantId) {
        throw new NotFoundError('Task', args.id);
      }

      if (args.input.assigneeId) {
        const assignee = store.getUser(args.input.assigneeId);
        if (!assignee || assignee.tenantId !== auth.tenantId) {
          throw new NotFoundError('Assignee', args.input.assigneeId);
        }
      }

      const now = new Date().toISOString();
      const newStatus = args.input.status ? toDbTaskStatus(args.input.status) : task.status;
      const wasCompleted = task.status === 'done';
      const isNowCompleted = newStatus === 'done';

      const updated: Task = {
        ...task,
        title: args.input.title?.trim() ?? task.title,
        description: args.input.description !== undefined
          ? (args.input.description?.trim() ?? null)
          : task.description,
        status: newStatus,
        priority: args.input.priority ? toDbPriority(args.input.priority) : task.priority,
        assigneeId: args.input.assigneeId !== undefined
          ? (args.input.assigneeId ?? null)
          : task.assigneeId,
        dueDate: args.input.dueDate !== undefined
          ? (args.input.dueDate ?? null)
          : task.dueDate,
        completedAt: isNowCompleted && !wasCompleted ? now : (isNowCompleted ? task.completedAt : null),
        updatedAt: now,
      };

      store.tasks.set(task.id, updated);
      logger.info('Task updated', { taskId: task.id, status: updated.status });

      pubsub.publish(EVENTS.TASK_UPDATED, { taskUpdated: updated });
      return updated;
    },

    deleteTask(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const task = store.getTask(args.id);
      if (!task || task.tenantId !== auth.tenantId) {
        throw new NotFoundError('Task', args.id);
      }

      // Delete associated comments
      const comments = store.getCommentsByTask(task.id);
      for (const comment of comments) {
        store.comments.delete(comment.id);
      }

      store.tasks.delete(task.id);
      logger.info('Task deleted', { taskId: task.id });
      return true;
    },
  },

  Task: {
    status(task: Task) {
      return task.status.toUpperCase();
    },

    priority(task: Task) {
      return task.priority.toUpperCase();
    },

    async project(task: Task, _: unknown, ctx: GQLContext) {
      return ctx.loaders.projectLoader.load(task.projectId);
    },

    async assignee(task: Task, _: unknown, ctx: GQLContext) {
      if (!task.assigneeId) return null;
      return ctx.loaders.userLoader.load(task.assigneeId);
    },

    async createdBy(task: Task, _: unknown, ctx: GQLContext) {
      return ctx.loaders.userLoader.load(task.createdById);
    },

    async comments(task: Task, args: PaginationArgs, ctx: GQLContext) {
      const comments = await ctx.loaders.commentsByTaskLoader.load(task.id);
      return paginate(comments, args);
    },

    async tenant(task: Task) {
      return store.getTenant(task.tenantId);
    },
  },
};
