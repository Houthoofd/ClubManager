/**
 * Tests d'intégration RÉELS du module Commandes avec vraie DB
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
  jest,
} from "@jest/globals";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  teardownTestDatabase,
  getTestPrisma,
} from "../../../tests/setup/testDatabase.js";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  getCommandes,
  getCommande,
  createCommande,
  updateStatut,
  batchUpdateStatuts,
} from "../core/handlers/index.js";

describe("Commandes - Tests d'intégration RÉELS avec DB", () => {
  let testPrisma: PrismaClient;
  let testUserId: number;
  let testArticleId: number;
  let testTailleId: number;
  let testCategorieId: number;

  beforeAll(async () => {
    // Setup de la DB de test avant tous les tests
    console.log(`🔧 [TEST] Début du setup...`);
    const prismaInstance = await setupTestDatabase();
    console.log(
      `🔍 [TEST] prismaInstance reçu:`,
      typeof prismaInstance,
      prismaInstance ? "DÉFINI" : "UNDEFINED",
    );
    testPrisma = prismaInstance as PrismaClient;
    console.log(
      `🔍 [TEST] testPrisma assigné:`,
      typeof testPrisma,
      testPrisma ? "DÉFINI" : "UNDEFINED",
    );

    console.log(`🔗 [TEST] Base de données de test initialisée`);
  });

  afterAll(async () => {
    // Nettoyage final et fermeture de la connexion
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    console.log(
      `🧹 [TEST] beforeEach - testPrisma:`,
      typeof testPrisma,
      testPrisma ? "DÉFINI" : "UNDEFINED",
    );
    console.log(`🔍 [TEST] Clés de testPrisma:`, Object.keys(testPrisma || {}));
    console.log(
      `🔍 [TEST] testPrisma.commande_articles existe?`,
      !!testPrisma?.commande_articles,
    );

    // Nettoyer toutes les tables dans le bon ordre (contraintes FK)
    await testPrisma.commande_articles.deleteMany({});
    await testPrisma.historique_statuts_commande.deleteMany({});
    await testPrisma.commandes.deleteMany({});
    await testPrisma.articles_tailles.deleteMany({});
    await testPrisma.articles.deleteMany({});
    await testPrisma.tailles.deleteMany({});
    await testPrisma.categories.deleteMany({});
    await testPrisma.utilisateurs.deleteMany({});

    console.log("🌱 [TEST] Création des données de test...");

    // Créer un utilisateur de test
    const user = await testPrisma.utilisateurs.create({
      data: {
        userId: `TEST${Date.now()}`,
        first_name: "Test",
        last_name: "User",
        nom_utilisateur: "testuser",
        email: "test@example.com",
        date_of_birth: new Date("1990-01-01"),
        password: "$2b$12$hashedpassword",
        status_id: null,
        grade_id: null,
      },
    });
    testUserId = user.id;

    // Créer une catégorie
    const categorie = await testPrisma.categories.create({
      data: {
        nom: "Vêtements",
        description: "Articles vestimentaires",
      },
    });
    testCategorieId = categorie.id;

    // Créer un article
    const article = await testPrisma.articles.create({
      data: {
        nom: "Maillot Test",
        description: "Maillot pour tests",
        prix: 49.99,
        categorie_id: testCategorieId,
        image_url: "https://example.com/maillot.jpg",
      },
    });
    testArticleId = article.id;

    // Créer une taille
    const taille = await testPrisma.tailles.create({
      data: {
        nom: "M",
      },
    });
    testTailleId = taille.id;

    // Créer le stock pour l'article
    await testPrisma.articles_tailles.create({
      data: {
        article_id: testArticleId,
        taille_id: testTailleId,
        stock_disponible: 50,
      },
    });

    console.log(
      `✅ [TEST] Données créées: User=${testUserId}, Article=${testArticleId}, Taille=${testTailleId}`,
    );
  });

  describe("Création de commandes", () => {
    it("devrait créer une nouvelle commande avec articles", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 2,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier la réponse
      expect(mockResponse.status).toHaveBeenCalledWith(201);

      // Extraire l'objet retourné et vérifier ses propriétés
      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData).toMatchObject({
        id: expect.any(Number),
        numero_commande: expect.stringContaining("CMD-"),
        statut: "en_attente",
        total: "99.98",
      });

      // Vérifier dans la DB
      const commandes = await testPrisma.commandes.findMany({
        include: {
          commande_articles: true,
        },
      });

      expect(commandes).toHaveLength(1);
      expect(commandes[0].utilisateur_id).toBe(testUserId);
      expect(commandes[0].commande_articles).toHaveLength(1);
      expect(commandes[0].commande_articles[0].quantite).toBe(2);
    });

    it("devrait générer un numéro de commande unique", async () => {
      const mockRequest1 = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 1,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockRequest2 = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 1,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockResponse2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest1 as Request, mockResponse1, testPrisma);
      await createCommande(mockRequest2 as Request, mockResponse2, testPrisma);

      const commandes = await testPrisma.commandes.findMany({
        orderBy: { id: "asc" },
      });

      expect(commandes).toHaveLength(2);
      expect(commandes[0].numero_commande).not.toBe(
        commandes[1].numero_commande,
      );
    });

    it("devrait rejeter une commande avec stock insuffisant", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 100, // Plus que le stock disponible (50)
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier l'erreur
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Stock insuffisant"),
        }),
      );

      // Vérifier qu'aucune commande n'a été créée
      const commandes = await testPrisma.commandes.findMany({});
      expect(commandes).toHaveLength(0);
    });
  });

  describe("Récupération de commandes", () => {
    beforeEach(async () => {
      // Créer des commandes de test
      const commande1 = await testPrisma.commandes.create({
        data: {
          utilisateur_id: testUserId,
          numero_commande: "CMD-TEST-001",
          statut: "en_attente" as any,
          total: 99.98,
          date_commande: new Date(),
        },
      });

      await testPrisma.commande_articles.create({
        data: {
          commande_id: commande1.id,
          article_id: testArticleId,
          taille_id: testTailleId,
          quantite: 2,
          prix: 49.99,
        },
      });

      const commande2 = await testPrisma.commandes.create({
        data: {
          utilisateur_id: testUserId,
          numero_commande: "CMD-TEST-002",
          statut: "pay_e" as any,
          total: 149.99,
          date_commande: new Date(),
        },
      });

      await testPrisma.commande_articles.create({
        data: {
          commande_id: commande2.id,
          article_id: testArticleId,
          taille_id: testTailleId,
          quantite: 1,
          prix: 49.99,
        },
      });
    });

    it("devrait récupérer toutes les commandes", async () => {
      const mockRequest = {
        query: {},
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getCommandes(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            numero_commande: "CMD-TEST-001",
            statut: "en_attente",
          }),
          expect.objectContaining({
            numero_commande: "CMD-TEST-002",
            statut: "pay_e",
          }),
        ]),
      );
    });

    it("devrait filtrer les commandes par statut", async () => {
      const mockRequest = {
        query: { statut: "pay_e" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getCommandes(mockRequest as Request, mockResponse, testPrisma);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveLength(1);
      expect(response[0].statut).toBe("pay_e");
    });

    it("devrait récupérer une commande spécifique avec ses articles", async () => {
      const commandes = await testPrisma.commandes.findMany({});
      const commandeId = commandes[0].id;

      const mockRequest = {
        params: { id: commandeId.toString() },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getCommande(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: commandeId,
          numero_commande: expect.stringContaining("CMD-"),
        }),
      );
    });

    it("devrait retourner 404 pour une commande inexistante", async () => {
      const mockRequest = {
        params: { id: "99999" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getCommande(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("trouvée"),
        }),
      );
    });
  });

  describe("Mise à jour du statut", () => {
    let testCommandeId: number;

    beforeEach(async () => {
      // Créer une commande de test
      const commande = await testPrisma.commandes.create({
        data: {
          utilisateur_id: testUserId,
          numero_commande: "CMD-TEST-STATUT",
          statut: "en_attente" as any,
          total: 99.98,
          date_commande: new Date(),
        },
      });
      testCommandeId = commande.id;

      await testPrisma.commande_articles.create({
        data: {
          commande_id: testCommandeId,
          article_id: testArticleId,
          taille_id: testTailleId,
          quantite: 2,
          prix: 49.99,
        },
      });
    });

    it("devrait mettre à jour le statut d'une commande", async () => {
      const mockRequest = {
        params: { id: testCommandeId.toString() },
        body: { statut: "pay_e" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("mis à jour"),
        }),
      );

      // Vérifier dans la DB
      const commande = await testPrisma.commandes.findUnique({
        where: { id: testCommandeId },
      });

      expect(commande?.statut).toBe("pay_e");
    });

    it("devrait créer un historique lors du changement de statut", async () => {
      // D'abord mettre la commande en statut payée
      await testPrisma.commandes.update({
        where: { id: testCommandeId },
        data: { statut: "pay_e" as any },
      });

      const mockRequest = {
        params: { id: testCommandeId.toString() },
        body: { statut: "exp_di_e" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier l'historique
      const historique = await testPrisma.historique_statuts_commande.findMany({
        where: { commande_id: testCommandeId },
      });

      expect(historique.length).toBeGreaterThan(0);
      expect(historique[0].ancien_statut).toBe("pay_e");
      expect(historique[0].nouveau_statut).toBe("exp_di_e");
    });

    it("devrait diminuer le stock lors du passage en 'expédiée'", async () => {
      // Mettre d'abord la commande en statut payée
      await testPrisma.commandes.update({
        where: { id: testCommandeId },
        data: { statut: "pay_e" as any },
      });

      // Vérifier le stock initial
      const stockAvant = await testPrisma.articles_tailles.findFirst({
        where: {
          article_id: testArticleId,
          taille_id: testTailleId,
        },
      });

      expect(stockAvant?.stock_disponible).toBe(50);

      const mockRequest = {
        params: { id: testCommandeId.toString() },
        body: { statut: "exp_di_e" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier le stock après
      const stockApres = await testPrisma.articles_tailles.findFirst({
        where: {
          article_id: testArticleId,
          taille_id: testTailleId,
        },
      });

      expect(stockApres?.stock_disponible).toBe(48); // 50 - 2
    });

    it("devrait restaurer le stock lors d'une annulation", async () => {
      // D'abord passer la commande en "payée" puis "expédiée" pour diminuer le stock
      await testPrisma.commandes.update({
        where: { id: testCommandeId },
        data: { statut: "pay_e" as any },
      });

      const mockReq1 = {
        params: { id: testCommandeId.toString() },
        body: { statut: "exp_di_e" },
      } as Partial<Request>;

      const mockRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockReq1 as Request, mockRes1, testPrisma);

      await testPrisma.articles_tailles.update({
        where: {
          article_id_taille_id: {
            article_id: testArticleId,
            taille_id: testTailleId,
          },
        },
        data: { stock_disponible: 48 },
      });

      // Puis annuler
      const mockRequest = {
        params: { id: testCommandeId.toString() },
        body: { statut: "annul_e" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier que le stock a été restauré à 50 (la diminution puis restauration)
      const stockFinal = await testPrisma.articles_tailles.findFirst({
        where: {
          article_id: testArticleId,
          taille_id: testTailleId,
        },
      });

      expect(stockFinal?.stock_disponible).toBe(50); // Stock restauré
    });

    it("devrait rejeter un changement de statut invalide", async () => {
      const mockRequest = {
        params: { id: testCommandeId.toString() },
        body: { statut: "statut_invalide" },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateStatut(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Batch updates", () => {
    let commandeIds: number[];

    beforeEach(async () => {
      // Créer plusieurs commandes
      const commandes = await Promise.all([
        testPrisma.commandes.create({
          data: {
            utilisateur_id: testUserId,
            numero_commande: "CMD-BATCH-001",
            statut: "en_attente" as any,
            total: 49.99,
            date_commande: new Date(),
          },
        }),
        testPrisma.commandes.create({
          data: {
            utilisateur_id: testUserId,
            numero_commande: "CMD-BATCH-002",
            statut: "en_attente" as any,
            total: 49.99,
            date_commande: new Date(),
          },
        }),
        testPrisma.commandes.create({
          data: {
            utilisateur_id: testUserId,
            numero_commande: "CMD-BATCH-003",
            statut: "en_attente" as any,
            total: 49.99,
            date_commande: new Date(),
          },
        }),
      ]);

      commandeIds = commandes.map((c) => c.id);
    });

    it("devrait mettre à jour plusieurs commandes en batch", async () => {
      // Mettre d'abord la commande 1 en statut payée pour permettre la transition vers expédiée
      await testPrisma.commandes.update({
        where: { id: commandeIds[1] },
        data: { statut: "pay_e" as any },
      });

      const mockRequest = {
        body: {
          updates: [
            { commandeId: commandeIds[0], statut: "pay_e" },
            { commandeId: commandeIds[1], statut: "exp_di_e" },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse,
        testPrisma,
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.objectContaining({
            successCount: 2,
            errorCount: 0,
          }),
        }),
      );

      // Vérifier dans la DB
      const commandes = await testPrisma.commandes.findMany({
        where: { id: { in: commandeIds } },
        orderBy: { id: "asc" },
      });

      // Vérifier les statuts dans la DB en utilisant les valeurs enum
      // Vérifier les commandes par leur ID spécifique
      const commande1 = commandes.find((c) => c.id === commandeIds[0]);
      const commande2 = commandes.find((c) => c.id === commandeIds[1]);

      expect(commande1?.statut).toBe("pay_e");
      expect(commande2?.statut).toBe("exp_di_e");
    });

    it("devrait gérer les erreurs partielles dans un batch", async () => {
      // Mettre d'abord la commande 1 en statut payée pour permettre la transition vers expédiée
      await testPrisma.commandes.update({
        where: { id: commandeIds[1] },
        data: { statut: "pay_e" as any },
      });

      const mockRequest = {
        body: {
          updates: [
            { commandeId: commandeIds[0], statut: "pay_e" },
            { commandeId: commandeIds[1], statut: "exp_di_e" },
            { commandeId: 99999, statut: "pay_e" }, // Commande inexistante pour générer une erreur
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse,
        testPrisma,
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      expect(response.results.successCount).toBe(2);
      expect(response.results.errorCount).toBe(1);
    });
  });

  describe("Intégrité des données et transactions", () => {
    it("devrait maintenir la cohérence en cas d'erreur lors de la création", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: 99999, // Utilisateur inexistant
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 1,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      // Vérifier qu'aucune donnée corrompue n'a été insérée
      const commandes = await testPrisma.commandes.count();
      const commandesArticles = await testPrisma.commande_articles.count();

      expect(commandes).toBe(0);
      expect(commandesArticles).toBe(0);
    });

    it("devrait calculer le total correctement", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: 3,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      const commande = await testPrisma.commandes.findFirst({});

      // 3 * 49.99 = 149.97
      expect(parseFloat(commande!.total.toString())).toBeCloseTo(149.97, 2);
    });
  });

  describe("Cas limites", () => {
    it("devrait gérer une commande avec 0 articles", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: testUserId,
          articles: [],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("devrait gérer une commande avec quantité négative", async () => {
      const mockRequest = {
        body: {
          utilisateur_id: testUserId,
          articles: [
            {
              article_id: testArticleId,
              taille_id: testTailleId,
              quantite: -5,
              prix: 49.99,
            },
          ],
        },
      } as Partial<Request>;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createCommande(mockRequest as Request, mockResponse, testPrisma);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("devrait gérer correctement les commandes multiples du même utilisateur", async () => {
      // Créer 5 commandes pour le même utilisateur
      for (let i = 0; i < 5; i++) {
        const mockRequest = {
          body: {
            utilisateur_id: testUserId,
            articles: [
              {
                article_id: testArticleId,
                taille_id: testTailleId,
                quantite: 1,
                prix: 49.99,
              },
            ],
          },
        } as Partial<Request>;

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        await createCommande(mockRequest as Request, mockResponse, testPrisma);
      }

      const commandes = await testPrisma.commandes.findMany({
        where: { utilisateur_id: testUserId },
      });

      expect(commandes).toHaveLength(5);

      // Tous les numéros de commande doivent être uniques
      const numerosUniques = new Set(commandes.map((c) => c.numero_commande));
      expect(numerosUniques.size).toBe(5);
    });
  });
});
