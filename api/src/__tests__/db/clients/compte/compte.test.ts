import { Compte } from '../../../../db/clients/compte/compte.js';
import { Pool } from 'pg';

// Mock the PostgreSQL Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Compte Client', () => {
  let compteClient: Compte;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
    mockPool = ((Pool as unknown) as jest.Mock).mock.results[0].value;
  });

  describe('obtenirUnUtilisateurParSonNomEtPrenom', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com',
      };

      mockPool.query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      });

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('John', 'Doe');

      expect(result).toEqual({
        isFind: true,
        data: mockUser,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM utilisateurs WHERE prenom = $1 AND nom = $2'),
        ['John', 'Doe']
      );
    });

    it('should return isFind false when user not found', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await compteClient.obtenirUnUtilisateurParSonNomEtPrenom('Unknown', 'User');

      expect(result).toEqual({
        isFind: false,
        data: [],
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      await expect(
        compteClient.obtenirUnUtilisateurParSonNomEtPrenom('John', 'Doe')
      ).rejects.toThrow('Database connection failed');

      expect(mockPool.query).toHaveBeenCalled();
    });
  });
});
