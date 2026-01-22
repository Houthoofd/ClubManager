/**
 * Multi-Tenant Architecture Strategy
 *
 * Nous utilisons une approche "Row Level Security" (RLS) avec isolation par tenantId
 * Chaque table contient une colonne tenantId qui isole les données
 */
export {};
// Recommandation: SHARED_DATABASE pour commencer, migration possible plus tard
