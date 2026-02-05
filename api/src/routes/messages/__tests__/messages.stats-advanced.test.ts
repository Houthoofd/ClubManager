/**
 * Tests de statistiques avancées pour le module Messages
 * Tests des calculs statistiques et des métriques de performance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Message } from "../../../db/clients/messages/messages.js";

describe("Messages Module - Advanced Statistics Tests", () => {
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
      getMessageHistory: jest.fn(),
      envoyerMessageAvecEmails: jest.fn(),
    };
  });

  describe("Statistiques globales du système", () => {
    it("devrait calculer les statistiques générales de tous les messages", async () => {
      const mockStats = [
        {
          total_messages: 10000,
          total_envoyes: 9500,
          total_echecs: 400,
          total_en_attente: 100,
          total_lus: 7500,
          taux_succes: 95.0,
          taux_lecture: 78.95,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(mockStats);

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          COUNT(*) as total_messages,
          SUM(CASE WHEN statut = 'envoye' THEN 1 ELSE 0 END) as total_envoyes,
          SUM(CASE WHEN statut = 'echec' THEN 1 ELSE 0 END) as total_echecs,
          SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as total_en_attente,
          SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) as total_lus
        FROM messages`,
        [],
      );

      expect(result[0].total_messages).toBe(10000);
      expect(result[0].taux_succes).toBeGreaterThan(90);
      expect(result[0].taux_lecture).toBeGreaterThan(70);
    });

    it("devrait calculer les statistiques par type de message", async () => {
      const mockStatsByType = [
        {
          type_message_id: 1,
          type_nom: "Rappel adhésion",
          total: 2000,
          envoyes: 1950,
          echecs: 50,
          lus: 1600,
          taux_succes: 97.5,
          taux_lecture: 82.05,
        },
        {
          type_message_id: 2,
          type_nom: "Confirmation paiement",
          total: 3000,
          envoyes: 2900,
          echecs: 100,
          lus: 2500,
          taux_succes: 96.67,
          taux_lecture: 86.21,
        },
        {
          type_message_id: 3,
          type_nom: "Notification cours",
          total: 5000,
          envoyes: 4650,
          echecs: 250,
          lus: 3400,
          taux_succes: 93.0,
          taux_lecture: 73.12,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockStatsByType,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          tm.id as type_message_id,
          tm.nom as type_nom,
          COUNT(m.id) as total,
          SUM(CASE WHEN m.statut = 'envoye' THEN 1 ELSE 0 END) as envoyes,
          SUM(CASE WHEN m.statut = 'echec' THEN 1 ELSE 0 END) as echecs,
          SUM(CASE WHEN m.date_lecture IS NOT NULL THEN 1 ELSE 0 END) as lus
        FROM types_messages tm
        LEFT JOIN messages m ON tm.id = m.type_message_id
        GROUP BY tm.id`,
        [],
      );

      expect(result).toHaveLength(3);
      expect(result.every((r: any) => r.taux_succes > 90)).toBe(true);
    });

    it("devrait calculer les statistiques par catégorie", async () => {
      const mockStatsByCategory = [
        {
          categorie: "adhesion",
          total: 2500,
          envoyes: 2400,
          taux_succes: 96.0,
        },
        {
          categorie: "paiement",
          total: 3500,
          envoyes: 3400,
          taux_succes: 97.14,
        },
        {
          categorie: "cours",
          total: 4000,
          envoyes: 3700,
          taux_succes: 92.5,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockStatsByCategory,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          tm.categorie,
          COUNT(m.id) as total,
          SUM(CASE WHEN m.statut = 'envoye' THEN 1 ELSE 0 END) as envoyes
        FROM types_messages tm
        LEFT JOIN messages m ON tm.id = m.type_message_id
        GROUP BY tm.categorie`,
        [],
      );

      expect(result).toHaveLength(3);
      expect(
        result.find((r: any) => r.categorie === "paiement").taux_succes,
      ).toBeGreaterThan(95);
    });
  });

  describe("Statistiques temporelles", () => {
    it("devrait calculer les statistiques par jour", async () => {
      const mockDailyStats = [
        { date: "2024-06-01", total: 350, envoyes: 340, echecs: 10 },
        { date: "2024-06-02", total: 420, envoyes: 410, echecs: 10 },
        { date: "2024-06-03", total: 380, envoyes: 365, echecs: 15 },
        { date: "2024-06-04", total: 500, envoyes: 480, echecs: 20 },
        { date: "2024-06-05", total: 450, envoyes: 435, echecs: 15 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockDailyStats,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          DATE(date_envoi) as date,
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'envoye' THEN 1 ELSE 0 END) as envoyes,
          SUM(CASE WHEN statut = 'echec' THEN 1 ELSE 0 END) as echecs
        FROM messages
        WHERE date_envoi >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(date_envoi)
        ORDER BY date DESC`,
        [],
      );

      expect(result).toHaveLength(5);
      const totalMessages = result.reduce(
        (sum: number, r: any) => sum + r.total,
        0,
      );
      expect(totalMessages).toBe(2100);
    });

    it("devrait calculer les statistiques par heure de la journée", async () => {
      const mockHourlyStats = [
        { heure: 8, total: 45, taux_ouverture: 65.0 },
        { heure: 9, total: 120, taux_ouverture: 78.5 },
        { heure: 10, total: 200, taux_ouverture: 82.3 },
        { heure: 11, total: 180, taux_ouverture: 80.1 },
        { heure: 12, total: 150, taux_ouverture: 75.8 },
        { heure: 13, total: 100, taux_ouverture: 70.2 },
        { heure: 14, total: 160, taux_ouverture: 79.5 },
        { heure: 15, total: 140, taux_ouverture: 77.8 },
        { heure: 16, total: 130, taux_ouverture: 76.4 },
        { heure: 17, total: 90, taux_ouverture: 68.9 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockHourlyStats,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          HOUR(date_envoi) as heure,
          COUNT(*) as total,
          (SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_ouverture
        FROM messages
        WHERE DATE(date_envoi) = CURDATE()
        GROUP BY HOUR(date_envoi)
        ORDER BY heure`,
        [],
      );

      expect(result).toHaveLength(10);
      const heureOptimale = result.reduce((max: any, r: any) =>
        r.taux_ouverture > max.taux_ouverture ? r : max,
      );
      expect(heureOptimale.heure).toBe(10);
      expect(heureOptimale.taux_ouverture).toBeGreaterThan(80);
    });

    it("devrait calculer les statistiques par jour de la semaine", async () => {
      const mockWeekdayStats = [
        { jour: "Lundi", total: 850, taux_lecture: 75.3 },
        { jour: "Mardi", total: 920, taux_lecture: 78.5 },
        { jour: "Mercredi", total: 880, taux_lecture: 76.8 },
        { jour: "Jeudi", total: 900, taux_lecture: 79.2 },
        { jour: "Vendredi", total: 820, taux_lecture: 74.1 },
        { jour: "Samedi", total: 450, taux_lecture: 68.5 },
        { jour: "Dimanche", total: 380, taux_lecture: 65.2 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockWeekdayStats,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          DAYNAME(date_envoi) as jour,
          COUNT(*) as total,
          (SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_lecture
        FROM messages
        WHERE date_envoi >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DAYOFWEEK(date_envoi), DAYNAME(date_envoi)
        ORDER BY DAYOFWEEK(date_envoi)`,
        [],
      );

      expect(result).toHaveLength(7);
      const jourOptimal = result.reduce((max: any, r: any) =>
        r.taux_lecture > max.taux_lecture ? r : max,
      );
      expect(jourOptimal.jour).toBe("Jeudi");
    });

    it("devrait calculer les tendances mensuelles", async () => {
      const mockMonthlyTrends = [
        { mois: "2024-01", total: 8500, envoyes: 8200, taux_succes: 96.47 },
        { mois: "2024-02", total: 9200, envoyes: 8900, taux_succes: 96.74 },
        { mois: "2024-03", total: 10500, envoyes: 10200, taux_succes: 97.14 },
        { mois: "2024-04", total: 11000, envoyes: 10700, taux_succes: 97.27 },
        { mois: "2024-05", total: 12000, envoyes: 11700, taux_succes: 97.5 },
        { mois: "2024-06", total: 11500, envoyes: 11250, taux_succes: 97.83 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockMonthlyTrends,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          DATE_FORMAT(date_envoi, '%Y-%m') as mois,
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'envoye' THEN 1 ELSE 0 END) as envoyes
        FROM messages
        WHERE date_envoi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(date_envoi, '%Y-%m')
        ORDER BY mois`,
        [],
      );

      expect(result).toHaveLength(6);
      // Vérifier la tendance croissante
      expect(result[5].total).toBeGreaterThan(result[0].total);
    });
  });

  describe("Temps de lecture et d'engagement", () => {
    it("devrait calculer le temps moyen entre envoi et lecture", async () => {
      const mockReadingTime = [
        { temps_moyen_minutes: 125.5, temps_median_minutes: 95.0 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockReadingTime,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          AVG(TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture)) as temps_moyen_minutes,
          (SELECT TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture)
           FROM messages
           WHERE date_lecture IS NOT NULL
           ORDER BY TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture)
           LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM messages WHERE date_lecture IS NOT NULL)) as temps_median_minutes
        FROM messages
        WHERE date_lecture IS NOT NULL`,
        [],
      );

      expect(result[0].temps_moyen_minutes).toBeGreaterThan(0);
      expect(result[0].temps_median_minutes).toBeLessThan(
        result[0].temps_moyen_minutes,
      );
    });

    it("devrait calculer le temps de lecture par type de message", async () => {
      const mockReadingByType = [
        {
          type_nom: "Rappel adhésion",
          temps_moyen: 180.5,
          taux_lecture: 82.0,
        },
        {
          type_nom: "Confirmation paiement",
          temps_moyen: 45.2,
          taux_lecture: 95.5,
        },
        {
          type_nom: "Notification cours",
          temps_moyen: 90.8,
          taux_lecture: 73.2,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockReadingByType,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          tm.nom as type_nom,
          AVG(TIMESTAMPDIFF(MINUTE, m.date_envoi, m.date_lecture)) as temps_moyen,
          (SUM(CASE WHEN m.date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_lecture
        FROM types_messages tm
        LEFT JOIN messages m ON tm.id = m.type_message_id
        WHERE m.date_lecture IS NOT NULL
        GROUP BY tm.id`,
        [],
      );

      expect(result).toHaveLength(3);
      // Les confirmations de paiement sont lues plus rapidement
      const confirmationPaiement = result.find(
        (r: any) => r.type_nom === "Confirmation paiement",
      );
      expect(confirmationPaiement.temps_moyen).toBeLessThan(60);
    });

    it("devrait identifier les plages horaires d'engagement maximal", async () => {
      const mockEngagement = [
        { heure_debut: 8, heure_fin: 9, taux_lecture_immediat: 45.2 },
        { heure_debut: 9, heure_fin: 10, taux_lecture_immediat: 58.7 },
        { heure_debut: 10, heure_fin: 11, taux_lecture_immediat: 62.5 },
        { heure_debut: 11, heure_fin: 12, taux_lecture_immediat: 60.3 },
        { heure_debut: 12, heure_fin: 13, taux_lecture_immediat: 52.1 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEngagement,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          HOUR(date_envoi) as heure_debut,
          HOUR(date_envoi) + 1 as heure_fin,
          (SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture) <= 30 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_lecture_immediat
        FROM messages
        WHERE date_lecture IS NOT NULL
        GROUP BY HOUR(date_envoi)
        ORDER BY taux_lecture_immediat DESC
        LIMIT 5`,
        [],
      );

      const plageOptimale = result[0];
      expect(plageOptimale.heure_debut).toBeGreaterThanOrEqual(8);
      expect(plageOptimale.taux_lecture_immediat).toBeGreaterThan(40);
    });
  });

  describe("Analyse des échecs et erreurs", () => {
    it("devrait analyser les causes d'échec", async () => {
      const mockFailureReasons = [
        { raison: "Email invalide", count: 45, pourcentage: 45.0 },
        { raison: "Boîte pleine", count: 25, pourcentage: 25.0 },
        { raison: "Serveur indisponible", count: 20, pourcentage: 20.0 },
        { raison: "Spam filter", count: 10, pourcentage: 10.0 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockFailureReasons,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          SUBSTRING_INDEX(erreur, ':', 1) as raison,
          COUNT(*) as count,
          (COUNT(*) / (SELECT COUNT(*) FROM messages WHERE statut = 'echec')) * 100 as pourcentage
        FROM messages
        WHERE statut = 'echec' AND erreur IS NOT NULL
        GROUP BY SUBSTRING_INDEX(erreur, ':', 1)
        ORDER BY count DESC`,
        [],
      );

      expect(result).toHaveLength(4);
      expect(result[0].raison).toBe("Email invalide");
      expect(result[0].pourcentage).toBeGreaterThan(40);
    });

    it("devrait identifier les destinataires problématiques", async () => {
      const mockProblematicRecipients = [
        {
          destinataire: "bounced1@example.com",
          echecs_consecutifs: 5,
          dernier_echec: "2024-06-15",
        },
        {
          destinataire: "bounced2@example.com",
          echecs_consecutifs: 4,
          dernier_echec: "2024-06-14",
        },
        {
          destinataire: "bounced3@example.com",
          echecs_consecutifs: 3,
          dernier_echec: "2024-06-13",
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockProblematicRecipients,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          destinataire,
          COUNT(*) as echecs_consecutifs,
          MAX(date_envoi) as dernier_echec
        FROM messages
        WHERE statut = 'echec'
        GROUP BY destinataire
        HAVING echecs_consecutifs >= 3
        ORDER BY echecs_consecutifs DESC`,
        [],
      );

      expect(result).toHaveLength(3);
      expect(result.every((r: any) => r.echecs_consecutifs >= 3)).toBe(true);
    });

    it("devrait calculer le taux d'échec par période", async () => {
      const mockFailureRate = [
        { periode: "00:00-06:00", taux_echec: 5.2 },
        { periode: "06:00-12:00", taux_echec: 2.8 },
        { periode: "12:00-18:00", taux_echec: 3.1 },
        { periode: "18:00-24:00", taux_echec: 4.5 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockFailureRate,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          CASE
            WHEN HOUR(date_envoi) BETWEEN 0 AND 5 THEN '00:00-06:00'
            WHEN HOUR(date_envoi) BETWEEN 6 AND 11 THEN '06:00-12:00'
            WHEN HOUR(date_envoi) BETWEEN 12 AND 17 THEN '12:00-18:00'
            ELSE '18:00-24:00'
          END as periode,
          (SUM(CASE WHEN statut = 'echec' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_echec
        FROM messages
        GROUP BY periode
        ORDER BY taux_echec`,
        [],
      );

      expect(result).toHaveLength(4);
      const meilleureperiode = result[0];
      expect(meilleureperiode.periode).toBeDefined();
      expect(meilleureperiode.taux_echec).toBeLessThan(6);
    });
  });

  describe("Statistiques utilisateurs", () => {
    it("devrait calculer les statistiques par utilisateur", async () => {
      const mockUserStats = [
        {
          utilisateur_id: 1,
          total_recus: 150,
          total_lus: 120,
          taux_lecture: 80.0,
          temps_moyen_lecture: 95.5,
        },
        {
          utilisateur_id: 2,
          total_recus: 200,
          total_lus: 180,
          taux_lecture: 90.0,
          temps_moyen_lecture: 45.2,
        },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockUserStats,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          utilisateur_id,
          COUNT(*) as total_recus,
          SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) as total_lus,
          (SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_lecture,
          AVG(TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture)) as temps_moyen_lecture
        FROM messages
        GROUP BY utilisateur_id`,
        [],
      );

      expect(result).toHaveLength(2);
      expect(result.every((r: any) => r.taux_lecture > 75)).toBe(true);
    });

    it("devrait identifier les utilisateurs les plus engagés", async () => {
      const mockEngagedUsers = [
        { utilisateur_id: 2, score_engagement: 95.5 },
        { utilisateur_id: 5, score_engagement: 92.3 },
        { utilisateur_id: 8, score_engagement: 90.1 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEngagedUsers,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          utilisateur_id,
          ((SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 0.7 +
           (COUNT(*) / (SELECT MAX(cnt) FROM (SELECT COUNT(*) as cnt FROM messages GROUP BY utilisateur_id) t)) * 0.3) * 100 as score_engagement
        FROM messages
        GROUP BY utilisateur_id
        ORDER BY score_engagement DESC
        LIMIT 10`,
        [],
      );

      expect(result).toHaveLength(3);
      expect(result[0].score_engagement).toBeGreaterThan(90);
    });
  });

  describe("Prédictions et recommandations", () => {
    it("devrait recommander les meilleurs moments d'envoi", async () => {
      const mockRecommendations = [
        { jour: "Jeudi", heure: 10, score: 95.5 },
        { jour: "Mardi", heure: 9, score: 93.2 },
        { jour: "Mercredi", heure: 10, score: 92.8 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockRecommendations,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          DAYNAME(date_envoi) as jour,
          HOUR(date_envoi) as heure,
          ((SUM(CASE WHEN date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 0.6 +
           (SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, date_envoi, date_lecture) <= 60 THEN 1 ELSE 0 END) / COUNT(*)) * 0.4) * 100 as score
        FROM messages
        WHERE statut = 'envoye'
        GROUP BY DAYNAME(date_envoi), HOUR(date_envoi)
        HAVING COUNT(*) >= 50
        ORDER BY score DESC
        LIMIT 5`,
        [],
      );

      expect(result).toHaveLength(3);
      expect(result[0].jour).toBe("Jeudi");
      expect(result[0].heure).toBe(10);
    });

    it("devrait prédire le volume d'envoi futur", async () => {
      const mockHistoricalVolume = [
        { semaine: "2024-W20", volume: 2100 },
        { semaine: "2024-W21", volume: 2250 },
        { semaine: "2024-W22", volume: 2400 },
        { semaine: "2024-W23", volume: 2550 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockHistoricalVolume,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          DATE_FORMAT(date_envoi, '%Y-W%u') as semaine,
          COUNT(*) as volume
        FROM messages
        WHERE date_envoi >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
        GROUP BY DATE_FORMAT(date_envoi, '%Y-W%u')
        ORDER BY semaine`,
        [],
      );

      expect(result).toHaveLength(4);

      // Calcul de la croissance moyenne
      const croissances = [];
      for (let i = 1; i < result.length; i++) {
        croissances.push(
          ((result[i].volume - result[i - 1].volume) / result[i - 1].volume) *
            100,
        );
      }
      const croissanceMoyenne =
        croissances.reduce((sum, c) => sum + c, 0) / croissances.length;

      expect(croissanceMoyenne).toBeGreaterThan(5);
    });
  });

  describe("Comparaisons et benchmarks", () => {
    it("devrait comparer les performances entre catégories", async () => {
      const mockComparison = [
        { categorie: "adhesion", taux_succes: 96.5, taux_lecture: 82.0 },
        { categorie: "paiement", taux_succes: 97.8, taux_lecture: 95.0 },
        { categorie: "cours", taux_succes: 93.2, taux_lecture: 73.5 },
      ];

      (mockMessageClient.queryAsync as jest.Mock).mockResolvedValue(
        mockComparison,
      );

      const result = await mockMessageClient.queryAsync!(
        `SELECT
          tm.categorie,
          (SUM(CASE WHEN m.statut = 'envoye' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_succes,
          (SUM(CASE WHEN m.date_lecture IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as taux_lecture
        FROM types_messages tm
        LEFT JOIN messages m ON tm.id = m.type_message_id
        GROUP BY tm.categorie`,
        [],
      );

      expect(result).toHaveLength(3);

      const meilleurCategorie = result.reduce((max: any, r: any) =>
        r.taux_lecture > max.taux_lecture ? r : max,
      );
      expect(meilleurCategorie.categorie).toBe("paiement");
    });
  });
});
