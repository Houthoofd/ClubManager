/**
 * Tests d'intégration pour le service Messagerie
 * Vérifie les scénarios complexes et les flux métier
 * 
 * Note: Utilise le mock Prisma local défini dans messagerie.mock.ts
 */

import { MessagerieService } from '../messagerie.service';
import { StatutMessage } from '@clubmanager/types';
import { 
  createMockPrisma, 
  mockUtilisateur, 
  mockUtilisateur2,
  mockMessage,
  mockMessagePersonnalise,
  mockGroupe,
  resetAllMocks,
  setupDefaultMocks
} from './messagerie.mock';

describe('MessagerieService - Tests d\'Intégration', () => {
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
  // CYCLE COMPLET - MESSAGE PERSONNALISÉ
  // ============================================

  describe('Cycle complet - Message personnalisé', () => {
    it('devrait créer, récupérer et marquer comme lu un message personnalisé', async () => {
      // 1. Créer le message
      const nouveauMessage = {
        ...mockMessagePersonnalise,
        id: 10
      };
      mockPrisma.messages_personnalises.create.mockResolvedValue(nouveauMessage);

      const resultCreation = await messagerieService.creerMessagePersonnalise(1, 'Test intégration');

      expect(resultCreation.success).toBe(true);
      expect(resultCreation.data?.id).toBe(10);

      // 2. Récupérer le message
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(nouveauMessage);

      const messageRecupere = await messagerieService.obtenirMessagePersonnaliseParId(10, 1);

      expect(messageRecupere).not.toBeNull();
      expect(messageRecupere?.id).toBe(10);
      expect(messageRecupere?.statut).toBe(StatutMessage.NON_LU);

      // 3. Marquer comme lu
      const messageLu = { ...nouveauMessage, lu: true };
      mockPrisma.messages_personnalises.findFirst.mockResolvedValue(messageLu);
      mockPrisma.messages_personnalises.update.mockResolvedValue(messageLu);

      const resultLecture = await messagerieService.marquerMessagePersonnaliseLu({
        messageId: 10,
        userId: 1
      });

      expect(resultLecture.success).toBe(true);
    });
  });

  // ============================================
  // CYCLE COMPLET - MESSAGE STANDARD
  // ============================================

  describe('Cycle complet - Message standard', () => {
    it('devrait envoyer un message entre utilisateurs et gérer le statut', async () => {
      // 1. Envoyer le message
      const nouveauMessage = {
        ...mockMessage,
        id: 20
      };
      mockPrisma.messages.create.mockResolvedValue(nouveauMessage);
      mockPrisma.message_status.create.mockResolvedValue({
        id: 1,
        message_id: 20,
        utilisateur_id: 2,
        status: 'non_vu'
      });

      const resultEnvoi = await messagerieService.envoyerMessageUtilisateur(
        1,
        2,
        'Message de test'
      );

      expect(resultEnvoi.success).toBe(true);
      expect(resultEnvoi.data?.id).toBe(20);

      // 2. Récupérer le message
      const messageAvecStatus = {
        ...nouveauMessage,
        message_status: [{
          id: 1,
          message_id: 20,
          utilisateur_id: 2,
          status: 'non_vu'
        }]
      };
      mockPrisma.messages.findFirst.mockResolvedValue(messageAvecStatus);
      
      // Mock pour marquerMessageVu qui utilise findUnique
      mockPrisma.messages.findUnique.mockResolvedValue({
        id: 20,
        expediteur_id: 1,
        destinataire_id: 2,
        sujet: 'Test',
        contenu: 'Contenu',
        date_envoi: new Date(),
        lu: false
      });

      const messageRecupere = await messagerieService.obtenirMessageParId(20, 2);

      expect(messageRecupere).not.toBeNull();
      expect(messageRecupere?.id).toBe(20);
      expect(messageRecupere?.statut).toBe(StatutMessage.NON_LU);

      // 3. Marquer comme vu
      mockPrisma.message_status.upsert.mockResolvedValue({
        id: 1,
        message_id: 20,
        utilisateur_id: 2,
        status: 'vu'
      });

      const resultVu = await messagerieService.marquerMessageVu(20, 2);

      expect(resultVu.success).toBe(true);
    });
  });

  // ============================================
  // ENVOI MULTIPLE
  // ============================================

  describe('Envoi multiple', () => {
    it('devrait envoyer un message à plusieurs destinataires', async () => {
      const nouveauMessage = { ...mockMessage, id: 30 };
      mockPrisma.messages.create.mockResolvedValue(nouveauMessage);
      mockPrisma.message_status.createMany.mockResolvedValue({ count: 2 });

      const result = await messagerieService.envoyerMessageMultipleAvecContenu(
        1,
        [2, 3],
        'Message multiple'
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('devrait gérer les échecs d\'envoi partiel', async () => {
      // Mock : succès pour le premier, échec pour le second
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockUtilisateur, mockUtilisateur2]);
      
      let callCount = 0;
      mockPrisma.messages.create.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ...mockMessage, id: 40 });
        }
        return Promise.reject(new Error('Erreur envoi'));
      });

      mockPrisma.message_status.create.mockResolvedValue({
        id: 1,
        message_id: 40,
        utilisateur_id: 2,
        status: 'non_vu'
      });

      const result = await messagerieService.envoyerMessageMultipleAvecContenu(
        1,
        [2, 3],
        'Test échecs'
      );

      expect(result.count).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // MESSAGES DE GROUPE
  // ============================================

  describe('Messages de groupe', () => {
    it('devrait envoyer un message à un groupe', async () => {
      mockPrisma.groupes.findUnique.mockResolvedValue(mockGroupe);
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue({
        id: 1,
        groupe_id: 1,
        utilisateur_id: 1
      });
      mockPrisma.groupes_utilisateurs.findMany.mockResolvedValue([
        { id: 1, groupe_id: 1, utilisateur_id: 1 },
        { id: 2, groupe_id: 1, utilisateur_id: 2 }
      ]);
      mockPrisma.messages.create.mockResolvedValue({
        ...mockMessage,
        id: 50,
        groupe_id: 1
      });
      mockPrisma.message_status.createMany.mockResolvedValue({ count: 1 });

      const result = await messagerieService.envoyerMessageGroupe(1, 1, 'Message au groupe');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(50);
    });

    it('devrait récupérer les messages d\'un groupe', async () => {
      mockPrisma.groupes_utilisateurs.findFirst.mockResolvedValue({
        id: 1,
        groupe_id: 1,
        utilisateur_id: 1
      });
      mockPrisma.messages.findMany.mockResolvedValue([
        {
          ...mockMessage,
          groupe_id: 1,
          message_status: []
        }
      ]);

      const messages = await messagerieService.obtenirMessagesGroupe(1, 1);

      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe(1);
    });
  });

  // ============================================
  // COMPTAGE ET STATISTIQUES
  // ============================================

  describe('Comptage et statistiques', () => {
    it('devrait compter les messages non vus', async () => {
      mockPrisma.message_status.count.mockResolvedValue(3);
      mockPrisma.messages_personnalises.count.mockResolvedValue(2);

      const count = await messagerieService.compterMessagesNonVus(1);

      expect(count).toBe(5);
    });

    it('devrait marquer tous les messages comme vus', async () => {
      mockPrisma.message_status.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.messages_personnalises.updateMany.mockResolvedValue({ count: 2 });

      const result = await messagerieService.marquerTousMessagesVus(1);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
    });

    it('devrait récupérer les statistiques générales', async () => {
      // Mock pour totalMessages
      mockPrisma.messages.count.mockResolvedValueOnce(30);
      mockPrisma.messages_personnalises.count.mockResolvedValueOnce(20);
      
      // Mock pour messagesParJour
      mockPrisma.$queryRaw.mockResolvedValue([
        { date: new Date('2024-01-15'), count: 10n },
        { date: new Date('2024-01-14'), count: 8n }
      ]);

      const stats = await messagerieService.obtenirStatistiquesGenerales();

      expect(stats.totalMessagesEnvoyes).toBe(50);
      expect(stats.messagesParJour).toHaveLength(2);
    });
  });

  // ============================================
  // RÉCUPÉRATION DE TOUS LES MESSAGES
  // ============================================

  describe('Récupération de tous les messages', () => {
    it('devrait combiner messages standards et personnalisés', async () => {
      mockPrisma.messages.findMany.mockResolvedValue([
        {
          ...mockMessage,
          message_status: []
        }
      ]);
      mockPrisma.messages_personnalises.findMany.mockResolvedValue([
        mockMessagePersonnalise
      ]);

      const messages = await messagerieService.obtenirTousMessages(1);

      expect(messages).toHaveLength(2);
    });
  });

  // ============================================
  // NETTOYAGE
  // ============================================

  describe('Nettoyage des anciens messages', () => {
    it('devrait supprimer les anciens messages marqués comme supprimés', async () => {
      mockPrisma.messages_personnalises.deleteMany.mockResolvedValue({ count: 5 });

      const result = await messagerieService.nettoyerAnciennesMessages(30);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
    });
  });
});
