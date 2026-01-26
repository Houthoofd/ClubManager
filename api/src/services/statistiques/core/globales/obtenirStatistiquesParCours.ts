/**
 * Obtenir les statistiques par cours
 */

import type { StatistiquesParCours } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirStatistiquesParCoursArgs {
  dateDebut?: Date;
  dateFin?: Date;
}

export async function obtenirStatistiquesParCours(
  prisma: any,
  args: ObtenirStatistiquesParCoursArgs = {}
): Promise<StatistiquesParCours[]> {
  const { dateDebut, dateFin } = args;

  try {
    const where: any = {};
    if (dateDebut || dateFin) {
      where.date_cours = {};
      if (dateDebut) where.date_cours.gte = dateDebut;
      if (dateFin) where.date_cours.lte = dateFin;
    } else {
      // Par défaut, cours à venir
      where.date_cours = { gte: new Date() };
    }

    const cours = await prisma.cours.findMany({
      where,
      include: {
        inscriptions: {
          select: {
            status_id: true
          }
        }
      }
    });

    // Grouper par type de cours
    const groupeParType = cours.reduce((acc: any, c: any) => {
      const type = c.type_cours;
      if (!acc[type]) {
        acc[type] = {
          type_cours: type,
          nombre_inscriptions: 0,
          total_presents: 0,
          total_cours: 0
        };
      }
      acc[type].nombre_inscriptions += c.inscriptions.length;
      acc[type].total_presents += c.inscriptions.filter((i: any) => i.status_id === 1).length;
      acc[type].total_cours++;
      return acc;
    }, {});

    return Object.values(groupeParType)
      .map((g: any) => ({
        type_cours: g.type_cours,
        nombre_inscriptions: g.nombre_inscriptions,
        taux_presence: g.nombre_inscriptions > 0 
          ? (g.total_presents / g.nombre_inscriptions) * 100 
          : 0
      }))
      .sort((a: any, b: any) => b.nombre_inscriptions - a.nombre_inscriptions);
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération des statistiques par cours: ${(error as Error).message}`,
      'COURS_STATS_ERROR',
      500
    );
  }
}
