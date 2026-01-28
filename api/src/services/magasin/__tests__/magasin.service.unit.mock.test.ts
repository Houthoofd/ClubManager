/**
 * Tests unitaires pour le service Magasin - Mocks locaux
 * Focus sur la logique métier et les validations
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
import { createMockPrisma, resetMockData } from './magasin.mock.js';

describe('MagasinService - Tests Unitaires avec Mocks Locaux', () => {
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

  // === TESTS ARTICLES ===

  describe('Articles - Validations et logique métier', () => {
    test('creerArticle devrait valider le nom obligatoire', async () => {
      const articleData: ArticleCreationData = {
        nom: '',
        description: 'Test',
        prix: 25.99,
        categorie_id: 1,
        images: [],
        stocks: []
      };

      await expect(magasinService.creerArticle(articleData))
        .rejects.toThrow('Le nom de l\'article est obligatoire');
    });

    test('creerArticle devrait valider le prix positif', async () => {
      const articleData: ArticleCreationData = {
        nom: 'Test Article',
        description: 'Test',
        prix: -10,
        categorie_id: 1,
        images: [],
        stocks: []
      };

      await expect(magasinService.creerArticle(articleData))
        .rejects.toThrow('Le prix doit être positif');
    });

    test('creerArticle devrait valider la catégorie obligatoire', async () => {
      const articleData: ArticleCreationData = {
        nom: 'Test Article',
        description: 'Test',
        prix: 25.99,
        categorie_id: 0,
        images: [],
        stocks: []
      };

      await expect(magasinService.creerArticle(articleData))
        .rejects.toThrow('La catégorie est obligatoire');
    });

    test('obtenirTousLesArticles devrait retourner la structure attendue', async () => {
      const articles = await articlesCore.obtenirTousLesArticles(mockPrisma);

      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toHaveProperty('id');
      expect(articles[0]).toHaveProperty('nom');
    });

    test('obtenirArticlesParCategories devrait grouper les articles', async () => {
      const result = await articlesCore.obtenirArticlesParCategories(mockPrisma);

      expect(typeof result).toBe('object');
      // Vérifie que les articles sont groupés par catégorie
      const categories = Object.keys(result);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  // === TESTS COMMANDES ===

  describe('Commandes - Validations et logique métier', () => {
    test('ajouterCommande devrait valider l\'ID utilisateur', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 0,
        articles: [
          { article_id: 1, quantite: 1, prix: 25.99 }
        ]
      };

      const result = await magasinService.ajouterCommande(commandeData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('ID utilisateur invalide');
    });

    test('ajouterCommande devrait valider la présence d\'articles', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: []
      };

      const result = await magasinService.ajouterCommande(commandeData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('au moins un article');
    });

    test('ajouterCommande devrait valider les quantités positives', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 0, prix: 25.99 }
        ]
      };

      const result = await magasinService.ajouterCommande(commandeData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('quantité doit être positive');
    });

    test('ajouterCommande devrait valider les prix non négatifs', async () => {
      const commandeData: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 1, prix: -5 }
        ]
      };

      const result = await magasinService.ajouterCommande(commandeData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('prix doit être positif');
    });

    test('modifierStatutCommande devrait valider l\'ID commande', async () => {
      await expect(magasinService.modifierStatutCommande(0, 'confirmee' as any))
        .rejects.toThrow('ID commande invalide');
    });

    test('modifierStatutCommande devrait valider le statut', async () => {
      await expect(magasinService.modifierStatutCommande(1, 'statut_invalide' as any))
        .rejects.toThrow('Statut de commande invalide');
    });

    test('obtenirCommandesUtilisateur devrait valider l\'ID utilisateur', async () => {
      const result = await magasinService.obtenirCommandesUtilisateur(0);
      expect(result.success).toBe(false);
      expect(result.message).toContain('ID utilisateur invalide');
    });

    test('annulerCommande devrait valider l\'ID commande', async () => {
      await expect(magasinService.annulerCommande(0))
        .rejects.toThrow('ID commande invalide');
    });
  });

  // === TESTS STOCKS ===

  describe('Stocks - Validations et logique métier', () => {
    test('obtenirStocksArticle devrait valider l\'ID article', async () => {
      const result = await magasinService.obtenirStocksArticle(0);
      expect(result.success).toBe(false);
      expect(result.message).toContain('ID article invalide');
    });

    test('mettreAJourStock devrait valider l\'ID article', async () => {
      await expect(magasinService.mettreAJourStock(0, 'M', 10))
        .rejects.toThrow('ID article invalide');
    });

    test('mettreAJourStock devrait valider la taille', async () => {
      await expect(magasinService.mettreAJourStock(1, '', 10))
        .rejects.toThrow('Taille invalide');
    });

    test('mettreAJourStock devrait valider les quantités non négatives', async () => {
      await expect(magasinService.mettreAJourStock(1, 'M', -5))
        .rejects.toThrow('quantité ne peut pas être négative');
    });

    test('verifierDisponibilite devrait valider les paramètres', async () => {
      await expect(magasinService.verifierDisponibilite(0, 'M', 1))
        .rejects.toThrow('ID article invalide');

      await expect(magasinService.verifierDisponibilite(1, '', 1))
        .rejects.toThrow('Taille invalide');

      await expect(magasinService.verifierDisponibilite(1, 'M', 0))
        .rejects.toThrow('Quantité invalide');
    });
  });

  // === TESTS CATÉGORIES ===

  describe('Catégories - Validations et logique métier', () => {
    test('creerCategorie devrait valider le nom obligatoire', async () => {
      await expect(magasinService.creerCategorie(''))
        .rejects.toThrow('nom de la catégorie est obligatoire');
    });

    test('creerCategorie devrait nettoyer les espaces', async () => {
      // Le service doit appeler trim() sur le nom
      const nom = '  Test Category  ';
      
      // Configurer le mock pour vérifier que trim() est appelé
      mockPrisma.categories.findFirst.mockResolvedValue(null);
      mockPrisma.categories.create.mockImplementation(({ data }: any) => {
        expect(data.nom).toBe('Test Category'); // Vérifie que trim() a été appelé
        return Promise.resolve({ id: 1, nom: data.nom });
      });

      await categoriesCore.creerCategorie(nom, mockPrisma);
    });

    test('modifierCategorie devrait valider l\'ID catégorie', async () => {
      await expect(magasinService.modifierCategorie(0, 'Nouveau nom'))
        .rejects.toThrow('ID catégorie invalide');
    });

    test('modifierCategorie devrait valider le nom obligatoire', async () => {
      await expect(magasinService.modifierCategorie(1, ''))
        .rejects.toThrow('nom de la catégorie est obligatoire');
    });

    test('supprimerCategorie devrait valider l\'ID catégorie', async () => {
      await expect(magasinService.supprimerCategorie(0))
        .rejects.toThrow('ID catégorie invalide');
    });

    test('obtenirToutesLesCategories devrait retourner la structure attendue', async () => {
      const categories = await categoriesCore.obtenirToutesLesCategories(mockPrisma);

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('nom');
    });

    test('obtenirArticlesParCategorie devrait valider l\'ID catégorie', async () => {
      await expect(magasinService.obtenirArticlesParCategorie(0))
        .rejects.toThrow('ID catégorie invalide');
    });
  });

  // === TESTS STATISTIQUES ===

  describe('Statistiques et utilitaires', () => {
    test('obtenirArticlesRuptureStock devrait valider le seuil', async () => {
      await expect(magasinService.obtenirArticlesRuptureStock(-1))
        .rejects.toThrow('seuil minimum ne peut pas être négatif');
    });

    test('obtenirArticlesRuptureStock devrait accepter un seuil à zéro', async () => {
      // Ne devrait pas lever d'erreur avec seuil = 0
      const result = await stocksCore.obtenirArticlesRuptureStock(0, mockPrisma);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // === TESTS VÉRIFICATIONS ARTICLES ===

  describe('Vérifications - Articles', () => {
    test('verifierArticleExiste devrait avoir la signature correcte', () => {
      expect(typeof magasinService.verifierArticleExiste).toBe('function');
      expect(magasinService.verifierArticleExiste.length).toBe(1);
    });

    test('verifierArticleExisteParCategorie devrait avoir la signature correcte', () => {
      expect(typeof magasinService.verifierArticleExisteParCategorie).toBe('function');
      expect(magasinService.verifierArticleExisteParCategorie.length).toBe(2);
    });

    test('verifierCreationArticlePossible devrait avoir la signature correcte', () => {
      expect(typeof magasinService.verifierCreationArticlePossible).toBe('function');
      expect(magasinService.verifierCreationArticlePossible.length).toBe(2);
    });

    test('verifierModificationArticlePossible devrait avoir la signature correcte', () => {
      expect(typeof magasinService.verifierModificationArticlePossible).toBe('function');
      expect(magasinService.verifierModificationArticlePossible.length).toBe(1);
    });
  });

  // === TESTS GESTION D'ERREURS ===

  describe('Gestion des erreurs', () => {
    test('les erreurs Prisma doivent être transformées en réponses structurées', async () => {
      // Simulation d'erreur Prisma
      mockPrisma.articles.findMany.mockRejectedValue(new Error('Erreur base de données'));

      const result = await magasinService.obtenirTousLesArticles();
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    test('les erreurs MagasinError doivent être propagées correctement', async () => {
      const articleData: ArticleCreationData = {
        nom: '', // Nom vide pour déclencher une MagasinError
        description: 'Test',
        prix: 25.99,
        categorie_id: 1,
        images: [],
        stocks: []
      };

      try {
        await magasinService.creerArticle(articleData);
        throw new Error('Devrait lever une erreur');
      } catch (error: any) {
        expect(error.name).toBe('MagasinError');
        expect(error.code).toBe('INVALID_ARTICLE_NAME');
      }
    });
  });
});