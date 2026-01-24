/**
 * Mutations pour le domaine Inscriptions
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { Inscription, InscriptionInput, InscriptionUpdateInput } from '@clubmanager/types';

/**
 * Crée une nouvelle inscription
 */
export async function creerInscription(data: InscriptionInput, prisma = defaultPrisma): Promise<Inscription> {
  console.log('➕ [InscriptionsMutations] Création inscription', data);

  // Vérifier si l'inscription existe déjà
  const existante = await prisma.inscriptions.findFirst({
    where: {
      utilisateur_id: data.utilisateur_id,
      cours_id: data.cours_id,
    },
  });

  if (existante) {
    console.warn(`⚠️ [InscriptionsMutations] Inscription déjà existante`);
    throw new Error('Cet utilisateur est déjà inscrit à ce cours');
  }

  const inscription = await prisma.inscriptions.create({
    data: {
      utilisateur_id: data.utilisateur_id,
      cours_id: data.cours_id,
      status_id: data.status_id ?? true,
      date_inscription: new Date(),
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
  });

  console.log(`✅ [InscriptionsMutations] Inscription ${inscription.id} créée`);

  return {
    ...inscription,
    utilisateur: inscription.users,
  } as Inscription;
}

/**
 * Met à jour une inscription
 */
export async function modifierInscription(
  id: number,
  data: InscriptionUpdateInput,
  prisma = defaultPrisma
): Promise<Inscription | null> {
  console.log(`📝 [InscriptionsMutations] Modification inscription ${id}`, data);

  // Vérifier que l'inscription existe
  const existante = await prisma.inscriptions.findUnique({
    where: { id },
  });

  if (!existante) {
    console.warn(`❌ [InscriptionsMutations] Inscription ${id} non trouvée`);
    return null;
  }

  const inscription = await prisma.inscriptions.update({
    where: { id },
    data: {
      status_id: data.status_id,
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
          heure_debut: true,
          heure_fin: true,
        },
      },
    },
  });

  console.log(`✅ [InscriptionsMutations] Inscription ${id} modifiée`);

  return {
    ...inscription,
    utilisateur: inscription.users,
  } as Inscription;
}

/**
 * Supprime une inscription
 */
export async function supprimerInscription(id: number, prisma = defaultPrisma): Promise<boolean> {
  console.log(`🗑️ [InscriptionsMutations] Suppression inscription ${id}`);

  // Vérifier que l'inscription existe
  const existante = await prisma.inscriptions.findUnique({
    where: { id },
  });

  if (!existante) {
    console.warn(`❌ [InscriptionsMutations] Inscription ${id} non trouvée`);
    return false;
  }

  await prisma.inscriptions.delete({
    where: { id },
  });

  console.log(`✅ [InscriptionsMutations] Inscription ${id} supprimée`);
  return true;
}

/**
 * Annule une inscription (soft delete via status)
 */
export async function annulerInscription(id: number, prisma = defaultPrisma): Promise<Inscription | null> {
  console.log(`❌ [InscriptionsMutations] Annulation inscription ${id}`);

  return modifierInscription(id, { status_id: false }, prisma);
}

/**
 * Active une inscription
 */
export async function activerInscription(id: number, prisma = defaultPrisma): Promise<Inscription | null> {
  console.log(`✅ [InscriptionsMutations] Activation inscription ${id}`);

  return modifierInscription(id, { status_id: true }, prisma);
}
