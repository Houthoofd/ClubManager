import { jest } from '@jest/globals';
import { Compte } from '../../../../db/clients/compte/compte.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';

// Mock the MySQL connector
jest.mock('../../../../db/connector/mysqlconnector.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn(),
      close: jest.fn(),
    };
  });
});

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
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com',
      };

      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, [mockUser]);
        }
      );

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('John', 'Doe');

      expect(result).toEqual({
        isFind: true,
        data: mockUser,
      });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs WHERE prenom = ? AND nom = ?'),
        ['John', 'Doe'],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should return isFind false when user not found', async () => {
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, []);
        }
      );

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('Unknown', 'User');

      expect(result).toEqual({
        isFind: false,
        data: [],
      });
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
