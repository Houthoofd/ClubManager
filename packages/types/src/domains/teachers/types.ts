/**
 * Teachers Domain Types
 *
 * TypeScript types for teachers/instructors domain including database entities,
 * API operations, and business logic types.
 */

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * Teacher/Instructor entity
 */
export interface Teachers {
  id: number;
  user_id: number;
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Teacher with user information
 */
export interface TeachersWithUser extends Teachers {
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Teacher list item
 */
export interface TeacherListItem {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialization?: string;
  bio?: string;
  certifications?: string;
  active: boolean;
  courses_count?: number;
  hire_date?: string;
}

// ============================================================================
// PLANNING & COURSES
// ============================================================================

/**
 * Planning course for teacher
 */
export interface PlanningCourse {
  id: number;
  course_id: number;
  course_nom?: string;
  course_description?: string;
  professeur_id: number;
  professeur_nom?: string;
  professeur_prenom?: string;
  jour_semaine: number | string;
  heure_debut: string;
  heure_fin: string;
  lieu?: string;
  capacite_max?: number;
  inscrits_count?: number;
  active?: boolean;
}

/**
 * Planning statistics
 */
export interface PlanningStatistics {
  totalCourses: number;
  coursesParJour: Record<string, number>;
  heuresMoyennes: number;
  joursActifs: number;
}

/**
 * Planning filter
 */
export interface PlanningFilter {
  jour?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

// ============================================================================
// USER PROMOTION
// ============================================================================

/**
 * User eligible for teacher promotion
 */
export interface UserForPromotion {
  id: number;
  first_name: string;
  last_name: string;
  nom?: string;
  prenom?: string;
  email: string;
  nom_utilisateur?: string;
  phone?: string;
  status_id?: number;
}

/**
 * Teacher promotion result
 */
export interface PromotionResult {
  success: boolean;
  message: string;
  isConfirm?: boolean;
  teachers?: Teachers[];
}

/**
 * Verify teachers result
 */
export interface VerifyTeachersResult {
  professeurs: Array<{
    id?: number;
    nom: string;
    prenom: string;
    isProf: boolean;
  }>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create teacher input
 */
export interface CreateTeacherInput {
  user_id: number;
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
}

/**
 * Update teacher input
 */
export interface UpdateTeacherInput {
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
}

/**
 * Promote teachers input
 */
export interface PromoteTeachersInput {
  users: UserForPromotion[];
}

/**
 * Remove promotion input
 */
export interface RemovePromotionInput {
  id: number;
  status_id: number;
}

/**
 * Verify teachers input
 */
export interface VerifyTeachersInput {
  users: Array<{
    nom: string;
    prenom: string;
  }>;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Teachers manage page state
 */
export interface TeachersManagePageState {
  activeTabKey: number;
  selectedUsers: UserForPromotion[];
  searchValue: string;
  showPromoteModal: boolean;
  promoteResult: PromotionResult | null;
  verifMessage: string | null;
  verifChecked: boolean;
  showRemoveModal: boolean;
  teacherToRemove: Teachers | null;
  showResultModal: boolean;
  resultModalMessage: string;
  resultModalSuccess: boolean;
}

/**
 * Planning page state
 */
export interface PlanningPageState {
  activeTabKey: number;
  filtreJour: string;
  showResultModal: boolean;
  resultModalMessage: string;
  resultModalSuccess: boolean;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Teachers list props
 */
export interface TeachersListProps {
  teachers: TeacherListItem[];
  onEdit?: (teacher: TeacherListItem) => void;
  onRemove?: (teacher: TeacherListItem) => void;
  isLoading?: boolean;
}

/**
 * User selection props
 */
export interface UserSelectionProps {
  users: UserForPromotion[];
  selectedUsers: UserForPromotion[];
  onSelect: (user: UserForPromotion) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
}

/**
 * Planning grid props
 */
export interface PlanningGridProps {
  cours: PlanningCourse[];
  filtreJour: string;
  onEdit?: (course: PlanningCourse) => void;
  onDelete?: (course: PlanningCourse) => void;
}

/**
 * Planning filter props
 */
export interface PlanningFilterProps {
  filtreJour: string;
  onFilterSelect: (jour: string) => void;
}

/**
 * Planning statistics props
 */
export interface PlanningStatisticsProps {
  cours: PlanningCourse[];
}

// ============================================================================
// API OPERATION TYPES
// ============================================================================

/**
 * Teachers filter options
 */
export interface TeachersFilterOptions {
  search?: string;
  active?: boolean;
  specialization?: string;
  hasCoursesOnly?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Teachers paginated result
 */
export interface TeachersPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Teachers mutation result
 */
export interface TeachersMutationResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Teacher status type
 */
export type TeacherStatus = "active" | "inactive" | "on_leave" | "retired";

/**
 * Teacher statistics
 */
export interface TeacherStatistics {
  total_teachers: number;
  active_teachers: number;
  total_courses: number;
  total_students: number;
  average_courses_per_teacher: number;
  by_specialization: Record<string, number>;
}
