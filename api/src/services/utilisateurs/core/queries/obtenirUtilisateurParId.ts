/**
 * Query: obtenirUtilisateurParId
 * Récupère un utilisateur par son ID avec toutes ses relations
 */

import type { PrismaClient } from '@prisma/client';
import type { UtilisateurAvecDetails } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode } from '@clubmanager/types';

export interface ObtenirUtilisateurParIdArgs {
  id: number;
}

/**
 * Récupère un utilisateur par son ID
 */
export async function obtenirUtilisateurParId(
  prisma: PrismaClient,
  args: ObtenirUtilisateurParIdArgs
): Promise<UtilisateurAvecDetails | null> {
  try {
    const { id } = args;

    if (!id || id <= 0) {
      throw new UtilisateursError(
        'ID utilisateur invalide',
        UtilisateursErrorCode.INVALID_INPUT
      );
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id },
      include: {
        genres: true,
        grades: true,
        abonnements: true,
        status: true,
      },
    });

    if (!utilisateur) {
      return null;
    }

    // Calcul de l'âge
    let age: number | undefined;
    if (utilisateur.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(utilisateur.date_of_birth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calcul des initiales
    const initiales = `${utilisateur.first_name.charAt(0).toUpperCase()}${utilisateur.last_name.charAt(0).toUpperCase()}`;

    return {
      id: utilisateur.id,
      userId: utilisateur.userId || undefined,
      first_name: utilisateur.first_name,
      last_name: utilisateur.last_name,
      nom_utilisateur: utilisateur.nom_utilisateur || undefined,
      email: utilisateur.email,
      genre_id: utilisateur.genre_id || undefined,
      date_of_birth: utilisateur.date_of_birth,
      grade_id: utilisateur.grade_id,
      abonnement_id: utilisateur.abonnement_id,
      status_id: utilisateur.status_id,
      active: utilisateur.active,
      date_inscription: utilisateur.date_inscription || undefined,
      created_at: utilisateur.created_at || undefined,
      updated_at: utilisateur.updated_at || undefined,
      genre: utilisateur.genres ? {
        id: utilisateur.genres.id,
        nom: utilisateur.genres.nom,
      } : undefined,
      grade: utilisateur.grades ? {
        id: utilisateur.grades.id,
        nom: utilisateur.grades.nom,
        niveau: utilisateur.grades.niveau || 0,
      } : undefined,
      abonnement: utilisateur.abonnements ? {
        id: utilisateur.abonnements.id,
        nom: utilisateur.abonnements.nom,
        type: utilisateur.abonnements.type || 'standard',
      } : undefined,
      status: utilisateur.status ? {
        id: utilisateur.status.id,
        nom: utilisateur.status.nom,
      } : undefined,
      age,
      initiales,
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw new UtilisateursError(
      'Erreur lors de la récupération de l\'utilisateur',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
