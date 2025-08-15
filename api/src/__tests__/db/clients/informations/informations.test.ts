import { jest } from '@jest/globals';
import { Informations } from '../../../../db/clients/informations/informations.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
// Import des types nécessaires pour le connecteur MySQL
import { MysqlError, FieldInfo } from 'mysql';

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('Informations Client', () => {
  let informationsClient: Informations;
  // Utiliser any pour éviter les problèmes de typage complexes avec les mocks
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

      // Utiliser la signature type-safe
      mockMysqlConnector.query.mockImplementation(
        (sql: string, values: any[] | ((error: MysqlError | null, results?: any) => void), 
         callback?: (error: MysqlError | null, results?: any) => void) => {
          // Si le second argument est une fonction (callback), l'appeler
          if (typeof values === 'function') {
            values(null, mockGrades);
            return;
          }
          // Sinon, appeler le callback avec les résultats
          if (callback) callback(null, mockGrades);
        }
      );

      const result = await informationsClient.obtenirLesGrades();

      expect(result).toEqual(mockGrades);
      expect(mockMysqlConnector.query).toHaveBeenCalled();
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Créer une erreur compatible avec MysqlError
      const mockError = new Error('Database error') as MysqlError;
      // Ajouter les propriétés requises par MysqlError
      mockError.code = 'ERROR';
      mockError.errno = 1;
      mockError.fatal = true;

      mockMysqlConnector.query.mockImplementation(
        (sql: string, values: any[] | ((error: MysqlError | null, results?: any) => void), 
         callback?: (error: MysqlError | null, results?: any) => void) => {
          if (typeof values === 'function') {
            values(mockError);
            return;
          }
          if (callback) callback(mockError);
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
    it('should return all price plans', async () => {
      const mockPlans = [
        { id: 1, nom: 'Basique', description: 'Accès de base', prix: 29.99 },
        { id: 2, nom: 'Premium', description: 'Accès complet', prix: 49.99 }
      ];
      
      mockMysqlConnector.query.mockImplementation(
        (sql: string, values: any[] | ((error: MysqlError | null, results?: any) => void), 
         callback?: (error: MysqlError | null, results?: any) => void) => {
          if (typeof values === 'function') {
            values(null, mockPlans);
            return;
          }
          if (callback) callback(null, mockPlans);
        }
      );
      
      const result = await informationsClient.obtenirLesPlansTarifaires();
      
      // Utiliser une assertion plus souple car l'implémentation retourne directement les plans
      expect(result).toEqual(mockPlans);
      expect(mockMysqlConnector.query).toHaveBeenCalled();
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
    
    it('should handle empty result', async () => {
      mockMysqlConnector.query.mockImplementation(
        (sql: string, values: any[] | ((error: MysqlError | null, results?: any) => void), 
         callback?: (error: MysqlError | null, results?: any) => void) => {
          if (typeof values === 'function') {
            values(null, []);
            return;
          }
          if (callback) callback(null, []);
        }
      );
      
      const result = await informationsClient.obtenirLesPlansTarifaires();
      
      // L'implémentation retourne un tableau vide
      expect(result).toEqual([]);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      const mockError = new Error('Database error') as MysqlError;
      mockError.code = 'ERROR';
      mockError.errno = 1;
      mockError.fatal = true;
      
      mockMysqlConnector.query.mockImplementation(
        (sql: string, values: any[] | ((error: MysqlError | null, results?: any) => void), 
         callback?: (error: MysqlError | null, results?: any) => void) => {
          if (typeof values === 'function') {
            values(mockError);
            return;
          }
          if (callback) callback(mockError);
        }
      );
      
      await expect(informationsClient.obtenirLesPlansTarifaires()).rejects.toEqual(mockError);
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });
});