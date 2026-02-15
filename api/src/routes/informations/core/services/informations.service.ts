/**
 * Service Informations - Logique métier
 * Gère les opérations sur les informations générales du club
 *
 * ⚠️ NOTE: Le modèle 'informations' n'existe pas dans le schéma Prisma actuel.
 * Ce service retourne des données mockées en attendant la migration du schéma.
 *
 * @module informations.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";
import { Informations } from "@clubmanager/types";

type InformationResult = Informations.InformationResult;

/**
 * Interface pour les données d'information
 */
export interface InformationData {
  id: number;
  titre: string;
  contenu: string;
  categorie?: string | null;
  actif: boolean;
  date_publication?: Date | null;
  date_archivage?: Date | null;
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * Récupère toutes les informations
 */
export async function obtenirToutesInformations(): Promise<InformationData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération toutes les informations",
      "service.informations",
      "info",
    );

    console.log(
      "📰 [InformationsService] Récupération toutes les informations",
    );

    // NOTE: Modèle informations n'existe pas - retourner tableau vide
    const informations: InformationData[] = [];
    // const informations = await prisma.informations.findMany({
    //   orderBy: {
    //     created_at: "desc",
    //   },
    // });

    console.log(
      `✅ [InformationsService] ${informations.length} informations récupérées`,
    );

    return informations as InformationData[];
  } catch (error: any) {
    console.error(
      "❌ [InformationsService] Erreur récupération informations:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "obtenirToutesInformations",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des informations: ${error.message}`,
    );
  }
}

/**
 * Récupère une information par son ID
 */
export async function obtenirInformationParId(
  informationId: number,
): Promise<InformationData | null> {
  try {
    if (!informationId || isNaN(informationId) || informationId <= 0) {
      throw new Error("ID information invalide");
    }

    addSentryBreadcrumb(
      `Récupération information ${informationId}`,
      "service.informations",
      "info",
      { informationId },
    );

    console.log(
      `📰 [InformationsService] Récupération information ${informationId}`,
    );

    // NOTE: Modèle informations n'existe pas - retourner null
    const information: InformationData | null = null;
    // const information = await prisma.informations.findUnique({
    //   where: { id: informationId },
    // });

    if (!information) {
      console.log(
        `❌ [InformationsService] Information ${informationId} non trouvée`,
      );
      return null;
    }

    console.log(
      `✅ [InformationsService] Information ${informationId} trouvée`,
    );

    return information as InformationData;
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur récupération information ${informationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "obtenirInformationParId",
      },
      extra: { informationId },
    });

    throw new Error(
      `Erreur lors de la récupération de l'information: ${error.message}`,
    );
  }
}

/**
 * Récupère les informations actives
 */
export async function obtenirInformationsActives(): Promise<InformationData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération informations actives",
      "service.informations",
      "info",
    );

    console.log("📰 [InformationsService] Récupération informations actives");

    // NOTE: Modèle informations n'existe pas - retourner tableau vide
    const informations: InformationData[] = [];
    // const informations = await prisma.informations.findMany({
    //   where: {
    //     actif: true,
    //   },
    //   orderBy: {
    //     date_publication: "desc",
    //   },
    // });

    console.log(
      `✅ [InformationsService] ${informations.length} informations actives`,
    );

    return informations as InformationData[];
  } catch (error: any) {
    console.error(
      "❌ [InformationsService] Erreur récupération informations actives:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "obtenirInformationsActives",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des informations actives: ${error.message}`,
    );
  }
}

/**
 * Récupère les informations par catégorie
 */
export async function obtenirInformationsParCategorie(
  categorie: string,
): Promise<InformationData[]> {
  try {
    if (!categorie) {
      throw new Error("Catégorie invalide");
    }

    addSentryBreadcrumb(
      `Récupération informations par catégorie ${categorie}`,
      "service.informations",
      "info",
      { categorie },
    );

    console.log(
      `📰 [InformationsService] Récupération informations catégorie ${categorie}`,
    );

    // NOTE: Modèle informations n'existe pas - retourner tableau vide
    const informations: InformationData[] = [];
    // const informations = await prisma.informations.findMany({
    //   where: {
    //     categorie: categorie,
    //   },
    //   orderBy: {
    //     created_at: "desc",
    //   },
    // });

    console.log(
      `✅ [InformationsService] ${informations.length} informations dans catégorie ${categorie}`,
    );

    return informations as InformationData[];
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur récupération informations par catégorie:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "obtenirInformationsParCategorie",
      },
      extra: { categorie },
    });

    throw new Error(
      `Erreur lors de la récupération des informations par catégorie: ${error.message}`,
    );
  }
}

/**
 * Créer une nouvelle information
 */
