/**
 * Point d'entrée du module Alertes
 * Barrel export pour faciliter les imports
 */

// Classe principale
export { Alerte } from './alertes.js';

// Repository et Service (pour usage avancé ou tests)
export { AlertesRepository } from './alertes.repository.js';
export { AlertesService } from '../../../services/alertesService.js';

// Types et interfaces
export * from './types.js';

// Export par défaut pour rétrocompatibilité
export { Alerte as default } from './alertes.js';
