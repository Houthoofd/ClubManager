/**
 * Service Auth
 * Contient toute la logique métier pour l'authentification
 *
 * ✅ Migré vers Prisma avec intégration Sentry
 *
 * @module auth.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { generateToken } from "@/shared/middleware/auth.middleware.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Interface pour les données utilisateur
 */
export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  status: string;
}

/**
 * Interface pour le résultat d'authentification
 */
export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserData;
  token?: string;
}

/**
 * Interface pour les données de token de reset
 */
export interface TokenData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  expires_at: Date;
}

/**
 * Interface pour la validation du mot de passe
 */
interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Authentifier un utilisateur avec email et mot de passe
 */
export async function authentifierUtilisateur(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    addSentryBreadcrumb(
      `Tentative d'authentification pour: ${email}`,
      "service.auth",
      "info",
      { email },
    );

    console.log("🔐 [AuthService] Tentative de connexion pour:", email);

    // Rechercher l'utilisateur par email avec son statut
    const user = await prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        active: true,
      },
      include: {
        status: true,
      },
    });

    if (!user) {
      console.log("❌ [AuthService] Utilisateur non trouvé ou inactif");
      return {
        success: false,
        message: "Email ou mot de passe incorrect",
      };
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("❌ [AuthService] Mot de passe incorrect");

      addSentryBreadcrumb(
        "Échec d'authentification - mot de passe incorrect",
        "service.auth",
        "warning",
        { userId: user.id },
      );

      return {
        success: false,
        message: "Email ou mot de passe incorrect",
      };
    }

    // Vérifier si l'email est vérifié
    if (!user.email_verified) {
      console.log("⚠️ [AuthService] Email non vérifié pour:", email);
      return {
        success: false,
        message:
          "Veuillez vérifier votre adresse email avant de vous connecter",
      };
    }

    console.log("✅ [AuthService] Authentification réussie pour:", email);

    addSentryBreadcrumb("Authentification réussie", "service.auth", "info", {
      userId: user.id,
      email,
    });

    // Préparer les données utilisateur
    const userData: UserData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status_id: user.status_id || 1,
      status: user.status?.nom_role || "utilisateur",
    };

    // Générer le token JWT
    const token = generateToken({
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      status_id: userData.status_id,
      role: userData.status,
      status: userData.status,
    });

    return {
      success: true,
      message: "Connexion réussie",
      user: userData,
      token,
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur authentification:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "authentifierUtilisateur",
      },
      extra: { email },
    });

    throw new Error(`Erreur lors de l'authentification: ${error.message}`);
  }
}

/**
 * Vérifier un token de réinitialisation de mot de passe
 */
export async function verifierTokenReset(
  token: string,
): Promise<TokenData | null> {
  try {
    addSentryBreadcrumb(
      "Vérification token de réinitialisation",
      "service.auth",
      "info",
    );

    console.log("🔍 [AuthService] Vérification token de réinitialisation");

    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: token,
        expires_at: {
          gt: new Date(),
        },
        used_at: null,
      },
      include: {
        utilisateurs: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!resetToken) {
      console.log("❌ [AuthService] Token invalide ou expiré");
      return null;
    }

    console.log("✅ [AuthService] Token valide");

    return {
      user_id: resetToken.utilisateurs.id,
      email: resetToken.utilisateurs.email,
      first_name: resetToken.utilisateurs.first_name,
      last_name: resetToken.utilisateurs.last_name,
      expires_at: resetToken.expires_at,
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur vérification token:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "verifierTokenReset",
      },
    });

    throw new Error(
      `Erreur lors de la vérification du token: ${error.message}`,
    );
  }
}

/**
 * Demander une réinitialisation de mot de passe
 */
export async function demanderResetMotDePasse(
  email: string,
): Promise<{ success: boolean; message: string; token?: string }> {
  try {
    addSentryBreadcrumb(
      `Demande de réinitialisation pour: ${email}`,
      "service.auth",
      "info",
      { email },
    );

    console.log("📧 [AuthService] Demande de réinitialisation pour:", email);

    // Rechercher l'utilisateur par email
    const user = await prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        active: true,
      },
    });

    // Ne pas révéler si l'utilisateur existe ou non (sécurité)
    const defaultMessage =
      "Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.";

    if (!user) {
      console.log(
        "⚠️ [AuthService] Utilisateur non trouvé (réponse générique)",
      );
      return {
        success: true,
        message: defaultMessage,
      };
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // Invalider les anciens tokens non utilisés
    await prisma.password_reset_tokens.updateMany({
      where: {
        utilisateur_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    // Créer le nouveau token
    await prisma.password_reset_tokens.create({
      data: {
        utilisateur_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
      },
    });

    console.log(
      "✅ [AuthService] Token de réinitialisation créé pour userId:",
      user.id,
    );

    addSentryBreadcrumb(
      "Token de réinitialisation créé",
      "service.auth",
      "info",
      { userId: user.id },
    );

    return {
      success: true,
      message: defaultMessage,
      token: resetToken,
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur demande reset:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "demanderResetMotDePasse",
      },
      extra: { email },
    });

    throw new Error(
      `Erreur lors de la demande de réinitialisation: ${error.message}`,
    );
  }
}

