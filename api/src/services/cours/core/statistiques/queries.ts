/**
 * Queries pour le domaine Statistiques
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type {
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur
} from '@clubmanager/types';
import { getWeekNumber } from '../helpers.js';

/**
 * Obtenir les semaines avec cours pour un participant
 */
export async function obtenirSemainesAvecCours(participantId: number): Promise<number[]> {
  const cours = await prisma.cours.findMany({
    where: {
      inscriptions: {
        some: {
          utilisateur_id: participantId
        }
      }
    },
    select: {
      date_cours: true
    },
    orderBy: {
      date_cours: 'asc'
    }
  });

  const semaines = new Set<number>();
  cours.forEach((c: any) => {
    const weekNumber = getWeekNumber(c.date_cours);
    semaines.add(weekNumber);
  });

  return Array.from(semaines).sort((a, b) => a - b);
}

/**
 * Obtenir statistiques de présence pour un cours
 */
export async function obtenirStatistiquesPresenceCours(coursId: number): Promise<StatistiquesPresenceCours> {
  const inscriptions = await prisma.inscriptions.findMany({
    where: {
      cours_id: coursId
    },
    select: {
      is_present: true,
      is_validate: true
    }
  });

  const total_inscrits = inscriptions.length;
  const total_presents = inscriptions.filter((i: any) => i.is_present === true).length;
  const total_absents = inscriptions.filter((i: any) => i.is_present === false).length;
  const taux_presence = total_inscrits > 0 ? (total_presents / total_inscrits) * 100 : 0;

  return {
    cours_id: coursId,
    total_inscrits,
    total_presents,
    total_absents,
    taux_presence: Math.round(taux_presence * 100) / 100
  };
}

/**
 * Obtenir statistiques de présence pour un utilisateur
 */
export async function obtenirStatistiquesPresenceUtilisateur(utilisateurId: number): Promise<StatistiquesPresenceUtilisateur> {
  const inscriptions = await prisma.inscriptions.findMany({
    where: {
      utilisateur_id: utilisateurId,
      cours: {
        date_cours: {
          lte: new Date()
        }
      }
    },
    select: {
      is_present: true,
      is_validate: true
    }
  });

  const total_cours_inscrits = inscriptions.length;
  const total_presents = inscriptions.filter((i: any) => i.is_present === true).length;
  const total_absents = inscriptions.filter((i: any) => i.is_present === false).length;
  const taux_presence = total_cours_inscrits > 0 ? (total_presents / total_cours_inscrits) * 100 : 0;

  return {
    utilisateur_id: utilisateurId,
    total_cours_inscrits,
    total_presents,
    total_absents,
    taux_presence: Math.round(taux_presence * 100) / 100
  };
}
