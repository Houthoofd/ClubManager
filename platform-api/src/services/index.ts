/**
 * Services Index
 * Central export point for all services
 */

// Core services
export { prisma } from './prismaService.js';
export { auditService } from './auditService.js';
export { emailService } from './emailService.js';
export { healthCheckService } from './healthCheckService.js';
export { rateLimitService } from './rateLimitService.js';
export { tenantService } from './tenantService.js';
export { userService } from './userService.js';

// New services replacing old clients
export { articleService } from './articleService.js';
export { informationService } from './informationService.js';
export { statisticsService } from './statisticsService.js';
export { verificationService } from './verificationService.js';

// Course and payment services
export { courseService } from './courseService.js';
export { paymentService } from './paymentService.js';

// Shop services
export { productService } from './product.service.js';
export { inventoryService } from './inventory.service.js';
export { orderService } from './order.service.js';

// Message service
export { messageService } from './message.service.js';

// Service helpers
export * as productHelpers from './product.helpers.js';
export * as orderHelpers from './order.helpers.js';
export * as messageHelpers from './message.helpers.js';
