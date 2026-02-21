/**
 * ====================================================================
 * BUSINESS CONSTANTS
 * ====================================================================
 *
 * Domain-specific business rules and constants.
 * These represent the core business logic constraints of the ClubManager application.
 *
 * Usage:
 * ```tsx
 * import { BUSINESS } from '@/core/constants';
 *
 * if (participants >= BUSINESS.COURSES.MAX_PARTICIPANTS) {
 *   // Handle capacity reached
 * }
 * ```
 */

// ====================================================================
// COURSE BUSINESS RULES
// ====================================================================

export const BUSINESS = {
  // ==================================================================
  // COURSES
  // ==================================================================
  COURSES: {
    // Participant limits
    MAX_PARTICIPANTS_PER_COURSE: 50,
    MIN_PARTICIPANTS_TO_RUN: 5,
    DEFAULT_MAX_PARTICIPANTS: 20,

    // Professor limits
    MIN_PROFESSORS_PER_COURSE: 1,
    MAX_PROFESSORS_PER_COURSE: 3,

    // Enrollment limits
    MAX_COURSES_PER_PARTICIPANT_PER_WEEK: 7,
    MAX_SIMULTANEOUS_ENROLLMENTS: 10,

    // Duration constraints
    MIN_COURSE_DURATION_MINUTES: 30,
    MAX_COURSE_DURATION_MINUTES: 240, // 4 hours
    DEFAULT_COURSE_DURATION_MINUTES: 60,

    // Pricing
    MIN_PRICE: 0, // Free courses allowed
    MAX_PRICE: 500,
    DEFAULT_PRICE: 10,

    // Scheduling
    MIN_CANCELLATION_NOTICE_HOURS: 24,
    MAX_BOOKING_ADVANCE_DAYS: 90,
    MIN_BOOKING_ADVANCE_HOURS: 2,

    // Recurrence
    MAX_RECURRENCE_WEEKS: 52, // 1 year
    AVAILABLE_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const,

    // Status
    STATUSES: {
      SCHEDULED: 'scheduled',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      POSTPONED: 'postponed',
    } as const,

    // Types
    TYPES: {
      REGULAR: 'regular',
      TRIAL: 'trial',
      INTENSIVE: 'intensive',
      WORKSHOP: 'workshop',
      PRIVATE: 'private',
    } as const,

    // Levels
    LEVELS: {
      BEGINNER: 'beginner',
      INTERMEDIATE: 'intermediate',
      ADVANCED: 'advanced',
      ALL_LEVELS: 'all_levels',
    } as const,
  },

  // ==================================================================
  // USERS & MEMBERSHIP
  // ==================================================================
  USERS: {
    // Age requirements
    MIN_AGE: 16,
    MAX_AGE: 120,
    MINOR_AGE_LIMIT: 18, // Require parent/guardian info

    // Membership
    MEMBERSHIP_TYPES: {
      STUDENT: 'student',
      REGULAR: 'regular',
      PREMIUM: 'premium',
      VIP: 'vip',
    } as const,

    MEMBERSHIP_DURATIONS: {
      MONTHLY: 30,
      QUARTERLY: 90,
      SEMI_ANNUAL: 180,
      ANNUAL: 365,
    } as const,

    // Account limits
    MAX_ACTIVE_SESSIONS: 3,
    SESSION_TIMEOUT_MINUTES: 120,
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCKOUT_MINUTES: 30,

    // Roles
    ROLES: {
      ADMIN: 'admin',
      MANAGER: 'manager',
      TEACHER: 'teacher',
      STUDENT: 'student',
      GUEST: 'guest',
    } as const,

    // Status
    STATUSES: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      SUSPENDED: 'suspended',
      PENDING: 'pending',
      BLOCKED: 'blocked',
    } as const,
  },

  // ==================================================================
  // SHOP & ORDERS
  // ==================================================================
  SHOP: {
    // Order limits
    MIN_ORDER_AMOUNT: 0.01,
    MAX_ORDER_AMOUNT: 10000,
    MAX_ITEMS_PER_ORDER: 50,

    // Stock management
    LOW_STOCK_THRESHOLD: 10,
    OUT_OF_STOCK_THRESHOLD: 0,
    REORDER_THRESHOLD: 5,

    // Pricing
    MAX_DISCOUNT_PERCENTAGE: 90,
    MIN_DISCOUNT_PERCENTAGE: 0,

    // Order statuses
    ORDER_STATUSES: {
      PENDING: 'pending',
      PROCESSING: 'processing',
      CONFIRMED: 'confirmed',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
    } as const,

    // Payment statuses
    PAYMENT_STATUSES: {
      PENDING: 'pending',
      AUTHORIZED: 'authorized',
      CAPTURED: 'captured',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      PARTIALLY_REFUNDED: 'partially_refunded',
    } as const,

    // Categories
    MAX_CATEGORIES: 50,
    MAX_CATEGORY_DEPTH: 3,

    // Returns & Refunds
    RETURN_WINDOW_DAYS: 14,
    REFUND_PROCESSING_DAYS: 7,
  },

  // ==================================================================
  // PAYMENTS
  // ==================================================================
  PAYMENTS: {
    // Payment methods
    METHODS: {
      CREDIT_CARD: 'credit_card',
      DEBIT_CARD: 'debit_card',
      BANCONTACT: 'bancontact',
      PAYPAL: 'paypal',
      BANK_TRANSFER: 'bank_transfer',
      CASH: 'cash',
    } as const,

    // Installment plans
    MAX_INSTALLMENTS: 12,
    MIN_AMOUNT_FOR_INSTALLMENTS: 100,

    // Fees
    TRANSACTION_FEE_PERCENTAGE: 2.9,
    FIXED_TRANSACTION_FEE: 0.30,
    CURRENCY: 'EUR',
    CURRENCY_SYMBOL: '€',

    // Payment deadlines
    DEFAULT_PAYMENT_DEADLINE_DAYS: 30,
    LATE_PAYMENT_GRACE_PERIOD_DAYS: 7,
    LATE_PAYMENT_FEE_PERCENTAGE: 5,

    // Statuses
    STATUSES: {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      CANCELLED: 'cancelled',
    } as const,
  },

  // ==================================================================
  // MESSAGES
  // ==================================================================
  MESSAGES: {
    // Message limits
    MAX_RECIPIENTS: 100,
    MAX_ATTACHMENTS: 5,
    MAX_ATTACHMENT_SIZE_MB: 10,

    // Bulk messaging
    BULK_MESSAGE_LIMIT: 500,
    BULK_MESSAGE_RATE_LIMIT_PER_HOUR: 100,

    // Retention
    MESSAGE_RETENTION_DAYS: 365,
    DELETED_MESSAGE_RETENTION_DAYS: 30,

    // Priorities
    PRIORITIES: {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent',
    } as const,

    // Types
    TYPES: {
      ANNOUNCEMENT: 'announcement',
      NOTIFICATION: 'notification',
      REMINDER: 'reminder',
      ALERT: 'alert',
      PERSONAL: 'personal',
    } as const,

    // Statuses
    STATUSES: {
      UNREAD: 'unread',
      READ: 'read',
      ARCHIVED: 'archived',
      DELETED: 'deleted',
    } as const,
  },

  // ==================================================================
  // TEACHERS
  // ==================================================================
  TEACHERS: {
    // Workload limits
    MAX_COURSES_PER_WEEK: 20,
    MAX_HOURS_PER_DAY: 8,
    MAX_HOURS_PER_WEEK: 40,
    MIN_BREAK_BETWEEN_COURSES_MINUTES: 15,

    // Qualifications
    MIN_EXPERIENCE_YEARS: 0,
    CERTIFICATION_RENEWAL_MONTHS: 24,

    // Compensation
    MIN_HOURLY_RATE: 15,
    MAX_HOURLY_RATE: 200,
    DEFAULT_HOURLY_RATE: 25,

    // Availability
    MIN_ADVANCE_NOTICE_FOR_ABSENCE_HOURS: 48,

    // Status
    STATUSES: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      ON_LEAVE: 'on_leave',
      SUSPENDED: 'suspended',
    } as const,
  },

  // ==================================================================
  // NOTIFICATIONS
  // ==================================================================
  NOTIFICATIONS: {
    // Delivery preferences
    CHANNELS: {
      EMAIL: 'email',
      SMS: 'sms',
      PUSH: 'push',
      IN_APP: 'in_app',
    } as const,

    // Frequency limits
    MAX_EMAILS_PER_DAY: 10,
    MAX_SMS_PER_WEEK: 5,
    MAX_PUSH_PER_DAY: 20,

    // Reminder timings (hours before event)
    REMINDER_TIMINGS: {
      IMMEDIATE: 0,
      ONE_HOUR: 1,
      TWO_HOURS: 2,
      FOUR_HOURS: 4,
      ONE_DAY: 24,
      TWO_DAYS: 48,
      ONE_WEEK: 168,
    } as const,

    // Types
    TYPES: {
      COURSE_REMINDER: 'course_reminder',
      PAYMENT_DUE: 'payment_due',
      PAYMENT_RECEIVED: 'payment_received',
      ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
      COURSE_CANCELLED: 'course_cancelled',
      MESSAGE_RECEIVED: 'message_received',
      SYSTEM_ALERT: 'system_alert',
    } as const,
  },

  // ==================================================================
  // STATISTICS & REPORTING
  // ==================================================================
  STATISTICS: {
    // Report periods
    PERIODS: {
      TODAY: 'today',
      YESTERDAY: 'yesterday',
      LAST_7_DAYS: 'last_7_days',
      LAST_30_DAYS: 'last_30_days',
      THIS_MONTH: 'this_month',
      LAST_MONTH: 'last_month',
      THIS_QUARTER: 'this_quarter',
      THIS_YEAR: 'this_year',
      CUSTOM: 'custom',
    } as const,

    // Data retention
    RAW_DATA_RETENTION_DAYS: 90,
    AGGREGATED_DATA_RETENTION_YEARS: 5,

    // Export limits
    MAX_EXPORT_ROWS: 10000,
  },

  // ==================================================================
  // SYSTEM LIMITS
  // ==================================================================
  SYSTEM: {
    // Rate limiting
    API_RATE_LIMIT_PER_MINUTE: 60,
    API_RATE_LIMIT_PER_HOUR: 1000,

    // Uploads
    MAX_UPLOAD_SIZE_MB: 10,
    ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const,
    ALLOWED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx', 'xls', 'xlsx'] as const,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Search
    MIN_SEARCH_LENGTH: 2,
    MAX_SEARCH_RESULTS: 100,

    // Session
    SESSION_DURATION_MINUTES: 480, // 8 hours
    REMEMBER_ME_DURATION_DAYS: 30,
  },
} as const;

