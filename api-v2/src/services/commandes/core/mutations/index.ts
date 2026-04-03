/**
 * Module de mutations - Création et modification des commandes
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Commande, CreateCommandeInput, UpdateCommandeInput } from '@clubmanager/types';

/**
 * Crée une nouvelle commande
 */
export async function creerCommande(input: CreateCommandeInput, prisma = defaultPrisma): Promise<Commande> {
  console.log(`➕ [CommandesMutations] Création commande pour utilisateur ${input.utilisateur_id}`);

  const commande = await prisma.commandes.create({
    data: {
      utilisateur_id: input.utilisateur_id,
      statut: input.statut || 'en_attente',
      total: input.total,
      articles: JSON.stringify(input.articles),
      date_commande: input.date_commande || new Date(),
      payment_intent_id: input.payment_intent_id,
    },
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

  return {
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
  };
}

/**
 * Modifie le statut d'une commande
 */
export async function modifierStatutCommande(
  commandeId: string,
  nouveauStatut: string,
  prisma = defaultPrisma
): Promise<Commande | null> {
  console.log(`🔄 [CommandesMutations] Modification statut commande ${commandeId} → ${nouveauStatut}`);

  // Vérifier que la commande existe
  const commandeExiste = await prisma.commandes.findUnique({
    where: { commande_id: commandeId },
  });

  if (!commandeExiste) {
    console.warn(`⚠️ Commande ${commandeId} introuvable`);
    return null;
  }

  const commande = await prisma.commandes.update({
    where: { commande_id: commandeId },
    data: { statut: nouveauStatut },
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

  return {
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
  };
}

/**
 * Modifie une commande
 */
export async function modifierCommande(
  commandeId: string,
  updates: UpdateCommandeInput,
  prisma = defaultPrisma
): Promise<Commande | null> {
  console.log(`✏️ [CommandesMutations] Modification commande ${commandeId}`);

  // Vérifier que la commande existe
  const commandeExiste = await prisma.commandes.findUnique({
    where: { commande_id: commandeId },
  });

  if (!commandeExiste) {
    console.warn(`⚠️ Commande ${commandeId} introuvable`);
    return null;
  }

  const data: any = {};
  if (updates.statut !== undefined) data.statut = updates.statut;
  if (updates.total !== undefined) data.total = updates.total;
  if (updates.articles !== undefined) data.articles = JSON.stringify(updates.articles);
  if (updates.payment_intent_id !== undefined) data.payment_intent_id = updates.payment_intent_id;

  const commande = await prisma.commandes.update({
    where: { commande_id: commandeId },
    data,
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

  return {
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
  };
}

/**
 * Supprime une commande
 */
export async function supprimerCommande(commandeId: string, prisma = defaultPrisma): Promise<boolean> {
  console.log(`🗑️ [CommandesMutations] Suppression commande ${commandeId}`);

  try {
    await prisma.commandes.delete({
      where: { commande_id: commandeId },
    });
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return false;
  }
}
