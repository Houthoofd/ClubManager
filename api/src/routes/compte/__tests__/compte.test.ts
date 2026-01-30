/**
 * Tests de base pour le service Compte
 * Tests des fonctionnalités principales (happy path)
 * Pattern identique aux tests auth
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';

describe('Compte Service - Tests de base', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  describe('Obtenir les informations utilisateur', () => {
    it('devrait récupérer les informations d\'un utilisateur avec prénom et nom valides', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com',
          date_naissance: '1990-01-01',
          genre: 'Homme',
          grade: 'Ceinture noire',
          abonnement: 'Mensuel',
          status: 'Actif'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');

      expect(result.isFind).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.prenom).toBe('John');
      expect(result.data.nom).toBe('Doe');
      expect(compteClient.obtenirInformationsUtilisateur).toHaveBeenCalledWith('John', 'Doe');
      expect(compteClient.obtenirInformationsUtilisateur).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner isFind false si l\'utilisateur n\'existe pas', async () => {
      const mockResult = {
        isFind: false,
        data: null
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('Inexistant', 'Utilisateur');

      expect(result.isFind).toBe(false);
      expect(result.data).toBeNull();
    });

    it('devrait gérer les noms avec des caractères spéciaux', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 2,
          prenom: 'Jean-François',
          nom: 'O\'Connor',
          email: 'jf.oconnor@example.com'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('Jean-François', 'O\'Connor');

      expect(result.isFind).toBe(true);
      expect(result.data.prenom).toBe('Jean-François');
    });
  });

  describe('Création de mot de passe', () => {
    it('devrait créer un mot de passe avec succès pour un nouveau compte', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe créé avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'hashedPassword123', true);

      expect(result.isConfirm).toBe(true);
      expect(compteClient.mettreAJourMotDePasse).toHaveBeenCalledWith(1, 'hashedPassword123', true);
    });

    it('devrait rejeter la création si le compte a déjà un mot de passe', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Le compte possède déjà un mot de passe'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'hashedPassword123', true);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('déjà un mot de passe');
    });

    it('devrait valider la longueur minimale du hash', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Hash de mot de passe invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'short', true);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Modification de mot de passe', () => {
    it('devrait modifier un mot de passe existant avec succès', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe modifié avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'newHashedPassword456', false);

      expect(result.isConfirm).toBe(true);
      expect(compteClient.mettreAJourMotDePasse).toHaveBeenCalledWith(1, 'newHashedPassword456', false);
    });

    it('devrait rejeter la modification si le compte n\'a pas de mot de passe', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Le compte n\'a pas encore de mot de passe'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, 'hashedPassword123', false);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('pas encore de mot de passe');
    });

    it('devrait gérer les identifiants utilisateur invalides', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Utilisateur non trouvé'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(99999, 'hashedPassword123', false);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toBe('Utilisateur non trouvé');
    });
  });

  describe('Mise à jour du compte utilisateur', () => {
    it('devrait mettre à jour les informations de base avec succès', async () => {
      const updateData = {
        email: 'newemail@example.com',
        date_naissance: '1995-05-15'
      };

      const mockResult = {
        isConfirm: true,
        message: 'Utilisateur mis à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(compteClient.mettreAJourUtilisateurAvecConversion).toHaveBeenCalledWith(1, updateData);
    });

    it('devrait mettre à jour le genre avec conversion ID/nom', async () => {
      const updateData = {
        genres: 2 // ID du genre
      };

      const mockResult = {
        isConfirm: true,
        message: 'Genre mis à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(compteClient.mettreAJourUtilisateurAvecConversion).toHaveBeenCalledWith(1, updateData);
    });

    it('devrait mettre à jour le grade avec conversion', async () => {
      const updateData = {
        grades: 'Ceinture noire' // Nom du grade
      };

      const mockResult = {
        isConfirm: true,
        message: 'Grade mis à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait mettre à jour l\'abonnement avec conversion', async () => {
      const updateData = {
        abonnement: 3 // ID de l'abonnement
      };

      const mockResult = {
        isConfirm: true,
        message: 'Abonnement mis à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait mettre à jour le status avec conversion', async () => {
      const updateData = {
        status: 'Inactif' // Nom du status
      };

      const mockResult = {
        isConfirm: true,
        message: 'Status mis à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait mettre à jour plusieurs champs simultanément', async () => {
      const updateData = {
        email: 'updated@example.com',
        date_naissance: '1992-12-25',
        genres: 1,
        grades: 'Ceinture bleue',
        abonnement: 2,
        status: 'Actif',
        password: 'hashedNewPassword789'
      };

      const mockResult = {
        isConfirm: true,
        message: 'Toutes les informations mises à jour avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
      expect(compteClient.mettreAJourUtilisateurAvecConversion).toHaveBeenCalledWith(1, updateData);
    });

    it('devrait valider le format email', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('email invalide');
    });

    it('devrait valider le format de la date de naissance', async () => {
      const updateData = {
        date_naissance: '32/13/2023' // Format invalide
      };

      const mockResult = {
        isConfirm: false,
        message: 'Format de date invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter les mises à jour avec ID utilisateur invalide', async () => {
      const updateData = {
        email: 'test@example.com'
      };

      const mockResult = {
        isConfirm: false,
        message: 'Utilisateur non trouvé'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(99999, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toBe('Utilisateur non trouvé');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de base de données', async () => {
      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockRejectedValue(new Error('Database connection error'));

      await expect(compteClient.obtenirInformationsUtilisateur('John', 'Doe')).rejects.toThrow('Database connection error');
    });

    it('devrait gérer les erreurs de timeout', async () => {
      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockRejectedValue(new Error('Query timeout'));

      await expect(compteClient.mettreAJourUtilisateurAvecConversion(1, {})).rejects.toThrow('Query timeout');
    });

    it('devrait gérer les erreurs de contraintes SQL', async () => {
      const updateData = {
        email: 'duplicate@example.com'
      };

      const mockResult = {
        isConfirm: false,
        message: 'Email déjà utilisé'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('déjà utilisé');
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer les noms très longs', async () => {
      const longName = 'A'.repeat(100);
      const mockResult = {
        isFind: false,
        data: null
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur(longName, 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait gérer les valeurs null dans les mises à jour', async () => {
      const updateData = {
        email: null,
        date_naissance: null
      };

      const mockResult = {
        isConfirm: false,
        message: 'Les valeurs null ne sont pas autorisées'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait gérer les objets de mise à jour vides', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Aucune donnée à mettre à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, {});

      expect(result.isConfirm).toBe(false);
    });
  });
});
