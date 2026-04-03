/**
 * Obtenir les statistiques de fréquentation pour un utilisateur
 */

import type { StatistiquesFrequentationUtilisateur } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirFrequentationUtilisateurArgs {
  utilisateurId: number;
}

export async function obtenirFrequentationUtilisateur(
  prisma: any,
  args: ObtenirFrequentationUtilisateurArgs
): Promise<StatistiquesFrequentationUtilisateur[]> {
  const { utilisateurId } = args;

  if (!utilisateurId || utilisateurId <= 0) {
    throw new StatistiquesError(
      'ID utilisateur invalide',
      'INVALID_USER_ID',
      400
    );
  }

  try {
    // Récupérer toutes les inscriptions validées de l'utilisateur avec leurs cours
    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: utilisateurId,
        status_id: 1
      },
      include: {
        cours: {
          select: {
            date_cours: true
          }
        }
      }
    });

    // Compter le nombre total de cours récurrents actifs
    const coursRecurrentsActifs = await prisma.cours_recurrent.count({
      where: { active: 1 }
    });

    const totalCoursParMois = coursRecurrentsActifs * 4;
    const totalFrequentation = inscriptions.length;

    // Grouper par mois
    const parMois = inscriptions.reduce((acc: any, inscription: any) => {
      const date = new Date(inscription.cours.date_cours);
      const mois = date.toLocaleString('fr-FR', { month: 'long' });
      const moisNum = date.getMonth() + 1;
      const annee = date.getFullYear();
      const key = `${annee}-${moisNum}`;

      if (!acc[key]) {
        acc[key] = {
          mois,
          moisNum,
          annee,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(parMois).map((m: any) => ({
      utilisateur_id: utilisateurId,
      mois: m.mois,
      frequentation: m.count,
      nombres_total_de_cours_du_mois: totalCoursParMois,
      pourcentage_de_cours_valides: totalCoursParMois > 0 
        ? Math.round((m.count / totalCoursParMois) * 10000) / 100
        : 0,
      totalFrequentation
    })).sort((a: any, b: any) => a.moisNum - b.moisNum);
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération de la fréquentation: ${(error as Error).message}`,
      'FREQUENTATION_FETCH_ERROR',
      500
    );
  }
}
