/**
 * GraphQL Type Definitions for Verification Module
 * Handles duplicate checks for products, courses, and other entities
 */

export const verificationTypeDefs = `
  # ============================================================================
  # Verification Types
  # ============================================================================

  """
  Result of checking if a product exists
  """
  type ProductCheckResult {
    exists: Boolean!
    product: Products
  }

  """
  Result of checking if a course schedule conflicts
  """
  type CourseCheckResult {
    exists: Boolean!
    conflictingCourses: [RecurringCourses!]
  }

  """
  Input for checking course schedule conflicts
  """
  input CheckCourseScheduleInput {
    day: String!
    startTime: String!
    endTime: String!
    courseType: String
    excludeOriginal: Boolean
    originalDay: String
    originalType: String
    originalStartTime: String
    originalEndTime: String
  }

  # ============================================================================
  # Verification Queries
  # ============================================================================

  extend type Query {
    """
    Check if a product exists by name and category
    """
    checkProductByNameAndCategory(name: String!, categoryId: Int!): ProductCheckResult!

    """
    Check if a product exists by name only
    """
    checkProductByName(name: String!): ProductCheckResult!

    """
    Check if a course schedule conflicts with existing courses
    """
    checkCourseSchedule(input: CheckCourseScheduleInput!): CourseCheckResult!
  }
`;

export default verificationTypeDefs;