// ====================================================================
// BUSINESS LOGIC HELPERS
// ====================================================================

/**
 * Check if user can enroll in a course
 */
export const canEnrollInCourse = (
  currentEnrollments: number,
  courseCapacity: number,
  currentParticipants: number
): boolean => {
  return (
    currentEnrollments < BUSINESS.COURSES.MAX_SIMULTANEOUS_ENROLLMENTS &&
    currentParticipants < courseCapacity
  );
};

/**
 * Check if course has minimum participants to run
 */
export const hasMinimumParticipants = (participantCount: number): boolean => {
  return participantCount >= BUSINESS.COURSES.MIN_PARTICIPANTS_TO_RUN;
};

/**
 * Check if teacher workload is within limits
 */
export const isTeacherWorkloadValid = (
  coursesThisWeek: number,
  hoursThisDay: number,
  hoursThisWeek: number
): boolean => {
  return (
    coursesThisWeek < BUSINESS.TEACHERS.MAX_COURSES_PER_WEEK &&
    hoursThisDay < BUSINESS.TEACHERS.MAX_HOURS_PER_DAY &&
    hoursThisWeek < BUSINESS.TEACHERS.MAX_HOURS_PER_WEEK
  );
};

/**
 * Calculate total price with fees
 */
export const calculateTotalWithFees = (subtotal: number): number => {
  const feePercentage = BUSINESS.PAYMENTS.TRANSACTION_FEE_PERCENTAGE / 100;
  const totalFee = subtotal * feePercentage + BUSINESS.PAYMENTS.FIXED_TRANSACTION_FEE;
  return subtotal + totalFee;
};

