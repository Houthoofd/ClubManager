/**
 * Service Cours - Logique métier
 * Gère les opérations sur les cours et séances
 *
 * @module cours.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Interface pour les données de cours
 * Basé sur le schéma Prisma réel
 */
export interface CoursData {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: Date;
  heure_fin: Date;
  cours_recurrent_id: number;
  cours_recurrent?: {
    type_cours: string;
    description?: string | null;
    niveau?: string | null;
    duree?: number | null;
    capacite_max?: number | null;
  };
}

/**
 * Interface pour les cours récurrents
 */
export interface CoursRecurrentData {
  id: number;
  type_cours: string;
  description?: string | null;
  niveau?: string | null;
  duree?: number | null;
  capacite_max?: number | null;
  jour_semaine?: string | null;
  heure_debut?: Date | null;
  heure_fin?: Date | null;
  actif: boolean;
  created_at: Date;
}

/**
 * Récupère tous les cours
 */
export async function obtenirTousCours(): Promise<CoursData[]> {
  try {
    addSentryBreadcrumb("Récupération tous les cours", "service.cours", "info");

    console.log("📚 [CoursService] Récupération tous les cours");

    const cours = await prisma.cours.findMany({
      include: {
        cours_recurrent: true,
      },
      orderBy: {
        date_cours: "desc",
      },
    });

    console.log(`✅ [CoursService] ${cours.length} cours récupérés`);

    return cours as CoursData[];
  } catch (error: any) {
    console.error("❌ [CoursService] Erreur récupération cours:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirTousCours",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des cours: ${error.message}`,
    );
  }
}

/**
 * Récupère un cours par son ID
 */
export async function obtenirCoursParId(
  coursId: number,
): Promise<CoursData | null> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Récupération cours ${coursId}`,
      "service.cours",
      "info",
      { coursId },
    );

    console.log(`📚 [CoursService] Récupération cours ${coursId}`);

    const cours = await prisma.cours.findUnique({
      where: { id: coursId },
      include: {
        cours_recurrent: true,
        inscriptions: {
          include: {
            utilisateurs: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!cours) {
      console.log(`❌ [CoursService] Cours ${coursId} non trouvé`);
      return null;
    }

    console.log(`✅ [CoursService] Cours ${coursId} trouvé`);

    return cours as CoursData;
  } catch (error: any) {
    console.error(
      `❌ [CoursService] Erreur récupération cours ${coursId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirCoursParId",
      },
      extra: { coursId },
    });

    throw new Error(
      `Erreur lors de la récupération du cours: ${error.message}`,
    );
  }
}

/**
 * Récupère les cours d'un cours récurrent (par type/professeur)
 */
export async function obtenirCoursParRecurrent(
  coursRecurrentId: number,
): Promise<CoursData[]> {
  try {
    if (!coursRecurrentId || isNaN(coursRecurrentId) || coursRecurrentId <= 0) {
      throw new Error("ID cours récurrent invalide");
    }

    addSentryBreadcrumb(
      `Récupération cours récurrent ${coursRecurrentId}`,
      "service.cours",
      "info",
      { coursRecurrentId },
    );

    console.log(
      `📚 [CoursService] Récupération cours récurrent ${coursRecurrentId}`,
    );

    const cours = await prisma.cours.findMany({
      where: {
        cours_recurrent_id: coursRecurrentId,
      },
      include: {
        cours_recurrent: true,
      },
      orderBy: {
        date_cours: "asc",
      },
    });

    console.log(
      `✅ [CoursService] ${cours.length} cours pour récurrent ${coursRecurrentId}`,
    );

    return cours as CoursData[];
  } catch (error: any) {
    console.error(
      `❌ [CoursService] Erreur récupération cours récurrent:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirCoursParRecurrent",
      },
      extra: { coursRecurrentId },
    });

    throw new Error(
      `Erreur lors de la récupération des cours récurrents: ${error.message}`,
    );
  }
}

/**
 * Créer un nouveau cours
 */
export async function creerCours(data: any): Promise<CoursData> {
  try {
    addSentryBreadcrumb("Création nouveau cours", "service.cours", "info", {
      data,
    });

    console.log("➕ [CoursService] Création cours", data);

    const cours = await prisma.cours.create({
      data: {
        date_cours: data.date_cours,
        type_cours: data.type_cours,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin,
        cours_recurrent_id: data.cours_recurrent_id,
      },
      include: {
        cours_recurrent: true,
      },
    });

    console.log(`✅ [CoursService] Cours créé: ${cours.id}`);

    return cours as CoursData;
  } catch (error: any) {
    console.error("❌ [CoursService] Erreur création cours:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "creerCours",
      },
      extra: { data },
    });

    throw new Error(`Erreur lors de la création du cours: ${error.message}`);
  }
}

