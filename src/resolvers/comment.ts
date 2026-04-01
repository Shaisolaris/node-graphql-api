import { v4 as uuidv4 } from 'uuid';
import { store } from '../db/store.js';
import { requireAuth } from '../auth/guards.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/index.js';
import { pubsub, EVENTS } from './pubsub.js';
import type { GQLContext, Comment } from '../types/index.js';
import { logger } from '../logger/index.js';

export const commentResolvers = {
  Mutation: {
    createComment(
      _: unknown,
      args: { input: { taskId: string; body: string } },
      ctx: GQLContext,
    ) {
      const auth = requireAuth(ctx);
      const { taskId, body } = args.input;

      if (!body.trim()) {
        throw new ValidationError('Comment body cannot be empty');
      }

      const task = store.getTask(taskId);
      if (!task || task.tenantId !== auth.tenantId) {
        throw new NotFoundError('Task', taskId);
      }

      const now = new Date().toISOString();
      const comment: Comment = {
        id: uuidv4(),
        tenantId: auth.tenantId,
        taskId,
        authorId: auth.userId,
        body: body.trim(),
        createdAt: now,
        updatedAt: now,
      };

      store.comments.set(comment.id, comment);
      logger.info('Comment created', { commentId: comment.id, taskId });

      pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: comment });
      return comment;
    },

    deleteComment(_: unknown, args: { id: string }, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const comment = store.getComment(args.id);
      if (!comment || comment.tenantId !== auth.tenantId) {
        throw new NotFoundError('Comment', args.id);
      }

      // Only the author or owner/admin can delete
      if (comment.authorId !== auth.userId && auth.role !== 'owner' && auth.role !== 'admin') {
        throw new ForbiddenError('Only the comment author or an admin can delete this comment');
      }

      store.comments.delete(comment.id);
      logger.info('Comment deleted', { commentId: comment.id });
      return true;
    },
  },

  Comment: {
    async task(comment: Comment, _: unknown, ctx: GQLContext) {
      return ctx.loaders.taskLoader.load(comment.taskId);
    },

    async author(comment: Comment, _: unknown, ctx: GQLContext) {
      return ctx.loaders.userLoader.load(comment.authorId);
    },
  },
};
