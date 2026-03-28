/**
 * Validators Index
 * Exports centralisés de tous les validators Zod
 */

// Common validators
export * from "./common/common.validators.js";

// User validators
export * from "./users/user.validators.js";

// Auth validators
export * from "./users/auth.validators.js";

// Course validators
export * from "./courses/index.js";

// Payment validators
export * from "./payments/index.js";

// Store validators
export * from "./store/index.js";

// Messaging validators
export * from "./messaging/index.js";

// Groups validators
export * from "./groups/index.js";

// Statistics validators
export * from "./statistics/index.js";

// Lookup validators
export * from "./lookup/index.js";

/**
 * Re-export des types inférés les plus utilisés
 */
export type {
  PaginationParams,
  PaginationQueryParams,
  SearchQuery,
  SortOrder,
} from "./common/common.validators.js";

export type {
  CreateUserInput,
  UpdateUserInput,
  SoftDeleteUserInput,
  RestoreUserInput,
  UpdatePasswordInput,
  UpdateEmailInput,
  UpdateProfileInput,
  AnonymizeUserInput,
} from "./users/user.validators.js";

export type {
  LoginInput,
  LoginByUserIdInput,
  RegisterInput,
  RegisterWithConfirmInput,
  ValidateEmailTokenInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  PasswordResetWithConfirmInput,
  ChangePasswordInput,
  SearchUserByEmailInput,
  VerifyUserExistsInput,
  RefreshTokenInput,
  VerifyJwtInput,
  LogoutInput,
  ResendEmailValidationInput,
} from "./users/auth.validators.js";

export type {
  CreateCourseRecurrentInput,
  UpdateCourseRecurrentInput,
  AssignProfessorInput,
  UnassignProfessorInput,
  SearchCourseRecurrentInput,
  ToggleCourseRecurrentInput,
  CreateCourseInput,
  UpdateCourseInput,
  CancelCourseInput,
  SearchCourseInput,
  DuplicateCourseInput,
  GenerateCoursesFromRecurrentInput,
  CreateProfessorInput,
  UpdateProfessorInput,
  SearchProfessorInput,
  ToggleProfessorInput,
  GetProfessorCoursesInput,
  CreateInscriptionInput,
  UpdateInscriptionInput,
  UpdatePresenceInput,
  BulkCreateInscriptionInput,
  SearchInscriptionInput,
  CancelInscriptionInput,
  GetUserInscriptionsInput,
  GetCourseInscriptionsInput,
  BulkUpdatePresenceInput,
  CreateReservationInput,
  CancelReservationInput,
  SearchReservationInput,
  CheckAvailabilityInput,
  GetUserReservationsInput,
  GetCourseReservationsInput,
  ConvertReservationToInscriptionInput,
  CheckReservationConflictInput,
} from "./courses/index.js";

export type {
  CreatePaymentInput,
  UpdatePaymentInput,
  RefundPaymentInput,
  SearchPaymentInput,
  StripePaymentIntentInput,
  CreatePaymentScheduleInput,
  UpdatePaymentScheduleInput,
  BulkCreatePaymentScheduleInput,
  SearchPaymentScheduleInput,
  MarkAsPaidInput,
  CreatePricingPlanInput,
  UpdatePricingPlanInput,
  SearchPricingPlanInput,
  TogglePricingPlanInput,
} from "./payments/index.js";

export type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQuery,
  CreateSizeInput,
  UpdateSizeInput,
  SizeQuery,
  CreateArticleInput,
  UpdateArticleInput,
  ArticleQuery,
  CreateImageInput,
  UpdateImageInput,
  CreateStockInput,
  UpdateStockInput,
  StockQuery,
  AdjustStockInput,
  SetStockQuantityInput,
  CreateOrderInput,
  UpdateOrderInput,
  OrderQuery,
  UpdateOrderStatusInput,
  CancelOrderInput,
  CreateOrderItemInput,
  UpdateOrderItemInput,
  OrderItemQuery,
  AddOrderItemsInput,
  CreateStockMovementInput,
  StockMovementQuery,
  RecordStockAdjustmentInput,
  RecordOrderMovementInput,
  RecordDeliveryMovementInput,
  RecordInventoryMovementInput,
} from "./store/index.js";

export type {
  CreateMessage,
  UpdateMessage,
  ListMessagesQuery,
  MessageInboxQuery,
  MessageOutboxQuery,
  BulkMarkRead,
  BulkDeleteMessages,
  CreateMessageStatus,
  UpdateMessageStatus,
  ListMessageStatusesQuery,
  CreateNotification,
  UpdateNotification,
  ListNotificationsQuery,
  UserNotificationsQuery,
  BulkMarkReadNotifications,
  BulkDeleteNotifications,
  MarkAllRead,
  CreateAlertType,
  UpdateAlertType,
  ListAlertTypesQuery,
  AlertTypesBySeverityQuery,
  CreateUserAlert,
  UpdateUserAlert,
  ResolveAlert,
  IgnoreAlert,
  ListUserAlertsQuery,
  ActiveAlertsQuery,
  ResolvedAlertsQuery,
  BulkMarkReadAlerts,
  BulkResolveAlerts,
  CreateAlertAction,
  ListAlertActionsQuery,
  AlertHistoryQuery,
  ActionsByTypeQuery,
  ActionsByUserQuery,
  CreateCustomMessageType,
  UpdateCustomMessageType,
  ListCustomMessageTypesQuery,
  ActiveCustomMessageTypesQuery,
  CreateCustomMessage,
  UpdateCustomMessage,
  ListCustomMessagesQuery,
  ActiveCustomMessagesByTypeQuery,
  ActiveCustomMessagesQuery,
  BulkToggleCustomMessages,
  RenderTemplate,
} from "./messaging/index.js";

export type {
  CreateGroup,
  UpdateGroup,
  ListGroupsQuery,
  AssignUserToGroup,
  UnassignUserFromGroup,
  ListGroupUsersQuery,
  ListUserGroupsQuery,
  BulkAssignUsers,
  BulkUnassignUsers,
} from "./groups/index.js";

export type {
  CreateStatistic,
  CreateStatisticWithJson,
  UpdateStatistic,
  ListStatisticsQuery,
  StatisticsByTypeQuery,
  StatisticsByDateRangeQuery,
  BulkCreateStatistics,
  BulkDeleteStatistics,
  CreateInformation,
  UpdateInformation,
  ListInformationsQuery,
  GetInformationByKey,
  BulkUpsertInformations,
  BulkDeleteInformations,
} from "./statistics/index.js";

export type {
  CreateGenre,
  UpdateGenre,
  ListGenresQuery,
  CreateGrade,
  UpdateGrade,
  ListGradesQuery,
  GradesByOrderRangeQuery,
  CreateStatus,
  UpdateStatus,
  ListStatusesQuery,
} from "./lookup/index.js";
