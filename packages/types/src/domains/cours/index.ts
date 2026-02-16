/**
 * Cours Domain
 */

// Base types
export * from "./types.js";

// Service types
export * from "./service.js";

// Validators (export all - no conflicts expected)
export * from "./validators.js";

// GraphQL
// export * from "./graphql.types.js"; // Importable directement si nécessaire
export { coursTypeDefs } from "./graphql.typedefs.js";
