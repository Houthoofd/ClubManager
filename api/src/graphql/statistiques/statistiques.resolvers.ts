/**
 * Resolvers GraphQL pour le module Statistiques
 */

import { Statistiques } from '../../db/clients/statistiques/statistiques.js';

/**
 * Contexte GraphQL (à typer selon votre configuration)
 */
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * Instance du client Statistiques (legacy)
 */
const getStatistiquesClient = () => new Statistiques();

/**
 * Resolvers pour les statistiques
 */
export const statistiquesResolvers = {
  Query: {
    /**
     * Obtenir les statistiques générales du club
     */
    statistiquesGenerales: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirStatistiquesGenerales();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques générales:', error);
        throw new Error('Impossible de récupérer les statistiques générales');
      }
    },

    /**
     * Obtenir les statistiques par type de cours
     */
    statistiquesParCours: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirStatistiquesParCours();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques par cours:', error);
        throw new Error('Impossible de récupérer les statistiques par cours');
      }
    },

    /**
     * Obtenir les statistiques de présence (30 derniers jours)
     */
    statistiquesPresence: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        const results = await client.obtenirStatistiquesPresence();

        // Ajouter le calcul du taux de présence en pourcentage
        return results.map((stat: any) => ({
          ...stat,
          taux_presence_pct: stat.total_inscrits > 0
            ? (stat.presents / stat.total_inscrits) * 100
            : 0,
        }));
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques de présence:', error);
        throw new Error('Impossible de récupérer les statistiques de présence');
      }
    },

    /**
     * Obtenir les statistiques de fréquentation d'un utilisateur
     */
    statistiquesFrequentation: async (
      _: any,
      { utilisateur_id }: { utilisateur_id: number },
      context: GraphQLContext
    ) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirStatistiquesFrequentation(utilisateur_id);
      } catch (error) {
        console.error(`[Statistiques] Erreur lors de la récupération des statistiques de fréquentation pour l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les statistiques de fréquentation');
      }
    },

    /**
     * Obtenir la progression d'un utilisateur
     */
    progressionUtilisateur: async (
      _: any,
      { utilisateur_id }: { utilisateur_id: number },
      context: GraphQLContext
    ) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirProgressionUtilisateur(utilisateur_id);
      } catch (error) {
        console.error(`[Statistiques] Erreur lors de la récupération de la progression de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer la progression de l\'utilisateur');
      }
    },

    /**
     * Obtenir les présences par mois pour un utilisateur
     */
    presenceParMois: async (
      _: any,
      { utilisateur_id }: { utilisateur_id: number },
      context: GraphQLContext
    ) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirPresenceParMois(utilisateur_id);
      } catch (error) {
        console.error(`[Statistiques] Erreur lors de la récupération des présences par mois pour l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les présences par mois');
      }
    },

    /**
     * Obtenir les présences non validées par mois
     */
    presencesNonValideesParMois: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirPresencesNonValideesParMois();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des présences non validées par mois:', error);
        throw new Error('Impossible de récupérer les présences non validées');
      }
    },

    /**
     * Obtenir les statistiques de présence par mois
     */
    statistiquesPresenceParMois: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirStatistiquesPresenceParMois();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques de présence par mois:', error);
        throw new Error('Impossible de récupérer les statistiques de présence par mois');
      }
    },

    /**
     * Obtenir le nombre total de membres
     */
    nombreMembres: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getNombreMembres();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du nombre de membres:', error);
        return 0;
      }
    },

    /**
     * Obtenir le montant total des paiements du mois en cours
     */
    totalPaiementsMois: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getTotalPaiementsMois();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du total des paiements du mois:', error);
        return 0;
      }
    },

    /**
     * Obtenir le nombre de paiements récents (7 derniers jours)
     */
    paiementsRecents: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getPaiementsRecents();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des paiements récents:', error);
        return 0;
      }
    },

    /**
     * Obtenir le nombre de paiements en attente
     */
    paiementsEnAttente: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getPaiementsEnAttente();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des paiements en attente:', error);
        return 0;
      }
    },

    /**
     * Obtenir le nombre de plans tarifaires actifs
     */
    plansActifs: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getPlansActifs();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du nombre de plans actifs:', error);
        return 0;
      }
    },

    /**
     * Obtenir le taux de renouvellement des abonnements
     */
    tauxRenouvellement: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getTauxRenouvellement();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du taux de renouvellement:', error);
        return 0;
      }
    },

    /**
     * Obtenir les paiements par mois (12 derniers mois)
     */
    paiementsParMois: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getPaiementsParMois();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des paiements par mois:', error);
        throw new Error('Impossible de récupérer les paiements par mois');
      }
    },

    /**
     * Obtenir les membres par plan tarifaire
     */
    membresParPlan: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getMembresParPlan();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des membres par plan:', error);
        throw new Error('Impossible de récupérer les membres par plan');
      }
    },

    /**
     * Obtenir les derniers paiements
     */
    derniersPaiements: async (_: any, { limite = 10 }: { limite?: number }, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getDerniersPaiements(limite);
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des derniers paiements:', error);
        throw new Error('Impossible de récupérer les derniers paiements');
      }
    },

    /**
     * Obtenir les paiements échus (en retard)
     */
    paiementsEchus: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getPaiementsEchus();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des paiements échus:', error);
        throw new Error('Impossible de récupérer les paiements échus');
      }
    },

    /**
     * Obtenir les nouveaux membres (30 derniers jours)
     */
    nouveauxMembres: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getNouveauxMembres();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des nouveaux membres:', error);
        throw new Error('Impossible de récupérer les nouveaux membres');
      }
    },

    /**
     * Obtenir le top des membres les plus assidus
     */
    topMembresAssidus: async (_: any, { limite = 10 }: { limite?: number }, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getTopMembresAssidus(limite);
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du top des membres assidus:', error);
        throw new Error('Impossible de récupérer le top des membres assidus');
      }
    },

    /**
     * Obtenir les membres par grade
     */
    membresParGrade: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getMembresParGrade();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des membres par grade:', error);
        throw new Error('Impossible de récupérer les membres par grade');
      }
    },

    /**
     * Obtenir les membres par genre
     */
    membresParGenre: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getMembresParGenre();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des membres par genre:', error);
        throw new Error('Impossible de récupérer les membres par genre');
      }
    },

    /**
     * Obtenir les prochains anniversaires (30 prochains jours)
     */
    prochainsAnniversaires: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getProchainsAnniversaires();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des prochains anniversaires:', error);
        throw new Error('Impossible de récupérer les prochains anniversaires');
      }
    },

    /**
     * Obtenir les articles les plus vendus
     */
    articlesPlusVendus: async (_: any, { limite = 10 }: { limite?: number }, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getArticlesPlusVendus(limite);
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des articles les plus vendus:', error);
        throw new Error('Impossible de récupérer les articles les plus vendus');
      }
    },

    /**
     * Obtenir les cours de la semaine en cours
     */
    coursSemaine: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.getCoursSemaine();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des cours de la semaine:', error);
        throw new Error('Impossible de récupérer les cours de la semaine');
      }
    },

    /**
     * Obtenir l'évolution des inscriptions (12 derniers mois)
     */
    evolutionInscriptions: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();
        return await client.obtenirEvolutionInscriptions();
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération de l\'évolution des inscriptions:', error);
        throw new Error('Impossible de récupérer l\'évolution des inscriptions');
      }
    },

    /**
     * Obtenir le dashboard global (métriques consolidées)
     */
    dashboardGlobal: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();

        const [
          nombreMembres,
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          plansActifs,
          tauxRenouvellement,
          statistiquesGenerales,
        ] = await Promise.all([
          client.getNombreMembres(),
          client.getTotalPaiementsMois(),
          client.getPaiementsRecents(),
          client.getPaiementsEnAttente(),
          client.getPlansActifs(),
          client.getTauxRenouvellement(),
          client.obtenirStatistiquesGenerales(),
        ]);

        return {
          nombreMembres,
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          plansActifs,
          tauxRenouvellement,
          statistiquesGenerales,
        };
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération du dashboard global:', error);
        throw new Error('Impossible de récupérer le dashboard global');
      }
    },

    /**
     * Obtenir les statistiques de paiements consolidées
     */
    statistiquesPaiementsConsolidees: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();

        const [
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          tauxRenouvellement,
          paiementsParMois,
          derniersPaiements,
          paiementsEchus,
        ] = await Promise.all([
          client.getTotalPaiementsMois(),
          client.getPaiementsRecents(),
          client.getPaiementsEnAttente(),
          client.getTauxRenouvellement(),
          client.getPaiementsParMois(),
          client.getDerniersPaiements(10),
          client.getPaiementsEchus(),
        ]);

        return {
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          tauxRenouvellement,
          paiementsParMois,
          derniersPaiements,
          paiementsEchus,
        };
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques de paiements consolidées:', error);
        throw new Error('Impossible de récupérer les statistiques de paiements');
      }
    },

    /**
     * Obtenir les statistiques de membres consolidées
     */
    statistiquesMembresConsolidees: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();

        const [
          nombreTotal,
          nouveauxMembres,
          topMembresAssidus,
          membresParGrade,
          membresParGenre,
          membresParPlan,
        ] = await Promise.all([
          client.getNombreMembres(),
          client.getNouveauxMembres(),
          client.getTopMembresAssidus(10),
          client.getMembresParGrade(),
          client.getMembresParGenre(),
          client.getMembresParPlan(),
        ]);

        return {
          nombreTotal,
          nouveauxMembres,
          topMembresAssidus,
          membresParGrade,
          membresParGenre,
          membresParPlan,
        };
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques de membres consolidées:', error);
        throw new Error('Impossible de récupérer les statistiques de membres');
      }
    },

    /**
     * Obtenir les statistiques de cours consolidées
     */
    statistiquesCoursConsolidees: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const client = getStatistiquesClient();

        const [
          statistiquesParCours,
          statistiquesPresence,
          coursSemaine,
          evolutionInscriptions,
        ] = await Promise.all([
          client.obtenirStatistiquesParCours(),
          client.obtenirStatistiquesPresence(),
          client.getCoursSemaine(),
          client.obtenirEvolutionInscriptions(),
        ]);

        // Ajouter le calcul du taux de présence en pourcentage
        const statistiquesPresenceAvecPct = statistiquesPresence.map((stat: any) => ({
          ...stat,
          taux_presence_pct: stat.total_inscrits > 0
            ? (stat.presents / stat.total_inscrits) * 100
            : 0,
        }));

        return {
          statistiquesParCours,
          statistiquesPresence: statistiquesPresenceAvecPct,
          coursSemaine,
          evolutionInscriptions,
        };
      } catch (error) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques de cours consolidées:', error);
        throw new Error('Impossible de récupérer les statistiques de cours');
      }
    },
  },
};
