import { faker } from '@faker-js/faker';

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  INSTRUCTOR = 'INSTRUCTOR',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  lastLogin?: string | null;
  avatar?: string | null;
  birthDate?: string | null;
  address?: {
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
  } | null;
}

export const UserFactory = {
  /**
   * Créer un utilisateur complet et valide
   */
  build: (overrides: Partial<User> = {}): User => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number('+32 4## ## ## ##'),
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: faker.date.past({ years: 2 }).toISOString(),
    lastLogin: faker.date.recent({ days: 7 }).toISOString(),
    avatar: faker.image.avatar(),
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: 'Belgium',
    },
    ...overrides,
  }),

  /**
   * Créer un utilisateur avec des champs null/undefined
   */
  buildIncomplete: (): User => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: null,
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: faker.date.past().toISOString(),
    lastLogin: null,
    avatar: null,
    birthDate: null,
    address: null,
  }),

  /**
   * Créer un admin
   */
  buildAdmin: (overrides: Partial<User> = {}): User =>
    UserFactory.build({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      ...overrides,
    }),

  /**
   * Créer un instructeur
   */
  buildInstructor: (overrides: Partial<User> = {}): User =>
    UserFactory.build({
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      ...overrides,
    }),

  /**
   * Créer un utilisateur inactif
   */
  buildInactive: (overrides: Partial<User> = {}): User =>
    UserFactory.build({
      status: UserStatus.INACTIVE,
      lastLogin: faker.date.past({ years: 1 }).toISOString(),
      ...overrides,
    }),

  /**
   * Créer un utilisateur suspendu
   */
  buildSuspended: (overrides: Partial<User> = {}): User =>
    UserFactory.build({
      status: UserStatus.SUSPENDED,
      ...overrides,
    }),

  /**
   * Créer un utilisateur en attente
   */
  buildPending: (overrides: Partial<User> = {}): User =>
    UserFactory.build({
      status: UserStatus.PENDING,
      lastLogin: null,
      ...overrides,
    }),

  /**
   * Créer plusieurs utilisateurs
   */
  buildList: (count: number, overrides: Partial<User> = {}): User[] => {
    return Array.from({ length: count }, () => UserFactory.build(overrides));
  },

  /**
   * Créer un utilisateur avec nom spécifique (pour tests)
   */
  buildWithName: (firstName: string, lastName: string, overrides: Partial<User> = {}): User =>
    UserFactory.build({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      ...overrides,
    }),

  /**
   * Créer un utilisateur avec caractères spéciaux
   */
  buildWithSpecialChars: (): User =>
    UserFactory.build({
      firstName: 'Jean-François',
      lastName: "O'Connor-van der Berg",
      email: 'jean-francois.oconnor@example.com',
    }),

  /**
   * Créer un utilisateur mineur (pour tests d'âge)
   */
  buildMinor: (): User =>
    UserFactory.build({
      birthDate: faker.date.birthdate({ min: 10, max: 17, mode: 'age' }).toISOString(),
    }),

  /**
   * Créer un utilisateur senior
   */
  buildSenior: (): User =>
    UserFactory.build({
      birthDate: faker.date.birthdate({ min: 65, max: 90, mode: 'age' }).toISOString(),
    }),
};
