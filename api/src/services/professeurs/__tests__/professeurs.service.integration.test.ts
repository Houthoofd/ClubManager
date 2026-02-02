/**
 * Tests d'intégration pour le service Professeurs
 * Teste les flux complets et interactions entre méthodes
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
  mockStatistiquesProfesseur
} from './professeurs.mock.js';

describe('ProfesseursService - Tests d\'Intégration', () => {
  let professeursService: ProfesseursService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    professeursService = new ProfesseursService(mockPrisma);
  });

  afterEach(() => {
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) => fn.mockReset?.());
    mockPrisma.$queryRaw?.mockReset?.();
  });

  // ============================================
  // FLUX COMPLET - PROMOTION D'UTILISATEUR
  // ============================================

  describe('Flux: Promotion d\'un utilisateur en professeur', () => {
    it('devrait promouvoir un utilisateur puis récupérer ses informations', async () => {
      // Étape 1: Vérifier que l'utilisateur n'est pas professeur
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateurNormal);

      let estProf = await professeursService.estProfesseur(3);
      expect(estProf).toBe(false);

      // Étape 2: Promouvoir l'utilisateur en professeur
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateurNormal);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5
      });

      const resultatAjout = await professeursService.ajouterProfesseur({
        utilisateurs: [3]
      });

      expect(resultatAjout.success).toBe(true);
      expect(resultatAjout.professeurs).toHaveLength(1);

      // Étape 3: Vérifier que l'utilisateur est maintenant professeur
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5
      });

      estProf = await professeursService.estProfesseur(3);
      expect(estProf).toBe(true);

      // Étape 4: Récupérer le professeur par ID
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateurNormal,
        status_id: 5
      });

      const professeur = await professeursService.obtenirProfesseurParId(3);
      expect(professeur).toBeDefined();
      expect(professeur?.status_id).toBe(5);
    });

    it('devrait promouvoir plusieurs utilisateurs en batch', async () => {
      // Préparer les utilisateurs
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 3 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 4 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 5 });

      mockPrisma.utilisateurs.update
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 3, status_id: 5 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 4, status_id: 5 })
        .mockResolvedValueOnce({ ...mockUtilisateurNormal, id: 5, status_id: 5 });

      // Promouvoir en batch
      const resultat = await professeursService.ajouterProfesseur({
        utilisateurs: [3, 4, 5]
      });

      expect(resultat.success).toBe(true);
      expect(resultat.professeurs).toHaveLength(3);

      // Vérifier qu'ils apparaissent dans la liste
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { ...mockUtilisateurNormal, id: 3, status_id: 5 },
        { ...mockUtilisateurNormal, id: 4, status_id: 5 },
        { ...mockUtilisateurNormal, id: 5, status_id: 5 }
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(3);

      const liste = await professeursService.obtenirProfesseurs({});
      expect(liste.professeurs.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================
  // FLUX COMPLET - GESTION DU PLANNING
  // ============================================

  describe('Flux: Gestion du planning d\'un professeur', () => {
    it('devrait récupérer un professeur et son planning', async () => {
      // Étape 1: Récupérer le professeur
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const professeur = await professeursService.obtenirProfesseurParId(1);
      expect(professeur).toBeDefined();

      // Étape 2: Récupérer son planning
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.$queryRaw.mockResolvedValue(mockPlanningCours);

      const planning = await professeursService.obtenirPlanningProfesseur(1);
      expect(planning.planning).toHaveLength(3);
      expect(planning.total).toBe(3);

      // Étape 3: Compter les cours
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(3) }]);

      const nombreCours = await professeursService.compterCoursProfesseur(1);
      expect(nombreCours).toBe(3);
    });

    it('devrait gérer un professeur sans cours', async () => {
      // Nouveau professeur sans cours assignés
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur2);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const planning = await professeursService.obtenirPlanningProfesseur(2);
      expect(planning.planning).toHaveLength(0);
      expect(planning.total).toBe(0);

      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      const nombreCours = await professeursService.compterCoursProfesseur(2);
      expect(nombreCours).toBe(0);
    });
  });

  // ============================================
  // FLUX COMPLET - MODIFICATION DE STATUT
  // ============================================

  describe('Flux: Modification du statut d\'un professeur', () => {
    it('devrait modifier le statut puis le retirer complètement', async () => {
      // Étape 1: Vérifier le professeur existe
      mockPrisma.utilisateurs.count.mockResolvedValue(1);
      const existe = await professeursService.professeurExiste(1);
      expect(existe).toBe(true);

      // Étape 2: Modifier le statut
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 3
      });

      const profModifie = await professeursService.modifierStatutProfesseur({
        id: 1,
        status_id: 3
      });

      expect(profModifie.status_id).toBe(3);

      // Étape 3: Retirer la promotion (status_id = 1)
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockProfesseur,
        status_id: 3
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...mockProfesseur,
        status_id: 1
      });

      const resultat = await professeursService.retirerPromotionProfesseur(1, 'Fin de contrat');
      expect(resultat.success).toBe(true);
      expect(resultat.message).toContain('Fin de contrat');

      // Étape 4: Vérifier qu'il n'est plus professeur
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      const existeEncore = await professeursService.professeurExiste(1);
      expect(existeEncore).toBe(false);
    });
  });

  // ============================================
  // FLUX COMPLET - RECHERCHE ET FILTRAGE
  // ============================================

  describe('Flux: Recherche et filtrage de professeurs', () => {
    it('devrait rechercher puis filtrer les professeurs', async () => {
      // Étape 1: Recherche générale
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur, mockProfesseur2]);
      mockPrisma.utilisateurs.count.mockResolvedValue(2);

      let professeurs = await professeursService.rechercherProfesseurs('');
      expect(professeurs.length).toBeGreaterThanOrEqual(2);

      // Étape 2: Filtrer par nom
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      professeurs = await professeursService.rechercherProfesseurs('Martin');
      expect(professeurs).toHaveLength(1);
      expect(professeurs[0].nom).toBe('Martin');

      // Étape 3: Filtrer par grade
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const resultat = await professeursService.obtenirProfesseurs({ grade_id: 5 });
      expect(resultat.professeurs).toHaveLength(1);
      expect(resultat.professeurs[0].grade_id).toBe(5);

      // Étape 4: Filtrer par genre
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockProfesseur]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const resultatGenre = await professeursService.obtenirProfesseurs({ genre_id: 2 });
      expect(resultatGenre.professeurs).toHaveLength(1);
      expect(resultatGenre.professeurs[0].genre_id).toBe(2);
    });
  });

  // ============================================
  // FLUX COMPLET - STATISTIQUES
  // ============================================

  describe('Flux: Consultation des statistiques', () => {
    it('devrait calculer les statistiques globales puis individuelles', async () => {
      // Étape 1: Statistiques générales
      mockPrisma.utilisateurs.count.mockResolvedValue(15);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockProfesseur,
        mockProfesseur2
      ]);

      const statsGenerales = await professeursService.statistiquesGenerales();
      expect(statsGenerales.totalProfesseurs).toBe(15);
      expect(statsGenerales.professeursActifs).toBe(15);

      // Étape 2: Statistiques d'un professeur spécifique
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockProfesseur);

      const statsProfesseur = await professeursService.statistiquesProfesseur(1);
      expect(statsProfesseur.professeurId).toBe(1);
      expect(statsProfesseur).toHaveProperty('nombreCours');
      expect(statsProfesseur).toHaveProperty('nombreEleves');

      // Étape 3: Compter les cours et élèves
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(3) }]);
      const cours = await professeursService.compterCoursProfesseur(1);
      expect(cours).toBeGreaterThanOrEqual(0);

      const eleves = await professeursService.compterElevesProfesseur(1);
      expect(eleves).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // FLUX COMPLET - GESTION D'ERREURS
  // ============================================

  describe('Flux: Gestion des erreurs en cascade', () => {
    it('devrait gérer les erreurs lors de la promotion', async () => {
      // Utilisateur inexistant
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const resultat = await professeursService.ajouterProfesseur({
        utilisateurs: [999]
      });

      expect(resultat.success).toBe(false);
      expect(resultat.message).toContain('Aucune promotion');
    });

    it('devrait rejeter la modification d\'un professeur inexistant', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.modifierStatutProfesseur({ id: 999, status_id: 1 })
      ).rejects.toThrow(ProfesseursError);
    });

    it('devrait rejeter la suppression d\'un professeur inexistant', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.retirerPromotionProfesseur(999)
      ).rejects.toThrow(ProfesseursError);
    });

    it('devrait rejeter l\'accès au planning d\'un professeur inexistant', async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        professeursService.obtenirPlanningProfesseur(999)
      ).rejects.toThrow(ProfesseursError);
    });
  });

  // ============================================
  // FLUX COMPLET - PAGINATION
  // ============================================

  describe('Flux: Navigation paginée dans la liste', () => {
    it('devrait naviguer entre les pages de professeurs', async () => {
      const tousProfesseurs = Array.from({ length: 100 }, (_, i) => ({
        ...mockProfesseur,
        id: i + 1,
        nom: `Professeur${i + 1}`
      }));

      // Page 1
      mockPrisma.utilisateurs.findMany.mockResolvedValue(tousProfesseurs.slice(0, 20));
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const page1 = await professeursService.obtenirProfesseurs({ limit: 20, offset: 0 });
      expect(page1.professeurs).toHaveLength(20);
      expect(page1.hasMore).toBe(true);
      expect(page1.total).toBe(100);

      // Page 2
      mockPrisma.utilisateurs.findMany.mockResolvedValue(tousProfesseurs.slice(20, 40));
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const page2 = await professeursService.obtenirProfesseurs({ limit: 20, offset: 20 });
      expect(page2.professeurs).toHaveLength(20);
      expect(page2.hasMore).toBe(true);

      // Dernière page
      mockPrisma.utilisateurs.findMany.mockResolvedValue(tousProfesseurs.slice(80, 100));
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const dernierePage = await professeursService.obtenirProfesseurs({ limit: 20, offset: 80 });
      expect(dernierePage.professeurs).toHaveLength(20);
      expect(dernierePage.hasMore).toBe(false);
    });
  });

  // ============================================
  // FLUX COMPLET - SCÉNARIO RÉALISTE
  // ============================================

  describe('Scénario réaliste: Cycle de vie complet d\'un professeur', () => {
    it('devrait gérer le cycle de vie complet', async () => {
      // 1. L'utilisateur s'inscrit (status_id = 1)
      const utilisateur = { ...mockUtilisateurNormal, id: 10 };

      // 2. L'admin le promout professeur
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(utilisateur);
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...utilisateur,
        status_id: 5
      });

      const ajout = await professeursService.ajouterProfesseur({
        utilisateurs: [10]
      });
      expect(ajout.success).toBe(true);

      // 3. On vérifie qu'il est bien professeur
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...utilisateur,
        status_id: 5
      });
      const estProf = await professeursService.estProfesseur(10);
      expect(estProf).toBe(true);

      // 4. On lui assigne des cours (via le planning)
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...utilisateur,
        status_id: 5
      });
      mockPrisma.$queryRaw.mockResolvedValue(mockPlanningCours);

      const planning = await professeursService.obtenirPlanningProfesseur(10);
      expect(planning.planning).toHaveLength(3);

      // 5. On consulte ses statistiques
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...utilisateur,
        status_id: 5
      });
      const stats = await professeursService.statistiquesProfesseur(10);
      expect(stats.professeurId).toBe(10);

      // 6. Le professeur prend sa retraite
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...utilisateur,
        status_id: 5
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({
        ...utilisateur,
        status_id: 1
      });

      const retrait = await professeursService.retirerPromotionProfesseur(
        10,
        'Départ à la retraite'
      );
      expect(retrait.success).toBe(true);
      expect(retrait.message).toContain('retraite');

      // 7. Vérification finale
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      const existeEncore = await professeursService.professeurExiste(10);
      expect(existeEncore).toBe(false);
    });
  });
});
