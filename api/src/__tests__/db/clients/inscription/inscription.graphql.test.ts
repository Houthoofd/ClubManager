/**
 * Tests unitaires pour les resolvers GraphQL du module Inscription
 * Teste les queries, mutations et field resolvers
 */

import { resolvers } from '../../../../db/clients/inscription/inscription.graphql.js';
import { getInscriptionRepository } from '../../../../db/clients/inscription/inscription.repository.js';
import type {
  Cours,
  CoursRecurrent,
  Inscription,
  UtilisateurInscrit,
  Professeur,
} from '../../../../db/clients/inscription/types/index.js';

// Mock du repository
jest.mock('../../../../db/clients/inscription/inscription.repository.js');

describe('Inscription GraphQL Resolvers', () => {
  let mockRepository: jest.Mocked<ReturnType<typeof getInscriptionRepository>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = {
      findAllCours: jest.fn(),
      findCoursById: jest.fn(),
      findCoursByParticipant: jest.fn(),
      findCoursBySemaine: jest.fn(),
      searchCoursByDate: jest.fn(),
      searchCoursByDateRange: jest.fn(),
      findAllCoursRecurrents: jest.fn(),
      findCoursRecurrentById: jest.fn(),
      findJoursDeCours: jest.fn(),
      findSemainesAvecCours: jest.fn(),
      findInscriptionsByCours: jest.fn(),
      findInscriptionById: jest.fn(),
      verifyInscription: jest.fn(),
      findUtilisateursByCours: jest.fn(),
      findCoursInscritsByUtilisateur: jest.fn(),
      findProfesseursByCours: jest.fn(),
      findProfesseursByCoursRecurrent: jest.fn(),
      getStatistiquesPresenceByCours: jest.fn(),
      getStatistiquesPresenceByUtilisateur: jest.fn(),
      countInscriptionsByCours: jest.fn(),
      countCoursByUtilisateur: jest.fn(),
      createCours: jest.fn(),
      createCoursRecurrent: jest.fn(),
      associateProfesseursToCoursRecurrent: jest.fn(),
      updateCoursRecurrent: jest.fn(),
      deleteCoursRecurrent: jest.fn(),
      softDeleteCoursRecurrent: jest.fn(),
      createInscription: jest.fn(),
      deleteInscriptionByCoursUser: jest.fn(),
      updatePresence: jest.fn(),
      validerInscription: jest.fn(),
      annulerInscription: jest.fn(),
      deleteInscription: jest.fn(),
      deleteCours: jest.fn(),
      deleteProfesseursFromCoursRecurrent: jest.fn(),
    } as any;

    (getInscriptionRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  // ==========================================================================
  // TESTS - QUERIES
  // ==========================================================================

  describe('Query: cours', () => {
    it('should return a cours by id', async () => {
      const mockCours: Cours = {
        id: 1,
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
      };

      mockRepository.findCoursById.mockResolvedValue(mockCours);

      const result = await resolvers.Query.cours(null, { id: 1 });

      expect(result).toEqual(mockCours);
      expect(mockRepository.findCoursById).toHaveBeenCalledWith(1);
    });

    it('should return null when cours not found', async () => {
      mockRepository.findCoursById.mockResolvedValue(null);

      const result = await resolvers.Query.cours(null, { id: 999 });

      expect(result).toBeNull();
    });
  });

  describe('Query: allCours', () => {
    it('should return all cours', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
        {
          id: 2,
          date_cours: '2024-01-16',
          type_cours: 'Karaté',
          heure_debut: '19:00:00',
          heure_fin: '20:00:00',
        },
      ];

      mockRepository.findAllCours.mockResolvedValue(mockCours);

      const result = await resolvers.Query.allCours();

      expect(result).toEqual(mockCours);
      expect(result).toHaveLength(2);
      expect(mockRepository.findAllCours).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cours found', async () => {
      mockRepository.findAllCours.mockResolvedValue([]);

      const result = await resolvers.Query.allCours();

      expect(result).toEqual([]);
    });
  });

  describe('Query: searchCours', () => {
    it('should search cours by date range', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
      ];

      mockRepository.searchCoursByDateRange.mockResolvedValue(mockCours);

      const result = await resolvers.Query.searchCours(null, {
        filters: { date_debut: '2024-01-01', date_fin: '2024-01-31' },
      });

      expect(result).toEqual(mockCours);
      expect(mockRepository.searchCoursByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      );
    });

    it('should return all cours when no date filters provided', async () => {
      const mockCours: Cours[] = [];
      mockRepository.findAllCours.mockResolvedValue(mockCours);

      const result = await resolvers.Query.searchCours(null, { filters: {} });

      expect(mockRepository.findAllCours).toHaveBeenCalled();
    });
  });

  describe('Query: coursByParticipant', () => {
    it('should return cours for a participant', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
      ];

      mockRepository.findCoursByParticipant.mockResolvedValue(mockCours);

      const result = await resolvers.Query.coursByParticipant(null, { utilisateur_id: 1 });

      expect(result).toEqual(mockCours);
      expect(mockRepository.findCoursByParticipant).toHaveBeenCalledWith(1);
    });
  });

  describe('Query: coursBySemaine', () => {
    it('should return cours for a specific week', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
      ];

      mockRepository.findCoursBySemaine.mockResolvedValue(mockCours);

      const result = await resolvers.Query.coursBySemaine(null, { annee: 2024, numero_semaine: 3 });

      expect(result).toEqual(mockCours);
      expect(mockRepository.findCoursBySemaine).toHaveBeenCalledWith(2024, 3);
    });
  });

  describe('Query: coursByDate', () => {
    it('should return cours for a specific date', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
      ];

      mockRepository.searchCoursByDate.mockResolvedValue(mockCours);

      const result = await resolvers.Query.coursByDate(null, { date: '2024-01-15' });

      expect(result).toEqual(mockCours);
      expect(mockRepository.searchCoursByDate).toHaveBeenCalledWith('2024-01-15');
    });
  });

  describe('Query: coursByDateRange', () => {
    it('should return cours within date range', async () => {
      const mockCours: Cours[] = [
        {
          id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
        },
      ];

      mockRepository.searchCoursByDateRange.mockResolvedValue(mockCours);

      const result = await resolvers.Query.coursByDateRange(null, {
        date_debut: '2024-01-01',
        date_fin: '2024-01-31',
      });

      expect(result).toEqual(mockCours);
      expect(mockRepository.searchCoursByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      );
    });
  });

  describe('Query: allCoursRecurrents', () => {
    it('should return all cours recurrents', async () => {
      const mockCoursRecurrents: CoursRecurrent[] = [
        {
          id: 1,
          jour_semaine: 1,
          type_cours: 'Judo',
          heure_debut: '18:00:00',
          heure_fin: '19:00:00',
          date_debut: '2024-01-01',
        },
      ];

      mockRepository.findAllCoursRecurrents.mockResolvedValue(mockCoursRecurrents);

      const result = await resolvers.Query.allCoursRecurrents();

      expect(result).toEqual(mockCoursRecurrents);
    });
  });

  describe('Query: coursRecurrent', () => {
    it('should return a cours recurrent by id', async () => {
      const mockCoursRecurrent: CoursRecurrent = {
        id: 1,
        jour_semaine: 1,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        date_debut: '2024-01-01',
      };

      mockRepository.findCoursRecurrentById.mockResolvedValue(mockCoursRecurrent);

      const result = await resolvers.Query.coursRecurrent(null, { id: 1 });

      expect(result).toEqual(mockCoursRecurrent);
    });
  });

  describe('Query: verifyInscription', () => {
    it('should verify if user is inscrit', async () => {
      const mockVerification = {
        isBooked: true,
        isFind: true,
        message: 'Utilisateur déjà inscrit',
        data: { inscriptionId: 1 },
      };

      mockRepository.verifyInscription.mockResolvedValue(mockVerification);

      const result = await resolvers.Query.verifyInscription(null, {
        cours_id: 1,
        utilisateur_id: 1,
      });

      expect(result).toEqual(mockVerification);
      expect(mockRepository.verifyInscription).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Query: statsPresenceByCours', () => {
    it('should return presence statistics by cours', async () => {
      const mockStats = [
        {
          cours_id: 1,
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          total_inscrits: 10,
          presents: 8,
          absents: 2,
          en_attente: 0,
          taux_presence: 80,
        },
      ];

      mockRepository.getStatistiquesPresenceByCours.mockResolvedValue(mockStats);

      const result = await resolvers.Query.statsPresenceByCours(null, {
        input: { date_debut: '2024-01-01', date_fin: '2024-01-31' },
      });

      expect(result).toEqual(mockStats);
      expect(mockRepository.getStatistiquesPresenceByCours).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      );
    });
  });

  describe('Query: countInscriptionsByCours', () => {
    it('should return count of inscriptions', async () => {
      mockRepository.countInscriptionsByCours.mockResolvedValue(10);

      const result = await resolvers.Query.countInscriptionsByCours(null, { cours_id: 1 });

      expect(result).toBe(10);
      expect(mockRepository.countInscriptionsByCours).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // TESTS - MUTATIONS
  // ==========================================================================

  describe('Mutation: createCours', () => {
    it('should create a cours successfully', async () => {
      mockRepository.createCours.mockResolvedValue(1);

      const result = await resolvers.Mutation.createCours(null, {
        input: {
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours créé avec succès');
      expect(result.id).toBe('1');
    });

    it('should return error on failure', async () => {
      mockRepository.createCours.mockRejectedValue(new Error('Database error'));

      const result = await resolvers.Mutation.createCours(null, {
        input: {
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
    });
  });

  describe('Mutation: createCoursRecurrent', () => {
    it('should create a cours recurrent with professeurs', async () => {
      mockRepository.createCoursRecurrent.mockResolvedValue(1);
      mockRepository.associateProfesseursToCoursRecurrent.mockResolvedValue(undefined);

      const result = await resolvers.Mutation.createCoursRecurrent(null, {
        input: {
          jour: 'lundi',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
          professeurs: ['Jean Dupont'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours récurrent créé avec succès');
      expect(mockRepository.associateProfesseursToCoursRecurrent).toHaveBeenCalledWith(1, [
        'Jean Dupont',
      ]);
    });

    it('should create cours recurrent without professeurs', async () => {
      mockRepository.createCoursRecurrent.mockResolvedValue(1);

      const result = await resolvers.Mutation.createCoursRecurrent(null, {
        input: {
          jour: 'lundi',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        },
      });

      expect(result.success).toBe(true);
      expect(mockRepository.associateProfesseursToCoursRecurrent).not.toHaveBeenCalled();
    });
  });

  describe('Mutation: updateCoursRecurrent', () => {
    it('should update a cours recurrent successfully', async () => {
      mockRepository.updateCoursRecurrent.mockResolvedValue(true);

      const result = await resolvers.Mutation.updateCoursRecurrent(null, {
        input: {
          id: 1,
          type_cours: 'Karaté',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours récurrent modifié avec succès');
    });

    it('should update professeurs when provided', async () => {
      mockRepository.updateCoursRecurrent.mockResolvedValue(true);
      mockRepository.deleteProfesseursFromCoursRecurrent.mockResolvedValue(true);
      mockRepository.associateProfesseursToCoursRecurrent.mockResolvedValue(undefined);

      const result = await resolvers.Mutation.updateCoursRecurrent(null, {
        input: {
          id: 1,
          type_cours: 'Karaté',
          professeurs: ['Jean Dupont', 'Marie Martin'],
        },
      });

      expect(result.success).toBe(true);
      expect(mockRepository.deleteProfesseursFromCoursRecurrent).toHaveBeenCalledWith(1);
      expect(mockRepository.associateProfesseursToCoursRecurrent).toHaveBeenCalledWith(1, [
        'Jean Dupont',
        'Marie Martin',
      ]);
    });

    it('should return error when not found', async () => {
      mockRepository.updateCoursRecurrent.mockResolvedValue(false);

      const result = await resolvers.Mutation.updateCoursRecurrent(null, {
        input: { id: 999 },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cours récurrent non trouvé');
    });
  });

  describe('Mutation: deleteCoursRecurrent', () => {
    it('should delete a cours recurrent successfully', async () => {
      mockRepository.deleteCoursRecurrent.mockResolvedValue(true);

      const result = await resolvers.Mutation.deleteCoursRecurrent(null, { id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours récurrent supprimé avec succès');
    });

    it('should return error when not found', async () => {
      mockRepository.deleteCoursRecurrent.mockResolvedValue(false);

      const result = await resolvers.Mutation.deleteCoursRecurrent(null, { id: 999 });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cours récurrent non trouvé');
    });
  });

  describe('Mutation: terminateCoursRecurrent', () => {
    it('should terminate a cours recurrent successfully', async () => {
      mockRepository.softDeleteCoursRecurrent.mockResolvedValue(true);

      const result = await resolvers.Mutation.terminateCoursRecurrent(null, {
        id: 1,
        date_fin: '2024-12-31',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours récurrent terminé avec succès');
      expect(mockRepository.softDeleteCoursRecurrent).toHaveBeenCalledWith(1, '2024-12-31');
    });
  });

  describe('Mutation: inscrire', () => {
    it('should create an inscription successfully', async () => {
      mockRepository.createInscription.mockResolvedValue(1);

      const result = await resolvers.Mutation.inscrire(null, {
        input: {
          cours_id: 1,
          utilisateur_id: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inscription créée avec succès');
      expect(result.id).toBe('1');
    });

    it('should return error on failure', async () => {
      mockRepository.createInscription.mockRejectedValue(new Error('Constraint error'));

      const result = await resolvers.Mutation.inscrire(null, {
        input: {
          cours_id: 1,
          utilisateur_id: 1,
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Constraint error');
    });
  });

  describe('Mutation: desinscrire', () => {
    it('should delete an inscription successfully', async () => {
      mockRepository.deleteInscriptionByCoursUser.mockResolvedValue(true);

      const result = await resolvers.Mutation.desinscrire(null, {
        cours_id: 1,
        utilisateur_id: 1,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Désinscription effectuée avec succès');
    });

    it('should return error when not found', async () => {
      mockRepository.deleteInscriptionByCoursUser.mockResolvedValue(false);

      const result = await resolvers.Mutation.desinscrire(null, {
        cours_id: 1,
        utilisateur_id: 999,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Inscription non trouvée');
    });
  });

  describe('Mutation: updatePresence', () => {
    it('should update presence successfully', async () => {
      mockRepository.updatePresence.mockResolvedValue(true);

      const result = await resolvers.Mutation.updatePresence(null, {
        input: {
          inscription_id: 1,
          presence: 'present',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Présence mise à jour avec succès');
    });
  });

  describe('Mutation: validerInscription', () => {
    it('should validate an inscription', async () => {
      mockRepository.validerInscription.mockResolvedValue(true);

      const result = await resolvers.Mutation.validerInscription(null, {
        cours_id: 1,
        utilisateur_id: 1,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inscription validée avec succès');
    });
  });

  describe('Mutation: annulerInscription', () => {
    it('should cancel an inscription', async () => {
      mockRepository.annulerInscription.mockResolvedValue(true);

      const result = await resolvers.Mutation.annulerInscription(null, {
        cours_id: 1,
        utilisateur_id: 1,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inscription annulée avec succès');
    });
  });

  describe('Mutation: deleteInscription', () => {
    it('should delete an inscription', async () => {
      mockRepository.deleteInscription.mockResolvedValue(true);

      const result = await resolvers.Mutation.deleteInscription(null, { id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inscription supprimée avec succès');
    });
  });

  describe('Mutation: deleteCours', () => {
    it('should delete a cours', async () => {
      mockRepository.deleteCours.mockResolvedValue(true);

      const result = await resolvers.Mutation.deleteCours(null, { id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cours supprimé avec succès');
    });
  });

  // ==========================================================================
  // TESTS - FIELD RESOLVERS
  // ==========================================================================

  describe('Cours Field Resolver: professeurs', () => {
    it('should resolve professeurs for a cours', async () => {
      const mockProfesseurs: Professeur[] = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
        },
      ];

      mockRepository.findProfesseursByCours.mockResolvedValue(mockProfesseurs);

      const parent: Cours = {
        id: 1,
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
      };

      const result = await resolvers.Cours.professeurs(parent);

      expect(result).toEqual(mockProfesseurs);
      expect(mockRepository.findProfesseursByCours).toHaveBeenCalledWith(1);
    });
  });

  describe('Cours Field Resolver: utilisateurs', () => {
    it('should resolve utilisateurs for a cours', async () => {
      const mockUtilisateurs: UtilisateurInscrit[] = [
        {
          id: 1,
          nom: 'Doe',
          prenom: 'John',
          presence: 'present',
        },
      ];

      mockRepository.findUtilisateursByCours.mockResolvedValue(mockUtilisateurs);

      const parent: Cours = {
        id: 1,
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
      };

      const result = await resolvers.Cours.utilisateurs(parent);

      expect(result).toEqual(mockUtilisateurs);
      expect(mockRepository.findUtilisateursByCours).toHaveBeenCalledWith(1);
    });
  });

  describe('Cours Field Resolver: nombre_inscrits', () => {
    it('should resolve nombre_inscrits for a cours', async () => {
      mockRepository.countInscriptionsByCours.mockResolvedValue(10);

      const parent: Cours = {
        id: 1,
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
      };

      const result = await resolvers.Cours.nombre_inscrits(parent);

      expect(result).toBe(10);
      expect(mockRepository.countInscriptionsByCours).toHaveBeenCalledWith(1);
    });
  });

  describe('CoursRecurrent Field Resolver: professeurs', () => {
    it('should resolve professeurs for a cours recurrent', async () => {
      const mockProfesseurs: Professeur[] = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
        },
      ];

      mockRepository.findProfesseursByCoursRecurrent.mockResolvedValue(mockProfesseurs);

      const parent: CoursRecurrent = {
        id: 1,
        jour_semaine: 1,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        date_debut: '2024-01-01',
      };

      const result = await resolvers.CoursRecurrent.professeurs(parent);

      expect(result).toEqual(mockProfesseurs);
      expect(mockRepository.findProfesseursByCoursRecurrent).toHaveBeenCalledWith(1);
    });
  });

  describe('CoursRecurrent Field Resolver: jour_nom', () => {
    it('should resolve jour_nom for lundi', () => {
      const parent: CoursRecurrent = {
        id: 1,
        jour_semaine: 1,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        date_debut: '2024-01-01',
      };

      const result = resolvers.CoursRecurrent.jour_nom(parent);

      expect(result).toBe('lundi');
    });

    it('should resolve jour_nom for dimanche', () => {
      const parent: CoursRecurrent = {
        id: 1,
        jour_semaine: 0,
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
        date_debut: '2024-01-01',
      };

      const result = resolvers.CoursRecurrent.jour_nom(parent);

      expect(result).toBe('dimanche');
    });
  });

  describe('Inscription Field Resolver: cours', () => {
    it('should resolve cours for an inscription', async () => {
      const mockCours: Cours = {
        id: 1,
        date_cours: '2024-01-15',
        type_cours: 'Judo',
        heure_debut: '18:00:00',
        heure_fin: '19:00:00',
      };

      mockRepository.findCoursById.mockResolvedValue(mockCours);

      const parent: Inscription = {
        id: 1,
        cours_id: 1,
        utilisateur_id: 1,
        date_inscription: '2024-01-10',
        presence: 'present',
        est_valide: true,
      };

      const result = await resolvers.Inscription.cours(parent);

      expect(result).toEqual(mockCours);
      expect(mockRepository.findCoursById).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // TESTS - ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle repository errors in queries', async () => {
      mockRepository.findCoursById.mockRejectedValue(new Error('Database connection failed'));

      await expect(resolvers.Query.cours(null, { id: 1 })).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle repository errors in mutations gracefully', async () => {
      mockRepository.createCours.mockRejectedValue(new Error('Constraint violation'));

      const result = await resolvers.Mutation.createCours(null, {
        input: {
          date_cours: '2024-01-15',
          type_cours: 'Judo',
          heure_debut: '18:00',
          heure_fin: '19:00',
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Constraint violation');
    });
  });
});
