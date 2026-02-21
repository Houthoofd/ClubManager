// ============================================================================
// Messages Feature Hooks - Barrel Export
// ============================================================================

/**
 * This file re-exports all message-related hooks from hooks-legacy
 */

// ============================================================================
// Business Logic Hooks (NEW - Modular Architecture)
// ============================================================================
export { useMessageSearch } from "./useMessageSearch";
export { useMessageTabs } from "./useMessageTabs";

// ============================================================================
// Legacy Hooks
// ============================================================================
export * from "../hooks-legacy";
