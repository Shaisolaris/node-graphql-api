import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const EVENTS = {
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_CREATED: 'TASK_CREATED',
  COMMENT_ADDED: 'COMMENT_ADDED',
} as const;
