/**
 * API Response Types
 *
 * Types for API requests and responses used in front-end/back-end communication.
 * These types extend the domain types with API-specific structures.
 */

import type {
  Users,
  UsersInsert,
  UsersUpdate,
  UserProfiles,
  AuthTokens,
  LoginCredentials,
  LoginResponse,
} from "../domains/users/users.types.js";
import type {
  Sessions,
  Instructors,
  SessionsInsert,
} from "../domains/sessions/sessions.types.js";
import type {
  Products,
  ProductsInsert,
  ProductsUpdate,
  ProductCategories,
  Orders,
  OrdersInsert,
  OrderItems,
  PaymentMethod,
  StripePaymentIntent,
} from "../domains/shop/shop.types.js";

// ============================================================================
// RE-EXPORT BASE TYPES FOR CONVENIENCE
// ============================================================================

// User types
export type {
  Users,
  UsersInsert,
  UsersUpdate,
  UserProfiles,
  AuthTokens,
  LoginCredentials,
  LoginResponse,
};

// Session types
export type { Sessions, SessionsInsert, Instructors };

// Shop types
export type {
  Products,
  ProductsInsert,
  ProductsUpdate,
  ProductCategories,
  Orders,
  OrdersInsert,
  OrderItems,
  PaymentMethod,
  StripePaymentIntent,
};

// ============================================================================
// AUTHENTICATION API TYPES
// ============================================================================

export type AuthStatusResponse = {
  authentifie: boolean;
  user: Users | null;
};

export type LoginApiResponse = {
  success: boolean;
  user: Users;
  tokens?: AuthTokens;
  message?: string;
};

export type LogoutApiResponse = {
  success: boolean;
  message: string;
};

export type RegisterApiResponse = {
  success: boolean;
  user: Users;
  message?: string;
};

// ============================================================================
// COURSE/SESSION API TYPES
// ============================================================================

export type CourseData = {
  id?: number;
  jour_semaine?: string;
  heure_debut: string;
  heure_fin: string;
  professeur_id: number;
  sport_id?: number;
  nom?: string;
  description?: string;
  max_participants?: number;
  [key: string]: unknown;
};

export type CourseEnrollmentData = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type CourseEnrollmentResponse = {
  success: boolean;
  message: string;
};

export type ProfesseurListResponse = {
  data: Instructors[];
  total?: number;
};

export type CourseInstanceWithDetails = Sessions & {
  professeur_nom?: string;
  professeur_prenom?: string;
  sport_nom?: string;
  participants_actuels?: number;
};

// ============================================================================
// SHOP/PRODUCT API TYPES
// ============================================================================

export type ArticleWithCategory = Products & {
  categorie_nom?: string;
  taille?: {
    id: number;
    taille_name: string;
  };
  quantite?: number;
};

export type CartArticle = {
  id: number;
  nom: string;
  prix: number;
  taille?: {
    id: number;
    taille_name: string;
  };
  quantite: number;
  image_url?: string;
};

export type ProductCategoriesResponse = {
  [categoryName: string]: Products[];
};

export type OrderCreateResponse = {
  success: boolean;
  order: Orders;
  message?: string;
};

export type PaymentIntentResponse = {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
};

// ============================================================================
// USER/PROFILE API TYPES
// ============================================================================

export type UserProfileResponse = Users & {
  profile?: UserProfiles;
};

export type UserListResponse = {
  data: Users[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type UserUpdateResponse = {
  success: boolean;
  user: Users;
  message?: string;
};

// ============================================================================
// MESSAGING API TYPES
// ============================================================================

export type UnreadMessagesResponse = {
  count: number;
  messages?: Array<{
    id: number;
    subject?: string;
    sender_name?: string;
    created_at: string;
  }>;
};

// ============================================================================
// DASHBOARD/STATISTICS API TYPES
// ============================================================================

export type DashboardStats = {
  totalUsers?: number;
  totalCourses?: number;
  totalOrders?: number;
  revenue?: number;
  activeMembers?: number;
  upcomingSessions?: number;
  [key: string]: unknown;
};

export type ChartDataPoint = {
  name: string;
  value: number;
  date?: string;
  [key: string]: unknown;
};

export type ChartData = ChartDataPoint[];

// ============================================================================
// GENERIC API RESPONSE WRAPPERS
// ============================================================================

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type PaginatedApiResponse<T> = {
  success: true;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ============================================================================
// MUTATION/ACTION RESPONSE TYPES
// ============================================================================

export type MutationResponse = {
  success: boolean;
  message: string;
  id?: number;
};

export type DeleteResponse = {
  success: boolean;
  message: string;
  deletedId?: number;
};

export type BatchMutationResponse = {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: string[];
};

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationState = {
  [key: string]: {
    isValid: boolean;
    message: string;
    validated: "success" | "warning" | "error" | "default";
  };
};

export type FormValidationError = {
  field: string;
  message: string;
  code?: string;
};

export type FormValidationResponse = {
  valid: boolean;
  errors?: FormValidationError[];
};

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export type FileUploadResponse = {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
};

export type MultiFileUploadResponse = {
  success: boolean;
  files: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  errors?: string[];
};
