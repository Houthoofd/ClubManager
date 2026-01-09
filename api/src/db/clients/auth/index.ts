/**
 * Point d'entrée du module Auth
 * Barrel export pour faciliter les imports
 */

// Classe principale
export { Auth } from './auth.js';

// Repository et Service (pour usage avancé ou tests)
export { AuthRepository } from './auth.repository.js';
export { AuthService } from '../../../services/authService.js';

// Utilitaires
export { AuthUtils } from './utils.js';

// Types et interfaces
export * from './types.js';

// Export par défaut pour rétrocompatibilité
export { Auth as default } from './auth.js';
