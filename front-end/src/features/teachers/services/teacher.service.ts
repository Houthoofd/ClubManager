/**
 * ====================================================================
 * TEACHER SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des professeurs.
 * Gère les plannings, disponibilités, performances, qualifications.
 *
 * @module features/teachers/services
 */

// ============================================================================
// Types
// ============================================================================

export interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialites: string[];
  niveaux: TeacherLevel[];
  statut: TeacherStatus;
  dateEmbauche?: string;
  tauxHoraire?: number;
  disponibilites?: Availability[];
  note?: number; // Note moyenne (0-5)
  nombreAvis?: number;
}

export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export type TeacherLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export interface Availability {
  jourSemaine: DayOfWeek;
  heureDebut: string;
  heureFin: string;
}

export type DayOfWeek = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

export interface TeacherSession {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  course: {
    id: string;
    nom: string;
  };
  nbInscrits: number;
  capaciteMax: number;
}

export interface TeacherPerformance {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageOccupancy: number;
  averageRating: number;
  totalRevenue: number;
  hoursWorked: number;
}

export interface TeacherFilters {
  search?: string;
  specialite?: string;
  niveau?: TeacherLevel;
  statut?: TeacherStatus;
  disponibleLe?: DayOfWeek;
  noteMin?: number;
}

export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  averageRating: number;
  totalHoursWorked: number;
  totalRevenue: number;
}

export interface ScheduleConflict {
  teacher: Teacher;
  session1: TeacherSession;
  session2: TeacherSession;
  reason: string;
}

// ============================================================================
// Teacher Display & Formatting
// ============================================================================

/**
 * Formate le nom complet d'un professeur
 *
 * @param teacher - Professeur
 * @returns Nom complet
 */
export const formatTeacherFullName = (teacher: Pick<Teacher, 'nom' | 'prenom'>): string => {
  return `${teacher.prenom} ${teacher.nom}`.trim();
};

/**
 * Formate les initiales d'un professeur
 *
 * @param teacher - Professeur
 * @returns Initiales
 */
export const getTeacherInitials = (teacher: Pick<Teacher, 'nom' | 'prenom'>): string => {
  const firstInitial = teacher.prenom?.charAt(0)?.toUpperCase() || '';
  const lastInitial = teacher.nom?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};

/**
 * Formate le statut du professeur
 *
 * @param statut - Statut
 * @returns Label et variant
 */
export const formatTeacherStatus = (
  statut: TeacherStatus
): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } => {
  const statusMap = {
    ACTIVE: { label: 'Actif', variant: 'success' as const },
    INACTIVE: { label: 'Inactif', variant: 'default' as const },
    ON_LEAVE: { label: 'En congé', variant: 'warning' as const },
    TERMINATED: { label: 'Parti', variant: 'danger' as const },
  };

  return statusMap[statut] || { label: statut, variant: 'default' as const };
};

/**
 * Formate la liste des spécialités
 *
 * @param specialites - Spécialités
 * @returns String formaté
 */
export const formatSpecialities = (specialites: string[]): string => {
  if (specialites.length === 0) return 'Aucune spécialité';
  if (specialites.length === 1) return specialites[0];
  return specialites.join(', ');
};

/**
 * Formate la note moyenne avec étoiles
 *
 * @param note - Note (0-5)
 * @returns String avec étoiles
 */
export const formatRating = (note?: number): string => {
  if (!note) return 'Non noté';
  const stars = '★'.repeat(Math.floor(note)) + '☆'.repeat(5 - Math.floor(note));
  return `${note.toFixed(1)} ${stars}`;
};

/**
 * Formate le taux horaire
 *
 * @param taux - Taux horaire
 * @returns Taux formaté
 */
export const formatHourlyRate = (taux?: number): string => {
  if (!taux) return 'Non spécifié';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(taux) + '/h';
};

// ============================================================================
// Teacher Availability & Schedule
// ============================================================================

/**
 * Vérifie si un professeur est disponible un jour donné
 *
 * @param teacher - Professeur
 * @param jour - Jour de la semaine
 * @returns true si disponible
 */
