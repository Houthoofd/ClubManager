/**
 * Resolvers GraphQL pour le service Stock
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { GraphQLError } from 'graphql';
import { StockService } from './stock.service.js';
import { StockError } from '@clubmanager/types';

export const stockResolvers = (prisma: typeof defaultPrisma) => {
  const stockService = new StockService(prisma);

  return {
    Query: {
      /**
       * Récupère tous les stocks avec filtres et pagination
       */
      obtenirStocks: async (
        _: any,
        {
          article_id,
          taille,
          statut,
          recherche,
          limit,
          offset
        }: {
          article_id?: number;
          taille?: string;
          statut?: any;
          recherche?: string;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await stockService.obtenirStocks({
            article_id,
            taille,
            statut,
            recherche,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère un stock par article ID et taille
       */
      obtenirStockParId: async (
        _: any,
        { article_id, taille }: { article_id: number; taille: string }
      ) => {
        try {
          const stock = await stockService.obtenirStockParId(article_id, taille);
          if (!stock) {
            throw new StockError(
              `Stock non trouvé pour l'article ${article_id} taille ${taille}`,
              'STOCK_NOT_FOUND' as any,
              404
            );
          }
          return stock;
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère l'historique des mouvements de stock
       */
      obtenirMouvements: async (
        _: any,
        {
          article_id,
          taille,
          type_mouvement,
          commande_id,
          date_debut,
          date_fin,
          limit,
          offset
        }: {
          article_id?: number;
          taille?: string;
          type_mouvement?: any;
          commande_id?: string;
          date_debut?: Date;
          date_fin?: Date;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await stockService.obtenirMouvements({
            article_id,
            taille,
            type_mouvement,
            commande_id,
            date_debut,
            date_fin,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les résumés consolidés des stocks par article
       */
      obtenirResumesStocks: async (
        _: any,
        {
          article_id,
          recherche,
          statut_filtre,
          limit,
          offset
        }: {
          article_id?: number;
          recherche?: string;
          statut_filtre?: any;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await stockService.obtenirResumesStocks({
            article_id,
            recherche,
            statut_filtre,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie la disponibilité du stock pour une liste d'articles
       */
      verifierDisponibilite: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.verifierDisponibilite(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un stock existe
       */
      stockExiste: async (
        _: any,
        { article_id, taille }: { article_id: number; taille: string }
      ) => {
        try {
          return await stockService.stockExiste(article_id, taille);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient le stock disponible pour un article/taille
       */
      obtenirStockDisponible: async (
        _: any,
        { article_id, taille }: { article_id: number; taille: string }
      ) => {
        try {
          return await stockService.obtenirStockDisponible(article_id, taille);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient tous les stocks en rupture
       */
      obtenirStocksEnRupture: async () => {
        try {
          return await stockService.obtenirStocksEnRupture();
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient tous les stocks en alerte
       */
      obtenirStocksEnAlerte: async () => {
        try {
          return await stockService.obtenirStocksEnAlerte();
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Compte le nombre de mouvements pour un article
       */
      compterMouvementsArticle: async (
        _: any,
        { article_id }: { article_id: number }
      ) => {
        try {
          return await stockService.compterMouvementsArticle(article_id);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques générales des stocks
       */
      statistiquesStocks: async () => {
        try {
          return await stockService.statistiquesGenerales();
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques d'un article spécifique
       */
      statistiquesArticle: async (
        _: any,
        { article_id }: { article_id: number }
      ) => {
        try {
          return await stockService.statistiquesArticle(article_id);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Recherche des stocks par nom d'article
       */
      rechercherStocks: async (
        _: any,
        { recherche }: { recherche: string }
      ) => {
        try {
          return await stockService.rechercherStocks(recherche);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      }
    },

    Mutation: {
      /**
       * Réserve du stock pour une commande
       */
      reserverStock: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.reserverStock(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Confirme une livraison (décrémente le stock physique)
       */
      confirmerLivraison: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.confirmerLivraison(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Annule une commande (libère le stock réservé)
       */
      annulerCommande: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.annulerCommande(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Ajuste manuellement le stock (ajout ou retrait)
       */
      ajusterStock: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.ajusterStock(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Réapprovisionne le stock (réception de marchandises)
       */
      reapprovisionnerStock: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await stockService.reapprovisionnerStock(input);
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Définit un seuil d'alerte pour un stock
       */
      definirSeuilAlerte: async (
        _: any,
        { article_id, taille, seuil_alerte }: { article_id: number; taille: string; seuil_alerte: number }
      ) => {
        try {
          await stockService.definirSeuilAlerte(article_id, taille, seuil_alerte);
          return {
            success: true,
            message: `Seuil d'alerte défini à ${seuil_alerte} pour l'article ${article_id} taille ${taille}`
          };
        } catch (error: unknown) {
          if (error instanceof StockError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      }
    }
  };
};

// Export d'un resolver par défaut
export const stockResolversDefault = stockResolvers(defaultPrisma);
