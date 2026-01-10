import { jest } from '@jest/globals';
import { CommandesRepository } from '../../../../db/clients/commandes/commandes.repository.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import { CommandesReadRepository } from '../../../../db/clients/commandes/repositories/read.repository.js';
import { CommandesWriteRepository } from '../../../../db/clients/commandes/repositories/write.repository.js';
import { CommandesStatsRepository } from '../../../../db/clients/commandes/repositories/stats.repository.js';
import { CommandesSearchRepository } from '../../../../db/clients/commandes/repositories/search.repository.js';
import { CommandesValidationRepository } from '../../../../db/clients/commandes/repositories/validation.repository.js';

// Mock MySQL Connector and sub-repositories
jest.mock('../../../../db/connector/mysqlconnector.js');
jest.mock('../../../../db/clients/commandes/repositories/read.repository.js');
jest.mock('../../../../db/clients/commandes/repositories/write.repository.js');
jest.mock('../../../../db/clients/commandes/repositories/stats.repository.js');
jest.mock('../../../../db/clients/commandes/repositories/search.repository.js');
jest.mock('../../../../db/clients/commandes/repositories/validation.repository.js');

describe('CommandesRepository', () => {
  let commandesRepository: CommandesRepository;
  let mockMysqlConnector: any;
  let mockReadRepo: any;
  let mockWriteRepo: any;
  let mockStatsRepo: any;
  let mockSearchRepo: any;
  let mockValidationRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockMysqlConnector = {
      query: jest.fn(),
      getInstance: jest.fn()
    };
    (MysqlConnector.getInstance as jest.Mock).mockReturnValue(mockMysqlConnector);

    // Create repository instance
    commandesRepository = new CommandesRepository();

    // Get mocked sub-repositories
    mockReadRepo = (CommandesReadRepository as jest.Mock).mock.instances[0];
    mockWriteRepo = (CommandesWriteRepository as jest.Mock).mock.instances[0];
    mockStatsRepo = (CommandesStatsRepository as jest.Mock).mock.instances[0];
    mockSearchRepo = (CommandesSearchRepository as jest.Mock).mock.instances[0];
    mockValidationRepo = (CommandesValidationRepository as jest.Mock).mock.instances[0];
  });

  describe('Constructor', () => {
    it('should create instance with all sub-repositories', () => {
      expect(commandesRepository).toBeInstanceOf(CommandesRepository);
      expect(MysqlConnector.getInstance).toHaveBeenCalled();
      expect(CommandesReadRepository).toHaveBeenCalled();
      expect(CommandesWriteRepository).toHaveBeenCalled();
      expect(CommandesStatsRepository).toHaveBeenCalled();
      expect(CommandesSearchRepository).toHaveBeenCalled();
      expect(CommandesValidationRepository).toHaveBeenCalled();
    });
  });

  describe('Read Operations', () => {
    describe('findAll', () => {
      it('should return all commandes', async () => {
        const mockCommandes = [
          {
            id: 'CMD-001',
            utilisateur_id: 1,
            statut: 'en_attente',
            total: 100.50,
            created_at: new Date()
          },
          {
            id: 'CMD-002',
            utilisateur_id: 2,
            statut: 'validee',
            total: 250.00,
            created_at: new Date()
          }
        ];

        mockReadRepo.findAll = jest.fn().mockResolvedValue(mockCommandes);

        const result = await commandesRepository.findAll();

        expect(result).toEqual(mockCommandes);
        expect(mockReadRepo.findAll).toHaveBeenCalled();
      });

      it('should return empty array when no commandes', async () => {
        mockReadRepo.findAll = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.findAll();

        expect(result).toEqual([]);
        expect(mockReadRepo.findAll).toHaveBeenCalled();
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database connection failed');
        mockReadRepo.findAll = jest.fn().mockRejectedValue(dbError);

        await expect(commandesRepository.findAll()).rejects.toThrow('Database connection failed');
      });
    });

    describe('findById', () => {
      it('should return commande when found', async () => {
        const mockCommande = {
          id: 'CMD-001',
          utilisateur_id: 1,
          statut: 'en_attente',
          total: 100.50,
          created_at: new Date()
        };

        mockReadRepo.findById = jest.fn().mockResolvedValue(mockCommande);

        const result = await commandesRepository.findById('CMD-001');

        expect(result).toEqual(mockCommande);
        expect(mockReadRepo.findById).toHaveBeenCalledWith('CMD-001');
      });

      it('should return null when commande not found', async () => {
        mockReadRepo.findById = jest.fn().mockResolvedValue(null);

        const result = await commandesRepository.findById('CMD-999');

        expect(result).toBeNull();
        expect(mockReadRepo.findById).toHaveBeenCalledWith('CMD-999');
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Query failed');
        mockReadRepo.findById = jest.fn().mockRejectedValue(dbError);

        await expect(commandesRepository.findById('CMD-001')).rejects.toThrow('Query failed');
      });
    });

    describe('findByUserId', () => {
      it('should return user commandes', async () => {
        const mockCommandes = [
          {
            id: 'CMD-001',
            utilisateur_id: 1,
            statut: 'validee',
            total: 100.50
          },
          {
            id: 'CMD-002',
            utilisateur_id: 1,
            statut: 'en_attente',
            total: 50.00
          }
        ];

        mockReadRepo.findByUserId = jest.fn().mockResolvedValue(mockCommandes);

        const result = await commandesRepository.findByUserId(1);

        expect(result).toEqual(mockCommandes);
        expect(mockReadRepo.findByUserId).toHaveBeenCalledWith(1);
      });

      it('should return empty array for user with no commandes', async () => {
        mockReadRepo.findByUserId = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.findByUserId(999);

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        const dbError = new Error('User query failed');
        mockReadRepo.findByUserId = jest.fn().mockRejectedValue(dbError);

        await expect(commandesRepository.findByUserId(1)).rejects.toThrow('User query failed');
      });
    });

    describe('findByStatut', () => {
      it('should return commandes with specific status', async () => {
        const mockCommandes = [
          {
            id: 'CMD-001',
            statut: 'en_attente',
            total: 100.50
          },
          {
            id: 'CMD-003',
            statut: 'en_attente',
            total: 75.00
          }
        ];

        mockReadRepo.findByStatut = jest.fn().mockResolvedValue(mockCommandes);

        const result = await commandesRepository.findByStatut('en_attente');

        expect(result).toEqual(mockCommandes);
        expect(mockReadRepo.findByStatut).toHaveBeenCalledWith('en_attente');
      });

      it('should return empty array when no commandes with status', async () => {
        mockReadRepo.findByStatut = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.findByStatut('annulee');

        expect(result).toEqual([]);
      });
    });

    describe('findByPaymentIntent', () => {
      it('should return commande with payment intent', async () => {
        const mockCommande = {
          id: 'CMD-001',
          payment_intent_id: 'pi_123456',
          statut: 'validee',
          total: 100.50
        };

        mockReadRepo.findByPaymentIntent = jest.fn().mockResolvedValue(mockCommande);

        const result = await commandesRepository.findByPaymentIntent('pi_123456');

        expect(result).toEqual(mockCommande);
        expect(mockReadRepo.findByPaymentIntent).toHaveBeenCalledWith('pi_123456');
      });

      it('should return null when payment intent not found', async () => {
        mockReadRepo.findByPaymentIntent = jest.fn().mockResolvedValue(null);

        const result = await commandesRepository.findByPaymentIntent('pi_invalid');

        expect(result).toBeNull();
      });
    });

    describe('getRecentUserCommandes', () => {
      it('should return recent commandes with default time window', async () => {
        const mockCommandes = [
          {
            id: 'CMD-001',
            utilisateur_id: 1,
            created_at: new Date()
          }
        ];

        mockReadRepo.getRecentUserCommandes = jest.fn().mockResolvedValue(mockCommandes);

        const result = await commandesRepository.getRecentUserCommandes(1);

        expect(result).toEqual(mockCommandes);
        expect(mockReadRepo.getRecentUserCommandes).toHaveBeenCalledWith(1, 30);
      });

      it('should return recent commandes with custom time window', async () => {
        const mockCommandes = [
          {
            id: 'CMD-001',
            utilisateur_id: 1,
            created_at: new Date()
          }
        ];

        mockReadRepo.getRecentUserCommandes = jest.fn().mockResolvedValue(mockCommandes);

        const result = await commandesRepository.getRecentUserCommandes(1, 60);

        expect(result).toEqual(mockCommandes);
        expect(mockReadRepo.getRecentUserCommandes).toHaveBeenCalledWith(1, 60);
      });

      it('should return empty array when no recent commandes', async () => {
        mockReadRepo.getRecentUserCommandes = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.getRecentUserCommandes(1);

        expect(result).toEqual([]);
      });
    });
  });

  describe('Write Operations', () => {
    describe('create', () => {
      it('should create new commande successfully', async () => {
        const commandeData = {
          utilisateur_id: 1,
          statut: 'en_attente',
          total: 100.50,
          articles: []
        };

        mockWriteRepo.create = jest.fn().mockResolvedValue('CMD-001');

        const result = await commandesRepository.create(commandeData);

        expect(result).toBe('CMD-001');
        expect(mockWriteRepo.create).toHaveBeenCalledWith(commandeData);
      });

      it('should handle creation errors', async () => {
        const commandeData = {
          utilisateur_id: 1,
          statut: 'en_attente',
          total: 100.50,
          articles: []
        };

        const dbError = new Error('Creation failed');
        mockWriteRepo.create = jest.fn().mockRejectedValue(dbError);

        await expect(commandesRepository.create(commandeData)).rejects.toThrow('Creation failed');
      });
    });

    describe('updateStatut', () => {
      it('should update commande status successfully', async () => {
        mockWriteRepo.updateStatut = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updateStatut('CMD-001', 'validee');

        expect(result).toBe(true);
        expect(mockWriteRepo.updateStatut).toHaveBeenCalledWith('CMD-001', 'validee');
      });

      it('should return false when commande not found', async () => {
        mockWriteRepo.updateStatut = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.updateStatut('CMD-999', 'validee');

        expect(result).toBe(false);
      });

      it('should handle update errors', async () => {
        const dbError = new Error('Update failed');
        mockWriteRepo.updateStatut = jest.fn().mockRejectedValue(dbError);

        await expect(
          commandesRepository.updateStatut('CMD-001', 'validee')
        ).rejects.toThrow('Update failed');
      });
    });

    describe('updateTotal', () => {
      it('should update commande total successfully', async () => {
        mockWriteRepo.updateTotal = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updateTotal('CMD-001', 150.75);

        expect(result).toBe(true);
        expect(mockWriteRepo.updateTotal).toHaveBeenCalledWith('CMD-001', 150.75);
      });

      it('should handle invalid total amounts', async () => {
        mockWriteRepo.updateTotal = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.updateTotal('CMD-001', -50);

        expect(result).toBe(false);
      });
    });

    describe('updateArticles', () => {
      it('should update commande articles successfully', async () => {
        const articles = [
          { produit_id: 1, quantite: 2, prix_unitaire: 25.00 },
          { produit_id: 2, quantite: 1, prix_unitaire: 50.00 }
        ];

        mockWriteRepo.updateArticles = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updateArticles('CMD-001', articles);

        expect(result).toBe(true);
        expect(mockWriteRepo.updateArticles).toHaveBeenCalledWith('CMD-001', articles);
      });

      it('should handle empty articles array', async () => {
        mockWriteRepo.updateArticles = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updateArticles('CMD-001', []);

        expect(result).toBe(true);
      });
    });

    describe('updatePaymentIntent', () => {
      it('should update payment intent successfully', async () => {
        mockWriteRepo.updatePaymentIntent = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updatePaymentIntent('CMD-001', 'pi_123456');

        expect(result).toBe(true);
        expect(mockWriteRepo.updatePaymentIntent).toHaveBeenCalledWith('CMD-001', 'pi_123456');
      });

      it('should handle null payment intent', async () => {
        mockWriteRepo.updatePaymentIntent = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.updatePaymentIntent('CMD-001', null);

        expect(result).toBe(true);
      });
    });

    describe('update', () => {
      it('should update commande successfully', async () => {
        const updateData = {
          statut: 'validee',
          total: 150.00
        };

        mockWriteRepo.update = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.update('CMD-001', updateData);

        expect(result).toBe(true);
        expect(mockWriteRepo.update).toHaveBeenCalledWith('CMD-001', updateData);
      });

      it('should handle partial updates', async () => {
        const updateData = { statut: 'validee' };

        mockWriteRepo.update = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.update('CMD-001', updateData);

        expect(result).toBe(true);
      });
    });

    describe('delete', () => {
      it('should delete commande successfully', async () => {
        mockWriteRepo.delete = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.delete('CMD-001');

        expect(result).toBe(true);
        expect(mockWriteRepo.delete).toHaveBeenCalledWith('CMD-001');
      });

      it('should return false when commande not found', async () => {
        mockWriteRepo.delete = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.delete('CMD-999');

        expect(result).toBe(false);
      });

      it('should handle deletion errors', async () => {
        const dbError = new Error('Deletion failed');
        mockWriteRepo.delete = jest.fn().mockRejectedValue(dbError);

        await expect(commandesRepository.delete('CMD-001')).rejects.toThrow('Deletion failed');
      });
    });

    describe('deleteByUser', () => {
      it('should delete all user commandes', async () => {
        mockWriteRepo.deleteByUser = jest.fn().mockResolvedValue(3);

        const result = await commandesRepository.deleteByUser(1);

        expect(result).toBe(3);
        expect(mockWriteRepo.deleteByUser).toHaveBeenCalledWith(1);
      });

      it('should return 0 when user has no commandes', async () => {
        mockWriteRepo.deleteByUser = jest.fn().mockResolvedValue(0);

        const result = await commandesRepository.deleteByUser(999);

        expect(result).toBe(0);
      });
    });

    describe('deleteOldCancelled', () => {
      it('should delete old cancelled commandes', async () => {
        mockWriteRepo.deleteOldCancelled = jest.fn().mockResolvedValue(10);

        const result = await commandesRepository.deleteOldCancelled();

        expect(result).toBe(10);
        expect(mockWriteRepo.deleteOldCancelled).toHaveBeenCalled();
      });

      it('should return 0 when no old cancelled commandes', async () => {
        mockWriteRepo.deleteOldCancelled = jest.fn().mockResolvedValue(0);

        const result = await commandesRepository.deleteOldCancelled();

        expect(result).toBe(0);
      });
    });
  });

  describe('Statistics Operations', () => {
    describe('getStatistiques', () => {
      it('should return global statistics', async () => {
        const mockStats = {
          total_commandes: 150,
          total_ca: 15000.00,
          commandes_en_attente: 10,
          commandes_validees: 120,
          commandes_annulees: 20,
          panier_moyen: 100.00
        };

        mockStatsRepo.getStatistiques = jest.fn().mockResolvedValue(mockStats);

        const result = await commandesRepository.getStatistiques();

        expect(result).toEqual(mockStats);
        expect(mockStatsRepo.getStatistiques).toHaveBeenCalled();
      });

      it('should handle empty statistics', async () => {
        const emptyStats = {
          total_commandes: 0,
          total_ca: 0,
          commandes_en_attente: 0,
          commandes_validees: 0,
          commandes_annulees: 0,
          panier_moyen: 0
        };

        mockStatsRepo.getStatistiques = jest.fn().mockResolvedValue(emptyStats);

        const result = await commandesRepository.getStatistiques();

        expect(result).toEqual(emptyStats);
      });
    });

    describe('countByStatut', () => {
      it('should return count by status', async () => {
        mockStatsRepo.countByStatut = jest.fn().mockResolvedValue(25);

        const result = await commandesRepository.countByStatut('en_attente');

        expect(result).toBe(25);
        expect(mockStatsRepo.countByStatut).toHaveBeenCalledWith('en_attente');
      });

      it('should return 0 for status with no commandes', async () => {
        mockStatsRepo.countByStatut = jest.fn().mockResolvedValue(0);

        const result = await commandesRepository.countByStatut('remboursee');

        expect(result).toBe(0);
      });
    });

    describe('getStatsByPeriod', () => {
      it('should return statistics for period', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const mockPeriodStats = {
          total_commandes: 50,
          total_ca: 5000.00,
          panier_moyen: 100.00
        };

        mockStatsRepo.getStatsByPeriod = jest.fn().mockResolvedValue(mockPeriodStats);

        const result = await commandesRepository.getStatsByPeriod(startDate, endDate);

        expect(result).toEqual(mockPeriodStats);
        expect(mockStatsRepo.getStatsByPeriod).toHaveBeenCalledWith(startDate, endDate);
      });
    });

    describe('getTopProduits', () => {
      it('should return top products', async () => {
        const mockTopProducts = [
          { produit_id: 1, nom: 'Produit A', quantite_vendue: 100 },
          { produit_id: 2, nom: 'Produit B', quantite_vendue: 75 }
        ];

        mockStatsRepo.getTopProduits = jest.fn().mockResolvedValue(mockTopProducts);

        const result = await commandesRepository.getTopProduits(10);

        expect(result).toEqual(mockTopProducts);
        expect(mockStatsRepo.getTopProduits).toHaveBeenCalledWith(10);
      });

      it('should return empty array when no products', async () => {
        mockStatsRepo.getTopProduits = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.getTopProduits(10);

        expect(result).toEqual([]);
      });
    });

    describe('getPanierMoyen', () => {
      it('should return average cart value', async () => {
        mockStatsRepo.getPanierMoyen = jest.fn().mockResolvedValue(125.50);

        const result = await commandesRepository.getPanierMoyen();

        expect(result).toBe(125.50);
        expect(mockStatsRepo.getPanierMoyen).toHaveBeenCalled();
      });

      it('should return 0 when no commandes', async () => {
        mockStatsRepo.getPanierMoyen = jest.fn().mockResolvedValue(0);

        const result = await commandesRepository.getPanierMoyen();

        expect(result).toBe(0);
      });
    });

    describe('getTauxConversion', () => {
      it('should return conversion rate', async () => {
        mockStatsRepo.getTauxConversion = jest.fn().mockResolvedValue(0.75);

        const result = await commandesRepository.getTauxConversion();

        expect(result).toBe(0.75);
        expect(mockStatsRepo.getTauxConversion).toHaveBeenCalled();
      });

      it('should return 0 when no data', async () => {
        mockStatsRepo.getTauxConversion = jest.fn().mockResolvedValue(0);

        const result = await commandesRepository.getTauxConversion();

        expect(result).toBe(0);
      });
    });
  });

  describe('Search Operations', () => {
    describe('search', () => {
      it('should search commandes with criteria', async () => {
        const searchCriteria = {
          status: 'en_attente',
          minTotal: 50,
          maxTotal: 200
        };

        const mockResults = [
          { id: 'CMD-001', total: 100, statut: 'en_attente' },
          { id: 'CMD-002', total: 150, statut: 'en_attente' }
        ];

        mockSearchRepo.search = jest.fn().mockResolvedValue(mockResults);

        const result = await commandesRepository.search(searchCriteria);

        expect(result).toEqual(mockResults);
        expect(mockSearchRepo.search).toHaveBeenCalledWith(searchCriteria);
      });

      it('should return empty array when no matches', async () => {
        mockSearchRepo.search = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.search({ status: 'invalid' });

        expect(result).toEqual([]);
      });
    });

    describe('searchByEmail', () => {
      it('should search commandes by user email', async () => {
        const mockResults = [
          { id: 'CMD-001', email: 'test@example.com' }
        ];

        mockSearchRepo.searchByEmail = jest.fn().mockResolvedValue(mockResults);

        const result = await commandesRepository.searchByEmail('test@example.com');

        expect(result).toEqual(mockResults);
        expect(mockSearchRepo.searchByEmail).toHaveBeenCalledWith('test@example.com');
      });

      it('should return empty array when email not found', async () => {
        mockSearchRepo.searchByEmail = jest.fn().mockResolvedValue([]);

        const result = await commandesRepository.searchByEmail('notfound@example.com');

        expect(result).toEqual([]);
      });
    });

    describe('searchByMontantRange', () => {
      it('should search commandes by amount range', async () => {
        const mockResults = [
          { id: 'CMD-001', total: 75.00 },
          { id: 'CMD-002', total: 100.00 }
        ];

        mockSearchRepo.searchByMontantRange = jest.fn().mockResolvedValue(mockResults);

        const result = await commandesRepository.searchByMontantRange(50, 150);

        expect(result).toEqual(mockResults);
        expect(mockSearchRepo.searchByMontantRange).toHaveBeenCalledWith(50, 150);
      });
    });
  });

  describe('Validation Operations', () => {
    describe('exists', () => {
      it('should return true when commande exists', async () => {
        mockValidationRepo.exists = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.exists('CMD-001');

        expect(result).toBe(true);
        expect(mockValidationRepo.exists).toHaveBeenCalledWith('CMD-001');
      });

      it('should return false when commande does not exist', async () => {
        mockValidationRepo.exists = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.exists('CMD-999');

        expect(result).toBe(false);
      });
    });

    describe('userExists', () => {
      it('should return true when user exists', async () => {
        mockValidationRepo.userExists = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.userExists(1);

        expect(result).toBe(true);
        expect(mockValidationRepo.userExists).toHaveBeenCalledWith(1);
      });

      it('should return false when user does not exist', async () => {
        mockValidationRepo.userExists = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.userExists(999);

        expect(result).toBe(false);
      });
    });

    describe('canBeCancelled', () => {
      it('should return true when commande can be cancelled', async () => {
        mockValidationRepo.canBeCancelled = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.canBeCancelled('CMD-001');

        expect(result).toBe(true);
        expect(mockValidationRepo.canBeCancelled).toHaveBeenCalledWith('CMD-001');
      });

      it('should return false when commande cannot be cancelled', async () => {
        mockValidationRepo.canBeCancelled = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.canBeCancelled('CMD-001');

        expect(result).toBe(false);
      });
    });

    describe('checkValidStatut', () => {
      it('should return true for valid status', () => {
        mockValidationRepo.checkValidStatut = jest.fn().mockReturnValue(true);

        const result = commandesRepository.checkValidStatut('en_attente');

        expect(result).toBe(true);
        expect(mockValidationRepo.checkValidStatut).toHaveBeenCalledWith('en_attente');
      });

      it('should return false for invalid status', () => {
        mockValidationRepo.checkValidStatut = jest.fn().mockReturnValue(false);

        const result = commandesRepository.checkValidStatut('invalid_status');

        expect(result).toBe(false);
      });
    });

    describe('isValidStatusTransition', () => {
      it('should return true for valid status transition', () => {
        mockValidationRepo.isValidStatusTransition = jest.fn().mockReturnValue(true);

        const result = commandesRepository.isValidStatusTransition('en_attente', 'validee');

        expect(result).toBe(true);
        expect(mockValidationRepo.isValidStatusTransition).toHaveBeenCalledWith('en_attente', 'validee');
      });

      it('should return false for invalid status transition', () => {
        mockValidationRepo.isValidStatusTransition = jest.fn().mockReturnValue(false);

        const result = commandesRepository.isValidStatusTransition('validee', 'en_attente');

        expect(result).toBe(false);
      });
    });

    describe('checkValidMontant', () => {
      it('should return true for valid amount', () => {
        mockValidationRepo.checkValidMontant = jest.fn().mockReturnValue(true);

        const result = commandesRepository.checkValidMontant(100.50);

        expect(result).toBe(true);
        expect(mockValidationRepo.checkValidMontant).toHaveBeenCalledWith(100.50);
      });

      it('should return false for invalid amount', () => {
        mockValidationRepo.checkValidMontant = jest.fn().mockReturnValue(false);

        const result = commandesRepository.checkValidMontant(-50);

        expect(result).toBe(false);
      });
    });

    describe('userCanOrder', () => {
      it('should return true when user can order', async () => {
        mockValidationRepo.userCanOrder = jest.fn().mockResolvedValue(true);

        const result = await commandesRepository.userCanOrder(1);

        expect(result).toBe(true);
        expect(mockValidationRepo.userCanOrder).toHaveBeenCalledWith(1);
      });

      it('should return false when user cannot order', async () => {
        mockValidationRepo.userCanOrder = jest.fn().mockResolvedValue(false);

        const result = await commandesRepository.userCanOrder(1);

        expect(result).toBe(false);
      });
    });
  });

  describe('Getters', () => {
    describe('read', () => {
      it('should return read repository instance', () => {
        const readRepo = commandesRepository.read;

        expect(readRepo).toBeDefined();
      });
    });

    describe('write', () => {
      it('should return write repository instance', () => {
        const writeRepo = commandesRepository.write;

        expect(writeRepo).toBeDefined();
      });
    });

    describe('stats', () => {
      it('should return stats repository instance', () => {
        const statsRepo = commandesRepository.stats;

        expect(statsRepo).toBeDefined();
      });
    });

    describe('searchRepository', () => {
      it('should return search repository instance', () => {
        const searchRepo = commandesRepository.searchRepository;

        expect(searchRepo).toBeDefined();
      });
    });

    describe('validation', () => {
      it('should return validation repository instance', () => {
        const validationRepo = commandesRepository.validation;

        expect(validationRepo).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await commandesRepository.findById('CMD-NULL');

      expect(result).toBeNull();
    });

    it('should handle empty strings', async () => {
      mockReadRepo.findById = jest.fn().mockResolvedValue(null);

      const result = await commandesRepository.findById('');

      expect(result).toBeNull();
    });

    it('should handle very large amounts', async () => {
      mockValidationRepo.checkValidMontant = jest.fn().mockReturnValue(true);

      const result = commandesRepository.checkValidMontant(999999999.99);

      expect(result).toBe(true);
    });

    it('should handle negative user IDs', async () => {
      mockValidationRepo.userExists = jest.fn().mockResolvedValue(false);

      const result = await commandesRepository.userExists(-1);

      expect(result).toBe(false);
    });
  });
});
