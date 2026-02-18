/**
 * 📦 Generators Index - ClubManager API
 *
 * Point d'entrée centralisé pour tous les générateurs
 */

export { generateRoute, routeExists, listRoutes } from './route-generator.js';
export {
  generateTests,
  testsExist,
  listTestedDomains,
  TEST_TYPES,
} from './test-generator.js';

export default {
  // Route Generator
  generateRoute,
  routeExists,
  listRoutes,

  // Test Generator
  generateTests,
  testsExist,
  listTestedDomains,
  TEST_TYPES,
};
