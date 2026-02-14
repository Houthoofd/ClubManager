/**
 * Service Professeurs - Logique métier
 * Gère les opérations sur les professeurs
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module professeurs.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Interface pour un professeur
 */
export interface Professeur {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  email: string;
  nom_utilisateur: string;
  status_id?: number;
  status?: string;
  date_inscription: Date;
  telephone?: string;
  genre_id?: number;
  date_of_birth: Date;
  grade_id?: number;
  grade?: string;
  active: boolean;
}

/**
 * Interface pour un cours dans le planning
 */
export interface CoursProfesseur {
  id: number;
  nom_cours: string;
  description?: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string;
  niveau?: string;
  capacite_max?: number;
  professeur_id: number;
  nombre_inscrits?: number;
}

/**
 * Interface pour le résultat d'une opération
 */
export interface OperationResult {
  isConfirm?: boolean;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Interface pour le planning d'un professeur
 */
export interface PlanningResult {
  isFind: boolean;
  message: string;
  data: CoursProfesseur[];
}

/**
 * ID du statut "Professeur" dans la base de données
 */
const PROFESSEUR_STATUS_ID = 2;

/**
 * Récupérer tous les professeurs
 */
export async function obtenirTousLesProfesseurs(): Promise<Professeur[]> {
  try {
    addSentryBreadcrumb(
      "Récupération de tous les professeurs",
      "service.professeurs",
      "info",
    );

    console.log(`🔍 [ProfesseursService] Récupération de tous les professeurs`);

    const professeurs = await prisma.utilisateurs.findMany({
      where: {
        status_id: PROFESSEUR_STATUS_ID,
        active: true,
      },
      include: {
        status: true,
        grades: true,
        genres: true,
      },
      orderBy: {
        last_name: "asc",
      },
    });

    console.log(
      `✅ [ProfesseursService] ${professeurs.length} professeurs trouvés`,
    );

    return professeurs.map((prof) => ({
      id: prof.id,
      userId: prof.userId,
      first_name: prof.first_name,
      last_name: prof.last_name,
      email: prof.email,
      nom_utilisateur: prof.nom_utilisateur,
      status_id: prof.status_id || undefined,
      status: prof.status?.nom_role,
      date_inscription: prof.date_inscription,
      genre_id: prof.genre_id || undefined,
      date_of_birth: prof.date_of_birth,
      grade_id: prof.grade_id || undefined,
      grade: prof.grades?.grade_id || undefined,
      active: prof.active,
    }));
  } catch (error: any) {
    console.error(
      `❌ [ProfesseursService] Erreur récupération professeurs:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "obtenirTousLesProfesseurs",
      },
    });

    throw new Error(
      `Impossible de récupérer la liste des professeurs: ${error.message}`,
    );
  }
}

/**
 * Récupérer un professeur par son ID
 */
export async function obtenirProfesseurParId(
  professeurId: number,
): Promise<Professeur | null> {
  try {
    addSentryBreadcrumb(
      `Récupération professeur ID: ${professeurId}`,
      "service.professeurs",
      "info",
      { professeurId },
    );

    console.log(
      `🔍 [ProfesseursService] Récupération professeur ID: ${professeurId}`,
    );

    const professeur = await prisma.utilisateurs.findUnique({
      where: {
        id: professeurId,
      },
      include: {
        status: true,
        grades: true,
        genres: true,
      },
    });

    if (!professeur) {
      console.log(
        `⚠️ [ProfesseursService] Professeur ${professeurId} non trouvé`,
      );
      return null;
    }

    // Vérifier si c'est bien un professeur
    if (professeur.status_id !== PROFESSEUR_STATUS_ID) {
      console.log(
        `⚠️ [ProfesseursService] Utilisateur ${professeurId} n'est pas professeur`,
      );
      return null;
    }

    console.log(`✅ [ProfesseursService] Professeur ${professeurId} trouvé`);

    return {
      id: professeur.id,
      userId: professeur.userId,
      first_name: professeur.first_name,
      last_name: professeur.last_name,
      email: professeur.email,
      nom_utilisateur: professeur.nom_utilisateur,
      status_id: professeur.status_id || undefined,
      status: professeur.status?.nom_role,
      date_inscription: professeur.date_inscription,
      genre_id: professeur.genre_id || undefined,
      date_of_birth: professeur.date_of_birth,
      grade_id: professeur.grade_id || undefined,
      grade: professeur.grades?.grade_id || undefined,
      active: professeur.active,
    };
  } catch (error: any) {
    console.error(
      `❌ [ProfesseursService] Erreur récupération professeur:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "obtenirProfesseurParId",
      },
      extra: { professeurId },
    });

    throw new Error(
      `Impossible de récupérer le professeur ${professeurId}: ${error.message}`,
    );
  }
}

/**
 * Ajouter/promouvoir un ou plusieurs utilisateurs comme professeurs
 */
export async function ajouterProfesseur(data: {
  utilisateurs: number[] | string[];
}): Promise<OperationResult> {
  try {
    const userIds = extraireIdsUtilisateurs(data);

    addSentryBreadcrumb(
      `Promotion de ${userIds.length} professeur(s)`,
      "service.professeurs",
      "info",
      { userIds },
    );

    console.log(
      `📝 [ProfesseursService] Promotion de ${userIds.length} professeur(s):`,
      userIds,
    );

    if (userIds.length === 0) {
      console.log("❌ [ProfesseursService] Aucun ID utilisateur valide fourni");
      return {
        success: false,
        message: "Aucun ID utilisateur valide fourni",
      };
    }

    // Vérifier que les utilisateurs existent
    const utilisateurs = await prisma.utilisateurs.findMany({
      where: {
        id: { in: userIds },
        active: true,
      },
    });

    if (utilisateurs.length === 0) {
      console.log("❌ [ProfesseursService] Aucun utilisateur trouvé");
      return {
        success: false,
        message: "Aucun utilisateur trouvé avec ces IDs",
      };
    }

    // Filtrer les utilisateurs qui ne sont pas déjà professeurs
    const utilisateursAPromouvoir = utilisateurs.filter(
      (u) => u.status_id !== PROFESSEUR_STATUS_ID,
    );

    if (utilisateursAPromouvoir.length === 0) {
      console.log(
        "⚠️ [ProfesseursService] Tous les utilisateurs sont déjà professeurs",
      );
      return {
        success: false,
        message: "Tous les utilisateurs sélectionnés sont déjà professeurs",
      };
    }

    // Promouvoir les utilisateurs
    const result = await prisma.utilisateurs.updateMany({
      where: {
        id: { in: utilisateursAPromouvoir.map((u) => u.id) },
      },
      data: {
        status_id: PROFESSEUR_STATUS_ID,
      },
    });

    console.log(
      `✅ [ProfesseursService] ${result.count} professeur(s) promu(s)`,
    );

    addSentryBreadcrumb(
      `${result.count} professeur(s) promu(s)`,
      "service.professeurs",
      "info",
      { count: result.count },
    );

    return {
      isConfirm: true,
      success: true,
      message: `${result.count} utilisateur(s) promu(s) au rang de professeur`,
      data: {
        count: result.count,
        promoted: utilisateursAPromouvoir.map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`,
        })),
      },
    };
  } catch (error: any) {
    console.error(
      `❌ [ProfesseursService] Erreur promotion professeur:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "ajouterProfesseur",
      },
      extra: { data },
    });

    throw new Error(
      `Impossible de promouvoir le(s) professeur(s): ${error.message}`,
    );
  }
}

/**
 * Modifier le statut d'un professeur
 */
export async function modifierStatutProfesseur(
  professeurId: number,
  statusId: number,
): Promise<OperationResult> {
  try {
    addSentryBreadcrumb(
      `Modification statut professeur ${professeurId} -> ${statusId}`,
      "service.professeurs",
      "info",
      { professeurId, statusId },
    );

    console.log(
      `📝 [ProfesseursService] Modification statut professeur ${professeurId} -> ${statusId}`,
    );

    // Vérifier que le professeur existe
    const professeur = await prisma.utilisateurs.findUnique({
      where: { id: professeurId },
    });

    if (!professeur) {
      console.log(
        `❌ [ProfesseursService] Professeur ${professeurId} non trouvé`,
      );
      return {
        success: false,
        message: `Professeur ${professeurId} non trouvé`,
      };
    }

    // Vérifier que le nouveau statut existe
    const status = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      console.log(`❌ [ProfesseursService] Statut ${statusId} invalide`);
      return {
        success: false,
        message: `Statut ${statusId} invalide`,
      };
    }

    // Mettre à jour le statut
    const updated = await prisma.utilisateurs.update({
      where: { id: professeurId },
      data: { status_id: statusId },
      include: {
        status: true,
      },
    });

    console.log(
      `✅ [ProfesseursService] Statut modifié: ${professeur.status_id} -> ${statusId}`,
    );

    addSentryBreadcrumb(
      "Statut professeur modifié",
      "service.professeurs",
      "info",
      { professeurId, oldStatus: professeur.status_id, newStatus: statusId },
    );

    return {
      isConfirm: true,
      success: true,
      message: `Statut du professeur modifié en ${status.nom}`,
      data: {
        id: updated.id,
        name: `${updated.first_name} ${updated.last_name}`,
        oldStatus: professeur.status_id,
        newStatus: statusId,
        statusName: updated.status?.nom_role,
      },
    };
  } catch (error: any) {
    console.error(`❌ [ProfesseursService] Erreur modification statut:`, error);

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "modifierStatutProfesseur",
      },
      extra: { professeurId, statusId },
    });

    throw new Error(
      `Impossible de modifier le statut du professeur ${professeurId}: ${error.message}`,
    );
  }
}

/**
 * Obtenir le planning d'un professeur
 */
export async function obtenirPlanningProfesseur(
  professeurId: number,
): Promise<PlanningResult> {
  try {
    addSentryBreadcrumb(
      `Récupération planning professeur ${professeurId}`,
      "service.professeurs",
      "info",
      { professeurId },
    );

    console.log(
      `🔍 [ProfesseursService] Récupération planning professeur ${professeurId}`,
    );

    // Récupérer les cours du professeur via cours_recurrent
    const coursRecurrents = await prisma.cours_recurrent.findMany({
      where: {
        cours_recurrent_professeur: {
          some: {
            professeur_id: professeurId,
          },
        },
      },
      include: {
        cours: {
          include: {
            inscriptions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: [{ heure_debut: "asc" }],
    });

    if (coursRecurrents.length === 0) {
      console.log(
        `⚠️ [ProfesseursService] Aucun cours pour le professeur ${professeurId}`,
      );
      return {
        isFind: false,
        message: "Aucun cours trouvé pour ce professeur",
        data: [],
      };
    }

    console.log(
      `✅ [ProfesseursService] ${coursRecurrents.length} cours trouvés pour le professeur ${professeurId}`,
    );

    // Mapper les cours récurrents en planning
    const planning: CoursProfesseur[] = [];
    for (const cr of coursRecurrents) {
      for (const c of cr.cours) {
        planning.push({
          id: c.id,
          nom_cours: c.type_cours,
          description: undefined,
          jour_semaine: cr.jour_semaine.toString(),
          heure_debut: c.heure_debut,
          heure_fin: c.heure_fin,
          salle: undefined,
          niveau: undefined,
          capacite_max: undefined,
          professeur_id: professeurId,
          nombre_inscrits: c.inscriptions.length,
        });
      }
    }

    return {
      isFind: true,
      message: `${planning.length} cours trouvé(s)`,
      data: planning,
    };
  } catch (error: any) {
    console.error(
      `❌ [ProfesseursService] Erreur récupération planning:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "obtenirPlanningProfesseur",
      },
      extra: { professeurId },
    });

    throw new Error(
      `Impossible de récupérer le planning du professeur ${professeurId}: ${error.message}`,
    );
  }
}

