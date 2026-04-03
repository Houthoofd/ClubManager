/**
 * Tests d'intégration du service Compte avec Mock Local
 * 
 * Ces tests utilisent un mock Prisma local au lieu du mock global
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockPrisma } from './compte.mock.js';
import * as queries from '../core/queries/index.js';
import * as mutations from '../core/mutations/index.js';
import * as conversions from '../core/conversions/index.js';

describe('Service Compte - Tests d\'intégration avec Mock Local', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma._reset();
  });

  describe('Queries - Récupération des comptes', () => {
    it('devrait récupérer un compte par ID', async () => {
      const compte = await queries.obtenirCompteParId(1, mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.id).toBe(1);
      expect(compte?.first_name).toBe('Jean');
      expect(compte?.last_name).toBe('Dupont');
      expect(compte?.email).toBe('jean@test.com');
      expect(compte?.genre_name).toBeDefined();
      expect(compte?.status_name).toBeDefined();
    });

    it('devrait retourner null pour un compte inexistant', async () => {
      const compte = await queries.obtenirCompteParId(999, mockPrisma);
      expect(compte).toBeNull();
    });

    it('devrait récupérer un compte par prénom et nom', async () => {
      const comptes = await queries.obtenirCompteParNomPrenom('Jean', 'Dupont', mockPrisma);
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes.length).toBeGreaterThan(0);
      expect(comptes[0].first_name).toBe('Jean');
      expect(comptes[0].last_name).toBe('Dupont');
    });

    it('devrait récupérer les informations complètes d\'un compte', async () => {
      const compte = await queries.obtenirInformationsCompte('Marie', 'Martin', mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.first_name).toBe('Marie');
      expect(compte?.last_name).toBe('Martin');
      expect(compte?.email).toBe('marie@test.com');
      expect(compte?.genre_name).toBeDefined();
      expect(compte?.grade_name).toBeDefined();
      expect(compte?.abonnement_name).toBeDefined();
    });

    it('devrait inclure toutes les relations', async () => {
      const compte = await queries.obtenirCompteParId(1, mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.genre_id).toBeDefined();
      expect(compte?.genre_name).toBeDefined();
      expect(compte?.status_id).toBeDefined();
      expect(compte?.status_name).toBeDefined();
      expect(compte?.grade_id).toBeDefined();
      expect(compte?.grade_name).toBeDefined();
    });
  });

  describe('Mutations - Modification des comptes', () => {
    it('devrait modifier les informations d\'un compte', async () => {
      const updates = {
        email: 'nouveau.email@test.com',
        phone: '0699887766',
      };
      
      const compte = await mutations.modifierCompte(1, updates, mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.email).toBe('nouveau.email@test.com');
      expect(compte?.phone).toBe('0699887766');
    });

    it('devrait retourner null pour un compte inexistant', async () => {
      const compte = await mutations.modifierCompte(999, { email: 'test@test.com' }, mockPrisma);
      expect(compte).toBeNull();
    });

    it('devrait modifier uniquement les champs fournis', async () => {
      const compte = await mutations.modifierCompte(2, { phone: '0611223344' }, mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.phone).toBe('0611223344');
      expect(compte?.email).toBe('marie@test.com'); // Inchangé
    });

    it('devrait supprimer un compte (soft delete)', async () => {
      const success = await mutations.supprimerCompte(2, mockPrisma);
      expect(success).toBe(true);
    });

    it('devrait retourner false pour un compte inexistant lors de la suppression', async () => {
      const success = await mutations.supprimerCompte(999, mockPrisma);
      expect(success).toBe(false);
    });

    it('devrait mettre à jour le mot de passe', async () => {
      const success = await mutations.mettreAJourMotDePasse(
        1,
        '$2b$12$newhashedpassword',
        false,
        mockPrisma
      );
      
      expect(success).toBe(true);
    });

    it('devrait gérer le mode création pour le mot de passe', async () => {
      const success = await mutations.mettreAJourMotDePasse(
        1,
        '$2b$12$newhashedpassword',
        true,
        mockPrisma
      );
      
      // Devrait échouer car le mot de passe existe déjà
      expect(success).toBe(false);
    });
  });

  describe('Conversions - Noms vers IDs', () => {
    it('devrait obtenir l\'ID d\'un genre par son nom', async () => {
      const genreId = await conversions.obtenirIdGenreParNom('Homme', mockPrisma);
      expect(genreId).toBe(1);
    });

    it('devrait obtenir l\'ID d\'un grade par son nom', async () => {
      const gradeId = await conversions.obtenirIdGradeParNom('JAUNE', mockPrisma);
      expect(gradeId).toBe(2);
    });

    it('devrait obtenir l\'ID d\'un status par son nom', async () => {
      const statusId = await conversions.obtenirIdStatusParNom('Actif', mockPrisma);
      expect(statusId).toBe(1);
    });

    it('devrait obtenir l\'ID d\'un abonnement par son nom', async () => {
      const abonnementId = await conversions.obtenirIdAbonnementParNom('Mensuel', mockPrisma);
      expect(abonnementId).toBe(1);
    });

    it('devrait rejeter un genre inexistant', async () => {
      await expect(conversions.obtenirIdGenreParNom('Inexistant', mockPrisma)).rejects.toThrow('Genre "Inexistant" non trouvé');
    });

    it('devrait rejeter un grade inexistant', async () => {
      await expect(conversions.obtenirIdGradeParNom('INEXISTANT', mockPrisma)).rejects.toThrow('Grade "INEXISTANT" non trouvé');
    });

    it('devrait convertir automatiquement les noms en IDs', async () => {
      const result = await conversions.convertirNomsEnIds({
        genres: 'Femme',
        grades: 'ORANGE',
        status: 'Admin',
        abonnement: 'Trimestriel',
      }, mockPrisma);
      
      expect(result.genre_id).toBe(2);
      expect(result.grade_id).toBe(3);
      expect(result.status_id).toBe(2);
      expect(result.abonnement_id).toBe(2);
    });

    it('devrait gérer les IDs numériques dans la conversion', async () => {
      const result = await conversions.convertirNomsEnIds({
        genres: 1,
        grades: 2,
      }, mockPrisma);
      
      expect(result.genre_id).toBe(1);
      expect(result.grade_id).toBe(2);
    });
  });

  describe('Modification avec conversion', () => {
    it('devrait modifier un compte avec conversion automatique', async () => {
      const updates = {
        email: 'updated@test.com',
        genres: 'Femme',
        grades: 'VERTE',
      };
      
      // Conversion d'abord
      const converted = await conversions.convertirNomsEnIds({
        genres: updates.genres,
        grades: updates.grades,
      }, mockPrisma);
      
      const compte = await mutations.modifierCompte(1, {
        email: updates.email,
        genre_id: converted.genre_id,
        grade_id: converted.grade_id,
      }, mockPrisma);
      
      expect(compte).not.toBeNull();
      expect(compte?.email).toBe('updated@test.com');
      expect(compte?.genre_id).toBe(2);
      expect(compte?.grade_id).toBe(4);
    });

    it('devrait rejeter une conversion avec nom invalide', async () => {
      const updates = {
        genres: 'GenreInvalide',
      };
      
      await expect(conversions.convertirNomsEnIds(updates, mockPrisma)).rejects.toThrow();
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer un compte sans relations optionnelles', async () => {
      const compte = await queries.obtenirCompteParId(1, mockPrisma);
      
      expect(compte).not.toBeNull();
      // Les champs optionnels peuvent être undefined
      expect([undefined, null, expect.any(Number)]).toContainEqual(compte?.abonnement_id);
    });

    it('devrait retourner un tableau vide pour une recherche sans résultats', async () => {
      const comptes = await queries.obtenirCompteParNomPrenom('Inexistant', 'Utilisateur', mockPrisma);
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes).toHaveLength(0);
    });

    it('devrait gérer la modification avec un objet vide', async () => {
      const compte = await mutations.modifierCompte(1, {}, mockPrisma);
      
      expect(compte).not.toBeNull();
      // Aucun changement, mais pas d'erreur
    });
  });
});
