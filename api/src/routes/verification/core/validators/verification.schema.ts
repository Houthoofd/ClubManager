/**
 * Schémas de validation pour le module Vérification
 * Définit les règles de validation des requêtes
 */

/**
 * Schéma de validation pour la vérification d'email
 */
export const verifierEmailSchema = {
  email: {
    type: "string",
    required: true,
    minLength: 5,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: "Email valide requis",
  },
};

/**
 * Schéma de validation pour la vérification de nom d'utilisateur
 */
export const verifierNomUtilisateurSchema = {
  nom_utilisateur: {
    type: "string",
    required: true,
    minLength: 3,
    maxLength: 50,
    errorMessage: "Nom d'utilisateur requis (3-50 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification de prénom
 */
export const verifierPrenomSchema = {
  prenom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Prénom requis (2-100 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification de nom
 */
export const verifierNomSchema = {
  nom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Nom requis (2-100 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification de prénom et nom
 */
export const verifierPrenomNomSchema = {
  prenom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Prénom requis (2-100 caractères)",
  },
  nom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Nom requis (2-100 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification d'email, prénom et nom
 */
export const verifierEmailPrenomNomSchema = {
  email: {
    type: "string",
    required: true,
    minLength: 5,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: "Email valide requis",
  },
  prenom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Prénom requis (2-100 caractères)",
  },
  nom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Nom requis (2-100 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification de planning
 */
export const verifierPlanningSchema = {
  jour: {
    type: "string",
    required: true,
    enum: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    errorMessage: "Jour de la semaine requis",
  },
  heure_debut: {
    type: "string",
    required: true,
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    errorMessage: "Heure de début valide requise (format HH:MM)",
  },
  heure_fin: {
    type: "string",
    required: true,
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    errorMessage: "Heure de fin valide requise (format HH:MM)",
  },
  type_cours: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: "Type de cours requis",
  },
};

/**
 * Schéma de validation pour la vérification d'article magasin
 */
export const verifierArticleMagasinSchema = {
  nom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 200,
    errorMessage: "Nom de l'article requis (2-200 caractères)",
  },
};

/**
 * Schéma de validation pour la vérification d'article magasin par catégorie
 */
export const verifierArticleMagasinCategorieSchema = {
  nom: {
    type: "string",
    required: true,
    minLength: 2,
    maxLength: 200,
    errorMessage: "Nom de l'article requis (2-200 caractères)",
  },
  categorie_id: {
    type: "number",
    required: true,
    min: 1,
    errorMessage: "ID de catégorie valide requis",
  },
};

/**
 * Schéma de validation pour la vérification de professeurs
 */
export const verifierProfesseursSchema = {
  utilisateurs: {
    type: "array",
    required: true,
    minLength: 1,
    items: {
      type: "object",
      properties: {
        nom: {
          type: "string",
          required: true,
          minLength: 2,
          maxLength: 100,
        },
        prenom: {
          type: "string",
          required: true,
          minLength: 2,
          maxLength: 100,
        },
      },
    },
    errorMessage: "Liste d'utilisateurs requise (tableau non vide)",
  },
};

/**
 * Fonction utilitaire pour valider les données selon un schéma
 */
export function validateData(data: any, schema: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const fieldRules = rules as any;
    const value = data[field];

    // Vérifier si le champ est requis
    if (fieldRules.required && (value === undefined || value === null || value === "")) {
      errors.push(fieldRules.errorMessage || `Le champ ${field} est requis`);
      continue;
    }

    // Si le champ n'est pas requis et absent, passer au suivant
    if (!fieldRules.required && (value === undefined || value === null)) {
      continue;
    }

    // Vérifier le type
    if (fieldRules.type === "string" && typeof value !== "string") {
      errors.push(`Le champ ${field} doit être une chaîne de caractères`);
      continue;
    }

    if (fieldRules.type === "number" && typeof value !== "number") {
      errors.push(`Le champ ${field} doit être un nombre`);
      continue;
    }

    if (fieldRules.type === "array" && !Array.isArray(value)) {
      errors.push(`Le champ ${field} doit être un tableau`);
      continue;
    }

    // Vérifier la longueur minimale (string ou array)
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors.push(
        `Le champ ${field} doit contenir au moins ${fieldRules.minLength} caractères/éléments`
      );
    }

    // Vérifier la longueur maximale (string)
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors.push(
        `Le champ ${field} ne doit pas dépasser ${fieldRules.maxLength} caractères`
      );
    }

    // Vérifier le pattern (regex)
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors.push(fieldRules.errorMessage || `Le champ ${field} est invalide`);
    }

    // Vérifier l'énumération
    if (fieldRules.enum && !fieldRules.enum.includes(value)) {
      errors.push(
        `Le champ ${field} doit être l'une des valeurs suivantes: ${fieldRules.enum.join(", ")}`
      );
    }

    // Vérifier min (number)
    if (fieldRules.min !== undefined && value < fieldRules.min) {
      errors.push(`Le champ ${field} doit être supérieur ou égal à ${fieldRules.min}`);
    }

    // Vérifier max (number)
    if (fieldRules.max !== undefined && value > fieldRules.max) {
      errors.push(`Le champ ${field} doit être inférieur ou égal à ${fieldRules.max}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