/**
 * Extraire les IDs des utilisateurs depuis différents formats de données
 */
export function extraireIdsUtilisateurs(data: any): number[] {
  console.log(
    "🔍 [ProfesseursService] Extraction des IDs depuis:",
    JSON.stringify(data, null, 2),
  );

  let userIds: number[] = [];

  // Cas 1: data.utilisateurs est un tableau
  if (data.utilisateurs && Array.isArray(data.utilisateurs)) {
    console.log(
      "🔍 [ProfesseursService] Cas 1: data.utilisateurs est un tableau",
    );

    // Vérifier si c'est un tableau de strings/numbers (IDs directs)
    if (
      data.utilisateurs.every(
        (item: any) => typeof item === "string" || typeof item === "number",
      )
    ) {
      console.log(
        "🔍 [ProfesseursService] Cas 1a: Tableau d'IDs directs (strings/numbers)",
      );
      userIds = data.utilisateurs
        .map((id: any) => {
          console.log(
            "🔍 [ProfesseursService] ID direct:",
            id,
            "converti en:",
            parseInt(id),
          );
          return parseInt(id);
        })
        .filter((id: number) => !isNaN(id));
    }
    // Sinon c'est un tableau d'objets
    else {
      console.log("🔍 [ProfesseursService] Cas 1b: Tableau d'objets");
      userIds = data.utilisateurs
        .map((user: any) => {
          const id = user.id || user.userId || user.user_id;
          console.log("🔍 [ProfesseursService] User:", user, "ID extrait:", id);
          return parseInt(id);
        })
        .filter((id: number) => !isNaN(id));
    }
  }
  // Cas 2: data est directement un tableau
  else if (Array.isArray(data)) {
    console.log(
      "🔍 [ProfesseursService] Cas 2: data est directement un tableau",
    );
    userIds = data
      .map((item: any) => {
        const id =
          typeof item === "object"
            ? item.id || item.userId || item.user_id
            : item;
        return parseInt(id);
      })
      .filter((id: number) => !isNaN(id));
  }
  // Cas 3: data contient un seul utilisateur
  else if (data.id || data.userId || data.user_id) {
    console.log(
      "🔍 [ProfesseursService] Cas 3: data contient un seul utilisateur",
    );
    const id = data.id || data.userId || data.user_id;
    userIds = [parseInt(id)].filter((id: number) => !isNaN(id));
  }
  // Cas 4: autres propriétés possibles
  else if (data.users && Array.isArray(data.users)) {
    console.log("🔍 [ProfesseursService] Cas 4: data.users existe");
    userIds = data.users
      .map((user: any) => {
        const id = user.id || user.userId || user.user_id || user;
        return parseInt(id);
      })
      .filter((id: number) => !isNaN(id));
  }

  console.log("🔍 [ProfesseursService] IDs extraits:", userIds);
  return userIds;
}

