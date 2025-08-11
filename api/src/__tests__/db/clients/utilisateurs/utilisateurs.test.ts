import { Utilisateurs } from '../../../../db/clients/utilisateurs/utilisateurs.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import { UserData } from '@clubmanager/types';

// Mock the MySQL connector
jest.mock('../../../../db/connector/mysqlconnector.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn(),
      close: jest.fn()
    };
  });
});

describe('Utilisateurs Client', () => {
  let utilisateursClient: Utilisateurs;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    utilisateursClient = new Utilisateurs();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('verifierUtilisateur', () => {
    it('should return isFind true when user exists', async () => {
      // Use a complete UserData object to satisfy the type
      const mockUserData: UserData = {
        email: 'test@example.com',
        nom_utilisateur: 'testuser',
        nom: 'Test',  // Required fields added
        prenom: 'User',   // Required fields added
        genre_id: 1,         // Required fields added
        date_naissance: '1990-01-01', // Required fields added
        status_id: 1,        // Required fields added
        password: 'password123', // Added as needed
        grade_id: null,      // Can be null
        abonnement_id: null  // Can be null
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [{ id: 1, email: 'test@example.com' }]);
        }
      );

      const result = await utilisateursClient.verifierUtilisateur(mockUserData);
      expect(result).toEqual({ isFind: true, message: "utilisateur trouvé" });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs'),
        [mockUserData.email, mockUserData.nom_utilisateur],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should return isFind false when user does not exist', async () => {
      // Use a complete UserData object to satisfy the type
      const mockUserData: UserData = {
        email: 'nonexistent@example.com',
        nom_utilisateur: 'nonexistentuser',
        nom: 'Non',  // Required fields added
        prenom: 'Existent', // Required fields added
        genre_id: 1,         // Required fields added
        date_naissance: '1990-01-01', // Required fields added
        status_id: 1,        // Required fields added
        password: 'password123', // Added as needed
        grade_id: null,      // Can be null
        abonnement_id: null  // Can be null
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

      const result = await utilisateursClient.verifierUtilisateur(mockUserData);
      expect(result).toEqual({ isFind: false, message: "utilisateur non trouvé" });
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should reject with error when query fails', async () => {
      // Use a complete UserData object to satisfy the type
      const mockUserData: UserData = {
        email: 'test@example.com',
        nom_utilisateur: 'testuser',
        nom: 'Test',  // Required fields added
        prenom: 'User',   // Required fields added
        genre_id: 1,         // Required fields added
        date_naissance: '1990-01-01', // Required fields added
        status_id: 1,        // Required fields added
        password: 'password123', // Added as needed
        grade_id: null,      // Can be null
        abonnement_id: null  // Can be null
      };
      
      const mockError = new Error('Database error');

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(mockError, undefined);
        }
      );

      await expect(utilisateursClient.verifierUtilisateur(mockUserData)).rejects.toEqual(mockError);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
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
        abonnement_id: 1
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: 1, affectedRows: 1 });
        }
      );

      const result = await utilisateursClient.inscrireUtilisateur(mockUserData);
      expect(result).toEqual({ insertId: 1, affectedRows: 1 });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO utilisateurs'),
        expect.arrayContaining([
          mockUserData.prenom,
          mockUserData.nom,
          mockUserData.email
        ]),
        expect.any(Function)
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
        abonnement_id: 1
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: 1, affectedRows: 1 });
        }
      );

      await utilisateursClient.inscrireUtilisateur(mockUserData);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['password123']),
        expect.any(Function)
      );
    });
  });

  describe('validerConnexion', () => {
    it('should return user data when credentials are valid', async () => {
      const mockLoginData = {
        email: 'john.doe@example.com',
        password: 'password123'
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
        abonnement_id: 1
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockUserData]);
        }
      );

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
        abonnement_id: 1
      });
    });

    it('should return isFind false when credentials are invalid', async () => {
      const mockLoginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

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
          password: 'password123',
          status_id: 1,
          grade_id: 1,
          abonnement_id: 1
        },
        {
          id: 2,
          prenom: 'Jane',
          nom: 'Smith',
          nom_utilisateur: 'janesmith',
          email: 'jane.smith@example.com',
          genre_id: 2,
          date_naissance: '1992-05-15',
          password: 'password123',
          status_id: 1,
          grade_id: 2,
          abonnement_id: 1
        }
      ];

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockUsers);
        }
      );

      const result = await utilisateursClient.obtenirTousLesUtilisateurs();
      expect(result.isFind).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    it('should return empty array when no users found', async () => {
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

      const result = await utilisateursClient.obtenirTousLesUtilisateurs();
      expect(result.isFind).toBe(false);
      expect(result.data).toEqual([]);
    });
  });

  describe('obtenirUnUtilisateur', () => {
    it('should return user by ID', async () => {
      const mockUser= {
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
        abonnement_id: 1
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockUser]);
        }
      );

      const result = await utilisateursClient.obtenirUnUtilisateur(1);
      expect(result.isFind).toBe(true);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].prenom).toBe('John');
    });
  });

  describe('supprimerUtilisateur', () => {
    it('should successfully delete a user', async () => {
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 1 });
        }
      );

      const result = await utilisateursClient.supprimerUtilisateur(1);
      expect(result.isConfirm).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM utilisateurs'),
        [1],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('mettreAjourUtilisateur', () => {
    it('should update user successfully', async () => {
      const mockUserData = {
        id: 1,
        prenom: 'John Updated',
        nom: 'Doe Updated',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        genre_id: 1,
        date_naissance: '1990-01-01',
        password: 'password123',
        status_id: 2,
        grade_id: 2,
        abonnement_id: 2
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 1 });
        }
      );

      const result = await utilisateursClient.mettreAjourUtilisateur(mockUserData);
      expect(result.isConfirm).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE utilisateurs'),
        expect.arrayContaining([
          mockUserData.prenom,
          mockUserData.nom,
          mockUserData.id
        ]),
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should reject when ID is missing', async () => {
      const mockUserData = {
        prenom: 'John',
        nom: 'Doe',
        // Missing id
      };

      await expect(utilisateursClient.mettreAjourUtilisateur(mockUserData as any))
        .rejects
        .toThrow("L'identifiant de l'utilisateur est requis pour la mise à jour.");
      expect(mockMysqlConnector.query).not.toHaveBeenCalled();
    });
  });
});
