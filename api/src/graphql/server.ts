import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import { verifyToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GraphQLContext {
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role?: string;
    status?: string;
  };
  prisma: PrismaClient;
}

export async function createApolloServer(app: express.Application) {
  // Create HTTP server
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Plugin pour logger les erreurs
      {
        async requestDidStart() {
          return {
            async didEncounterErrors(ctx) {
              console.error('GraphQL Errors:', ctx.errors);
            },
          };
        },
      },
    ],
    formatError: (error) => {
      // Log l'erreur complète en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('GraphQL Error Details:', error);
      }

      // Retourner une erreur formatée
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.extensions?.stacktrace,
        }),
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  // Démarrer le serveur Apollo
  await server.start();

  // Appliquer le middleware Apollo à Express
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081', 'http://localhost:3000'],
      credentials: true,
    }),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        // Extraire le token du header
        let user = undefined;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);

          try {
            // Créer un mock request pour verifyToken
            const mockReq: any = {
              headers: { authorization: authHeader },
              cookies: req.cookies,
            };

            const mockRes: any = {
              status: () => mockRes,
              json: () => mockRes,
            };

            let nextCalled = false;
            const mockNext = () => {
              nextCalled = true;
            };

            verifyToken(mockReq, mockRes, mockNext);

            if (nextCalled && mockReq.user) {
              user = mockReq.user;
            }
          } catch (error) {
            console.error('Token verification failed:', error);
          }
        }

        return {
          user,
          prisma,
        };
      },
    })
  );

  console.log(`🚀 GraphQL server ready at http://localhost:${process.env.API_PORT || 5000}/graphql`);

  return { server, httpServer };
}

// Fonction pour fermer proprement les connexions
export async function closeConnections() {
  await prisma.$disconnect();
}

// Gérer les signaux de terminaison
process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT signal received: closing Prisma connections');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM signal received: closing Prisma connections');
  await closeConnections();
  process.exit(0);
});
