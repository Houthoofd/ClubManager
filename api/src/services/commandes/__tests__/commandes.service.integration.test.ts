/**
 * Tests d'intégration du service Commandes avec Mock Local
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { Commande, CommandeStats } from '@clubmanager/types';
import { createMockPrisma } from './commandes.mock.js';
import * as queries from '../core/queries/index.js';
import * as mutations from '../core/mutations/index.js';
import * as stats from '../core/stats/index.js';
import * as search from '../core/search/index.js';

describe('Service Commandes - Tests d\'intégration avec Mock Local', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma._reset();
  });

  describe('Queries - Récupération des commandes', () => {
    it('devrait récupérer toutes les commandes', async () => {
      const commandes = await queries.obtenirToutesCommandes(mockPrisma);
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes.length).toBeGreaterThan(0);
      
      const commande = commandes[0];
      expect(commande).toHaveProperty('commande_id');
      expect(commande).toHaveProperty('utilisateur_id');
      expect(commande).toHaveProperty('statut');
      expect(commande).toHaveProperty('total');
      expect(commande).toHaveProperty('articles');
      expect(Array.isArray(commande.articles)).toBe(true);
    });

    it('devrait récupérer une commande par ID', async () => {
      const commande = await queries.obtenirCommandeParId('cmd-001', mockPrisma);
      
      expect(commande).not.toBeNull();
      expect(commande?.commande_id).toBe('cmd-001');
      expect(commande?.utilisateur_id).toBe(1);
      expect(commande?.statut).toBe('en_attente');
    });

    it('devrait retourner null pour une commande inexistante', async () => {
      const commande = await queries.obtenirCommandeParId('cmd-999', mockPrisma);
      expect(commande).toBeNull();
    });

    it('devrait récupérer les commandes d\'un utilisateur', async () => {
      const commandes = await queries.obtenirCommandesUtilisateur(1, mockPrisma);
      
      expect(Array.isArray(commandes)).toBe(true);
      expect(commandes.length).toBeGreaterThan(0);
      commandes.forEach((c: any) => {
        expect(c.utilisateur_id).toBe(1);
      });
    });

    it('devrait récupérer les commandes par statut', async () => {
      const commandes = await queries.obtenirCommandesParStatut('en_attente', mockPrisma);
      
      expect(Array.isArray(commandes)).toBe(true);
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
        total: 100,
        articles: [{ produit_id: 1, nom: 'Test', prix_unitaire: 50, quantite: 2, total: 100 }],
      };

      const commande = await mutations.creerCommande(input, mockPrisma);
      
      expect(commande).toBeDefined();
      expect(commande.utilisateur_id).toBe(1);
      expect(commande.statut).toBe('en_attente');
      expect(commande.total).toBe(100);
    });

    it('devrait modifier le statut d\'une commande', async () => {
      const commande = await mutations.modifierStatutCommande('cmd-001', 'payee', mockPrisma);
      
      expect(commande).not.toBeNull();
      expect(commande?.statut).toBe('payee');
    });

    it('devrait retourner null pour modification statut inexistant', async () => {
      const commande = await mutations.modifierStatutCommande('cmd-999', 'payee', mockPrisma);
      expect(commande).toBeNull();
    });

    it('devrait modifier une commande', async () => {
      const updates = {
        statut: 'confirmee' as const,
        total: 175,
      };

      const commande = await mutations.modifierCommande('cmd-001', updates, mockPrisma);
      
      expect(commande).not.toBeNull();
      expect(commande?.statut).toBe('confirmee');
      expect(commande?.total).toBe(175);
    });

    it('devrait retourner null pour modification commande inexistante', async () => {
      const commande = await mutations.modifierCommande('cmd-999', { statut: 'confirmee' }, mockPrisma);
      expect(commande).toBeNull();
    });

    it('devrait supprimer une commande', async () => {
      const result = await mutations.supprimerCommande('cmd-001', mockPrisma);
      expect(result).toBe(true);
      
      const commande = await queries.obtenirCommandeParId('cmd-001', mockPrisma);
      expect(commande).toBeNull();
    });

    it('devrait échouer suppression commande inexistante', async () => {
      const result = await mutations.supprimerCommande('cmd-999', mockPrisma);
      expect(result).toBe(false);
    });
  });

  describe('Statistiques', () => {
    it('devrait obtenir les statistiques des commandes', async () => {
      const statistiques: CommandeStats = await stats.obtenirStatistiquesCommandes(mockPrisma);
      
      expect(statistiques).toBeDefined();
      expect(typeof statistiques.totalCommandes).toBe('number');
      expect(typeof statistiques.revenuTotal).toBe('number');
      expect(statistiques.totalCommandes).toBeGreaterThan(0);
    });

    it('devrait compter les commandes par statut', async () => {
      const comptes = await stats.obtenirComptesParStatut(mockPrisma);
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes.length).toBeGreaterThan(0);
      
      comptes.forEach(c => {
        expect(c).toHaveProperty('statut');
        expect(c).toHaveProperty('count');
      });
    });

    it('devrait compter via queries', async () => {
      const counts = await queries.compterCommandesParStatut(mockPrisma);
      
      expect(typeof counts).toBe('object');
      expect(Object.keys(counts).length).toBeGreaterThan(0);
    });
  });

  describe('Recherche', () => {
    it('devrait rechercher avec filtres vides', async () => {
      const result = await search.rechercherCommandes({}, mockPrisma);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('devrait rechercher par statut', async () => {
      const result = await search.rechercherCommandes({ statut: 'en_attente' }, mockPrisma);
      
      expect(Array.isArray(result.items)).toBe(true);
      result.items.forEach((c: any) => {
        expect(c.statut).toBe('en_attente');
      });
    });

    it('devrait rechercher par utilisateur', async () => {
      const result = await search.rechercherCommandes({ utilisateur_id: 1 }, mockPrisma);
      
      expect(Array.isArray(result.items)).toBe(true);
      result.items.forEach((c: any) => {
        expect(c.utilisateur_id).toBe(1);
      });
    });

    it('devrait supporter la pagination', async () => {
      const result = await search.rechercherCommandes({ page: 1, limit: 1 }, mockPrisma);
      
      expect(result.items.length).toBeLessThanOrEqual(1);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('Scénarios complexes', () => {
    it('devrait maintenir cohérence après création', async () => {
      const before = await queries.obtenirToutesCommandes(mockPrisma);
      
      await mutations.creerCommande({
        utilisateur_id: 1,
        statut: 'en_attente',
        total: 50,
        articles: [{ produit_id: 1, nom: 'Test', prix_unitaire: 50, quantite: 1, total: 50 }],
      }, mockPrisma);
      
      const after = await queries.obtenirToutesCommandes(mockPrisma);
      expect(after.length).toBe(before.length + 1);
    });

    it('devrait refléter changement statut', async () => {
      const avant = await queries.obtenirCommandesParStatut('payee', mockPrisma);
      
      await mutations.modifierStatutCommande('cmd-001', 'payee', mockPrisma);
      
      const apres = await queries.obtenirCommandesParStatut('payee', mockPrisma);
      expect(apres.length).toBe(avant.length + 1);
    });

    it('devrait mettre à jour les stats après modification', async () => {
      const statsBefore = await stats.obtenirStatistiquesCommandes(mockPrisma);
      
      await mutations.creerCommande({
        utilisateur_id: 1,
        statut: 'en_attente',
        total: 1000,
        articles: [{ produit_id: 1, nom: 'Expensive', prix_unitaire: 1000, quantite: 1, total: 1000 }],
      }, mockPrisma);
      
      const statsAfter = await stats.obtenirStatistiquesCommandes(mockPrisma);
      expect(statsAfter.totalCommandes).toBe(statsBefore.totalCommandes + 1);
      expect(statsAfter.revenuTotal).toBeGreaterThan(statsBefore.revenuTotal);
    });
  });
});
