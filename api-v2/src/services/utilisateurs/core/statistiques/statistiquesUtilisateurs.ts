/**
 * Statistiques: statistiquesUtilisateurs
 * Génère des statistiques complètes sur les utilisateurs
 */

import type { PrismaClient } from "@prisma/client";
import type {
  StatistiquesUtilisateurs,
  StatistiquesUtilisateur,
} from "@clubmanager/types";
import { UtilisateursError, UtilisateursErrorCode } from "@clubmanager/types";

/**
 * Récupère les statistiques générales des utilisateurs
 */
export async function statistiquesGenerales(
  prisma: PrismaClient,
): Promise<StatistiquesUtilisateurs> {
  try {
    // Statistiques de base
    const [
      totalUtilisateurs,
      utilisateursActifs,
      utilisateursInactifs,
      utilisateursSuspendus,
    ] = await Promise.all([
      prisma.utilisateurs.count(),
      prisma.utilisateurs.count({ where: { active: true, status_id: 1 } }),
      prisma.utilisateurs.count({ where: { active: false } }),
      prisma.utilisateurs.count({ where: { status_id: 3 } }),
    ]);

    // Nouveaux utilisateurs dans les 30 derniers jours
    const date30JoursAvant = new Date();
    date30JoursAvant.setDate(date30JoursAvant.getDate() - 30);

    const nouveauxUtilisateurs30Jours = await prisma.utilisateurs.count({
      where: {
        date_inscription: {
          gte: date30JoursAvant,
        },
      },
    });

    // Répartition par genre
    const repartitionParGenreRaw = await prisma.utilisateurs.groupBy({
      by: ["genre_id"],
      _count: {
        id: true,
      },
      where: {
        genre_id: { not: null },
      },
    });

    const genresMap = await prisma.genres.findMany({
      select: { id: true, nom: true },
    });

    const repartitionParGenre = repartitionParGenreRaw.map((item) => {
      const genre = genresMap.find((g) => g.id === item.genre_id);
      return {
        genre: genre?.nom || "Non spécifié",
        count: item._count.id,
      };
    });

    // Répartition par grade
    const repartitionParGradeRaw = await prisma.utilisateurs.groupBy({
      by: ["grade_id"],
      _count: {
        id: true,
      },
      where: {
        grade_id: { not: null },
      },
    });

    const gradesMap = await prisma.grades.findMany({
      select: { id: true, nom: true },
    });

    const repartitionParGrade = repartitionParGradeRaw.map((item) => {
      const grade = gradesMap.find((g) => g.id === item.grade_id);
      return {
        grade: grade?.nom || "Non spécifié",
        count: item._count.id,
      };
    });

    // Répartition par abonnement
    const repartitionParAbonnementRaw = await prisma.utilisateurs.groupBy({
      by: ["abonnement_id"],
      _count: {
        id: true,
      },
      where: {
        abonnement_id: { not: null },
      },
    });

    const abonnementsMap = await prisma.abonnements.findMany({
      select: { id: true, nom: true },
    });

    const repartitionParAbonnement = repartitionParAbonnementRaw.map((item) => {
      const abonnement = abonnementsMap.find(
        (a) => a.id === item.abonnement_id,
      );
      return {
        abonnement: abonnement?.nom || "Non spécifié",
        count: item._count.id,
      };
    });

    // Répartition par tranche d'âge
    const utilisateursAvecAge = await prisma.utilisateurs.findMany({
      where: {
        date_of_birth: { not: null },
      },
      select: {
        date_of_birth: true,
      },
    });

    const tranchesAge = {
      "5-12 ans": 0,
      "13-17 ans": 0,
      "18-25 ans": 0,
      "26-40 ans": 0,
      "41-60 ans": 0,
      "61+ ans": 0,
    };

    let totalAge = 0;
    let countAge = 0;

    utilisateursAvecAge.forEach((u) => {
      if (u.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(u.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        totalAge += age;
        countAge++;

        if (age >= 5 && age <= 12) tranchesAge["5-12 ans"]++;
        else if (age >= 13 && age <= 17) tranchesAge["13-17 ans"]++;
        else if (age >= 18 && age <= 25) tranchesAge["18-25 ans"]++;
        else if (age >= 26 && age <= 40) tranchesAge["26-40 ans"]++;
        else if (age >= 41 && age <= 60) tranchesAge["41-60 ans"]++;
        else if (age >= 61) tranchesAge["61+ ans"]++;
      }
    });

    const repartitionParAge = Object.entries(tranchesAge).map(
      ([trancheAge, count]) => ({
        trancheAge,
        count,
      }),
    );

    const moyenneAge =
      countAge > 0 ? Math.round(totalAge / countAge) : undefined;

    return {
      totalUtilisateurs,
      utilisateursActifs,
      utilisateursInactifs,
      nouveauxUtilisateurs30Jours,
      utilisateursSuspendus,
      repartitionParGenre,
      repartitionParGrade,
      repartitionParAbonnement,
      repartitionParAge,
      moyenneAge,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la génération des statistiques utilisateurs:",
      error,
    );
    throw new UtilisateursError(
      "Erreur lors de la génération des statistiques",
      UtilisateursErrorCode.OPERATION_FAILED,
    );
  }
}

/**
 * Récupère les statistiques d'un utilisateur spécifique
 */
export async function statistiquesUtilisateur(
  prisma: PrismaClient,
  args: { utilisateurId: number },
): Promise<StatistiquesUtilisateur> {
  try {
    const { utilisateurId } = args;

    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId },
      include: {
        grades: true,
      },
    });

    if (!utilisateur) {
      throw new UtilisateursError(
        "Utilisateur non trouvé",
        UtilisateursErrorCode.USER_NOT_FOUND,
      );
    }

    // Nombre de cours inscrits
    // Note: Cette requête dépend de votre structure de base de données
    // Adapter selon vos tables de liaison (inscriptions, cours_utilisateurs, etc.)
    const nombreCoursInscrits = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT cours_id) as count
      FROM inscriptions
      WHERE utilisateur_id = ${utilisateurId}
      AND statut != 'annule'
    `
      .then((result) => Number(result[0]?.count || 0))
      .catch(() => 0);

    // Nombre de cours assistés (présences)
    const nombreCoursAssistes = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM presences
      WHERE utilisateur_id = ${utilisateurId}
      AND present = TRUE
    `
      .then((result) => Number(result[0]?.count || 0))
      .catch(() => 0);

    // Calcul du taux de présence
    const tauxPresence =
      nombreCoursInscrits > 0
        ? Math.round((nombreCoursAssistes / nombreCoursInscrits) * 100)
        : 0;

    // Temps de pratique total (en heures)
    // Estimation basée sur le nombre de cours assistés * durée moyenne d'un cours (1.5h)
    const tempsPratique = nombreCoursAssistes * 1.5;

    // Progression (temps dans le grade actuel)
    let progression: StatistiquesUtilisateur["progression"] = undefined;

    if (utilisateur.grade_id && utilisateur.grades) {
      // Calculer le temps dans le grade actuel
      // Cette logique dépend de comment vous trackez les changements de grade
      const dateObtentionGrade =
        utilisateur.date_inscription || utilisateur.created_at || new Date();
      const aujourdhui = new Date();
      const tempsDansGradeMs =
        aujourdhui.getTime() - dateObtentionGrade.getTime();
      const tempsDansGrade = Math.floor(
        tempsDansGradeMs / (1000 * 60 * 60 * 24),
      ); // en jours

      // Trouver le prochain grade
      const prochainGrade = await prisma.grades.findFirst({
        where: {
          niveau: {
            gt: utilisateur.grades.niveau || 0,
          },
        },
        orderBy: {
          niveau: "asc",
        },
      });

      progression = {
        gradeActuel: utilisateur.grades.nom,
        prochainGrade: prochainGrade?.nom,
        tempsDansGrade,
      };
    }

    // Dernier cours assisté
    const dernierCoursData = await prisma.$queryRaw<{ date_cours: Date }[]>`
      SELECT MAX(c.date_cours) as date_cours
      FROM presences p
      JOIN cours c ON p.cours_id = c.id
      WHERE p.utilisateur_id = ${utilisateurId}
      AND p.present = TRUE
    `
      .then((result) => result[0]?.date_cours)
      .catch(() => null);

    const dernierCours = dernierCoursData
      ? new Date(dernierCoursData)
      : undefined;

    // Prochain cours inscrit
    const prochainCoursData = await prisma.$queryRaw<{ date_cours: Date }[]>`
      SELECT MIN(c.date_cours) as date_cours
      FROM inscriptions i
      JOIN cours c ON i.cours_id = c.id
      WHERE i.utilisateur_id = ${utilisateurId}
      AND c.date_cours > NOW()
      AND i.statut != 'annule'
    `
      .then((result) => result[0]?.date_cours)
      .catch(() => null);

    const prochainCours = prochainCoursData
      ? new Date(prochainCoursData)
      : undefined;

    return {
      utilisateurId,
      nombreCoursInscrits,
      nombreCoursAssistes,
      tauxPresence,
      tempsPratique,
      progression,
      dernierCours,
      prochainCours,
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error(
      "Erreur lors de la génération des statistiques de l'utilisateur:",
      error,
    );
    throw new UtilisateursError(
      "Erreur lors de la génération des statistiques",
      UtilisateursErrorCode.OPERATION_FAILED,
    );
  }
}
