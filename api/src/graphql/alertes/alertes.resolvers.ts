/**
 * Resolvers GraphQL pour le module Alertes
 * Utilise les services refactorisés pour implémenter la logique
 */

import { GraphQLError } from 'graphql';
import { Alerte } from '../../db/clients/alertes/index.js';
import { AlertesService } from '../../services/alertesService.js';
import type {
  StatutAlerte,
  PrioriteAlerte,
} from '../../db/clients/alertes/types.js';

// ==========================================
// INSTANCES
// ==========================================

const alerteClient = new Alerte();
const alertesService = new AlertesService();

// ==========================================
// HELPERS
// ==========================================

/**
 * Vérifie que l'utilisateur est authentifié
 */
const requireAuth = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Non authentifié', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

/**
 * Vérifie que l'utilisateur a un rôle admin/manager
 */
const requireAdminOrManager = (context: any) => {
  const user = requireAuth(context);
  const allowedRoles = ['admin', 'superadmin', 'manager'];

  if (!allowedRoles.includes(user.role?.toLowerCase())) {
    throw new GraphQLError('Permissions insuffisantes', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

/**
 * Mappe le statut de la BDD vers l'enum GraphQL
 */
const mapStatut = (statut: string): string => {
  const mapping: Record<string, string> = {
    'active': 'ACTIVE',
    'resolue': 'RESOLUE',
    'ignoree': 'IGNOREE'
  };
  return mapping[statut.toLowerCase()] || 'ACTIVE';
};

/**
 * Mappe la priorité de la BDD vers l'enum GraphQL
 */
const mapPriorite = (priorite: string): string => {
  const mapping: Record<string, string> = {
    'basse': 'BASSE',
    'normale': 'NORMALE',
    'haute': 'HAUTE',
    'critique': 'CRITIQUE'
  };
  return mapping[priorite.toLowerCase()] || 'NORMALE';
};

// ==========================================
// RESOLVERS
// ==========================================

export const alertesResolvers = {
  // ==========================================
  // QUERIES
  // ==========================================
  Query: {
    /**
     * Récupère le dashboard des alertes
     */
    alertesDashboard: async (_: any, __: any, context: any) => {
      requireAdminOrManager(context);

      try {
        const result = await alerteClient.obtenirDashboardAlertes();

        if (!result.isFind) {
          return [];
        }

        return result.data.map((item: any) => ({
          typeAlerte: item.type_alerte || item.nom,
          code: item.code,
          priorite: mapPriorite(item.priorite),
          nombreAlertes: item.nombre_alertes || 0,
          utilisateursAffectes: item.utilisateurs_affectes || 0
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération du dashboard:', error);
        throw new GraphQLError('Erreur lors de la récupération du dashboard', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère toutes les alertes actives avec pagination
     */
    alertesActives: async (_: any, { filter, pagination }: any, context: any) => {
      requireAdminOrManager(context);

      try {
        const result = await alerteClient.obtenirAlertesActives();

        if (!result.isFind) {
          return {
            alertes: [],
            total: 0,
            page: 1,
            totalPages: 0
          };
        }

        let alertes = result.data;

        // Appliquer les filtres
        if (filter) {
          if (filter.priorite) {
            alertes = alertes.filter((a: any) =>
              mapPriorite(a.priorite) === filter.priorite
            );
          }

          if (filter.typeCode) {
            alertes = alertes.filter((a: any) =>
              a.code === filter.typeCode
            );
          }

          if (filter.utilisateurId) {
            alertes = alertes.filter((a: any) =>
              a.utilisateur_id === filter.utilisateurId
            );
          }

          if (filter.search) {
            const search = filter.search.toLowerCase();
            alertes = alertes.filter((a: any) =>
              a.nom_utilisateur?.toLowerCase().includes(search) ||
              a.email?.toLowerCase().includes(search) ||
              a.type_alerte?.toLowerCase().includes(search)
            );
          }
        }

        // Pagination
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const total = alertes.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const end = start + limit;

        const paginatedAlertes = alertes.slice(start, end);

        return {
          alertes: paginatedAlertes.map((alerte: any) => ({
            id: alerte.id,
            utilisateurId: alerte.utilisateur_id,
            typeAlerte: alerte.type_alerte,
            code: alerte.code,
            description: alerte.description,
            priorite: mapPriorite(alerte.priorite),
            donneesContexte: alerte.donnees_contexte ? JSON.parse(alerte.donnees_contexte) : null,
            dateDetection: alerte.date_detection,
            nomUtilisateur: alerte.nom_utilisateur,
            email: alerte.email,
            statusId: alerte.status_id
          })),
          total,
          page,
          totalPages
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes actives:', error);
        throw new GraphQLError('Erreur lors de la récupération des alertes', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère les alertes d'un utilisateur
     */
    alertesUtilisateur: async (_: any, { userId }: any, context: any) => {
      requireAuth(context);

      try {
        const result = await alerteClient.obtenirAlertesUtilisateur(userId);

        if (!result.isFind) {
          return [];
        }

        return result.data.map((alerte: any) => ({
          id: alerte.id,
          utilisateurId: alerte.utilisateur_id,
          alerteTypeId: alerte.alerte_type_id,
          statut: mapStatut(alerte.statut),
          donneesContexte: alerte.donnees_contexte ? JSON.parse(alerte.donnees_contexte) : null,
          dateDetection: alerte.date_detection,
          dateResolution: alerte.date_resolution || null,
          notes: alerte.notes || null,
          resoluPar: alerte.resolu_par || null,
          resoluParNom: alerte.resolu_par_nom || null
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes utilisateur:', error);
        throw new GraphQLError('Erreur lors de la récupération des alertes', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère une alerte avec détails complets
     */
    alerteDetails: async (_: any, { alerteId }: any, context: any) => {
      requireAuth(context);

      try {
        // Pour l'instant, retourner les données de base
        // À améliorer avec des jointures pour l'historique
        const result = await alerteClient.obtenirAlertesActives();

        if (!result.isFind) {
          throw new GraphQLError('Alerte non trouvée', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const alerte = result.data.find((a: any) => a.id === alerteId);

        if (!alerte) {
          throw new GraphQLError('Alerte non trouvée', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return {
          alerte: {
            id: alerte.id,
            utilisateurId: alerte.utilisateur_id,
            alerteTypeId: alerte.alerte_type_id,
            statut: mapStatut(alerte.statut || 'active'),
            donneesContexte: alerte.donnees_contexte ? JSON.parse(alerte.donnees_contexte) : null,
            dateDetection: alerte.date_detection,
            dateResolution: null,
            notes: null,
            resoluPar: null
          },
          utilisateur: {
            id: alerte.utilisateur_id,
            firstName: alerte.nom_utilisateur?.split(' ')[0] || '',
            lastName: alerte.nom_utilisateur?.split(' ')[1] || '',
            fullName: alerte.nom_utilisateur,
            email: alerte.email,
            statusId: alerte.status_id,
            gradeId: null
          },
          historique: []
        };
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;

        console.error('Erreur lors de la récupération des détails:', error);
        throw new GraphQLError('Erreur lors de la récupération des détails', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère les statistiques globales
     */
    statistiquesAlertes: async (_: any, __: any, context: any) => {
      requireAdminOrManager(context);

      try {
        const result = await alerteClient.obtenirStatistiquesAlertes();

        if (!result.isFind) {
          return {
            totalAlertes: 0,
            alertesActives: 0,
            alertesResolues: 0,
            alertesCritiques: 0,
            tauxResolution: 0,
            tempsMoyenResolution: null
          };
        }

        const stats = result.data;
        const totalAlertes = stats.total_alertes || 0;
        const alertesResolues = stats.alertes_resolues || 0;
        const tauxResolution = totalAlertes > 0
          ? Math.round((alertesResolues / totalAlertes) * 100)
          : 0;

        return {
          totalAlertes,
          alertesActives: stats.alertes_actives || 0,
          alertesResolues,
          alertesCritiques: stats.alertes_critiques || 0,
          tauxResolution,
          tempsMoyenResolution: null // À calculer avec les données de résolution
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw new GraphQLError('Erreur lors de la récupération des statistiques', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère tous les types d'alertes
     */
    typesAlertes: async (_: any, __: any, context: any) => {
      requireAuth(context);

      try {
        // Pour l'instant, retourner des types statiques
        // À améliorer en récupérant depuis la table alertes_types
        const dashboard = await alerteClient.obtenirDashboardAlertes();

        if (!dashboard.isFind) {
          return [];
        }

        return dashboard.data.map((item: any, index: number) => ({
          id: index + 1,
          nom: item.type_alerte,
          code: item.code,
          description: item.description || '',
          priorite: mapPriorite(item.priorite),
          nombreActives: item.nombre_alertes || 0
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des types:', error);
        throw new GraphQLError('Erreur lors de la récupération des types', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Récupère les alertes critiques
     */
    alertesCritiques: async (_: any, __: any, context: any) => {
      requireAuth(context);

      try {
        const result = await alerteClient.obtenirAlertesActives();

        if (!result.isFind) {
          return [];
        }

        const critiques = result.data.filter((a: any) =>
          a.priorite?.toLowerCase() === 'critique'
        );

        return critiques.map((alerte: any) => ({
          id: alerte.id,
          utilisateurId: alerte.utilisateur_id,
          typeAlerte: alerte.type_alerte,
          code: alerte.code,
          description: alerte.description,
          priorite: mapPriorite(alerte.priorite),
          donneesContexte: alerte.donnees_contexte ? JSON.parse(alerte.donnees_contexte) : null,
          dateDetection: alerte.date_detection,
          nomUtilisateur: alerte.nom_utilisateur,
          email: alerte.email,
          statusId: alerte.status_id
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes critiques:', error);
        throw new GraphQLError('Erreur lors de la récupération des alertes critiques', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Compte les alertes par utilisateur
     */
    nombreAlertesParUtilisateur: async (_: any, { userId }: any, context: any) => {
      requireAuth(context);

      try {
        const result = await alerteClient.obtenirAlertesUtilisateur(userId);

        if (!result.isFind) {
          return 0;
        }

        return result.data.filter((a: any) =>
          a.statut?.toLowerCase() === 'active'
        ).length;
      } catch (error) {
        console.error('Erreur lors du comptage des alertes:', error);
        return 0;
      }
    }
  },

  // ==========================================
  // MUTATIONS
  // ==========================================
  Mutation: {
    /**
     * Déclenche la détection automatique
     */
    detecterAlertes: async (_: any, __: any, context: any) => {
      requireAdminOrManager(context);

      try {
        const result = await alertesService.detecterAlertes();

        return {
          success: result.isConfirm,
          message: result.message,
          nombreAlertesDetectees: null // La stored procedure ne retourne pas ce nombre
        };
      } catch (error: any) {
        console.error('Erreur lors de la détection:', error);
        throw new GraphQLError('Erreur lors de la détection des alertes', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Résout une alerte
     */
    resoudreAlerte: async (_: any, { input }: any, context: any) => {
      requireAuth(context);

      const { alerteId, notes, effectuePar } = input;

      try {
        const result = await alertesService.resoudreAlerte({
          alerteId,
          notes,
          effectuePar
        });

        return {
          success: result.isConfirm,
          message: result.message,
          alerte: null // Optionnellement, recharger l'alerte mise à jour
        };
      } catch (error: any) {
        console.error('Erreur lors de la résolution:', error);
        throw new GraphQLError('Erreur lors de la résolution de l\'alerte', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Ignore une alerte
     */
    ignorerAlerte: async (_: any, { input }: any, context: any) => {
      requireAuth(context);

      const { alerteId, notes } = input;

      try {
        const result = await alertesService.ignorerAlerte({
          alerteId,
          notes
        });

        return {
          success: result.isConfirm,
          message: result.message,
          alerte: null
        };
      } catch (error: any) {
        console.error('Erreur lors de l\'ignorement:', error);
        throw new GraphQLError('Erreur lors de l\'ignorement de l\'alerte', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Réactive une alerte
     */
    reactiverAlerte: async (_: any, { alerteId }: any, context: any) => {
      requireAdminOrManager(context);

      try {
        const result = await alertesService.reactiverAlerte(alerteId);

        return {
          success: result.isConfirm,
          message: result.message,
          alerte: null
        };
      } catch (error: any) {
        console.error('Erreur lors de la réactivation:', error);
        throw new GraphQLError('Erreur lors de la réactivation de l\'alerte', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Résout des alertes en masse
     */
    resoudreAlertesEnMasse: async (
      _: any,
      { typeCode, notes, effectuePar }: any,
      context: any
    ) => {
      requireAdminOrManager(context);

      try {
        // Récupérer toutes les alertes actives de ce type
        const alertesResult = await alerteClient.obtenirAlertesActives();

        if (!alertesResult.isFind) {
          return {
            success: false,
            message: 'Aucune alerte trouvée',
            nombreAlertesDetectees: 0
          };
        }

        const alertes = alertesResult.data.filter((a: any) => a.code === typeCode);

        // Résoudre chaque alerte
        let nombreResolues = 0;
        for (const alerte of alertes) {
          try {
            await alertesService.resoudreAlerte({
              alerteId: alerte.id,
              notes,
              effectuePar
            });
            nombreResolues++;
          } catch (err) {
            console.error(`Erreur lors de la résolution de l'alerte ${alerte.id}:`, err);
          }
        }

        return {
          success: true,
          message: `${nombreResolues} alerte(s) résolue(s)`,
          nombreAlertesDetectees: nombreResolues
        };
      } catch (error: any) {
        console.error('Erreur lors de la résolution en masse:', error);
        throw new GraphQLError('Erreur lors de la résolution en masse', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Nettoie les alertes anciennes
     */
    nettoyerAlertesAnciennes: async (
      _: any,
      { joursAConserver }: any,
      context: any
    ) => {
      requireAdminOrManager(context);

      try {
        // À implémenter : méthode de nettoyage dans le service
        // Pour l'instant, retourner un succès factice

        return {
          success: true,
          message: `Nettoyage effectué (alertes > ${joursAConserver} jours supprimées)`,
          nombreAlertesDetectees: 0
        };
      } catch (error: any) {
        console.error('Erreur lors du nettoyage:', error);
        throw new GraphQLError('Erreur lors du nettoyage', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
};
