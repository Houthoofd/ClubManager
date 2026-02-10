/**
 * Service Utilisateurs - Logique métier
 * Gère les opérations sur les utilisateurs
 */

import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { EmailService } from "../../../../services/emailService.js";
import { emailClient } from "../../../../clients/emailClient.js";
import {
  hashPassword,
  verifyPassword,
} from "../../../../shared/utils/password.helpers.js";

/**
 * Vérifier l'existence d'un utilisateur
 */
export async function verifierExistenceUtilisateur(
  nom: string,
  prenom: string,
  date_naissance: string,
  utilisateursClient?: Utilisateurs,
): Promise<{
  exists: boolean;
  canRegister: boolean;
  userData?: any;
  message: string;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `👤 [Service Utilisateurs] Vérification existence: ${prenom} ${nom}`,
  );

  try {
    await client.verifierUtilisateurExiste({ nom, prenom, date_naissance });

    // Si aucune erreur n'est levée, l'utilisateur n'existe pas
    return {
      exists: false,
      canRegister: true,
      message: "Aucun utilisateur trouvé avec ces informations",
    };
  } catch (conflictError: any) {
    if (conflictError.status === 409) {
      return {
        exists: true,
        canRegister: false,
        userData: conflictError.data,
        message: conflictError.message,
      };
    }
    throw conflictError;
  }
}

/**
 * Inscrire un nouvel utilisateur
 */
export async function inscrireUtilisateur(
  userData: any,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  userId?: number;
  generatedUserId?: string;
  message: string;
  details?: any;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `📝 [Service Utilisateurs] Inscription: ${userData.prenom} ${userData.nom}`,
  );

  try {
    const result = await client.inscrireUtilisateur(userData);

    console.log(
      `✅ [Service Utilisateurs] Inscription réussie, userId: ${result.userId}`,
    );

    return {
      success: true,
      userId: result.userId,
      generatedUserId: result.generatedUserId,
      message: "Inscription réussie",
      details: result,
    };
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur inscription:`, error);
    throw error;
  }
}

/**
 * Envoyer un email de vérification
 */
export async function envoyerEmailVerification(
  email: string,
  prenom: string,
  nom: string,
  userId: string,
  utilisateurId: number,
): Promise<{
  success: boolean;
  message: string;
  details?: any;
  messageId?: string;
}> {
  console.log(`📧 [Service Utilisateurs] Envoi email vérification à: ${email}`);

  try {
    const emailResult = await emailClient.sendValidationEmail({
      email,
      prenom,
      nom,
      userId,
      utilisateurId,
    });

    if (emailResult.success) {
      console.log(`✅ [Service Utilisateurs] Email envoyé avec succès`);
      return {
        success: true,
        message: emailResult.message,
        details: emailResult.details,
        messageId: emailResult.messageId,
      };
    } else {
      console.warn(`⚠️ [Service Utilisateurs] Échec envoi email`);
      return {
        success: false,
        message: emailResult.message,
        details: emailResult.details,
      };
    }
  } catch (error: any) {
    console.error(`❌ [Service Utilisateurs] Erreur envoi email:`, error);
    return {
      success: false,
      message: "Erreur lors de l'envoi de l'email",
      details: { error: error.message },
    };
  }
}

/**
 * Valider un token email
 */
export async function validerTokenEmail(
  token: string,
  userId: string,
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  console.log(
    `🔍 [Service Utilisateurs] Validation token email pour userId: ${userId}`,
  );

  try {
    const result = await emailClient.validateEmailToken(token, userId);

    if (result.success) {
      console.log(`✅ [Service Utilisateurs] Token validé avec succès`);
    } else {
      console.warn(`⚠️ [Service Utilisateurs] Token invalide`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Service Utilisateurs] Erreur validation token:`, error);
    throw error;
  }
}

/**
 * Connexion par userId
 */
