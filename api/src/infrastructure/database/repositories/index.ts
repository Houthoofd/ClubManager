/**
 * Point d'entrée centralisé pour tous les repositories
 *
 * Ce fichier permet d'importer facilement tous les repositories depuis un seul endroit.
 * Exemple d'utilisation:
 *
 * import { UserRepository, CoursRepository, InscriptionRepository } from '@/infrastructure/database/repositories';
 */

// Repository Utilisateur
export { UserRepository } from './UserRepository.js';

// Repositories Module Cours
export { CoursRepository } from './CoursRepository.js';
export { CoursRecurrentRepository } from './CoursRecurrentRepository.js';
export { InscriptionRepository } from './InscriptionRepository.js';
