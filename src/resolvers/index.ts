import { authResolvers } from './auth.js';
import { userResolvers } from './user.js';
import { teamResolvers } from './team.js';
import { projectResolvers } from './project.js';
import { taskResolvers } from './task.js';
import { commentResolvers } from './comment.js';
import { tenantResolvers } from './tenant.js';
import { subscriptionResolvers } from './subscription.js';

// Deep merge resolver maps
function mergeResolvers(...resolverMaps: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, Record<string, unknown>> = {};

  for (const map of resolverMaps) {
    for (const [typeName, typeResolvers] of Object.entries(map)) {
      if (!merged[typeName]) {
        merged[typeName] = {};
      }
      Object.assign(merged[typeName], typeResolvers);
    }
  }

  return merged;
}

export const resolvers = mergeResolvers(
  authResolvers,
  userResolvers,
  teamResolvers,
  projectResolvers,
  taskResolvers,
  commentResolvers,
  tenantResolvers,
  subscriptionResolvers,
);
