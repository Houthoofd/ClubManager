/**
 * Tests d'intégration du service Auth avec vraie DB
 * Ces tests utilisent une base MySQL de test (copie de la structure de la DB principale)
 */

// IMPORTANT: Charger .env.test AVANT tout autre import
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
  path: join(__dirname, "../../../../.env.test"),
  override: true,
});

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  teardownTestDatabase,
  getTestPrisma,
} from "../../../tests/setup/testDatabase.js";
import { AuthService } from "../../../services/auth/auth.service.js";
import { PrismaClient } from "@prisma/client";

describe("Auth - Tests d'intégration avec DB", () => {
  let authService: AuthService;

  beforeAll(async () => {
    // Setup de la DB de test avant tous les tests
    await setupTestDatabase();

    // Créer une instance d'authService avec le client Prisma de test
    const testPrisma = getTestPrisma();
    authService = new AuthService(testPrisma as any);

    console.log(`🔗 [TEST] AuthService initialisé avec testPrisma`);
  });

  afterAll(async () => {
    // Nettoyage final et fermeture de la connexion
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Nettoyer avant chaque test
    const prisma = getTestPrisma();
    await prisma.utilisateurs.deleteMany({});

    console.log("🌱 [TEST] Création de l'utilisateur de test...");

    // Créer un utilisateur de test
    const createdUser = await prisma.utilisateurs.create({
      data: {
        userId: `TEST${Date.now()}`, // Génère un userId unique pour chaque test
        first_name: "John",
        last_name: "Test",
        nom_utilisateur: "johntest",
        email: "john.test@example.com",
        date_of_birth: new Date("1990-01-01"),
        password:
          "$2b$12$007h0DJcUHmkpgO3XywRwe6yQOrKsxFDeevVzRQRFawsL1QpTsJlS", // "password123" hashé avec bcrypt rounds=12
        status_id: null, // Pas de status pour les tests
        grade_id: null, // Pas de grade pour les tests
      },
    });

    console.log(
      `✅ [TEST] Utilisateur créé avec ID: ${createdUser.id}, email: ${createdUser.email}`,
    );

    // Vérifier que l'utilisateur existe bien
    const userCheck = await prisma.utilisateurs.findFirst({
      where: { email: "john.test@example.com" },
    });
    console.log(
      `🔍 [TEST] Vérification utilisateur: ${userCheck ? "TROUVÉ" : "NON TROUVÉ"}`,
    );
  });

  describe("Authentification", () => {
    it("devrait authentifier un utilisateur avec des credentials valides", async () => {
      const result = await authService.authentifier(
        "john.test@example.com",
        "password123",
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty("user");
      if (result.success && "user" in result) {
        expect(result.user.email).toBe("john.test@example.com");
        expect(result.user.firstName).toBe("John");
        expect(result.user.lastName).toBe("Test");
        expect(result.user).not.toHaveProperty("password");
      }
    });

    it("devrait rejeter les credentials invalides", async () => {
      const result = await authService.authentifier(
        "john.test@example.com",
        "wrongpassword",
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
      expect(result).not.toHaveProperty("user");
    });

    it("devrait rejeter un email inexistant", async () => {
      const result = await authService.authentifier(
        "nonexistent@example.com",
        "password123",
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });
  });

  describe("Création de compte", () => {
    it("devrait créer un nouveau compte avec des données valides", async () => {
      const input = {
        email: "newuser@example.com",
        password: "SecureP@ssw0rd123",
        first_name: "Jane",
        last_name: "Doe",
      };

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty("user");

      if (result.success && "user" in result) {
        expect(result.user.email).toBe("newuser@example.com");
        expect(result.user.firstName).toBe("Jane");
        expect(result.user.lastName).toBe("Doe");

        // Vérifier que l'utilisateur existe en DB
        const prisma = getTestPrisma();
        const user = await prisma.utilisateurs.findFirst({
          where: { email: "newuser@example.com" },
        });

        expect(user).toBeDefined();
        expect(user?.email).toBe("newuser@example.com");
        expect(user?.password).not.toBe("SecureP@ssw0rd123"); // Le mot de passe doit être hashé
      }
    });

    it("devrait rejeter un email déjà utilisé", async () => {
      const input = {
        email: "john.test@example.com", // Email déjà utilisé
        password: "AnotherP@ssw0rd123",
        first_name: "John",
        last_name: "Duplicate",
      };

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà utilisé");
    });

    it("devrait hasher le mot de passe", async () => {
      const input = {
        email: "hashtest@example.com",
        password: "TestP@ssw0rd456",
        first_name: "Hash",
        last_name: "Test",
      };

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);

      // Vérifier en DB que le mot de passe est hashé
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "hashtest@example.com" },
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe("PlainPassword123!");
      expect(user?.password.length).toBeGreaterThan(20); // Hash bcrypt fait > 20 caractères
      expect(user?.password).toMatch(/^\$2[aby]\$/); // Format bcrypt
    });
  });

  describe("Vérification email", () => {
    it("devrait retourner true pour un email existant", async () => {
      const result = await authService.verifierEmail("john.test@example.com");

      expect(result.exists).toBe(true);
      expect(result.email).toBe("john.test@example.com");
    });

    it("devrait retourner false pour un email inexistant", async () => {
      const result = await authService.verifierEmail("nonexistent@example.com");

      expect(result.exists).toBe(false);
    });

    it("devrait être insensible à la casse", async () => {
      const result = await authService.verifierEmail("JOHN.TEST@EXAMPLE.COM");

      expect(result.exists).toBe(true);
    });
  });

  describe("Changement de mot de passe", () => {
    it("devrait changer le mot de passe avec succès", async () => {
      // Récupérer l'ID du user créé
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "john.test@example.com" },
      });

      const input = {
        userId: user!.id,
        currentPassword: "password123",
        newPassword: "NewSecureP@ssw0rd456",
      };

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(true);

      // Vérifier que le nouveau mot de passe fonctionne
      const authResult = await authService.authentifier(
        "john.test@example.com",
        "NewSecureP@ssw0rd456",
      );
      expect(authResult.success).toBe(true);

      // Vérifier que l'ancien mot de passe ne fonctionne plus
      const oldAuthResult = await authService.authentifier(
        "john.test@example.com",
        "password123",
      );
      expect(oldAuthResult.success).toBe(false);
    });

    it("devrait rejeter un mot de passe actuel incorrect", async () => {
      // Récupérer l'ID du user créé
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "john.test@example.com" },
      });

      const input = {
        userId: user!.id,
        currentPassword: "wrongpassword",
        newPassword: "NewSecureP@ssw0rd456",
      };

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });

    it("devrait rejeter un utilisateur inexistant", async () => {
      const input = {
        userId: 99999,
        currentPassword: "password123",
        newPassword: "NewSecureP@ssw0rd456",
      };

      const result = await authService.changerMotDePasse(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Utilisateur non trouvé");
    });
  });

  describe("Récupération de mot de passe", () => {
    it("devrait créer un token de récupération", async () => {
      const result = await authService.demanderRecuperationMotDePasse(
        "john.test@example.com",
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("récupération");

      // Vérifier qu'un token a été créé en DB
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "john.test@example.com" },
      });

      // Note: Selon l'implémentation, vérifier la table des tokens
      expect(user).toBeDefined();
    });

    it("devrait accepter un email inexistant sans révéler l'information", async () => {
      const result = await authService.demanderRecuperationMotDePasse(
        "nonexistent@example.com",
      );

      // La réponse doit être la même pour ne pas révéler si l'email existe
      expect(result.success).toBe(true);
      expect(result.message).toContain("Si cet email existe");
    });

    it("devrait réinitialiser le mot de passe avec un token valide", async () => {
      // D'abord créer une demande de récupération
      await authService.demanderRecuperationMotDePasse("john.test@example.com");

      // TODO: Récupérer le token généré (dépend de l'implémentation)
      // Pour cet exemple, on suppose qu'on peut récupérer le token

      // const token = await getRecoveryToken('john.test@example.com');
      // const result = await authService.reinitialiserMotDePasse(token, 'NewP@ssw0rd789');

      // expect(result.success).toBe(true);

      // Vérifier que le nouveau mot de passe fonctionne
      // const authResult = await authService.authentifier('john.test@example.com', 'NewP@ssw0rd789');
      // expect(authResult.success).toBe(true);
    });
  });

  describe("Statistiques", () => {
    it("devrait retourner les statistiques correctes", async () => {
      // Créer quelques utilisateurs supplémentaires
      const prisma = getTestPrisma();
      await prisma.utilisateurs.createMany({
        data: [
          {
            userId: `STAT1${Date.now()}`,
            first_name: "User",
            last_name: "2",
            nom_utilisateur: "user2",
            email: "user2@example.com",
            date_of_birth: new Date("1990-01-01"),
            password: "hashed",
            status_id: null,
            grade_id: null,
          },
          {
            userId: `STAT2${Date.now()}`,
            first_name: "User",
            last_name: "3",
            nom_utilisateur: "user3",
            email: "user3@example.com",
            date_of_birth: new Date("1990-01-01"),
            password: "hashed",
            status_id: null,
            grade_id: null,
          },
        ],
      });

      const result = await authService.obtenirStatistiques();

      expect(result).toHaveProperty("totalUsers");
      expect(result.totalUsers).toBeGreaterThanOrEqual(3);
      expect(typeof result.totalUsers).toBe("number");
    });
  });

  describe("Informations de sécurité", () => {
    it("devrait retourner les informations de sécurité d'un utilisateur", async () => {
      // Récupérer l'ID du user créé
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "john.test@example.com" },
      });

      const result = await authService.obtenirInformationsSecurite(user!.id);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(user!.id);
        expect(result.email).toBe("john.test@example.com");
      }
    });

    it("devrait retourner null pour un utilisateur inexistant", async () => {
      const result = await authService.obtenirInformationsSecurite(99999);

      expect(result).toBeNull();
    });
  });

  describe("Nettoyage des tokens", () => {
    it("devrait nettoyer les tokens expirés", async () => {
      // Créer des tokens expirés (selon l'implémentation)
      // TODO: Créer des tokens de test expirés

      const result = await authService.nettoyerTokensExpires();

      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");
      expect(result.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Validation des données", () => {
    it("devrait normaliser les emails en minuscules", async () => {
      const input = {
        email: "UPPERCASE@EXAMPLE.COM",
        password: "SecureP@ssw0rd123",
        first_name: "Test",
        last_name: "User",
      };

      const result = await authService.creerCompte(input);

      if (result.success && "user" in result) {
        expect(result.user.email).toBe("uppercase@example.com");
      }

      // Vérifier en DB
      const prisma = getTestPrisma();
      const user = await prisma.utilisateurs.findFirst({
        where: { email: "uppercase@example.com" },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe("uppercase@example.com");
    });

    it("devrait trimmer les espaces dans les noms", async () => {
      const input = {
        email: "trimtest@example.com",
        password: "SecureP@ssw0rd123",
        first_name: "  John  ",
        last_name: "  Doe  ",
      };

      const result = await authService.creerCompte(input);

      if (result.success && "user" in result) {
        expect(result.user.firstName).toBe("John");
        expect(result.user.lastName).toBe("Doe");
      }
    });
  });

  describe("Sécurité et protection", () => {
    it("ne devrait jamais retourner le hash du mot de passe", async () => {
      const result = await authService.authentifier(
        "john.test@example.com",
        "password123",
      );

      if (result.success && "user" in result) {
        expect(result.user).not.toHaveProperty("password");
        expect(result.user).not.toHaveProperty("password_hash");
        expect(result.user).not.toHaveProperty("passwordHash");
      }
    });

    it("devrait protéger contre les injections SQL", async () => {
      const maliciousEmail = "test@example.com' OR '1'='1";

      const result = await authService.authentifier(maliciousEmail, "password");

      expect(result.success).toBe(false);
      // Ne devrait pas causer d'erreur SQL
    });

    it("devrait gérer les caractères spéciaux dans les noms", async () => {
      const input = {
        email: "special@example.com",
        password: "SecureP@ssw0rd123",
        first_name: "Jean-François",
        last_name: "O'Brien",
      };

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(true);
      if (result.success && "user" in result) {
        expect(result.user.firstName).toBe("Jean-François");
        expect(result.user.lastName).toBe("O'Brien");
      }
    });
  });

  describe("Transactions et cohérence", () => {
    it("devrait maintenir la cohérence des données lors d'erreurs", async () => {
      const prisma = getTestPrisma();
      // Compter les utilisateurs avant
      const countBefore = await prisma.utilisateurs.count();

      // Tenter une création qui devrait échouer
      const input = {
        email: "john.test@example.com", // Email déjà existant
        password: "SecureP@ssw0rd123",
        first_name: "Should",
        last_name: "Fail",
      };

      await authService.creerCompte(input);

      // Compter les utilisateurs après
      const countAfter = await prisma.utilisateurs.count();

      // Le compte ne devrait pas avoir changé
      expect(countAfter).toBe(countBefore);
    });
  });

  describe("Performance et optimisation", () => {
    it("devrait gérer plusieurs authentifications simultanées", async () => {
      const promises = Array.from({ length: 10 }, () =>
        authService.authentifier("john.test@example.com", "password123"),
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it("devrait gérer plusieurs créations de compte simultanées", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        authService.creerCompte({
          email: `concurrent${i}@example.com`,
          password: "SecureP@ssw0rd123",
          first_name: "Concurrent",
          last_name: `User${i}`,
        }),
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Vérifier en DB
      const prisma = getTestPrisma();
      const count = await prisma.utilisateurs.count({
        where: {
          email: { startsWith: "concurrent" },
        },
      });

      expect(count).toBe(5);
    });
  });
});