export async function connexionParUserId(
  userId: string,
  password: string,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(`🔐 [Service Utilisateurs] Connexion par userId: ${userId}`);

  try {
    const result = await client.validerConnexionParUserId(userId, password);

    if (result.isFind) {
      console.log(`✅ [Service Utilisateurs] Connexion réussie`);
      return {
        success: true,
        message: result.message,
        data: result.dataToStore,
      };
    } else {
      console.warn(`⚠️ [Service Utilisateurs] Connexion échouée`);
      return {
        success: false,
        message: result.message,
      };
    }
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur connexion:`, error);
    throw error;
  }
}

/**
 * Connexion par email
 */
export async function connexionParEmail(
  email: string,
  password: string,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(`🔐 [Service Utilisateurs] Connexion par email: ${email}`);

  try {
    const result = await client.validerConnexion({ email, password });

    if (result.isFind) {
      console.log(`✅ [Service Utilisateurs] Connexion réussie`);
      return {
        success: true,
        message: result.message,
        data: result.dataToStore,
      };
    } else {
      console.warn(`⚠️ [Service Utilisateurs] Connexion échouée`);
      return {
        success: false,
        message: result.message,
      };
    }
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur connexion:`, error);
    throw error;
  }
}

/**
 * Récupérer les statistiques des utilisateurs
 */
export async function obtenirStatistiques(
  utilisateursClient?: Utilisateurs,
): Promise<{
  totalUtilisateurs: number;
  utilisateursActifs: number;
  utilisateursInactifs: number;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(`📊 [Service Utilisateurs] Récupération des statistiques`);

  try {
    const stats = await client.obtenirStatistiques();

    console.log(`✅ [Service Utilisateurs] Statistiques récupérées`);

    return stats;
  } catch (error) {
    console.error(
      `❌ [Service Utilisateurs] Erreur récupération stats:`,
      error,
    );
    throw error;
  }
}

/**
 * Récupérer tous les utilisateurs
 */
export async function obtenirTousLesUtilisateurs(
  includeInactive: boolean = false,
  utilisateursClient?: Utilisateurs,
): Promise<any[]> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `👥 [Service Utilisateurs] Récupération de tous les utilisateurs (includeInactive: ${includeInactive})`,
  );

  try {
    const utilisateurs = await client.obtenirTous(includeInactive);

    if (!utilisateurs || utilisateurs.length === 0) {
      console.log(`⚠️ [Service Utilisateurs] Aucun utilisateur trouvé`);
      return [];
    }

    console.log(
      `✅ [Service Utilisateurs] ${utilisateurs.length} utilisateur(s) récupéré(s)`,
    );

    return utilisateurs;
  } catch (error) {
    console.error(
      `❌ [Service Utilisateurs] Erreur récupération utilisateurs:`,
      error,
    );
    throw error;
  }
}

/**
 * Récupérer un utilisateur par ID
 */
export async function obtenirUtilisateurParId(
  utilisateurId: number,
  utilisateursClient?: Utilisateurs,
): Promise<any | null> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `👤 [Service Utilisateurs] Récupération utilisateur ID: ${utilisateurId}`,
  );

  try {
    const utilisateur = await client.obtenirParId(utilisateurId);

    if (!utilisateur) {
      console.log(
        `⚠️ [Service Utilisateurs] Utilisateur ${utilisateurId} non trouvé`,
      );
      return null;
    }

    console.log(`✅ [Service Utilisateurs] Utilisateur récupéré`);

    return utilisateur;
  } catch (error) {
    console.error(
      `❌ [Service Utilisateurs] Erreur récupération utilisateur:`,
      error,
    );
    throw error;
  }
}

/**
 * Mettre à jour un utilisateur
 */
export async function mettreAJourUtilisateur(
  utilisateurId: number,
  dataToUpdate: any,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `🔄 [Service Utilisateurs] Mise à jour utilisateur ID: ${utilisateurId}`,
  );

  try {
    // Hasher le mot de passe si présent
    if (dataToUpdate.password) {
      const hashedPassword = await bcrypt.hash(dataToUpdate.password, 10);
      dataToUpdate.password = hashedPassword;
    }

    const result = await client.mettreAJour(utilisateurId, dataToUpdate);

    console.log(`✅ [Service Utilisateurs] Utilisateur mis à jour`);

    return {
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: result,
    };
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur mise à jour:`, error);
    throw error;
  }
}

/**
 * Supprimer un utilisateur (hard delete)
 */
export async function supprimerUtilisateur(
  utilisateurId: number,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  message: string;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `🗑️ [Service Utilisateurs] Suppression définitive utilisateur ID: ${utilisateurId}`,
  );

  try {
    const result = await client.supprimer(utilisateurId);

    console.log(`✅ [Service Utilisateurs] Utilisateur supprimé`);

    return {
      success: true,
      message: "Utilisateur supprimé avec succès",
    };
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur suppression:`, error);
    throw error;
  }
}

