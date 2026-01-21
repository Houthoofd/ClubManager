/**
 * Services Index
 * Central export point for all services with new organized structure
 */

// Core services
export { prisma } from "./prisma/prisma.service.js";
export { auditService } from "./audit/audit.service.js";
export { emailService } from "./email/email.service.js";
export { healthCheckService } from "./health-check/health-check.service.js";
export { rateLimitService } from "./rate-limit/rate-limit.service.js";
export { tenantService } from "./tenant/tenant.service.js";

// Article service
export { articleService } from "./article/article.service.js";

// Information service
export { informationService } from "./information/information.service.js";

// Statistics service
export { statisticsService } from "./statistics/statistics.service.js";

// Verification service
export { verificationService } from "./verification/verification.service.js";

// Course services (divided into multiple files)
export { courseService } from "./course/course.service.js";
export { enrollmentService } from "./course/enrollment.service.js";
export { attendanceService } from "./course/attendance.service.js";

// Payment services (divided into multiple files)
export { paymentService } from "./payment/payment.service.js";

// User services (divided into multiple files)
export { userService } from "./user/user.service.js";

// Shop services
export { productService } from "./product/product.service.js";
export { inventoryService } from "./inventory/inventory.service.js";
export { orderService } from "./order/order.service.js";

// Message service
export { messageService } from "./message/message.service.js";

// Service helpers
export * as productHelpers from "./product/product.helpers.js";
export * as orderHelpers from "./order/order.helpers.js";
export * as messageHelpers from "./message/message.helpers.js";
