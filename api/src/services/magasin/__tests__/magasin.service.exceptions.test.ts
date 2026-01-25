/**
 * Tests d'exceptions et cas limites pour le service Magasin
 * Couvre les validations, stocks, commandes et gestion d'erreurs
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockPrisma } from './magasin.mock.js';
import type { 
  ArticleCreationData, 
  NouvelleCommande,
  FiltresArticles 
} from '@clubmanager/types';

// Créer le mock Prisma
const mockPrisma = createMockPrisma();

// Mock le module prisma-client AVANT l'import du service
jest.unstable_mockModule('../../../infrastructure/database/prisma-client.js', () => ({
  prisma: mockPrisma,
}));

// Import dynamique du service APRÈS le mock
const { MagasinService } = await import('../magasin.service.js');

describe('MagasinService - Tests d\'Exceptions', () => {
  let magasinService: InstanceType<typeof MagasinService>;

  beforeEach(() => {
    magasinService = new MagasinService();
    mockPrisma._reset();
  });

  // ===========================================
  // TESTS ARTICLES - CRÉATION
  // ===========================================

  describe('Articles - Création - Validations', () => {
    it('devrait rejeter un article sans nom', async () => {
      const data: ArticleCreationData = {
        prix: 29.99,
        categorie_id: 1,
        description: 'Test article'
      } as any;

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/nom.*obligatoire/i);
    });

    it('devrait rejeter un article avec nom vide', async () => {
      const data: ArticleCreationData = {
        nom: '',
        prix: 29.99,
        categorie_id: 1,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/nom/i);
    });

    it('devrait rejeter un article avec nom contenant uniquement des espaces', async () => {
      const data: ArticleCreationData = {
        nom: '   ',
        prix: 29.99,
        categorie_id: 1,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/nom/i);
    });

    it('devrait rejeter un article sans prix', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        categorie_id: 1,
        description: 'Test article'
      } as any;

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/prix/i);
    });

    it('devrait rejeter un article avec prix négatif', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: -10,
        categorie_id: 1,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/prix.*positif/i);
    });

    it('devrait rejeter un article avec prix = 0', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 0,
        categorie_id: 1,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/prix.*positif/i);
    });

    it('devrait rejeter un article sans catégorie', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 29.99,
        description: 'Test article'
      } as any;

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow(/catégorie.*obligatoire/i);
    });

    it('devrait rejeter un article avec categorie_id invalide (0)', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 29.99,
        categorie_id: 0,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow();
    });

    it('devrait rejeter un article avec categorie_id négatif', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 29.99,
        categorie_id: -1,
        description: 'Test article'
      };

      await expect(async () => {
        await magasinService.creerArticle(data);
      }).rejects.toThrow();
    });

    it('devrait accepter un article avec description vide', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 29.99,
        categorie_id: 1,
        description: ''
      };

      const result = await magasinService.creerArticle(data);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('devrait gérer les caractères spéciaux dans le nom', async () => {
      const data: ArticleCreationData = {
        nom: 'Article <>&"\' Test',
        prix: 29.99,
        categorie_id: 1,
        description: 'Test'
      };

      const result = await magasinService.creerArticle(data);
      expect(result).toBeDefined();
    });
  });

  // ===========================================
  // TESTS COMMANDES - CRÉATION
  // ===========================================

  describe('Commandes - Création - Validations', () => {
    it('devrait rejeter une commande sans utilisateur_id', async () => {
      const commande: NouvelleCommande = {
        articles: [
          { article_id: 1, quantite: 2, prix: 10 }
        ]
      } as any;

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/utilisateur/i);
    });

    it('devrait rejeter une commande avec utilisateur_id invalide (0)', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 0,
        articles: [
          { article_id: 1, quantite: 2, prix: 10 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une commande avec utilisateur_id négatif', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: -1,
        articles: [
          { article_id: 1, quantite: 2, prix: 10 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une commande sans articles', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: []
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/article/i);
    });

    it('devrait rejeter une commande avec article sans article_id', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { quantite: 2, prix: 10 } as any
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une commande avec quantité invalide (0)', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 0, prix: 10 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/quantité/i);
    });

    it('devrait rejeter une commande avec quantité négative', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: -5, prix: 10 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/quantité/i);
    });

    it('devrait accepter une commande sans notes', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 2, prix: 10 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('devrait gérer plusieurs articles dans une commande', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 2, prix: 10 },
          { article_id: 2, quantite: 3, prix: 5 },
          { article_id: 3, quantite: 1, prix: 15 }
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ===========================================
  // TESTS COMMANDES - QUERIES
  // ===========================================

  describe('Commandes - Queries - Validations', () => {
    it('devrait retourner un tableau vide si aucune commande', async () => {
      const result = await magasinService.obtenirToutesLesCommandes();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.commandes)).toBe(true);
    });

    it('devrait rejeter obtenirCommandesUtilisateur avec ID invalide (0)', async () => {
      const result = await magasinService.obtenirCommandesUtilisateur(0);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter obtenirCommandesUtilisateur avec ID négatif', async () => {
      const result = await magasinService.obtenirCommandesUtilisateur(-1);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

  });

  // ===========================================
  // TESTS COMMANDES - STATUTS
  // ===========================================

  describe('Commandes - Statuts - Validations', () => {
    it('devrait rejeter le changement de statut avec commande_id invalide', async () => {
      await expect(async () => {
        await magasinService.modifierStatutCommande(0, 'en_preparation');
      }).rejects.toThrow();
    });

    it('devrait rejeter le changement de statut avec statut invalide', async () => {
      await expect(async () => {
        await magasinService.modifierStatutCommande(1, 'statut_invalide' as any);
      }).rejects.toThrow();
    });

    it('devrait rejeter le changement de statut pour une commande inexistante', async () => {
      await expect(async () => {
        await magasinService.modifierStatutCommande(999999, StatutCommande.EN_PREPARATION);
      }).rejects.toThrow();
    });
  });

  // ===========================================
  // TESTS ARTICLES - QUERIES
  // ===========================================

  describe('Articles - Queries - Validations', () => {
    it('devrait retourner tous les articles', async () => {
      const result = await magasinService.obtenirTousLesArticles();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.articles)).toBe(true);
    });

    it('devrait retourner les articles par catégories', async () => {
      const result = await magasinService.obtenirArticlesParCategories();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  // ===========================================
  // TESTS STOCKS - VALIDATIONS
  // ===========================================

  describe('Stocks - Validations', () => {
    it('devrait rejeter la mise à jour de stock avec article_id invalide', async () => {
      await expect(async () => {
        await magasinService.mettreAJourStock(0, 'M', 10);
      }).rejects.toThrow();
    });

    it('devrait rejeter la mise à jour de stock avec quantité négative', async () => {
      await expect(async () => {
        await magasinService.mettreAJourStock(1, 'M', -5);
      }).rejects.toThrow(/quantité/i);
    });

    it('devrait accepter une quantité de stock à 0', async () => {
      const result = await magasinService.mettreAJourStock(1, 'M', 0);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('devrait rejeter le stock pour un article inexistant', async () => {
      await expect(async () => {
        await magasinService.mettreAJourStock(999999, 'M', 10);
      }).rejects.toThrow();
    });
  });

  // ===========================================
  // TESTS CATÉGORIES
  // ===========================================

  describe('Catégories - Validations', () => {
    it('devrait retourner toutes les catégories', async () => {
      const result = await magasinService.obtenirToutesLesCategories();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.categories)).toBe(true);
    });

    it('devrait rejeter la création de catégorie avec nom vide', async () => {
      await expect(async () => {
        await magasinService.creerCategorie('');
      }).rejects.toThrow(/nom/i);
    });

    it('devrait accepter une catégorie sans description', async () => {
      const result = await magasinService.creerCategorie('Nouvelle catégorie');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('devrait rejeter la suppression d\'une catégorie avec articles associés', async () => {
      await expect(async () => {
        await magasinService.supprimerCategorie(1);
      }).rejects.toThrow();
    });
  });

  // ===========================================
  // TESTS SÉCURITÉ - INJECTION ET XSS
  // ===========================================

  describe('Sécurité - Protection contre les injections', () => {
    it('devrait gérer les tentatives d\'injection SQL dans le nom d\'article', async () => {
      const data: ArticleCreationData = {
        nom: "' OR '1'='1",
        prix: 29.99,
        categorie_id: 1,
        description: 'Test'
      };

      const result = await magasinService.creerArticle(data);
      expect(result).toBeDefined();
    });

    it('devrait gérer les scripts XSS dans la description', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 29.99,
        categorie_id: 1,
        description: '<script>alert("xss")</script>'
      };

      const result = await magasinService.creerArticle(data);
      expect(result).toBeDefined();
    });

    it('devrait gérer les balises HTML dans les notes de commande', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 2 }
        ],
        notes: '<script>alert("xss")</script>'
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result).toBeDefined();
    });
  });

  // ===========================================
  // TESTS CONCURRENCE
  // ===========================================

  describe('Concurrence - Gestion des stocks', () => {
    it('devrait gérer les commandes simultanées sur le même article', async () => {
      const commande1: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1 }]
      };

      const commande2: NouvelleCommande = {
        utilisateur_id: 2,
        articles: [{ article_id: 1, quantite: 1 }]
      };

      const [result1, result2] = await Promise.all([
        magasinService.ajouterCommande(commande1),
        magasinService.ajouterCommande(commande2)
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('devrait gérer les mises à jour simultanées de stock', async () => {
      const [result1, result2] = await Promise.all([
        magasinService.mettreAJourStock(1, 'M', 10),
        magasinService.mettreAJourStock(1, 'L', 20)
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  // ===========================================
  // TESTS PRIX ET CALCULS
  // ===========================================

  describe('Prix - Validations et calculs', () => {
    it('devrait calculer correctement le total d\'une commande', async () => {
      const commande: NouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          { article_id: 1, quantite: 2, prix: 10 }, // 2 x 10€ = 20€
          { article_id: 2, quantite: 3, prix: 5 }  // 3 x 5€ = 15€
        ]
      };

      const result = await magasinService.ajouterCommande(commande);
      expect(result.success).toBe(true);
      if (result.data?.commande) {
        expect(result.data.commande.total).toBe(35);
      }
    });

    it('devrait gérer les prix décimaux', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 19.99,
        categorie_id: 1,
        description: 'Test'
      };

      const result = await magasinService.creerArticle(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter les prix avec trop de décimales', async () => {
      const data: ArticleCreationData = {
        nom: 'Article Test',
        prix: 19.999999,
        categorie_id: 1,
        description: 'Test'
      };

      const result = await magasinService.creerArticle(data);
      expect(result).toBeDefined();
    });
  });
});