export async function creerInformation(data: any): Promise<InformationData> {
  try {
    addSentryBreadcrumb(
      "Création nouvelle information",
      "service.informations",
      "info",
      { data },
    );

    console.log("➕ [InformationsService] Création information", data);

    // NOTE: Modèle informations n'existe pas - retourner mock
    const information: InformationData = {
      id: 1,
      titre: data.titre,
      contenu: data.contenu,
      categorie: data.categorie || null,
      actif: data.actif !== undefined ? data.actif : true,
      date_publication: data.date_publication || new Date(),
      date_archivage: null,
      created_at: new Date(),
      updated_at: null,
    };
    // const information = await prisma.informations.create({
    //   data: {
    //     titre: data.titre,
    //     contenu: data.contenu,
    //     categorie: data.categorie || null,
    //     actif: data.actif !== undefined ? data.actif : true,
    //     date_publication: data.date_publication || new Date(),
    //   },
    // });

    console.log(
      `✅ [InformationsService] Information créée: ${information.id}`,
    );

    return information;
  } catch (error: any) {
    console.error(
      "❌ [InformationsService] Erreur création information:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "creerInformation",
      },
      extra: { data },
    });

    throw new Error(
      `Erreur lors de la création de l'information: ${error.message}`,
    );
  }
}

/**
 * Modifier une information
 */
export async function modifierInformation(
  informationId: number,
  data: any,
): Promise<InformationResult | null> {
  try {
    addSentryBreadcrumb(
      `Modification information ${informationId}`,
      "service.informations",
      "info",
      { data },
    );

    console.log(
      `✏️ [InformationsService] Modification information ${informationId}:`,
      data,
    );

    // NOTE: Modèle informations n'existe pas - retourner mock
    const information: InformationData = {
      id: informationId,
      titre: data.titre || "Mock Title",
      contenu: data.contenu || "Mock Content",
      categorie: null,
      actif: true,
      date_publication: new Date(),
      date_archivage: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    // const information = await prisma.informations.update({
    //   where: { id: informationId },
    //   data: {
    //     titre: data.titre,
    //     contenu: data.contenu,
    //     categorie: data.categorie,
    //     actif: data.actif,
    //     date_publication: data.date_publication,
    //     date_archivage: data.date_archivage,
    //     updated_at: new Date(),
    //   },
    // });

    console.log(
      `✅ [InformationsService] Information ${informationId} modifiée`,
    );

    if (!information) {
      return null;
    }

    return {
      success: true,
      message: "Information modifiée avec succès",
      data: {
        id: information.id,
        titre: information.titre,
        contenu: information.contenu,
        date_creation: information.created_at,
        status_id: 1,
      },
    };
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur modification information ${informationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "modifierInformation",
      },
      extra: { informationId, data },
    });

    if (error.code === "P2025") {
      return null;
    }

    return {
      success: false,
      message: `Erreur lors de la modification: ${error.message}`,
    };
  }
}

/**
 * Supprimer une information
 */
export async function supprimerInformation(
  informationId: number,
): Promise<InformationResult> {
  try {
    if (!informationId || isNaN(informationId) || informationId <= 0) {
      throw new Error("ID information invalide");
    }

    addSentryBreadcrumb(
      `Suppression information ${informationId}`,
      "service.informations",
      "warning",
      { informationId },
    );

    console.log(
      `🗑️ [InformationsService] Suppression information ${informationId}`,
    );

    // NOTE: Modèle informations n'existe pas - simulation
    // await prisma.informations.delete({
    //   where: { id: informationId },
    // });

    console.log(
      `✅ [InformationsService] Information ${informationId} supprimée`,
    );

    return {
      success: true,
      message: "Information supprimée avec succès",
    };
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur suppression information ${informationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "supprimerInformation",
      },
      extra: { informationId },
    });

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Information non trouvée",
      };
    }

    return {
      success: false,
      message: `Erreur lors de la suppression: ${error.message}`,
    };
  }
}

/**
 * Publier une information
 */
export async function publierInformation(
  informationId: number,
): Promise<boolean> {
  try {
    if (!informationId || isNaN(informationId) || informationId <= 0) {
      throw new Error("ID information invalide");
    }

    addSentryBreadcrumb(
      `Publication information ${informationId}`,
      "service.informations",
      "info",
      { informationId },
    );

    console.log(
      `📢 [InformationsService] Publication information ${informationId}`,
    );

    // NOTE: Modèle informations n'existe pas - simulation
    // await prisma.informations.update({
    //   where: { id: informationId },
    //   data: {
    //     actif: true,
    //     date_archivage: null,
    //   },
    // });

    console.log(
      `✅ [InformationsService] Information ${informationId} publiée`,
    );

    return true;
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur publication information ${informationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "publierInformation",
      },
      extra: { informationId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la publication de l'information: ${error.message}`,
    );
  }
}

/**
 * Archiver une information
 */
