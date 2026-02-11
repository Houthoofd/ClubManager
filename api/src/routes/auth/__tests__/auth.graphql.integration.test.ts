/**
 * Tests d'intégration GraphQL pour l'authentification
 * Teste les endpoints GraphQL du module auth
 */

import { fileURLToPath } from "url";
import path from "path";
import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "../../../tests/setup/testDatabase.js";
import { AuthService } from "../core/services/auth.service.js";
import { prisma } from "../../../infrastructure/database/prisma-client.js";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Auth - Tests d'intégration GraphQL", () => {
  let yoga: ReturnType<typeof createYoga>;
  let authService: AuthService;
  let testUserId: number;
  let testEmail: string;

  beforeAll(async () => {
    await setupTestDatabase();
    yoga = createYoga({ schema });
    authService = new AuthService(prisma);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Créer un utilisateur de test
    testEmail = `test-${Date.now()}@example.com`;
    const result = await authService.creerCompte({
      email: testEmail,
      password: "Test123!@#",
      first_name: "Test",
      last_name: "User",
      genre_id: 1,
      grade_id: 1,
    });

    if (result.success && result.user) {
      testUserId = result.user.id;
    }
  });

  describe("Query: checkEmail", () => {
    it("devrait retourner exists=true pour un email existant", async () => {
      const query = `
        query CheckEmail($email: String!) {
          checkEmail(email: $email) {
            exists
            email
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { email: testEmail },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.checkEmail.exists).toBe(true);
      expect(result.data.checkEmail.email).toBe(testEmail);
    });

    it("devrait retourner exists=false pour un email inexistant", async () => {
      const query = `
        query CheckEmail($email: String!) {
          checkEmail(email: $email) {
            exists
            email
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { email: "nonexistent@example.com" },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.checkEmail.exists).toBe(false);
    });
  });

  describe("Query: securityInfo", () => {
    it("devrait retourner les informations de sécurité d'un utilisateur", async () => {
      const query = `
        query SecurityInfo($userId: Int!) {
          securityInfo(userId: $userId) {
            id
            email
            firstName
            lastName
            dateInscription
            nbPaiements
            nbInscriptions
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { userId: testUserId },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.securityInfo).toBeTruthy();
      expect(result.data.securityInfo.id).toBe(testUserId);
      expect(result.data.securityInfo.email).toBeTruthy();
      expect(result.data.securityInfo.nbPaiements).toBeGreaterThanOrEqual(0);
    });

    it("devrait retourner null pour un utilisateur inexistant", async () => {
      const query = `
        query SecurityInfo($userId: Int!) {
          securityInfo(userId: $userId) {
            id
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { userId: 999999 },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.securityInfo).toBeNull();
    });
  });

  describe("Query: authStats", () => {
    it("devrait retourner les statistiques d'authentification", async () => {
      const query = `
        query AuthStats {
          authStats {
            totalUsers
            activeUsers
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.authStats).toBeTruthy();
      expect(result.data.authStats.totalUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Mutation: register", () => {
    it("devrait créer un nouveau compte avec succès", async () => {
      const uniqueEmail = `new-user-${Date.now()}@example.com`;
      const mutation = `
        mutation Register($input: CreateUserInput!) {
          register(input: $input) {
            success
            message
            token
            user {
              id
              email
            }
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: uniqueEmail,
              password: "SecurePass123!",
              first_name: "New",
              last_name: "User",
              genre_id: 1,
              grade_id: 1,
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.register.success).toBe(true);
      expect(result.data.register.user).toBeTruthy();
      expect(result.data.register.user.email).toBe(uniqueEmail.toLowerCase());
      expect(result.data.register.user.id).toBeGreaterThan(0);

      // Vérifier que le token JWT est valide
      expect(result.data.register.token).toBeTruthy();
      const token = result.data.register.token;
      const secret = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.email).toBe(uniqueEmail.toLowerCase());
    });

    it("devrait rejeter un email déjà utilisé", async () => {
      const mutation = `
        mutation Register($input: CreateUserInput!) {
          register(input: $input) {
            success
            message
            token
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: testEmail,
              password: "SecurePass123!",
              first_name: "Duplicate",
              last_name: "User",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.register.success).toBe(false);
      expect(result.data.register.message).toContain("déjà utilisé");
    });

    it("devrait rejeter un mot de passe faible", async () => {
      const mutation = `
        mutation Register($input: CreateUserInput!) {
          register(input: $input) {
            success
            message
            token
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: `weak-${Date.now()}@example.com`,
              password: "weak",
              first_name: "Weak",
              last_name: "Password",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.register.success).toBe(false);
      expect(result.data.register.message).toBeTruthy();
    });

    it("devrait rejeter un email invalide", async () => {
      const mutation = `
        mutation Register($input: CreateUserInput!) {
          register(input: $input) {
            success
            message
            token
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: "invalid-email",
              password: "SecurePass123!",
              first_name: "Invalid",
              last_name: "Email",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.register.success).toBe(false);
      expect(result.data.register.message).toContain("invalide");
    });
  });

  describe("Mutation: login", () => {
    it("devrait authentifier un utilisateur avec des credentials valides", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
            message
            token
            user {
              id
              email
            }
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: testEmail,
            password: "Test123!@#",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.login.success).toBe(true);
      expect(result.data.login.token).toBeTruthy();
      expect(result.data.login.user.email).toBe(testEmail);

      // Vérifier que le token JWT est valide
      const token = result.data.login.token;
      expect(token).toBeTruthy();

      const secret = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.id).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });

    it("devrait rejeter des credentials invalides", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: testEmail,
            password: "WrongPassword123!",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.login.success).toBe(false);
      expect(result.data.login.message).toContain("incorrect");
    });

    it("devrait rejeter un email inexistant", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: "nonexistent@example.com",
            password: "Test123!@#",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.login.success).toBe(false);
    });
  });

  describe("Mutation: changePassword", () => {
    it("devrait changer le mot de passe avec succès", async () => {
      const mutation = `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              userId: testUserId,
              currentPassword: "Test123!@#",
              newPassword: "NewSecure123!@#",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.changePassword.success).toBe(true);

      // Vérifier que le nouveau mot de passe fonctionne
      const loginResult = await authService.authentifier(
        testEmail,
        "NewSecure123!@#",
      );
      expect(loginResult.success).toBe(true);
    });

    it("devrait rejeter un mot de passe actuel incorrect", async () => {
      const mutation = `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              userId: testUserId,
              currentPassword: "WrongPassword!",
              newPassword: "NewSecure123!@#",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.changePassword.success).toBe(false);
      expect(result.data.changePassword.message).toContain("incorrect");
    });

    it("devrait rejeter un nouveau mot de passe faible", async () => {
      const mutation = `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              userId: testUserId,
              currentPassword: "Test123!@#",
              newPassword: "weak",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.changePassword.success).toBe(false);
    });

    it("devrait rejeter si le nouveau mot de passe est identique à l'ancien", async () => {
      const mutation = `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              userId: testUserId,
              currentPassword: "Test123!@#",
              newPassword: "Test123!@#",
            },
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.changePassword.success).toBe(false);
      expect(result.data.changePassword.message).toContain("différent");
    });
  });

  describe("Mutation: requestPasswordReset", () => {
    it("devrait créer une demande de récupération pour un email existant", async () => {
      const mutation = `
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { email: testEmail },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.requestPasswordReset.success).toBe(true);
      expect(result.data.requestPasswordReset.message).toBeTruthy();
    });

    it("devrait accepter un email inexistant sans révéler l'information", async () => {
      const mutation = `
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { email: "nonexistent@example.com" },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.requestPasswordReset.success).toBe(true);
    });
  });

  describe("Mutation: resetPassword", () => {
    it("devrait réinitialiser le mot de passe avec un token valide", async () => {
      // D'abord, créer une demande de récupération
      await authService.demanderRecuperationMotDePasse(testEmail);

      // Récupérer le token (dans un vrai scénario, il serait envoyé par email)
      const user = await prisma.utilisateurs.findFirst({
        where: { email: testEmail },
        select: { id: true },
      });

      const resetToken = await prisma.password_reset_tokens.findFirst({
        where: {
          utilisateur_id: user!.id,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        select: { token: true },
      });

      expect(resetToken).toBeTruthy();

      const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            token: resetToken!.token,
            newPassword: "ResetPass123!@#",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.resetPassword.success).toBe(true);

      // Vérifier que le nouveau mot de passe fonctionne
      const loginResult = await authService.authentifier(
        testEmail,
        "ResetPass123!@#",
      );
      expect(loginResult.success).toBe(true);
    });

    it("devrait rejeter un token invalide", async () => {
      const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            token: "invalid-token-123",
            newPassword: "NewPass123!@#",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.resetPassword.success).toBe(false);
    });

    it("devrait rejeter un mot de passe faible", async () => {
      await authService.demanderRecuperationMotDePasse(testEmail);

      const user = await prisma.utilisateurs.findFirst({
        where: { email: testEmail },
        select: { id: true },
      });

      const resetToken = await prisma.password_reset_tokens.findFirst({
        where: {
          utilisateur_id: user!.id,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        select: { token: true },
      });

      const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            token: resetToken!.token,
            newPassword: "weak",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.resetPassword.success).toBe(false);
    });
  });

  describe("Mutation: cleanExpiredTokens", () => {
    it("devrait nettoyer les tokens expirés", async () => {
      const mutation = `
        mutation CleanExpiredTokens {
          cleanExpiredTokens {
            count
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.cleanExpiredTokens).toBeTruthy();
      expect(result.data.cleanExpiredTokens.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Mutation: createManualRecovery", () => {
    it("devrait créer une demande de récupération manuelle", async () => {
      const mutation = `
        mutation CreateManualRecovery(
          $userId: Int!
          $reason: String!
          $verificationData: String!
        ) {
          createManualRecovery(
            userId: $userId
            reason: $reason
            verificationData: $verificationData
          ) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            userId: testUserId,
            reason: "Compte bloqué",
            verificationData: JSON.stringify({
              phone: "0123456789",
              birthDate: "1990-01-01",
            }),
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.createManualRecovery.success).toBe(true);
      expect(result.data.createManualRecovery.message).toBeTruthy();
    });
  });

  describe("Sécurité et validation", () => {
    it("ne devrait jamais retourner le hash du mot de passe", async () => {
      const mutation = `
        mutation Register($input: CreateUserInput!) {
          register(input: $input) {
            success
            user {
              id
              email
              nom
              prenom
            }
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email: `security-test-${Date.now()}@example.com`,
              password: "SecurePass123!",
              first_name: "Security",
              last_name: "Test",
            },
          },
        }),
      });

      const result = await response.json();
      const responseText = JSON.stringify(result);
      expect(responseText).not.toContain("$2");
      expect(responseText).not.toContain("password");
    });

    it("devrait protéger contre les injections dans les emails", async () => {
      const maliciousEmail = "test'; DROP TABLE utilisateurs; --";
      const query = `
        query CheckEmail($email: String!) {
          checkEmail(email: $email) {
            exists
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { email: maliciousEmail },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.checkEmail.exists).toBe(false);

      // Vérifier que la table existe toujours
      const count = await prisma.utilisateurs.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const query = `
        query CheckEmail($email: String!) {
          checkEmail(email: $email) {
            exists
          }
        }
      `;

      const promises = Array.from({ length: 10 }, (_, i) =>
        yoga.fetch("http://localhost/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            variables: { email: `test${i}@example.com` },
          }),
        }),
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      results.forEach((result) => {
        expect(result.errors).toBeUndefined();
        expect(result.data.checkEmail).toBeTruthy();
      });
    });
  });

  describe("Refresh Tokens - Tests GraphQL", () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Créer un refresh token valide pour les tests
      const result = await authService.authentifier(
        testEmail,
        "Test123!@#",
        {},
      );
      validRefreshToken = result.refreshToken || "";
    });

    it("devrait retourner un refresh token lors du login", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
            message
            token
            refreshToken
            user {
              id
              email
              prenom
              nom
            }
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: testEmail,
            password: "Test123!@#",
          },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.login.success).toBe(true);
      expect(result.data.login.token).toBeDefined();
      expect(result.data.login.refreshToken).toBeDefined();
      expect(result.data.login.refreshToken).toHaveLength(128);
    });

    it("devrait renouveler les tokens avec succès", async () => {
      const mutation = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            success
            message
            accessToken
            refreshToken
            expiresIn
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { refreshToken: validRefreshToken },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.refreshToken.success).toBe(true);
      expect(result.data.refreshToken.accessToken).toBeDefined();
      expect(result.data.refreshToken.refreshToken).toBeDefined();
      expect(result.data.refreshToken.expiresIn).toBeGreaterThan(0);
      expect(result.data.refreshToken.refreshToken).not.toBe(validRefreshToken);
    });

    it("devrait échouer avec un token invalide", async () => {
      const mutation = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { refreshToken: "invalid-token-123" },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.refreshToken.success).toBe(false);
      expect(result.data.refreshToken.message).toContain("invalide");
    });

    it("devrait révoquer un refresh token", async () => {
      const mutation = `
        mutation RevokeRefreshToken($refreshToken: String!) {
          revokeRefreshToken(refreshToken: $refreshToken) {
            success
            message
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { refreshToken: validRefreshToken },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.revokeRefreshToken.success).toBe(true);

      // Vérifier que le token est révoqué en DB
      const token = await prisma.refresh_tokens.findUnique({
        where: { token: validRefreshToken },
      });
      expect(token?.revoked_at).not.toBeNull();
    });

    it("devrait révoquer tous les tokens d'un utilisateur", async () => {
      // Créer plusieurs tokens
      await authService.authentifier(testEmail, "Test123!@#", {});
      await authService.authentifier(testEmail, "Test123!@#", {});

      const mutation = `
        mutation RevokeAllUserTokens($userId: Int!) {
          revokeAllUserTokens(userId: $userId) {
            success
            message
            count
          }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { userId: testUserId },
        }),
      });

      const result = await response.json();
      expect(result.errors).toBeUndefined();
      expect(result.data.revokeAllUserTokens.success).toBe(true);
      expect(result.data.revokeAllUserTokens.count).toBeGreaterThan(0);
    });

    it("ne devrait pas pouvoir réutiliser un token révoqué", async () => {
      const refreshMutation = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            success
            refreshToken
          }
        }
      `;

      // Premier refresh (révoque le token)
      const firstResponse = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: refreshMutation,
          variables: { refreshToken: validRefreshToken },
        }),
      });

      const firstResult = await firstResponse.json();
      expect(firstResult.data.refreshToken.success).toBe(true);

      // Deuxième tentative avec le même token (déjà révoqué)
      const secondResponse = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: refreshMutation,
          variables: { refreshToken: validRefreshToken },
        }),
      });

      const secondResult = await secondResponse.json();
      expect(secondResult.data.refreshToken.success).toBe(false);
    });
  });

  describe("Rate Limiting - Tests GraphQL", () => {
    const rateLimitEmail = `ratelimit-${Date.now()}@example.com`;

    beforeEach(async () => {
      // Créer un utilisateur de test pour rate limiting
      await authService.creerCompte({
        email: rateLimitEmail,
        password: "RateLimit123!@#",
        first_name: "Rate",
        last_name: "Limit",
      });

      // Nettoyer les tentatives précédentes
      await prisma.auth_attempts.deleteMany({
        where: { email: rateLimitEmail },
      });
    });

    it("devrait enregistrer les tentatives en DB", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
          }
        }
      `;

      await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: rateLimitEmail,
            password: "WrongPassword123!",
          },
        }),
      });

      // Vérifier en DB
      const attempts = await prisma.auth_attempts.count({
        where: { email: rateLimitEmail },
      });

      expect(attempts).toBeGreaterThan(0);
    });

    it("devrait bloquer après plusieurs tentatives échouées", async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            success
            message
          }
        }
      `;

      // 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        await yoga.fetch("http://localhost/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: mutation,
            variables: {
              email: rateLimitEmail,
              password: "WrongPassword123!",
            },
          }),
        });
      }

      // 6ème tentative devrait être bloquée
      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email: rateLimitEmail,
            password: "WrongPassword123!",
          },
        }),
      });

      const result = await response.json();
      expect(result.data.login.success).toBe(false);
      expect(result.data.login.message).toContain("tentatives");
    });
  });
});
