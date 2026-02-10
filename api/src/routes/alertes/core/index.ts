/**
 * Exports du core alertes
 * ✅ MIGRÉ : Exports pour REST handlers, GraphQL resolvers, services et typedefs
 */

// ✅ Handlers REST
export * from "./handlers/alertes.handlers.js";

// ✅ Services (partagés entre REST et GraphQL)
export * from "./services/alertes.service.js";

// ✅ Resolvers GraphQL
export * from "./resolvers/alertes.resolvers.js";

// ✅ TypeDefs GraphQL
export * from "./resolvers/alertes.typedefs.js";
