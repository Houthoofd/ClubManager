/**
 * Module core - Gestion des commandes
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { 
  MagasinCommande as Commande,
  CommandeDetails,
  NouvelleCommande,
  MagasinConfirmationResult as ConfirmationResult,
  IdCommande
} from '@clubmanager/types';
import { 
  ArticleCommande,
  StatutCommande,
  MagasinError,
  TAILLES_MAPPING,
  TAILLES_REVERSE_MAPPING
} from '@clubmanager/types';
console.log('Module des commandes');

/**
 * Récupère toutes les commandes avec détails
 */
export async function obtenirToutesLesCommandes(prisma = defaultPrisma): Promise<CommandeDetails[]> {
  console.log('📋 [MagasinCommandes] Récupération de toutes les commandes');
  
  try {
    const commandes = await prisma.commandes.findMany({
      include: {
        utilisateurs: true,
        commandes_articles: {
          include: {
            articles: true,
            tailles: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const result: CommandeDetails[] = commandes.map((commande: any) => ({
      id: commande.id,
      utilisateur_id: commande.utilisateur_id,
      utilisateur_nom: commande.utilisateurs.nom,
      statut: commande.statut,
      date: commande.date.toISOString(),
      total: commande.total,
      articles: commande.commandes_articles.map((ca: any) => ({
        article_id: ca.article_id,
        article_nom: ca.articles.nom,
        taille: ca.tailles?.nom,
        quantite: ca.quantite,
        prix: ca.prix
      }))
    }));

    console.log(`✅ [MagasinCommandes] ${result.length} commandes récupérées`);
    return result;
  } catch (error: any) {
    console.error('❌ [MagasinCommandes] Erreur récupération commandes:', error);
    throw new MagasinError(
      'Erreur lors de la récupération des commandes',
      'COMMANDES_FETCH_ERROR',
      error
    );
  }
}

/**
 * Récupère les commandes d'un utilisateur
 */
export async function obtenirCommandesUtilisateur(
  utilisateurId: number, 
  prisma = defaultPrisma
): Promise<CommandeDetails[]> {
  console.log(`📋 [MagasinCommandes] Récupération commandes utilisateur ${utilisateurId}`);
  
  try {
    const commandes = await prisma.commandes.findMany({
      where: {
        utilisateur_id: utilisateurId
      },
      include: {
        utilisateurs: true,
        commandes_articles: {
          include: {
            articles: true,
            tailles: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const result: CommandeDetails[] = commandes.map((commande: any) => ({
      id: commande.id,
      utilisateur_id: commande.utilisateur_id,
      utilisateur_nom: commande.utilisateurs.nom,
      statut: commande.statut,
      date: commande.date.toISOString(),
      total: commande.total,
      articles: commande.commandes_articles.map((ca: any) => ({
        article_id: ca.article_id,
        article_nom: ca.articles.nom,
        taille: ca.tailles?.nom,
        quantite: ca.quantite,
        prix: ca.prix
      }))
    }));

    console.log(`✅ [MagasinCommandes] ${result.length} commandes trouvées pour utilisateur ${utilisateurId}`);
    return result;
  } catch (error: any) {
    console.error(`❌ [MagasinCommandes] Erreur récupération commandes utilisateur ${utilisateurId}:`, error);
    throw new MagasinError(
      'Erreur lors de la récupération des commandes utilisateur',
      'USER_COMMANDES_FETCH_ERROR',
      error
    );
  }
}

/**
 * Crée une nouvelle commande avec gestion des stocks
 */
export async function ajouterCommande(data: NouvelleCommande, prisma = defaultPrisma): Promise<ConfirmationResult> {
  console.log(`➕ [MagasinCommandes] Création commande pour utilisateur ${data.utilisateur_id}`);

  // Validations
  if (!data.utilisateur_id || data.utilisateur_id <= 0) {
    throw new MagasinError('L\'ID utilisateur est requis et doit être positif', 'INVALID_USER_ID');
  }

  if (!data.articles || data.articles.length === 0) {
    throw new MagasinError('La commande doit contenir au moins un article', 'EMPTY_ORDER');
  }

  // Valider chaque article
  for (const article of data.articles) {
    if (!article.article_id || article.article_id <= 0) {
      throw new MagasinError('L\'ID de l\'article est requis et doit être positif', 'INVALID_ARTICLE_ID');
    }
    
    if (!article.quantite || article.quantite <= 0) {
      throw new MagasinError('La quantité doit être supérieure à 0', 'INVALID_QUANTITY');
    }

    if (article.prix !== undefined && article.prix < 0) {
      throw new MagasinError('Le prix ne peut pas être négatif', 'INVALID_PRICE');
    }
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Vérifier et réserver les stocks
      for (const article of data.articles) {
        const tailleId = article.taille ? TAILLES_MAPPING[article.taille] : null;
        
        if (tailleId) {
          const stock = await tx.stocks.findFirst({
            where: {
              article_id: article.article_id,
              taille_id: tailleId
            }
          });

          if (!stock || stock.quantite < article.quantite) {
            throw new MagasinError(
              `Stock insuffisant pour l'article ${article.article_id} taille ${article.taille}`,
              'INSUFFICIENT_STOCK',
              { article_id: article.article_id, taille: article.taille, demandee: article.quantite, disponible: stock?.quantite || 0 }
            );
          }

          // Réserver le stock
          await tx.stocks.update({
            where: {
              id: stock.id
            },
            data: {
              quantite: stock.quantite - article.quantite
            }
          });
        }
      }

      // 2. Calculer le total
      const total = data.total || data.articles.reduce((sum, article) => sum + (article.prix * article.quantite), 0);

      // 3. Créer la commande
      const commande = await tx.commandes.create({
        data: {
          utilisateur_id: data.utilisateur_id,
          statut: data.statut || StatutCommande.EN_ATTENTE,
          date: new Date(data.date || new Date()),
          total: total
        }
      });

      // 4. Ajouter les articles de la commande
      const articlesCommande = await Promise.all(
        data.articles.map(async (article) => {
          const tailleId = article.taille ? TAILLES_MAPPING[article.taille] : null;
          
          return await tx.commandes_articles.create({
            data: {
              commande_id: commande.id,
              article_id: article.article_id,
              taille_id: tailleId,
              quantite: article.quantite,
              prix: article.prix
            }
          });
        })
      );

      return {
        commande_id: commande.id,
        total: commande.total,
        articles_count: articlesCommande.length
      };
    });

    console.log(`✅ [MagasinCommandes] Commande ${result.commande_id} créée avec succès`);
    return {
      success: true,
      isConfirm: true,
      message: 'Commande créée avec succès',
      data: result
    };
  } catch (error: any) {
    console.error('❌ [MagasinCommandes] Erreur création commande:', error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la création de la commande',
      'COMMANDE_CREATION_ERROR',
      error
    );
  }
}

/**
 * Met à jour le statut d'une commande
 */
export async function modifierStatutCommande(
  commandeId: number,
  nouveauStatut: StatutCommande,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`🔄 [MagasinCommandes] Modification statut commande ${commandeId} -> ${nouveauStatut}`);

  try {
    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId }
    });

    if (!commande) {
      throw new MagasinError(
        `Commande ${commandeId} non trouvée`,
        'COMMANDE_NOT_FOUND',
        { commandeId }
      );
    }

    await prisma.commandes.update({
      where: { id: commandeId },
      data: { statut: nouveauStatut }
    });

    console.log(`✅ [MagasinCommandes] Statut commande ${commandeId} mis à jour: ${nouveauStatut}`);
    return {
      success: true,
      isConfirm: true,
      message: `Statut de la commande mis à jour: ${nouveauStatut}`,
      data: { commandeId, nouveauStatut }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCommandes] Erreur modification statut commande ${commandeId}:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la modification du statut',
      'COMMANDE_STATUS_UPDATE_ERROR',
      error
    );
  }
}

/**
 * Récupère une commande spécifique avec ses détails
 */
export async function obtenirCommandeParId(
  commandeId: number,
  prisma = defaultPrisma
): Promise<CommandeDetails | null> {
  console.log(`🔍 [MagasinCommandes] Recherche commande ${commandeId}`);

  try {
    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId },
      include: {
        utilisateurs: true,
        commandes_articles: {
          include: {
            articles: true,
            tailles: true
          }
        }
      }
    });

    if (!commande) {
      console.warn(`⚠️ [MagasinCommandes] Commande ${commandeId} non trouvée`);
      return null;
    }

    const result: CommandeDetails = {
      id: commande.id,
      utilisateur_id: commande.utilisateur_id,
      utilisateur_nom: commande.utilisateurs.nom,
      statut: commande.statut,
      date: commande.date.toISOString(),
      total: commande.total,
      articles: commande.commandes_articles.map((ca: any) => ({
        article_id: ca.article_id,
        article_nom: ca.articles.nom,
        taille: ca.tailles?.nom,
        quantite: ca.quantite,
        prix: ca.prix
      }))
    };

    console.log(`✅ [MagasinCommandes] Commande ${commandeId} récupérée`);
    return result;
  } catch (error: any) {
    console.error(`❌ [MagasinCommandes] Erreur récupération commande ${commandeId}:`, error);
    throw new MagasinError(
      'Erreur lors de la récupération de la commande',
      'COMMANDE_FETCH_ERROR',
      error
    );
  }
}