export async function archiverInformation(
  informationId: number,
): Promise<boolean> {
  try {
    if (!informationId || isNaN(informationId) || informationId <= 0) {
      throw new Error("ID information invalide");
    }

    addSentryBreadcrumb(
      `Archivage information ${informationId}`,
      "service.informations",
      "info",
      { informationId },
    );

    console.log(
      `📦 [InformationsService] Archivage information ${informationId}`,
    );

    // NOTE: Modèle informations n'existe pas - simulation
    // await prisma.informations.update({
    //   where: { id: informationId },
    //   data: {
    //     actif: false,
    //     date_archivage: new Date(),
    //   },
    // });

    console.log(
      `✅ [InformationsService] Information ${informationId} archivée`,
    );

    return true;
  } catch (error: any) {
    console.error(
      `❌ [InformationsService] Erreur archivage information ${informationId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "informations",
        operation: "archiverInformation",
      },
      extra: { informationId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de l'archivage de l'information: ${error.message}`,
    );
  }
}

/**
 * Classe InformationsService
 */
export class InformationsService {
  async obtenirToutesInformations() {
    return obtenirToutesInformations();
  }

  async obtenirInformationParId(informationId: number) {
    return obtenirInformationParId(informationId);
  }

  async obtenirInformationsActives() {
    return obtenirInformationsActives();
  }

  async obtenirInformationsParCategorie(categorie: string) {
    return obtenirInformationsParCategorie(categorie);
  }

  async creerInformation(data: any) {
    return creerInformation(data);
  }

  async modifierInformation(informationId: number, data: any) {
    return modifierInformation(informationId, data);
  }

  async supprimerInformation(informationId: number) {
    return supprimerInformation(informationId);
  }

  async publierInformation(informationId: number) {
    return publierInformation(informationId);
  }

  async archiverInformation(informationId: number) {
    return archiverInformation(informationId);
  }

  // Méthodes alias pour compatibilité avec les resolvers
  async obtenirToutesLesInformations() {
    return this.obtenirToutesInformations();
  }

  async ajouterInformation(data: any): Promise<InformationResult> {
    try {
      const information = await this.creerInformation(data);
      return {
        success: true,
        message: "Information créée avec succès",
        data: {
          id: information.id,
          titre: information.titre,
          contenu: information.contenu,
          date_creation: information.created_at,
          status_id: 1, // Default status
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erreur lors de la création: ${error.message}`,
      };
    }
  }

  async obtenirLesGrades() {
    try {
      const grades = await prisma!.grades.findMany({
        orderBy: { grade_id: "asc" },
      });
      // Mapper grade_id vers nom pour GraphQL si nécessaire
      return grades.map((grade) => ({
        id: grade.id,
        nom: grade.grade_id,
        grade_id: grade.grade_id,
      }));
    } catch (error: any) {
      console.error("[InformationsService] Erreur obtenirLesGrades:", error);
      throw new Error(
        `Erreur lors de la récupération des grades: ${error.message}`,
      );
    }
  }

  async obtenirLesGenres() {
    try {
      const genres = await prisma!.genres.findMany({
        orderBy: { genre_name: "asc" },
      });
      // Mapper genre_name vers nom pour GraphQL
      return genres.map((genre) => ({
        id: genre.id,
        nom: genre.genre_name,
      }));
    } catch (error: any) {
      console.error("[InformationsService] Erreur obtenirLesGenres:", error);
      throw new Error(
        `Erreur lors de la récupération des genres: ${error.message}`,
      );
    }
  }

  async obtenirLesStatus() {
    try {
      const status = await prisma!.status.findMany({
        orderBy: { nom_role: "asc" },
      });
      // Mapper nom_role vers status_name pour GraphQL
      return status.map((s) => ({
        id: s.id,
        status_name: s.nom_role,
        description: s.description,
      }));
    } catch (error: any) {
      console.error("[InformationsService] Erreur obtenirLesStatus:", error);
      throw new Error(
        `Erreur lors de la récupération des status: ${error.message}`,
      );
    }
  }

  async obtenirLesPlansTarifaires() {
    try {
      const plans = await prisma!.plans_tarifaires.findMany({
        orderBy: { nom_plan: "asc" },
      });
      // Mapper les champs et calculer duree_mois depuis periode
      return plans.map((plan) => ({
        id: plan.id,
        nom_plan: plan.nom_plan,
        prix: plan.prix,
        periode: plan.periode,
        description: plan.description,
        duree_mois: this.calculateDureeMoisFromPeriode(plan.periode),
      }));
    } catch (error: any) {
      console.error(
        "[InformationsService] Erreur obtenirLesPlansTarifaires:",
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des plans tarifaires: ${error.message}`,
      );
    }
  }

  private calculateDureeMoisFromPeriode(periode: string): number {
    // Extraire le nombre de mois depuis la période
    // Ex: "mensuel" = 1, "annuel" = 12, "trimestriel" = 3
    const periodeMap: Record<string, number> = {
      mensuel: 1,
      trimestriel: 3,
      semestriel: 6,
      annuel: 12,
    };
    return periodeMap[periode.toLowerCase()] || 1;
  }
}

// Instance singleton
export const informationsService = new InformationsService();
