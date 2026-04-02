/**
 * @fileoverview Groups DTOs
 * @module @clubmanager/types/dtos/groups
 *
 * Data Transfer Objects for the Groups module.
 * Re-exports types from validators for API request/response structures.
 */

// ============================================================================
// GROUP DTOs
// ============================================================================

export type {
  CreateGroup,
  UpdateGroup,
  GroupResponse,
  GroupsListResponse,
  GroupStats,
  ListGroupsQuery,
} from "../../validators/groups/group.validators.js";

// ============================================================================
// GROUP USER DTOs
// ============================================================================

export type {
  AssignUserToGroup,
  UnassignUserFromGroup,
  GroupUserResponse,
  GroupUsersListResponse,
  UserGroupsListResponse,
  ListGroupUsersQuery,
  ListUserGroupsQuery,
  BulkAssignUsers,
  BulkUnassignUsers,
} from "../../validators/groups/group-user.validators.js";
