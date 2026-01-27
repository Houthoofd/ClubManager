/**
 * Query: obtenirUtilisateurParEmail
 * Récupère un utilisateur par son email
 */

import type { PrismaClient } from '@prisma/client';
import type { UtilisateurAvecDetails } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode } from '@clubmanager/types';

export interface ObtenirUtilisateurParEmailArgs {
  email: string;
}

/**
 * Récupère un utilisateur par son email (recherche exacte)
 */
export async function obtenirUtilisateurParEmail(
  prisma: PrismaClient,
  args: ObtenirUtilisateurParEmailArgs
): Promise<UtilisateurAvecDetails | null> {
  try {
    const { email } = args;

    if (!email || email.trim() === '') {
      throw new UtilisateursError(
        'Email requis',
        UtilisateursErrorCode.INVALID_EMAIL
      );
    }

    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
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
    console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
    throw new UtilisateursError(
      'Erreur lors de la récupération de l\'utilisateur',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
