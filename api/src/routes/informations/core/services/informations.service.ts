/**
 * Service Informations - Logique métier
 * Gère la récupération des données de référence (grades, genres, status, abonnements)
 */

import { Informations } from "../../../../db/clients/informations/informations.js";

/**
 * Types pour les données de référence
 */
export interface Grade {
  id: number;
  nom: string;
  ordre?: number;
}

export interface Genre {
  id: number;
  nom: string;
}

export interface Status {
  id: number;
  nom: string;
}

export interface PlanTarifaire {
  id: number;
  nom_plan: string;
  prix: number;
  duree_mois: number;
  description?: string;
}

/**
 * Récupérer tous les grades
 */
export async function obtenirGrades(
  informationsClient?: Informations
): Promise<Grade[]> {
  const client = informationsClient || new Informations();

  console.log(`📚 [Service Informations] Récupération des grades`);

  try {
    const grades = await client.obtenirLesGrades();

    if (!grades || grades.length === 0) {
      console.log(`⚠️ [Service Informations] Aucun grade trouvé`);
      return [];
    }

    console.log(
      `✅ [Service Informations] ${grades.length} grades récupérés`
    );

    return grades;
  } catch (error) {
    console.error(`❌ [Service Informations] Erreur récupération grades:`, error);
    throw new Error("Impossible de récupérer les grades");
  }
}

/**
 * Récupérer tous les genres
 */
export async function obtenirGenres(
  informationsClient?: Informations
): Promise<Genre[]> {
  const client = informationsClient || new Informations();

  console.log(`👤 [Service Informations] Récupération des genres`);

  try {
    const genres = await client.obtenirLesGenres();

    if (!genres || genres.length === 0) {
      console.log(`⚠️ [Service Informations] Aucun genre trouvé`);
      return [];
    }

    console.log(
      `✅ [Service Informations] ${genres.length} genres récupérés`
    );

    return genres;
  } catch (error) {
    console.error(`❌ [Service Informations] Erreur récupération genres:`, error);
    throw new Error("Impossible de récupérer les genres");
  }
}

/**
 * Récupérer tous les statuts
 */
export async function obtenirStatus(
  informationsClient?: Informations
): Promise<Status[]> {
  const client = informationsClient || new Informations();

  console.log(`📊 [Service Informations] Récupération des statuts`);

  try {
    const status = await client.obtenirLeStatus();

    if (!status || status.length === 0) {
      console.log(`⚠️ [Service Informations] Aucun statut trouvé`);
      return [];
    }

    console.log(
      `✅ [Service Informations] ${status.length} statuts récupérés`
    );

    return status;
  } catch (error) {
    console.error(`❌ [Service Informations] Erreur récupération statuts:`, error);
    throw new Error("Impossible de récupérer les statuts");
  }
}

/**
 * Récupérer tous les plans tarifaires (abonnements)
 */
export async function obtenirAbonnements(
  informationsClient?: Informations
): Promise<PlanTarifaire[]> {
  const client = informationsClient || new Informations();

  console.log(`💳 [Service Informations] Récupération des plans tarifaires`);

  try {
    const plans = await client.obtenirLesPlansTarifaires();

    if (!plans || plans.length === 0) {
      console.log(`⚠️ [Service Informations] Aucun plan tarifaire trouvé`);
      return [];
    }

    console.log(
      `✅ [Service Informations] ${plans.length} plans tarifaires récupérés`
    );

    return plans;
  } catch (error) {
    console.error(
      `❌ [Service Informations] Erreur récupération plans tarifaires:`,
      error
    );
    throw new Error("Impossible de récupérer les plans tarifaires");
  }
}

/**
 * Récupérer toutes les données de référence en une seule fois
 * Utile pour l'initialisation d'un formulaire
 */
export async function obtenirToutesLesReferences(
  informationsClient?: Informations
): Promise<{
  grades: Grade[];
  genres: Genre[];
  status: Status[];
  abonnements: PlanTarifaire[];
}> {
  const client = informationsClient || new Informations();

  console.log(
    `🔄 [Service Informations] Récupération de toutes les références`
  );

  try {
    // Récupérer toutes les données en parallèle pour optimiser les performances
    const [grades, genres, status, abonnements] = await Promise.all([
      obtenirGrades(client),
      obtenirGenres(client),
      obtenirStatus(client),
      obtenirAbonnements(client),
    ]);

    console.log(
      `✅ [Service Informations] Toutes les références récupérées`
    );

    return {
      grades,
      genres,
      status,
      abonnements,
    };
  } catch (error) {
    console.error(
      `❌ [Service Informations] Erreur récupération références:`,
      error
    );
    throw new Error("Impossible de récupérer les données de référence");
  }
}

/**
 * Vérifier la santé du service
 */
export async function verifierSanteService(
  informationsClient?: Informations
): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    grades: boolean;
    genres: boolean;
    status: boolean;
    abonnements: boolean;
  };
  message: string;
}> {
  const client = informationsClient || new Informations();

  console.log(`🏥 [Service Informations] Vérification de santé`);

  const checks = {
    grades: false,
    genres: false,
    status: false,
    abonnements: false,
  };

  try {
    // Vérifier chaque endpoint
    const [gradesTest, genresTest, statusTest, abonnementsTest] =
      await Promise.allSettled([
        client.obtenirLesGrades(),
        client.obtenirLesGenres(),
        client.obtenirLeStatus(),
        client.obtenirLesPlansTarifaires(),
      ]);

    checks.grades = gradesTest.status === "fulfilled";
    checks.genres = genresTest.status === "fulfilled";
    checks.status = statusTest.status === "fulfilled";
    checks.abonnements = abonnementsTest.status === "fulfilled";

    const healthyCount = Object.values(checks).filter(Boolean).length;

    if (healthyCount === 4) {
      return {
        status: "healthy",
        checks,
        message: "Tous les services sont opérationnels",
      };
    } else if (healthyCount >= 2) {
      return {
        status: "degraded",
        checks,
        message: `${healthyCount}/4 services opérationnels`,
      };
    } else {
      return {
        status: "unhealthy",
        checks,
        message: `Seulement ${healthyCount}/4 services opérationnels`,
      };
    }
  } catch (error) {
    console.error(
      `❌ [Service Informations] Erreur vérification santé:`,
      error
    );
    return {
      status: "unhealthy",
      checks,
      message: "Erreur lors de la vérification de santé",
    };
  }
}
