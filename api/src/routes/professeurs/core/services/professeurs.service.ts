import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import { VerifyResultWithData, ConfirmationResult } from "@clubmanager/types";

/**
 * Service de gestion des professeurs
 * Contient la logique métier pour les opérations sur les professeurs
 */

/**
 * Interface pour un professeur
 */
export interface Professeur {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id?: number;
  status_id?: number;
  date_creation?: string;
  telephone?: string;
  adresse?: string;
  nom_utilisateur?: string;
  genre_id?: number;
  date_of_birth?: string;
  grade_id?: number;
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
 * Récupérer tous les professeurs
 */
export async function obtenirTousLesProfesseurs(
  professeursClient?: Professeurs,
): Promise<Professeur[]> {
  const client = professeursClient || new Professeurs();

  console.log(`🔍 [Service Professeurs] Récupération de tous les professeurs`);

  try {
    const result: VerifyResultWithData = await client.obtenirLesProfesseurs();

    const professeurs = (result.data || []) as Professeur[];

    console.log(
      `✅ [Service Professeurs] ${professeurs.length} professeurs trouvés`,
    );

    return professeurs;
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur récupération professeurs:`,
      error,
    );
    throw new Error("Impossible de récupérer la liste des professeurs");
  }
}

/**
 * Récupérer un professeur par son ID
 */
export async function obtenirProfesseurParId(
  professeurId: number,
  professeursClient?: Professeurs,
): Promise<Professeur | null> {
  const client = professeursClient || new Professeurs();

  console.log(
    `🔍 [Service Professeurs] Récupération professeur ID: ${professeurId}`,
  );

  try {
    const professeur = await client.obtenirUtilisateurParId(professeurId);

    if (!professeur) {
      console.log(
        `⚠️ [Service Professeurs] Professeur ${professeurId} non trouvé`,
      );
      return null;
    }

    console.log(`✅ [Service Professeurs] Professeur ${professeurId} trouvé`);

    return professeur;
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur récupération professeur:`,
      error,
    );
    throw new Error(`Impossible de récupérer le professeur ${professeurId}`);
  }
}

/**
 * Ajouter/promouvoir un ou plusieurs utilisateurs comme professeurs
 */
export async function ajouterProfesseur(
  data: any,
  professeursClient?: Professeurs,
): Promise<OperationResult> {
  const client = professeursClient || new Professeurs();

  console.log(`📝 [Service Professeurs] Promotion de professeur(s):`, data);

  try {
    const result: ConfirmationResult = await client.ajouterUnProfesseur(data);

    console.log(`✅ [Service Professeurs] Promotion effectuée:`, result);

    return {
      isConfirm: result.isConfirm,
      success: result.isConfirm || false,
      message: result.message || "Opération effectuée",
      data: result.data,
    };
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur promotion professeur:`,
      error,
    );
    throw new Error("Impossible de promouvoir le(s) professeur(s)");
  }
}

/**
 * Modifier le statut d'un professeur
 */
export async function modifierStatutProfesseur(
  professeurId: number,
  statusId: number,
  professeursClient?: Professeurs,
): Promise<OperationResult> {
  const client = professeursClient || new Professeurs();

  console.log(
    `📝 [Service Professeurs] Modification statut professeur ${professeurId} -> ${statusId}`,
  );

  try {
    const result: ConfirmationResult = await client.modifierStatutProfesseur(
      professeurId,
      statusId,
    );

    console.log(`✅ [Service Professeurs] Statut modifié:`, result);

    return {
      isConfirm: result.isConfirm,
      success: result.isConfirm || false,
      message: result.message || "Statut modifié",
      data: result.data,
    };
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur modification statut:`,
      error,
    );
    throw new Error(
      `Impossible de modifier le statut du professeur ${professeurId}`,
    );
  }
}

/**
 * Obtenir le planning d'un professeur
 */
