import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Service de gestion des échéances
 * Contient la logique métier pour les opérations sur les échéances
 */

/**
 * Interface pour une échéance
 */
export interface Echeance {
  id: number;
  utilisateur_id: number;
  abonnement_id?: number;
  montant: number;
  date_echeance: string;
  statut: "en attente" | "payé" | "échu";
  date_creation?: string;
  date_paiement?: string;
  stripe_payment_intent_id?: string;
  description?: string;
}

/**
 * Interface pour une échéance avec détails utilisateur
 */
export interface EcheanceAvecDetails extends Echeance {
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  plan?: {
    nom_plan: string;
    prix: number;
  };
  statut_calcule?: string;
}

/**
 * Interface pour les statistiques d'échéances
 */
export interface StatistiquesEcheances {
  total_echeances: number;
  en_attente: number;
  payees: number;
  echues: number;
  montant_total_du: number;
}

/**
 * Récupérer toutes les échéances d'un utilisateur
 */
export async function obtenirEcheancesUtilisateur(
  userId: number,
  paiementsClient?: Paiements,
): Promise<Echeance[]> {
  const client = paiementsClient || new Paiements();

  console.log(`🔍 [Service Échéances] Récupération échéances utilisateur ${userId}`);

  try {
    const echeances = await client.obtenirEcheancesUtilisateur(userId);

    console.log(`✅ [Service Échéances] ${echeances.length} échéances trouvées`);

    return echeances;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur récupération échéances:`, error);
    throw new Error(
      `Impossible de récupérer les échéances de l'utilisateur ${userId}`,
    );
  }
}

/**
 * Récupérer les détails d'une échéance spécifique avec vérification de sécurité
 */
export async function obtenirDetailEcheance(
  echeanceId: number,
  userId?: number,
  paiementsClient?: Paiements,
): Promise<EcheanceAvecDetails | null> {
  const client = paiementsClient || new Paiements();

  console.log(`🔍 [Service Échéances] Récupération détail échéance ${echeanceId}`, {
    userId: userId || "non spécifié",
  });

  try {
    // Requête optimisée avec toutes les informations
    const query = `
      SELECT
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan,
        pt.prix as prix_plan,
        CASE
          WHEN ep.date_echeance < NOW() AND ep.statut != 'payé' THEN 'en_retard'
          ELSE ep.statut
        END as statut_calcule
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE ep.id = ?
      ${userId ? "AND ep.utilisateur_id = ?" : ""}
    `;

    const params = userId ? [echeanceId, userId] : [echeanceId];
    const results = await client.queryAsync(query, params);

    if (results.length === 0) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return null;
    }

    const echeance = results[0];

    // Formater la réponse
    const echeanceFormatee: EcheanceAvecDetails = {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      abonnement_id: echeance.abonnement_id,
      montant: parseFloat(echeance.montant),
      date_echeance: echeance.date_echeance,
      statut: echeance.statut,
      statut_calcule: echeance.statut_calcule,
      date_creation: echeance.date_creation,
      date_paiement: echeance.date_paiement,
      stripe_payment_intent_id: echeance.stripe_payment_intent_id,
      description:
        echeance.description ||
        `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString("fr-FR")}`,
      utilisateur: {
        first_name: echeance.first_name,
        last_name: echeance.last_name,
        email: echeance.email,
      },
    };

    if (echeance.nom_plan) {
      echeanceFormatee.plan = {
        nom_plan: echeance.nom_plan,
        prix: parseFloat(echeance.prix_plan),
      };
    }

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} récupérée`);

    return echeanceFormatee;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur récupération détail:`, error);
    throw new Error(`Impossible de récupérer les détails de l'échéance ${echeanceId}`);
  }
}

/**
 * Créer une nouvelle échéance
 */
