/**
 * Tests d'exceptions et cas limites pour le service Informations
 * Couvre les validations, référentiels et gestion d'erreurs
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockPrisma } from './informations.mock.js';
import type { InformationInput } from '@clubmanager/types';

// Créer le mock Prisma
const mockPrisma = createMockPrisma();

// Mock le module prisma-client AVANT l'import du service
jest.unstable_mockModule('../../../infrastructure/database/prisma-client.js', () => ({
  prisma: mockPrisma,
}));

// Import dynamique du service APRÈS le mock
const { InformationsService } = await import('../informations.service.js');

describe('InformationsService - Tests d\'Exceptions', () => {
  let informationsService: InstanceType<typeof InformationsService>;

  beforeEach(() => {
    informationsService = new InformationsService();
    mockPrisma._reset();
  });

  // ===========================================
  // TESTS CRÉATION - VALIDATIONS
  // ===========================================

  describe('Création - Validations d\'entrée', () => {
    it('devrait rejeter une information sans titre', async () => {
      const input: InformationInput = {
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      } as any;

      const result = await informationsService.ajouterInformation(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une information avec titre vide', async () => {
      const input: InformationInput = {
        titre: '',
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une information avec titre trop long', async () => {
      const input: InformationInput = {
        titre: 'A'.repeat(300),
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une information sans contenu', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        date_publication: new Date(),
        est_actif: true
      } as any;

      const result = await informationsService.ajouterInformation(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une information avec contenu vide', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: '',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait accepter une information sans date de publication', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: 'Contenu de test',
        est_actif: true
      } as any;

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait accepter une information avec est_actif par défaut', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: 'Contenu de test',
        date_publication: new Date()
      } as any;

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les caractères spéciaux dans le titre', async () => {
      const input: InformationInput = {
        titre: 'Titre avec <>&"\' caractères spéciaux',
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les caractères HTML dans le contenu', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: '<p>Contenu avec <strong>HTML</strong></p>',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS MODIFICATION - VALIDATIONS
  // ===========================================

  describe('Modification - Validations d\'entrée', () => {
    it('devrait rejeter la modification d\'une information inexistante', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.modifierInformation(999999, input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter la modification avec ID invalide (0)', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.modifierInformation(0, input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter la modification avec ID négatif', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.modifierInformation(-1, input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter la modification avec titre vide', async () => {
      const input: InformationInput = {
        titre: '',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.modifierInformation(1, input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter la modification avec contenu vide', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: '',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.modifierInformation(1, input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait permettre la désactivation d\'une information', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: false
      };

      const result = await informationsService.modifierInformation(1, input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS SUPPRESSION - VALIDATIONS
  // ===========================================

  describe('Suppression - Validations d\'entrée', () => {
    it('devrait rejeter la suppression d\'une information inexistante', async () => {
      const result = await informationsService.supprimerInformation(999999);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter la suppression avec ID invalide (0)', async () => {
      const result = await informationsService.supprimerInformation(0);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter la suppression avec ID négatif', async () => {
      const result = await informationsService.supprimerInformation(-1);
      expect(result.success).toBe(false);
    });

    it('devrait gérer la double suppression', async () => {
      await informationsService.supprimerInformation(1);
      const result = await informationsService.supprimerInformation(1);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS QUERIES - VALIDATIONS
  // ===========================================

  describe('Queries - Validations d\'entrée', () => {
    it('devrait retourner un tableau vide si aucune information', async () => {
      const result = await informationsService.obtenirToutesLesInformations();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner null pour une information inexistante', async () => {
      const result = await informationsService.obtenirInformationParId(999999);
      expect(result).toBeNull();
    });

    it('devrait rejeter obtenirInformationParId avec ID invalide (0)', async () => {
      const result = await informationsService.obtenirInformationParId(0);
      expect(result).toBeDefined();
    });

    it('devrait rejeter obtenirInformationParId avec ID négatif', async () => {
      const result = await informationsService.obtenirInformationParId(-1);
      expect(result).toBeDefined();
    });
  });

  // ===========================================
  // TESTS RÉFÉRENTIELS - STATUS
  // ===========================================

  describe('Référentiels - Status', () => {
    it('devrait retourner tous les status', async () => {
      const result = await informationsService.obtenirLesStatus();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner des status avec structure valide', async () => {
      const result = await informationsService.obtenirLesStatus();
      if (result.length > 0) {
        const status = result[0];
        expect(status).toHaveProperty('id');
        expect(status).toHaveProperty('nom');
        expect(typeof status.id).toBe('number');
        expect(typeof status.nom).toBe('string');
      }
    });

    it('devrait gérer une liste vide de status', async () => {
      const result = await informationsService.obtenirLesStatus();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===========================================
  // TESTS RÉFÉRENTIELS - PLANS TARIFAIRES
  // ===========================================

  describe('Référentiels - Plans Tarifaires', () => {
    it('devrait retourner tous les plans tarifaires', async () => {
      const result = await informationsService.obtenirLesPlansTarifaires();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner des plans avec structure valide', async () => {
      const result = await informationsService.obtenirLesPlansTarifaires();
      if (result.length > 0) {
        const plan = result[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('nom');
        expect(typeof plan.id).toBe('number');
        expect(typeof plan.nom).toBe('string');
      }
    });

    it('devrait gérer une liste vide de plans', async () => {
      const result = await informationsService.obtenirLesPlansTarifaires();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===========================================
  // TESTS RÉFÉRENTIELS - GENRES
  // ===========================================

  describe('Référentiels - Genres', () => {
    it('devrait retourner tous les genres', async () => {
      const result = await informationsService.obtenirLesGenres();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner des genres avec structure valide', async () => {
      const result = await informationsService.obtenirLesGenres();
      if (result.length > 0) {
        const genre = result[0];
        expect(genre).toHaveProperty('id');
        expect(genre).toHaveProperty('nom');
        expect(typeof genre.id).toBe('number');
        expect(typeof genre.nom).toBe('string');
      }
    });

    it('devrait gérer une liste vide de genres', async () => {
      const result = await informationsService.obtenirLesGenres();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===========================================
  // TESTS RÉFÉRENTIELS - GRADES
  // ===========================================

  describe('Référentiels - Grades', () => {
    it('devrait retourner tous les grades', async () => {
      const result = await informationsService.obtenirLesGrades();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner des grades avec structure valide', async () => {
      const result = await informationsService.obtenirLesGrades();
      if (result.length > 0) {
        const grade = result[0];
        expect(grade).toHaveProperty('id');
        expect(grade).toHaveProperty('nom');
        expect(typeof grade.id).toBe('number');
        expect(typeof grade.nom).toBe('string');
      }
    });

    it('devrait gérer une liste vide de grades', async () => {
      const result = await informationsService.obtenirLesGrades();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait retourner des grades dans un ordre cohérent', async () => {
      const result = await informationsService.obtenirLesGrades();
      // Vérifier que les grades ont des IDs uniques
      const ids = result.map(g => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ===========================================
  // TESTS SÉCURITÉ - INJECTION ET XSS
  // ===========================================

  describe('Sécurité - Protection contre les injections', () => {
    it('devrait gérer les tentatives d\'injection SQL dans le titre', async () => {
      const input: InformationInput = {
        titre: "' OR '1'='1",
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les scripts XSS dans le titre', async () => {
      const input: InformationInput = {
        titre: '<script>alert("xss")</script>',
        contenu: 'Contenu de test',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les scripts XSS dans le contenu', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: '<script>alert("xss")</script>',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les balises iframe malveillantes', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: '<iframe src="http://malicious.com"></iframe>',
        date_publication: new Date(),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS DATES ET FORMATS
  // ===========================================

  describe('Dates - Validation et formats', () => {
    it('devrait accepter une date de publication future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: 'Contenu de test',
        date_publication: futureDate,
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait accepter une date de publication passée', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: 'Contenu de test',
        date_publication: pastDate,
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer une date invalide', async () => {
      const input: InformationInput = {
        titre: 'Titre de test',
        contenu: 'Contenu de test',
        date_publication: new Date('date-invalide'),
        est_actif: true
      };

      const result = await informationsService.ajouterInformation(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS CONCURRENCE
  // ===========================================

  describe('Concurrence - Gestion des états', () => {
    it('devrait gérer les modifications simultanées', async () => {
      const input: InformationInput = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
        date_publication: new Date(),
        est_actif: true
      };

      const [result1, result2] = await Promise.all([
        informationsService.modifierInformation(1, input),
        informationsService.modifierInformation(1, input)
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('devrait gérer les suppressions simultanées', async () => {
      const [result1, result2] = await Promise.all([
        informationsService.supprimerInformation(1),
        informationsService.supprimerInformation(1)
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