/**
 * Check if stock is low
 */
export const isStockLow = (quantity: number): boolean => {
  return quantity <= BUSINESS.SHOP.LOW_STOCK_THRESHOLD && quantity > BUSINESS.SHOP.OUT_OF_STOCK_THRESHOLD;
};

/**
 * Check if item is out of stock
 */
export const isOutOfStock = (quantity: number): boolean => {
  return quantity <= BUSINESS.SHOP.OUT_OF_STOCK_THRESHOLD;
};

/**
 * Check if user is a minor
 */
export const isMinor = (birthDate: Date): boolean => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 < BUSINESS.USERS.MINOR_AGE_LIMIT;
  }

  return age < BUSINESS.USERS.MINOR_AGE_LIMIT;
};

/**
 * Check if payment is overdue
 */
export const isPaymentOverdue = (dueDate: Date): boolean => {
  const gracePeriod = new Date(dueDate);
  gracePeriod.setDate(gracePeriod.getDate() + BUSINESS.PAYMENTS.DEFAULT_PAYMENT_DEADLINE_DAYS);
  return new Date() > gracePeriod;
};

/**
 * Calculate late payment fee
 */
export const calculateLateFee = (amount: number): number => {
  return amount * (BUSINESS.PAYMENTS.LATE_PAYMENT_FEE_PERCENTAGE / 100);
};