export async function creerEcheance(
  data: {
    utilisateur_id: number;
    abonnement_id?: number;
    montant: number;
    date_echeance: string;
    description?: string;
    statut?: "en attente" | "payé" | "échu";
  },
  paiementsClient?: Paiements,
): Promise<Echeance> {
  const client = paiementsClient || new Paiements();

  console.log(`📝 [Service Échéances] Création nouvelle échéance:`, data);

  try {
    const query = `
      INSERT INTO echeances_paiements
      (utilisateur_id, abonnement_id, date_echeance, montant, description, statut)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await client.queryAsync(query, [
      data.utilisateur_id,
      data.abonnement_id || null,
      data.date_echeance,
      data.montant,
      data.description || null,
      data.statut || "en attente",
    ]);

    // Récupérer l'échéance créée
    const echeanceCreee = await client.queryAsync(
      "SELECT * FROM echeances_paiements WHERE id = ?",
      [result.insertId],
    );

    console.log(`✅ [Service Échéances] Échéance ${result.insertId} créée avec succès`);

    return echeanceCreee[0];
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur création échéance:`, error);
    throw new Error("Impossible de créer l'échéance");
  }
}

/**
 * Mettre à jour une échéance
 */
export async function mettreAJourEcheance(
  echeanceId: number,
  updates: {
    montant?: number;
    date_echeance?: string;
    description?: string;
    statut?: "en attente" | "payé" | "échu";
    date_paiement?: string;
    stripe_payment_intent_id?: string;
  },
  paiementsClient?: Paiements,
): Promise<Echeance | null> {
  const client = paiementsClient || new Paiements();

  console.log(`📝 [Service Échéances] Mise à jour échéance ${echeanceId}:`, updates);

  try {
    // Vérifier que l'échéance existe
    const existingEcheance = await client.queryAsync(
      "SELECT * FROM echeances_paiements WHERE id = ?",
      [echeanceId],
    );

    if (existingEcheance.length === 0) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return null;
    }

    // Construire la requête de mise à jour dynamiquement
    const allowedFields = [
      "montant",
      "date_echeance",
      "description",
      "statut",
      "date_paiement",
      "stripe_payment_intent_id",
    ];
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.keys(updates).forEach((field) => {
      if (
        allowedFields.includes(field) &&
        updates[field as keyof typeof updates] !== undefined
      ) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field as keyof typeof updates]);
      }
    });

    if (updateFields.length === 0) {
      console.log(`⚠️ [Service Échéances] Aucun champ à mettre à jour`);
      return existingEcheance[0];
    }

    updateValues.push(echeanceId);

    const updateQuery = `
      UPDATE echeances_paiements
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    await client.queryAsync(updateQuery, updateValues);

    // Récupérer l'échéance mise à jour
    const echeanceMiseAJour = await client.queryAsync(
      "SELECT * FROM echeances_paiements WHERE id = ?",
      [echeanceId],
    );

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} mise à jour`);

    return echeanceMiseAJour[0];
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur mise à jour échéance:`, error);
    throw new Error(`Impossible de mettre à jour l'échéance ${echeanceId}`);
  }
}

/**
 * Supprimer une échéance
 */
export async function supprimerEcheance(
  echeanceId: number,
  paiementsClient?: Paiements,
): Promise<boolean> {
  const client = paiementsClient || new Paiements();

  console.log(`🗑️ [Service Échéances] Suppression échéance ${echeanceId}`);

  try {
    // Vérifier que l'échéance existe
    const existingEcheance = await client.queryAsync(
      "SELECT * FROM echeances_paiements WHERE id = ?",
      [echeanceId],
    );

    if (existingEcheance.length === 0) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non trouvée`);
      return false;
    }

    // Supprimer l'échéance
    const result = await client.queryAsync(
      "DELETE FROM echeances_paiements WHERE id = ?",
      [echeanceId],
    );

    if (result.affectedRows === 0) {
      console.log(`⚠️ [Service Échéances] Échéance ${echeanceId} non supprimée`);
      return false;
    }

    console.log(`✅ [Service Échéances] Échéance ${echeanceId} supprimée`);

    return true;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur suppression échéance:`, error);
    throw new Error(`Impossible de supprimer l'échéance ${echeanceId}`);
  }
}

/**
 * Obtenir les statistiques des échéances d'un utilisateur
 */