export async function obtenirPlanningProfesseur(
  professeurId: number,
  professeursClient?: Professeurs,
): Promise<PlanningResult> {
  const client = professeursClient || new Professeurs();

  console.log(
    `🔍 [Service Professeurs] Récupération planning professeur ${professeurId}`,
  );

  try {
    const planning = await client.obtenirPlanningCoursProfesseur(professeurId);

    console.log(
      `✅ [Service Professeurs] Planning récupéré:`,
      planning.isFind ? `${planning.data.length} cours` : "aucun cours",
    );

    return planning;
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur récupération planning:`,
      error,
    );
    throw new Error(
      `Impossible de récupérer le planning du professeur ${professeurId}`,
    );
  }
}

/**
 * Extraire les IDs des utilisateurs depuis différents formats de données
 */
export function extraireIdsUtilisateurs(data: any): number[] {
  console.log(
    "🔍 [extractUserIds] Extraction des IDs depuis:",
    JSON.stringify(data, null, 2),
  );

  let userIds: number[] = [];

  // Cas 1: data.utilisateurs est un tableau
  if (data.utilisateurs && Array.isArray(data.utilisateurs)) {
    console.log("🔍 [extractUserIds] Cas 1: data.utilisateurs est un tableau");

    // Vérifier si c'est un tableau de strings/numbers (IDs directs)
    if (
      data.utilisateurs.every(
        (item: any) => typeof item === "string" || typeof item === "number",
      )
    ) {
      console.log(
        "🔍 [extractUserIds] Cas 1a: Tableau d'IDs directs (strings/numbers)",
      );
      userIds = data.utilisateurs
        .map((id: any) => {
          console.log(
            "🔍 [extractUserIds] ID direct:",
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
      console.log("🔍 [extractUserIds] Cas 1b: Tableau d'objets");
      userIds = data.utilisateurs
        .map((user: any) => {
          const id = user.id || user.userId || user.user_id;
          console.log("🔍 [extractUserIds] User:", user, "ID extrait:", id);
          return parseInt(id);
        })
        .filter((id: number) => !isNaN(id));
    }
  }
  // Cas 2: data est directement un tableau
  else if (Array.isArray(data)) {
    console.log("🔍 [extractUserIds] Cas 2: data est directement un tableau");
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
    console.log("🔍 [extractUserIds] Cas 3: data contient un seul utilisateur");
    const id = data.id || data.userId || data.user_id;
    userIds = [parseInt(id)].filter((id: number) => !isNaN(id));
  }
  // Cas 4: autres propriétés possibles
  else if (data.users && Array.isArray(data.users)) {
    console.log("🔍 [extractUserIds] Cas 4: data.users existe");
    userIds = data.users
      .map((user: any) => {
        const id = user.id || user.userId || user.user_id || user;
        return parseInt(id);
      })
      .filter((id: number) => !isNaN(id));
  }

  console.log("🔍 [extractUserIds] IDs extraits:", userIds);
  return userIds;
}

/**
 * Valider qu'un utilisateur existe et peut devenir professeur
 */
export async function validerUtilisateurPourPromotion(
  userId: number,
  professeursClient?: Professeurs,
): Promise<{ valide: boolean; message?: string; utilisateur?: Professeur }> {
  const client = professeursClient || new Professeurs();

  try {
    const utilisateur = await client.obtenirUtilisateurParId(userId);

    if (!utilisateur) {
      return {
        valide: false,
        message: `L'utilisateur avec l'ID ${userId} n'existe pas`,
      };
    }

    // Vérifier si l'utilisateur n'est pas déjà professeur (role_id = 2)
    if (utilisateur.role_id === 2) {
      return {
        valide: false,
        message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} est déjà professeur`,
        utilisateur,
      };
    }

    return {
      valide: true,
      utilisateur,
    };
  } catch (error) {
    console.error(
      `❌ [Service Professeurs] Erreur validation utilisateur ${userId}:`,
      error,
    );
    return {
      valide: false,
      message: `Erreur lors de la validation de l'utilisateur ${userId}`,
    };
  }
}
