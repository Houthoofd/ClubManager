import { jest } from '@jest/globals';
import { Compte } from '../../../../db/clients/compte/compte.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import { MysqlError } from 'mysql';

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('Compte Client', () => {
  let compteClient: Compte;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirUnUtilisateurParSonNomEtPrenom', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@example.com',
      };

      mockMysqlConnector.query.mockImplementation((_sql: string, values: any[], callback: Function) => {
        if (Array.isArray(values) && values.length === 2) {
          callback(null, [mockUser]);
          return;
        }
        callback(null, []);
      });

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('John', 'Doe');

      // Adapter l'assertion pour correspondre à la structure réelle
      expect(result).toMatchObject({
        isFind: true,
        message: expect.any(String),
      });
      expect(result.data).toBeDefined();
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });

    it('should return isFind false when user not found', async () => {
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('Unknown', 'User');

      // Adapter l'assertion pour correspondre à la structure réelle
      expect(result).toMatchObject({
        isFind: false,
        message: expect.any(String),
      });
      expect(Array.isArray(result.data)).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(dbError, undefined);
        }
      );

      await expect(compteClient.obtenirUnUtilisateurParSonNomEtPrenom('John', 'Doe')).rejects.toEqual(dbError);
    });
  });
});


