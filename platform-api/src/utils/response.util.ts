/**
 * Response Utilities
 * Helper functions for consistent API responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface ApiListResponse<T = any> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  timestamp: string;
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  field?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create list response with pagination
 */
export function listResponse<T>(
  data: T[],
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  },
  message?: string
): ApiListResponse<T> {
  return {
    success: true,
    data,
    pagination: pagination ? {
      ...pagination,
      hasNext: pagination.hasNext ?? pagination.page < pagination.totalPages,
      hasPrev: pagination.hasPrev ?? pagination.page > 1
    } : undefined,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create created response (201)
 */
export function createdResponse<T>(data: T, message = 'Resource created successfully'): ApiResponse<T> {
  return successResponse(data, message);
}

/**
 * Create updated response (200)
 */
export function updatedResponse<T>(data: T, message = 'Resource updated successfully'): ApiResponse<T> {
  return successResponse(data, message);
}

/**
 * Create deleted response (200)
 */
export function deletedResponse(message = 'Resource deleted successfully'): ApiResponse<null> {
  return {
    success: true,
    data: null,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create no content response (204)
 */
export function noContentResponse(): ApiResponse<null> {
  return {
    success: true,
    data: null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create validation error response (400)
 */
export function validationErrorResponse(message: string, field?: string, details?: any): ApiResponse {
  return errorResponse('VALIDATION_ERROR', message, details, field);
}

/**
 * Create not found error response (404)
 */
export function notFoundResponse(resource = 'Resource', details?: any): ApiResponse {
  return errorResponse('NOT_FOUND', `${resource} not found`, details);
}

/**
 * Create unauthorized error response (401)
 */
export function unauthorizedResponse(message = 'Authentication required'): ApiResponse {
  return errorResponse('UNAUTHORIZED', message);
}

/**
 * Create forbidden error response (403)
 */
export function forbiddenResponse(message = 'Access denied'): ApiResponse {
  return errorResponse('FORBIDDEN', message);
}

/**
 * Create conflict error response (409)
 */
export function conflictResponse(message: string, details?: any): ApiResponse {
  return errorResponse('CONFLICT', message, details);
}

/**
 * Create bad request error response (400)
 */
export function badRequestResponse(message: string, details?: any): ApiResponse {
  return errorResponse('BAD_REQUEST', message, details);
}

/**
 * Create internal server error response (500)
 */
export function internalErrorResponse(message = 'Internal server error', details?: any): ApiResponse {
  return errorResponse('INTERNAL_ERROR', message, details);
}

/**
 * Create rate limit error response (429)
 */
export function rateLimitResponse(message = 'Too many requests'): ApiResponse {
  return errorResponse('RATE_LIMIT_EXCEEDED', message);
}

/**
 * Create service unavailable error response (503)
 */
export function serviceUnavailableResponse(message = 'Service temporarily unavailable'): ApiResponse {
  return errorResponse('SERVICE_UNAVAILABLE', message);
}

/**
 * Extract error message from unknown error
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Create response from error
 */
export function fromError(error: unknown): ApiResponse {
  const message = extractErrorMessage(error);

  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return validationErrorResponse(message);
    }
    if (error.name === 'NotFoundError') {
      return notFoundResponse('Resource');
    }
    if (error.name === 'UnauthorizedError') {
      return unauthorizedResponse(message);
    }
    if (error.name === 'ForbiddenError') {
      return forbiddenResponse(message);
    }
  }

  return internalErrorResponse(message);
}

/**
 * HTTP Status Code mapping
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Get HTTP status code from error code
 */
export function getHttpStatusFromErrorCode(code: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': HttpStatus.BAD_REQUEST,
    'NOT_FOUND': HttpStatus.NOT_FOUND,
    'UNAUTHORIZED': HttpStatus.UNAUTHORIZED,
    'FORBIDDEN': HttpStatus.FORBIDDEN,
    'CONFLICT': HttpStatus.CONFLICT,
    'BAD_REQUEST': HttpStatus.BAD_REQUEST,
    'RATE_LIMIT_EXCEEDED': HttpStatus.TOO_MANY_REQUESTS,
    'SERVICE_UNAVAILABLE': HttpStatus.SERVICE_UNAVAILABLE,
    'INTERNAL_ERROR': HttpStatus.INTERNAL_SERVER_ERROR
  };

  return statusMap[code] || HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Send JSON response with proper status code
 */
export function sendResponse(res: any, response: ApiResponse, statusCode?: number): void {
  const status = statusCode || (response.success ? HttpStatus.OK :
    (response.error ? getHttpStatusFromErrorCode(response.error.code) : HttpStatus.INTERNAL_SERVER_ERROR));

  res.status(status).json(response);
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: any, data: T, message?: string, statusCode = HttpStatus.OK): void {
  sendResponse(res, successResponse(data, message), statusCode);
}

/**
 * Send error response
 */
export function sendError(res: any, code: string, message: string, details?: any, statusCode?: number): void {
  sendResponse(res, errorResponse(code, message, details), statusCode);
}

/**
 * Send list response
 */
export function sendList<T>(
  res: any,
  data: T[],
  pagination?: any,
  message?: string,
  statusCode = HttpStatus.OK
): void {
  sendResponse(res, listResponse(data, pagination, message), statusCode);
}
