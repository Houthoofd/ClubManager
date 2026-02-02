/**
 * Tests de validation pour le service Compte
 * Validation des données entrantes et formats
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';

describe('Compte Service - Tests de validation', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  describe('Validation des informations utilisateur', () => {
    it('devrait rejeter un prénom vide', async () => {
      const mockResult = {
        isFind: false,
        message: 'Le prénom est requis'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('', 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait rejeter un nom vide', async () => {
      const mockResult = {
        isFind: false,
        message: 'Le nom est requis'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John', '');

      expect(result.isFind).toBe(false);
    });

    it('devrait rejeter les caractères non alphabétiques dans le prénom', async () => {
      const mockResult = {
        isFind: false,
        message: 'Le prénom contient des caractères invalides'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('John123', 'Doe');

      expect(result.isFind).toBe(false);
    });

    it('devrait accepter les prénoms composés avec tirets', async () => {
      const mockResult = {
        isFind: true,
        data: {
          prenom: 'Jean-Pierre',
          nom: 'Dupont'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('Jean-Pierre', 'Dupont');

      expect(result.isFind).toBe(true);
    });

    it('devrait accepter les noms avec apostrophes', async () => {
      const mockResult = {
        isFind: true,
        data: {
          prenom: 'Patrick',
          nom: 'O\'Brien'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = await compteClient.obtenirInformationsUtilisateur('Patrick', 'O\'Brien');

      expect(result.isFind).toBe(true);
    });
  });

  describe('Validation du mot de passe', () => {
    it('devrait rejeter un ID utilisateur invalide', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'ID utilisateur invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(-1, 'hashedPassword', true);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter un mot de passe vide', async () => {
      const mockResult = {
        isConfirm: false,
        message: 'Le mot de passe est requis'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, '', true);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait accepter un hash bcrypt valide', async () => {
      const validBcryptHash = '$2b$10$abcdefghijklmnopqrstuv1234567890123456789012';

      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe créé avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, validBcryptHash, true);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait valider le format du hash bcrypt', async () => {
      const invalidHash = 'not-a-valid-hash';

      const mockResult = {
        isConfirm: false,
        message: 'Format de hash invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourMotDePasse(1, invalidHash, true);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Validation de l\'email', () => {
    it('devrait accepter un email valide standard', async () => {
      const updateData = { email: 'user@example.com' };

      const mockResult = {
        isConfirm: true,
        message: 'Email mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter un email sans @', async () => {
      const updateData = { email: 'userexample.com' };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('email invalide');
    });

    it('devrait rejeter un email sans domaine', async () => {
      const updateData = { email: 'user@' };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter un email sans nom d\'utilisateur', async () => {
      const updateData = { email: '@example.com' };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait accepter un email avec sous-domaine', async () => {
      const updateData = { email: 'user@mail.example.com' };

      const mockResult = {
        isConfirm: true,
        message: 'Email mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait accepter un email avec caractères spéciaux autorisés', async () => {
      const updateData = { email: 'user.name+tag@example.com' };

      const mockResult = {
        isConfirm: true,
        message: 'Email mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter un email avec espaces', async () => {
      const updateData = { email: 'user @example.com' };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Validation de la date de naissance', () => {
    it('devrait accepter une date au format YYYY-MM-DD', async () => {
      const updateData = { date_naissance: '1990-05-15' };

      const mockResult = {
        isConfirm: true,
        message: 'Date de naissance mise à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter une date au format DD/MM/YYYY', async () => {
      const updateData = { date_naissance: '15/05/1990' };

      const mockResult = {
        isConfirm: false,
        message: 'Format de date invalide. Utilisez YYYY-MM-DD'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter une date invalide (jour > 31)', async () => {
      const updateData = { date_naissance: '1990-05-32' };

      const mockResult = {
        isConfirm: false,
        message: 'Date invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter une date invalide (mois > 12)', async () => {
      const updateData = { date_naissance: '1990-13-15' };

      const mockResult = {
        isConfirm: false,
        message: 'Date invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter une date dans le futur', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const updateData = { date_naissance: futureDateString };

      const mockResult = {
        isConfirm: false,
        message: 'La date de naissance ne peut pas être dans le futur'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait rejeter une date trop ancienne (> 150 ans)', async () => {
      const updateData = { date_naissance: '1800-01-01' };

      const mockResult = {
        isConfirm: false,
        message: 'Date de naissance trop ancienne'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait valider les années bissextiles', async () => {
      const updateData = { date_naissance: '2000-02-29' }; // Année bissextile

      const mockResult = {
        isConfirm: true,
        message: 'Date de naissance mise à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });
  });

  describe('Validation des IDs de référence', () => {
    it('devrait accepter un ID de genre valide', async () => {
      const updateData = { genres: 1 };

      const mockResult = {
        isConfirm: true,
        message: 'Genre mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter un ID de genre négatif', async () => {
      const updateData = { genres: -1 };

      const mockResult = {
        isConfirm: false,
        message: 'ID de genre invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait accepter un nom de grade valide', async () => {
      const updateData = { grades: 'Ceinture noire' };

      const mockResult = {
        isConfirm: true,
        message: 'Grade mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter un ID d\'abonnement invalide', async () => {
      const updateData = { abonnement: 0 };

      const mockResult = {
        isConfirm: false,
        message: 'ID d\'abonnement invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });

    it('devrait accepter un ID de status valide', async () => {
      const updateData = { status: 2 };

      const mockResult = {
        isConfirm: true,
        message: 'Status mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });
  });

  describe('Validation de la conversion de types', () => {
    it('devrait convertir une chaîne numérique en nombre pour genres', async () => {
      const updateData = { genres: '2' };

      const mockResult = {
        isConfirm: true,
        message: 'Genre mis à jour avec conversion'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait gérer les valeurs non numériques pour grades', async () => {
      const updateData = { grades: 'Ceinture verte' };

      const mockResult = {
        isConfirm: true,
        message: 'Grade mis à jour par nom'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait rejeter les valeurs NaN après conversion', async () => {
      const updateData = { abonnement: 'invalid-number' };

      const mockResult = {
        isConfirm: false,
        message: 'Valeur d\'abonnement invalide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Validation des données combinées', () => {
    it('devrait valider tous les champs lors d\'une mise à jour complète', async () => {
      const updateData = {
        email: 'valid@example.com',
        date_naissance: '1990-01-01',
        genres: 1,
        grades: 'Ceinture noire',
        abonnement: 2,
        status: 1
      };

      const mockResult = {
        isConfirm: true,
        message: 'Tous les champs validés et mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait échouer si un seul champ est invalide dans une mise à jour multiple', async () => {
      const updateData = {
        email: 'invalid-email',
        date_naissance: '1990-01-01',
        genres: 1
      };

      const mockResult = {
        isConfirm: false,
        message: 'Format email invalide',
        invalidFields: ['email']
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('email invalide');
    });
  });
});
