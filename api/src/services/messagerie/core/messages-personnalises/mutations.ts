/**
 * Mutations pour les messages personnalisés
 */

import { MessagerieError, MessagerieResponse } from '@clubmanager/types';

/**
 * Marque un message comme lu
 */
export async function marquerMessageLu(
  prisma,
  messageId: number,
  utilisateurId: number
): Promise<MessagerieResponse<{ message: string }>> {
  if (!messageId || messageId <= 0) {
    throw new MessagerieError('ID message invalide', 'INVALID_MESSAGE_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.messages_personnalises.findFirst({
      where: {
        id: messageId,
        utilisateur_id: utilisateurId,
        is_active: true,
        deleted_at: null
      }
    });

    if (!message) {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }

    // Marquer comme lu
    await prisma.messages_personnalises.update({
      where: { id: messageId },
      data: {
        lu: true,
        date_lecture: new Date()
      }
    });

    return {
      success: true,
      data: { message: 'Message marqué comme lu' }
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2025') {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de la mise à jour du message',
      'UPDATE_ERROR',
      error
    );
  }
}

/**
 * Supprime un message personnalisé (soft delete)
 */
export async function supprimerMessagePersonnalise(
  prisma,
  messageId: number,
  utilisateurId: number
): Promise<MessagerieResponse<{ message: string }>> {
  if (!messageId || messageId <= 0) {
    throw new MessagerieError('ID message invalide', 'INVALID_MESSAGE_ID');
  }

  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.messages_personnalises.findFirst({
      where: {
        id: messageId,
        utilisateur_id: utilisateurId,
        is_active: true,
        deleted_at: null
      }
    });

    if (!message) {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }

    // Soft delete
    await prisma.messages_personnalises.update({
      where: { id: messageId },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: utilisateurId
      }
    });

    return {
      success: true,
      data: { message: 'Message supprimé avec succès' }
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2025') {
      throw new MessagerieError('Message non trouvé', 'MESSAGE_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de la suppression du message',
      'DELETE_ERROR',
      error
    );
  }
}

/**
 * Crée un nouveau message personnalisé
 */
export async function creerMessagePersonnalise(
  prisma,
  utilisateurId: number,
  contenu: string
): Promise<MessagerieResponse<{ id: number }>> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  if (!contenu || contenu.trim() === '') {
    throw new MessagerieError('Le contenu du message est requis', 'EMPTY_CONTENT');
  }

  if (contenu.length > 10000) {
    throw new MessagerieError('Le contenu du message est trop long', 'CONTENT_TOO_LONG');
  }

  try {
    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId }
    });

    if (!utilisateur) {
      throw new MessagerieError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    const message = await prisma.messages_personnalises.create({
      data: {
        utilisateur_id: utilisateurId,
        contenu: contenu.trim(),
        lu: false,
        is_active: true,
        status_envoi: 'pending'
      }
    });

    return {
      success: true,
      data: { id: message.id },
      message: 'Message créé avec succès'
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    if (error.code === 'P2003') {
      throw new MessagerieError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }
    throw new MessagerieError(
      'Erreur lors de la création du message',
      'CREATE_ERROR',
      error
    );
  }
}

/**
 * Nettoie les anciens messages supprimés
 */
export async function nettoyerAnciennesMessages(
  prisma,
  joursAnciennete: number = 90
): Promise<MessagerieResponse<{ count: number }>> {
  if (!joursAnciennete || joursAnciennete <= 0) {
    throw new MessagerieError('Nombre de jours invalide', 'INVALID_DAYS');
  }

  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - joursAnciennete);

    const result = await prisma.messages_personnalises.deleteMany({
      where: {
        deleted_at: {
          not: null,
          lt: dateLimit
        }
      }
    });

    return {
      success: true,
      data: { count: result.count },
      message: `${result.count} message(s) supprimé(s)`
    };
  } catch (error: any) {
    throw new MessagerieError(
      'Erreur lors du nettoyage des messages',
      'CLEANUP_ERROR',
      error
    );
  }
}
