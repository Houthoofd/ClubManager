/**
 * 📝 Templates Index - ClubManager API
 *
 * Point d'entrée centralisé pour tous les templates
 */

export {
  indexTemplate,
  resolversTemplate,
  resolversIndexTemplate,
  serviceTemplate,
  handlersTemplate,
  typesTemplate,
} from './route-templates.js';

export {
  unitServiceTestTemplate,
  unitResolverTestTemplate,
  integrationTestTemplate,
  securityTestTemplate,
  advancedTestTemplate,
  e2eTestTemplate,
  testIndexTemplate,
} from './test-templates.js';

export default {
  // Route Templates
  indexTemplate,
  resolversTemplate,
  resolversIndexTemplate,
  serviceTemplate,
  handlersTemplate,
  typesTemplate,

  // Test Templates
  unitServiceTestTemplate,
  unitResolverTestTemplate,
  integrationTestTemplate,
  securityTestTemplate,
  advancedTestTemplate,
  e2eTestTemplate,
  testIndexTemplate,
};
