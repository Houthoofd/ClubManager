/**
 * Query: obtenirUtilisateurs
 * Récupère la liste des utilisateurs avec pagination et filtres
 */

import type { PrismaClient } from '@prisma/client';
import type {
  UtilisateurAvecDetails,
  UtilisateursFiltres,
} from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode } from '@clubmanager/types';

export interface ObtenirUtilisateursArgs extends UtilisateursFiltres {
  limit?: number;
  offset?: number;
}

/**
 * Récupère tous les utilisateurs avec pagination et filtres
 */
export async function obtenirUtilisateurs(
  prisma: PrismaClient,
  args: ObtenirUtilisateursArgs = {}
): Promise<{
  utilisateurs: UtilisateurAvecDetails[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const {
      status_id,
      grade_id,
      genre_id,
      abonnement_id,
      recherche,
      actif,
      limit = 50,
      offset = 0,
      dateInscriptionDebut,
      dateInscriptionFin,
      ageMin,
      ageMax,
    } = args;

    // Construction des filtres
    const where: any = {};

    if (status_id !== undefined) {
      where.status_id = status_id;
    }

    if (grade_id !== undefined) {
      where.grade_id = grade_id;
    }

    if (genre_id !== undefined) {
      where.genre_id = genre_id;
    }

    if (abonnement_id !== undefined) {
      where.abonnement_id = abonnement_id;
    }

    if (actif !== undefined) {
      where.active = actif;
    }

    // Recherche par nom, prénom, email ou nom_utilisateur
    if (recherche && recherche.trim() !== '') {
      const searchTerm = recherche.trim();
      where.OR = [
        { first_name: { contains: searchTerm, mode: 'insensitive' } },
        { last_name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { nom_utilisateur: { contains: searchTerm, mode: 'insensitive' } },
        { userId: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Filtre par date d'inscription
    if (dateInscriptionDebut || dateInscriptionFin) {
      where.date_inscription = {};
      if (dateInscriptionDebut) {
        where.date_inscription.gte = dateInscriptionDebut;
      }
      if (dateInscriptionFin) {
        where.date_inscription.lte = dateInscriptionFin;
      }
    }

    // Filtre par âge (calculé à partir de la date de naissance)
    if (ageMin !== undefined || ageMax !== undefined) {
      const now = new Date();
      if (ageMax !== undefined) {
        const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
        where.date_of_birth = { ...(where.date_of_birth || {}), gte: minBirthDate };
      }
      if (ageMin !== undefined) {
        const maxBirthDate = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
        where.date_of_birth = { ...(where.date_of_birth || {}), lte: maxBirthDate };
      }
    }

    // Récupération des utilisateurs avec relations
    const [utilisateurs, total] = await Promise.all([
      prisma.utilisateurs.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { last_name: 'asc' },
          { first_name: 'asc' },
        ],
        include: {
          genres: true,
          grades: true,
          abonnements: true,
          status: true,
        },
      }),
      prisma.utilisateurs.count({ where }),
    ]);

    // Transformation des données
    const utilisateursAvecDetails: UtilisateurAvecDetails[] = utilisateurs.map((u) => {
      // Calcul de l'âge
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

      // Calcul des initiales
      const initiales = `${u.first_name.charAt(0).toUpperCase()}${u.last_name.charAt(0).toUpperCase()}`;

      return {
        id: u.id,
        userId: u.userId || undefined,
        first_name: u.first_name,
        last_name: u.last_name,
        nom_utilisateur: u.nom_utilisateur || undefined,
        email: u.email,
        genre_id: u.genre_id || undefined,
        date_of_birth: u.date_of_birth,
        grade_id: u.grade_id,
        abonnement_id: u.abonnement_id,
        status_id: u.status_id,
        active: u.active,
        date_inscription: u.date_inscription || undefined,
        created_at: u.created_at || undefined,
        updated_at: u.updated_at || undefined,
        genre: u.genres ? {
          id: u.genres.id,
          nom: u.genres.nom,
        } : undefined,
        grade: u.grades ? {
          id: u.grades.id,
          nom: u.grades.nom,
          niveau: u.grades.niveau || 0,
        } : undefined,
        abonnement: u.abonnements ? {
          id: u.abonnements.id,
          nom: u.abonnements.nom,
          type: u.abonnements.type || 'standard',
        } : undefined,
        status: u.status ? {
          id: u.status.id,
          nom: u.status.nom,
        } : undefined,
        age,
        initiales,
      };
    });

    const hasMore = offset + limit < total;

    return {
      utilisateurs: utilisateursAvecDetails,
      total,
      hasMore,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw new UtilisateursError(
      'Erreur lors de la récupération des utilisateurs',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
