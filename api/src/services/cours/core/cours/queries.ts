/**
 * Queries pour le domaine Cours
 * Opérations de lecture sur la table cours
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { CoursInfo } from '@clubmanager/types';

/**
 * Obtenir les cours pour un participant (limité à 12 prochains cours)
 */
export async function obtenirCoursPourParticipant(participantId: number): Promise<CoursInfo[]> {
  const cours = await prisma.cours.findMany({
    where: {
      inscriptions: {
        some: {
          utilisateur_id: participantId
        }
      },
      date_cours: {
        gte: new Date()
      }
    },
    include: {
      inscriptions: {
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
      }
    },
    orderBy: [
      { date_cours: 'asc' },
      { heure_debut: 'asc' }
    ],
    take: 12
  });

  return cours.map((c: any) => ({
    id: c.id,
    date_cours: c.date_cours,
    type_cours: c.type_cours,
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
    cours_recurrent_id: c.cours_recurrent_id,
    inscriptions: c.inscriptions.map((i: any) => ({
      id: i.id,
      cours_id: i.cours_id,
      utilisateur_id: i.utilisateur_id,
      is_present: i.is_present,
      is_validate: i.is_validate,
      utilisateur: i.utilisateurs
    }))
  }));
}

/**
 * Obtenir cours par semaine pour un participant
 */
export async function obtenirCoursParSemaine(participantId: number, semaine: number): Promise<CoursInfo[]> {
  const { getDateOfISOWeek } = await import('../helpers.js');
  
  const currentYear = new Date().getFullYear();
  const startDate = getDateOfISOWeek(semaine, currentYear);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const cours = await prisma.cours.findMany({
    where: {
      inscriptions: {
        some: {
          utilisateur_id: participantId
        }
      },
      date_cours: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      inscriptions: {
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
      }
    },
    orderBy: [
      { date_cours: 'asc' },
      { heure_debut: 'asc' }
    ]
  });

  return cours.map((c: any) => ({
    id: c.id,
    date_cours: c.date_cours,
    type_cours: c.type_cours,
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
    cours_recurrent_id: c.cours_recurrent_id,
    inscriptions: c.inscriptions.map((i: any) => ({
      id: i.id,
      cours_id: i.cours_id,
      utilisateur_id: i.utilisateur_id,
      is_present: i.is_present,
      is_validate: i.is_validate,
      utilisateur: i.utilisateurs
    }))
  }));
}

/**
 * Obtenir tous les cours (pour admin)
 */
export async function obtenirTousLesCours(): Promise<CoursInfo[]> {
  const cours = await prisma.cours.findMany({
    where: {
      date_cours: {
        gte: new Date()
      }
    },
    include: {
      inscriptions: {
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
      }
    },
    orderBy: [
      { date_cours: 'asc' },
      { heure_debut: 'asc' }
    ],
    take: 100
  });

  return cours.map((c: any) => ({
    id: c.id,
    date_cours: c.date_cours,
    type_cours: c.type_cours,
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
    cours_recurrent_id: c.cours_recurrent_id,
    inscriptions: c.inscriptions.map((i: any) => ({
      id: i.id,
      cours_id: i.cours_id,
      utilisateur_id: i.utilisateur_id,
      is_present: i.is_present,
      is_validate: i.is_validate,
      utilisateur: i.utilisateurs
    }))
  }));
}
