/**
 * Validation Middleware
 *
 * Centralized validation middleware using Zod schemas.
 * Provides reusable validation for GraphQL resolvers.
 */

import { GraphQLResolveInfo } from 'graphql';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/GraphQLErrors';
import { ErrorCode } from '../errors/error-codes';

export interface ValidationOptions {
  schema: ZodSchema;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

/**
 * Validation middleware factory
 */
export function withValidation<TArgs = any, TContext = any, TResult = any>(
  schema: ZodSchema,
  resolver: (parent: any, args: TArgs, context: TContext, info: GraphQLResolveInfo) => Promise<TResult>
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ): Promise<TResult> => {
    try {
      // Validate arguments
      const validatedArgs = schema.parse(args);

      // Call resolver with validated arguments
      return await resolver(parent, validatedArgs as TArgs, context, info);
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors to GraphQL validation errors
        const formattedErrors = formatZodErrors(error);
        throw new ValidationError(
          'Validation failed',
          ErrorCode.VALIDATION_ERROR,
          formattedErrors
        );
      }
      throw error;
    }
  };
}

/**
 * Format Zod errors for client consumption
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return errors;
}

/**
 * Validate input with custom schema
 */
export function validateInput<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodErrors(error);
      throw new ValidationError(
        'Validation failed',
        ErrorCode.VALIDATION_ERROR,
        formattedErrors
      );
    }
    throw error;
  }
}

/**
 * Validate input and return result with errors
 */
export function safeValidateInput<T>(
  schema: ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: formatZodErrors(result.error) };
  }
}

/**
 * Middleware for nested object validation
 */
export function withNestedValidation<TArgs = any, TContext = any, TResult = any>(
  schemas: Record<string, ZodSchema>,
  resolver: (parent: any, args: TArgs, context: TContext, info: GraphQLResolveInfo) => Promise<TResult>
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ): Promise<TResult> => {
    try {
      const validatedArgs = { ...args } as any;

      // Validate each nested object
      for (const [key, schema] of Object.entries(schemas)) {
        if ((args as any)[key] !== undefined) {
          validatedArgs[key] = schema.parse((args as any)[key]);
        }
      }

      return await resolver(parent, validatedArgs as TArgs, context, info);
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        throw new ValidationError(
          'Validation failed',
          ErrorCode.VALIDATION_ERROR,
          formattedErrors
        );
      }
      throw error;
    }
  };
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  id: z.string().uuid({ message: 'Invalid ID format' }),

  email: z.string()
    .email({ message: 'Invalid email format' })
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),

  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),

  phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
      'Invalid phone number format'),

  url: z.string().url({ message: 'Invalid URL format' }),

  date: z.date({ invalid_type_error: 'Invalid date format' }),

  dateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date'),

  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  search: z.object({
    query: z.string().min(1).max(200),
    filters: z.record(z.any()).optional(),
  }),

  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),

  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  text: z.string()
    .min(1, 'Text is required')
    .max(1000, 'Text must be less than 1000 characters')
    .trim(),

  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be less than 100 characters'),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)'),

  language: z.enum(['fr', 'en', 'nl'], {
    errorMap: () => ({ message: 'Language must be fr, en, or nl' })
  }),
};

/**
 * Validation helpers
 */
export const ValidationHelpers = {
  /**
   * Create a validation schema for updates (all fields optional)
   */
  toUpdateSchema<T extends ZodSchema>(schema: T): z.ZodOptional<T> {
    return schema.optional();
  },

  /**
   * Create a validation schema for partial updates
   */
  toPartialSchema<T extends z.ZodObject<any>>(schema: T): z.ZodObject<any> {
    return schema.partial();
  },

  /**
   * Combine multiple schemas
   */
  mergeSchemas<T extends z.ZodObject<any>>(
    ...schemas: T[]
  ): z.ZodObject<any> {
    return schemas.reduce((acc, schema) => acc.merge(schema));
  },

  /**
   * Add custom refinement to schema
   */
  addRefinement<T extends ZodSchema>(
    schema: T,
    check: (data: any) => boolean,
    message: string
  ): T {
    return schema.refine(check, { message }) as T;
  },
};

/**
 * Custom Zod validators
 */
export const CustomValidators = {
  /**
   * Validate password confirmation
   */
  passwordConfirmation: () =>
    z.object({
      password: z.string(),
      passwordConfirmation: z.string(),
    }).refine(
      data => data.password === data.passwordConfirmation,
      {
        message: 'Passwords do not match',
        path: ['passwordConfirmation'],
      }
    ),

  /**
   * Validate date range
   */
  dateRange: () =>
    z.object({
      startDate: z.date(),
      endDate: z.date(),
    }).refine(
      data => data.startDate <= data.endDate,
      {
        message: 'Start date must be before end date',
        path: ['endDate'],
      }
    ),

  /**
   * Validate time range
   */
  timeRange: () =>
    z.object({
      startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    }).refine(
      data => data.startTime < data.endTime,
      {
        message: 'Start time must be before end time',
        path: ['endTime'],
      }
    ),

  /**
   * Validate unique array
   */
  uniqueArray: <T>(schema: ZodSchema<T>) =>
    z.array(schema).refine(
      arr => new Set(arr).size === arr.length,
      { message: 'Array must contain unique values' }
    ),

  /**
   * Validate non-empty array
   */
  nonEmptyArray: <T>(schema: ZodSchema<T>) =>
    z.array(schema).min(1, 'Array must contain at least one item'),

  /**
   * Validate future date
   */
  futureDate: () =>
    z.date().refine(
      date => date > new Date(),
      { message: 'Date must be in the future' }
    ),

  /**
   * Validate past date
   */
  pastDate: () =>
    z.date().refine(
      date => date < new Date(),
      { message: 'Date must be in the past' }
    ),

  /**
   * Validate age requirement
   */
  minAge: (age: number) =>
    z.date().refine(
      birthDate => {
        const today = new Date();
        const years = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        return years > age || (years === age && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
      },
      { message: `Must be at least ${age} years old` }
    ),

  /**
   * Validate file size
   */
  fileSize: (maxSizeInBytes: number) =>
    z.number().max(maxSizeInBytes, `File size must be less than ${maxSizeInBytes} bytes`),

  /**
   * Validate file type
   */
  fileType: (allowedTypes: string[]) =>
    z.string().refine(
      type => allowedTypes.includes(type),
      { message: `File type must be one of: ${allowedTypes.join(', ')}` }
    ),
};

/**
 * Sanitization helpers
 */
export const SanitizationHelpers = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Trim and normalize whitespace
   */
  normalizeWhitespace: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Remove special characters
   */
  removeSpecialChars: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9\s-]/g, '');
  },

  /**
   * Convert to slug
   */
  toSlug: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
};