export const isAvailableOnDay = (teacher: Teacher, jour: DayOfWeek): boolean => {
  if (!teacher.disponibilites || teacher.disponibilites.length === 0) return false;
  return teacher.disponibilites.some((dispo) => dispo.jourSemaine === jour);
};

/**
 * Récupère les disponibilités pour un jour spécifique
 *
 * @param teacher - Professeur
 * @param jour - Jour de la semaine
 * @returns Disponibilités du jour
 */
export const getAvailabilitiesForDay = (teacher: Teacher, jour: DayOfWeek): Availability[] => {
  if (!teacher.disponibilites) return [];
  return teacher.disponibilites.filter((dispo) => dispo.jourSemaine === jour);
};

/**
 * Vérifie si un professeur est disponible à une heure donnée
 *
 * @param teacher - Professeur
 * @param jour - Jour de la semaine
 * @param heure - Heure au format HH:MM
 * @returns true si disponible
 */
export const isAvailableAtTime = (
  teacher: Teacher,
  jour: DayOfWeek,
  heure: string
): boolean => {
  const dispos = getAvailabilitiesForDay(teacher, jour);
  if (dispos.length === 0) return false;

  return dispos.some((dispo) => {
    return heure >= dispo.heureDebut && heure <= dispo.heureFin;
  });
};

/**
 * Calcule le nombre total d'heures disponibles par semaine
 *
 * @param teacher - Professeur
 * @returns Heures disponibles
 */
export const getTotalWeeklyAvailability = (teacher: Teacher): number => {
  if (!teacher.disponibilites) return 0;

  return teacher.disponibilites.reduce((total, dispo) => {
    const [startH, startM] = dispo.heureDebut.split(':').map(Number);
    const [endH, endM] = dispo.heureFin.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = (endMinutes - startMinutes) / 60;

    return total + duration;
  }, 0);
};

/**
 * Calcule le taux d'occupation d'un professeur
 *
 * @param teacher - Professeur
 * @param sessions - Sessions du professeur
 * @returns Taux d'occupation en %
 */
export const calculateOccupancyRate = (
  teacher: Teacher,
  sessions: TeacherSession[]
): number => {
  const totalAvailable = getTotalWeeklyAvailability(teacher);
  if (totalAvailable === 0) return 0;

  const totalWorked = sessions.reduce((total, session) => {
    const [startH, startM] = session.heureDebut.split(':').map(Number);
    const [endH, endM] = session.heureFin.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = (endMinutes - startMinutes) / 60;

    return total + duration;
  }, 0);

  return Math.round((totalWorked / totalAvailable) * 100);
};

/**
 * Détecte les conflits d'horaire pour un professeur
 *
 * @param sessions - Sessions du professeur
 * @returns Conflits détectés
 */
export const detectScheduleConflicts = (sessions: TeacherSession[]): Array<{
  session1: TeacherSession;
  session2: TeacherSession;
}> => {
  const conflicts: Array<{ session1: TeacherSession; session2: TeacherSession }> = [];

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i];
      const s2 = sessions[j];

      // Même jour
      if (s1.date === s2.date) {
        const start1 = s1.heureDebut;
        const end1 = s1.heureFin;
        const start2 = s2.heureDebut;
        const end2 = s2.heureFin;

        // Vérifier chevauchement
        if (start1 < end2 && start2 < end1) {
          conflicts.push({ session1: s1, session2: s2 });
        }
      }
    }
  }

  return conflicts;
};

// ============================================================================
// Teacher Performance
// ============================================================================

/**
 * Calcule les performances d'un professeur
 *
 * @param teacher - Professeur
 * @param sessions - Sessions du professeur
 * @returns Performances
 */
export const calculateTeacherPerformance = (
  teacher: Teacher,
  sessions: TeacherSession[]
): TeacherPerformance => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (s) => new Date(s.date) < new Date()
  ).length;
  const cancelledSessions = 0; // À déterminer selon statut

  const averageOccupancy =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.nbInscrits / s.capaciteMax) * 100, 0) /
            sessions.length
        )
      : 0;

  const averageRating = teacher.note || 0;

  const hoursWorked = sessions.reduce((total, session) => {
    const [startH, startM] = session.heureDebut.split(':').map(Number);
    const [endH, endM] = session.heureFin.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = (endMinutes - startMinutes) / 60;

    return total + duration;
  }, 0);

  const totalRevenue = teacher.tauxHoraire ? hoursWorked * teacher.tauxHoraire : 0;

  return {
    totalSessions,
    completedSessions,
    cancelledSessions,
    averageOccupancy,
    averageRating,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    hoursWorked: Math.round(hoursWorked * 100) / 100,
  };
};

