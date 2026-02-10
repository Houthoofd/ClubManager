/**
 * Exports du module alertes
 * ✅ MIGRÉ : REST routes + GraphQL resolvers + typedefs
 */

// ✅ Routes REST
export { default as alertesRouter } from "./alertes.routes.js";

// ✅ GraphQL Resolvers
export {
  alertesResolvers,
  default as defaultAlertesResolvers,
} from "./core/resolvers/alertes.resolvers.js";

// ✅ GraphQL TypeDefs
export {
  alertesTypeDefs,
  default as defaultAlertesTypeDefs,
} from "./core/resolvers/alertes.typedefs.js";

// ✅ Services (réutilisables)
export * from "./core/services/alertes.service.js";
