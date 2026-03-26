/**
 * User Status Enum
 * Correspond aux statuts dans la table `status` de la DB
 */
export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
  PENDING_VERIFICATION = 4,
  DELETED = 5,
}

/**
 * Libellés français pour l'affichage
 */
export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Actif",
  [UserStatus.INACTIVE]: "Inactif",
  [UserStatus.SUSPENDED]: "Suspendu",
  [UserStatus.PENDING_VERIFICATION]: "En attente",
  [UserStatus.DELETED]: "Supprimé",
};

/**
 * Vérifie si un statut est valide
 */
export function isValidUserStatus(value: number): value is UserStatus {
  return Object.values(UserStatus).includes(value);
}
