/**
 * Queries pour le domaine Cours Récurrents
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { JourCoursRecurrent } from '@clubmanager/types';

/**
 * Obtenir tous les jours de cours récurrents avec professeurs
 */
export async function obtenirJoursDeCours(prisma = defaultPrisma): Promise<JourCoursRecurrent[]> {
  const coursRecurrents = await prisma.cours_recurrent.findMany({
    include: {
      cours_recurrent_professeur: {
        include: {
          professeurs: {
            select: {
              id: true,
              prenom: true,
              nom: true
            }
          }
        }
      }
    },
    orderBy: [
      { jour_semaine: 'asc' },
      { heure_debut: 'asc' }
    ]
  });

  return coursRecurrents.map((cr: any) => ({
    id: cr.id,
    type_cours: cr.type_cours,
    jour_semaine: cr.jour_semaine,
    heure_debut: cr.heure_debut,
    heure_fin: cr.heure_fin,
    professeurs: cr.cours_recurrent_professeur
      .map((crp: any) => `${crp.professeurs.prenom} ${crp.professeurs.nom}`)
      .join(', ')
  }));
}

/**
 * Obtenir jours de cours par semaine
 */
export async function obtenirJoursDeCoursParSemaine(semaine: number, prisma = defaultPrisma): Promise<JourCoursRecurrent[]> {
  return await obtenirJoursDeCours(prisma);
}

/**
 * Obtenir un cours récurrent par ID
 */
export async function obtenirCoursRecurrentParId(id: number, prisma = defaultPrisma) {
  return await prisma.cours_recurrent.findUnique({
    where: { id },
    include: {
      cours_recurrent_professeur: {
        include: {
          professeurs: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              status_id: true
            }
          }
        }
      }
    }
  });
}

/**
 * Trouver un cours récurrent par critères
 */
export async function trouverCoursRecurrent(
  jour: string,
  type_cours: string,
  heure_debut: string,
  heure_fin: string,
  prisma = defaultPrisma
): Promise<number | null> {
  const { joursSemaineMap } = await import('../helpers.js');
  const jourNum = joursSemaineMap[jour.toLowerCase()];
  
  if (!jourNum) {
    return null;
  }

  const coursRecurrent = await prisma.cours_recurrent.findFirst({
    where: {
      jour_semaine: jourNum,
      type_cours,
      heure_debut,
      heure_fin
    }
  });

  return coursRecurrent?.id ?? null;
}
