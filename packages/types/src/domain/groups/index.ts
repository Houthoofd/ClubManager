/**
 * @fileoverview Groups Domain Types
 * @module @clubmanager/types/domain/groups
 *
 * Domain types for the Groups module.
 * Re-exports types inferred from Zod validators for consistency.
 */

// ============================================================================
// GROUP TYPES
// ============================================================================

export type {
  Group,
  CreateGroup,
  UpdateGroup,
  GroupResponse,
  GroupsListResponse,
  GroupStats,
} from '../../validators/groups/group.validators.js';

// ============================================================================
// GROUP USER TYPES
// ============================================================================

export type {
  GroupUser,
  AssignUserToGroup,
  UnassignUserFromGroup,
  GroupUserResponse,
  GroupUsersListResponse,
  UserGroupsListResponse,
  GroupUserStats,
} from '../../validators/groups/group-user.validators.js';
