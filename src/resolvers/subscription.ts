import { pubsub, EVENTS } from './pubsub.js';
import type { Task, Comment } from '../types/index.js';

function withFilter<T>(
  asyncIteratorFn: () => AsyncIterator<T>,
  filterFn: (payload: Record<string, unknown>, variables: Record<string, unknown>) => boolean,
) {
  return {
    subscribe: () => {
      const iterator = asyncIteratorFn();
      const filteredIterator: AsyncIterator<T> = {
        async next() {
          while (true) {
            const result = await iterator.next();
            if (result.done) return result;
            if (filterFn(result.value as Record<string, unknown>, {})) {
              return result;
            }
          }
        },
        return: iterator.return?.bind(iterator),
        throw: iterator.throw?.bind(iterator),
      };
      return filteredIterator;
    },
  };
}

export const subscriptionResolvers = {
  Subscription: {
    taskUpdated: {
      subscribe(_: unknown, args: { projectId?: string }) {
        if (args.projectId) {
          return withFilter(
            () => pubsub.asyncIterableIterator(EVENTS.TASK_UPDATED) as unknown as AsyncIterator<unknown>,
            (payload) => {
              const task = (payload as { taskUpdated: Task }).taskUpdated;
              return task.projectId === args.projectId;
            },
          ).subscribe();
        }
        return pubsub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      },
    },

    taskCreated: {
      subscribe(_: unknown, args: { projectId?: string }) {
        if (args.projectId) {
          return withFilter(
            () => pubsub.asyncIterableIterator(EVENTS.TASK_CREATED) as unknown as AsyncIterator<unknown>,
            (payload) => {
              const task = (payload as { taskCreated: Task }).taskCreated;
              return task.projectId === args.projectId;
            },
          ).subscribe();
        }
        return pubsub.asyncIterableIterator(EVENTS.TASK_CREATED);
      },
    },

    commentAdded: {
      subscribe(_: unknown, args: { taskId: string }) {
        return withFilter(
          () => pubsub.asyncIterableIterator(EVENTS.COMMENT_ADDED) as unknown as AsyncIterator<unknown>,
          (payload) => {
            const comment = (payload as { commentAdded: Comment }).commentAdded;
            return comment.taskId === args.taskId;
          },
        ).subscribe();
      },
    },
  },
};
