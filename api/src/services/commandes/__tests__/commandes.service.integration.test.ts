/**
 * Tests d'intégration du service Commandes
 * 
 * Ces tests vérifient la logique métier complète avec mock Prisma
 *
 * Note: Les données mock sont documentées dans commandes.mock.ts
 * Le mock Prisma global est utilisé via jest.config.cjs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Service Commandes - Tests d\'intégration', () => {
  let commandesService: any;

  beforeEach(async () => {
    const module = await import('../commandes.service.js');
    commandesService = module.commandesService;
  });
  describe('Queries - Récupération des commandes', () => {
    it('devrait récupérer toutes les commandes', async () => {
      const commandes = await commandesService.obtenirToutesCommandes();
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes.length).toBeGreaterThan(0);
      
      // Vérifier structure
      const commande = commandes[0];
      expect(commande).toHaveProperty('commande_id');
      expect(commande).toHaveProperty('utilisateur_id');
      expect(commande).toHaveProperty('statut');
      expect(commande).toHaveProperty('total');
      expect(commande).toHaveProperty('articles');
      expect(commande).toHaveProperty('date_commande');
      expect(Array.isArray(commande.articles)).toBe(true);
    });

    it('devrait récupérer une commande par ID', async () => {
      const commande = await commandesService.obtenirCommandeParId('cmd-001');
      
      expect(commande).not.toBeNull();
      expect(commande?.commande_id).toBe('cmd-001');
      expect(commande?.utilisateur_id).toBe(1);
      expect(commande?.statut).toBe('en_attente');
      expect(commande?.total).toBeGreaterThan(0);
      expect(Array.isArray(commande?.articles)).toBe(true);
    });

    it('devrait retourner null pour une commande inexistante', async () => {
      const commande = await commandesService.obtenirCommandeParId('cmd-999');
      expect(commande).toBeNull();
    });

    it('devrait récupérer les commandes d\'un utilisateur', async () => {
      const commandes = await commandesService.obtenirCommandesUtilisateur(1);
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes.length).toBeGreaterThan(0);
      
      // Vérifier que toutes les commandes appartiennent à l'utilisateur
      commandes.forEach((c: any) => {
        expect(c.utilisateur_id).toBe(1);
      });
    });

    it('devrait récupérer les commandes par statut', async () => {
      const commandes = await commandesService.obtenirCommandesParStatut('en_attente');
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes.length).toBeGreaterThan(0);
      
      // Vérifier que toutes les commandes ont le bon statut
      commandes.forEach((c: any) => {
        expect(c.statut).toBe('en_attente');
      });
    });
  });

  describe('Mutations - Création et modification', () => {
    it('devrait créer une nouvelle commande', async () => {
      const input = {
        utilisateur_id: 1,
        statut: 'en_attente' as const,
        total: 99.99,
        articles: [
          { produit_id: 1, nom: 'Test produit', quantite: 1, prix_unitaire: 99.99, total: 99.99 },
        ],
        payment_intent_id: 'pi_test_new',
      };
      
      const commande = await commandesService.creerCommande(input);
      
      expect(commande).toBeDefined();
      expect(commande.commande_id).toBeDefined();
      expect(commande.utilisateur_id).toBe(1);
      expect(commande.statut).toBe('en_attente');
      expect(commande.total).toBe(99.99);
      expect(Array.isArray(commande.articles)).toBe(true);
      expect(commande.articles).toHaveLength(1);
    });

    it('devrait modifier le statut d\'une commande', async () => {
      const commande = await commandesService.modifierStatutCommande('cmd-001', 'confirmee');
      
      expect(commande).not.toBeNull();
      expect(commande?.statut).toBe('confirmee');
      expect(commande?.commande_id).toBe('cmd-001');
    });

    it('devrait retourner null lors de la modification d\'une commande inexistante', async () => {
      const commande = await commandesService.modifierStatutCommande('cmd-999', 'confirmee');
      expect(commande).toBeNull();
    });

    it('devrait modifier une commande', async () => {
      const updates = {
        total: 199.99,
        statut: 'en_preparation' as const,
      };
      
      const commande = await commandesService.modifierCommande('cmd-002', updates);
      
      expect(commande).not.toBeNull();
      expect(commande?.total).toBe(199.99);
      expect(commande?.statut).toBe('en_preparation');
    });

    it('devrait supprimer une commande', async () => {
      const success = await commandesService.supprimerCommande('cmd-004');
      expect(success).toBe(true);
    });

    it('devrait gérer la suppression d\'une commande inexistante', async () => {
      const success = await commandesService.supprimerCommande('cmd-999');
      expect(success).toBe(false);
    });
  });

  describe('Statistiques', () => {
    it('devrait récupérer les statistiques des commandes', async () => {
      const stats = await commandesService.obtenirStatistiques();
      
      expect(stats).toBeDefined();
      expect(stats.totalCommandes).toBeGreaterThan(0);
      expect(typeof stats.commandesEnAttente).toBe('number');
      expect(typeof stats.commandesConfirmees).toBe('number');
      expect(typeof stats.commandesEnPreparation).toBe('number');
      expect(typeof stats.commandesLivrees).toBe('number');
      expect(typeof stats.commandesAnnulees).toBe('number');
      expect(typeof stats.revenuTotal).toBe('number');
      expect(typeof stats.revenuMoisEnCours).toBe('number');
      expect(typeof stats.panierMoyen).toBe('number');
    });

    it('devrait calculer le panier moyen correctement', async () => {
      const stats = await commandesService.obtenirStatistiques();
      
      expect(stats.panierMoyen).toBeGreaterThan(0);
      
      // Panier moyen = revenu total / nombre de commandes
      const panierMoyenCalcule = stats.revenuTotal / stats.totalCommandes;
      expect(stats.panierMoyen).toBeCloseTo(panierMoyenCalcule, 2);
    });

    it('devrait compter les commandes par statut', async () => {
      const comptes = await commandesService.compterParStatut();
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes.length).toBeGreaterThan(0);
      
      // Vérifier structure
      comptes.forEach((c: any) => {
        expect(c).toHaveProperty('statut');
        expect(c).toHaveProperty('count');
        expect(typeof c.count).toBe('number');
      });
    });
  });

  describe('Recherche', () => {
    it('devrait rechercher des commandes sans filtre', async () => {
      const result = await commandesService.rechercherCommandes({});
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('devrait rechercher des commandes par statut', async () => {
      const result = await commandesService.rechercherCommandes({ statut: 'en_attente' });
      
      expect(result.items).toBeDefined();
      result.items.forEach((c: any) => {
        expect(c.statut).toBe('en_attente');
      });
    });

    it('devrait rechercher des commandes par utilisateur', async () => {
      const result = await commandesService.rechercherCommandes({ utilisateur_id: 1 });
      
      expect(result.items).toBeDefined();
      result.items.forEach((c: any) => {
        expect(c.utilisateur_id).toBe(1);
      });
    });

    it('devrait rechercher avec pagination', async () => {
      const page1 = await commandesService.rechercherCommandes({ page: 1, limit: 2 });
      
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.items.length).toBeLessThanOrEqual(2);
    });

    it('devrait rechercher par texte', async () => {
      const result = await commandesService.rechercherCommandes({ search: 'Jean' });
      
      expect(result.items).toBeDefined();
      // Devrait trouver les commandes de Jean
      expect(result.total).toBeGreaterThan(0);
    });

    it('devrait filtrer par plage de dates', async () => {
      const dateDebut = new Date('2026-01-01').toISOString();
      const dateFin = new Date('2026-01-31').toISOString();
      
      const result = await commandesService.rechercherCommandes({
        date_debut: dateDebut,
        date_fin: dateFin,
      });
      
      expect(result.items).toBeDefined();
      result.items.forEach((c: any) => {
        const date = new Date(c.date_commande);
        expect(date >= new Date(dateDebut)).toBe(true);
        expect(date <= new Date(dateFin)).toBe(true);
      });
    });
  });

  describe('Gestion des articles', () => {
    it('devrait parser correctement les articles JSON', async () => {
      const commande = await commandesService.obtenirCommandeParId('cmd-001');
      
      expect(commande).not.toBeNull();
      expect(Array.isArray(commande?.articles)).toBe(true);
      expect(commande?.articles.length).toBeGreaterThan(0);
      
      // Vérifier structure d'un article
      const article = commande!.articles[0];
      expect(article).toHaveProperty('produit_id');
      expect(article).toHaveProperty('nom');
      expect(article).toHaveProperty('quantite');
      expect(article).toHaveProperty('prix_unitaire');
      expect(article).toHaveProperty('total');
    });

    it('devrait inclure les informations utilisateur', async () => {
      const commande = await commandesService.obtenirCommandeParId('cmd-001');
      
      expect(commande).not.toBeNull();
      expect(commande?.nom_utilisateur).toBeDefined();
      expect(commande?.email).toBeDefined();
      expect(typeof commande?.nom_utilisateur).toBe('string');
      expect(commande?.nom_utilisateur).toContain(' '); // Prénom + Nom
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer une recherche sans résultats', async () => {
      const result = await commandesService.rechercherCommandes({ utilisateur_id: 999999 });
      
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('devrait retourner un tableau vide pour un utilisateur sans commandes', async () => {
      const commandes = await commandesService.obtenirCommandesUtilisateur(999);
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes).toHaveLength(0);
    });

    it('devrait gérer une pagination hors limites', async () => {
      const result = await commandesService.rechercherCommandes({ page: 999, limit: 10 });
      
      expect(result.items).toHaveLength(0);
      expect(result.page).toBe(999);
    });
  });
});
