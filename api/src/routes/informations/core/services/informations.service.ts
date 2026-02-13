/**
 * Service Informations - Logique métier
 * Gère les opérations sur les informations générales du club
 *
 * @module informations.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

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

    const informations = await prisma.informations.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

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

    const information = await prisma.informations.findUnique({
      where: { id: informationId },
    });

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

    const informations = await prisma.informations.findMany({
      where: {
        actif: true,
      },
      orderBy: {
        date_publication: "desc",
      },
    });

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

    const informations = await prisma.informations.findMany({
      where: {
        categorie: categorie,
      },
      orderBy: {
        created_at: "desc",
      },
    });

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

    const information = await prisma.informations.create({
      data: {
        titre: data.titre,
        contenu: data.contenu,
        categorie: data.categorie || null,
        actif: data.actif !== undefined ? data.actif : true,
        date_publication: data.date_publication || new Date(),
      },
    });

    console.log(
      `✅ [InformationsService] Information créée: ${information.id}`,
    );

    return information as InformationData;
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
): Promise<InformationData | null> {
  try {
    if (!informationId || isNaN(informationId) || informationId <= 0) {
      throw new Error("ID information invalide");
    }

    addSentryBreadcrumb(
      `Modification information ${informationId}`,
      "service.informations",
      "info",
      { informationId, data },
    );

    console.log(
      `✏️ [InformationsService] Modification information ${informationId}`,
    );

    const information = await prisma.informations.update({
      where: { id: informationId },
      data: {
        titre: data.titre,
        contenu: data.contenu,
        categorie: data.categorie,
        actif: data.actif,
        updated_at: new Date(),
      },
    });

    console.log(
      `✅ [InformationsService] Information ${informationId} modifiée`,
    );

    return information as InformationData;
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

    throw new Error(
      `Erreur lors de la modification de l'information: ${error.message}`,
    );
  }
}

/**
 * Supprimer une information
 */
export async function supprimerInformation(
  informationId: number,
): Promise<boolean> {
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

    await prisma.informations.delete({
      where: { id: informationId },
    });

    console.log(
      `✅ [InformationsService] Information ${informationId} supprimée`,
    );

    return true;
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
      return false;
    }

    throw new Error(
      `Erreur lors de la suppression de l'information: ${error.message}`,
    );
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

    await prisma.informations.update({
      where: { id: informationId },
      data: {
        actif: true,
        date_publication: new Date(),
      },
    });

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

    await prisma.informations.update({
      where: { id: informationId },
      data: {
        actif: false,
        date_archivage: new Date(),
      },
    });

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
}

// Instance singleton
export const informationsService = new InformationsService();
