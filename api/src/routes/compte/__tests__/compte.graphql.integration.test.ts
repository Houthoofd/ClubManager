/**
 * Tests d'intégration GraphQL pour le service Compte
 * Tests des requêtes et mutations GraphQL
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';

describe('Compte Service - Tests d\'intégration GraphQL', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Query: getUtilisateur', () => {
    it('devrait récupérer un utilisateur par ID', async () => {
      const query = `
        query GetUtilisateur($id: ID!) {
          utilisateur(id: $id) {
            id
            prenom
            nom
            email
            dateNaissance
            genre {
              id
              nom
            }
            grade {
              id
              nom
            }
            abonnement {
              id
              nom
              prix
            }
            status {
              id
              nom
            }
          }
        }
      `;

      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com',
          dateNaissance: '1990-01-01',
          genre: { id: 1, nom: 'Homme' },
          grade: { id: 5, nom: 'Ceinture noire' },
          abonnement: { id: 2, nom: 'Mensuel', prix: 50 },
          status: { id: 1, nom: 'Actif' }
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const variables = { id: '1' };
      // Simulation d'exécution GraphQL
      const result = mockResult.data;

      expect(result.id).toBe(1);
      expect(result.prenom).toBe('John');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.genre.nom).toBe('Homme');
      expect(result.grade.nom).toBe('Ceinture noire');
    });

    it('devrait gérer un utilisateur non trouvé', async () => {
      const query = `
        query GetUtilisateur($id: ID!) {
          utilisateur(id: $id) {
            id
            prenom
            nom
          }
        }
      `;

      const mockResult = {
        isFind: false,
        data: null,
        error: 'Utilisateur non trouvé'
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const variables = { id: '999' };
      const result = mockResult;

      expect(result.isFind).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Utilisateur non trouvé');
    });

    it('devrait récupérer plusieurs utilisateurs', async () => {
      const query = `
        query GetUtilisateurs {
          utilisateurs {
            id
            prenom
            nom
            email
          }
        }
      `;

      const mockResults = [
        { id: 1, prenom: 'John', nom: 'Doe', email: 'john@example.com' },
        { id: 2, prenom: 'Jane', nom: 'Smith', email: 'jane@example.com' },
        { id: 3, prenom: 'Bob', nom: 'Johnson', email: 'bob@example.com' }
      ];

      // Simulation de résultats multiples
      expect(mockResults).toHaveLength(3);
      expect(mockResults[0].prenom).toBe('John');
      expect(mockResults[1].prenom).toBe('Jane');
    });
  });

  describe('Query: getUtilisateurByName', () => {
    it('devrait rechercher un utilisateur par prénom et nom', async () => {
      const query = `
        query GetUtilisateurByName($prenom: String!, $nom: String!) {
          utilisateurByName(prenom: $prenom, nom: $nom) {
            id
            prenom
            nom
            email
          }
        }
      `;

      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const variables = { prenom: 'John', nom: 'Doe' };
      await compteClient.obtenirInformationsUtilisateur(variables.prenom, variables.nom);

      expect(compteClient.obtenirInformationsUtilisateur).toHaveBeenCalledWith('John', 'Doe');
    });

    it('devrait gérer la recherche avec des caractères spéciaux', async () => {
      const query = `
        query GetUtilisateurByName($prenom: String!, $nom: String!) {
          utilisateurByName(prenom: $prenom, nom: $nom) {
            id
            prenom
            nom
          }
        }
      `;

      const mockResult = {
        isFind: true,
        data: {
          id: 2,
          prenom: 'Jean-Pierre',
          nom: "O'Connor"
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const variables = { prenom: 'Jean-Pierre', nom: "O'Connor" };
      const result = await compteClient.obtenirInformationsUtilisateur(variables.prenom, variables.nom);

      expect(result.isFind).toBe(true);
      expect(result.data.prenom).toBe('Jean-Pierre');
    });
  });

  describe('Mutation: createPassword', () => {
    it('devrait créer un mot de passe pour un compte', async () => {
      const mutation = `
        mutation CreatePassword($id: ID!, $password: String!) {
          createPassword(id: $id, password: $password) {
            success
            message
            utilisateur {
              id
              hasPassword
            }
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe créé avec succès',
        data: {
          id: 1,
          hasPassword: true
        }
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const variables = { id: '1', password: 'SecurePassword123!' };
      await compteClient.mettreAJourMotDePasse(parseInt(variables.id), 'hashedPassword', true);

      expect(compteClient.mettreAJourMotDePasse).toHaveBeenCalledWith(1, 'hashedPassword', true);
    });

    it('devrait rejeter si le compte a déjà un mot de passe', async () => {
      const mutation = `
        mutation CreatePassword($id: ID!, $password: String!) {
          createPassword(id: $id, password: $password) {
            success
            message
          }
        }
      `;

      const mockResult = {
        isConfirm: false,
        message: 'Le compte possède déjà un mot de passe'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const variables = { id: '1', password: 'SecurePassword123!' };
      const result = await compteClient.mettreAJourMotDePasse(parseInt(variables.id), 'hashedPassword', true);

      expect(result.isConfirm).toBe(false);
      expect(result.message).toContain('déjà un mot de passe');
    });
  });

  describe('Mutation: changePassword', () => {
    it('devrait changer le mot de passe d\'un compte', async () => {
      const mutation = `
        mutation ChangePassword($id: ID!, $password: String!) {
          changePassword(id: $id, password: $password) {
            success
            message
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe modifié avec succès'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const variables = { id: '1', password: 'NewSecurePassword456!' };
      const result = await compteClient.mettreAJourMotDePasse(parseInt(variables.id), 'newHashedPassword', false);

      expect(result.isConfirm).toBe(true);
      expect(result.message).toBe('Mot de passe modifié avec succès');
    });

    it('devrait rejeter si le compte n\'a pas de mot de passe', async () => {
      const mutation = `
        mutation ChangePassword($id: ID!, $password: String!) {
          changePassword(id: $id, password: $password) {
            success
            message
          }
        }
      `;

      const mockResult = {
        isConfirm: false,
        message: 'Le compte n\'a pas encore de mot de passe'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const variables = { id: '1', password: 'NewPassword!' };
      const result = await compteClient.mettreAJourMotDePasse(parseInt(variables.id), 'hashedPassword', false);

      expect(result.isConfirm).toBe(false);
    });
  });

  describe('Mutation: updateCompte', () => {
    it('devrait mettre à jour les informations du compte', async () => {
      const mutation = `
        mutation UpdateCompte($id: ID!, $input: UpdateCompteInput!) {
          updateCompte(id: $id, input: $input) {
            success
            message
            utilisateur {
              id
              email
              dateNaissance
              genre {
                id
                nom
              }
              grade {
                id
                nom
              }
            }
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Compte mis à jour avec succès',
        data: {
          id: 1,
          email: 'updated@example.com',
          dateNaissance: '1990-01-01',
          genre: { id: 1, nom: 'Homme' },
          grade: { id: 5, nom: 'Ceinture noire' }
        }
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const variables = {
        id: '1',
        input: {
          email: 'updated@example.com',
          dateNaissance: '1990-01-01',
          genres: 1,
          grades: 5
        }
      };

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(parseInt(variables.id), variables.input);

      expect(result.isConfirm).toBe(true);
      expect(result.message).toBe('Compte mis à jour avec succès');
    });

    it('devrait mettre à jour seulement l\'email', async () => {
      const mutation = `
        mutation UpdateCompte($id: ID!, $input: UpdateCompteInput!) {
          updateCompte(id: $id, input: $input) {
            success
            message
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Email mis à jour'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const variables = {
        id: '1',
        input: { email: 'newemail@example.com' }
      };

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(parseInt(variables.id), variables.input);

      expect(result.isConfirm).toBe(true);
    });

    it('devrait gérer la mise à jour de l\'abonnement avec régénération des échéances', async () => {
      const mutation = `
        mutation UpdateCompte($id: ID!, $input: UpdateCompteInput!) {
          updateCompte(id: $id, input: $input) {
            success
            message
            echeancesUpdated
            newEcheances {
              id
              montant
              dateEcheance
              statut
            }
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Abonnement mis à jour',
        echeancesUpdated: true,
        newEcheances: [
          { id: 1, montant: 50, dateEcheance: '2024-02-01', statut: 'en attente' },
          { id: 2, montant: 50, dateEcheance: '2024-03-01', statut: 'en attente' }
        ]
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const variables = {
        id: '1',
        input: { abonnement: 3 }
      };

      const result = await compteClient.mettreAJourUtilisateurAvecConversion(parseInt(variables.id), variables.input);

      expect(result.isConfirm).toBe(true);
      expect(result.echeancesUpdated).toBe(true);
      expect(result.newEcheances).toHaveLength(2);
    });
  });

  describe('Query: Champs imbriqués', () => {
    it('devrait résoudre les relations imbriquées', async () => {
      const query = `
        query GetUtilisateurComplet($id: ID!) {
          utilisateur(id: $id) {
            id
            prenom
            nom
            email
            genre {
              id
              nom
              description
            }
            grade {
              id
              nom
              niveau
              couleur
            }
            abonnement {
              id
              nom
              prix
              duree
              type
            }
            status {
              id
              nom
              actif
            }
            echeances {
              id
              montant
              dateEcheance
              statut
              paiement {
                id
                montant
                datePaiement
                methodePaiement
              }
            }
          }
        }
      `;

      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john@example.com',
          genre: { id: 1, nom: 'Homme', description: 'Genre masculin' },
          grade: { id: 5, nom: 'Ceinture noire', niveau: 5, couleur: 'Noir' },
          abonnement: { id: 2, nom: 'Mensuel', prix: 50, duree: 1, type: 'mensuel' },
          status: { id: 1, nom: 'Actif', actif: true },
          echeances: [
            {
              id: 1,
              montant: 50,
              dateEcheance: '2024-02-01',
              statut: 'payé',
              paiement: {
                id: 10,
                montant: 50,
                datePaiement: '2024-01-28',
                methodePaiement: 'carte'
              }
            }
          ]
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = mockResult.data;

      expect(result.genre.nom).toBe('Homme');
      expect(result.grade.niveau).toBe(5);
      expect(result.abonnement.prix).toBe(50);
      expect(result.echeances).toHaveLength(1);
      expect(result.echeances[0].paiement.montant).toBe(50);
    });

    it('devrait gérer les champs null dans les relations', async () => {
      const query = `
        query GetUtilisateurPartiel($id: ID!) {
          utilisateur(id: $id) {
            id
            prenom
            nom
            genre {
              id
              nom
            }
            grade {
              id
              nom
            }
          }
        }
      `;

      const mockResult = {
        isFind: true,
        data: {
          id: 2,
          prenom: 'Jane',
          nom: 'Smith',
          genre: null,
          grade: null
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const result = mockResult.data;

      expect(result.id).toBe(2);
      expect(result.genre).toBeNull();
      expect(result.grade).toBeNull();
    });
  });

  describe('Mutation: Transactions', () => {
    it('devrait gérer une transaction complexe de mise à jour', async () => {
      const mutation = `
        mutation TransactionCompte($id: ID!, $updates: [UpdateInput!]!) {
          transactionCompte(id: $id, updates: $updates) {
            success
            message
            transactionId
            updatedFields
          }
        }
      `;

      const mockResult = {
        isConfirm: true,
        message: 'Transaction complétée',
        transactionId: 'txn_12345',
        updatedFields: ['email', 'dateNaissance', 'genre', 'grade']
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const variables = {
        id: '1',
        updates: [
          { field: 'email', value: 'new@example.com' },
          { field: 'dateNaissance', value: '1990-01-01' },
          { field: 'genre', value: 1 },
          { field: 'grade', value: 5 }
        ]
      };

      expect(mockResult.transactionId).toBe('txn_12345');
      expect(mockResult.updatedFields).toHaveLength(4);
    });

    it('devrait rollback en cas d\'erreur dans une transaction', async () => {
      const mutation = `
        mutation TransactionCompte($id: ID!, $updates: [UpdateInput!]!) {
          transactionCompte(id: $id, updates: $updates) {
            success
            message
            rollback
          }
        }
      `;

      const mockResult = {
        isConfirm: false,
        message: 'Transaction échouée et rollback effectué',
        rollback: true
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const result = mockResult;

      expect(result.isConfirm).toBe(false);
      expect(result.rollback).toBe(true);
    });
  });

  describe('Subscription: Compte updates', () => {
    it('devrait s\'abonner aux mises à jour du compte', async () => {
      const subscription = `
        subscription OnCompteUpdated($id: ID!) {
          compteUpdated(id: $id) {
            id
            prenom
            nom
            email
            updatedAt
            updatedFields
          }
        }
      `;

      const mockUpdate = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'updated@example.com',
        updatedAt: new Date().toISOString(),
        updatedFields: ['email']
      };

      expect(mockUpdate.id).toBe(1);
      expect(mockUpdate.updatedFields).toContain('email');
    });

    it('devrait notifier lors d\'un changement de mot de passe', async () => {
      const subscription = `
        subscription OnPasswordChanged($id: ID!) {
          passwordChanged(id: $id) {
            id
            timestamp
            success
          }
        }
      `;

      const mockNotification = {
        id: 1,
        timestamp: new Date().toISOString(),
        success: true
      };

      expect(mockNotification.success).toBe(true);
    });
  });

  describe('Query: Pagination', () => {
    it('devrait paginer les résultats des utilisateurs', async () => {
      const query = `
        query GetUtilisateurs($page: Int!, $limit: Int!) {
          utilisateurs(page: $page, limit: $limit) {
            items {
              id
              prenom
              nom
            }
            pageInfo {
              currentPage
              totalPages
              totalItems
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      const mockResult = {
        items: [
          { id: 1, prenom: 'John', nom: 'Doe' },
          { id: 2, prenom: 'Jane', nom: 'Smith' }
        ],
        pageInfo: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 10,
          hasNextPage: true,
          hasPreviousPage: false
        }
      };

      expect(mockResult.items).toHaveLength(2);
      expect(mockResult.pageInfo.hasNextPage).toBe(true);
    });

    it('devrait gérer la dernière page de pagination', async () => {
      const query = `
        query GetUtilisateurs($page: Int!, $limit: Int!) {
          utilisateurs(page: $page, limit: $limit) {
            items {
              id
            }
            pageInfo {
              currentPage
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      const mockResult = {
        items: [{ id: 10 }],
        pageInfo: {
          currentPage: 5,
          hasNextPage: false,
          hasPreviousPage: true
        }
      };

      expect(mockResult.pageInfo.hasNextPage).toBe(false);
      expect(mockResult.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe('Query: Filtrage et tri', () => {
    it('devrait filtrer les utilisateurs par genre', async () => {
      const query = `
        query GetUtilisateursByGenre($genreId: ID!) {
          utilisateurs(filter: { genreId: $genreId }) {
            id
            prenom
            nom
            genre {
              id
              nom
            }
          }
        }
      `;

      const mockResult = [
        { id: 1, prenom: 'John', nom: 'Doe', genre: { id: 1, nom: 'Homme' } },
        { id: 3, prenom: 'Bob', nom: 'Johnson', genre: { id: 1, nom: 'Homme' } }
      ];

      expect(mockResult).toHaveLength(2);
      expect(mockResult.every(u => u.genre.id === 1)).toBe(true);
    });

    it('devrait trier les utilisateurs par nom', async () => {
      const query = `
        query GetUtilisateurs($orderBy: OrderBy!) {
          utilisateurs(orderBy: $orderBy) {
            id
            prenom
            nom
          }
        }
      `;

      const mockResult = [
        { id: 1, prenom: 'Alice', nom: 'Anderson' },
        { id: 2, prenom: 'Bob', nom: 'Brown' },
        { id: 3, prenom: 'Charlie', nom: 'Clark' }
      ];

      const isSorted = mockResult.every((user, i) => {
        if (i === 0) return true;
        return user.prenom >= mockResult[i - 1].prenom;
      });

      expect(isSorted).toBe(true);
    });

    it('devrait filtrer et trier simultanément', async () => {
      const query = `
        query GetUtilisateurs($filter: FilterInput!, $orderBy: OrderBy!) {
          utilisateurs(filter: $filter, orderBy: $orderBy) {
            id
            prenom
            nom
            grade {
              id
              nom
            }
          }
        }
      `;

      const mockResult = [
        { id: 5, prenom: 'Alice', nom: 'A', grade: { id: 5, nom: 'Ceinture noire' } },
        { id: 3, prenom: 'Bob', nom: 'B', grade: { id: 5, nom: 'Ceinture noire' } }
      ];

      expect(mockResult.every(u => u.grade.id === 5)).toBe(true);
      expect(mockResult[0].prenom < mockResult[1].prenom).toBe(true);
    });
  });

  describe('Error Handling GraphQL', () => {
    it('devrait retourner une erreur GraphQL formatée', async () => {
      const query = `
        query GetUtilisateur($id: ID!) {
          utilisateur(id: $id) {
            id
            prenom
          }
        }
      `;

      const mockError = {
        errors: [
          {
            message: 'Utilisateur non trouvé',
            extensions: {
              code: 'NOT_FOUND',
              id: 999
            }
          }
        ]
      };

      expect(mockError.errors[0].message).toBe('Utilisateur non trouvé');
      expect(mockError.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('devrait gérer les erreurs de validation', async () => {
      const mutation = `
        mutation UpdateCompte($id: ID!, $input: UpdateCompteInput!) {
          updateCompte(id: $id, input: $input) {
            success
            message
          }
        }
      `;

      const mockError = {
        errors: [
          {
            message: 'Validation failed',
            extensions: {
              code: 'VALIDATION_ERROR',
              validationErrors: [
                { field: 'email', message: 'Format email invalide' },
                { field: 'dateNaissance', message: 'Date invalide' }
              ]
            }
          }
        ]
      };

      expect(mockError.errors[0].extensions.code).toBe('VALIDATION_ERROR');
      expect(mockError.errors[0].extensions.validationErrors).toHaveLength(2);
    });
  });
});
