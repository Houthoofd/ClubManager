/**
 * @fileoverview Groups Validators Index
 * @module @clubmanager/types/validators/groups
 *
 * Exports all group and group-user validators and types.
 */

// Group validators
export {
  groupBaseSchema,
  createGroupSchema,
  updateGroupSchema,
  listGroupsSchema,
  groupIdSchema,
  groupIdStringSchema,
  groupIdParamSchema,
  groupResponseSchema,
  groupsListResponseSchema,
  groupStatsSchema,
  type Group,
  type CreateGroup,
  type UpdateGroup,
  type ListGroupsQuery,
  type GroupIdParam,
  type GroupResponse,
  type GroupsListResponse,
  type GroupStats,
  type GroupSortBy,
} from "./group.validators.js";

// Group-User validators
export {
  groupUserBaseSchema,
  assignUserToGroupSchema,
  unassignUserFromGroupSchema,
  bulkAssignUsersSchema,
  bulkUnassignUsersSchema,
  listGroupUsersSchema,
  listUserGroupsSchema,
  groupUserResponseSchema,
  groupUsersListResponseSchema,
  userGroupsListResponseSchema,
  bulkOperationResponseSchema,
  type GroupUser,
  type AssignUserToGroup,
  type UnassignUserFromGroup,
  type BulkAssignUsers,
  type BulkUnassignUsers,
  type ListGroupUsersQuery,
  type ListUserGroupsQuery,
  type GroupUserResponse,
  type GroupUsersListResponse,
  type UserGroupsListResponse,
  type BulkOperationResponse,
  type GroupUserSortBy,
  type UserGroupSortBy,
} from "./group-user.validators.js";
