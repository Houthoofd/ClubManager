/**
 * Module de statistiques pour la messagerie
 */

import { MessagerieError, StatistiquesMessages, MessageParJour } from '@clubmanager/types';

/**
 * Récupère les statistiques générales de la messagerie
 */
export async function obtenirStatistiquesGenerales(
  prisma,
  utilisateurId?: number
): Promise<StatistiquesMessages> {
  try {
    const stats: StatistiquesMessages = {
      totalTypesMessages: 0,
      totalMessagesEnvoyes: 0,
      messagesParJour: []
    };

    // Total des messages envoyés
    const totalMessages = await prisma.messages.count();
    const totalMessagesPersonnalises = await prisma.messages_personnalises.count({
      where: {
        is_active: true,
        deleted_at: null
      }
    });

    stats.totalMessagesEnvoyes = totalMessages + totalMessagesPersonnalises;

    // Si un utilisateur est spécifié, ajouter ses statistiques
    if (utilisateurId && utilisateurId > 0) {
      // Messages non lus de l'utilisateur
      const messagesNonVus = await prisma.message_status.count({
        where: {
          utilisateur_id: utilisateurId,
          status: 'non_vu'
        }
      });

      const messagesPersonnalisesNonLus = await prisma.messages_personnalises.count({
        where: {
          utilisateur_id: utilisateurId,
          lu: false,
          is_active: true,
          deleted_at: null
        }
      });

      stats.messagesNonLus = messagesNonVus + messagesPersonnalisesNonLus;

      // Messages de l'utilisateur
      stats.messagesUtilisateur = await prisma.messages.count({
        where: {
          OR: [
            { sender_id: utilisateurId },
            { receiver_id: utilisateurId }
          ]
        }
      });
    }

    // Messages par jour (30 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 30);

    const messagesParJour = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= ${dateDebut}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    stats.messagesParJour = messagesParJour.map((row: any) => ({
      date: row.date.toISOString().split('T')[0],
      count: Number(row.count)
    }));

    return stats;
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération des statistiques',
      'STATS_ERROR',
      error
    );
  }
}

/**
 * Récupère les statistiques pour un utilisateur spécifique
 */
export async function obtenirStatistiquesUtilisateur(
  prisma,
  utilisateurId: number
): Promise<StatistiquesMessages> {
  if (!utilisateurId || utilisateurId <= 0) {
    throw new MessagerieError('ID utilisateur invalide', 'INVALID_USER_ID');
  }

  try {
    // Messages envoyés par l'utilisateur
    const messagesEnvoyes = await prisma.messages.count({
      where: {
        sender_id: utilisateurId
      }
    });

    // Messages reçus par l'utilisateur
    const messagesRecus = await prisma.messages.count({
      where: {
        receiver_id: utilisateurId
      }
    });

    // Messages personnalisés de l'utilisateur
    const messagesPersonnalises = await prisma.messages_personnalises.count({
      where: {
        utilisateur_id: utilisateurId,
        is_active: true,
        deleted_at: null
      }
    });

    // Messages non lus
    const messagesNonVus = await prisma.message_status.count({
      where: {
        utilisateur_id: utilisateurId,
        status: 'non_vu'
      }
    });

    const messagesPersonnalisesNonLus = await prisma.messages_personnalises.count({
      where: {
        utilisateur_id: utilisateurId,
        lu: false,
        is_active: true,
        deleted_at: null
      }
    });

    // Messages par jour pour cet utilisateur (30 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 30);

    const messagesParJour = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= ${dateDebut}
        AND (sender_id = ${utilisateurId} OR receiver_id = ${utilisateurId})
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      totalTypesMessages: 0,
      totalMessagesEnvoyes: messagesEnvoyes + messagesPersonnalises,
      messagesUtilisateur: messagesEnvoyes + messagesRecus + messagesPersonnalises,
      messagesNonLus: messagesNonVus + messagesPersonnalisesNonLus,
      messagesParJour: messagesParJour.map((row: any) => ({
        date: row.date.toISOString().split('T')[0],
        count: Number(row.count)
      }))
    };
  } catch (error: any) {
    if (error instanceof MessagerieError) {
      throw error;
    }
    throw new MessagerieError(
      'Erreur lors de la récupération des statistiques utilisateur',
      'STATS_ERROR',
      error
    );
  }
}

/**
 * Récupère les statistiques des messages personnalisés
 */
export async function obtenirStatistiquesMessagesPersonnalises(
  prisma
): Promise<{
  total: number;
  actifs: number;
  supprimes: number;
  lus: number;
  nonLus: number;
  parStatutEnvoi: Record<string, number>;
}> {
  try {
    const [
      total,
      actifs,
      supprimes,
      lus,
      nonLus
    ] = await Promise.all([
      // Total
      prisma.messages_personnalises.count(),
      // Actifs
      prisma.messages_personnalises.count({
        where: {
          is_active: true,
          deleted_at: null
        }
      }),
      // Supprimés
      prisma.messages_personnalises.count({
        where: {
          deleted_at: { not: null }
        }
      }),
      // Lus
      prisma.messages_personnalises.count({
        where: {
          lu: true,
          is_active: true
        }
      }),
      // Non lus
      prisma.messages_personnalises.count({
        where: {
          lu: false,
          is_active: true,
          deleted_at: null
        }
      })
    ]);

    // Statistiques par statut d'envoi
    const parStatutEnvoi = await prisma.messages_personnalises.groupBy({
      by: ['status_envoi'],
      _count: {
        id: true
      }
    });

    const statutsMap: Record<string, number> = {};
    parStatutEnvoi.forEach((stat: any) => {
      if (stat.status_envoi) {
        statutsMap[stat.status_envoi] = stat._count.id;
      }
    });

    return {
      total,
      actifs,
      supprimes,
      lus,
      nonLus,
      parStatutEnvoi: statutsMap
    };
  } catch (error: any) {
    throw new MessagerieError(
      'Erreur lors de la récupération des statistiques des messages personnalisés',
      'STATS_ERROR',
      error
    );
  }
}
