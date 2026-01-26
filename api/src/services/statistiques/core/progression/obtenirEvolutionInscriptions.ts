/**
 * Obtenir l'évolution des inscriptions
 */

import type { EvolutionInscriptions } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirEvolutionInscriptionsArgs {
  joursHistorique?: number; // Nombre de jours à récupérer (défaut: 90)
}

export async function obtenirEvolutionInscriptions(
  prisma: any,
  args: ObtenirEvolutionInscriptionsArgs = {}
): Promise<EvolutionInscriptions[]> {
  const { joursHistorique = 90 } = args;

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

    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        date_inscription: { gte: dateDebut }
      },
      select: {
        date_inscription: true
      },
      orderBy: {
        date_inscription: 'asc'
      }
    });

    // Grouper par date
    const grouped = inscriptions.reduce((acc: any, inscription: any) => {
      const date = new Date(inscription.date_inscription);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date_inscription: date,
          nouvelles_inscriptions: 0
        };
      }
      acc[dateStr].nouvelles_inscriptions++;
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => 
      a.date_inscription.getTime() - b.date_inscription.getTime()
    ) as EvolutionInscriptions[];
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération de l'évolution des inscriptions: ${(error as Error).message}`,
      'EVOLUTION_FETCH_ERROR',
      500
    );
  }
}
