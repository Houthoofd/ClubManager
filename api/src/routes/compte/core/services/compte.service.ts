/**
 * Service Compte - Logique métier
 * Gère les opérations sur les comptes utilisateurs
 *
 * @module compte.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";
import bcrypt from "bcrypt";

/**
 * Interface pour les données de compte
 */
export interface CompteData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  genre_id?: number | null;
  grade_id?: number | null;
  status_id: number;
  abonnement_id?: number | null;
  telephone?: string | null;
  date_naissance?: Date | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * Interface pour la mise à jour de compte
 */
export interface CompteUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  genre_id?: number;
  grade_id?: number;
  status_id?: number;
  abonnement_id?: number;
  telephone?: string;
  date_naissance?: Date;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
}

/**
 * Interface pour la mise à jour du mot de passe
 */
export interface PasswordUpdateInput {
  utilisateur_id: number;
  new_password: string;
  is_creation: boolean;
}

/**
 * Récupère un compte par son ID
 */
export async function obtenirCompteParId(
  utilisateurId: number,
): Promise<CompteData | null> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Récupération compte ${utilisateurId}`,
      "service.compte",
      "info",
      { utilisateurId },
    );

    console.log(`👤 [CompteService] Récupération compte ${utilisateurId}`);

    const compte = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        nom_utilisateur: true,
        genre_id: true,
        grade_id: true,
        status_id: true,
        abonnement_id: true,
        date_of_birth: true,
        date_inscription: true,
        active: true,
      },
    });

    if (!compte) {
      console.log(`❌ [CompteService] Compte ${utilisateurId} non trouvé`);
      return null;
    }

    console.log(`✅ [CompteService] Compte ${utilisateurId} trouvé`);

    return compte as any as CompteData;
  } catch (error: any) {
    console.error(
      `❌ [CompteService] Erreur récupération compte ${utilisateurId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirCompteParId",
      },
      extra: { utilisateurId },
    });

    throw new Error(
      `Erreur lors de la récupération du compte: ${error.message}`,
    );
  }
}

/**
 * Récupère un compte par nom et prénom
 */
export async function obtenirCompteParNomPrenom(
  prenom: string,
  nom: string,
): Promise<CompteData[]> {
  try {
    if (!prenom || !nom) {
      throw new Error("Prénom et nom requis");
    }

    addSentryBreadcrumb(
      `Récupération compte par nom: ${prenom} ${nom}`,
      "service.compte",
      "info",
      { prenom, nom },
    );

    console.log(`🔍 [CompteService] Recherche compte: ${prenom} ${nom}`);

    const comptes = await prisma.utilisateurs.findMany({
      where: {
        first_name: {
          contains: prenom,
        },
        last_name: {
          contains: nom,
        },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        nom_utilisateur: true,
        genre_id: true,
        grade_id: true,
        status_id: true,
        abonnement_id: true,
        date_of_birth: true,
        date_inscription: true,
        active: true,
      },
    });

    console.log(`✅ [CompteService] ${comptes.length} comptes trouvés`);

    return comptes as any as CompteData[];
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur recherche compte:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirCompteParNomPrenom",
      },
      extra: { prenom, nom },
    });

    throw new Error(`Erreur lors de la recherche du compte: ${error.message}`);
  }
}

/**
 * Récupère les informations complètes d'un compte par nom et prénom
 */
export async function obtenirInformationsCompte(
  prenom: string,
  nom: string,
): Promise<CompteData | null> {
  try {
    if (!prenom || !nom) {
      throw new Error("Prénom et nom requis");
    }

    addSentryBreadcrumb(
      `Récupération informations compte: ${prenom} ${nom}`,
      "service.compte",
      "info",
      { prenom, nom },
    );

    console.log(`📋 [CompteService] Informations compte: ${prenom} ${nom}`);

    const compte = await prisma.utilisateurs.findFirst({
      where: {
        first_name: prenom,
        last_name: nom,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        nom_utilisateur: true,
        genre_id: true,
        grade_id: true,
        status_id: true,
        abonnement_id: true,
        date_of_birth: true,
        date_inscription: true,
        active: true,
      },
    });

    if (!compte) {
      console.log(`❌ [CompteService] Compte non trouvé`);
      return null;
    }

    console.log(`✅ [CompteService] Compte créé: ${compte.id}`);

    return compte as any as CompteData;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur informations compte:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirInformationsCompte",
      },
      extra: { prenom, nom },
    });

    throw new Error(
      `Erreur lors de la récupération des informations: ${error.message}`,
    );
  }
}

/**
 * Obtenir l'ID d'un genre par son nom
 */
