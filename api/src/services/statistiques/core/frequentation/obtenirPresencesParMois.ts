/**
 * Obtenir les présences par mois pour un utilisateur
 */

import type { PresenceParMois } from '@clubmanager/types';
import { StatistiquesError } from '@clubmanager/types';

export interface ObtenirPresencesParMoisArgs {
  utilisateurId: number;
  valide?: boolean; // true = validées, false = non validées, undefined = toutes
}

export async function obtenirPresencesParMois(
  prisma: any,
  args: ObtenirPresencesParMoisArgs
): Promise<PresenceParMois[]> {
  const { utilisateurId, valide } = args;

  if (!utilisateurId || utilisateurId <= 0) {
    throw new StatistiquesError(
      'ID utilisateur invalide',
      'INVALID_USER_ID',
      400
    );
  }

  try {
    const statusCondition = valide !== undefined
      ? valide
        ? { status_id: 1 }
        : { status_id: 0 }
      : {};

    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: utilisateurId,
        ...statusCondition
      },
      include: {
        cours: {
          select: {
            type_cours: true,
            date_cours: true
          }
        },
        utilisateurs: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Grouper par mois et type de cours
    const grouped = inscriptions.reduce((acc: any, inscription: any) => {
      const dateCours = new Date(inscription.cours.date_cours);
      const mois = dateCours.getMonth() + 1;
      const typeCours = inscription.cours.type_cours;
      const key = `${mois}-${typeCours}`;

      if (!acc[key]) {
        acc[key] = {
          last_name: inscription.utilisateurs.last_name,
          first_name: inscription.utilisateurs.first_name,
          mois,
          nom_mois: getNomMois(mois),
          type_cours: typeCours,
          total_presences: 0
        };
      }

      acc[key].total_presences++;
      return acc;
    }, {});

    return Object.values(grouped);
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération des présences par mois: ${(error as Error).message}`,
      'PRESENCES_FETCH_ERROR',
      500
    );
  }
}

/**
 * Obtenir le nom du mois en français
 */
function getNomMois(mois: number): string {
  const noms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return noms[mois - 1] || '';
}
