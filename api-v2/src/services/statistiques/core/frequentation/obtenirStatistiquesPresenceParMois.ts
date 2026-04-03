/**
 * Obtenir les statistiques de présence par mois (tous utilisateurs)
 */

import type { StatistiquesPresenceParMois } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirStatistiquesPresenceParMoisArgs {
  moisHistorique?: number; // Nombre de mois à récupérer (défaut: 12)
}

export async function obtenirStatistiquesPresenceParMois(
  prisma: any,
  args: ObtenirStatistiquesPresenceParMoisArgs = {}
): Promise<StatistiquesPresenceParMois[]> {
  const { moisHistorique = 12 } = args;

  if (moisHistorique <= 0 || moisHistorique > 36) {
    throw new StatistiquesError(
      'Le nombre de mois doit être entre 1 et 36',
      'INVALID_MONTH_RANGE',
      400
    );
  }

  try {
    const dateDebut = new Date();
    dateDebut.setMonth(dateDebut.getMonth() - moisHistorique);

    const cours = await prisma.cours.findMany({
      where: {
        date_cours: { gte: dateDebut }
      },
      include: {
        inscriptions: {
          select: {
            status_id: true
          }
        }
      }
    });

    // Grouper par mois
    const parMois = cours.reduce((acc: any, c: any) => {
      const date = new Date(c.date_cours);
      const mois = date.getMonth() + 1;
      const nom_mois = date.toLocaleString('fr-FR', { month: 'long' });
      
      if (!acc[mois]) {
        acc[mois] = {
          mois,
          nom_mois,
          total_inscriptions: 0,
          presences_validees: 0
        };
      }
      
      acc[mois].total_inscriptions += c.inscriptions.length;
      acc[mois].presences_validees += c.inscriptions.filter((i: any) => i.status_id === 1).length;
      
      return acc;
    }, {});

    return Object.values(parMois).map((row: any) => ({
      ...row,
      taux_presence: row.total_inscriptions > 0
        ? (row.presences_validees / row.total_inscriptions) * 100
        : 0
    })).sort((a: any, b: any) => a.mois - b.mois);
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération des statistiques de présence: ${(error as Error).message}`,
      'PRESENCE_STATS_ERROR',
      500
    );
  }
}
