import { Professeurs } from '../../../../db/clients/professeurs/professeurs.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock the MySQL connector
jest.mock('../../../../db/connector/mysqlconnector.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn(),
      close: jest.fn()
    };
  });
});

describe('Professeurs Client', () => {
  let professeursClient: Professeurs;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    professeursClient = new Professeurs();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirLesProfesseurs', () => {
    it('should return all professors', async () => {
      // Mock data
      const mockProfesseurs = [
        {
          id: 1,
          first_name: 'Jean',
          last_name: 'Dupont',
          nom_utilisateur: 'jdupont',
          email: 'jean.dupont@example.com',
          genre_id: 1,
          date_of_birth: '1980-01-01',
          grade_id: 1
        },
        {
          id: 2,
          first_name: 'Sophie',
          last_name: 'Martin',
          nom_utilisateur: 'smartin',
          email: 'sophie.martin@example.com',
          genre_id: 2,
          date_of_birth: '1985-05-15',
          grade_id: 2
        }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockProfesseurs);
        }
      );

      const result = await professeursClient.obtenirLesProfesseurs();

      expect(result).toEqual({
        isFind: true,
        message: "Professeurs trouvés",
        data: mockProfesseurs
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs WHERE status_id = 5'),
        [],
        expect.any(Function)
      );
    });

    it('should return empty array when no professors are found', async () => {
      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

      const result = await professeursClient.obtenirLesProfesseurs();

      expect(result).toEqual({
        isFind: true,
        message: "Aucun professeur trouvé",
        data: []
      });
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      await expect(professeursClient.obtenirLesProfesseurs()).rejects.toEqual({
        isFind: false,
        message: 'Database error',
        data: []
      });
    });
  });

  describe('obtenirProfesseurParId', () => {
    it('should return professor by ID', async () => {
      // Mock data
      const mockProfesseur = {
        id: 1,
        first_name: 'Jean',
        last_name: 'Dupont',
        nom_utilisateur: 'jdupont',
        email: 'jean.dupont@example.com',
        genre_id: 1,
        date_of_birth: '1980-01-01',
        grade_id: 1
      };

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockProfesseur]);
        }
      );

      const result = await professeursClient.obtenirProfesseurParId(1);

      expect(result).toEqual({
        id: 1,
        first_name: 'Jean',
        last_name: 'Dupont',
        nom_utilisateur: 'jdupont',
        email: 'jean.dupont@example.com',
        genre_id: 1,
        date_of_birth: '1980-01-01',
        grade_id: 1
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs WHERE id = ? AND status_id = 5'),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when professor is not found', async () => {
      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

      const result = await professeursClient.obtenirProfesseurParId(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      await expect(professeursClient.obtenirProfesseurParId(1)).rejects.toThrow('Database error');
    });
  });

  describe('ajouterUnProfesseur', () => {
    it('should add a new professor', async () => {
      const mockUserData = {
        first_name: 'Marie',
        last_name: 'Dubois',
        nom_utilisateur: 'mdubois',
        email: 'marie.dubois@example.com',
        genre_id: 2,
        date_of_birth: '1990-10-10',
        grade_id: 1,
        abonnement_id: 1
      };

      // Setup mock implementation for checking if user exists
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []); // User does not exist
        }
      );

      // Setup mock implementation for inserting user
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 1 });
        }
      );

      const result = await professeursClient.ajouterUnProfesseur(mockUserData);

      expect(result).toEqual({
        isConfirm: true,
        message: 'Professeur ajouté avec succès.'
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(2);
    });

    it('should update existing user to professor', async () => {
      const mockUserData = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com'
      };

      const mockExistingUser = {
        id: 1,
        status_id: 1 // Not a professor yet
      };

      // Setup mock implementation for checking if user exists
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockExistingUser]); // User exists
        }
      );

      // Setup mock implementation for updating user
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { affectedRows: 1 });
        }
      );

      const result = await professeursClient.ajouterUnProfesseur(mockUserData);

      expect(result).toEqual({
        isConfirm: true,
        message: 'Utilisateur mis à jour en professeur.'
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(2);
    });

    it('should return confirmation when user is already a professor', async () => {
      const mockUserData = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com'
      };

      const mockExistingUser = {
        id: 1,
        status_id: 5 // Already a professor
      };

      // Setup mock implementation for checking if user exists
      mockMysqlConnector.query.mockImplementationOnce(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockExistingUser]); // User exists and is already a professor
        }
      );

      const result = await professeursClient.ajouterUnProfesseur(mockUserData);

      expect(result).toEqual({
        isConfirm: true,
        message: 'Utilisateur déjà professeur.'
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledTimes(1);
    });
  });
});
