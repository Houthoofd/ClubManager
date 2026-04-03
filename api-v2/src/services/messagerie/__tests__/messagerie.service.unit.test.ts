/**
 * Tests unitaires pour le service Messagerie
 */

import { MessagerieService } from '../messagerie.service';
import {
  createMockPrisma,
  mockUtilisateur,
  mockUtilisateur2,
  mockMessage,
  mockMessagePersonnalise,
  mockGroupe,
  mockMessageStatus,
  mockStatistiques,
  resetAllMocks,
  setupDefaultMocks
} from './messagerie.mock';

describe('MessagerieService - Tests Unitaires', () => {
  let messagerieService: MessagerieService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    messagerieService = new MessagerieService(mockPrisma);
    setupDefaultMocks(mockPrisma);
  });

  afterEach(() => {
    resetAllMocks(mockPrisma);
  });

  // ============================================
  // MESSAGES PERSONNALISÉS - QUERIES
  // ============================================

  describe('obtenirMessagesPersonnalises', () => {
    it('devrait récupérer les messages personnalisés d\'un utilisateur', async () => {
      mockPrisma.messages_personnalises.findMany.mockResolvedValue([mockMessagePersonnalise]);

      const result = await messagerieService.obtenirMessagesPersonnalises(1);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Message personnalisé');
      
      // Vérifier que findMany a été appelé avec les bons paramètres
      expect(mockPrisma.messages_personnalises.findMany.mock.calls.length).toBe(1);
      const callArgs = mockPrisma.messages_personnalises.findMany.mock.calls[0][0];
      expect(callArgs.where.utilisateur_id).toBe(1);
      expect(callArgs.where.is_active).toBe(true);
      expect(callArgs.where.deleted_at).toBe(null);
    });

    it('devrait retourner un tableau vide si aucun message', async () => {
      mockPrisma.messages_personnalises.findMany.mockResolvedValue([]);

      const result = await messagerieService.obtenirMessagesPersonnalises(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('obtenirMessagePersonnaliseParId', () => {
    it('devrait récupérer un message personnalisé par son ID', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(mockMessagePersonnalise);

      const result = await messagerieService.obtenirMessagePersonnaliseParId(1, 2);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.content).toBe('Message personnalisé');
    });

    it('devrait retourner null si le message n\'existe pas', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(null);

      const result = await messagerieService.obtenirMessagePersonnaliseParId(999, 1);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // MESSAGES PERSONNALISÉS - MUTATIONS
  // ============================================

  describe('marquerMessagePersonnaliseLu', () => {
    it('devrait marquer un message comme lu', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(mockMessagePersonnalise);
      mockPrisma.messages_personnalises.update.mockResolvedValue({
        ...mockMessagePersonnalise,
        lu: true
      });

      const result = await messagerieService.marquerMessagePersonnaliseLu({
        messageId: 1,
        userId: 2
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.messages_personnalises.update.mock.calls.length).toBe(1);
    });
  });

  describe('creerMessagePersonnalise', () => {
    it('devrait créer un nouveau message personnalisé', async () => {
      mockPrisma.messages_personnalises.create.mockResolvedValue({
        ...mockMessagePersonnalise,
        id: 10
      });

      const result = await messagerieService.creerMessagePersonnalise(
        1,
        'Nouveau message'
      );

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(10);
    });
  });

  describe('supprimerMessagePersonnalise', () => {
    it('devrait supprimer un message personnalisé', async () => {
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(mockMessagePersonnalise);
      mockPrisma.messages_personnalises.update.mockResolvedValue({
        ...mockMessagePersonnalise,
        is_active: false,
        deleted_at: new Date()
      });

      const result = await messagerieService.supprimerMessagePersonnalise(1, 2);

      expect(result.success).toBe(true);
    });
  });

  describe('nettoyerAnciennesMessages', () => {
    it('devrait supprimer les anciens messages', async () => {
      mockPrisma.messages_personnalises.deleteMany.mockResolvedValue({ count: 5 });

      const result = await messagerieService.nettoyerAnciennesMessages(90);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
    });
  });

  // ============================================
  // MESSAGES STANDARDS - QUERIES
  // ============================================

  describe('obtenirMessagesUtilisateur', () => {
    it('devrait récupérer les messages d\'un utilisateur', async () => {
      mockPrisma.messages.findMany.mockResolvedValue([mockMessage]);

      const result = await messagerieService.obtenirMessagesUtilisateur(2);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Bonjour');
    });
  });

  describe('obtenirMessageParId', () => {
    it('devrait récupérer un message par son ID', async () => {
      mockPrisma.messages.findFirst.mockResolvedValue(mockMessage);

      const result = await messagerieService.obtenirMessageParId(1, 2);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });
  });

  describe('obtenirMessagesGroupe', () => {
    it('devrait récupérer les messages d\'un groupe', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue({
        groupe_id: 1,
        utilisateur_id: 1
      });
      mockPrisma.messages.findMany.mockResolvedValue([mockMessage]);

      const result = await messagerieService.obtenirMessagesGroupe(1, 1);

      expect(result).toHaveLength(1);
    });
  });

  describe('obtenirTousMessages', () => {
    it('devrait récupérer tous les messages (standards + personnalisés)', async () => {
      mockPrisma.messages.findMany.mockResolvedValue([mockMessage]);
      mockPrisma.messages_personnalises.findMany.mockResolvedValue([mockMessagePersonnalise]);

      const result = await messagerieService.obtenirTousMessages(2);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // MESSAGES STANDARDS - MUTATIONS
  // ============================================

  describe('envoyerMessageUtilisateur', () => {
    it('devrait envoyer un message à un utilisateur', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockUtilisateur)
        .mockResolvedValueOnce(mockUtilisateur2);
      mockPrisma.messages.create.mockResolvedValue({ ...mockMessage, id: 10 });
      mockPrisma.message_status.create.mockResolvedValue(mockMessageStatus);

      const result = await messagerieService.envoyerMessageUtilisateur(1, 2, 'Test');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(10);
    });
  });

  describe('envoyerMessageGroupe', () => {
    it('devrait envoyer un message à un groupe', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue({
        groupe_id: 1,
        utilisateur_id: 1
      });
      mockPrisma.groupes_utilisateurs.findMany.mockResolvedValue([
        { utilisateur_id: 2 },
        { utilisateur_id: 3 }
      ]);
      mockPrisma.messages.create.mockResolvedValue({ ...mockMessage, id: 20 });
      mockPrisma.message_status.createMany.mockResolvedValue({ count: 2 });

      const result = await messagerieService.envoyerMessageGroupe(1, 1, 'Message groupe');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(20);
    });
  });

  describe('supprimerMessage', () => {
    it('devrait supprimer un message', async () => {
      mockPrisma.messages.findFirst.mockResolvedValue(mockMessage);
      mockPrisma.messages.delete.mockResolvedValue(mockMessage);

      const result = await messagerieService.supprimerMessage(1, 1);

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // STATUTS DE MESSAGES
  // ============================================

  describe('marquerMessageVu', () => {
    it('devrait marquer un message comme vu', async () => {
      mockPrisma.messages.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.message_status.upsert.mockResolvedValue({
        ...mockMessageStatus,
        status: 'vu'
      });

      const result = await messagerieService.marquerMessageVu(1, 2);

      expect(result.success).toBe(true);
    });
  });

  describe('obtenirStatutMessage', () => {
    it('devrait retourner le statut d\'un message', async () => {
      mockPrisma.message_status.findUnique.mockResolvedValue({
        ...mockMessageStatus,
        status: 'vu'
      });

      const result = await messagerieService.obtenirStatutMessage(1, 2);

      expect(result).toBe('vu');
    });

    it('devrait retourner non_vu si aucun statut', async () => {
      mockPrisma.message_status.findUnique.mockResolvedValue(null);

      const result = await messagerieService.obtenirStatutMessage(1, 2);

      expect(result).toBe('non_vu');
    });
  });

  describe('compterMessagesNonVus', () => {
    it('devrait compter les messages non vus', async () => {
      mockPrisma.message_status.count.mockResolvedValue(3);
      mockPrisma.messages_personnalises.count.mockResolvedValue(2);

      const result = await messagerieService.compterMessagesNonVus(1);

      expect(result).toBe(5);
    });
  });

  describe('marquerTousMessagesVus', () => {
    it('devrait marquer tous les messages comme vus', async () => {
      mockPrisma.message_status.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.messages_personnalises.updateMany.mockResolvedValue({ count: 2 });

      const result = await messagerieService.marquerTousMessagesVus(1);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
    });
  });

  // ============================================
  // ENVOI EN MASSE
  // ============================================

  describe('envoyerMessageMultipleAvecContenu', () => {
    it('devrait envoyer un message à plusieurs destinataires', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockUtilisateur2]);
      mockPrisma.messages.create.mockResolvedValue(mockMessage);
      mockPrisma.message_status.create.mockResolvedValue(mockMessageStatus);

      const result = await messagerieService.envoyerMessageMultipleAvecContenu(
        1,
        [2],
        'Message multiple'
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe('envoyerMessagePersonnalise', () => {
    it('devrait envoyer un message personnalisé', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur2);
      mockPrisma.messages_personnalises.create.mockResolvedValue(mockMessagePersonnalise);

      const result = await messagerieService.envoyerMessagePersonnalise({
        destinataireId: 2,
        contenu: 'Message perso',
        expediteurId: 1
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe('envoyerMessageGroupes', () => {
    it('devrait envoyer un message à plusieurs groupes', async () => {
      mockPrisma.groupes.findUnique.mockResolvedValue(mockGroupe);
      mockPrisma.messages.create.mockResolvedValue(mockMessage);
      mockPrisma.groupes_utilisateurs.findMany.mockResolvedValue([
        { utilisateur_id: 2 },
        { utilisateur_id: 3 }
      ]);
      mockPrisma.message_status.createMany.mockResolvedValue({ count: 2 });

      const result = await messagerieService.envoyerMessageGroupes(1, [1], 'Test');

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });
  });

  // ============================================
  // STATISTIQUES
  // ============================================

  describe('obtenirStatistiquesGenerales', () => {
    it('devrait récupérer les statistiques générales', async () => {
      mockPrisma.messages.count.mockResolvedValue(5);
      mockPrisma.messages_personnalises.count.mockResolvedValue(3);
      mockPrisma.$queryRaw.mockResolvedValue([
        { date: new Date('2024-01-15'), count: BigInt(5) }
      ]);

      const result = await messagerieService.obtenirStatistiquesGenerales();

      expect(result.totalMessagesEnvoyes).toBe(8);
      expect(result.messagesParJour).toHaveLength(1);
    });
  });

  describe('obtenirStatistiquesUtilisateur', () => {
    it('devrait récupérer les statistiques d\'un utilisateur', async () => {
      mockPrisma.messages.count
        .mockResolvedValueOnce(3) // envoyés
        .mockResolvedValueOnce(2); // reçus
      mockPrisma.messages_personnalises.count
        .mockResolvedValueOnce(1) // personnalisés
        .mockResolvedValueOnce(0); // non lus
      mockPrisma.message_status.count.mockResolvedValue(1);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await messagerieService.obtenirStatistiquesUtilisateur(1);

      expect(result.totalMessagesEnvoyes).toBe(4);
      expect(result.messagesUtilisateur).toBe(6);
    });
  });

  describe('obtenirStatistiquesMessagesPersonnalises', () => {
    it('devrait récupérer les statistiques des messages personnalisés', async () => {
      mockPrisma.messages_personnalises.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // actifs
        .mockResolvedValueOnce(2)  // supprimés
        .mockResolvedValueOnce(5)  // lus
        .mockResolvedValueOnce(3); // non lus
      mockPrisma.messages_personnalises.groupBy.mockResolvedValue([
        { status_envoi: 'sent', _count: { id: 8 } },
        { status_envoi: 'pending', _count: { id: 2 } }
      ]);

      const result = await messagerieService.obtenirStatistiquesMessagesPersonnalises();

      expect(result.total).toBe(10);
      expect(result.actifs).toBe(8);
      expect(result.lus).toBe(5);
      expect(result.parStatutEnvoi).toHaveProperty('sent', 8);
    });
  });
});
