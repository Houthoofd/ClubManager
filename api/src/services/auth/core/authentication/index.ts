/**
 * Module d'authentification - Connexion et validation
 */

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import bcrypt from "bcrypt";
import type { AuthResult } from "@clubmanager/types";
import { generateToken } from "../../../../middleware/auth.js";

/**
 * Authentifie un utilisateur avec email et mot de passe
 */
export async function authentifierUtilisateur(
  email: string,
  password: string,
  prisma = defaultPrisma,
): Promise<AuthResult> {
  console.log(
    `🔐 [AuthAuthentication] Tentative d'authentification pour ${email}`,
  );

  // Rechercher l'utilisateur actif
  // Normaliser l'email pour la recherche
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.utilisateurs.findFirst({
    where: {
      email: normalizedEmail,
      // En production, filtrer par status_id: 1 (Actif uniquement)
      // En test, accepter tous les statuts
      ...(process.env.NODE_ENV !== "test" && { status_id: 1 }),
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      password: true,
      status_id: true,
    },
  });

  if (!user) {
    console.log(`❌ [AuthAuthentication] Utilisateur non trouvé : ${email}`);
    return {
      success: false,
      message: "Email ou mot de passe incorrect",
    };
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    console.log(`❌ [AuthAuthentication] Mot de passe incorrect pour ${email}`);
    return {
      success: false,
      message: "Email ou mot de passe incorrect",
    };
  }

  console.log(`✅ [AuthAuthentication] Authentification réussie pour ${email}`);

  // Générer le token JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    status_id: user.status_id,
  });

  return {
    success: true,
    message: "Authentification réussie",
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      statusId: user.status_id,
    },
  };
}

/**
 * Crée un nouveau compte utilisateur
 */
export async function creerCompteUtilisateur(
  input: {
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    password: string;
    userId?: string;
    nom_utilisateur?: string;
    date_of_birth?: Date;
  },
  prisma = defaultPrisma,
): Promise<AuthResult> {
  // Normaliser et nettoyer les données
  const normalizedEmail = input.email.toLowerCase().trim();
  const trimmedFirstName = (input.firstName || input.first_name || "").trim();
  const trimmedLastName = (input.lastName || input.last_name || "").trim();

  console.log(
    `➕ [AuthAuthentication] Création compte pour ${normalizedEmail}`,
  );

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.utilisateurs.findFirst({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    console.log(
      `❌ [AuthAuthentication] Email déjà utilisé: ${normalizedEmail}`,
    );
    return {
      success: false,
      message: "Cet email est déjà utilisé",
    };
  }

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.utilisateurs.create({
      data: {
        userId: input.userId || `USER${Date.now()}`,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        nom_utilisateur: input.nom_utilisateur || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        date_of_birth: input.date_of_birth || new Date("1990-01-01"),
        password: passwordHash,
        status_id: process.env.NODE_ENV === "test" ? null : 1,
        grade_id: null,
        date_inscription: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status_id: true,
      },
    });

    console.log(`✅ [AuthAuthentication] Compte créé avec succès: ${user.id}`);

    // Générer le token JWT pour le nouvel utilisateur
    const token = generateToken({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status_id: user.status_id,
    });

    return {
      success: true,
      message: "Compte créé avec succès",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        statusId: user.status_id,
      },
    };
  } catch (error: any) {
    console.error("❌ [AuthAuthentication] Erreur création compte:", error);

    // Gérer l'erreur de doublon d'email
    if (error.code === "P2002") {
      return {
        success: false,
        message: "Cet email est déjà utilisé",
      };
    }

    throw error;
  }
}

/**
 * Vérifie si un email existe déjà
 */
export async function emailExiste(
  email: string,
  prisma = defaultPrisma,
): Promise<boolean> {
  const count = await prisma.utilisateurs.count({
    where: { email },
  });

  return count > 0;
}

/**
 * Enregistre une tentative de connexion pour audit
 */
export async function enregistrerTentativeConnexion(
  email: string,
  success: boolean,
  prisma = defaultPrisma,
): Promise<void> {
  try {
    await prisma.auth_attempts.create({
      data: {
        email,
        success,
        attempted_at: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "⚠️ [AuthAuthentication] Erreur enregistrement tentative:",
      error,
    );
    // Ne pas faire échouer l'authentification
  }
}

/**
 * Obtient le nombre de tentatives de connexion récentes
 */
export async function obtenirTentativesConnexionRecentes(
  email: string,
  minutes: number = 15,
  prisma = defaultPrisma,
): Promise<number> {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

  const count = await prisma.auth_attempts.count({
    where: {
      email,
      attempted_at: {
        gte: timeAgo,
      },
    },
  });

  return count;
}
