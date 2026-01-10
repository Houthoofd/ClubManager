import { jest } from '@jest/globals';
import { AuthRepository } from '../../../../db/clients/auth/auth.repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import type { UtilisateurAuth, TokenRecuperation, InformationsSecurite } from '../../../../db/clients/auth/types.js';

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

describe('AuthRepository', () => {
  let authRepository: AuthRepository;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authRepository = new AuthRepository();
    mockMysqlConnector = (MysqlConnector as any).getInstance();
  });

  describe('rechercherUtilisateurParEmail', () => {
    it('should return user when found', async () => {
      const mockUser: UtilisateurAuth = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        status_id: 1
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      const result = await authRepository.rechercherUtilisateurParEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test@example.com'],
        expect.any(Function)
      );
    });

    it('should return null when user not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.rechercherUtilisateurParEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.rechercherUtilisateurParEmail('test@example.com')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('rechercherUtilisateurActifParEmail', () => {
    it('should return active user when found', async () => {
      const mockUser: UtilisateurAuth = {
        id: 1,
        email: 'active@example.com',
        password: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Doe',
        status_id: 1
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      const result = await authRepository.rechercherUtilisateurActifParEmail('active@example.com');

      expect(result).toEqual(mockUser);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['active@example.com'],
        expect.any(Function)
      );
    });

    it('should return null for inactive user', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.rechercherUtilisateurActifParEmail('inactive@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.rechercherUtilisateurActifParEmail('test@example.com')
      ).rejects.toThrow('Query failed');
    });
  });

  describe('emailExiste', () => {
    it('should return true when email exists', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 1 }]);
      });

      const result = await authRepository.emailExiste('existing@example.com');

      expect(result).toBe(true);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['existing@example.com'],
        expect.any(Function)
      );
    });

    it('should return false when email does not exist', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 0 }]);
      });

      const result = await authRepository.emailExiste('notexisting@example.com');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.emailExiste('test@example.com')
      ).rejects.toThrow('Database error');
    });
  });

  describe('obtenirInformationsSecurite', () => {
    it('should return security information when found', async () => {
      const mockSecurityInfo: InformationsSecurite = {
        user_id: 1,
        failed_login_attempts: 2,
        last_login: new Date(),
        account_locked_until: null,
        password_changed_at: new Date(),
        two_factor_enabled: false
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockSecurityInfo]);
      });

      const result = await authRepository.obtenirInformationsSecurite(1);

      expect(result).toEqual(mockSecurityInfo);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when security info not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.obtenirInformationsSecurite(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Security query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.obtenirInformationsSecurite(1)
      ).rejects.toThrow('Security query failed');
    });
  });

  describe('verifierTokenRecuperation', () => {
    it('should return valid token data', async () => {
      const mockToken: TokenRecuperation = {
        id: 1,
        user_id: 1,
        token: 'valid-token-123',
        expires_at: new Date(Date.now() + 3600000),
        created_at: new Date(),
        used_at: null
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockToken]);
      });

      const result = await authRepository.verifierTokenRecuperation('valid-token-123');

      expect(result).toEqual(mockToken);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['valid-token-123', expect.any(Date)],
        expect.any(Function)
      );
    });

    it('should return null for invalid token', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.verifierTokenRecuperation('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.verifierTokenRecuperation('expired-token');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Token verification failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.verifierTokenRecuperation('test-token')
      ).rejects.toThrow('Token verification failed');
    });
  });

  describe('verifierTentativesRecuperationRecentes', () => {
    it('should return count of recent recovery attempts', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 3 }]);
      });

      const result = await authRepository.verifierTentativesRecuperationRecentes('test@example.com', 15);

      expect(result).toBe(3);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test@example.com', expect.any(Date)],
        expect.any(Function)
      );
    });

    it('should use default time window of 15 minutes', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 1 }]);
      });

      const result = await authRepository.verifierTentativesRecuperationRecentes('test@example.com');

      expect(result).toBe(1);
    });

    it('should return 0 on database error (fail safe)', async () => {
      const dbError = new Error('Database error');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      const result = await authRepository.verifierTentativesRecuperationRecentes('test@example.com');

      expect(result).toBe(0);
    });

    it('should handle custom time window', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 5 }]);
      });

      const result = await authRepository.verifierTentativesRecuperationRecentes('test@example.com', 30);

      expect(result).toBe(5);
    });
  });

  describe('obtenirTentativesConnexionRecentes', () => {
    it('should return count of recent login attempts', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 4 }]);
      });

      const result = await authRepository.obtenirTentativesConnexionRecentes('test@example.com', 15);

      expect(result).toBe(4);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test@example.com', expect.any(Date)],
        expect.any(Function)
      );
    });

    it('should use default time window of 15 minutes', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 2 }]);
      });

      const result = await authRepository.obtenirTentativesConnexionRecentes('test@example.com');

      expect(result).toBe(2);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.obtenirTentativesConnexionRecentes('test@example.com')
      ).rejects.toThrow('Query failed');
    });

    it('should handle custom time window', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 10 }]);
      });

      const result = await authRepository.obtenirTentativesConnexionRecentes('test@example.com', 60);

      expect(result).toBe(10);
    });
  });

  describe('obtenirUtilisateurParId', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status_id: 1
      };

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      const result = await authRepository.obtenirUtilisateurParId(1);

      expect(result).toEqual(mockUser);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return null when user not found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.obtenirUtilisateurParId(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('User query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.obtenirUtilisateurParId(1)
      ).rejects.toThrow('User query failed');
    });
  });

  describe('listerTokensUtilisateur', () => {
    it('should return list of tokens for user', async () => {
      const mockTokens: TokenRecuperation[] = [
        {
          id: 1,
          user_id: 1,
          token: 'token-1',
          expires_at: new Date(),
          created_at: new Date(),
          used_at: null
        },
        {
          id: 2,
          user_id: 1,
          token: 'token-2',
          expires_at: new Date(),
          created_at: new Date(),
          used_at: new Date()
        }
      ];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockTokens);
      });

      const result = await authRepository.listerTokensUtilisateur(1);

      expect(result).toEqual(mockTokens);
      expect(result).toHaveLength(2);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [1],
        expect.any(Function)
      );
    });

    it('should return empty array when no tokens found', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.listerTokensUtilisateur(999);

      expect(result).toEqual([]);
    });

    it('should handle null results', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await authRepository.listerTokensUtilisateur(1);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Token list query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.listerTokensUtilisateur(1)
      ).rejects.toThrow('Token list query failed');
    });
  });

  describe('compterUtilisateursActifs', () => {
    it('should return count of active users', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 150 }]);
      });

      const result = await authRepository.compterUtilisateursActifs();

      expect(result).toBe(150);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.any(Function)
      );
    });

    it('should return 0 when no active users', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, [{ count: 0 }]);
      });

      const result = await authRepository.compterUtilisateursActifs();

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Count query failed');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.compterUtilisateursActifs()
      ).rejects.toThrow('Count query failed');
    });
  });

  describe('queryAsync', () => {
    it('should execute query and return results', async () => {
      const mockResults = [{ id: 1, name: 'Test' }];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockResults);
      });

      const result = await authRepository.queryAsync('SELECT * FROM test', []);

      expect(result).toEqual(mockResults);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM test',
        [],
        expect.any(Function)
      );
    });

    it('should reject on error', async () => {
      const dbError = new Error('Query error');

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(dbError, null);
      });

      await expect(
        authRepository.queryAsync('SELECT * FROM test', [])
      ).rejects.toThrow('Query error');
    });

    it('should handle queries with parameters', async () => {
      const mockResults = [{ id: 1 }];

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, mockResults);
      });

      const result = await authRepository.queryAsync('SELECT * FROM test WHERE id = ?', [1]);

      expect(result).toEqual(mockResults);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        'SELECT * FROM test WHERE id = ?',
        [1],
        expect.any(Function)
      );
    });
  });

  describe('Constructor', () => {
    it('should create instance with mysql connector', () => {
      const repository = new AuthRepository();

      expect(repository).toBeInstanceOf(AuthRepository);
      expect(MysqlConnector.getInstance).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email strings', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.rechercherUtilisateurParEmail('');

      expect(result).toBeNull();
    });

    it('should handle very long email strings', async () => {
      const longEmail = 'a'.repeat(255) + '@example.com';

      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.rechercherUtilisateurParEmail(longEmail);

      expect(result).toBeNull();
    });

    it('should handle negative user IDs', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.obtenirUtilisateurParId(-1);

      expect(result).toBeNull();
    });

    it('should handle zero as user ID', async () => {
      mockMysqlConnector.query = jest.fn((sql: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await authRepository.obtenirUtilisateurParId(0);

      expect(result).toBeNull();
    });
  });
});
