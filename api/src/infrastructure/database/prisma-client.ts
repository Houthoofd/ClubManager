/**
 * Prisma Client Singleton
 * Gère l'instance unique du client Prisma pour éviter les problèmes de connexions multiples
 */

import { PrismaClient } from '../generated/prisma/index.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Instance globale du client Prisma
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

export default prisma;
