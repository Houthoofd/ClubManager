/**
 * User Hooks - Barrel Export
 *
 * Centralized export point for all user-related hooks
 */

// Legacy hooks
export { useUsers, useUserById, useAllUsers } from "./useUtilisateurs";

// New business hooks
export * from "./useUserSearch";
export * from "./useUserFilter";
