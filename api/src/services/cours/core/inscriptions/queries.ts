/**
 * Queries pour le domaine Inscriptions
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type {
  CoursInfo,
  CoursAvecUtilisateurs,
  UtilisateursParCoursResult,
  UtilisateurAvecPresence
} from '@clubmanager/types';
import { obtenirCoursPourParticipant } from '../cours/queries.js';

/**
 * Obtenir les utilisateurs d'un cours avec leur statut
 */
export async function obtenirUtilisateursParCours(coursId: number): Promise<UtilisateursParCoursResult> {
  const inscriptions = await prisma.inscriptions.findMany({
    where: {
      cours_id: coursId
    },
    include: {
      utilisateurs: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          nom_utilisateur: true,
          genre_id: true
        }
      }
    }
  });

  const utilisateurs: UtilisateurAvecPresence[] = inscriptions.map((i: any) => ({
    id: i.utilisateurs.id,
    first_name: i.utilisateurs.first_name,
    last_name: i.utilisateurs.last_name,
    nom_utilisateur: i.utilisateurs.nom_utilisateur ?? undefined,
    genre_id: i.utilisateurs.genre_id ?? undefined,
    is_present: i.is_present,
    is_validate: i.is_validate,
    inscription_id: i.id
  }));

  return {
    cours_id: coursId,
    utilisateurs
  };
}

/**
 * Obtenir cours avec utilisateurs (combiné)
 */
export async function obtenirCoursAvecUtilisateurs(participantId: number): Promise<CoursAvecUtilisateurs[]> {
  const cours = await obtenirCoursPourParticipant(participantId);
  
  const coursAvecUtilisateurs = await Promise.all(
    cours.map(async c => {
      const { utilisateurs } = await obtenirUtilisateursParCours(c.id);
      return {
        ...c,
        utilisateurs
      };
    })
  );

  return coursAvecUtilisateurs;
}

/**
 * Obtenir utilisateurs participants pour un cours (avec détails complets)
 */
export async function obtenirUtilisateursParticipantsParCours(coursId: number): Promise<UtilisateursParCoursResult> {
  return await obtenirUtilisateursParCours(coursId);
}

/**
 * Obtenir cours inscrits pour un utilisateur
 */
export async function obtenirCoursInscritsParUtilisateur(userId: number): Promise<CoursInfo[]> {
  return await obtenirCoursPourParticipant(userId);
}
