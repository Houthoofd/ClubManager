/**
 * ====================================================================
 * VALIDATION CONSTANTS
 * ====================================================================
 *
 * Global validation rules and constraints used across the application.
 * Centralized validation ensures consistency and makes updates easier.
 *
 * Usage:
 * ```tsx
 * import { VALIDATION } from '@/core/constants';
 *
 * if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
 *   // Handle error
 * }
 * ```
 */

// ====================================================================
// GENERAL VALIDATION RULES
// ====================================================================

export const VALIDATION = {
  // ==================================================================
  // EMAIL VALIDATION
  // ==================================================================
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PATTERN: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
  },

  // ==================================================================
  // PASSWORD VALIDATION
  // ==================================================================
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: false,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  },

  // ==================================================================
  // USERNAME VALIDATION
  // ==================================================================
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    REGEX: /^[a-zA-Z0-9_-]+$/,
    PATTERN: '^[a-zA-Z0-9_-]+$',
  },

  // ==================================================================
  // NAME VALIDATION (First/Last Name)
  // ==================================================================
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    REGEX: /^[a-zA-ZÀ-ÿ\s'-]+$/,
    PATTERN: '^[a-zA-ZÀ-ÿ\\s\'-]+$',
  },

  // ==================================================================
  // PHONE NUMBER VALIDATION
  // ==================================================================
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    BELGIUM_REGEX: /^(\+32|0)[1-9]\d{7,8}$/,
  },

  // ==================================================================
  // ADDRESS VALIDATION
  // ==================================================================
  ADDRESS: {
    STREET: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 100,
    },
    CITY: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
    POSTAL_CODE: {
      MIN_LENGTH: 4,
      MAX_LENGTH: 10,
      BELGIUM_REGEX: /^\d{4}$/,
    },
    COUNTRY: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
  },

  // ==================================================================
  // COURSE VALIDATION
  // ==================================================================
  COURSE: {
    TITLE: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 1000,
    },
    DURATION: {
      MIN_MINUTES: 30,
      MAX_MINUTES: 240, // 4 hours
    },
    MAX_PARTICIPANTS: 50,
    MIN_PARTICIPANTS: 1,
    MAX_PROFESSORS: 3,
    MIN_PROFESSORS: 1,
    PRICE: {
      MIN: 0,
      MAX: 10000,
    },
  },

  // ==================================================================
  // SHOP/ARTICLE VALIDATION
  // ==================================================================
  ARTICLE: {
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000,
    },
    PRICE: {
      MIN: 0.01,
      MAX: 100000,
    },
    STOCK: {
      MIN: 0,
      MAX: 999999,
    },
    SKU: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 50,
      REGEX: /^[A-Z0-9-_]+$/,
    },
  },

  // ==================================================================
  // MESSAGE VALIDATION
  // ==================================================================
  MESSAGE: {
    SUBJECT: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 200,
    },
    BODY: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 5000,
    },
    MAX_RECIPIENTS: 100,
  },

  // ==================================================================
  // FILE UPLOAD VALIDATION
  // ==================================================================
  FILE_UPLOAD: {
    IMAGE: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    DOCUMENT: {
      MAX_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'],
    },
    AVATAR: {
      MAX_SIZE: 2 * 1024 * 1024, // 2MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
      ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
      MIN_WIDTH: 100,
      MAX_WIDTH: 2000,
      MIN_HEIGHT: 100,
      MAX_HEIGHT: 2000,
    },
  },

  // ==================================================================
  // DATE VALIDATION
  // ==================================================================
  DATE: {
    MIN_AGE: 16, // Minimum age for users
    MAX_AGE: 120,
    BOOKING_ADVANCE_DAYS: 365, // Max days in advance for bookings
    CANCELLATION_HOURS: 24, // Minimum hours before cancellation
  },

  // ==================================================================
  // PAYMENT VALIDATION
  // ==================================================================
  PAYMENT: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 50000,
    CARD_NUMBER_LENGTH: 16,
    CVV_LENGTH: 3,
    CARD_EXPIRY_REGEX: /^(0[1-9]|1[0-2])\/\d{2}$/,
  },

  // ==================================================================
  // SEARCH & PAGINATION
  // ==================================================================
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
  },

  PAGINATION: {
    MIN_PAGE_SIZE: 5,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE_SIZE: 20,
  },
} as const;

// ====================================================================
// VALIDATION ERROR MESSAGES
// ====================================================================

export const VALIDATION_MESSAGES = {
  REQUIRED: 'validation.required',
  INVALID_EMAIL: 'validation.invalidEmail',
  INVALID_PHONE: 'validation.invalidPhone',
  PASSWORD_TOO_SHORT: 'validation.passwordTooShort',
  PASSWORD_TOO_WEAK: 'validation.passwordTooWeak',
  MIN_LENGTH: 'validation.minLength',
  MAX_LENGTH: 'validation.maxLength',
  MIN_VALUE: 'validation.minValue',
  MAX_VALUE: 'validation.maxValue',
  INVALID_FORMAT: 'validation.invalidFormat',
  FILE_TOO_LARGE: 'validation.fileTooLarge',
  INVALID_FILE_TYPE: 'validation.invalidFileType',
  INVALID_DATE: 'validation.invalidDate',
  DATE_IN_PAST: 'validation.dateInPast',
  DATE_TOO_FAR: 'validation.dateTooFar',
} as const;

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL.REGEX.test(email) &&
         email.length >= VALIDATION.EMAIL.MIN_LENGTH &&
         email.length <= VALIDATION.EMAIL.MAX_LENGTH;
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD.MIN_LENGTH &&
         password.length <= VALIDATION.PASSWORD.MAX_LENGTH &&
         VALIDATION.PASSWORD.REGEX.test(password);
};

/**
 * Validate phone number (Belgium format)
 */
export const isValidBelgianPhone = (phone: string): boolean => {
  return VALIDATION.PHONE.BELGIUM_REGEX.test(phone);
};

/**
 * Validate phone number (international format)
 */
export const isValidPhone = (phone: string): boolean => {
  return VALIDATION.PHONE.REGEX.test(phone);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate Belgian postal code
 */
export const isValidBelgianPostalCode = (postalCode: string): boolean => {
  return VALIDATION.ADDRESS.POSTAL_CODE.BELGIUM_REGEX.test(postalCode);
};

/**
 * Validate price (positive number with max 2 decimals)
 */
export const isValidPrice = (price: number, min: number = 0, max: number = Infinity): boolean => {
  return price >= min &&
         price <= max &&
         Number.isFinite(price) &&
         /^\d+(\.\d{1,2})?$/.test(price.toString());
};

/**
 * Validate date is in the future
 */
export const isDateInFuture = (date: Date): boolean => {
  return date > new Date();
};

/**
 * Validate date is within allowed booking range
 */
export const isDateWithinBookingRange = (date: Date): boolean => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + VALIDATION.DATE.BOOKING_ADVANCE_DAYS);
  return date >= new Date() && date <= maxDate;
};

/**
 * Validate minimum age
 */
export const isMinimumAge = (birthDate: Date, minAge: number = VALIDATION.DATE.MIN_AGE): boolean => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
};

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type ValidationRule = typeof VALIDATION;
export type ValidationMessageKey = keyof typeof VALIDATION_MESSAGES;
