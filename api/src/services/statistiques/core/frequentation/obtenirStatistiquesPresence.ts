/**
 * Obtenir les statistiques de présence globales
 */

import type { StatistiquesPresenceGlobale } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirStatistiquesPresenceArgs {
  joursHistorique?: number; // Nombre de jours à récupérer (défaut: 30)
}

export async function obtenirStatistiquesPresence(
  prisma: any,
  args: ObtenirStatistiquesPresenceArgs = {}
): Promise<StatistiquesPresenceGlobale[]> {
  const { joursHistorique = 30 } = args;

  if (joursHistorique <= 0 || joursHistorique > 365) {
    throw new StatistiquesError(
      'Le nombre de jours doit être entre 1 et 365',
      'INVALID_DAY_RANGE',
      400
    );
  }

  try {
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - joursHistorique);

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
      },
      orderBy: {
        date_cours: 'desc'
      }
    });

    // Grouper par date et type de cours
    const grouped = cours.reduce((acc: any, c: any) => {
      const dateStr = new Date(c.date_cours).toISOString().split('T')[0];
      const key = `${dateStr}-${c.type_cours}`;
      
      if (!acc[key]) {
        acc[key] = {
          date_cours: new Date(c.date_cours),
          type_cours: c.type_cours,
          total_inscrits: 0,
          presents: 0
        };
      }
      
      acc[key].total_inscrits += c.inscriptions.length;
      acc[key].presents += c.inscriptions.filter((i: any) => i.status_id === 1).length;
      
      return acc;
    }, {});

    return Object.values(grouped).map((row: any) => ({
      ...row,
      taux_presence: row.total_inscrits > 0
        ? (row.presents / row.total_inscrits) * 100
        : 0
    }));
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