/**
 * Calcule l'ancienneté d'un professeur
 *
 * @param dateEmbauche - Date d'embauche
 * @returns Ancienneté en années
 */
export const calculateSeniority = (dateEmbauche?: string): number => {
  if (!dateEmbauche) return 0;

  const hireDate = new Date(dateEmbauche);
  const now = new Date();
  const diffTime = now.getTime() - hireDate.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

  return Math.floor(diffYears * 10) / 10;
};

/**
 * Vérifie si un professeur est nouveau (< 6 mois)
 *
 * @param teacher - Professeur
 * @returns true si nouveau
 */
export const isNewTeacher = (teacher: Teacher): boolean => {
  const seniority = calculateSeniority(teacher.dateEmbauche);
  return seniority < 0.5;
};

/**
 * Calcule le niveau d'expertise
 *
 * @param teacher - Professeur
 * @returns Niveau (Junior/Intermédiaire/Senior/Expert)
 */
export const getExpertiseLevel = (teacher: Teacher): string => {
  const seniority = calculateSeniority(teacher.dateEmbauche);
  const rating = teacher.note || 0;

  if (seniority >= 5 && rating >= 4.5) return 'Expert';
  if (seniority >= 3 && rating >= 4) return 'Senior';
  if (seniority >= 1 && rating >= 3) return 'Intermédiaire';
  return 'Junior';
};

// ============================================================================
// Teacher Filtering & Sorting
// ============================================================================

/**
 * Filtre les professeurs selon des critères
 *
 * @param teachers - Liste de professeurs
 * @param filters - Critères de filtrage
 * @returns Professeurs filtrés
 */
export const filterTeachers = (teachers: Teacher[], filters: TeacherFilters): Teacher[] => {
  return teachers.filter((teacher) => {
    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = formatTeacherFullName(teacher).toLowerCase();
      const email = teacher.email.toLowerCase();

      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par spécialité
    if (filters.specialite && !teacher.specialites.includes(filters.specialite)) {
      return false;
    }

    // Filtre par niveau
    if (filters.niveau && !teacher.niveaux.includes(filters.niveau)) {
      return false;
    }

    // Filtre par statut
    if (filters.statut && teacher.statut !== filters.statut) {
      return false;
    }

    // Filtre par disponibilité
    if (filters.disponibleLe && !isAvailableOnDay(teacher, filters.disponibleLe)) {
      return false;
    }

    // Filtre par note minimum
    if (filters.noteMin && (!teacher.note || teacher.note < filters.noteMin)) {
      return false;
    }

    return true;
  });
};

/**
 * Trie les professeurs par nom
 *
 * @param teachers - Liste de professeurs
 * @param order - Ordre de tri
 * @returns Professeurs triés
 */
