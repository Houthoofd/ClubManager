/**
 * ====================================================================
 * USER SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des utilisateurs.
 * Sépare la logique métier des composants React pour :
 * - Meilleure testabilité
 * - Réutilisabilité du code
 * - Séparation des responsabilités
 * - Facilite la maintenance
 *
 * @module features/users/services
 */

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  statut: UserStatus;
  role?: UserRole;
  dateInscription?: string;
  derniereConnexion?: string;
  abonnement?: Subscription;
  soldeCompte?: number;
  credits?: number;
}

export type UserStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'ARCHIVE';
export type UserRole = 'ADMIN' | 'TEACHER' | 'MEMBER' | 'GUEST';

export interface Subscription {
  id: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  montant: number;
}

export interface UserFilters {
  search?: string;
  statut?: UserStatus;
  role?: UserRole;
  hasActiveSubscription?: boolean;
  dateInscriptionFrom?: string;
  dateInscriptionTo?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
  averageAge?: number;
  subscriptionRate: number;
}

export interface CreateUserInput {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  statut?: UserStatus;
  role?: UserRole;
}

// ============================================================================
// User Display & Formatting
// ============================================================================

/**
 * Formate le nom complet d'un utilisateur
 *
 * @param user - Utilisateur
 * @returns Nom complet formaté
 *
 * @example
 * ```ts
 * formatUserFullName({ nom: 'Dupont', prenom: 'Jean' })
 * // => "Jean Dupont"
 * ```
 */
export const formatUserFullName = (user: Pick<User, 'nom' | 'prenom'>): string => {
  return `${user.prenom} ${user.nom}`.trim();
};

/**
 * Génère les initiales d'un utilisateur
 *
 * @param user - Utilisateur
 * @returns Initiales (2 lettres max)
 *
 * @example
 * ```ts
 * getUserInitials({ nom: 'Dupont', prenom: 'Jean' })
 * // => "JD"
 * ```
 */
export const getUserInitials = (user: Pick<User, 'nom' | 'prenom'>): string => {
  const firstInitial = user.prenom?.charAt(0)?.toUpperCase() || '';
  const lastInitial = user.nom?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};

/**
 * Formate le statut utilisateur pour l'affichage
 *
 * @param statut - Statut de l'utilisateur
 * @returns Label et variant pour affichage
 */
export const formatUserStatus = (statut: UserStatus): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } => {
  const statusMap = {
    ACTIF: { label: 'Actif', variant: 'success' as const },
    INACTIF: { label: 'Inactif', variant: 'default' as const },
    SUSPENDU: { label: 'Suspendu', variant: 'warning' as const },
    ARCHIVE: { label: 'Archivé', variant: 'danger' as const },
  };

  return statusMap[statut] || { label: statut, variant: 'default' as const };
};

/**
 * Masque partiellement un email pour la confidentialité
 *
 * @param email - Email à masquer
 * @returns Email masqué
 *
 * @example
 * ```ts
 * maskEmail('jean.dupont@example.com')
 * // => "j***@example.com"
 * ```
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const maskedLocal = localPart.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
};

/**
 * Masque partiellement un numéro de téléphone
 *
 * @param phone - Numéro de téléphone
 * @returns Téléphone masqué
 *
 * @example
 * ```ts
 * maskPhone('+32 123 456 789')
 * // => "+32 *** *** 789"
 * ```
 */
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;

  const last3 = digits.slice(-3);
  const first = digits.slice(0, Math.min(2, digits.length - 3));
  return `+${first} *** *** ${last3}`;
};

// ============================================================================
// User Calculations & Business Logic
// ============================================================================

/**
 * Calcule l'âge d'un utilisateur
 *
 * @param dateNaissance - Date de naissance (ISO string)
 * @returns Âge en années
 */
