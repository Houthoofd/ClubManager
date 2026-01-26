/**
 * Obtenir les statistiques générales du club
 */

import type { StatistiquesGenerales } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export async function obtenirStatistiquesGenerales(prisma: any): Promise<StatistiquesGenerales> {
  try {
    const maintenant = new Date();
    const debutSemaine = new Date(maintenant);
    debutSemaine.setDate(maintenant.getDate() - maintenant.getDay());
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 7);

    const [total_utilisateurs, cours_a_venir, total_inscriptions, total_professeurs, nombreMembres, coursSemaine, plansActifs] = await Promise.all([
      prisma.utilisateurs.count({ where: { status_id: 1 } }),
      prisma.cours.count({ where: { date_cours: { gte: maintenant } } }),
      prisma.inscriptions.count({
        where: {
          cours: {
            date_cours: { gte: maintenant }
          }
        }
      }),
      prisma.professeurs.count({ where: { status_id: 5 } }),
      prisma.utilisateurs.count({ where: { status_id: { in: [1, 2, 3, 4, 5] } } }),
      prisma.cours.count({
        where: {
          date_cours: {
            gte: debutSemaine,
            lt: finSemaine
          }
        }
      }),
      prisma.plans_tarifaires.count()
    ]);

    return {
      total_utilisateurs,
      cours_a_venir,
      total_inscriptions,
      total_professeurs,
      nombreMembres,
      coursSemaine,
      plansActifs
    };
  } catch (error) {
    throw new StatistiquesError(
      `Erreur lors de la récupération des statistiques générales: ${(error as Error).message}`,
      'GENERAL_STATS_ERROR',
      500
    );
  }
}