/**
 * Modifier un cours
 */
export async function modifierCours(
  coursId: number,
  data: any,
): Promise<CoursData | null> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Modification cours ${coursId}`,
      "service.cours",
      "info",
      { coursId, data },
    );

    console.log(`✏️ [CoursService] Modification cours ${coursId}`);

    const cours = await prisma.cours.update({
      where: { id: coursId },
      data: {
        date_cours: data.date_cours,
        type_cours: data.type_cours,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin,
      },
      include: {
        cours_recurrent: true,
      },
    });

    console.log(`✅ [CoursService] Cours ${coursId} modifié`);

    return cours as CoursData;
  } catch (error: any) {
    console.error(
      `❌ [CoursService] Erreur modification cours ${coursId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "modifierCours",
      },
      extra: { coursId, data },
    });

    if (error.code === "P2025") {
      return null;
    }

    throw new Error(
      `Erreur lors de la modification du cours: ${error.message}`,
    );
  }
}

/**
 * Supprimer un cours
 */
export async function supprimerCours(coursId: number): Promise<boolean> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Suppression cours ${coursId}`,
      "service.cours",
      "warning",
      { coursId },
    );

    console.log(`🗑️ [CoursService] Suppression cours ${coursId}`);

    await prisma.cours.delete({
      where: { id: coursId },
    });

    console.log(`✅ [CoursService] Cours ${coursId} supprimé`);

    return true;
  } catch (error: any) {
    console.error(
      `❌ [CoursService] Erreur suppression cours ${coursId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "supprimerCours",
      },
      extra: { coursId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(`Erreur lors de la suppression du cours: ${error.message}`);
  }
}

/**
 * Récupère les cours récurrents
 */
export async function obtenirCoursRecurrents(): Promise<CoursRecurrentData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération cours récurrents",
      "service.cours",
      "info",
    );

    console.log(`📚 [CoursService] Récupération cours récurrents`);

    const coursRecurrents = await prisma.cours_recurrent.findMany({
      orderBy: {
        type_cours: "asc",
      },
    });

    console.log(`✅ [CoursService] ${coursRecurrents.length} cours récurrents`);

    return coursRecurrents as CoursRecurrentData[];
  } catch (error: any) {
    console.error(
      `❌ [CoursService] Erreur récupération cours récurrents:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirCoursRecurrents",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des cours récurrents: ${error.message}`,
    );
  }
}

/**
 * Récupère les inscriptions à un cours
 */
export async function obtenirInscriptions(coursId: number): Promise<any[]> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    addSentryBreadcrumb(
      `Récupération inscriptions cours ${coursId}`,
      "service.cours",
      "info",
      { coursId },
    );

    console.log(`👥 [CoursService] Récupération inscriptions cours ${coursId}`);

    const inscriptions = await prisma.inscriptions.findMany({
      where: {
        cours_id: coursId,
      },
      include: {
        utilisateurs: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `✅ [CoursService] ${inscriptions.length} inscriptions pour cours ${coursId}`,
    );

    return inscriptions;
  } catch (error: any) {
    console.error(`❌ [CoursService] Erreur récupération inscriptions:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirInscriptions",
      },
      extra: { coursId },
    });

    throw new Error(
      `Erreur lors de la récupération des inscriptions: ${error.message}`,
    );
  }
}

/**
 * Inscrire un utilisateur à un cours
 */
export async function inscrireUtilisateur(
  coursId: number,
  utilisateurId: number,
): Promise<any> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Inscription utilisateur ${utilisateurId} au cours ${coursId}`,
      "service.cours",
      "info",
      { coursId, utilisateurId },
    );

    console.log(
      `➕ [CoursService] Inscription utilisateur ${utilisateurId} au cours ${coursId}`,
    );

    const inscription = await prisma.inscriptions.create({
      data: {
        cours_id: coursId,
        utilisateur_id: utilisateurId,
        date_inscription: new Date(),
        statut: "confirmee",
      },
    });

    console.log(`✅ [CoursService] Inscription créée: ${inscription.id}`);

    return inscription;
  } catch (error: any) {
    console.error("❌ [CoursService] Erreur inscription utilisateur:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "inscrireUtilisateur",
      },
      extra: { coursId, utilisateurId },
    });

    throw new Error(
      `Erreur lors de l'inscription de l'utilisateur: ${error.message}`,
    );
  }
}

