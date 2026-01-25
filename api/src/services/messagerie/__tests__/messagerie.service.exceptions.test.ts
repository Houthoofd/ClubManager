/**
 * Tests d'exceptions pour le service Messagerie
 */

import { MessagerieService } from '../messagerie.service.js';
import { MessagerieError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockUtilisateur,
  mockUtilisateur2,
  mockMessage,
  mockMessagePersonnalise,
  mockGroupe,
  resetAllMocks
} from './messagerie.mock';

describe('MessagerieService - Tests d\'Exceptions', () => {
  let messagerieService: MessagerieService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    messagerieService = new MessagerieService(mockPrisma);
  });

  afterEach(() => {
    resetAllMocks(mockPrisma);
  });

  // ============================================
  // VALIDATIONS - Messages Personnalisés
  // ============================================

  describe('Validations - Messages Personnalisés', () => {
    it('devrait rejeter un ID utilisateur invalide pour obtenirMessagesPersonnalises', async () => {
      await expect(
        messagerieService.obtenirMessagesPersonnalises(0)
      ).rejects.toThrow(MessagerieError);

      await expect(
        messagerieService.obtenirMessagesPersonnalises(-1)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter un ID message invalide pour obtenirMessagePersonnaliseParId', async () => {
      await expect(
        messagerieService.obtenirMessagePersonnaliseParId(0, 1)
      ).rejects.toThrow(MessagerieError);

      await expect(
        messagerieService.obtenirMessagePersonnaliseParId(-5, 1)
      ).rejects.toThrow('ID message invalide');
    });

    it('devrait rejeter un contenu vide pour creerMessagePersonnalise', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        messagerieService.creerMessagePersonnalise(1, '')
      ).rejects.toThrow('Le contenu du message est requis');

      await expect(
        messagerieService.creerMessagePersonnalise(1, '   ')
      ).rejects.toThrow('Le contenu du message est requis');
    });

    it('devrait rejeter un contenu trop long pour creerMessagePersonnalise', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      const longContenu = 'a'.repeat(10001);

      await expect(
        messagerieService.creerMessagePersonnalise(1, longContenu)
      ).rejects.toThrow('Le contenu du message est trop long');
    });

    it('devrait rejeter si utilisateur inexistant pour creerMessagePersonnalise', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        messagerieService.creerMessagePersonnalise(999, 'Test')
      ).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait rejeter marquerMessagePersonnaliseLu avec IDs invalides', async () => {
      await expect(
        messagerieService.marquerMessagePersonnaliseLu({
          messageId: 0,
          userId: 1
        })
      ).rejects.toThrow('ID message invalide');

      await expect(
        messagerieService.marquerMessagePersonnaliseLu({
          messageId: 1,
          userId: -1
        })
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter marquerMessagePersonnaliseLu si message inexistant', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.marquerMessagePersonnaliseLu({
          messageId: 999,
          userId: 1
        })
      ).rejects.toThrow('Message non trouvé');
    });

    it('devrait rejeter supprimerMessagePersonnalise avec IDs invalides', async () => {
      await expect(
        messagerieService.supprimerMessagePersonnalise(0, 1)
      ).rejects.toThrow('ID message invalide');

      await expect(
        messagerieService.supprimerMessagePersonnalise(1, 0)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter supprimerMessagePersonnalise si message inexistant', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.supprimerMessagePersonnalise(999, 1)
      ).rejects.toThrow('Message non trouvé');
    });

    it('devrait rejeter nettoyerAnciennesMessages avec nombre de jours invalide', async () => {
      await expect(
        messagerieService.nettoyerAnciennesMessages(0)
      ).rejects.toThrow('Nombre de jours invalide');

      await expect(
        messagerieService.nettoyerAnciennesMessages(-30)
      ).rejects.toThrow('Nombre de jours invalide');
    });
  });

  // ============================================
  // VALIDATIONS - Messages Standards
  // ============================================

  describe('Validations - Messages Standards', () => {
    it('devrait rejeter envoyerMessageUtilisateur avec IDs invalides', async () => {
      await expect(
        messagerieService.envoyerMessageUtilisateur(0, 1, 'Test')
      ).rejects.toThrow('ID expéditeur invalide');

      await expect(
        messagerieService.envoyerMessageUtilisateur(1, -1, 'Test')
      ).rejects.toThrow('ID destinataire invalide');
    });

    it('devrait rejeter envoyerMessageUtilisateur avec contenu vide', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        messagerieService.envoyerMessageUtilisateur(1, 2, '')
      ).rejects.toThrow('Le contenu du message est requis');

      await expect(
        messagerieService.envoyerMessageUtilisateur(1, 2, '   ')
      ).rejects.toThrow('Le contenu du message est requis');
    });

    it('devrait rejeter envoyerMessageUtilisateur avec contenu trop long', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      const longContenu = 'x'.repeat(10001);

      await expect(
        messagerieService.envoyerMessageUtilisateur(1, 2, longContenu)
      ).rejects.toThrow('Le contenu du message est trop long');
    });

    it('devrait rejeter envoyerMessageUtilisateur si sender = receiver', async () => {
      await expect(
        messagerieService.envoyerMessageUtilisateur(1, 1, 'Test')
      ).rejects.toThrow('Impossible de s\'envoyer un message à soi-même');
    });

    it('devrait rejeter envoyerMessageUtilisateur si expéditeur inexistant', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUtilisateur2);

      await expect(
        messagerieService.envoyerMessageUtilisateur(999, 2, 'Test')
      ).rejects.toThrow('Expéditeur non trouvé');
    });

    it('devrait rejeter envoyerMessageUtilisateur si destinataire inexistant', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockUtilisateur)
        .mockResolvedValueOnce(null);

      await expect(
        messagerieService.envoyerMessageUtilisateur(1, 999, 'Test')
      ).rejects.toThrow('Destinataire non trouvé');
    });

    it('devrait rejeter envoyerMessageGroupe avec IDs invalides', async () => {
      await expect(
        messagerieService.envoyerMessageGroupe(0, 1, 'Test')
      ).rejects.toThrow('ID expéditeur invalide');

      await expect(
        messagerieService.envoyerMessageGroupe(1, -1, 'Test')
      ).rejects.toThrow('ID groupe invalide');
    });

    it('devrait rejeter envoyerMessageGroupe si utilisateur non membre', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.envoyerMessageGroupe(1, 1, 'Test')
      ).rejects.toThrow('Utilisateur non membre du groupe');
    });

    it('devrait rejeter envoyerMessageGroupe si groupe sans membres', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue({
        groupe_id: 1,
        utilisateur_id: 1
      });
      mockPrisma.groupes_utilisateurs.findMany.mockResolvedValue([]);

      await expect(
        messagerieService.envoyerMessageGroupe(1, 1, 'Test')
      ).rejects.toThrow('Aucun destinataire dans le groupe');
    });

    it('devrait rejeter obtenirMessagesGroupe si utilisateur non membre', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.obtenirMessagesGroupe(1, 999)
      ).rejects.toThrow('Utilisateur non membre du groupe');
    });

    it('devrait rejeter obtenirMessagesGroupe avec IDs invalides', async () => {
      await expect(
        messagerieService.obtenirMessagesGroupe(0, 1)
      ).rejects.toThrow('ID groupe invalide');

      await expect(
        messagerieService.obtenirMessagesGroupe(1, -1)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter supprimerMessage avec IDs invalides', async () => {
      await expect(
        messagerieService.supprimerMessage(0, 1)
      ).rejects.toThrow('ID message invalide');

      await expect(
        messagerieService.supprimerMessage(1, 0)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter supprimerMessage si message inexistant', async () => {
      mockPrisma.messages.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.supprimerMessage(999, 1)
      ).rejects.toThrow('Message non trouvé ou non autorisé');
    });
  });

  // ============================================
  // VALIDATIONS - Statuts de Messages
  // ============================================

  describe('Validations - Statuts de Messages', () => {
    it('devrait rejeter marquerMessageVu avec IDs invalides', async () => {
      await expect(
        messagerieService.marquerMessageVu(0, 1)
      ).rejects.toThrow('ID message invalide');

      await expect(
        messagerieService.marquerMessageVu(1, -1)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter marquerMessageVu si message inexistant', async () => {
      mockPrisma.messages.findUnique.mockResolvedValue(null);

      await expect(
        messagerieService.marquerMessageVu(999, 1)
      ).rejects.toThrow('Message non trouvé');
    });

    it('devrait rejeter obtenirStatutMessage avec IDs invalides', async () => {
      await expect(
        messagerieService.obtenirStatutMessage(0, 1)
      ).rejects.toThrow('ID message invalide');

      await expect(
        messagerieService.obtenirStatutMessage(1, 0)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter compterMessagesNonVus avec ID invalide', async () => {
      await expect(
        messagerieService.compterMessagesNonVus(0)
      ).rejects.toThrow('ID utilisateur invalide');

      await expect(
        messagerieService.compterMessagesNonVus(-5)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait rejeter marquerTousMessagesVus avec ID invalide', async () => {
      await expect(
        messagerieService.marquerTousMessagesVus(0)
      ).rejects.toThrow('ID utilisateur invalide');
    });
  });

  // ============================================
  // VALIDATIONS - Envoi en Masse
  // ============================================

  describe('Validations - Envoi en Masse', () => {
    it('devrait rejeter envoyerMessageMultipleAvecContenu avec ID expéditeur invalide', async () => {
      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(0, [1], 'Test')
      ).rejects.toThrow('ID expéditeur invalide');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu sans destinataires', async () => {
      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [], 'Test')
      ).rejects.toThrow('Au moins un destinataire est requis');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu avec contenu vide', async () => {
      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [2], '')
      ).rejects.toThrow('Le contenu du message est requis');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu avec contenu trop long', async () => {
      const longContenu = 'y'.repeat(10001);

      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [2], longContenu)
      ).rejects.toThrow('Le contenu du message est trop long');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu avec doublons', async () => {
      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [2, 2, 3], 'Test')
      ).rejects.toThrow('Liste de destinataires contient des doublons');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu si expéditeur dans destinataires', async () => {
      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [1, 2], 'Test')
      ).rejects.toThrow('L\'expéditeur ne peut pas être destinataire');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu si expéditeur inexistant', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(999, [2], 'Test')
      ).rejects.toThrow('Expéditeur non trouvé');
    });

    it('devrait rejeter envoyerMessageMultipleAvecContenu si destinataires invalides', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      await expect(
        messagerieService.envoyerMessageMultipleAvecContenu(1, [999], 'Test')
      ).rejects.toThrow('Certains destinataires n\'existent pas');
    });

    it('devrait rejeter envoyerMessagePersonnalise avec ID destinataire invalide', async () => {
      await expect(
        messagerieService.envoyerMessagePersonnalise({
          destinataireId: 0,
          contenu: 'Test'
        })
      ).rejects.toThrow('ID destinataire invalide');
    });

    it('devrait rejeter envoyerMessagePersonnalise avec contenu vide', async () => {
      await expect(
        messagerieService.envoyerMessagePersonnalise({
          destinataireId: 1,
          contenu: ''
        })
      ).rejects.toThrow('Le contenu du message est requis');
    });

    it('devrait rejeter envoyerMessagePersonnalise si destinataire inexistant', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        messagerieService.envoyerMessagePersonnalise({
          destinataireId: 999,
          contenu: 'Test'
        })
      ).rejects.toThrow('Destinataire non trouvé');
    });

    it('devrait rejeter envoyerMessagePersonnalise si expéditeur inexistant', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockUtilisateur2) // destinataire
        .mockResolvedValueOnce(null); // expéditeur

      await expect(
        messagerieService.envoyerMessagePersonnalise({
          destinataireId: 2,
          contenu: 'Test',
          expediteurId: 999
        })
      ).rejects.toThrow('Expéditeur non trouvé');
    });

    it('devrait rejeter envoyerMessageGroupes avec ID expéditeur invalide', async () => {
      await expect(
        messagerieService.envoyerMessageGroupes(0, [1], 'Test')
      ).rejects.toThrow('ID expéditeur invalide');
    });

    it('devrait rejeter envoyerMessageGroupes sans groupes', async () => {
      await expect(
        messagerieService.envoyerMessageGroupes(1, [], 'Test')
      ).rejects.toThrow('Au moins un groupe est requis');
    });

    it('devrait rejeter envoyerMessageGroupes avec contenu vide', async () => {
      await expect(
        messagerieService.envoyerMessageGroupes(1, [1], '')
      ).rejects.toThrow('Le contenu du message est requis');
    });
  });

  // ============================================
  // VALIDATIONS - Statistiques
  // ============================================

  describe('Validations - Statistiques', () => {
    it('devrait rejeter obtenirStatistiquesUtilisateur avec ID invalide', async () => {
      await expect(
        messagerieService.obtenirStatistiquesUtilisateur(0)
      ).rejects.toThrow('ID utilisateur invalide');

      await expect(
        messagerieService.obtenirStatistiquesUtilisateur(-1)
      ).rejects.toThrow('ID utilisateur invalide');
    });
  });

  // ============================================
  // GESTION DES ERREURS PRISMA
  // ============================================

  describe('Gestion des Erreurs Prisma', () => {
    it('devrait gérer l\'erreur P2025 (enregistrement non trouvé)', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(mockMessagePersonnalise);
      mockPrisma.messages_personnalises.update.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found'
      });

      await expect(
        messagerieService.marquerMessagePersonnaliseLu({
          messageId: 1,
          userId: 1
        })
      ).rejects.toThrow('Message non trouvé');
    });

    it('devrait gérer l\'erreur P2003 (contrainte de clé étrangère)', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.messages_personnalises.create.mockRejectedValue({
        code: 'P2003',
        message: 'Foreign key constraint failed'
      });

      await expect(
        messagerieService.creerMessagePersonnalise(999, 'Test')
      ).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait gérer les erreurs génériques de Prisma', async () => {
      mockPrisma.messages_personnalises.findMany.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(
        messagerieService.obtenirMessagesPersonnalises(1)
      ).rejects.toThrow('Erreur lors de la récupération des messages');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('devrait gérer correctement un message avec contenu null/undefined', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        messagerieService.creerMessagePersonnalise(1, null as any)
      ).rejects.toThrow('Le contenu du message est requis');

      await expect(
        messagerieService.creerMessagePersonnalise(1, undefined as any)
      ).rejects.toThrow('Le contenu du message est requis');
    });

    it('devrait trim le contenu du message', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.messages_personnalises.create.mockResolvedValue(mockMessagePersonnalise);

      const result = await messagerieService.creerMessagePersonnalise(1, '  Test  ');

      // Vérifier que le message a été créé avec succès
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockMessagePersonnalise.id);
      
      // Vérifier que create a été appelé (le trim est fait dans la fonction)
      expect(mockPrisma.messages_personnalises.create.mock.calls.length).toBe(1);
      const createCallArgs = mockPrisma.messages_personnalises.create.mock.calls[0][0];
      expect(createCallArgs.data.contenu).toBe('Test');
    });

    it('devrait gérer une liste vide de messages', async () => {
      mockPrisma.messages_personnalises.findMany.mockResolvedValue([]);

      const result = await messagerieService.obtenirMessagesPersonnalises(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('devrait gérer correctement les IDs négatifs', async () => {
      await expect(
        messagerieService.obtenirMessagesPersonnalises(-999)
      ).rejects.toThrow('ID utilisateur invalide');
    });

    it('devrait gérer les valeurs limites de contenu', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      const contenuExact10000 = 'z'.repeat(10000);
      mockPrisma.messages_personnalises.create.mockResolvedValue(mockMessagePersonnalise);

      // 10000 caractères devrait passer
      await expect(
        messagerieService.creerMessagePersonnalise(1, contenuExact10000)
      ).resolves.toBeDefined();

      // 10001 caractères devrait échouer
      const contenu10001 = 'z'.repeat(10001);
      await expect(
        messagerieService.creerMessagePersonnalise(1, contenu10001)
      ).rejects.toThrow('Le contenu du message est trop long');
    });
  });

  // ============================================
  // SÉCURITÉ
  // ============================================

  describe('Sécurité', () => {
    it('ne devrait pas permettre de lire un message d\'un autre utilisateur', async () => {
      const autreUserMessage = { ...mockMessagePersonnalise, utilisateur_id: 5 };
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(null);

      const result = await messagerieService.obtenirMessagePersonnaliseParId(1, 999);

      expect(result).toBeNull();
    });

    it('ne devrait pas permettre de supprimer un message d\'un autre utilisateur', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.supprimerMessagePersonnalise(1, 999)
      ).rejects.toThrow('Message non trouvé');
    });

    it('ne devrait pas permettre de supprimer un message d\'un autre expéditeur', async () => {
      const messageAutreExpéditeur = { ...mockMessage, sender_id: 5 };
      mockPrisma.messages.findFirst.mockResolvedValue(null);

      await expect(
        messagerieService.supprimerMessage(1, 999)
      ).rejects.toThrow('Message non trouvé ou non autorisé');
    });
  });
});
