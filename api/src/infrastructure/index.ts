/**
 * Infrastructure - Barrel Export
 *
 * Exports centralisés pour tous les services d'infrastructure
 * Simplifie les imports dans toute l'application
 *
 * @example
 * import { prisma, emailClient, s3Service } from '@/infrastructure';
 */

// ===== Database =====
export { prisma } from './database/prisma-client.js';

// ===== External Services =====
export { emailClient } from './external-services/email/index.js';
export { EmailClient } from './external-services/emailClient.js';
export { s3Service } from './external-services/s3/s3.service.js';

// ===== Types =====
export type { S3UploadResult } from './external-services/s3/s3.service.js';
