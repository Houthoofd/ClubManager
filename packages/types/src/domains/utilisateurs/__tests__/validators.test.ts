/**
 * Tests unitaires pour les validators Zod du domaine Utilisateurs
 * @module __tests__/domains/utilisateurs.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // User schemas
  userSchema,
  userInscriptionSchema,
  utilisateurInscriptionSchema,
  inscriptionUtilisateurSchema,
  miseAJourUtilisateurSchema,
  suppressionUtilisateurSchema,
  // Login schemas
  userDataLoginSchema,
  userDataLoginByUserIdSchema,
  connexionUserIdSchema,
  connexionEmailSchema,
  // Search schemas
  userSearchByEmailSchema,
  rechercheEmailSchema,
  // Verification schemas
  verifierUtilisateurSchema,
  validationTokenSchema,
  // Reference schemas
  abonnementSchema,
  gradeSchema,
  genresSchema,
  utilisateurIdParamSchema,
} from "../validators.js";

// ============================================================================
// USER INSCRIPTION SCHEMAS TESTS
// ============================================================================

describe("Utilisateurs Validators - inscriptionUtilisateurSchema", () => {
  it("should validate valid user inscription", () => {
    const validInscription = {
      prenom: "Jean",
      nom: "Dupont",
      nom_utilisateur: "jdupont",
      email: "jean.dupont@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
      grade_id: 1,
      abonnement_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(validInscription);
    expect(result.success).toBe(true);
  });

  it("should reject missing prenom", () => {
    const invalid = {
      nom: "Dupont",
      nom_utilisateur: "jdupont",
      email: "jean@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing nom", () => {
    const invalid = {
      prenom: "Jean",
      nom_utilisateur: "jdupont",
      email: "jean@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject short nom_utilisateur", () => {
    const invalid = {
      prenom: "Jean",
      nom: "Dupont",
      nom_utilisateur: "jd",
      email: "jean@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const invalid = {
      prenom: "Jean",
      nom: "Dupont",
      nom_utilisateur: "jdupont",
      email: "not-an-email",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const invalid = {
      prenom: "Jean",
      nom: "Dupont",
      nom_utilisateur: "jdupont",
      email: "jean@example.com",
      password: "12345",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    };

    const result = inscriptionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should accept nullable grade_id", () => {
    const valid = {
      prenom: "Jean",
      nom: "Dupont",
      nom_utilisateur: "jdupont",
      email: "jean@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
      grade_id: null,
    };

    const result = inscriptionUtilisateurSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// USER LOGIN SCHEMAS TESTS
// ============================================================================

describe("Utilisateurs Validators - userDataLoginSchema", () => {
  it("should validate valid login credentials", () => {
    const validLogin = {
      email: "user@example.com",
      password: "password123",
    };

    const result = userDataLoginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalid = {
      email: "not-an-email",
      password: "password123",
    };

    const result = userDataLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const invalid = {
      email: "user@example.com",
    };

    const result = userDataLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalid = {
      email: "user@example.com",
      password: "",
    };

    const result = userDataLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - userDataLoginByUserIdSchema", () => {
  it("should validate valid userId login", () => {
    const validLogin = {
      userId: "user123",
      password: "password123",
    };

    const result = userDataLoginByUserIdSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should reject missing userId", () => {
    const invalid = {
      password: "password123",
    };

    const result = userDataLoginByUserIdSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject empty userId", () => {
    const invalid = {
      userId: "",
      password: "password123",
    };

    const result = userDataLoginByUserIdSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - connexionEmailSchema", () => {
  it("should validate email connection", () => {
    const valid = {
      email: "user@example.com",
      password: "password",
    };

    const result = connexionEmailSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalid = {
      email: "invalid",
      password: "password",
    };

    const result = connexionEmailSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - connexionUserIdSchema", () => {
  it("should validate userId connection", () => {
    const valid = {
      userId: "user-id-123",
      password: "password",
    };

    const result = connexionUserIdSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// USER SEARCH SCHEMAS TESTS
// ============================================================================

describe("Utilisateurs Validators - userSearchByEmailSchema", () => {
  it("should validate valid email search", () => {
    const valid = {
      email: "user@example.com",
    };

    const result = userSearchByEmailSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalid = {
      email: "not-an-email",
    };

    const result = userSearchByEmailSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalid = {
      email: "",
    };

    const result = userSearchByEmailSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - rechercheEmailSchema", () => {
  it("should validate email search", () => {
    const valid = {
      email: "search@example.com",
    };

    const result = rechercheEmailSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// USER UPDATE SCHEMA TESTS
// ============================================================================

describe("Utilisateurs Validators - miseAJourUtilisateurSchema", () => {
  it("should validate partial user update", () => {
    const validUpdate = {
      email: "newemail@example.com",
    };

    const result = miseAJourUtilisateurSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should accept date_naissance in YYYY-MM-DD format", () => {
    const validUpdate = {
      date_naissance: "1990-05-15",
    };

    const result = miseAJourUtilisateurSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should reject invalid date format", () => {
    const invalid = {
      date_naissance: "15/05/1990",
    };

    const result = miseAJourUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should accept multiple fields update", () => {
    const validUpdate = {
      email: "newemail@example.com",
      date_naissance: "1990-05-15",
      genres: 1,
      grades: 2,
    };

    const result = miseAJourUtilisateurSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should accept empty object (no updates)", () => {
    const validUpdate = {};

    const result = miseAJourUtilisateurSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalid = {
      email: "not-valid-email",
    };

    const result = miseAJourUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// USER DELETION SCHEMA TESTS
// ============================================================================

describe("Utilisateurs Validators - suppressionUtilisateurSchema", () => {
  it("should validate user deletion", () => {
    const valid = {
      utilisateurId: 123,
    };

    const result = suppressionUtilisateurSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept optional isConfirm flag", () => {
    const valid = {
      utilisateurId: 123,
      isConfirm: true,
    };

    const result = suppressionUtilisateurSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative utilisateurId", () => {
    const invalid = {
      utilisateurId: -1,
    };

    const result = suppressionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject zero utilisateurId", () => {
    const invalid = {
      utilisateurId: 0,
    };

    const result = suppressionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing utilisateurId", () => {
    const invalid = {};

    const result = suppressionUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// VERIFICATION SCHEMAS TESTS
// ============================================================================

describe("Utilisateurs Validators - verifierUtilisateurSchema", () => {
  it("should validate user verification data", () => {
    const valid = {
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "1990-05-15",
    };

    const result = verifierUtilisateurSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid date format", () => {
    const invalid = {
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "15/05/1990",
    };

    const result = verifierUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing nom", () => {
    const invalid = {
      prenom: "Jean",
      date_naissance: "1990-05-15",
    };

    const result = verifierUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing prenom", () => {
    const invalid = {
      nom: "Dupont",
      date_naissance: "1990-05-15",
    };

    const result = verifierUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing date_naissance", () => {
    const invalid = {
      nom: "Dupont",
      prenom: "Jean",
    };

    const result = verifierUtilisateurSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - validationTokenSchema", () => {
  it("should validate token validation data", () => {
    const valid = {
      token: "validation-token-123",
      userId: "user-123",
    };

    const result = validationTokenSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing token", () => {
    const invalid = {
      userId: "user-123",
    };

    const result = validationTokenSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject empty token", () => {
    const invalid = {
      token: "",
      userId: "user-123",
    };

    const result = validationTokenSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing userId", () => {
    const invalid = {
      token: "validation-token-123",
    };

    const result = validationTokenSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// REFERENCE SCHEMAS TESTS
// ============================================================================

describe("Utilisateurs Validators - abonnementSchema", () => {
  it("should validate valid abonnement", () => {
    const valid = {
      id: 1,
      nom_plan: "Premium",
    };

    const result = abonnementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative id", () => {
    const invalid = {
      id: -1,
      nom_plan: "Premium",
    };

    const result = abonnementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject empty nom_plan", () => {
    const invalid = {
      id: 1,
      nom_plan: "",
    };

    const result = abonnementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - gradeSchema", () => {
  it("should validate valid grade", () => {
    const valid = {
      id: 1,
      grade_id: "ceinture-noire",
    };

    const result = gradeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing grade_id", () => {
    const invalid = {
      id: 1,
    };

    const result = gradeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - genresSchema", () => {
  it("should validate valid genre", () => {
    const valid = {
      id: 1,
      genre_name: "Homme",
    };

    const result = genresSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject empty genre_name", () => {
    const invalid = {
      id: 1,
      genre_name: "",
    };

    const result = genresSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Utilisateurs Validators - utilisateurIdParamSchema", () => {
  it("should validate and transform valid id string", () => {
    const valid = {
      id: "123",
    };

    const result = utilisateurIdParamSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.id).toBe("number");
      expect(result.data.id).toBe(123);
    }
  });

  it("should reject non-numeric id", () => {
    const invalid = {
      id: "abc",
    };

    const result = utilisateurIdParamSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should accept negative id string", () => {
    const valid = {
      id: "-5",
    };

    const result = utilisateurIdParamSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should handle whitespace in id string", () => {
    const valid = {
      id: "  123  ",
    };

    const result = utilisateurIdParamSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(123);
    }
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Utilisateurs Validators - Edge Cases", () => {
  it("should handle various email formats", () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user_name@example-domain.com",
    ];

    validEmails.forEach((email) => {
      const result = userSearchByEmailSchema.safeParse({ email });
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid email formats", () => {
    const invalidEmails = [
      "invalid",
      "@example.com",
      "user@",
      "user @example.com",
      "user@example",
    ];

    invalidEmails.forEach((email) => {
      const result = userSearchByEmailSchema.safeParse({ email });
      expect(result.success).toBe(false);
    });
  });

  it("should handle date boundary cases", () => {
    const dates = ["1900-01-01", "2024-12-31", "2000-02-29"];

    dates.forEach((date) => {
      const result = verifierUtilisateurSchema.safeParse({
        nom: "Test",
        prenom: "User",
        date_naissance: date,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should handle long names", () => {
    const longName = "A".repeat(100);
    const result = inscriptionUtilisateurSchema.safeParse({
      prenom: longName,
      nom: longName,
      nom_utilisateur: "username",
      email: "user@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    });

    expect(result.success).toBe(true);
  });

  it("should handle special characters in names", () => {
    const result = inscriptionUtilisateurSchema.safeParse({
      prenom: "Jean-Pierre",
      nom: "D'Alembert",
      nom_utilisateur: "jdalembert",
      email: "jp@example.com",
      password: "password123",
      genre_id: 1,
      date_naissance: "1990-05-15",
      status_id: 1,
    });

    expect(result.success).toBe(true);
  });
});