export const calculateUserAge = (dateNaissance: string): number => {
  const birthDate = new Date(dateNaissance);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Vérifie si un utilisateur est mineur
 *
 * @param dateNaissance - Date de naissance
 * @returns true si mineur (< 18 ans)
 */
export const isUserMinor = (dateNaissance: string): boolean => {
  return calculateUserAge(dateNaissance) < 18;
};

/**
 * Vérifie si un utilisateur a un abonnement actif
 *
 * @param user - Utilisateur
 * @returns true si abonnement actif
 */
export const hasActiveSubscription = (user: User): boolean => {
  if (!user.abonnement) return false;

  const now = new Date();
  const endDate = new Date(user.abonnement.dateFin);

  return user.abonnement.actif && endDate > now;
};

/**
 * Calcule le nombre de jours restants d'abonnement
 *
 * @param user - Utilisateur
 * @returns Nombre de jours restants (0 si expiré ou pas d'abonnement)
 */
export const getSubscriptionDaysRemaining = (user: User): number => {
  if (!user.abonnement || !user.abonnement.actif) return 0;

  const now = new Date();
  const endDate = new Date(user.abonnement.dateFin);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

/**
 * Vérifie si l'abonnement expire bientôt (< 30 jours)
 *
 * @param user - Utilisateur
 * @returns true si l'abonnement expire dans moins de 30 jours
 */
export const isSubscriptionExpiringSoon = (user: User): boolean => {
  const daysRemaining = getSubscriptionDaysRemaining(user);
  return daysRemaining > 0 && daysRemaining <= 30;
};

/**
 * Calcule le solde disponible (compte + crédits)
 *
 * @param user - Utilisateur
 * @returns Solde total disponible
 */
export const getTotalBalance = (user: User): number => {
  const solde = user.soldeCompte || 0;
  const credits = user.credits || 0;
  return solde + credits;
};

/**
 * Vérifie si l'utilisateur peut effectuer un achat
 *
 * @param user - Utilisateur
 * @param amount - Montant de l'achat
 * @returns true si solde suffisant
 */
export const canAffordPurchase = (user: User, amount: number): boolean => {
  return getTotalBalance(user) >= amount;
};

/**
 * Calcule l'ancienneté d'un utilisateur en jours
 *
 * @param dateInscription - Date d'inscription
 * @returns Nombre de jours depuis l'inscription
 */
export const getUserSeniority = (dateInscription: string): number => {
  const inscriptionDate = new Date(dateInscription);
  const now = new Date();
  const diffTime = now.getTime() - inscriptionDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Vérifie si l'utilisateur est nouveau (inscrit il y a moins de 30 jours)
 *
 * @param dateInscription - Date d'inscription
 * @returns true si nouveau membre
 */
export const isNewUser = (dateInscription: string): boolean => {
  return getUserSeniority(dateInscription) <= 30;
};

// ============================================================================
// User Filtering & Sorting
// ============================================================================

/**
 * Filtre une liste d'utilisateurs selon des critères
 *
 * @param users - Liste d'utilisateurs
 * @param filters - Critères de filtrage
 * @returns Liste filtrée
 */
export const filterUsers = (users: User[], filters: UserFilters): User[] => {
  return users.filter(user => {
    // Recherche textuelle (nom, prénom, email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = formatUserFullName(user).toLowerCase();
      const email = user.email.toLowerCase();

      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par statut
    if (filters.statut && user.statut !== filters.statut) {
      return false;
    }

    // Filtre par rôle
    if (filters.role && user.role !== filters.role) {
      return false;
    }

    // Filtre par abonnement actif
    if (filters.hasActiveSubscription !== undefined) {
      if (filters.hasActiveSubscription !== hasActiveSubscription(user)) {
        return false;
      }
    }

    // Filtre par date d'inscription
    if (filters.dateInscriptionFrom && user.dateInscription) {
      const inscriptionDate = new Date(user.dateInscription);
      const fromDate = new Date(filters.dateInscriptionFrom);
      if (inscriptionDate < fromDate) {
        return false;
      }
    }

    if (filters.dateInscriptionTo && user.dateInscription) {
      const inscriptionDate = new Date(user.dateInscription);
      const toDate = new Date(filters.dateInscriptionTo);
      if (inscriptionDate > toDate) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Trie les utilisateurs par nom (ordre alphabétique)
 *
 * @param users - Liste d'utilisateurs
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortUsersByName = (users: User[], order: 'asc' | 'desc' = 'asc'): User[] => {
  return [...users].sort((a, b) => {
    const nameA = formatUserFullName(a).toLowerCase();
    const nameB = formatUserFullName(b).toLowerCase();

    const comparison = nameA.localeCompare(nameB);
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les utilisateurs par date d'inscription
 *
 * @param users - Liste d'utilisateurs
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Liste triée
 */
export const sortUsersByRegistrationDate = (users: User[], order: 'asc' | 'desc' = 'desc'): User[] => {
  return [...users].sort((a, b) => {
    const dateA = a.dateInscription ? new Date(a.dateInscription).getTime() : 0;
    const dateB = b.dateInscription ? new Date(b.dateInscription).getTime() : 0;

    const comparison = dateA - dateB;
    return order === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// User Statistics
// ============================================================================

/**
 * Calcule les statistiques globales des utilisateurs
 *
 * @param users - Liste d'utilisateurs
 * @returns Statistiques agrégées
 */
export const calculateUserStats = (users: User[]): UserStats => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.statut === 'ACTIF').length;
  const inactiveUsers = users.filter(u => u.statut === 'INACTIF').length;
  const suspendedUsers = users.filter(u => u.statut === 'SUSPENDU').length;

  // Nouveaux utilisateurs ce mois
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = users.filter(u => {
    if (!u.dateInscription) return false;
    const inscriptionDate = new Date(u.dateInscription);
    return inscriptionDate >= firstDayOfMonth;
  }).length;

  // Âge moyen
  const usersWithAge = users.filter(u => u.dateNaissance);
  const averageAge = usersWithAge.length > 0
    ? usersWithAge.reduce((sum, u) => sum + calculateUserAge(u.dateNaissance!), 0) / usersWithAge.length
    : undefined;

  // Taux d'abonnement
  const usersWithActiveSubscription = users.filter(hasActiveSubscription).length;
  const subscriptionRate = totalUsers > 0 ? (usersWithActiveSubscription / totalUsers) * 100 : 0;

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    newUsersThisMonth,
    averageAge: averageAge ? Math.round(averageAge) : undefined,
    subscriptionRate: Math.round(subscriptionRate * 10) / 10,
  };
};

/**
 * Groupe les utilisateurs par statut
 *
 * @param users - Liste d'utilisateurs
 * @returns Map de statut -> liste d'utilisateurs
 */
export const groupUsersByStatus = (users: User[]): Record<UserStatus, User[]> => {
  return users.reduce((acc, user) => {
    if (!acc[user.statut]) {
      acc[user.statut] = [];
    }
    acc[user.statut].push(user);
    return acc;
  }, {} as Record<UserStatus, User[]>);
};

/**
 * Groupe les utilisateurs par rôle
 *
 * @param users - Liste d'utilisateurs
 * @returns Map de rôle -> liste d'utilisateurs
 */
export const groupUsersByRole = (users: User[]): Record<string, User[]> => {
  return users.reduce((acc, user) => {
    const role = user.role || 'MEMBER';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<string, User[]>);
};

// ============================================================================
// User Validation Helpers
// ============================================================================

/**
 * Valide qu'un utilisateur peut être supprimé
 *
 * @param user - Utilisateur
 * @returns { valid: boolean, reason?: string }
 */
export const canDeleteUser = (user: User): { valid: boolean; reason?: string } => {
  // Ne peut pas supprimer un admin
  if (user.role === 'ADMIN') {
    return { valid: false, reason: 'Impossible de supprimer un administrateur' };
  }

  // Ne peut pas supprimer si abonnement actif
  if (hasActiveSubscription(user)) {
    return { valid: false, reason: 'Impossible de supprimer un utilisateur avec abonnement actif' };
  }

  // Ne peut pas supprimer si solde positif
  if (getTotalBalance(user) > 0) {
    return { valid: false, reason: 'Impossible de supprimer un utilisateur avec un solde positif' };
  }

  return { valid: true };
};

/**
 * Valide qu'un utilisateur peut être suspendu
 *
 * @param user - Utilisateur
 * @returns { valid: boolean, reason?: string }
 */
export const canSuspendUser = (user: User): { valid: boolean; reason?: string } => {
  if (user.statut === 'SUSPENDU') {
    return { valid: false, reason: 'Utilisateur déjà suspendu' };
  }

  if (user.role === 'ADMIN') {
    return { valid: false, reason: 'Impossible de suspendre un administrateur' };
  }

  return { valid: true };
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatUserFullName,
  getUserInitials,
  formatUserStatus,
  maskEmail,
  maskPhone,

  // Calculations
  calculateUserAge,
  isUserMinor,
  hasActiveSubscription,
  getSubscriptionDaysRemaining,
  isSubscriptionExpiringSoon,
  getTotalBalance,
  canAffordPurchase,
  getUserSeniority,
  isNewUser,

  // Filtering & Sorting
  filterUsers,
  sortUsersByName,
  sortUsersByRegistrationDate,

  // Statistics
  calculateUserStats,
  groupUsersByStatus,
  groupUsersByRole,

  // Validation
  canDeleteUser,
  canSuspendUser,
};