export async function obtenirStatistiquesUtilisateur(
  userId: number,
  paiementsClient?: Paiements,
): Promise<{
  statistiques: StatistiquesEcheances;
  echeances: EcheanceAvecDetails[];
}> {
  const client = paiementsClient || new Paiements();

  console.log(`📊 [Service Échéances] Récupération statistiques utilisateur ${userId}`);

  try {
    // Requête détaillée avec jointures
    const query = `
      SELECT
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan,
        pt.prix as prix_plan
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE ep.utilisateur_id = ?
      ORDER BY ep.date_echeance DESC
    `;

    const echeancesDetaillees = await client.queryAsync(query, [userId]);

    // Calculer les statistiques
    const stats: StatistiquesEcheances = {
      total_echeances: echeancesDetaillees.length,
      en_attente: echeancesDetaillees.filter(
        (e: any) => e.statut === "en attente",
      ).length,
      payees: echeancesDetaillees.filter((e: any) => e.statut === "payé").length,
      echues: echeancesDetaillees.filter(
        (e: any) =>
          e.statut === "en attente" && new Date(e.date_echeance) < new Date(),
      ).length,
      montant_total_du: echeancesDetaillees
        .filter((e: any) => e.statut === "en attente")
        .reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0),
    };

    console.log(`✅ [Service Échéances] Statistiques calculées:`, stats);

    // Formater les échéances
    const echeancesFormatees = echeancesDetaillees.map((e: any) => ({
      id: e.id,
      utilisateur_id: e.utilisateur_id,
      abonnement_id: e.abonnement_id,
      montant: parseFloat(e.montant),
      date_echeance: e.date_echeance,
      statut: e.statut,
      date_creation: e.date_creation,
      date_paiement: e.date_paiement,
      stripe_payment_intent_id: e.stripe_payment_intent_id,
      description: e.description,
      utilisateur: {
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email,
      },
      plan: e.nom_plan
        ? {
            nom_plan: e.nom_plan,
            prix: parseFloat(e.prix_plan),
          }
        : undefined,
    }));

    return {
      statistiques: stats,
      echeances: echeancesFormatees,
    };
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur statistiques:`, error);
    throw new Error(
      `Impossible de récupérer les statistiques de l'utilisateur ${userId}`,
    );
  }
}

/**
 * Diagnostic d'une échéance pour un utilisateur
 */
export async function diagnosticEcheance(
  echeanceId: number,
  userId: number,
  paiementsClient?: Paiements,
): Promise<any> {
  const client = paiementsClient || new Paiements();

  console.log(
    `🔍 [Service Échéances] Diagnostic échéance ${echeanceId} pour utilisateur ${userId}`,
  );

  try {
    // 1. Vérifier si l'échéance existe
    const echeanceExisteQuery = `SELECT * FROM echeances_paiements WHERE id = ?`;
    const echeanceExiste = await client.queryAsync(echeanceExisteQuery, [
      echeanceId,
    ]);

    // 2. Vérifier si l'utilisateur existe
    const userExisteQuery = `SELECT id, first_name, last_name, email FROM utilisateurs WHERE id = ?`;
    const userExiste = await client.queryAsync(userExisteQuery, [userId]);

    // 3. Récupérer toutes les échéances de cet utilisateur
    const toutesEcheancesQuery = `SELECT * FROM echeances_paiements WHERE utilisateur_id = ?`;
    const toutesEcheances = await client.queryAsync(toutesEcheancesQuery, [
      userId,
    ]);

    const diagnostic = {
      echeance_recherchee: {
        id: echeanceId,
        existe: echeanceExiste.length > 0,
        details: echeanceExiste[0] || null,
        appartient_utilisateur:
          echeanceExiste.length > 0 &&
          echeanceExiste[0].utilisateur_id === userId,
      },
      utilisateur: {
        id: userId,
        existe: userExiste.length > 0,
        details: userExiste[0] || null,
      },
      echeances_utilisateur: {
        total: toutesEcheances.length,
        liste: toutesEcheances.map((e: any) => ({
          id: e.id,
          montant: e.montant,
          statut: e.statut,
          date_echeance: e.date_echeance,
        })),
      },
    };

    console.log(`✅ [Service Échéances] Diagnostic effectué`);

    return diagnostic;
  } catch (error) {
    console.error(`❌ [Service Échéances] Erreur diagnostic:`, error);
    throw new Error("Impossible d'effectuer le diagnostic");
  }
}
