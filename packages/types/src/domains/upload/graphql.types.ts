/**
 * Types GraphQL pour Upload (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module upload/graphql.types
 */

/**
 * Informations sur un fichier uploadé (GraphQL)
 */
export interface FileInfo {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  extension: string;
  uploadedAt: string;
  uploadedBy?: number;
}

/**
 * Résultat d'un upload de fichier (GraphQL)
 */
export interface UploadResult {
  success: boolean;
  message: string;
  file?: FileInfo;
  files?: FileInfo[];
}

/**
 * Résultat de liste de fichiers (GraphQL)
 */
export interface ListFilesResult {
  success: boolean;
  files: FileInfo[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Résultat de suppression de fichier (GraphQL)
 */
export interface DeleteFileResult {
  success: boolean;
  message: string;
  deletedFile?: string;
}

/**
 * Résultat du health check du service d'upload (GraphQL)
 */
export interface UploadHealthResult {
  status: string;
  message: string;
  checks: UploadHealthChecks;
  timestamp?: string;
}

/**
 * Détails des vérifications du health check (GraphQL)
 */
export interface UploadHealthChecks {
  storage: boolean;
  permissions: boolean;
  diskSpace: boolean;
}

/**
 * Options de filtrage pour la liste de fichiers (GraphQL)
 */
export interface ListFilesOptions {
  type?: string;
  userId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Input pour l'upload de fichier (GraphQL)
 */
export interface UploadFileInput {
  file: any; // File upload scalar
  userId?: number;
  folder?: string;
}

/**
 * Input pour l'upload multiple (GraphQL)
 */
export interface UploadMultipleFilesInput {
  files: any[]; // File upload scalar array
  userId?: number;
  folder?: string;
}

/**
 * Input pour supprimer un fichier (GraphQL)
 */
export interface DeleteFileInput {
  filename: string;
  userId?: number;
}

/**
 * Statistiques d'upload (GraphQL)
 */
export interface UploadStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  uploadsByUser?: Record<number, number>;
}

/**
 * Configuration d'upload (GraphQL)
 */
export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  uploadDir: string;
  maxFiles?: number;
}

/**
 * Contexte GraphQL pour Upload
 */
export interface UploadContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