/**
 * Format price with currency
 */
export const formatPrice = (amount: number): string => {
  return `${BUSINESS.PAYMENTS.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
};

/**
 * Check if discount is valid
 */
export const isValidDiscount = (percentage: number): boolean => {
  return (
    percentage >= BUSINESS.SHOP.MIN_DISCOUNT_PERCENTAGE &&
    percentage <= BUSINESS.SHOP.MAX_DISCOUNT_PERCENTAGE
  );
};

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type CourseStatus = typeof BUSINESS.COURSES.STATUSES[keyof typeof BUSINESS.COURSES.STATUSES];
export type CourseType = typeof BUSINESS.COURSES.TYPES[keyof typeof BUSINESS.COURSES.TYPES];
export type CourseLevel = typeof BUSINESS.COURSES.LEVELS[keyof typeof BUSINESS.COURSES.LEVELS];
export type UserRole = typeof BUSINESS.USERS.ROLES[keyof typeof BUSINESS.USERS.ROLES];
export type UserStatus = typeof BUSINESS.USERS.STATUSES[keyof typeof BUSINESS.USERS.STATUSES];
export type MembershipType = typeof BUSINESS.USERS.MEMBERSHIP_TYPES[keyof typeof BUSINESS.USERS.MEMBERSHIP_TYPES];
export type OrderStatus = typeof BUSINESS.SHOP.ORDER_STATUSES[keyof typeof BUSINESS.SHOP.ORDER_STATUSES];
export type PaymentStatus = typeof BUSINESS.SHOP.PAYMENT_STATUSES[keyof typeof BUSINESS.SHOP.PAYMENT_STATUSES];
export type PaymentMethod = typeof BUSINESS.PAYMENTS.METHODS[keyof typeof BUSINESS.PAYMENTS.METHODS];
export type MessagePriority = typeof BUSINESS.MESSAGES.PRIORITIES[keyof typeof BUSINESS.MESSAGES.PRIORITIES];
export type MessageType = typeof BUSINESS.MESSAGES.TYPES[keyof typeof BUSINESS.MESSAGES.TYPES];
export type NotificationChannel = typeof BUSINESS.NOTIFICATIONS.CHANNELS[keyof typeof BUSINESS.NOTIFICATIONS.CHANNELS];
export type NotificationType = typeof BUSINESS.NOTIFICATIONS.TYPES[keyof typeof BUSINESS.NOTIFICATIONS.TYPES];
export type StatisticsPeriod = typeof BUSINESS.STATISTICS.PERIODS[keyof typeof BUSINESS.STATISTICS.PERIODS];