/**
 * Désinscrire un utilisateur d'un cours
 */
export async function desinscrireUtilisateur(
  coursId: number,
  utilisateurId: number,
): Promise<boolean> {
  try {
    if (!coursId || isNaN(coursId) || coursId <= 0) {
      throw new Error("ID cours invalide");
    }

    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Désinscription utilisateur ${utilisateurId} du cours ${coursId}`,
      "service.cours",
      "info",
      { coursId, utilisateurId },
    );

    console.log(
      `➖ [CoursService] Désinscription utilisateur ${utilisateurId} du cours ${coursId}`,
    );

    await prisma.inscriptions.deleteMany({
      where: {
        cours_id: coursId,
        utilisateur_id: utilisateurId,
      },
    });

    console.log(`✅ [CoursService] Utilisateur désinscrit`);

    return true;
  } catch (error: any) {
    console.error(
      "❌ [CoursService] Erreur désinscription utilisateur:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "desinscrireUtilisateur",
      },
      extra: { coursId, utilisateurId },
    });

    return false;
  }
}

/**
 * Récupère les cours par date
 */
export async function obtenirCoursParDate(
  dateDebut: Date,
  dateFin: Date,
): Promise<CoursData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération cours par date",
      "service.cours",
      "info",
      {
        dateDebut,
        dateFin,
      },
    );

    console.log(
      `📅 [CoursService] Récupération cours entre ${dateDebut} et ${dateFin}`,
    );

    const cours = await prisma.cours.findMany({
      where: {
        date_cours: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      include: {
        cours_recurrent: true,
      },
      orderBy: {
        date_cours: "asc",
      },
    });

    console.log(`✅ [CoursService] ${cours.length} cours trouvés`);

    return cours as CoursData[];
  } catch (error: any) {
    console.error(
      "❌ [CoursService] Erreur récupération cours par date:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "cours",
        operation: "obtenirCoursParDate",
      },
      extra: { dateDebut, dateFin },
    });

    throw new Error(
      `Erreur lors de la récupération des cours par date: ${error.message}`,
    );
  }
}

/**
 * Classe CoursService
 */
export class CoursService {
  async obtenirTousCours() {
    return obtenirTousCours();
  }

  async obtenirCoursParId(coursId: number) {
    return obtenirCoursParId(coursId);
  }

  async obtenirCoursParRecurrent(coursRecurrentId: number) {
    return obtenirCoursParRecurrent(coursRecurrentId);
  }

  async creerCours(data: any) {
    return creerCours(data);
  }

  async modifierCours(coursId: number, data: any) {
    return modifierCours(coursId, data);
  }

  async supprimerCours(coursId: number) {
    return supprimerCours(coursId);
  }

  async obtenirCoursRecurrents() {
    return obtenirCoursRecurrents();
  }

  async obtenirInscriptions(coursId: number) {
    return obtenirInscriptions(coursId);
  }

  async inscrireUtilisateur(coursId: number, utilisateurId: number) {
    return inscrireUtilisateur(coursId, utilisateurId);
  }

  async desinscrireUtilisateur(coursId: number, utilisateurId: number) {
    return desinscrireUtilisateur(coursId, utilisateurId);
  }

  async obtenirCoursParDate(dateDebut: Date, dateFin: Date) {
    return obtenirCoursParDate(dateDebut, dateFin);
  }
}

// Instance singleton
export const coursService = new CoursService();
