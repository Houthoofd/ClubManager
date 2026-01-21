/**
 * Services Index - Club Manager SaaS
 * Structure organisée pour la gestion de clubs de sport
 */

// Core Infrastructure
export { prisma } from "./prisma/prisma.service.js";
export { auditService } from "./infrastructure/audit/audit.service.js";
export { multiTenantService } from "./infrastructure/tenant/multi-tenant.service.js";
export { tenantService } from "./infrastructure/tenant/tenant.service.js";

// Platform Services
export { healthCheckService } from "./platform/health-check/health-check.service.js";
export { rateLimitService } from "./platform/rate-limit/rate-limit.service.js";
export { statisticsService } from "./platform/statistics/statistics.service.js";

// 🏃‍♀️ SPORTS MANAGEMENT - Gestion des activités sportives
export { courseService } from "./sports/training/course.service.js";
export { enrollmentService } from "./sports/training/enrollment.service.js";
export { attendanceService } from "./sports/training/attendance.service.js";
export { messageService } from "./sports/communication/message.service.js";
export { articleService } from "./sports/news/article.service.js";

// 👥 MEMBERS MANAGEMENT - Gestion des membres/adhérents
export { userService } from "./members/user/user.service.js";
export { verificationService } from "./members/verification/verification.service.js";

// 🏢 OPERATIONS - Gestion commerciale et administrative
export { productService } from "./operations/shop/product/product.service.js";
export { inventoryService } from "./operations/shop/inventory/inventory.service.js";
export { orderService } from "./operations/shop/order/order.service.js";
export { paymentService } from "./operations/billing/payment.service.js";
export { emailService } from "./operations/communication/email.service.js";
export { informationService } from "./business/content/information/information.service.js";

// Service helpers organisés par domaine
export * as shopHelpers from "./operations/shop/product/product.helpers.js";
export * as orderHelpers from "./operations/shop/order/order.helpers.js";
export * as messageHelpers from "./sports/communication/message.helpers.js";
