/**
 * Index des handlers du module échéances
 * Exporte tous les handlers pour faciliter les imports
 */

export { getEcheancesUtilisateur } from './get-echeances.handler.js';
export {
  getEcheanceDetail,
  getEcheanceCompat,
} from './get-echeance-detail.handler.js';
export { createEcheance } from './create-echeance.handler.js';
export { updateEcheance } from './update-echeance.handler.js';
export { deleteEcheance } from './delete-echeance.handler.js';
export {
  getStatistiquesUtilisateur,
  getDiagnosticEcheance,
  getDebugEcheancesUtilisateur,
} from './get-stats.handler.js';
export {
  healthCheck,
  getDiagnostic,
  getTableConstraints,
} from './health.handler.js';