/**
 * Envoyer l'email de réinitialisation de mot de passe
 */
export async function envoyerEmailResetMotDePasse(
  email: string,
  prenom: string,
  token: string,
): Promise<void> {
  try {
    addSentryBreadcrumb(
      `Envoi email de réinitialisation à: ${email}`,
      "service.auth",
      "info",
      { email },
    );

    console.log("📧 [AuthService] Envoi email de réinitialisation à:", email);

    // TODO: Implémenter l'envoi d'email de réinitialisation
    // const { emailClient } =
    //   await import("../../../../infrastructure/external-services/email/index.js");
    // await emailClient.envoyerResetPassword(email, prenom, token);

    console.log("✅ [AuthService] Email de réinitialisation envoyé (TODO)");
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur envoi email:", error);

    captureException(error, {
      level: "warning",
      tags: {
        service: "auth",
        operation: "envoyerEmailResetMotDePasse",
      },
      extra: { email },
    });

    // Ne pas propager l'erreur pour ne pas révéler que l'email existe
  }
}

/**
 * Valider le format du mot de passe
 */
function validerMotDePasse(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Réinitialiser le mot de passe avec un token
 */
export async function reinitialiserMotDePasse(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    addSentryBreadcrumb(
      "Réinitialisation du mot de passe",
      "service.auth",
      "info",
    );

    console.log("🔑 [AuthService] Réinitialisation du mot de passe");

    // Vérifier que le token est valide
    const tokenData = await verifierTokenReset(token);

    if (!tokenData) {
      console.log("❌ [AuthService] Token invalide ou expiré");
      return {
        success: false,
        message: "Token invalide ou expiré",
      };
    }

    // Valider le nouveau mot de passe
    const validation = validerMotDePasse(newPassword);
    if (!validation.valid) {
      console.log("❌ [AuthService] Mot de passe invalide:", validation.errors);
      return {
        success: false,
        message: "Mot de passe invalide",
        errors: validation.errors,
      };
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.utilisateurs.update({
      where: { id: tokenData.user_id },
      data: { password: hashedPassword },
    });

    // Marquer le token comme utilisé
    await prisma.password_reset_tokens.updateMany({
      where: {
        token: token,
        utilisateur_id: tokenData.user_id,
      },
      data: {
        used_at: new Date(),
      },
    });

    console.log(
      "✅ [AuthService] Mot de passe réinitialisé pour userId:",
      tokenData.user_id,
    );

    addSentryBreadcrumb(
      "Mot de passe réinitialisé avec succès",
      "service.auth",
      "info",
      { userId: tokenData.user_id },
    );

    return {
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur réinitialisation:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "reinitialiserMotDePasse",
      },
    });

    throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
  }
}

/**
 * Vérifier un token de validation d'email
 */
export async function verifierTokenValidation(
  token: string,
  userId: number,
): Promise<boolean> {
  try {
    addSentryBreadcrumb(
      "Vérification token de validation d'email",
      "service.auth",
      "info",
      { userId },
    );

    console.log(
      "🔍 [AuthService] Vérification token de validation pour userId:",
      userId,
    );

    const validationToken = await prisma.email_validation_tokens.findFirst({
      where: {
        token: token,
        utilisateur_id: userId,
        expires_at: {
          gt: new Date(),
        },
        used: false,
      },
    });

    const isValid = !!validationToken;

    if (isValid) {
      console.log("✅ [AuthService] Token de validation valide");
    } else {
      console.log("❌ [AuthService] Token de validation invalide ou expiré");
    }

    return isValid;
  } catch (error: any) {
    console.error(
      "❌ [AuthService] Erreur vérification token validation:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "verifierTokenValidation",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la vérification du token: ${error.message}`,
    );
  }
}

/**
 * Confirmer l'email d'un utilisateur
 */
