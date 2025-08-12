import { Utilisateurs } from '../../../../db/clients/utilisateurs/utilisateurs.js';
import { jest } from '@jest/globals';

// Type pour la fonction de callback MySQL
type QueryCallback = (error: Error | null, results?: any) => void;

// Récupérer les références aux fonctions mockées avec typage sûr
declare global {
  var mockQuery: jest.Mock;
  var mockClose: jest.Mock;
}

// Interface pour les données utilisateur
interface UserData {
  id?: number;
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: string;
  password: string;
  status_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
}

describe('Utilisateurs Client', () => {
  let utilisateursClient: Utilisateurs;

  beforeEach(() => {
    jest.clearAllMocks();
    utilisateursClient = new Utilisateurs();
  });

  describe('verifierUtilisateur', () => {
    it('should return isFind true when user exists', async () => {
      const mockUserData = {
        email: 'test@example.com',
        nom_utilisateur: 'testuser',
        nom: 'Test',
        prenom: 'User',
        genre_id: 1,
        date_naissance: '1990-01-01',
        status_id: 1,
        password: 'password123',
        grade_id: null,
        abonnement_id: null,
      };

      // Configure le mock pour renvoyer un utilisateur trouvé
      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, [{ id: 1, email: 'test@example.com' }]);
      });

      const result = await utilisateursClient.verifierUtilisateur(mockUserData);
      expect(result).toEqual({ isFind: true, message: "utilisateur trouvé" });
      expect(global.mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs'),
        [mockUserData.email, mockUserData.nom_utilisateur],
        expect.any(Function),
      );
      expect(global.mockClose).toHaveBeenCalled();
    });

    it('should return isFind false when user does not exist', async () => {
      const mockUserData = {
        email: 'nonexistent@example.com',
        nom_utilisateur: 'nonexistentuser',
        nom: 'Non',
        prenom: 'Existent',
        genre_id: 1,
        date_naissance: '1990-01-01',
        status_id: 1,
        password: 'password123',
        grade_id: null,
        abonnement_id: null,
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, []);
      });

      const result = await utilisateursClient.verifierUtilisateur(mockUserData);
      expect(result).toEqual({ isFind: false, message: "utilisateur non trouvé" });
      expect(global.mockClose).toHaveBeenCalled();
    });

    it('should reject with error when query fails', async () => {
      const mockUserData = {
        email: 'test@example.com',
        nom_utilisateur: 'testuser',
        nom: 'Test',
        prenom: 'User',
        genre_id: 1,
        date_naissance: '1990-01-01',
        status_id: 1,
        password: 'password123',
        grade_id: null,
        abonnement_id: null,
      };

      const mockError = new Error('Database error');

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(mockError, undefined);
      });

      await expect(utilisateursClient.verifierUtilisateur(mockUserData)).rejects.toEqual(mockError);
      expect(global.mockClose).toHaveBeenCalled();
    });
  });

  describe('inscrireUtilisateur', () => {
    it('should successfully insert a user', async () => {
      const mockUserData = {
        prenom: 'John',
        nom: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'securepassword',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, { insertId: 1, affectedRows: 1 });
      });

      const result = await utilisateursClient.inscrireUtilisateur(mockUserData);
      expect(result).toEqual({ insertId: 1, affectedRows: 1 });
      expect(global.mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO utilisateurs'),
        expect.arrayContaining([
          mockUserData.prenom,
          mockUserData.nom,
          mockUserData.email,
        ]),
        expect.any(Function),
      );
    });

    it('should use default password when password is empty', async () => {
      const mockUserData = {
        prenom: 'John',
        nom: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: '',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, { insertId: 1, affectedRows: 1 });
      });

      await utilisateursClient.inscrireUtilisateur(mockUserData);
      expect(global.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['password123']),
        expect.any(Function),
      );
    });
  });

  describe('validerConnexion', () => {
    it('should return user data when credentials are valid', async () => {
      const mockLoginData = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const mockUserData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'password123',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, [mockUserData]);
      });

      const result = await utilisateursClient.validerConnexion(mockLoginData);
      expect(result.isFind).toBe(true);
      expect(result.dataToStore).toEqual({
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        date_naissance: '1990-01-01',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
      });
    });

    it('should return isFind false when credentials are invalid', async () => {
      const mockLoginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, []);
      });

      const result = await utilisateursClient.validerConnexion(mockLoginData);
      expect(result.isFind).toBe(false);
      expect(result.dataToStore).toEqual({ id: null });
    });
  });

  describe('obtenirTousLesUtilisateurs', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          nom_utilisateur: 'johndoe',
          email: 'john.doe@example.com',
          genre_id: 1,
          date_naissance: '1990-01-01',
          status_id: 1,
          grade_id: 1,
          abonnement_id: 1,
        },
        {
          id: 2,
          prenom: 'Jane',
          nom: 'Smith',
          nom_utilisateur: 'janesmith',
          email: 'jane.smith@example.com',
          genre_id: 2,
          date_naissance: '1992-05-15',
          status_id: 1,
          grade_id: 2,
          abonnement_id: 1,
        },
      ];

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, mockUsers);
      });

      const result = await utilisateursClient.obtenirTousLesUtilisateurs();
      expect(result.isFind).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    it('should return empty array when no users found', async () => {
      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, []);
      });

      const result = await utilisateursClient.obtenirTousLesUtilisateurs();
      expect(result.isFind).toBe(false);
      expect(result.data).toEqual([]);
    });
  });

  describe('obtenirUnUtilisateur', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, [mockUser]);
      });

      const result = await utilisateursClient.obtenirUnUtilisateur(1);
      expect(result.isFind).toBe(true);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].prenom).toBe('John');
    });
  });

  describe('supprimerUtilisateur', () => {
    it('should successfully delete a user', async () => {
      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, { affectedRows: 1 });
      });

      const result = await utilisateursClient.supprimerUtilisateur(1);
      expect(result).toEqual({ isConfirm: true, message: "L'utilisateur a bien été supprimé" });
      expect(global.mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM utilisateurs'),
        [1],
        expect.any(Function),
      );
    });
  });

  describe('mettreAjourUtilisateur', () => {
    it('should update user successfully', async () => {
      // Correction du mockUserData pour qu'il soit conforme à l'interface UserData
      const mockUserData: UserData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe Updated',
        nom_utilisateur: 'johndoe',
        email: 'john.updated@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'securepassword',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1
      };

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(null, { affectedRows: 1 });
      });

      const result = await utilisateursClient.mettreAjourUtilisateur(mockUserData);
      expect(result).toEqual({ isConfirm: true, message: "L'utilisateur a bien été mis à jour" });
      expect(global.mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE utilisateurs'),
        expect.arrayContaining([mockUserData.prenom, mockUserData.nom, mockUserData.email, mockUserData.id]),
        expect.any(Function)
      );
      expect(global.mockClose).toHaveBeenCalled();
    });

    it('should reject when ID is missing', async () => {
      // Mock incomplet sans ID qui devrait déclencher l'erreur
      const mockUserData = {
        prenom: 'John',
        nom: 'Doe Updated',
        email: 'john.updated@example.com',
        nom_utilisateur: 'johndoe',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'securepassword',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1
        // ID manquant intentionnellement pour le test
      } as unknown as UserData; // Forçage de type pour le test

      await expect(utilisateursClient.mettreAjourUtilisateur(mockUserData)).rejects.toThrow('ID utilisateur manquant');
      expect(global.mockQuery).not.toHaveBeenCalled();
      expect(global.mockClose).not.toHaveBeenCalled();
    });

    it('should reject with error when query fails', async () => {
      const mockUserData: UserData = {
        id: 1,
        prenom: 'John',
        nom: 'Doe Updated',
        nom_utilisateur: 'johndoe',
        email: 'john.updated@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'securepassword',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1
      };

      const mockError = new Error('Database update error');

      global.mockQuery.mockImplementation(function(this: unknown, ...args: unknown[]) {
        const callback = args[2] as QueryCallback;
        callback(mockError);
      });

      await expect(utilisateursClient.mettreAjourUtilisateur(mockUserData)).rejects.toEqual(mockError);
      expect(global.mockClose).toHaveBeenCalled();
    });
  });
});
