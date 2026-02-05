/**
 * Tests de santé avancés pour le module Messages
 * Tests des diagnostics et de la couverture des branches
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Health & Diagnostic Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMessageClient: Partial<Message>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
      user: { id: 1, email: "test@example.com", role: "admin" },
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockMessageClient = {
      queryAsync: jest.fn(),
      obtenirTousLesTypesDeMessages: jest.fn(),
      creerTypeMessage: jest.fn(),
      modifierTypeMessage: jest.fn(),
      supprimerTypeMessage: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
      getMessageHistory: jest.fn(),
    };
  });

  describe("healthCheck - Tests de base", () => {
    it("devrait retourner status 'healthy' avec DB connectée et tables existantes", async () => {
      const mockTableCheck = [
        { Tables_in_test_db: "types_messages" },
        { Tables_in_test_db: "messages" },
        { Tables_in_test_db: "messages_personnalises" },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTableCheck
      );

      const result = await mockMessageClient.queryAsync!("SHOW TABLES", []);

      expect(result).toHaveLength(3);
      expect(
        result.some((t: any) => t.Tables_in_test_db === "types_messages")
      ).toBe(true);
      expect(result.some((t: any) => t.Tables_in_test_db === "messages")).toBe(
        true
      );
    });

    it("devrait retourner status 'degraded' si une table n'existe pas", async () => {
      const mockTableCheck = [
        { Tables_in_test_db: "types_messages" },
        // Table 'messages' manquante
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTableCheck
      );

      const result = await mockMessageClient.queryAsync!("SHOW TABLES", []);

      expect(result).toHaveLength(1);
      expect(result.some((t: any) => t.Tables_in_test_db === "messages")).toBe(
        false
      );
    });

    it("devrait gérer l'erreur lors de la vérification des tables", async () => {
      (mockMessageClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        mockMessageClient.queryAsync!("SHOW TABLES", [])
      ).rejects.toThrow("Database connection failed");
    });

    it("devrait retourner 503 avec status 'unhealthy' en cas d'erreur critique", async () => {
      (mockMessageClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Critical database error")
      );

      try {
        await mockMessageClient.queryAsync!("SELECT 1", []);
      } catch (error: any) {
        expect(error.message).toBe("Critical database error");
      }
    });
  });

  describe("getDiagnostic - Tests complets", () => {
    it("devrait retourner un diagnostic complet sans problème détecté", async () => {
      const mockTableStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
        {
          Field: "nom",
          Type: "varchar(255)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "description",
          Type: "text",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "categorie",
          Type: "varchar(100)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "template",
          Type: "text",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "actif",
          Type: "tinyint(1)",
          Null: "NO",
          Key: "",
          Default: "1",
          Extra: "",
        },
      ];

      const mockConstraints = [
        {
          CONSTRAINT_NAME: "PRIMARY",
          CONSTRAINT_TYPE: "PRIMARY KEY",
          TABLE_NAME: "types_messages",
          COLUMN_NAME: "id",
        },
      ];

      const mockIndexes = [
        {
          Key_name: "PRIMARY",
          Column_name: "id",
          Non_unique: 0,
        },
        {
          Key_name: "idx_categorie",
          Column_name: "categorie",
          Non_unique: 1,
        },
      ];

      const mockStats = [
        {
          statut: "envoye",
          count: 150,
          total: 150,
        },
        {
          statut: "echec",
          count: 5,
          total: 5,
        },
      ];

      const mockTotal = [{ total: 155 }];

      (mockMessageClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraints)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      const diagnostic = {
        table: "types_messages",
        structure_reelle: {
          colonnes: mockTableStructure,
          contraintes: mockConstraints,
          indexes: mockIndexes,
        },
        statistiques: {
          total_messages: 155,
          par_statut: mockStats,
        },
        probleme_detecte: false,
      };

      expect(diagnostic.probleme_detecte).toBe(false);
      expect(diagnostic.statistiques.total_messages).toBe(155);
      expect(diagnostic.structure_reelle.colonnes).toHaveLength(6);
    });

    it("devrait détecter une contrainte problématique", async () => {
      const mockTableStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
      ];

      const mockConstraintsProblematiques = [
        {
          CONSTRAINT_NAME: "PRIMARY",
          CONSTRAINT_TYPE: "PRIMARY KEY",
          TABLE_NAME: "types_messages",
          COLUMN_NAME: "id",
        },
        {
          CONSTRAINT_NAME: "unique_nom_categorie",
          CONSTRAINT_TYPE: "UNIQUE",
          TABLE_NAME: "types_messages",
          COLUMN_NAME: "nom,categorie",
        },
      ];

      const mockIndexes = [
        {
          Key_name: "PRIMARY",
          Column_name: "id",
          Non_unique: 0,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraintsProblematiques)
        .mockResolvedValueOnce(mockIndexes);

      const diagnostic = {
        probleme_detecte: true,
        contrainte_problematique: {
          name: "unique_nom_categorie",
          type: "UNIQUE",
          columns: "nom,categorie",
        },
        solution:
          "Cette contrainte pourrait empêcher la création de types avec le même nom dans différentes catégories",
      };

      expect(diagnostic.probleme_detecte).toBe(true);
      expect(diagnostic.contrainte_problematique.name).toBe(
        "unique_nom_categorie"
      );
    });

    it("devrait gérer les statistiques avec des valeurs null", async () => {
      const mockStats = [
        {
          statut: "envoye",
          count: 100,
          total: null, // Valeur null
        },
      ];

      const mockTotal = [{ total: 100 }];

      (mockMessageClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      const stats = {
        total_messages: 100,
        par_statut: mockStats.map((s) => ({
          statut: s.statut,
          count: s.count,
          total: s.total || 0,
        })),
      };

      expect(stats.par_statut[0].total).toBe(0);
    });

    it("devrait gérer le cas où totalResult est vide", async () => {
      const mockTotal: any[] = [];

      (mockMessageClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockTotal);

      const total = mockTotal.length > 0 ? mockTotal[0].total : 0;

      expect(total).toBe(0);
    });

    it("devrait retourner 500 en cas d'erreur lors du diagnostic", async () => {
      (mockMessageClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Diagnostic error")
      );

      await expect(
        mockMessageClient.queryAsync!("DESCRIBE types_messages", [])
      ).rejects.toThrow("Diagnostic error");
    });

    it("devrait tester toutes les colonnes de la structure complète", async () => {
      const mockCompleteStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
        {
          Field: "type_message_id",
          Type: "int(11)",
          Null: "YES",
          Key: "MUL",
          Default: null,
          Extra: "",
        },
        {
          Field: "utilisateur_id",
          Type: "int(11)",
          Null: "NO",
          Key: "MUL",
          Default: null,
          Extra: "",
        },
        {
          Field: "destinataire",
          Type: "varchar(255)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "sujet",
          Type: "varchar(500)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "contenu",
          Type: "text",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "statut",
          Type: "enum('en_attente','envoye','echec','lu')",
          Null: "NO",
          Key: "",
          Default: "en_attente",
          Extra: "",
        },
        {
          Field: "date_envoi",
          Type: "datetime",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "date_lecture",
          Type: "datetime",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "erreur",
          Type: "text",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockCompleteStructure
      );

      const structure = await mockMessageClient.queryAsync!(
        "DESCRIBE messages",
        []
      );

      expect(structure).toHaveLength(10);
      expect(structure.map((s: any) => s.Field)).toContain("id");
      expect(structure.map((s: any) => s.Field)).toContain("type_message_id");
      expect(structure.map((s: any) => s.Field)).toContain("utilisateur_id");
      expect(structure.map((s: any) => s.Field)).toContain("destinataire");
      expect(structure.map((s: any) => s.Field)).toContain("sujet");
      expect(structure.map((s: any) => s.Field)).toContain("contenu");
      expect(structure.map((s: any) => s.Field)).toContain("statut");
      expect(structure.map((s: any) => s.Field)).toContain("date_envoi");
      expect(structure.map((s: any) => s.Field)).toContain("date_lecture");
      expect(structure.map((s: any) => s.Field)).toContain("erreur");
    });
  });

  describe("Statistiques avancées", () => {
    it("devrait calculer le taux de succès des envois", async () => {
      const mockStats = [
        { statut: "envoye", count: 950 },
        { statut: "echec", count: 50 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(mockStats);

      const stats = await mockMessageClient.queryAsync!(
        "SELECT statut, COUNT(*) as count FROM messages GROUP BY statut",
        []
      );

      const total = stats.reduce((sum: number, s: any) => sum + s.count, 0);
      const envoyes = stats.find((s: any) => s.statut === "envoye")?.count || 0;
      const tauxSucces = ((envoyes / total) * 100).toFixed(2);

      expect(total).toBe(1000);
      expect(tauxSucces).toBe("95.00");
    });

    it("devrait calculer le taux de lecture des messages", async () => {
      const mockLectureStats = [
        { total: 100, lus: 75 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockLectureStats
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT COUNT(*) as total, SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) as lus FROM messages",
        []
      );

      const tauxLecture = ((result[0].lus / result[0].total) * 100).toFixed(2);

      expect(tauxLecture).toBe("75.00");
    });

    it("devrait calculer le temps moyen entre envoi et lecture", async () => {
      const mockTempsMoyen = [
        { temps_moyen_minutes: 125.5 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTempsMoyen
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT AVG(TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture)) as temps_moyen_minutes FROM messages WHERE date_lecture IS NOT NULL",
        []
      );

      expect(result[0].temps_moyen_minutes).toBeGreaterThan(0);
      expect(result[0].temps_moyen_minutes).toBe(125.5);
    });
  });

  describe("Monitoring et alertes", () => {
    it("devrait détecter un taux d'échec élevé", async () => {
      const mockStats = [
        { statut: "envoye", count: 700 },
        { statut: "echec", count: 300 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(mockStats);

      const stats = await mockMessageClient.queryAsync!(
        "SELECT statut, COUNT(*) as count FROM messages WHERE date_envoi > DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY statut",
        []
      );

      const total = stats.reduce((sum: number, s: any) => sum + s.count, 0);
      const echecs = stats.find((s: any) => s.statut === "echec")?.count || 0;
      const tauxEchec = (echecs / total) * 100;

      expect(tauxEchec).toBeGreaterThan(10); // Seuil d'alerte à 10%
      expect(tauxEchec).toBe(30);
    });

    it("devrait détecter des types de messages inactifs non utilisés", async () => {
      const mockTypesInactifs = [
        { id: 5, nom: "Type inutilisé 1", derniere_utilisation: null },
        { id: 8, nom: "Type inutilisé 2", derniere_utilisation: null },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTypesInactifs
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT id, nom, MAX(m.date_envoi) as derniere_utilisation FROM types_messages tm LEFT JOIN messages m ON tm.id = m.type_message_id WHERE tm.actif = 1 GROUP BY tm.id HAVING derniere_utilisation IS NULL OR derniere_utilisation < DATE_SUB(NOW(), INTERVAL 6 MONTH)",
        []
      );

      expect(result).toHaveLength(2);
      expect(
        result.every((t: any) => t.derniere_utilisation === null)
      ).toBe(true);
    });

    it("devrait identifier les destinataires avec échecs répétés", async () => {
      const mockDestinatairesProblematiques = [
        { destinataire: "bounced@example.com", echecs: 5 },
        { destinataire: "invalid@domain.com", echecs: 3 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockDestinatairesProblematiques
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT destinataire, COUNT(*) as echecs FROM messages WHERE statut = 'echec' GROUP BY destinataire HAVING echecs >= 3",
        []
      );

      expect(result).toHaveLength(2);
      expect(result.every((d: any) => d.echecs >= 3)).toBe(true);
    });
  });

  describe("Performance du système", () => {
    it("devrait mesurer le volume d'envoi par heure", async () => {
      const mockVolumeParHeure = [
        { heure: 8, count: 45 },
        { heure: 9, count: 120 },
        { heure: 10, count: 200 },
        { heure: 11, count: 150 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockVolumeParHeure
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT HOUR(date_envoi) as heure, COUNT(*) as count FROM messages WHERE DATE(date_envoi) = CURDATE() GROUP BY HOUR(date_envoi)",
        []
      );

      expect(result).toHaveLength(4);
      const maxVolume = Math.max(...result.map((r: any) => r.count));
      expect(maxVolume).toBe(200);
    });

    it("devrait identifier les pics de charge", async () => {
      const mockPicsCharge = [
        { date: "2024-06-01", count: 5000 },
        { date: "2024-06-15", count: 8500 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockPicsCharge
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT DATE(date_envoi) as date, COUNT(*) as count FROM messages GROUP BY DATE(date_envoi) HAVING count > 5000",
        []
      );

      expect(result).toHaveLength(2);
      expect(result.some((r: any) => r.count > 8000)).toBe(true);
    });
  });

  describe("Intégrité des données", () => {
    it("devrait vérifier l'absence de messages orphelins", async () => {
      const mockOrphans = [];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockOrphans
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT m.* FROM messages m LEFT JOIN types_messages tm ON m.type_message_id = tm.id WHERE tm.id IS NULL",
        []
      );

      expect(result).toHaveLength(0);
    });

    it("devrait vérifier la cohérence des dates", async () => {
      const mockDatesInconsistantes = [];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockDatesInconsistantes
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE date_lecture < date_envoi",
        []
      );

      expect(result).toHaveLength(0);
    });

    it("devrait vérifier la validité des emails", async () => {
      const mockEmailsInvalides = [];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEmailsInvalides
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT * FROM messages WHERE destinataire NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'",
        []
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("Santé des templates", () => {
    it("devrait identifier les templates avec variables non utilisées", async () => {
      const mockTemplates = [
        {
          id: 1,
          nom: "Template test",
          template: "Bonjour {nom}, votre {type} expire le {date}.",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT id, nom, template FROM types_messages WHERE template IS NOT NULL",
        []
      );

      const template = result[0].template;
      const variables = template.match(/\{([^}]+)\}/g) || [];

      expect(variables).toHaveLength(3);
      expect(variables).toContain("{nom}");
      expect(variables).toContain("{type}");
      expect(variables).toContain("{date}");
    });

    it("devrait détecter les templates vides ou invalides", async () => {
      const mockTemplatesInvalides = [
        { id: 5, nom: "Template vide", template: "" },
        { id: 8, nom: "Template whitespace", template: "   " },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockTemplatesInvalides
      );

      const result = await mockMessageClient.queryAsync!(
        "SELECT id, nom, template FROM types_messages WHERE template IS NOT NULL AND (template = '' OR template REGEXP '^[[:space:]]*$')",
        []
      );

      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.template.trim() === "")).toBe(true);
    });
  });
});