export const sortTeachersByName = (
  teachers: Teacher[],
  order: 'asc' | 'desc' = 'asc'
): Teacher[] => {
  return [...teachers].sort((a, b) => {
    const nameA = formatTeacherFullName(a).toLowerCase();
    const nameB = formatTeacherFullName(b).toLowerCase();

    const comparison = nameA.localeCompare(nameB);
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les professeurs par note
 *
 * @param teachers - Liste de professeurs
 * @param order - Ordre de tri
 * @returns Professeurs triés
 */
export const sortTeachersByRating = (
  teachers: Teacher[],
  order: 'asc' | 'desc' = 'desc'
): Teacher[] => {
  return [...teachers].sort((a, b) => {
    const ratingA = a.note || 0;
    const ratingB = b.note || 0;

    const comparison = ratingA - ratingB;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les professeurs par ancienneté
 *
 * @param teachers - Liste de professeurs
 * @param order - Ordre de tri
 * @returns Professeurs triés
 */
export const sortTeachersBySeniority = (
  teachers: Teacher[],
  order: 'asc' | 'desc' = 'desc'
): Teacher[] => {
  return [...teachers].sort((a, b) => {
    const seniorityA = calculateSeniority(a.dateEmbauche);
    const seniorityB = calculateSeniority(b.dateEmbauche);

    const comparison = seniorityA - seniorityB;
    return order === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// Teacher Statistics
// ============================================================================

/**
 * Calcule les statistiques des professeurs
 *
 * @param teachers - Liste de professeurs
 * @returns Statistiques
 */
export const calculateTeacherStats = (teachers: Teacher[]): TeacherStats => {
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.statut === 'ACTIVE').length;
  const inactiveTeachers = teachers.filter((t) => t.statut === 'INACTIVE').length;

  const teachersWithRating = teachers.filter((t) => t.note);
  const averageRating =
    teachersWithRating.length > 0
      ? teachersWithRating.reduce((sum, t) => sum + (t.note || 0), 0) /
        teachersWithRating.length
      : 0;

  return {
    totalTeachers,
    activeTeachers,
    inactiveTeachers,
    averageRating: Math.round(averageRating * 10) / 10,
    totalHoursWorked: 0, // Nécessite les sessions
    totalRevenue: 0, // Nécessite les sessions
  };
};

/**
 * Groupe les professeurs par spécialité
 *
 * @param teachers - Liste de professeurs
 * @returns Map spécialité -> professeurs
 */
export const groupTeachersBySpeciality = (
  teachers: Teacher[]
): Record<string, Teacher[]> => {
  const groups: Record<string, Teacher[]> = {};

  teachers.forEach((teacher) => {
    teacher.specialites.forEach((specialite) => {
      if (!groups[specialite]) {
        groups[specialite] = [];
      }
      groups[specialite].push(teacher);
    });
  });

  return groups;
};

/**
 * Récupère les meilleurs professeurs (note >= 4.5)
 *
 * @param teachers - Liste de professeurs
 * @param limit - Nombre de professeurs
 * @returns Top professeurs
 */
export const getTopTeachers = (teachers: Teacher[], limit: number = 10): Teacher[] => {
  return teachers
    .filter((t) => t.note && t.note >= 4.5)
    .sort((a, b) => (b.note || 0) - (a.note || 0))
    .slice(0, limit);
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Valide qu'un professeur peut être assigné à une session
 *
 * @param teacher - Professeur
 * @param session - Session
 * @returns { canAssign: boolean, reason?: string }
 */
export const canAssignToSession = (
  teacher: Teacher,
  session: { date: string; heureDebut: string; niveau?: string }
): { canAssign: boolean; reason?: string } => {
  if (teacher.statut !== 'ACTIVE') {
    return { canAssign: false, reason: 'Professeur inactif' };
  }

  // Vérifier disponibilité (jour de la semaine)
  const sessionDate = new Date(session.date);
  const dayNames: DayOfWeek[] = [
    'DIMANCHE',
    'LUNDI',
    'MARDI',
    'MERCREDI',
    'JEUDI',
    'VENDREDI',
    'SAMEDI',
  ];
  const dayOfWeek = dayNames[sessionDate.getDay()];

  if (!isAvailableAtTime(teacher, dayOfWeek, session.heureDebut)) {
    return { canAssign: false, reason: 'Professeur non disponible à cet horaire' };
  }

  return { canAssign: true };
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatTeacherFullName,
  getTeacherInitials,
  formatTeacherStatus,
  formatSpecialities,
  formatRating,
  formatHourlyRate,

  // Availability
  isAvailableOnDay,
  getAvailabilitiesForDay,
  isAvailableAtTime,
  getTotalWeeklyAvailability,
  calculateOccupancyRate,
  detectScheduleConflicts,

  // Performance
  calculateTeacherPerformance,
  calculateSeniority,
  isNewTeacher,
  getExpertiseLevel,

  // Filtering & Sorting
  filterTeachers,
  sortTeachersByName,
  sortTeachersByRating,
  sortTeachersBySeniority,

  // Statistics
  calculateTeacherStats,
  groupTeachersBySpeciality,
  getTopTeachers,

  // Validation
  canAssignToSession,
};
