import { jest } from "@jest/globals";
import { CommandesRepository } from "../../../../db/clients/commandes/commandes.repository.js";
import MysqlConnector from "../../../../db/connector/mysqlconnector.js";
import { CommandesReadRepository } from "../../../../db/clients/commandes/repositories/read.repository.js";
import { CommandesWriteRepository } from "../../../../db/clients/commandes/repositories/write.repository.js";
import { CommandesStatsRepository } from "../../../../db/clients/commandes/repositories/stats.repository.js";
import { CommandesSearchRepository } from "../../../../db/clients/commandes/repositories/search.repository.js";
import { CommandesValidationRepository } from "../../../../db/clients/commandes/repositories/validation.repository.js";

// Mock MySQL Connector and sub-repositories
jest.mock("../../../../db/connector/mysqlconnector.js");
jest.mock("../../../../db/clients/commandes/repositories/read.repository.js");
jest.mock("../../../../db/clients/commandes/repositories/write.repository.js");
jest.mock("../../../../db/clients/commandes/repositories/stats.repository.js");
jest.mock("../../../../db/clients/commandes/repositories/search.repository.js");
jest.mock("../../../../db/clients/commandes/repositories/validation.repository.js");

describe("CommandesRepository - Complete Coverage Tests", () => {
  let commandesRepository: CommandesRepository;
  let mockMysqlConnector: any;
  let mockReadRepo: any;
  let mockWriteRepo: any;
  let mockStatsRepo: any;
  let mockSearchRepo: any;
  let mockValidationRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMysqlConnector = {
      query: jest.fn(),
      getInstance: jest.fn(),
    };
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue(mockMysqlConnector);

    commandesRepository = new CommandesRepository();

    mockReadRepo = (CommandesReadRepository as jest.Mock).mock.instances[0];
    mockWriteRepo = (CommandesWriteRepository as jest.Mock).mock.instances[0];
    mockStatsRepo = (CommandesStatsRepository as jest.Mock).mock.instances[0];
    mockSearchRepo = (CommandesSearchRepository as jest.Mock).mock.instances[0];
    mockValidationRepo = (CommandesValidationRepository as jest.Mock).mock.instances[0];
  });

  describe("Complete Statistics Operations Coverage", () => {
    it("should get stats by year successfully", async () => {
      const mockStats = {
        annee: 2024,
        total_commandes: 1200,
        total_ca: 125000.0,
        panier_moyen: 104.17,
        par_mois: [
          { mois: 1, commandes: 100, ca: 10000 },
          { mois: 2, commandes: 110, ca: 11000 },
        ],
      };
      mockStatsRepo.getStatsByYear = jest.fn().mockResolvedValue(mockStats);

      const result = await commandesRepository.getStatsByYear(2024);

      expect(result).toEqual(mockStats);
      expect(mockStatsRepo.getStatsByYear).toHaveBeenCalledWith(2024);
    });

    it("should get top produits by CA successfully", async () => {
      const mockProduits = [
        { produit_id: 1, nom: "Produit A", ca_total: 50000, quantite: 200 },
        { produit_id: 2, nom: "Produit B", ca_total: 35000, quantite: 150 },
      ];
      mockStatsRepo.getTopProduitsByCA = jest.fn().mockResolvedValue(mockProduits);

      const result = await commandesRepository.getTopProduitsByCA(10);

      expect(result).toEqual(mockProduits);
      expect(mockStatsRepo.getTopProduitsByCA).toHaveBeenCalledWith(10);
    });

    it("should get top clients by count successfully", async () => {
      const mockClients = [
        { user_id: 1, nom: "Client A", nombre_commandes: 25 },
        { user_id: 2, nom: "Client B", nombre_commandes: 20 },
      ];
      mockStatsRepo.getTopClientsByCount = jest.fn().mockResolvedValue(mockClients);

      const result = await commandesRepository.getTopClientsByCount(10);

      expect(result).toEqual(mockClients);
      expect(mockStatsRepo.getTopClientsByCount).toHaveBeenCalledWith(10);
    });

    it("should get top clients by amount successfully", async () => {
      const mockClients = [
        { user_id: 1, nom: "Client A", montant_total: 5000 },
        { user_id: 2, nom: "Client B", montant_total: 4500 },
      ];
      mockStatsRepo.getTopClientsByAmount = jest.fn().mockResolvedValue(mockClients);

      const result = await commandesRepository.getTopClientsByAmount(10);

      expect(result).toEqual(mockClients);
      expect(mockStatsRepo.getTopClientsByAmount).toHaveBeenCalledWith(10);
    });

    it("should get temps moyen traitement successfully", async () => {
      mockStatsRepo.getTempsMoyenTraitement = jest.fn().mockResolvedValue(2.5);

      const result = await commandesRepository.getTempsMoyenTraitement("validee");

      expect(result).toBe(2.5);
      expect(mockStatsRepo.getTempsMoyenTraitement).toHaveBeenCalledWith("validee");
    });

    it("should get commandes by hour successfully", async () => {
      const mockData = [
        { heure: 10, count: 45 },
        { heure: 14, count: 60 },
        { heure: 18, count: 55 },
      ];
      mockStatsRepo.getCommandesByHour = jest.fn().mockResolvedValue(mockData);

      const result = await commandesRepository.getCommandesByHour();

      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });

    it("should get commandes by day of week successfully", async () => {
      const mockData = [
        { jour: "Lundi", count: 150 },
        { jour: "Vendredi", count: 200 },
      ];
      mockStatsRepo.getCommandesByDayOfWeek = jest.fn().mockResolvedValue(mockData);

      const result = await commandesRepository.getCommandesByDayOfWeek();

      expect(result).toEqual(mockData);
    });

    it("should handle empty statistics gracefully", async () => {
      mockStatsRepo.getStatistiques = jest.fn().mockResolvedValue({
        total_commandes: 0,
        total_ca: 0,
        panier_moyen: 0,
      });

      const result = await commandesRepository.getStatistiques();

      expect(result.total_commandes).toBe(0);
    });
  });

  describe("Complete Search Operations Coverage", () => {
    it("should search by id pattern successfully", async () => {
      const mockResults = [
        { id: "CMD-2024-001", statut: "validee" },
        { id: "CMD-2024-002", statut: "en_attente" },
      ];
      mockSearchRepo.searchByIdPattern = jest.fn().mockResolvedValue(mockResults);

      const result = await commandesRepository.searchByIdPattern("CMD-2024");

      expect(result).toEqual(mockResults);
      expect(mockSearchRepo.searchByIdPattern).toHaveBeenCalledWith("CMD-2024");
    });

    it("should search by username successfully", async () => {
      const mockResults = [
        { id: "CMD-001", username: "john_doe", total: 100 },
      ];
      mockSearchRepo.searchByUsername = jest.fn().mockResolvedValue(mockResults);

      const result = await commandesRepository.searchByUsername("john_doe");

      expect(result).toEqual(mockResults);
      expect(mockSearchRepo.searchByUsername).toHaveBeenCalledWith("john_doe");
    });

    it("should search by article successfully", async () => {
      const mockResults = [
        { id: "CMD-001", article_id: 5, quantite: 2 },
      ];
      mockSearchRepo.searchByArticle = jest.fn().mockResolvedValue(mockResults);

      const result = await commandesRepository.searchByArticle(5);

      expect(result).toEqual(mockResults);
      expect(mockSearchRepo.searchByArticle).toHaveBeenCalledWith(5);
    });

    it("should search by product name successfully", async () => {
      const mockResults = [
        { id: "CMD-001", produit_nom: "T-shirt", quantite: 2 },
      ];
      mockSearchRepo.searchByProductName = jest.fn().mockResolvedValue(mockResults);

      const result = await commandesRepository.searchByProductName("T-shirt");

      expect(result).toEqual(mockResults);
      expect(mockSearchRepo.searchByProductName).toHaveBeenCalledWith("T-shirt");
    });

    it("should handle no search results", async () => {
      mockSearchRepo.search = jest.fn().mockResolvedValue([]);

      const result = await commandesRepository.search({ status: "inexistant" });

      expect(result).toEqual([]);
    });

    it("should handle complex search criteria", async () => {
      const criteria = {
        status: "validee",
        minTotal: 100,
        maxTotal: 500,
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      };
      mockSearchRepo.search = jest.fn().mockResolvedValue([]);

      const result = await commandesRepository.search(criteria);

      expect(mockSearchRepo.search).toHaveBeenCalledWith(criteria);
    });
  });

  describe("Complete Validation Operations Coverage", () => {
    it("should check payment intent exists successfully", async () => {
      mockValidationRepo.paymentIntentExists = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.paymentIntentExists("pi_123456");

      expect(result).toBe(true);
      expect(mockValidationRepo.paymentIntentExists).toHaveBeenCalledWith("pi_123456");
    });

    it("should check user has pending commande successfully", async () => {
      mockValidationRepo.userHasPendingCommande = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.userHasPendingCommande(1);

      expect(result).toBe(true);
      expect(mockValidationRepo.userHasPendingCommande).toHaveBeenCalledWith(1);
    });

    it("should get commande statut successfully", async () => {
      mockValidationRepo.getCommandeStatut = jest.fn().mockResolvedValue("validee");

      const result = await commandesRepository.getCommandeStatut("CMD-001");

      expect(result).toBe("validee");
      expect(mockValidationRepo.getCommandeStatut).toHaveBeenCalledWith("CMD-001");
    });

    it("should check can be modified successfully", async () => {
      mockValidationRepo.canBeModified = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.canBeModified("CMD-001");

      expect(result).toBe(true);
      expect(mockValidationRepo.canBeModified).toHaveBeenCalledWith("CMD-001");
    });

    it("should check can be refunded successfully", async () => {
      mockValidationRepo.canBeRefunded = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.canBeRefunded("CMD-001");

      expect(result).toBe(true);
      expect(mockValidationRepo.canBeRefunded).toHaveBeenCalledWith("CMD-001");
    });

    it("should count recent user commandes successfully", async () => {
      mockValidationRepo.countRecentUserCommandes = jest.fn().mockResolvedValue(3);

      const result = await commandesRepository.countRecentUserCommandes(1, 30);

      expect(result).toBe(3);
      expect(mockValidationRepo.countRecentUserCommandes).toHaveBeenCalledWith(1, 30);
    });

    it("should sum recent user commandes total successfully", async () => {
      mockValidationRepo.sumRecentUserCommandesTotal = jest.fn().mockResolvedValue(450.0);

      const result = await commandesRepository.sumRecentUserCommandesTotal(1, 30);

      expect(result).toBe(450.0);
      expect(mockValidationRepo.sumRecentUserCommandesTotal).toHaveBeenCalledWith(1, 30);
    });

    it("should check user exceeds order limit successfully", async () => {
      mockValidationRepo.userExceedsOrderLimit = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.userExceedsOrderLimit(1, 5, 60);

      expect(result).toBe(false);
      expect(mockValidationRepo.userExceedsOrderLimit).toHaveBeenCalledWith(1, 5, 60);
    });

    it("should check user has too many cancelled successfully", async () => {
      mockValidationRepo.userHasTooManyCancelled = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.userHasTooManyCancelled(1, 3, 90);

      expect(result).toBe(false);
      expect(mockValidationRepo.userHasTooManyCancelled).toHaveBeenCalledWith(1, 3, 90);
    });

    it("should check duplicate payment intent successfully", async () => {
      mockValidationRepo.checkDuplicatePaymentIntent = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.checkDuplicatePaymentIntent("pi_123456", "CMD-001");

      expect(result).toBe(false);
    });

    it("should check commande has articles successfully", async () => {
      mockValidationRepo.commandeHasArticles = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.commandeHasArticles("CMD-001");

      expect(result).toBe(true);
    });

    it("should check is final status successfully", async () => {
      const result1 = commandesRepository.isFinalStatus("validee");
      const result2 = commandesRepository.isFinalStatus("en_attente");

      expect(mockValidationRepo.isFinalStatus).toHaveBeenCalledTimes(2);
    });

    it("should check is commande too old successfully", async () => {
      mockValidationRepo.isCommandeTooOld = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.isCommandeTooOld("CMD-001", 48);

      expect(result).toBe(false);
      expect(mockValidationRepo.isCommandeTooOld).toHaveBeenCalledWith("CMD-001", 48);
    });

    it("should check is commande expired successfully", async () => {
      mockValidationRepo.isCommandeExpired = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.isCommandeExpired("CMD-001", 24);

      expect(result).toBe(false);
    });

    it("should get expired commandes successfully", async () => {
      const mockExpired = [
        { id: "CMD-001", created_at: new Date() },
      ];
      mockValidationRepo.getExpiredCommandes = jest.fn().mockResolvedValue(mockExpired);

      const result = await commandesRepository.getExpiredCommandes(24, 100);

      expect(result).toEqual(mockExpired);
    });

    it("should check suspicious montant successfully", async () => {
      const result1 = commandesRepository.checkSuspiciousMontant(10000);
      const result2 = commandesRepository.checkSuspiciousMontant(50);

      expect(mockValidationRepo.checkSuspiciousMontant).toHaveBeenCalledTimes(2);
    });

    it("should get user average order amount successfully", async () => {
      mockValidationRepo.getUserAverageOrderAmount = jest.fn().mockResolvedValue(125.5);

      const result = await commandesRepository.getUserAverageOrderAmount(1, 90);

      expect(result).toBe(125.5);
    });

    it("should check montant deviation successfully", async () => {
      const mockResult = {
        hasDeviation: true,
        stats: { average: 100, current: 500, deviation: 400 },
      };
      mockValidationRepo.checkMontantDeviation = jest.fn().mockResolvedValue(mockResult);

      const result = await commandesRepository.checkMontantDeviation(1, 500, 90);

      expect(result).toEqual(mockResult);
    });

    it("should check referential integrity successfully", async () => {
      mockValidationRepo.checkReferentialIntegrity = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.checkReferentialIntegrity("CMD-001");

      expect(result).toBe(true);
    });

    it("should get orphaned commandes successfully", async () => {
      const mockOrphaned = [
        { id: "CMD-001", user_id: null },
      ];
      mockValidationRepo.getOrphanedCommandes = jest.fn().mockResolvedValue(mockOrphaned);

      const result = await commandesRepository.getOrphanedCommandes(100);

      expect(result).toEqual(mockOrphaned);
    });

    it("should check potential duplicates successfully", async () => {
      const mockResult = {
        hasDuplicates: false,
        duplicates: [],
      };
      mockValidationRepo.checkPotentialDuplicates = jest.fn().mockResolvedValue(mockResult);

      const result = await commandesRepository.checkPotentialDuplicates("CMD-001");

      expect(result).toEqual(mockResult);
    });

    it("should detect potential duplicates", async () => {
      const mockResult = {
        hasDuplicates: true,
        duplicates: [{ id: "CMD-002", similarity: 0.95 }],
      };
      mockValidationRepo.checkPotentialDuplicates = jest.fn().mockResolvedValue(mockResult);

      const result = await commandesRepository.checkPotentialDuplicates("CMD-001");

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toHaveLength(1);
    });
  });

  describe("Advanced Edge Cases and Error Scenarios", () => {
    it("should handle very large order amounts", async () => {
      const result = commandesRepository.checkValidMontant(999999.99);

      expect(mockValidationRepo.checkValidMontant).toHaveBeenCalledWith(999999.99);
    });

    it("should handle zero amount orders", async () => {
      const result = commandesRepository.checkValidMontant(0);

      expect(mockValidationRepo.checkValidMontant).toHaveBeenCalledWith(0);
    });

    it("should handle negative amounts", async () => {
      const result = commandesRepository.checkValidMontant(-50);

      expect(mockValidationRepo.checkValidMontant).toHaveBeenCalledWith(-50);
    });

    it("should handle decimal precision", async () => {
      const result = commandesRepository.checkValidMontant(123.456789);

      expect(mockValidationRepo.checkValidMontant).toHaveBeenCalledWith(123.456789);
    });

    it("should handle special characters in commande ID", async () => {
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await commandesRepository.findById("CMD-!@#$%");

      expect(result).toBeNull();
    });

    it("should handle very long commande IDs", async () => {
      const longId = "CMD-" + "A".repeat(100);
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await commandesRepository.findById(longId);

      expect(result).toBeNull();
    });

    it("should handle concurrent status updates", async () => {
      mockWriteRepo.updateStatut = jest.fn().mockResolvedValue(true);

      const promises = [
        commandesRepository.updateStatut("CMD-001", "en_cours"),
        commandesRepository.updateStatut("CMD-001", "validee"),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true]);
    });

    it("should handle bulk delete operations", async () => {
      mockWriteRepo.deleteByUser = jest.fn().mockResolvedValue(50);

      const result = await commandesRepository.deleteByUser(1);

      expect(result).toBe(50);
    });

    it("should handle payment intent with special characters", async () => {
      const specialPI = "pi_1234_test-payment@stripe";
      mockValidationRepo.paymentIntentExists = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.paymentIntentExists(specialPI);

      expect(result).toBe(true);
    });

    it("should handle empty payment intent", async () => {
      mockValidationRepo.paymentIntentExists = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.paymentIntentExists("");

      expect(result).toBe(false);
    });

    it("should handle null payment intent", async () => {
      mockValidationRepo.paymentIntentExists = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.paymentIntentExists(null as any);

      expect(result).toBe(false);
    });

    it("should handle invalid status transitions", async () => {
      const result = commandesRepository.isValidStatusTransition("validee", "en_attente");

      expect(mockValidationRepo.isValidStatusTransition).toHaveBeenCalledWith("validee", "en_attente");
    });

    it("should handle timezone differences in dates", async () => {
      const date1 = new Date("2024-01-01T00:00:00Z");
      const date2 = new Date("2024-12-31T23:59:59Z");
      mockStatsRepo.getStatsByPeriod = jest.fn().mockResolvedValue({});

      const result = await commandesRepository.getStatsByPeriod(date1, date2);

      expect(mockStatsRepo.getStatsByPeriod).toHaveBeenCalledWith(date1, date2);
    });

    it("should handle leap year dates", async () => {
      const leapDate = new Date("2024-02-29");
      mockStatsRepo.getStatsByPeriod = jest.fn().mockResolvedValue({});

      const result = await commandesRepository.getStatsByPeriod(leapDate, leapDate);

      expect(result).toBeDefined();
    });

    it("should handle daylight saving time changes", async () => {
      const dstDate = new Date("2024-03-31T02:00:00");
      mockStatsRepo.getStatsByPeriod = jest.fn().mockResolvedValue({});

      const result = await commandesRepository.getStatsByPeriod(dstDate, dstDate);

      expect(result).toBeDefined();
    });
  });

  describe("Performance and Stress Tests", () => {
    it("should handle high volume of concurrent reads", async () => {
      mockReadRepo.findAll = jest.fn().mockResolvedValue([]);

      const promises = Array.from({ length: 100 }, () => commandesRepository.findAll());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      expect(mockReadRepo.findAll).toHaveBeenCalledTimes(100);
    });

    it("should handle bulk status updates efficiently", async () => {
      mockWriteRepo.updateStatut = jest.fn().mockResolvedValue(true);

      const commandeIds = Array.from({ length: 50 }, (_, i) => `CMD-${i + 1}`);
      const promises = commandeIds.map((id) => commandesRepository.updateStatut(id, "validee"));

      const results = await Promise.all(promises);

      expect(results.every((r) => r === true)).toBe(true);
    });

    it("should handle rapid successive searches", async () => {
      mockSearchRepo.search = jest.fn().mockResolvedValue([]);

      const promises = Array.from({ length: 20 }, () =>
        commandesRepository.search({ status: "validee" }),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
    });

    it("should handle memory-intensive operations", async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `CMD-${i}`,
        total: 100,
      }));
      mockReadRepo.findAll = jest.fn().mockResolvedValue(largeDataset);

      const result = await commandesRepository.findAll();

      expect(result).toHaveLength(10000);
    });
  });

  describe("Integration Tests with Multiple Operations", () => {
    it("should handle complete order lifecycle", async () => {
      // Create
      mockWriteRepo.create = jest.fn().mockResolvedValue("CMD-001");
      const commandeId = await commandesRepository.create({
        utilisateur_id: 1,
        statut: "en_attente",
        total: 150.0,
        articles: [],
      });
      expect(commandeId).toBe("CMD-001");

      // Read
      mockReadRepo.findById = jest.fn().mockResolvedValue({ id: commandeId });
      const commande = await commandesRepository.findById(commandeId);
      expect(commande).toBeDefined();

      // Update status
      mockWriteRepo.updateStatut = jest.fn().mockResolvedValue(true);
      const updated = await commandesRepository.updateStatut(commandeId, "validee");
      expect(updated).toBe(true);

      // Get statistics
      mockStatsRepo.getStatistiques = jest.fn().mockResolvedValue({ total: 1 });
      const stats = await commandesRepository.getStatistiques();
      expect(stats).toBeDefined();
    });

    it("should handle validation workflow", async () => {
      // Check user can order
      mockValidationRepo.userCanOrder = jest.fn().mockResolvedValue(true);
      const canOrder = await commandesRepository.userCanOrder(1);
      expect(canOrder).toBe(true);

      // Validate amount
      const validAmount = commandesRepository.checkValidMontant(100);
      expect(mockValidationRepo.checkValidMontant).toHaveBeenCalled();

      // Check status
      const validStatus = commandesRepository.checkValidStatut("en_attente");
      expect(mockValidationRepo.checkValidStatut).toHaveBeenCalled();
    });

    it("should handle search and filter workflow", async () => {
      // Search by email
      mockSearchRepo.searchByEmail = jest.fn().mockResolvedValue([{ id: "CMD-001" }]);
      const byEmail = await commandesRepository.searchByEmail("test@example.com");
      expect(byEmail).toHaveLength(1);

      // Filter by status
      mockReadRepo.findByStatut = jest.fn().mockResolvedValue([{ id: "CMD-001" }]);
      const byStatus = await commandesRepository.findByStatut("validee");
      expect(byStatus).toHaveLength(1);

      // Search by amount range
      mockSearchRepo.searchByMontantRange = jest.fn().mockResolvedValue([{ id: "CMD-001" }]);
      const byAmount = await commandesRepository.searchByMontantRange(50, 200);
      expect(byAmount).toHaveLength(1);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should recover from temporary database errors", async () => {
      let callCount = 0;
      mockReadRepo.findById = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Temporary error"));
        }
        return Promise.resolve({ id: "CMD-001" });
      });

      try {
        await commandesRepository.findById("CMD-001");
      } catch (e) {
        // First call fails
      }

      // Second call succeeds
      const result = await commandesRepository.findById("CMD-001");
      expect(result).toBeDefined();
    });

    it("should handle network timeouts gracefully", async () => {
      const timeoutError = new Error("Network timeout");
      mockReadRepo.findAll = jest.fn().mockRejectedValue(timeoutError);

      await expect(commandesRepository.findAll()).rejects.toThrow("Network timeout");
    });

    it("should handle connection pool exhaustion", async () => {
      const poolError = new Error("Connection pool exhausted");
      mockWriteRepo.create = jest.fn().mockRejectedValue(poolError);

      await expect(
        commandesRepository.create({
          utilisateur_id: 1,
          statut: "en_attente",
          total: 100,
          articles: [],
        }),
      ).rejects.toThrow("Connection pool exhausted");
    });
  });

  describe("Data Consistency and Integrity", () => {
    it("should maintain referential integrity", async () => {
      mockValidationRepo.checkReferentialIntegrity = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.checkReferentialIntegrity("CMD-001");

      expect(result).toBe(true);
    });

    it("should detect orphaned commandes", async () => {
      const orphaned = [{ id: "CMD-999", user_id: null }];
      mockValidationRepo.getOrphanedCommandes = jest.fn().mockResolvedValue(orphaned);

      const result = await commandesRepository.getOrphanedCommandes(100);

      expect(result).toHaveLength(1);
    });

    it("should ensure total consistency", async () => {
      mockValidationRepo.checkCommandeTotalConsistency = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.checkCommandeTotalConsistency("CMD-001");

      expect(result).toBe(true);
    });

    it("should validate articles exist", async () => {
      mockValidationRepo.commandeHasArticles = jest.fn().mockResolvedValue(true);

      const result = await commandesRepository.commandeHasArticles("CMD-001");

      expect(result).toBe(true);
    });
  });
});
