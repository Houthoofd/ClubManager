/**
 * Obtenir la progression d'un utilisateur
 */

import type { StatistiquesProgressionUtilisateur } from '@clubmanager/types';
import { StatistiquesError, NiveauProgression } from '@clubmanager/types';

export interface ObtenirProgressionUtilisateurArgs {
  utilisateurId: number;
}

export async function obtenirProgressionUtilisateur(
  prisma: any,
  args: ObtenirProgressionUtilisateurArgs
): Promise<StatistiquesProgressionUtilisateur> {
  const { utilisateurId } = args;

  if (!utilisateurId || utilisateurId <= 0) {
    throw new StatistiquesError(
      'ID utilisateur invalide',
      'INVALID_USER_ID',
      400
    );
  }

  try {
    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId }
    });

    if (!utilisateur) {
      throw new StatistiquesError(
        `Utilisateur ${utilisateurId} introuvable`,
        'USER_NOT_FOUND',
        404
      );
    }

    // Récupérer toutes les inscriptions validées avec les cours
    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        utilisateur_id: utilisateurId,
        status_id: 1
      },
      include: {
        cours: {
          select: {
            id: true,
            type_cours: true,
            cours_recurrent_id: true
          }
        }
      }
    });

    // Grouper par cours récurrent
    const groupeByCours = inscriptions.reduce((acc: any, inscription: any) => {
      const coursId = inscription.cours.id;
      const recurrentId = inscription.cours.cours_recurrent_id;
      
      if (!acc[coursId]) {
        acc[coursId] = {
          cours_id: coursId,
          titre: inscription.cours.type_cours,
          cours_suivis: 0,
          cours_recurrent_id: recurrentId
        };
      }
      acc[coursId].cours_suivis++;
      return acc;
    }, {});

    // Calculer la progression pour chaque cours
    const progressionParCours = await Promise.all(
      Object.values(groupeByCours).map(async (cours: any) => {
        const totalCoursRecurrent = await prisma.cours.count({
          where: { cours_recurrent_id: cours.cours_recurrent_id }
        });
        
        return {
          cours_id: cours.cours_id,
          titre: cours.titre,
          cours_suivis: cours.cours_suivis,
          progression: totalCoursRecurrent > 0 
            ? (cours.cours_suivis / totalCoursRecurrent) * 100 
            : 0
        };
      })
    );

    const coursSuivis = progressionParCours.reduce((total, cours) => total + cours.cours_suivis, 0);

    // Calculer le niveau actuel
    let niveauActuel: string = NiveauProgression.DEBUTANT;
    if (coursSuivis > 50) niveauActuel = NiveauProgression.EXPERT;
    else if (coursSuivis > 30) niveauActuel = NiveauProgression.AVANCE;
    else if (coursSuivis > 10) niveauActuel = NiveauProgression.INTERMEDIAIRE;

    // Calculer le pourcentage global
    const pourcentage_global = progressionParCours.length > 0
      ? progressionParCours.reduce((sum, c) => sum + c.progression, 0) / progressionParCours.length
      : 0;

    return {
      utilisateur_id: utilisateurId,
      coursSuivis,
      progressionParCours,
      niveauActuel,
      pourcentage_global: Math.round(pourcentage_global * 100) / 100
    };
  } catch (error) {
    if (error instanceof StatistiquesError) {
      throw error;
    }
    throw new StatistiquesError(
      `Erreur lors de la récupération de la progression: ${(error as Error).message}`,
      'PROGRESSION_FETCH_ERROR',
      500
    );
  }
}
