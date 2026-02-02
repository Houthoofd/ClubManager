/**
 * GraphQL Resolvers pour les Alertes
 */

import { alertesService } from './alertes.service.js';

export const alertesResolvers = {
  Query: {
    dashboardAlertes: async () => {
      return await alertesService.obtenirDashboardAlertes();
    },

    alertesActives: async () => {
      return await alertesService.obtenirAlertesActives();
    },

    alertesUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
      return await alertesService.obtenirAlertesUtilisateur(utilisateurId);
    },

    statistiquesAlertes: async () => {
      return await alertesService.obtenirStatistiquesAlertes();
    },
  },

  Mutation: {
    detecterAlertes: async () => {
      return await alertesService.detecterAlertes();
    },

    resoudreAlerte: async (_: any, { input }: any) => {
      return await alertesService.resoudreAlerte(input);
    },

    ignorerAlerte: async (_: any, { input }: any) => {
      return await alertesService.ignorerAlerte(input);
    },

    creerAlerte: async (_: any, { input }: any) => {
      return await alertesService.creerAlerte(input);
    },
  },
};