export async function confirmerEmail(
  userId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    addSentryBreadcrumb("Confirmation de l'email", "service.auth", "info", {
      userId,
    });

    console.log("✅ [AuthService] Confirmation email pour userId:", userId);

    // Mettre à jour le statut de vérification de l'email
    await prisma.utilisateurs.update({
      where: { id: userId },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
      },
    });

    // Marquer tous les tokens de validation comme utilisés
    await prisma.email_validation_tokens.updateMany({
      where: {
        utilisateur_id: userId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    console.log(
      "✅ [AuthService] Email confirmé avec succès pour userId:",
      userId,
    );

    addSentryBreadcrumb("Email confirmé avec succès", "service.auth", "info", {
      userId,
    });

    return {
      success: true,
      message: "Email confirmé avec succès",
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur confirmation email:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "confirmerEmail",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la confirmation de l'email: ${error.message}`,
    );
  }
}

/**
 * Vérifier si un email existe
 */
export async function emailExiste(email: string): Promise<boolean> {
  try {
    addSentryBreadcrumb(
      "Vérification existence email",
      "service.auth",
      "info",
      { email },
    );

    console.log("🔍 [AuthService] Vérification existence email:", email);

    const user = await prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
      select: { id: true },
    });

    const exists = !!user;

    console.log(
      `${exists ? "✅" : "❌"} [AuthService] Email ${exists ? "existe" : "n'existe pas"}`,
    );

    return exists;
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur vérification email:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "emailExiste",
      },
      extra: { email },
    });

    throw new Error(
      `Erreur lors de la vérification de l'email: ${error.message}`,
    );
  }
}

/**
 * Rechercher un utilisateur par email
 */
export async function rechercherUtilisateurParEmail(
  email: string,
): Promise<UserData | null> {
  try {
    addSentryBreadcrumb(
      "Recherche utilisateur par email",
      "service.auth",
      "info",
      { email },
    );

    console.log("🔍 [AuthService] Recherche utilisateur par email:", email);

    const user = await prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        active: true,
      },
      include: {
        status: true,
      },
    });

    if (!user) {
      console.log("❌ [AuthService] Utilisateur non trouvé");
      return null;
    }

    console.log("✅ [AuthService] Utilisateur trouvé, userId:", user.id);

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status_id: user.status_id || 1,
      status: user.status?.nom_role || "utilisateur",
    };
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur recherche utilisateur:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "rechercherUtilisateurParEmail",
      },
      extra: { email },
    });

    throw new Error(
      `Erreur lors de la recherche de l'utilisateur: ${error.message}`,
    );
  }
}

/**
 * Générer un nouveau token JWT pour un utilisateur
 */
export function genererToken(userData: {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number | null;
  role?: string;
  status?: string;
}): string {
  // Map status_id to role/status if not provided
  const role = userData.role || mapStatusIdToRole(userData.status_id);
  const status = userData.status || mapStatusIdToStatus(userData.status_id);

  return generateToken({
    ...userData,
    status_id: userData.status_id || 4, // Default to PROSPECT
    role,
    status,
  });
}

/**
 * Map status_id to role string
 */
function mapStatusIdToRole(status_id: number | null): string {
  switch (status_id) {
    case 1:
      return "admin";
    case 2:
      return "professeur";
    case 3:
      return "membre";
    case 4:
    default:
      return "prospect";
  }
}

/**
 * Map status_id to status string
 */
function mapStatusIdToStatus(status_id: number | null): string {
  switch (status_id) {
    case 1:
      return "admin";
    case 2:
      return "professeur";
    case 3:
      return "membre";
    case 4:
    default:
      return "prospect";
  }
}

/**
 * Créer un token de validation d'email
 */
export async function creerTokenValidationEmail(
  userId: number,
): Promise<string> {
  try {
    addSentryBreadcrumb(
      "Création token de validation email",
      "service.auth",
      "info",
      { userId },
    );

    console.log(
      "🔑 [AuthService] Création token de validation pour userId:",
      userId,
    );

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 heures

    // Créer le token de validation
    await prisma.email_validation_tokens.create({
      data: {
        utilisateur_id: userId,
        token: token,
        type: "email_confirmation",
        expires_at: expiresAt,
      },
    });

    console.log("✅ [AuthService] Token de validation créé");

    return token;
  } catch (error: any) {
    console.error("❌ [AuthService] Erreur création token validation:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "auth",
        operation: "creerTokenValidationEmail",
      },
      extra: { userId },
    });

    throw new Error(
      `Erreur lors de la création du token de validation: ${error.message}`,
    );
  }
}