/**
 * Supprimer un utilisateur (soft delete)
 */
export async function supprimerUtilisateurSoft(
  utilisateurId: number,
  utilisateursClient?: Utilisateurs,
): Promise<{
  success: boolean;
  message: string;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(
    `🗑️ [Service Utilisateurs] Suppression soft utilisateur ID: ${utilisateurId}`,
  );

  try {
    const result = await client.supprimerSoft(utilisateurId);

    console.log(`✅ [Service Utilisateurs] Utilisateur désactivé`);

    return {
      success: true,
      message: "Utilisateur désactivé avec succès",
    };
  } catch (error) {
    console.error(`❌ [Service Utilisateurs] Erreur suppression soft:`, error);
    throw error;
  }
}

/**
 * Tester la configuration email
 */
export async function testerConfigurationEmail(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  console.log(`🔧 [Service Utilisateurs] Test de configuration email`);

  try {
    const emailService = new EmailService();
    const configTest = await emailService.testerConfiguration();

    return {
      success: configTest.success,
      message: configTest.success
        ? "Configuration email OK"
        : "Problèmes de configuration détectés",
      details: configTest.details,
    };
  } catch (error: any) {
    console.error(`❌ [Service Utilisateurs] Erreur test config:`, error);
    return {
      success: false,
      message: "Erreur lors du test de configuration",
      details: { error: error.message },
    };
  }
}

/**
 * Envoyer un email de test
 */
export async function envoyerEmailTest(email: string): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
  details?: any;
}> {
  console.log(`🧪 [Service Utilisateurs] Envoi email de test à: ${email}`);

  try {
    const emailService = new EmailService();
    const result = await emailService.envoyerEmailTest(email);

    if (result.success) {
      console.log(`✅ [Service Utilisateurs] Email de test envoyé`);
      return {
        success: true,
        message: "Email de test envoyé avec succès",
        messageId: result.messageId,
        details: result.details,
      };
    } else {
      console.warn(`⚠️ [Service Utilisateurs] Échec envoi email de test`);
      return {
        success: false,
        message: "Échec de l'envoi de l'email de test",
        details: result.details,
      };
    }
  } catch (error: any) {
    console.error(
      `❌ [Service Utilisateurs] Erreur envoi email de test:`,
      error,
    );
    return {
      success: false,
      message: "Erreur lors de l'envoi de l'email de test",
      details: { error: error.message },
    };
  }
}

/**
 * Vérifier la santé du service utilisateurs
 */
export async function verifierSanteService(
  utilisateursClient?: Utilisateurs,
): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: boolean;
    utilisateurs: boolean;
    email: boolean;
  };
  message: string;
  data?: any;
}> {
  const client = utilisateursClient || new Utilisateurs();

  console.log(`🏥 [Service Utilisateurs] Vérification de santé`);

  const checks = {
    database: false,
    utilisateurs: false,
    email: false,
  };

  try {
    // Vérifier chaque composant
    const [utilisateursTest, statsTest, emailTest] = await Promise.allSettled([
      client.obtenirTous(false),
      client.obtenirStatistiques(),
      new EmailService().testerConfiguration(),
    ]);

    checks.utilisateurs = utilisateursTest.status === "fulfilled";
    checks.database = statsTest.status === "fulfilled";
    checks.email = emailTest.status === "fulfilled" && emailTest.value.success;

    const healthyCount = Object.values(checks).filter(Boolean).length;

    let statsData;
    if (statsTest.status === "fulfilled") {
      statsData = {
        totalUtilisateurs: statsTest.value.totalUtilisateurs,
        utilisateursActifs: statsTest.value.utilisateursActifs,
        utilisateursInactifs: statsTest.value.utilisateursInactifs,
      };
    }

    if (healthyCount === 3) {
      return {
        status: "healthy",
        checks,
        message: "Tous les services sont opérationnels",
        data: statsData,
      };
    } else if (healthyCount >= 1) {
      return {
        status: "degraded",
        checks,
        message: `${healthyCount}/3 services opérationnels`,
        data: statsData,
      };
    } else {
      return {
        status: "unhealthy",
        checks,
        message: "Services non opérationnels",
      };
    }
  } catch (error) {
    console.error(
      `❌ [Service Utilisateurs] Erreur vérification santé:`,
      error,
    );
    return {
      status: "unhealthy",
      checks,
      message: "Erreur lors de la vérification de santé",
    };
  }
}
