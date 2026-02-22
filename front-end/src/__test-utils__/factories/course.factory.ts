/**
 * Course Factory
 *
 * Factory for generating mock course data for testing purposes.
 *
 * Usage:
 *   import { CourseFactory } from '@/__test-utils__/factories/course.factory';
 *
 *   const course = CourseFactory.create();
 *   const courses = CourseFactory.createMany(5);
 *   const customCourse = CourseFactory.create({ name: 'Custom Course', capacity: 20 });
 */

export interface Course {
  id: string | number;
  name: string;
  description: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux';
  teacherId: string | number;
  teacherName?: string;
  capacity: number;
  enrolled: number;
  duration: number; // in minutes
  schedule: CourseSchedule[];
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  location: string;
  isActive: boolean;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

/**
 * Course categories
 */
export const COURSE_CATEGORIES = [
  'Fitness',
  'Yoga',
  'Natation',
  'Tennis',
  'Football',
  'Basketball',
  'Danse',
  'Arts Martiaux',
  'Musculation',
  'Autre',
] as const;

/**
 * Course levels
 */
export const COURSE_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux'] as const;

/**
 * Days of week
 */
export const DAYS_OF_WEEK = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

/**
 * Default course data
 */
const DEFAULT_COURSE: Course = {
  id: 1,
  name: 'Test Course',
  description: 'This is a test course description for testing purposes',
  category: 'Fitness',
  level: 'Tous niveaux',
  teacherId: 1,
  teacherName: 'John Doe',
  capacity: 20,
  enrolled: 10,
  duration: 60,
  schedule: [
    { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
    { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
  ],
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
  price: 150.0,
  currency: 'EUR',
  location: 'Salle A',
  isActive: true,
  imageUrl: 'https://via.placeholder.com/400x300?text=Course',
  tags: ['populaire', 'débutant'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Sample course names
 */
const COURSE_NAMES = [
  'Yoga pour Débutants',
  'Fitness Cardio',
  'Natation Adultes',
  'Tennis Enfants',
  'Football Amateur',
  'Zumba Fitness',
  'Boxe Thaï',
  'Pilates Matinal',
  'Musculation Avancée',
  'Danse Contemporaine',
];

/**
 * Sample descriptions
 */
const COURSE_DESCRIPTIONS = [
  'Un cours dynamique adapté à tous les niveaux pour améliorer votre condition physique',
  'Apprenez les techniques de base dans une ambiance conviviale et motivante',
  'Programme intensif pour progresser rapidement et atteindre vos objectifs',
  'Cours collectif encadré par des professionnels expérimentés',
  'Séances personnalisées pour un apprentissage optimal',
];

/**
 * Sample locations
 */
const LOCATIONS = [
  'Salle A',
  'Salle B',
  'Gymnase',
  'Piscine',
  'Terrain 1',
  'Terrain 2',
  'Studio',
  'Dojo',
];

/**
 * Course Factory
 */
export class CourseFactory {
  private static idCounter = 1;

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    this.idCounter = 1;
  }

  /**
   * Create a single course with optional overrides
   */
  static create(overrides: Partial<Course> = {}): Course {
    const id = overrides.id ?? this.idCounter++;
    const randomIndex = Math.floor(Math.random() * COURSE_NAMES.length);
    const name = overrides.name ?? COURSE_NAMES[randomIndex];
    const description =
      overrides.description ??
      COURSE_DESCRIPTIONS[Math.floor(Math.random() * COURSE_DESCRIPTIONS.length)];
    const location = overrides.location ?? LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    return {
      ...DEFAULT_COURSE,
      id,
      name,
      description,
      location,
      ...overrides,
    };
  }

  /**
   * Create multiple courses
   */
  static createMany(count: number, overrides: Partial<Course> = {}): Course[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: overrides.id ?? this.idCounter + index,
      })
    );
  }

  /**
   * Create a course with specific category
   */
  static createWithCategory(
    category: typeof COURSE_CATEGORIES[number],
    overrides: Partial<Course> = {}
  ): Course {
    return this.create({
      category,
      name: `Cours de ${category}`,
      ...overrides,
    });
  }

  /**
   * Create a course with specific level
   */
  static createWithLevel(
    level: typeof COURSE_LEVELS[number],
    overrides: Partial<Course> = {}
  ): Course {
    return this.create({
      level,
      ...overrides,
    });
  }

  /**
   * Create a fully booked course
   */
  static createFullyBooked(overrides: Partial<Course> = {}): Course {
    const capacity = overrides.capacity ?? 20;
    return this.create({
      capacity,
      enrolled: capacity,
      ...overrides,
    });
  }

  /**
   * Create an empty course (no enrollments)
   */
  static createEmpty(overrides: Partial<Course> = {}): Course {
    return this.create({
      enrolled: 0,
      ...overrides,
    });
  }

  /**
   * Create an inactive course
   */
  static createInactive(overrides: Partial<Course> = {}): Course {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a course with almost full capacity
   */
  static createAlmostFull(overrides: Partial<Course> = {}): Course {
    const capacity = overrides.capacity ?? 20;
    return this.create({
      capacity,
      enrolled: capacity - 2,
      ...overrides,
    });
  }

  /**
   * Create a beginner course
   */
  static createBeginner(overrides: Partial<Course> = {}): Course {
    return this.create({
      level: 'Débutant',
      price: 100.0,
      tags: ['débutant', 'accessible'],
      ...overrides,
    });
  }

  /**
   * Create an advanced course
   */
  static createAdvanced(overrides: Partial<Course> = {}): Course {
    return this.create({
      level: 'Avancé',
      price: 250.0,
      capacity: 10,
      tags: ['avancé', 'expert'],
      ...overrides,
    });
  }

  /**
   * Create a morning course
   */
  static createMorning(overrides: Partial<Course> = {}): Course {
    return this.create({
      schedule: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '09:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '09:00' },
      ],
      tags: ['matinal'],
      ...overrides,
    });
  }

  /**
   * Create an evening course
   */
  static createEvening(overrides: Partial<Course> = {}): Course {
    return this.create({
      schedule: [
        { dayOfWeek: 1, startTime: '18:00', endTime: '19:30' },
        { dayOfWeek: 3, startTime: '18:00', endTime: '19:30' },
      ],
      tags: ['soir', 'après-travail'],
      ...overrides,
    });
  }

  /**
   * Create a weekend course
   */
  static createWeekend(overrides: Partial<Course> = {}): Course {
    return this.create({
      schedule: [
        { dayOfWeek: 6, startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 0, startTime: '10:00', endTime: '12:00' },
      ],
      tags: ['weekend'],
      ...overrides,
    });
  }

  /**
   * Create an intensive course (multiple sessions per week)
   */
  static createIntensive(overrides: Partial<Course> = {}): Course {
    return this.create({
      schedule: [
        { dayOfWeek: 1, startTime: '17:00', endTime: '18:30' },
        { dayOfWeek: 2, startTime: '17:00', endTime: '18:30' },
        { dayOfWeek: 3, startTime: '17:00', endTime: '18:30' },
        { dayOfWeek: 4, startTime: '17:00', endTime: '18:30' },
        { dayOfWeek: 5, startTime: '17:00', endTime: '18:30' },
      ],
      duration: 90,
      price: 400.0,
      tags: ['intensif', 'quotidien'],
      ...overrides,
    });
  }

  /**
   * Create a short duration course
   */
  static createShort(overrides: Partial<Course> = {}): Course {
    return this.create({
      duration: 30,
      price: 75.0,
      ...overrides,
    });
  }

  /**
   * Create a long duration course
   */
  static createLong(overrides: Partial<Course> = {}): Course {
    return this.create({
      duration: 120,
      price: 300.0,
      ...overrides,
    });
  }

  /**
   * Create a course with minimal fields
   */
  static createMinimal(overrides: Partial<Course> = {}): Course {
    const id = overrides.id ?? this.idCounter++;
    return {
      id,
      name: overrides.name ?? 'Minimal Course',
      description: overrides.description ?? 'Basic description',
      category: overrides.category ?? 'Autre',
      level: overrides.level ?? 'Tous niveaux',
      teacherId: overrides.teacherId ?? 1,
      capacity: overrides.capacity ?? 20,
      enrolled: overrides.enrolled ?? 0,
      duration: overrides.duration ?? 60,
      schedule: overrides.schedule ?? [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
      startDate: overrides.startDate ?? new Date().toISOString(),
      endDate: overrides.endDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      price: overrides.price ?? 100.0,
      currency: overrides.currency ?? 'EUR',
      location: overrides.location ?? 'Salle A',
      isActive: overrides.isActive ?? true,
      createdAt: overrides.createdAt ?? new Date().toISOString(),
      updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    };
  }

  /**
   * Create a batch of courses with different categories
   */
  static createBatchWithCategories(): Course[] {
    return COURSE_CATEGORIES.map((category, index) =>
      this.create({
        id: this.idCounter + index,
        category,
        name: `Cours de ${category}`,
      })
    );
  }

  /**
   * Create courses with all levels
   */
  static createAllLevels(): Course[] {
    return COURSE_LEVELS.map((level, index) =>
      this.create({
        id: this.idCounter + index,
        level,
        name: `Cours ${level}`,
      })
    );
  }

  /**
   * Create a course for API response testing
   */
  static createApiResponse(overrides: Partial<Course> = {}): { data: Course } {
    return {
      data: this.create(overrides),
    };
  }

  /**
   * Create multiple courses for API list response
   */
  static createApiListResponse(
    count: number = 10,
    overrides: Partial<Course> = {}
  ): { data: Course[]; total: number; page: number; pageSize: number } {
    const courses = this.createMany(count, overrides);
    return {
      data: courses,
      total: count,
      page: 1,
      pageSize: count,
    };
  }

  /**
   * Create a course with GraphQL response structure
   */
  static createGraphQLResponse(overrides: Partial<Course> = {}): {
    data: { course: Course };
  } {
    return {
      data: {
        course: this.create(overrides),
      },
    };
  }

  /**
   * Create multiple courses with GraphQL response structure
   */
  static createGraphQLListResponse(count: number = 10, overrides: Partial<Course> = {}): {
    data: { courses: Course[] };
  } {
    return {
      data: {
        courses: this.createMany(count, overrides),
      },
    };
  }

  /**
   * Create a course with validation errors (for testing error states)
   */
  static createInvalid(): Partial<Course> {
    return {
      id: -1,
      name: '',
      description: '',
      capacity: -10,
      enrolled: -5,
      duration: -30,
      price: -100,
      level: 'Invalid' as any,
      category: 'NonExistent' as any,
    };
  }

  /**
   * Create a realistic course dataset for testing
   */
  static createRealisticDataset(): Course[] {
    return [
      this.createBeginner({
        name: 'Yoga Débutants',
        category: 'Yoga',
        schedule: [
          { dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '10:00' },
        ],
        enrolled: 15,
        capacity: 20,
      }),
      this.createAdvanced({
        name: 'Fitness Cardio Avancé',
        category: 'Fitness',
        schedule: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30' }],
        enrolled: 8,
        capacity: 10,
      }),
      this.createFullyBooked({
        name: 'Natation Enfants',
        category: 'Natation',
        schedule: [{ dayOfWeek: 3, startTime: '16:00', endTime: '17:00' }],
        capacity: 12,
        tags: ['complet', 'enfants'],
      }),
      this.createWeekend({
        name: 'Tennis Adultes',
        category: 'Tennis',
        enrolled: 10,
        capacity: 16,
        price: 200.0,
      }),
      this.createMorning({
        name: 'Pilates Matinal',
        category: 'Fitness',
        enrolled: 12,
        capacity: 15,
        price: 120.0,
      }),
      this.createInactive({
        name: 'Boxe Thaï (Fermé)',
        category: 'Arts Martiaux',
        enrolled: 0,
        price: 180.0,
      }),
      this.createIntensive({
        name: 'Musculation Pro',
        category: 'Musculation',
        enrolled: 6,
        capacity: 8,
        level: 'Avancé',
      }),
      this.createEmpty({
        name: 'Danse Salsa Nouveauté',
        category: 'Danse',
        tags: ['nouveau', 'débutant'],
        price: 110.0,
      }),
      this.create({
        name: 'Football Loisir',
        category: 'Football',
        level: 'Tous niveaux',
        enrolled: 18,
        capacity: 22,
        schedule: [{ dayOfWeek: 3, startTime: '19:00', endTime: '20:30' }],
        price: 160.0,
      }),
      this.createAlmostFull({
        name: 'Zumba Fitness',
        category: 'Danse',
        enrolled: 23,
        capacity: 25,
        schedule: [
          { dayOfWeek: 2, startTime: '18:30', endTime: '19:30' },
          { dayOfWeek: 5, startTime: '18:30', endTime: '19:30' },
        ],
        price: 130.0,
        tags: ['populaire', 'dynamique'],
      }),
    ];
  }

  /**
   * Create a course with a specific teacher
   */
  static createWithTeacher(teacherId: number | string, teacherName: string, overrides: Partial<Course> = {}): Course {
    return this.create({
      teacherId,
      teacherName,
      ...overrides,
    });
  }

  /**
   * Create courses scheduled for a specific day
   */
  static createForDay(dayOfWeek: number, overrides: Partial<Course> = {}): Course {
    return this.create({
      schedule: [{ dayOfWeek, startTime: '10:00', endTime: '11:00' }],
      ...overrides,
    });
  }
}

export default CourseFactory;
