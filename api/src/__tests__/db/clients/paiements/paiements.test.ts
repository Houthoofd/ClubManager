import { Paiements } from '../../../../db/clients/paiements/paiements.js';
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

describe('Paiements Client', () => {
  let paiementsClient: Paiements;
  let mockMysqlConnector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    paiementsClient = new Paiements();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
  });

  describe('obtenirLesTousLesPaiements', () => {
    it('should return all payments with user and plan data', async () => {
      // Mock data
      const mockPayments = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 100,
          date: '2023-01-15',
          statut: 'complété',
          abonnement_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          nom_plan: 'Standard'
        },
        {
          id: 2,
          utilisateur_id: 2,
          montant: 150,
          date: '2023-02-20',
          statut: 'en attente',
          abonnement_id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          nom_plan: 'Premium'
        }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockPayments);
        }
      );

      const result = await paiementsClient.obtenirLesTousLesPaiements();

      expect(result).toEqual(mockPayments);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT paiements.*, utilisateurs.first_name, utilisateurs.last_name, plans_tarifaires.nom_plan'),
        [],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      await expect(paiementsClient.obtenirLesTousLesPaiements()).rejects.toThrow('Database error');
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('obtenirPaiementsParUtilisateur', () => {
    it('should return payments for a specific user', async () => {
      // Mock data
      const mockUserPayments = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 100,
          date: '2023-01-15',
          statut: 'complété',
          abonnement_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          nom_plan: 'Standard'
        }
      ];

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any[]) => void) => {
          callback(null, mockUserPayments);
        }
      );

      const result = await paiementsClient.obtenirPaiementsParUtilisateur(1);

      expect(result).toEqual(mockUserPayments);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE paiements.utilisateur_id = ?'),
        [1],
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });

  describe('creerPaiement', () => {
    it('should create a new payment', async () => {
      const mockPaiementData = {
        utilisateur_id: 1,
        montant: 100,
        description: 'Cotisation annuelle',
        abonnement_id: 1
      };

      const mockInsertId = 5;
      const mockCurrentDate = '2023-05-01 12:00:00';

      // Setup mock implementation
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(null, { insertId: mockInsertId });
        }
      );

      // Mock Date.now for consistent testing
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        toISOString() {
          return mockCurrentDate;
        }
      } as any;

      const result = await paiementsClient.creerPaiement(mockPaiementData);

      // Restore original Date
      global.Date = originalDate;

      expect(result).toEqual({
        id: mockInsertId,
        ...mockPaiementData,
        date: mockCurrentDate,
        statut: 'en attente'
      });

      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO paiements'),
        expect.arrayContaining([
          mockPaiementData.utilisateur_id,
          mockPaiementData.montant,
          mockPaiementData.description
        ]),
        expect.any(Function)
      );
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockMysqlConnector.query.mockImplementation(
        (_sql: string, _values: any[], callback: (error: Error | null, results?: any) => void) => {
          callback(new Error('Database error'), undefined);
        }
      );

      const mockPaiementData = {
        utilisateur_id: 1,
        montant: 100,
        description: 'Cotisation annuelle'
      };

      await expect(paiementsClient.creerPaiement(mockPaiementData)).rejects.toThrow('Database error');
      expect(mockMysqlConnector.close).toHaveBeenCalled();
    });
  });
});
