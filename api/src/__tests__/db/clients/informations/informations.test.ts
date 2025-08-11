import { Informations } from '../../../../db/clients/informations/informations.js';
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

describe('Informations Client', () => {
  let informationsClient: Informations;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    informationsClient = new Informations();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirLesGrades', () => {
    it('should return all grades', async () => {
      // Mock data
      const mockGrades = [
        { id: 1, nom: 'Ceinture blanche', ordre: 1 },
        { id: 2, nom: 'Ceinture jaune', ordre: 2 }
      ];

      // Setup mock implementation with proper type annotations
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockGrades);
        }
      );

      const result = await informationsClient.obtenirLesGrades();

      expect(result).toEqual(mockGrades);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM grades',
        [],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock database error with proper type annotations
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      await expect(informationsClient.obtenirLesGrades()).rejects.toThrow('Database error');
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirLesGenres', () => {
    it('should return all genders', async () => {
      // Mock data
      const mockGenres = [
        { id: 1, nom: 'Homme' },
        { id: 2, nom: 'Femme' }
      ];

      // Setup mock implementation with proper type annotations
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockGenres);
        }
      );

      const result = await informationsClient.obtenirLesGenres();

      expect(result).toEqual(mockGenres);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM genres',
        [],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirLeStatus', () => {
    it('should return all statuses', async () => {
      // Mock data
      const mockStatus = [
        { id: 1, nom: 'Utilisateur' },
        { id: 2, nom: 'Admin' }
      ];

      // Setup mock implementation with proper type annotations
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockStatus);
        }
      );

      const result = await informationsClient.obtenirLeStatus();

      expect(result).toEqual(mockStatus);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM status',
        [],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirLesPlansTarifaires', () => {
    it('should return all pricing plans', async () => {
      // Mock data
      const mockPlans = [
        { id: 1, nom_plan: 'Basic', prix: 50.00 },
        { id: 2, nom_plan: 'Premium', prix: 100.00 }
      ];

      // Setup mock implementation with proper type annotations
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockPlans);
        }
      );

      const result = await informationsClient.obtenirLesPlansTarifaires();

      expect(result).toEqual(mockPlans);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM plans_tarifaires',
        [],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });
});