/**
 * Valider qu'un utilisateur existe et peut devenir professeur
 */
export async function validerUtilisateurPourPromotion(
  userId: number,
): Promise<{ valide: boolean; message?: string; utilisateur?: Professeur }> {
  try {
    addSentryBreadcrumb(
      `Validation utilisateur ${userId} pour promotion`,
      "service.professeurs",
      "info",
      { userId },
    );

    console.log(
      `🔍 [ProfesseursService] Validation utilisateur ${userId} pour promotion`,
    );

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      include: {
        status: true,
        grades: true,
      },
    });

    if (!utilisateur) {
      console.log(`❌ [ProfesseursService] Utilisateur ${userId} n'existe pas`);
      return {
        valide: false,
        message: `L'utilisateur avec l'ID ${userId} n'existe pas`,
      };
    }

    if (!utilisateur.active) {
      console.log(`❌ [ProfesseursService] Utilisateur ${userId} est inactif`);
      return {
        valide: false,
        message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} est inactif`,
      };
    }

    // Vérifier si l'utilisateur n'est pas déjà professeur
    if (utilisateur.status_id === PROFESSEUR_STATUS_ID) {
      console.log(
        `⚠️ [ProfesseursService] Utilisateur ${userId} est déjà professeur`,
      );
      return {
        valide: false,
        message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} est déjà professeur`,
        utilisateur: {
          id: utilisateur.id,
          userId: utilisateur.userId,
          first_name: utilisateur.first_name,
          last_name: utilisateur.last_name,
          email: utilisateur.email,
          nom_utilisateur: utilisateur.nom_utilisateur,
          status_id: utilisateur.status_id || undefined,
          status: utilisateur.status?.nom_role,
          date_inscription: utilisateur.date_inscription,
          genre_id: utilisateur.genre_id || undefined,
          date_of_birth: utilisateur.date_of_birth,
          grade_id: utilisateur.grade_id || undefined,
          grade: utilisateur.grades?.grade_id,
          active: utilisateur.active,
        },
      };
    }

    console.log(
      `✅ [ProfesseursService] Utilisateur ${userId} peut être promu`,
    );

    return {
      valide: true,
      utilisateur: {
        id: utilisateur.id,
        userId: utilisateur.userId,
        first_name: utilisateur.first_name,
        last_name: utilisateur.last_name,
        email: utilisateur.email,
        nom_utilisateur: utilisateur.nom_utilisateur,
        status_id: utilisateur.status_id || undefined,
        status: utilisateur.status?.nom_role,
        date_inscription: utilisateur.date_inscription,
        genre_id: utilisateur.genre_id || undefined,
        date_of_birth: utilisateur.date_of_birth,
        grade_id: utilisateur.grade_id || undefined,
        grade: utilisateur.grades?.grade_id,
        active: utilisateur.active,
      },
    };
  } catch (error: any) {
    console.error(
      `❌ [ProfesseursService] Erreur validation utilisateur ${userId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "professeurs",
        operation: "validerUtilisateurPourPromotion",
      },
      extra: { userId },
    });

    return {
      valide: false,
      message: `Erreur lors de la validation de l'utilisateur ${userId}: ${error.message}`,
    };
  }
}
