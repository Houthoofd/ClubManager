/**
 * Configuration du client Prisma pour l'API SaaS multitenant
 */

import { PrismaClient } from '@prisma/client';

// Instance globale Prisma pour réutilisation
let prisma: PrismaClient;

// Déclaration globale pour le développement
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Obtient ou crée une instance du client Prisma
 */
export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!prisma) {
      prisma = new PrismaClient({
        log: ['error'],
      });
    }
    return prisma;
  } else {
    // En développement, utiliser une instance globale pour éviter 
    // de multiples connexions lors du rechargement à chaud
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    return global.__prisma;
  }
}

/**
 * Ferme la connexion Prisma
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (global.__prisma) {
    await global.__prisma.$disconnect();
    global.__prisma = undefined;
  }
}

// Export de l'instance par défaut
export const prismaClient = getPrismaClient();

// Types exportés de Prisma
export type {
  Tenant,
  User,
  TenantSubscription,
  SubscriptionStatus,
  TenantStatus,
} from '@prisma/client';