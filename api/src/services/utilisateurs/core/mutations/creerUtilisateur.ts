/**
 * Mutation: creerUtilisateur
 * Crée un nouvel utilisateur avec validation complète
 */

import type { PrismaClient } from "@prisma/client";
import type {
  CreerUtilisateurInput,
  CreerUtilisateurResult,
} from "@clubmanager/types";
import {
  UtilisateursError,
  UtilisateursErrorCode,
  CreerUtilisateurInputSchema,
} from "@clubmanager/types";
import bcrypt from "bcrypt";

/**
 * Génère un userId unique basé sur le nom, prénom et date de naissance
 */
async function genererUserIdUnique(
  prisma: PrismaClient,
  first_name: string,
  last_name: string,
  date_of_birth: Date,
  email: string,
): Promise<string> {
  const prenom = first_name.toLowerCase().replace(/\s+/g, "");
  const nom = last_name.toLowerCase().replace(/\s+/g, "");
  const year = date_of_birth.getFullYear().toString().slice(-2);
  const month = String(date_of_birth.getMonth() + 1).padStart(2, "0");
  const day = String(date_of_birth.getDate()).padStart(2, "0");

  let attempt = 0;
  let userId = "";
  let exists = true;

  while (exists && attempt < 100) {
    if (attempt === 0) {
      userId = `${prenom}.${nom}.${year}${month}${day}`;
    } else {
      userId = `${prenom}.${nom}.${year}${month}${day}.${attempt}`;
    }

    const count = await prisma.utilisateurs.count({
      where: { userId },
    });

    exists = count > 0;
    attempt++;
  }

  if (exists) {
    // Si on n'arrive pas à générer un userId unique, utiliser un timestamp
    const timestamp = Date.now().toString().slice(-6);
    userId = `${prenom}.${nom}.${timestamp}`;
  }

  return userId;
}

/**
 * Crée un nouvel utilisateur
 */
export async function creerUtilisateur(
  prisma: PrismaClient,
  input: CreerUtilisateurInput,
): Promise<CreerUtilisateurResult> {
  try {
    // Validation des données
    const validated = CreerUtilisateurInputSchema.parse(input);

    // Convertir la date si nécessaire
    const dateOfBirth =
      typeof validated.date_of_birth === "string"
        ? new Date(validated.date_of_birth)
        : validated.date_of_birth;

    // Validation de l'âge (entre 5 et 120 ans)
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const adjustedAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
        ? age - 1
        : age;

    if (adjustedAge < 5 || adjustedAge > 120) {
      throw new UtilisateursError(
        "L'âge doit être compris entre 5 et 120 ans",
        UtilisateursErrorCode.INVALID_AGE,
      );
    }

    // Normaliser l'email
    const email = validated.email.toLowerCase().trim();

    // Vérifier si l'email existe déjà
    const emailExists = await prisma.utilisateurs.findFirst({
      where: { email },
    });

    if (emailExists) {
      throw new UtilisateursError(
        "Cet email est déjà utilisé",
        UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    // Générer le userId unique
    const userId = await genererUserIdUnique(
      prisma,
      validated.first_name,
      validated.last_name,
      dateOfBirth,
      email,
    );

    // Générer le nom d'utilisateur si non fourni
    const nom_utilisateur =
      validated.nom_utilisateur ||
      `${validated.first_name.toLowerCase().replace(/\s+/g, "")}_${validated.last_name.toLowerCase().replace(/\s+/g, "")}_${Date.now().toString().slice(-4)}`;

    // Hash du mot de passe (utiliser un mot de passe par défaut si non fourni)
    const password = validated.password || "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur en transaction
    const utilisateur = await prisma.$transaction(async (tx) => {
      const newUser = await tx.utilisateurs.create({
        data: {
          userId,
          first_name: validated.first_name,
          last_name: validated.last_name,
          email,
          password: hashedPassword,
          nom_utilisateur,
          date_of_birth: dateOfBirth,
          genre_id: validated.genre_id || null,
          abonnement_id: validated.abonnement_id || null,
          grade_id: validated.grade_id || null,
          status_id: validated.status_id || 1, // Statut actif par défaut
          active: true,
          date_inscription: new Date(),
        },
        include: {
          genres: true,
          grades: true,
          abonnements: true,
          status: true,
        },
      });

      return newUser;
    });

    // Calcul des initiales
    const initiales = `${utilisateur.first_name.charAt(0).toUpperCase()}${utilisateur.last_name.charAt(0).toUpperCase()}`;

    return {
      success: true,
      message: "Utilisateur créé avec succès",
      userId: utilisateur.userId || undefined,
      generatedUserId: utilisateur.userId || undefined,
      utilisateur: {
        id: utilisateur.id,
        userId: utilisateur.userId || undefined,
        first_name: utilisateur.first_name,
        last_name: utilisateur.last_name,
        nom_utilisateur: utilisateur.nom_utilisateur || undefined,
        email: utilisateur.email,
        genre_id: utilisateur.genre_id || undefined,
        date_of_birth: utilisateur.date_of_birth,
        grade_id: utilisateur.grade_id,
        abonnement_id: utilisateur.abonnement_id,
        status_id: utilisateur.status_id,
        active: utilisateur.active,
        date_inscription: utilisateur.date_inscription || undefined,
        created_at: utilisateur.created_at || undefined,
        updated_at: utilisateur.updated_at || undefined,
        genre: utilisateur.genres
          ? {
              id: utilisateur.genres.id,
              nom: utilisateur.genres.nom,
            }
          : undefined,
        grade: utilisateur.grades
          ? {
              id: utilisateur.grades.id,
              nom: utilisateur.grades.nom,
              niveau: utilisateur.grades.niveau || 0,
            }
          : undefined,
        abonnement: utilisateur.abonnements
          ? {
              id: utilisateur.abonnements.id,
              nom: utilisateur.abonnements.nom,
              type: utilisateur.abonnements.type || "standard",
            }
          : undefined,
        status: utilisateur.status
          ? {
              id: utilisateur.status.id,
              nom: utilisateur.status.nom,
            }
          : undefined,
        age: adjustedAge,
        initiales,
      },
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw new UtilisateursError(
      "Erreur lors de la création de l'utilisateur",
      UtilisateursErrorCode.OPERATION_FAILED,
    );
  }
}