export async function obtenirIdGenre(
  genreName: string,
): Promise<number | null> {
  try {
    addSentryBreadcrumb(
      `Récupération ID genre: ${genreName}`,
      "service.compte",
      "info",
      { genreName },
    );

    console.log(`🔍 [CompteService] Recherche ID genre: ${genreName}`);

    const genre = await prisma.genres.findFirst({
      where: {
        genre_name: {
          equals: genreName,
        },
      },
      select: {
        id: true,
      },
    });

    if (!genre) {
      console.log(`❌ [CompteService] Genre non trouvé: ${genreName}`);
      return null;
    }

    console.log(`✅ [CompteService] Genre trouvé: ${genre.id}`);

    return genre.id;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur recherche genre:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirIdGenre",
      },
      extra: { genreName },
    });

    throw new Error(`Erreur lors de la recherche du genre: ${error.message}`);
  }
}

/**
 * Obtenir l'ID d'un grade par son nom
 */
export async function obtenirIdGrade(
  gradeName: string,
): Promise<number | null> {
  try {
    addSentryBreadcrumb(
      `Récupération ID grade: ${gradeName}`,
      "service.compte",
      "info",
      { gradeName },
    );

    console.log(`🔍 [CompteService] Recherche ID grade: ${gradeName}`);

    const grade = await prisma.grades.findFirst({
      where: {
        grade_id: {
          equals: gradeName,
        },
      },
      select: {
        id: true,
      },
    });

    if (!grade) {
      console.log(`❌ [CompteService] Grade non trouvé: ${gradeName}`);
      return null;
    }

    console.log(`✅ [CompteService] Grade trouvé: ${grade.id}`);

    return grade.id;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur recherche grade:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirIdGrade",
      },
      extra: { gradeName },
    });

    throw new Error(`Erreur lors de la recherche du grade: ${error.message}`);
  }
}

/**
 * Obtenir l'ID d'un statut par son nom
 */
export async function obtenirIdStatus(
  statusName: string,
): Promise<number | null> {
  try {
    addSentryBreadcrumb(
      `Récupération ID status: ${statusName}`,
      "service.compte",
      "info",
      { statusName },
    );

    console.log(`🔍 [CompteService] Recherche ID status: ${statusName}`);

    const status = await prisma.status.findFirst({
      where: {
        nom_role: {
          equals: statusName,
        },
      },
      select: {
        id: true,
      },
    });

    if (!status) {
      console.log(`❌ [CompteService] Status non trouvé: ${statusName}`);
      return null;
    }

    console.log(`✅ [CompteService] Status trouvé: ${status.id}`);

    return status.id;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur recherche status:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirIdStatus",
      },
      extra: { statusName },
    });

    throw new Error(`Erreur lors de la recherche du status: ${error.message}`);
  }
}

/**
 * Obtenir l'ID d'un abonnement par son nom
 */
export async function obtenirIdAbonnement(
  abonnementName: string,
): Promise<number | null> {
  try {
    addSentryBreadcrumb(
      `Récupération ID abonnement: ${abonnementName}`,
      "service.compte",
      "info",
      { abonnementName },
    );

    console.log(
      `🔍 [CompteService] Recherche ID abonnement: ${abonnementName}`,
    );

    // Note: Le modèle abonnements n'existe pas dans le schéma actuel
    // Retourner null pour l'instant
    const abonnement = null;

    // abonnement est null car le modèle n'existe pas
    console.log(
      `⚠️ [CompteService] Modèle abonnements non disponible: ${abonnementName}`,
    );
    return null;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur recherche abonnement:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "obtenirIdAbonnement",
      },
      extra: { abonnementName },
    });

    throw new Error(
      `Erreur lors de la recherche de l'abonnement: ${error.message}`,
    );
  }
}

/**
 * Convertir des noms en IDs
 */
export async function convertirNomsEnIds(args: any): Promise<any> {
  try {
    addSentryBreadcrumb("Conversion noms en IDs", "service.compte", "info", {
      args,
    });

    console.log("🔄 [CompteService] Conversion noms en IDs", args);

    const result: any = {};

    if (args.genreName) {
      result.genre_id = await obtenirIdGenre(args.genreName);
    }

    if (args.gradeName) {
      result.grade_id = await obtenirIdGrade(args.gradeName);
    }

    if (args.statusName) {
      result.status_id = await obtenirIdStatus(args.statusName);
    }

    if (args.abonnementName) {
      result.abonnement_id = await obtenirIdAbonnement(args.abonnementName);
    }

    console.log("✅ [CompteService] Conversion terminée", result);

    return result;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur conversion:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "convertirNomsEnIds",
      },
      extra: { args },
    });

    throw new Error(`Erreur lors de la conversion: ${error.message}`);
  }
}

/**
 * Modifier un compte
 */
