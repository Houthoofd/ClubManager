/**
 * Module de recherche - Recherche de commandes avec filtres
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Commande, CommandeSearchFilters, CommandeSearchResult } from '@clubmanager/types';

/**
 * Recherche des commandes avec filtres
 */
export async function rechercherCommandes(
  filters: CommandeSearchFilters,
  prisma = defaultPrisma
): Promise<CommandeSearchResult> {
  console.log('🔍 [CommandesSearch] Recherche avec filtres:', filters);

  const where: any = {};

  // Filtre par statut
  if (filters.statut) {
    where.statut = filters.statut;
  }

  // Filtre par utilisateur
  if (filters.utilisateur_id) {
    where.utilisateur_id = filters.utilisateur_id;
  }

  // Filtre par date de début
  if (filters.date_debut) {
    where.date_commande = {
      ...where.date_commande,
      gte: new Date(filters.date_debut),
    };
  }

  // Filtre par date de fin
  if (filters.date_fin) {
    where.date_commande = {
      ...where.date_commande,
      lte: new Date(filters.date_fin),
    };
  }

  // Recherche texte (nom utilisateur ou email)
  if (filters.search) {
    where.utilisateurs = {
      OR: [
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ],
    };
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Compter le total
  const total = await prisma.commandes.count({ where });

  // Récupérer les résultats
  const commandes = await prisma.commandes.findMany({
    where,
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
    skip,
    take: limit,
  });

  const items: Commande[] = commandes.map((commande: any) => ({
    commande_id: commande.commande_id,
    utilisateur_id: commande.utilisateur_id,
    statut: commande.statut,
    total: Number(commande.total),
    articles: typeof commande.articles === 'string' 
      ? JSON.parse(commande.articles) 
      : commande.articles,
    date_commande: commande.date_commande,
    updated_at: commande.updated_at,
    payment_intent_id: commande.payment_intent_id || undefined,
    nom_utilisateur: commande.utilisateurs 
      ? `${commande.utilisateurs.first_name} ${commande.utilisateurs.last_name}`
      : undefined,
    email: commande.utilisateurs?.email || undefined,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
