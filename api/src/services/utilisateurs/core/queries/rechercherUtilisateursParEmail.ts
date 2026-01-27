/**
 * Query: rechercherUtilisateursParEmail
 * Recherche des utilisateurs par email (recherche partielle)
 */

import type { PrismaClient } from '@prisma/client';
import type { UtilisateurRecherche } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode } from '@clubmanager/types';

export interface RechercherUtilisateursParEmailArgs {
  email: string;
  limit?: number;
}

/**
 * Recherche des utilisateurs par email
 * Retourne une liste d'utilisateurs dont l'email contient la recherche
 */
export async function rechercherUtilisateursParEmail(
  prisma: PrismaClient,
  args: RechercherUtilisateursParEmailArgs
): Promise<UtilisateurRecherche[]> {
  try {
    const { email, limit = 10 } = args;

    if (!email || email.trim() === '') {
      throw new UtilisateursError(
        'Email requis pour la recherche',
        UtilisateursErrorCode.INVALID_INPUT
      );
    }

    const searchTerm = email.trim();

    // Recherche des utilisateurs
    const utilisateurs = await prisma.utilisateurs.findMany({
      where: {
        email: {
          contains: searchTerm,
          mode: 'insensitive',
        },
        active: true,
      },
      take: limit,
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' },
      ],
      select: {
        id: true,
        userId: true,
        first_name: true,
        last_name: true,
        email: true,
        date_of_birth: true,
        nom_utilisateur: true,
      },
    });

    // Transformation et calcul de l'âge
    return utilisateurs.map((u) => {
      let age: number | undefined;
      if (u.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(u.date_of_birth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      const initiales = `${u.first_name.charAt(0).toUpperCase()}${u.last_name.charAt(0).toUpperCase()}`;

      return {
        userId: u.userId || `user_${u.id}`,
        prenom: u.first_name,
        nom: u.last_name,
        date_naissance: u.date_of_birth,
        nom_utilisateur: u.nom_utilisateur || undefined,
        age,
        initiales,
      };
    });
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error('Erreur lors de la recherche d\'utilisateurs par email:', error);
    throw new UtilisateursError(
      'Erreur lors de la recherche d\'utilisateurs',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