export async function modifierCompte(
  utilisateurId: number,
  data: CompteUpdateInput,
): Promise<CompteData | null> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Modification compte ${utilisateurId}`,
      "service.compte",
      "info",
      { utilisateurId, data },
    );

    console.log(`✏️ [CompteService] Modification compte ${utilisateurId}`);

    const compte = await prisma.utilisateurs.update({
      where: { id: utilisateurId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        genre_id: data.genre_id,
        grade_id: data.grade_id,
        status_id: data.status_id,
        abonnement_id: data.abonnement_id,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        nom_utilisateur: true,
        genre_id: true,
        grade_id: true,
        status_id: true,
        abonnement_id: true,
        date_of_birth: true,
        date_inscription: true,
        active: true,
      },
    });

    console.log(`✅ [CompteService] Compte ${utilisateurId} modifié`);

    return compte as any as CompteData;
  } catch (error: any) {
    console.error(
      `❌ [CompteService] Erreur modification compte ${utilisateurId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "modifierCompte",
      },
      extra: { utilisateurId, data },
    });

    if (error.code === "P2025") {
      return null;
    }

    throw new Error(
      `Erreur lors de la modification du compte: ${error.message}`,
    );
  }
}

/**
 * Mettre à jour le mot de passe
 */
export async function mettreAJourMotDePasse(
  input: PasswordUpdateInput,
): Promise<boolean> {
  try {
    if (
      !input.utilisateur_id ||
      isNaN(input.utilisateur_id) ||
      input.utilisateur_id <= 0
    ) {
      throw new Error("ID utilisateur invalide");
    }

    if (!input.new_password || input.new_password.length < 8) {
      throw new Error("Mot de passe invalide (minimum 8 caractères)");
    }

    addSentryBreadcrumb(
      `Mise à jour mot de passe utilisateur ${input.utilisateur_id}`,
      "service.compte",
      "warning",
      { utilisateur_id: input.utilisateur_id, is_creation: input.is_creation },
    );

    console.log(
      `🔐 [CompteService] Mise à jour mot de passe utilisateur ${input.utilisateur_id}`,
    );

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(input.new_password, 10);

    // Mettre à jour le mot de passe
    await prisma.utilisateurs.update({
      where: { id: input.utilisateur_id },
      data: {
        password: hashedPassword,
      },
    });

    console.log(
      `✅ [CompteService] Mot de passe mis à jour pour utilisateur ${input.utilisateur_id}`,
    );

    return true;
  } catch (error: any) {
    console.error(`❌ [CompteService] Erreur mise à jour mot de passe:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "mettreAJourMotDePasse",
      },
      extra: { utilisateur_id: input.utilisateur_id },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la mise à jour du mot de passe: ${error.message}`,
    );
  }
}

/**
 * Supprimer un compte
 */
export async function supprimerCompte(utilisateurId: number): Promise<boolean> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Suppression compte ${utilisateurId}`,
      "service.compte",
      "error",
      { utilisateurId },
    );

    console.log(`🗑️ [CompteService] Suppression compte ${utilisateurId}`);

    await prisma.utilisateurs.delete({
      where: { id: utilisateurId },
    });

    console.log(`✅ [CompteService] Compte ${utilisateurId} supprimé`);

    return true;
  } catch (error: any) {
    console.error(
      `❌ [CompteService] Erreur suppression compte ${utilisateurId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "compte",
        operation: "supprimerCompte",
      },
      extra: { utilisateurId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la suppression du compte: ${error.message}`,
    );
  }
}

/**
 * Classe CompteService
 */
export class CompteService {
  async obtenirCompteParId(utilisateurId: number) {
    return obtenirCompteParId(utilisateurId);
  }

  async obtenirCompteParNomPrenom(prenom: string, nom: string) {
    return obtenirCompteParNomPrenom(prenom, nom);
  }

  async obtenirInformationsCompte(prenom: string, nom: string) {
    return obtenirInformationsCompte(prenom, nom);
  }

  async obtenirIdGenre(genreName: string) {
    return obtenirIdGenre(genreName);
  }

  async obtenirIdGrade(gradeName: string) {
    return obtenirIdGrade(gradeName);
  }

  async obtenirIdStatus(statusName: string) {
    return obtenirIdStatus(statusName);
  }

  async obtenirIdAbonnement(abonnementName: string) {
    return obtenirIdAbonnement(abonnementName);
  }

  async convertirNomsEnIds(args: any) {
    return convertirNomsEnIds(args);
  }

  async modifierCompte(utilisateurId: number, data: CompteUpdateInput) {
    return modifierCompte(utilisateurId, data);
  }

  async mettreAJourMotDePasse(input: PasswordUpdateInput) {
    return mettreAJourMotDePasse(input);
  }

  async supprimerCompte(utilisateurId: number) {
    return supprimerCompte(utilisateurId);
  }
}

// Instance singleton
export const compteService = new CompteService();
