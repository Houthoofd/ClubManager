/**
 * User Role Enum
 * Rôles disponibles dans l'application
 */
export enum UserRole {
  ADMIN = "admin",
  MEMBER = "member",
  PROFESSOR = "professor",
}

/**
 * Libellés des rôles
 */
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.MEMBER]: "Membre",
  [UserRole.PROFESSOR]: "Professeur",
};

/**
 * Vérifie si un rôle est valide
 */
export function isValidUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}
