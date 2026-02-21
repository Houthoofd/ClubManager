/**
 * ====================================================================
 * COURSE SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des cours/séances.
 * Gère la planification, les capacités, les inscriptions, etc.
 *
 * @module features/courses/services
 */

// ============================================================================
// Types
// ============================================================================

export interface Course {
  id: string;
  nom: string;
  description?: string;
  type: CourseType;
  niveau?: CourseLevel;
  professeur?: {
    id: string;
    nom: string;
    prenom: string;
  };
  duree: number; // en minutes
  capaciteMax: number;
  prixUnitaire: number;
  actif: boolean;
}

export interface Session {
  id: string;
  course: Course;
  date: string;
  heureDebut: string;
  heureFin: string;
  capaciteMax: number;
  nbInscrits: number;
  statut: SessionStatus;
  salle?: string;
  notes?: string;
}

export type CourseType = 'GROUP' | 'INDIVIDUAL' | 'WORKSHOP' | 'EVENT';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type SessionStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface SessionFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  professeurId?: string;
  type?: CourseType;
  niveau?: CourseLevel;
  statut?: SessionStatus;
  onlyAvailable?: boolean;
}

export interface SessionStats {
  totalSessions: number;
  scheduledSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageOccupancy: number;
  totalRevenue: number;
}

// ============================================================================
// Session Display & Formatting
// ============================================================================

/**
 * Formate l'heure d'une session (HH:MM)
 *
 * @param time - Heure au format ISO ou HH:MM
 * @returns Heure formatée
 *
 * @example
 * ```ts
 * formatSessionTime('2024-01-15T14:30:00Z')
 * // => "14:30"
 * ```
 */
export const formatSessionTime = (time: string): string => {
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) {
      // Si ce n'est pas une date ISO, retourne tel quel
      return time;
    }
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
};

/**
 * Formate la date d'une session
 *
 * @param date - Date ISO string
 * @returns Date formatée (ex: "15 janvier 2024")
 */
export const formatSessionDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formate la date courte d'une session
 *
 * @param date - Date ISO string
 * @returns Date formatée (ex: "15/01/2024")
 */
export const formatSessionDateShort = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
};

/**
 * Formate le créneau horaire complet
 *
 * @param session - Session
 * @returns Créneau formaté (ex: "14:30 - 16:00")
 */
export const formatSessionTimeSlot = (session: Pick<Session, 'heureDebut' | 'heureFin'>): string => {
  const debut = formatSessionTime(session.heureDebut);
  const fin = formatSessionTime(session.heureFin);
  return `${debut} - ${fin}`;
};

/**
 * Formate la durée d'une session
 *
 * @param duree - Durée en minutes
 * @returns Durée formatée (ex: "1h30")
 */
