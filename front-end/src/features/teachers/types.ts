// ============================================================================
// Teachers Feature Types
// ============================================================================

/**
 * Teacher/Instructor
 * Représente un professeur dans le système
 */
export interface Teacher {
  id: number;
  user_id: number;
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Planning Course for Teacher
 * Représente un cours dans le planning d'un professeur
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
 * User pour promotion
 * Représente un utilisateur qui peut être promu professeur
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
 * Teacher List Item
 * Représente un professeur dans une liste
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

/**
 * Input pour créer un professeur
 */
export interface CreateTeacherInput {
  user_id: number;
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
}

/**
 * Input pour mettre à jour un professeur
 */
export interface UpdateTeacherInput {
  specialization?: string;
  bio?: string;
  certifications?: string;
  active?: boolean;
}

/**
 * Résultat de promotion de professeur
 */
export interface PromotionResult {
  success: boolean;
  message: string;
  isConfirm?: boolean;
  teachers?: Teacher[];
}

/**
 * Input pour promotion de professeurs
 */
export interface PromoteTeachersInput {
  users: UserForPromotion[];
}

/**
 * Input pour retirer la promotion
 */
export interface RemovePromotionInput {
  id: number;
  status_id: number;
}

/**
 * Résultat de vérification de professeur
 */
export interface VerifyTeachersResult {
  professeurs: Array<{
    id?: number;
    nom: string;
    prenom: string;
    isProf: boolean;
  }>;
}

/**
 * Input pour vérification de professeurs
 */
export interface VerifyTeachersInput {
  users: Array<{
    nom: string;
    prenom: string;
  }>;
}

/**
 * Statistiques du planning
 */
export interface PlanningStatistics {
  totalCourses: number;
  coursesParJour: Record<string, number>;
  heuresMoyennes: number;
  joursActifs: number;
}

/**
 * Filtre de planning
 */
export interface PlanningFilter {
  jour?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

/**
 * État de la page de gestion des professeurs
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
  teacherToRemove: Teacher | null;
  showResultModal: boolean;
  resultModalMessage: string;
  resultModalSuccess: boolean;
}

/**
 * État de la page de planning
 */
export interface PlanningPageState {
  activeTabKey: number;
  filtreJour: string;
  showResultModal: boolean;
  resultModalMessage: string;
  resultModalSuccess: boolean;
}

/**
 * Props pour les composants de liste de professeurs
 */
export interface TeachersListProps {
  teachers: TeacherListItem[];
  onEdit?: (teacher: TeacherListItem) => void;
  onRemove?: (teacher: TeacherListItem) => void;
  isLoading?: boolean;
}

/**
 * Props pour le composant de sélection d'utilisateurs
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
 * Props pour le planning grid
 */
export interface PlanningGridProps {
  cours: PlanningCourse[];
  filtreJour: string;
  onEdit?: (course: PlanningCourse) => void;
  onDelete?: (course: PlanningCourse) => void;
}

/**
 * Props pour le filtre de planning
 */
export interface PlanningFilterProps {
  filtreJour: string;
  onFilterSelect: (jour: string) => void;
}

/**
 * Props pour les statistiques de planning
 */
export interface PlanningStatisticsProps {
  cours: PlanningCourse[];
}
