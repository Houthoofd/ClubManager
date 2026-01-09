/**
 * Point d'entrée pour les services Auth
 * Barrel export pour faciliter les imports
 */

// Services spécialisés
export { AccountService } from './accountService.js';
export { PasswordRecoveryService } from './passwordRecoveryService.js';
export { SecurityService } from './securityService.js';

// Export par défaut pour rétrocompatibilité
export { SecurityService as AuthService } from './securityService.js';
