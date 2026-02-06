/**
 * Index des handlers du module statistiques
 * Exporte tous les handlers pour faciliter les imports
 */

// Handlers de fréquentation et progression
export {
  getFrequentation,
  getProgression,
  getPresence,
  getPresenceRaw,
} from './frequentation.handler.js';

// Handlers de statistiques globales
export {
  getMembresCount,
  getPaiementsMois,
  getPaiementsRecentsHandler,
  getPaiementsEnAttenteHandler,
  getPlansActifsHandler,
  getTauxRenouvellementHandler,
  getPaiementsParMoisHandler,
  getMembresParPlanHandler,
  getCoursSemaineHandler,
} from './globales.handler.js';

// Handlers de statistiques détaillées
export {
  getDerniersPaiementsHandler,
  getPaiementsEchusHandler,
  getNouveauxMembresHandler,
  getTopMembresAssidusHandler,
  getMembresParGradeHandler,
  getMembresParGenreHandler,
  getProchainsAnniversairesHandler,
  getArticlesPlusVendusHandler,
} from './details.handler.js';

// Handlers système (health et diagnostic)
export {
  healthCheck,
  getDiagnostic,
} from './health.handler.js';
