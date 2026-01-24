/**
 * Module de mutations - Modification et suppression de compte
 */

import { prisma } from '../../../infrastructure/database/prisma-client.js';
import type { CompteInfo, CompteUpdateInput } from '@clubmanager/types';

/**
 * Modifie les informations d'un compte
 */
export async function modifierCompte(
  utilisateurId: number,
  updates: CompteUpdateInput
): Promise<CompteInfo | null> {
  console.log(`✏️ [CompteMutations] Modification compte ${utilisateurId}`);

  // Vérifier que le compte existe
  const compteExiste = await prisma.utilisateurs.findUnique({
    where: { id: utilisateurId, status_id: 1 },
  });

  if (!compteExiste) {
    console.warn(`⚠️ Compte ${utilisateurId} introuvable`);
    return null;
  }

  // Construire l'objet de mise à jour
  const data: any = {};
  if (updates.first_name !== undefined) data.first_name = updates.first_name;
  if (updates.last_name !== undefined) data.last_name = updates.last_name;
  if (updates.email !== undefined) data.email = updates.email;
  if (updates.date_of_birth !== undefined) data.date_of_birth = updates.date_of_birth;
  if (updates.phone !== undefined) data.phone = updates.phone;
  if (updates.genre_id !== undefined) data.genre_id = updates.genre_id;
  if (updates.grade_id !== undefined) data.grade_id = updates.grade_id;
  if (updates.abonnement_id !== undefined) data.abonnement_id = updates.abonnement_id;
  if (updates.status_id !== undefined) data.status_id = updates.status_id;

  const utilisateur = await prisma.utilisateurs.update({
    where: { id: utilisateurId },
    data,
    include: {
      genres: true,
      status: true,
      grades: true,
      plans_tarifaires: true,
    },
  });

  return {
    id: utilisateur.id,
    first_name: utilisateur.first_name,
    last_name: utilisateur.last_name,
    nom_utilisateur: utilisateur.nom_utilisateur || undefined,
    email: utilisateur.email,
    date_of_birth: utilisateur.date_of_birth || undefined,
    phone: utilisateur.phone || undefined,
    genre_id: utilisateur.genre_id || undefined,
    genre_name: utilisateur.genres?.genre_name || undefined,
    status_id: utilisateur.status_id,
    status_name: utilisateur.status?.nom_role || undefined,
    grade_id: utilisateur.grade_id || undefined,
    grade_name: utilisateur.grades?.grade_id || undefined,
    abonnement_id: utilisateur.abonnement_id || undefined,
    abonnement_name: utilisateur.plans_tarifaires?.nom_plan || undefined,
  };
}

/**
 * Supprime un compte (soft delete - change status_id à 0)
 */
export async function supprimerCompte(utilisateurId: number): Promise<boolean> {
  console.log(`🗑️ [CompteMutations] Suppression compte ${utilisateurId}`);

  try {
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId, status_id: 1 },
    });

    if (!utilisateur) {
      console.warn(`⚠️ Compte ${utilisateurId} introuvable`);
      return false;
    }

    await prisma.utilisateurs.update({
      where: { id: utilisateurId },
      data: { status_id: 0 },
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return false;
  }
}

/**
 * Met à jour le mot de passe d'un utilisateur
 */
export async function mettreAJourMotDePasse(
  utilisateurId: number,
  hashedPassword: string,
  isCreation: boolean = false
): Promise<boolean> {
  console.log(`🔐 [CompteMutations] MAJ mot de passe utilisateur ${utilisateurId}`);

  try {
    if (isCreation) {
      // En création, ne met à jour que si le mot de passe est vide
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: utilisateurId },
      });

      if (!utilisateur || (utilisateur.password && utilisateur.password !== '')) {
        console.warn(`⚠️ Mot de passe déjà défini pour utilisateur ${utilisateurId}`);
        return false;
      }
    }

    await prisma.utilisateurs.update({
      where: { id: utilisateurId },
      data: { password: hashedPassword },
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur MAJ mot de passe:', error);
    return false;
  }
}
