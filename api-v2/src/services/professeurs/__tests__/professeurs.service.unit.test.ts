/**
 * Tests unitaires pour le service Professeurs
 * Couvre toutes les méthodes du service
 */

import { ProfesseursService } from '../professeurs.service.js';
import { ProfesseursError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockProfesseur,
  mockProfesseur2,
  mockUtilisateurNormal,
  mockPlanningCours,
  mockStatistiquesProfesseurs,
  mockStatistiquesProfesseur,
  formatProfesseur,
  formatProfesseurAvecDetails,
  formatPlanningCours
} from './professeurs.mock.js';

describe('ProfesseursService - Tests Unitaires', () => {
  let professeursService: ProfesseursService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    professeursService = new ProfesseursService(mockPrisma);
  });

  afterEach(() => {
    // Réinitialiser les mocks
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) => fn.mockReset?.());
    Object.values(mockPrisma.professeurs || {}).forEach((fn: any) => fn.mockReset?.());
    mockPrisma.$queryRaw?.mockReset?.();
  });

  // ============================================
  // QUERIES - PROFESSEURS
  // ============================================

  describe('obtenirProfesseurs', () => {
    it('devrait récupérer tous les professeurs avec pagination', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur, mockProfesseur2]);
      mockPrisma.utilisateurs.count.mockResolvedValue(2);

      const result = await professeursService.obtenirProfesseurs({});

      expect(result.professeurs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(mockPrisma.utilisateurs.findMany.mock.calls.length).toBe(1);
      expect(mockPrisma.utilisateurs.count.mock.calls.length).toBe(1);
    });

    it('devrait filtrer les professeurs par grade_id', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await professeursService.obtenirProfesseurs({ grade_id: 5 });

      expect(result.professeurs).toHaveLength(1);
      const whereClause = mockPrisma.utilisateurs.findMany.mock.calls[0][0].where;
      expect(whereClause.grade_id).toBe(5);
      expect(whereClause.status_id).toBe(5);
    });

    it('devrait filtrer les professeurs par genre_id', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await professeursService.obtenirProfesseurs({ genre_id: 2 });

      expect(result.professeurs).toHaveLength(1);
      const whereClause = mockPrisma.utilisateurs.findMany.mock.calls[0][0].where;
      expect(whereClause.genre_id).toBe(2);
    });

    it('devrait rechercher les professeurs par nom/prénom/email', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await professeursService.obtenirProfesseurs({ recherche: 'Martin' });

      const whereClause = mockPrisma.utilisateurs.findMany.mock.calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR).toHaveLength(4);
    });

    it('devrait gérer la pagination', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const result = await professeursService.obtenirProfesseurs({ limit: 10, offset: 20 });

      expect(result.hasMore).toBe(true);
      const callArgs = mockPrisma.utilisateurs.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(20);
    });

    it('devrait utiliser la limite par défaut de 50', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await professeursService.obtenirProfesseurs({});

      const callArgs = mockPrisma.utilisateurs.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50);
    });
  });

  describe('obtenirProfesseurParId', () => {
    it('devrait récupérer un professeur par son ID', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const result = await professeursService.obtenirProfesseurParId(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.nom).toBe('Martin');
      expect(mockPrisma.utilisateurs.findFirst.mock.calls.length).toBe(1);
    });

    it('devrait retourner null si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.obtenirProfesseurParId(999);

      expect(result).toBeNull();
    });

    it('devrait vérifier que le status_id est 5 (professeur)', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await professeursService.obtenirProfesseurParId(1);

      const whereClause = mockPrisma.utilisateurs.findFirst.mock.calls[0][0].where;
      expect(whereClause.id).toBe(1);
      expect(whereClause.status_id).toBe(5);
    });
  });

  describe('obtenirPlanningProfesseur', () => {
    it('devrait récupérer le planning d\'un professeur', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue(mockPlanningCours);

      const result = await professeursService.obtenirPlanningProfesseur(1);

      expect(result.planning).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(mockPrisma.$queryRaw.mock.calls.length).toBe(1);
    });

    it('devrait lancer une erreur si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(professeursService.obtenirPlanningProfesseur(999))
        .rejects
        .toThrow(ProfesseursError);
    });

    it('devrait retourner un planning vide si aucun cours', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await professeursService.obtenirPlanningProfesseur(1);

      expect(result.planning).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // MUTATIONS - PROFESSEURS
  // ============================================

  describe('ajouterProfesseur', () => {
    it('devrait ajouter un professeur avec succès', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateurNormal);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5
      });

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [3]
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(1);
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(1);
    });

    it('devrait ajouter plusieurs professeurs', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 3, status_id: 1 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 4, status_id: 1 });

      mockPrisma.utilisateurs.update
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 3, status_id: 5 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 4, status_id: 5 });

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [3, 4]
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(2);
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(2);
    });

    it('devrait gérer un utilisateur déjà professeur', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockProfesseur);

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [1]
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(1);
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(0);
    });

    it('devrait gérer les erreurs pour utilisateurs introuvables', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [999]
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Aucune promotion');
    });

    it('devrait accepter un tableau d\'objets {id}', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateurNormal);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5
      });

      const result = await professeursService.ajouterProfesseur({
        utilisateurs: [{ id: 3 }]
      });

      expect(result.success).toBe(true);
      expect(result.professeurs).toHaveLength(1);
    });
  });

  describe('modifierStatutProfesseur', () => {
    it('devrait modifier le statut d\'un professeur', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1
      });

      const result = await professeursService.modifierStatutProfesseur({
        id: 1,
        status_id: 1
      });

      expect(result.status_id).toBe(1);
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(1);
    });

    it('devrait lancer une erreur si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(professeursService.modifierStatutProfesseur({
        id: 999,
        status_id: 1
      })).rejects.toThrow(ProfesseursError);
    });

    it('devrait valider le nouveau statut', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      await expect(professeursService.modifierStatutProfesseur({
        id: 1,
        status_id: 99
      })).rejects.toThrow(ProfesseursError);
    });
  });

  describe('retirerPromotionProfesseur', () => {
    it('devrait retirer la promotion d\'un professeur', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1
      });

      const result = await professeursService.retirerPromotionProfesseur(1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Promotion retirée avec succès');
      expect(mockPrisma.utilisateurs.update.mock.calls.length).toBe(1);
    });

    it('devrait inclure le motif dans le message', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1
      });

      const result = await professeursService.retirerPromotionProfesseur(1, 'Départ à la retraite');

      expect(result.message).toContain('Départ à la retraite');
    });

    it('devrait lancer une erreur si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(professeursService.retirerPromotionProfesseur(999))
        .rejects
        .toThrow(ProfesseursError);
    });
  });

  // ============================================
  // STATISTIQUES
  // ============================================

  describe('statistiquesGenerales', () => {
    it('devrait récupérer les statistiques générales', async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(15);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockProfesseur,
        mockProfesseur2
      ]);

      const result = await professeursService.statistiquesGenerales();

      expect(result.totalProfesseurs).toBe(15);
      expect(result.professeursActifs).toBe(15);
      expect(mockPrisma.utilisateurs.count.mock.calls.length).toBe(1);
    });

    it('devrait calculer les moyennes correctement', async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(10);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const result = await professeursService.statistiquesGenerales();

      expect(result.moyenneCoursParProfesseur).toBeGreaterThanOrEqual(0);
      expect(result.moyenneElevesParProfesseur).toBeGreaterThanOrEqual(0);
    });
  });

  describe('statistiquesProfesseur', () => {
    it('devrait récupérer les statistiques d\'un professeur', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const result = await professeursService.statistiquesProfesseur(1);

      expect(result.professeurId).toBe(1);
      expect(result).toHaveProperty('nombreCours');
      expect(result).toHaveProperty('nombreEleves');
    });

    it('devrait lancer une erreur si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(professeursService.statistiquesProfesseur(999))
        .rejects
        .toThrow(ProfesseursError);
    });
  });

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  describe('professeurExiste', () => {
    it('devrait retourner true si le professeur existe', async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await professeursService.professeurExiste(1);

      expect(result).toBe(true);
    });

    it('devrait retourner false si le professeur n\'existe pas', async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await professeursService.professeurExiste(999);

      expect(result).toBe(false);
    });
  });

  // ============================================
  // VÉRIFICATIONS
  // ============================================

  describe('estProfesseur', () => {
    it('devrait retourner true si l\'utilisateur est professeur', async () => {
      mockPrisma.professeurs.findFirst.mockResolvedValue({
        id: 1,
        utilisateur_id: 1,
        active: true,
      });

      const result = await professeursService.estProfesseur(1);

      expect(result).toBe(true);
      expect(mockPrisma.professeurs.findFirst).toHaveBeenCalledWith({
        where: {
          utilisateur_id: 1,
          active: true,
        },
      });
    });

    it('devrait retourner false si l\'utilisateur n\'est pas professeur', async () => {
      mockPrisma.professeurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.estProfesseur(3);

      expect(result).toBe(false);
    });

    it('devrait retourner false si l\'utilisateur n\'existe pas', async () => {
      mockPrisma.professeurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.estProfesseur(999);

      expect(result).toBe(false);
    });

    it('devrait lever une erreur pour un ID négatif', async () => {
      await expect(professeursService.estProfesseur(-1)).rejects.toThrow(
        ProfesseursError,
      );
    });

    it('devrait lever une erreur pour un ID zéro', async () => {
      await expect(professeursService.estProfesseur(0)).rejects.toThrow(
        ProfesseursError,
      );
    });

    it('devrait lever une erreur pour un ID non entier', async () => {
      await expect(professeursService.estProfesseur(1.5)).rejects.toThrow(
        ProfesseursError,
      );
    });

    it('devrait retourner false pour un professeur inactif', async () => {
      mockPrisma.professeurs.findFirst.mockResolvedValue(null);

      const result = await professeursService.estProfesseur(1);

      expect(result).toBe(false);
    });
  });

  describe('compterCoursProfesseur', () => {
    it('devrait compter les cours d\'un professeur', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(3) }]);

      const result = await professeursService.compterCoursProfesseur(1);

      expect(result).toBe(3);
    });

    it('devrait retourner 0 si aucun cours', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      const result = await professeursService.compterCoursProfesseur(1);

      expect(result).toBe(0);
    });
  });

  describe('compterElevesProfesseur', () => {
    it('devrait retourner un nombre', async () => {
      const result = await professeursService.compterElevesProfesseur(1);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('obtenirTousProfesseurs', () => {
    it('devrait récupérer tous les professeurs sans pagination', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur, mockProfesseur2]);
      mockPrisma.utilisateurs.count.mockResolvedValue(2);

      const result = await professeursService.obtenirTousProfesseurs();

      expect(result).toHaveLength(2);
      const callArgs = mockPrisma.utilisateurs.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(1000);
    });
  });

  describe('rechercherProfesseurs', () => {
    it('devrait rechercher des professeurs par nom', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await professeursService.rechercherProfesseurs('Martin');

      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe('Martin');
    });

    it('devrait limiter les résultats à 50', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await professeursService.rechercherProfesseurs('test');

      const callArgs = mockPrisma.utilisateurs.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50);
    });
  });
});
