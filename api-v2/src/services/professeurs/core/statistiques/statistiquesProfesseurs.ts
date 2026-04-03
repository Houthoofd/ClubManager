/**
 * Statistiques générales des professeurs
 */

import { ProfesseursError } from '@clubmanager/types';

export async function statistiquesGenerales(prisma: any) {
  try {
    // Compter le total de professeurs
    const totalProfesseurs = await prisma.utilisateurs.count({
      where: {
        status_id: 5
      }
    });

    // Compter les professeurs actifs (status_id = 5)
    const professeursActifs = totalProfesseurs;

    // Compter les professeurs inactifs (on pourrait avoir un autre statut)
    const professeursInactifs = 0;

    // Récupérer les professeurs avec leurs informations
    const professeurs = await prisma.utilisateurs.findMany({
      where: {
        status_id: 5
      },
      select: {
        id: true,
        grade_id: true
      }
    });

    // Note: Ces compteurs dépendent de votre structure de base de données
    // Adaptez selon vos tables de liaison cours/professeurs/élèves

    // Exemple de requête pour compter les cours (à adapter)
    const totalCours = 0; // await prisma.cours_recurrent_professeur.count();

    // Exemple de requête pour compter les élèves (à adapter)
    const totalEleves = 0; // await prisma.inscriptions.count();

    // Calculer les moyennes
    const moyenneCoursParProfesseur = totalProfesseurs > 0
      ? Math.round((totalCours / totalProfesseurs) * 100) / 100
      : 0;

    const moyenneElevesParProfesseur = totalProfesseurs > 0
      ? Math.round((totalEleves / totalProfesseurs) * 100) / 100
      : 0;

    // Répartition par grade (si applicable)
    const gradesCount = professeurs.reduce((acc: any, prof: any) => {
      const gradeId = prof.grade_id || 0;
      acc[gradeId] = (acc[gradeId] || 0) + 1;
      return acc;
    }, {});

    const repartitionParGrade = Object.entries(gradesCount).map(([gradeId, count]) => ({
      grade: `Grade ${gradeId}`,
      count: count as number
    }));

    return {
      totalProfesseurs,
      professeursActifs,
      professeursInactifs,
      totalCours,
      totalEleves,
      moyenneCoursParProfesseur,
      moyenneElevesParProfesseur,
      repartitionParGrade
    };
  } catch (error) {
    throw new ProfesseursError(
      `Erreur lors du calcul des statistiques: ${error}`,
      'ERREUR_STATISTIQUES'
    );
  }
}

export interface StatistiquesProfesseurArgs {
  professeurId: number;
}

export async function statistiquesProfesseur(prisma: any, args: StatistiquesProfesseurArgs) {
  const { professeurId } = args;

  try {
    // Vérifier que le professeur existe
    const professeur = await prisma.utilisateurs.findFirst({
      where: {
        id: professeurId,
        status_id: 5
      }
    });

    if (!professeur) {
      throw new ProfesseursError('Professeur introuvable', 'PROFESSEUR_INTROUVABLE');
    }

    // Note: Ces requêtes dépendent de votre structure de base de données
    // Adaptez selon vos tables de liaison

    // Nombre de cours du professeur
    const nombreCours = 0; // À implémenter selon votre schema

    // Nombre d'élèves du professeur
    const nombreEleves = 0; // À implémenter selon votre schema

    // Taux de présence (si vous avez un système de présences)
    const tauxPresence = 0; // À implémenter

    // Heures d'enseignement (calculées depuis les cours)
    const heuresEnseignement = 0; // À implémenter

    return {
      professeurId,
      nombreCours,
      nombreEleves,
      tauxPresence,
      heuresEnseignement
    };
  } catch (error) {
    if (error instanceof ProfesseursError) {
      throw error;
    }
    throw new ProfesseursError(
      `Erreur lors du calcul des statistiques du professeur: ${error}`,
      'ERREUR_STATISTIQUES_PROFESSEUR'
    );
  }
}
