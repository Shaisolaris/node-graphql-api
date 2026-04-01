import type { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { extractTokenFromHeader, verifyAccessToken } from '../auth/jwt.js';
import { createLoaders } from '../loaders/index.js';
import type { GQLContext } from '../types/index.js';
import { logger } from '../logger/index.js';

export async function createContext(
  { req }: ExpressContextFunctionArgument,
): Promise<GQLContext> {
  const token = extractTokenFromHeader(req.headers.authorization);
  let user = null;

  if (token) {
    user = verifyAccessToken(token);
    if (user) {
      logger.debug('Authenticated request', { userId: user.userId, tenantId: user.tenantId });
    } else {
      logger.debug('Invalid token provided');
    }
  }

  return {
    user,
    loaders: createLoaders(),
  };
}

export function createWsContext(
  connectionParams: Record<string, unknown> | undefined,
): GQLContext {
  let user = null;

  if (connectionParams?.Authorization) {
    const token = extractTokenFromHeader(connectionParams.Authorization as string);
    if (token) {
      user = verifyAccessToken(token);
    }
  }

  return {
    user,
    loaders: createLoaders(),
  };
}