export const formatCourseDuration = (duree: number): string => {
  const hours = Math.floor(duree / 60);
  const minutes = duree % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

/**
 * Formate le statut d'une session
 *
 * @param statut - Statut de la session
 * @returns Label et variant pour affichage
 */
export const formatSessionStatus = (
  statut: SessionStatus
): { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' } => {
  const statusMap = {
    SCHEDULED: { label: 'Planifiée', variant: 'info' as const },
    ONGOING: { label: 'En cours', variant: 'warning' as const },
    COMPLETED: { label: 'Terminée', variant: 'success' as const },
    CANCELLED: { label: 'Annulée', variant: 'danger' as const },
  };

  return statusMap[statut] || { label: statut, variant: 'default' as const };
};

/**
 * Formate le niveau d'un cours
 *
 * @param niveau - Niveau du cours
 * @returns Label formaté
 */
export const formatCourseLevel = (niveau?: CourseLevel): string => {
  const levelMap = {
    BEGINNER: 'Débutant',
    INTERMEDIATE: 'Intermédiaire',
    ADVANCED: 'Avancé',
    ALL_LEVELS: 'Tous niveaux',
  };

  return niveau ? levelMap[niveau] || niveau : 'Non spécifié';
};

// ============================================================================
// Session Availability & Capacity
// ============================================================================

/**
 * Calcule le nombre de places disponibles
 *
 * @param session - Session
 * @returns Nombre de places restantes
 */
export const getAvailableSeats = (session: Session): number => {
  return Math.max(0, session.capaciteMax - session.nbInscrits);
};

/**
 * Calcule le taux de remplissage (%)
 *
 * @param session - Session
 * @returns Pourcentage de remplissage (0-100)
 */
export const getOccupancyRate = (session: Session): number => {
  if (session.capaciteMax === 0) return 0;
  return Math.round((session.nbInscrits / session.capaciteMax) * 100);
};

/**
 * Vérifie si une session est complète
 *
 * @param session - Session
 * @returns true si aucune place disponible
 */
export const isSessionFull = (session: Session): boolean => {
  return session.nbInscrits >= session.capaciteMax;
};

/**
 * Vérifie si une session est presque complète (> 80%)
 *
 * @param session - Session
 * @returns true si remplissage > 80%
 */
export const isSessionAlmostFull = (session: Session): boolean => {
  return getOccupancyRate(session) >= 80;
};

/**
 * Vérifie si un utilisateur peut s'inscrire à une session
 *
 * @param session - Session
 * @returns { canEnroll: boolean, reason?: string }
 */
export const canEnrollInSession = (session: Session): { canEnroll: boolean; reason?: string } => {
  // Vérifier si annulée
  if (session.statut === 'CANCELLED') {
    return { canEnroll: false, reason: 'Session annulée' };
  }

  // Vérifier si terminée
  if (session.statut === 'COMPLETED') {
    return { canEnroll: false, reason: 'Session terminée' };
  }

  // Vérifier si complète
  if (isSessionFull(session)) {
    return { canEnroll: false, reason: 'Session complète' };
  }

  // Vérifier si dans le passé
  if (isSessionInPast(session)) {
    return { canEnroll: false, reason: 'Session passée' };
  }

  return { canEnroll: true };
};

// ============================================================================
// Session Timing & Scheduling
// ============================================================================

/**
 * Vérifie si une session est dans le passé
 *
 * @param session - Session
 * @returns true si la session est passée
 */
export const isSessionInPast = (session: Session): boolean => {
  const sessionDate = new Date(`${session.date}T${session.heureDebut}`);
  return sessionDate < new Date();
};

/**
 * Vérifie si une session est aujourd'hui
 *
 * @param session - Session
 * @returns true si la session est aujourd'hui
 */
export const isSessionToday = (session: Session): boolean => {
  const sessionDate = new Date(session.date);
  const today = new Date();

  return (
    sessionDate.getDate() === today.getDate() &&
    sessionDate.getMonth() === today.getMonth() &&
    sessionDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si une session commence bientôt (< 1h)
 *
 * @param session - Session
 * @returns true si la session commence dans moins d'1h
 */
export const isSessionStartingSoon = (session: Session): boolean => {
  const sessionStart = new Date(`${session.date}T${session.heureDebut}`);
  const now = new Date();
  const diffMinutes = (sessionStart.getTime() - now.getTime()) / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= 60;
};

/**
 * Calcule la durée d'une session en minutes
 *
 * @param session - Session
 * @returns Durée en minutes
 */
export const getSessionDuration = (session: Session): number => {
  const debut = new Date(`${session.date}T${session.heureDebut}`);
  const fin = new Date(`${session.date}T${session.heureFin}`);

  return Math.round((fin.getTime() - debut.getTime()) / (1000 * 60));
};

/**
 * Vérifie si deux sessions se chevauchent
 *
 * @param session1 - Première session
 * @param session2 - Deuxième session
 * @returns true si les sessions se chevauchent
 */
export const doSessionsOverlap = (session1: Session, session2: Session): boolean => {
  const start1 = new Date(`${session1.date}T${session1.heureDebut}`);
  const end1 = new Date(`${session1.date}T${session1.heureFin}`);
  const start2 = new Date(`${session2.date}T${session2.heureDebut}`);
  const end2 = new Date(`${session2.date}T${session2.heureFin}`);

  return start1 < end2 && start2 < end1;
};

// ============================================================================
// Session Filtering & Sorting
// ============================================================================

/**
 * Filtre les sessions selon des critères
 *
 * @param sessions - Liste de sessions
 * @param filters - Critères de filtrage
 * @returns Liste filtrée
 */
export const filterSessions = (sessions: Session[], filters: SessionFilters): Session[] => {
  return sessions.filter((session) => {
    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const courseName = session.course.nom.toLowerCase();
      const teacherName = session.course.professeur
        ? `${session.course.professeur.prenom} ${session.course.professeur.nom}`.toLowerCase()
        : '';

      if (!courseName.includes(searchLower) && !teacherName.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par date
    if (filters.dateFrom) {
      if (new Date(session.date) < new Date(filters.dateFrom)) {
        return false;
      }
    }

    if (filters.dateTo) {
      if (new Date(session.date) > new Date(filters.dateTo)) {
        return false;
      }
    }

    // Filtre par professeur
    if (filters.professeurId && session.course.professeur?.id !== filters.professeurId) {
      return false;
    }

    // Filtre par type
    if (filters.type && session.course.type !== filters.type) {
      return false;
    }

    // Filtre par niveau
    if (filters.niveau && session.course.niveau !== filters.niveau) {
      return false;
    }

    // Filtre par statut
    if (filters.statut && session.statut !== filters.statut) {
      return false;
    }

    // Filtre par disponibilité
    if (filters.onlyAvailable && (isSessionFull(session) || isSessionInPast(session))) {
      return false;
    }

    return true;
  });
};

/**
 * Trie les sessions par date/heure
 *
 * @param sessions - Liste de sessions
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortSessionsByDate = (sessions: Session[], order: 'asc' | 'desc' = 'asc'): Session[] => {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heureDebut}`).getTime();
    const dateB = new Date(`${b.date}T${b.heureDebut}`).getTime();

    const comparison = dateA - dateB;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les sessions par taux de remplissage
 *
 * @param sessions - Liste de sessions
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortSessionsByOccupancy = (sessions: Session[], order: 'asc' | 'desc' = 'desc'): Session[] => {
  return [...sessions].sort((a, b) => {
    const occupancyA = getOccupancyRate(a);
    const occupancyB = getOccupancyRate(b);

    const comparison = occupancyA - occupancyB;
    return order === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// Session Statistics
// ============================================================================

/**
 * Calcule les statistiques des sessions
 *
 * @param sessions - Liste de sessions
 * @returns Statistiques agrégées
 */
export const calculateSessionStats = (sessions: Session[]): SessionStats => {
  const totalSessions = sessions.length;
  const scheduledSessions = sessions.filter((s) => s.statut === 'SCHEDULED').length;
  const completedSessions = sessions.filter((s) => s.statut === 'COMPLETED').length;
  const cancelledSessions = sessions.filter((s) => s.statut === 'CANCELLED').length;

  // Taux de remplissage moyen
  const averageOccupancy =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + getOccupancyRate(s), 0) / sessions.length)
      : 0;

  // Revenu total (sessions complétées uniquement)
  const totalRevenue = sessions
    .filter((s) => s.statut === 'COMPLETED')
    .reduce((sum, s) => sum + s.nbInscrits * s.course.prixUnitaire, 0);

  return {
    totalSessions,
    scheduledSessions,
    completedSessions,
    cancelledSessions,
    averageOccupancy,
    totalRevenue,
  };
};

/**
 * Groupe les sessions par date
 *
 * @param sessions - Liste de sessions
 * @returns Map de date -> sessions
 */
export const groupSessionsByDate = (sessions: Session[]): Record<string, Session[]> => {
  return sessions.reduce((acc, session) => {
    const dateKey = formatSessionDateShort(session.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);
};

/**
 * Groupe les sessions par professeur
 *
 * @param sessions - Liste de sessions
 * @returns Map de professeur -> sessions
 */
export const groupSessionsByTeacher = (sessions: Session[]): Record<string, Session[]> => {
  return sessions.reduce((acc, session) => {
    const teacherId = session.course.professeur?.id || 'unassigned';
    if (!acc[teacherId]) {
      acc[teacherId] = [];
    }
    acc[teacherId].push(session);
    return acc;
  }, {} as Record<string, Session[]>);
};

// ============================================================================
// Session Validation
// ============================================================================

/**
 * Valide qu'une session peut être annulée
 *
 * @param session - Session
 * @returns { valid: boolean, reason?: string }
 */
export const canCancelSession = (session: Session): { valid: boolean; reason?: string } => {
  if (session.statut === 'CANCELLED') {
    return { valid: false, reason: 'Session déjà annulée' };
  }

  if (session.statut === 'COMPLETED') {
    return { valid: false, reason: 'Session déjà terminée' };
  }

  if (isSessionInPast(session)) {
    return { valid: false, reason: 'Impossible d\'annuler une session passée' };
  }

  return { valid: true };
};

/**
 * Valide qu'une session peut être modifiée
 *
 * @param session - Session
 * @returns { valid: boolean, reason?: string }
 */
export const canEditSession = (session: Session): { valid: boolean; reason?: string } => {
  if (session.statut === 'COMPLETED') {
    return { valid: false, reason: 'Session déjà terminée' };
  }

  if (session.statut === 'CANCELLED') {
    return { valid: false, reason: 'Session annulée' };
  }

  if (isSessionInPast(session)) {
    return { valid: false, reason: 'Impossible de modifier une session passée' };
  }

  return { valid: true };
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatSessionTime,
  formatSessionDate,
  formatSessionDateShort,
  formatSessionTimeSlot,
  formatCourseDuration,
  formatSessionStatus,
  formatCourseLevel,

  // Capacity
  getAvailableSeats,
  getOccupancyRate,
  isSessionFull,
  isSessionAlmostFull,
  canEnrollInSession,

  // Timing
  isSessionInPast,
  isSessionToday,
  isSessionStartingSoon,
  getSessionDuration,
  doSessionsOverlap,

  // Filtering & Sorting
  filterSessions,
  sortSessionsByDate,
  sortSessionsByOccupancy,

  // Statistics
  calculateSessionStats,
  groupSessionsByDate,
  groupSessionsByTeacher,

  // Validation
  canCancelSession,
  canEditSession,
};
