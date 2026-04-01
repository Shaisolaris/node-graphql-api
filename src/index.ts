import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createContext, createWsContext } from './context/index.js';
import { seed } from './db/seed.js';
import { logger } from './logger/index.js';
import type { GQLContext } from './types/index.js';

async function main() {
  const PORT = parseInt(process.env.PORT || '4000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  // Seed in-memory data
  seed();
  logger.info('Database seeded with sample data');

  // Build executable schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = makeExecutableSchema({ typeDefs, resolvers: resolvers as any });

  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const wsServerCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        return createWsContext(
          ctx.connectionParams as Record<string, unknown> | undefined,
        );
      },
      onConnect: async () => {
        logger.info('WebSocket client connected');
      },
      onDisconnect: async () => {
        logger.info('WebSocket client disconnected');
      },
    },
    wsServer,
  );

  // Apollo Server
  const server = new ApolloServer<GQLContext>({
    schema,
    plugins: [
      // Drain HTTP server on shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Drain WebSocket server on shutdown
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServerCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError, error) => {
      logger.error('GraphQL Error', {
        message: formattedError.message,
        code: formattedError.extensions?.code,
        path: formattedError.path,
      });

      // Hide internal errors in production
      if (
        process.env.NODE_ENV === 'production' &&
        !formattedError.extensions?.code
      ) {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }

      return formattedError;
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  logger.info('Apollo Server started');

  // Middleware
  app.use(cors<cors.CorsRequest>());
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // GraphQL endpoint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use('/graphql', expressMiddleware(server, { context: createContext }) as any);

  // Start server
  httpServer.listen(PORT, HOST, () => {
    logger.info(`🚀 GraphQL API ready at http://${HOST}:${PORT}/graphql`);
    logger.info(`🔌 Subscriptions ready at ws://${HOST}:${PORT}/graphql`);
    logger.info(`❤️  Health check at http://${HOST}:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    await server.stop();
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
