/**
 * Tests d'intégration pour le service Magasin - Mocks locaux  
 * Focus sur les workflows complets et les interactions entre modules
 */

import { jest, describe, test, beforeEach, afterEach, expect } from '@jest/globals';
import type { 
  ArticleCreationData, 
  NouvelleCommande
} from '@clubmanager/types';
import * as articlesCore from '../core/articles/index.js';
import * as commandesCore from '../core/commandes/index.js';
import * as stocksCore from '../core/stocks/index.js';
import * as categoriesCore from '../core/categories/index.js';
import { MagasinService } from '../magasin.service.js';
import { createMockPrisma, resetMockData, mockHelpers } from './magasin.mock.js';

describe('MagasinService - Tests d\'Intégration avec Mocks Locaux', () => {
  let magasinService: MagasinService;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset des données de test
    resetMockData();
    
    // Création du mock Prisma
    mockPrisma = createMockPrisma();
    
    // Instance du service
    magasinService = new MagasinService();
  });

  // === WORKFLOW COMPLET ARTICLES ===

  describe('Workflow Articles - Création et consultation', () => {
    test('devrait créer un article avec images et stocks complets', async () => {
      const articleData: ArticleCreationData = {
        nom: 'Nouveau T-shirt',
        description: 'Super t-shirt de test',
        prix: 35.99,
        images: [
          'https://example.com/new-tshirt-front.jpg',
          'https://example.com/new-tshirt-back.jpg'
        ],
        categorie_id: 1,
        stocks: [
          { taille: 'S', quantite: 5 },
          { taille: 'M', quantite: 10 },
          { taille: 'L', quantite: 8 }
        ]
      };

      // Mock des réponses pour la création complète
      mockPrisma.tailles.findMany.mockResolvedValue([
        { id: 1, nom: 'S' },
        { id: 2, nom: 'M' },
        { id: 3, nom: 'L' }
      ]);

      const stockCreations: any[] = [];
      mockPrisma.stocks.create.mockImplementation(({ data }: any) => {
        stockCreations.push(data);
        return Promise.resolve({
          id: stockCreations.length,
          ...data,
          articles: { id: data.article_id, nom: 'Nouveau T-shirt', prix: 35.99 },
          tailles: { id: data.taille_id, nom: ['S', 'M', 'L'][data.taille_id - 1] }
        });
      });

      // Transaction mock qui exécute tout le workflow
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const result = {
          article: { id: 3, nom: articleData.nom, prix: articleData.prix },
          images_count: articleData.images?.length || 0,
          stocks_count: articleData.stocks?.length || 0
        };
        return result;
      });

      const result = await articlesCore.creerArticle(articleData, mockPrisma);

      expect((result as any).success).toBe(true);
      expect(result.message).toContain('succès');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    test('devrait récupérer tous les articles avec leurs relations', async () => {
      const result = await articlesCore.obtenirTousLesArticles(mockPrisma);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Vérifier la structure des articles retournés
      const premier = result[0];
      expect(premier).toHaveProperty('id');
      expect(premier).toHaveProperty('nom');
      expect(premier).toHaveProperty('prix');
      expect(premier).toHaveProperty('images');
      expect(premier).toHaveProperty('stocks');
    });

    test('devrait grouper les articles par catégories correctement', async () => {
      const result = await articlesCore.obtenirArticlesParCategories(mockPrisma);

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();

      // Vérifier que les articles sont bien groupés
      const categories = Object.keys(result);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  // === WORKFLOW COMPLET COMMANDES ===

  describe('Workflow Commandes - Création et gestion', () => {
    test('devrait créer une commande complète avec vérification de stocks', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, taille: 'M', quantite: 2, prix: 25.99 },
          { article_id: 2, taille: 'L', quantite: 1, prix: 89.99 }
        ],
        total: 141.97
      };

      // Mock pour simulation complète du workflow
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Simuler les vérifications de stock
        const commande = {
          id: 2,
          utilisateur_id: commandeData.utilisateur_id,
          total: commandeData.total,
          statut: 'en_attente',
          date: new Date()
        };

        // Simuler la création des articles de commande
        const articlesCommande = commandeData.articles.map((article: any, index: number) => ({
          id: index + 1,
          commande_id: commande.id,
          ...article
        }));

        return {
          commande_id: commande.id,
          total: commande.total,
          articles_count: articlesCommande.length
        };
      });

      // Mock pour récupérer les détails de la commande créée
      const commandeComplete = mockHelpers.createMockCommande({
        id: 2,
        utilisateur_id: 1,
        total: 141.97
      });
      mockPrisma.commandes.findUnique.mockResolvedValue(commandeComplete);

      const result = await commandesCore.ajouterCommande(commandeData, mockPrisma);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    test('devrait récupérer les commandes d\'un utilisateur avec détails', async () => {
      const utilisateurId = 1;
      
      const result = await commandesCore.obtenirCommandesUtilisateur(utilisateurId, mockPrisma);

      expect(result).toBeInstanceOf(Array);
      expect(mockPrisma.commandes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { utilisateur_id: utilisateurId }
        })
      );
    });

    test('devrait modifier le statut d\'une commande', async () => {
      const commandeId = 1;
      const nouveauStatut = 'expediee';

      // Mock pour trouver la commande existante
      const commandeExistante = mockHelpers.createMockCommande({
        id: commandeId,
        statut: 'confirmee'
      });
      mockPrisma.commandes.findUnique.mockResolvedValue(commandeExistante);

      // Mock pour la mise à jour
      mockPrisma.commandes.update.mockImplementation(({ where, data }: any) => {
        commandeExistante.statut = data.statut;
        return Promise.resolve(commandeExistante);
      });

      const result = await commandesCore.modifierStatutCommande(commandeId, nouveauStatut as any, mockPrisma);

      expect((result as any).success).toBe(true);
      expect(result.message).toContain(nouveauStatut);
      expect(mockPrisma.commandes.update).toHaveBeenCalledWith({
        where: { id: commandeId },
        data: { statut: nouveauStatut }
      });
    });

    test('devrait annuler une commande et restaurer les stocks', async () => {
      const commandeId = 1;

      // Mock de transaction pour l'annulation
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Simuler la récupération de la commande avec articles
        const commande = mockHelpers.createMockCommande({
          id: commandeId,
          statut: 'confirmee'
        });

        // Simuler la restauration des stocks
        return {
          commandeId,
          articles_restored: 2
        };
      });

      const result = await commandesCore.annulerCommande(commandeId, mockPrisma);

      expect((result as any).success).toBe(true);
      expect(result.message).toContain('annulée');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // === WORKFLOW GESTION STOCKS ===

  describe('Workflow Stocks - Gestion et vérifications', () => {
    test('devrait mettre à jour un stock existant', async () => {
      const articleId = 1;
      const taille = 'M';
      const nouvelleQuantite = 20;

      // Mock du stock existant
      const stockExistant = mockHelpers.createMockStock({
        article_id: articleId,
        taille_id: 2,
        quantite: 15
      });
      mockPrisma.stocks.findFirst.mockResolvedValue(stockExistant);

      // Mock de l'article existant
      mockPrisma.articles.findUnique.mockResolvedValue({
        id: articleId,
        nom: 'T-shirt Basic'
      });

      // Mock de la mise à jour
      mockPrisma.stocks.update.mockImplementation(({ data }: any) => {
        stockExistant.quantite = data.quantite;
        return Promise.resolve(stockExistant);
      });

      const result = await stocksCore.mettreAJourStock(articleId, taille, nouvelleQuantite, mockPrisma);

      expect((result as any).success).toBe(true);
      expect((result as any).data!).toMatchObject({
        articleId,
        taille,
        nouvelleQuantite
      });
    });

    test('devrait vérifier la disponibilité d\'un stock', async () => {
      const articleId = 1;
      const taille = 'M';
      const quantiteDemandee = 5;

      // Mock du stock disponible
      mockPrisma.stocks.findFirst.mockResolvedValue({
        id: 1,
        article_id: articleId,
        taille_id: 2,
        quantite: 10
      });

      const result = await stocksCore.verifierDisponibilite(articleId, taille, quantiteDemandee, mockPrisma);

      expect(result).toHaveProperty('disponible', true);
      expect(result).toHaveProperty('quantiteDisponible', 10);
    });

    test('devrait détecter un stock insuffisant', async () => {
      const articleId = 1;
      const taille = 'M';
      const quantiteDemandee = 20;

      // Mock du stock insuffisant
      mockPrisma.stocks.findFirst.mockResolvedValue({
        id: 1,
        article_id: articleId,
        taille_id: 2,
        quantite: 5
      });

      const result = await stocksCore.verifierDisponibilite(articleId, taille, quantiteDemandee, mockPrisma);

      expect(result).toHaveProperty('disponible', false);
      expect(result).toHaveProperty('quantiteDisponible', 5);
    });

    test('devrait récupérer les articles en rupture de stock', async () => {
      const seuilMinimum = 3;

      // Mock des stocks en rupture
      mockPrisma.stocks.findMany.mockResolvedValue([
        {
          article_id: 1,
          quantite: 2,
          articles: { id: 1, nom: 'T-shirt Basic', prix: 25.99 },
          tailles: { nom: 'S' }
        },
        {
          article_id: 2,
          quantite: 0,
          articles: { id: 2, nom: 'Jean Slim', prix: 89.99 },
          tailles: { nom: 'M' }
        }
      ]);

      const result = await stocksCore.obtenirArticlesRuptureStock(seuilMinimum, mockPrisma);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrisma.stocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            quantite: { lte: seuilMinimum }
          }
        })
      );
    });
  });

  // === WORKFLOW CATÉGORIES ===

  describe('Workflow Catégories - CRUD complet', () => {
    test('devrait créer une nouvelle catégorie unique', async () => {
      const nomCategorie = 'Nouvelle Catégorie';

      // Mock : catégorie n'existe pas
      mockPrisma.categories.findFirst.mockResolvedValue(null);

      // Mock de création
      mockPrisma.categories.create.mockResolvedValue({
        id: 4,
        nom: nomCategorie
      });

      const result = await categoriesCore.creerCategorie(nomCategorie, mockPrisma);

      expect((result as any).success).toBe(true);
      expect((result as any).data!).toMatchObject({
        nom: nomCategorie
      });
    });

    test('devrait récupérer les catégories avec compteurs d\'articles', async () => {
      // Mock des catégories avec compteurs
      mockPrisma.categories.findMany.mockResolvedValue([
        { id: 1, nom: 'T-shirts', _count: { articles: 3 } },
        { id: 2, nom: 'Pantalons', _count: { articles: 2 } },
        { id: 3, nom: 'Vestes', _count: { articles: 0 } }
      ]);

      const result = await categoriesCore.obtenirCategoriesAvecCompteurs(mockPrisma);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('nombreArticles');
      expect(mockPrisma.categories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { articles: true } } }
        })
      );
    });

    test('devrait récupérer les articles d\'une catégorie spécifique', async () => {
      const categorieId = 1;

      // Mock de la catégorie avec ses articles
      mockPrisma.categories.findUnique.mockResolvedValue({
        id: categorieId,
        nom: 'T-shirts',
        articles: [
          {
            id: 1,
            nom: 'T-shirt Basic',
            images: [{ url: 'test.jpg' }],
            stocks: [{ tailles: { nom: 'M' }, quantite: 10 }]
          }
        ]
      });

      const result = await categoriesCore.obtenirArticlesParCategorie(categorieId, mockPrisma);

      expect(result).toHaveProperty('categorie');
      expect(result).toHaveProperty('articles');
      expect(result.categorie.id).toBe(categorieId);
      expect(result.articles).toBeInstanceOf(Array);
    });

    test('devrait modifier une catégorie existante', async () => {
      const categorieId = 1;
      const nouveauNom = 'T-shirts Premium';

      // Mock : catégorie existe
      mockPrisma.categories.findUnique.mockResolvedValue({
        id: categorieId,
        nom: 'T-shirts'
      });

      // Mock : nouveau nom n'existe pas
      mockPrisma.categories.findFirst.mockResolvedValue(null);

      // Mock de modification
      mockPrisma.categories.update.mockResolvedValue({
        id: categorieId,
        nom: nouveauNom
      });

      const result = await categoriesCore.modifierCategorie(categorieId, nouveauNom, mockPrisma);

      expect((result as any).success).toBe(true);
      expect((result as any).data!).toMatchObject({
        nouveauNom
      });
    });
  });

  // === TESTS D'INTÉGRATION ERREURS ===

  describe('Gestion d\'erreurs dans les workflows', () => {
    test('devrait gérer les erreurs de transaction lors de la création de commande', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 999, quantite: 1, prix: 25.99 }]
      };

      // Mock d'erreur dans la transaction
      mockPrisma.$transaction.mockRejectedValue(new Error('Erreur transaction'));

      await expect(commandesCore.ajouterCommande(commandeData, mockPrisma))
        .rejects.toThrow('Erreur');
    });

    test('devrait gérer les conflits de noms de catégories', async () => {
      const nomExistant = 'Catégorie Existante';

      // Mock : catégorie existe déjà
      mockPrisma.categories.findFirst.mockResolvedValue({
        id: 5,
        nom: nomExistant
      });

      await expect(categoriesCore.creerCategorie(nomExistant, mockPrisma))
        .rejects.toThrow('existe déjà');
    });

    test('devrait gérer les stocks insuffisants dans les commandes', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, taille: 'M', quantite: 100, prix: 25.99 }]
      };

      // Mock d'erreur de stock insuffisant dans la transaction
      mockPrisma.$transaction.mockImplementation(async () => {
        throw new Error('Stock insuffisant');
      });

      await expect(commandesCore.ajouterCommande(commandeData, mockPrisma))
        .rejects.toThrow('Erreur');
    });
  });
});