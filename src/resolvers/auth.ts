import { store } from '../db/store.js';
import { comparePassword, generateTokens, verifyRefreshToken } from '../auth/jwt.js';
import { requireAuth } from '../auth/guards.js';
import { AuthenticationError, NotFoundError, ValidationError } from '../errors/index.js';
import type { GQLContext } from '../types/index.js';
import { logger } from '../logger/index.js';

export const authResolvers = {
  Query: {
    me(_: unknown, __: unknown, ctx: GQLContext) {
      const auth = requireAuth(ctx);
      const user = store.getUser(auth.userId);
      if (!user) throw new NotFoundError('User', auth.userId);
      return user;
    },
  },

  Mutation: {
    async login(_: unknown, args: { email: string; password: string }) {
      const { email, password } = args;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const user = store.getUserByEmail(email);
      if (!user) {
        logger.warn('Login attempt with unknown email', { email });
        throw new AuthenticationError('Invalid email or password');
      }

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        logger.warn('Login attempt with invalid password', { email });
        throw new AuthenticationError('Invalid email or password');
      }

      const tokens = generateTokens(user);
      logger.info('User logged in', { userId: user.id, tenantId: user.tenantId });

      return { ...tokens, user };
    },

    refreshToken(_: unknown, args: { refreshToken: string }) {
      const decoded = verifyRefreshToken(args.refreshToken);
      if (!decoded) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      const user = store.getUser(decoded.userId);
      if (!user) {
        throw new NotFoundError('User', decoded.userId);
      }

      const tokens = generateTokens(user);
      logger.info('Token refreshed', { userId: user.id });

      return { ...tokens, user };
    },
  },
};