/**
 * Annule une commande et restaure les stocks
 */
export async function annulerCommande(
  commandeId: number,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`❌ [MagasinCommandes] Annulation commande ${commandeId}`);

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Récupérer la commande avec ses articles
      const commande = await tx.commandes.findUnique({
        where: { id: commandeId },
        include: {
          commandes_articles: true
        }
      });

      if (!commande) {
        throw new MagasinError(
          `Commande ${commandeId} non trouvée`,
          'COMMANDE_NOT_FOUND',
          { commandeId }
        );
      }

      if (commande.statut === StatutCommande.ANNULEE) {
        throw new MagasinError(
          `La commande ${commandeId} est déjà annulée`,
          'COMMANDE_ALREADY_CANCELLED',
          { commandeId }
        );
      }

      // 2. Restaurer les stocks
      for (const article of commande.commandes_articles) {
        if (article.taille_id) {
          await tx.stocks.updateMany({
            where: {
              article_id: article.article_id,
              taille_id: article.taille_id
            },
            data: {
              quantite: {
                increment: article.quantite
              }
            }
          });
        }
      }

      // 3. Mettre à jour le statut
      await tx.commandes.update({
        where: { id: commandeId },
        data: { statut: StatutCommande.ANNULEE }
      });

      return {
        commandeId,
        articles_restored: commande.commandes_articles.length
      };
    });

    console.log(`✅ [MagasinCommandes] Commande ${commandeId} annulée et stocks restaurés`);
    return {
      success: true,
      isConfirm: true,
      message: 'Commande annulée avec succès',
      data: result
    };
  } catch (error: any) {
    console.error(`❌ [MagasinCommandes] Erreur annulation commande ${commandeId}:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de l\'annulation de la commande',
      'COMMANDE_CANCELLATION_ERROR',
      error
    );
  }
}
