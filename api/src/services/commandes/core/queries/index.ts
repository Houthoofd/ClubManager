/**
 * Module de requêtes - Récupération des commandes
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Commande } from '@clubmanager/types';

/**
 * Récupère toutes les commandes
 */
export async function obtenirToutesCommandes(prisma = defaultPrisma): Promise<Commande[]> {
  console.log('📋 [CommandesQueries] Récupération toutes commandes');

  const commandes = await prisma.commandes.findMany({
    include: {
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_commande: 'desc',
    },
  });

  return commandes.map(transformCommande);
}

/**
 * Récupère une commande par ID
 */
export async function obtenirCommandeParId(commandeId: string, prisma = defaultPrisma): Promise<Commande | null> {
  console.log(`🔍 [CommandesQueries] Recherche commande ${commandeId}`);

  const commande = await prisma.commandes.findUnique({
    where: { commande_id: commandeId },
    include: {
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  if (!commande) {
    return null;
  }

  return transformCommande(commande);
}

/**
 * Récupère les commandes d'un utilisateur
 */
export async function obtenirCommandesUtilisateur(utilisateurId: number, prisma = defaultPrisma): Promise<Commande[]> {
  console.log(`👤 [CommandesQueries] Récupération commandes utilisateur ${utilisateurId}`);

  const commandes = await prisma.commandes.findMany({
    where: { utilisateur_id: utilisateurId },
    include: {
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_commande: 'desc',
    },
  });

  return commandes.map(transformCommande);
}

/**
 * Récupère les commandes par statut
 */
export async function obtenirCommandesParStatut(statut: string, prisma = defaultPrisma): Promise<Commande[]> {
  console.log(`📊 [CommandesQueries] Récupération commandes statut ${statut}`);

  const commandes = await prisma.commandes.findMany({
    where: { statut },
    include: {
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_commande: 'desc',
    },
  });

  return commandes.map(transformCommande);
}

/**
 * Compte les commandes par statut
 */
export async function compterCommandesParStatut(prisma = defaultPrisma): Promise<Record<string, number>> {
  console.log('📊 [CommandesQueries] Comptage par statut');

  const counts = await prisma.commandes.groupBy({
    by: ['statut'],
    _count: true,
  });

  const result: Record<string, number> = {};
  counts.forEach((item: any) => {
    result[item.statut] = item._count;
  });

  return result;
}

/**
 * Transforme une commande Prisma en Commande du domaine
 */
function transformCommande(commandePrisma: any): Commande {
  return {
    commande_id: commandePrisma.commande_id,
    utilisateur_id: commandePrisma.utilisateur_id,
    statut: commandePrisma.statut,
    total: Number(commandePrisma.total),
    articles: typeof commandePrisma.articles === 'string' 
      ? JSON.parse(commandePrisma.articles) 
      : commandePrisma.articles,
    date_commande: commandePrisma.date_commande,
    updated_at: commandePrisma.updated_at,
    payment_intent_id: commandePrisma.payment_intent_id || undefined,
    nom_utilisateur: commandePrisma.utilisateurs 
      ? `${commandePrisma.utilisateurs.first_name} ${commandePrisma.utilisateurs.last_name}`
      : undefined,
    email: commandePrisma.utilisateurs?.email || undefined,
  };
}
