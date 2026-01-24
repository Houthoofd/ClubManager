/**
 * Tests d'intégration du service Compte
 * 
 * Ces tests vérifient la logique métier complète avec mock Prisma
 */

import { describe, it, expect } from '@jest/globals';
import { compteService } from '../compte.service.js';

describe('Service Compte - Tests d\'intégration', () => {
  describe('Queries - Récupération des comptes', () => {
    it('devrait récupérer un compte par ID', async () => {
      const compte = await compteService.obtenirCompteParId(1);
      
      expect(compte).not.toBeNull();
      expect(compte?.id).toBe(1);
      expect(compte?.first_name).toBe('Jean');
      expect(compte?.last_name).toBe('Dupont');
      expect(compte?.email).toBe('jean@test.com');
      expect(compte?.genre_name).toBeDefined();
      expect(compte?.status_name).toBeDefined();
    });

    it('devrait retourner null pour un compte inexistant', async () => {
      const compte = await compteService.obtenirCompteParId(999);
      expect(compte).toBeNull();
    });

    it('devrait récupérer un compte par prénom et nom', async () => {
      const comptes = await compteService.obtenirCompteParNomPrenom('Jean', 'Dupont');
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes.length).toBeGreaterThan(0);
      expect(comptes[0].first_name).toBe('Jean');
      expect(comptes[0].last_name).toBe('Dupont');
    });

    it('devrait récupérer les informations complètes d\'un compte', async () => {
      const compte = await compteService.obtenirInformationsCompte('Marie', 'Martin');
      
      expect(compte).not.toBeNull();
      expect(compte?.first_name).toBe('Marie');
      expect(compte?.last_name).toBe('Martin');
      expect(compte?.email).toBe('marie@test.com');
      expect(compte?.genre_name).toBeDefined();
      expect(compte?.grade_name).toBeDefined();
      expect(compte?.abonnement_name).toBeDefined();
    });

    it('devrait inclure toutes les relations', async () => {
      const compte = await compteService.obtenirCompteParId(1);
      
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
      
      const compte = await compteService.modifierCompte(1, updates);
      
      expect(compte).not.toBeNull();
      expect(compte?.email).toBe('nouveau.email@test.com');
      expect(compte?.phone).toBe('0699887766');
    });

    it('devrait retourner null pour un compte inexistant', async () => {
      const compte = await compteService.modifierCompte(999, { email: 'test@test.com' });
      expect(compte).toBeNull();
    });

    it('devrait modifier uniquement les champs fournis', async () => {
      const compte = await compteService.modifierCompte(2, { phone: '0611223344' });
      
      expect(compte).not.toBeNull();
      expect(compte?.phone).toBe('0611223344');
      expect(compte?.email).toBe('marie@test.com'); // Inchangé
    });

    it('devrait supprimer un compte (soft delete)', async () => {
      const success = await compteService.supprimerCompte(2);
      expect(success).toBe(true);
    });

    it('devrait retourner false pour un compte inexistant lors de la suppression', async () => {
      const success = await compteService.supprimerCompte(999);
      expect(success).toBe(false);
    });

    it('devrait mettre à jour le mot de passe', async () => {
      const success = await compteService.mettreAJourMotDePasse({
        utilisateur_id: 1,
        new_password: '$2b$12$newhashedpassword',
        is_creation: false,
      });
      
      expect(success).toBe(true);
    });

    it('devrait gérer le mode création pour le mot de passe', async () => {
      const success = await compteService.mettreAJourMotDePasse({
        utilisateur_id: 1,
        new_password: '$2b$12$newhashedpassword',
        is_creation: true,
      });
      
      // Devrait échouer car le mot de passe existe déjà
      expect(success).toBe(false);
    });
  });

  describe('Conversions - Noms vers IDs', () => {
    it('devrait obtenir l\'ID d\'un genre par son nom', async () => {
      const genreId = await compteService.obtenirIdGenre('Homme');
      expect(genreId).toBe(1);
    });

    it('devrait obtenir l\'ID d\'un grade par son nom', async () => {
      const gradeId = await compteService.obtenirIdGrade('JAUNE');
      expect(gradeId).toBe(2);
    });

    it('devrait obtenir l\'ID d\'un status par son nom', async () => {
      const statusId = await compteService.obtenirIdStatus('Actif');
      expect(statusId).toBe(1);
    });

    it('devrait obtenir l\'ID d\'un abonnement par son nom', async () => {
      const abonnementId = await compteService.obtenirIdAbonnement('Mensuel');
      expect(abonnementId).toBe(1);
    });

    it('devrait rejeter un genre inexistant', async () => {
      await expect(compteService.obtenirIdGenre('Inexistant')).rejects.toThrow('Genre "Inexistant" non trouvé');
    });

    it('devrait rejeter un grade inexistant', async () => {
      await expect(compteService.obtenirIdGrade('INEXISTANT')).rejects.toThrow('Grade "INEXISTANT" non trouvé');
    });

    it('devrait convertir automatiquement les noms en IDs', async () => {
      const result = await compteService.convertirNomsEnIds({
        genres: 'Femme',
        grades: 'ORANGE',
        status: 'Admin',
        abonnement: 'Trimestriel',
      });
      
      expect(result.genre_id).toBe(2);
      expect(result.grade_id).toBe(3);
      expect(result.status_id).toBe(2);
      expect(result.abonnement_id).toBe(2);
    });

    it('devrait gérer les IDs numériques dans la conversion', async () => {
      const result = await compteService.convertirNomsEnIds({
        genres: 1,
        grades: 2,
      });
      
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
      
      const compte = await compteService.modifierCompteAvecConversion(1, updates);
      
      expect(compte).not.toBeNull();
      expect(compte?.email).toBe('updated@test.com');
      expect(compte?.genre_id).toBe(2);
      expect(compte?.grade_id).toBe(4);
    });

    it('devrait rejeter une conversion avec nom invalide', async () => {
      const updates = {
        genres: 'GenreInvalide',
      };
      
      await expect(compteService.modifierCompteAvecConversion(1, updates)).rejects.toThrow();
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer un compte sans relations optionnelles', async () => {
      const compte = await compteService.obtenirCompteParId(1);
      
      expect(compte).not.toBeNull();
      // Les champs optionnels peuvent être undefined
      expect([undefined, null, expect.any(Number)]).toContainEqual(compte?.abonnement_id);
    });

    it('devrait retourner un tableau vide pour une recherche sans résultats', async () => {
      const comptes = await compteService.obtenirCompteParNomPrenom('Inexistant', 'Utilisateur');
      
      expect(Array.isArray(comptes)).toBe(true);
      expect(comptes).toHaveLength(0);
    });

    it('devrait gérer la modification avec un objet vide', async () => {
      const compte = await compteService.modifierCompte(1, {});
      
      expect(compte).not.toBeNull();
      // Aucun changement, mais pas d'erreur
    });
  });
});
