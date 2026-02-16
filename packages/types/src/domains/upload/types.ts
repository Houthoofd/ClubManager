/**
 * Types GraphQL pour le module Upload
 * Types TypeScript correspondant aux schémas GraphQL
 */

/**
 * Contexte GraphQL pour Upload
 */
export interface UploadContext {
  prisma: any;
  userId?: number;
  userRole?: string;
}

/**
 * Input pour l'upload d'un fichier
 */
export interface FileUploadInput {
  filename: string;
  mimetype: string;
  encoding: string;
  content: string; // Base64 encoded
}

/**
 * Input pour la suppression d'un fichier
 */
export interface DeleteFileInput {
  filename: string;
}

/**
 * Input pour lister les fichiers
 */
export interface ListFilesInput {
  limit?: number;
  offset?: number;
  sortBy?: "name" | "size" | "date";
  sortOrder?: "asc" | "desc";
  extension?: string;
}

/**
 * Informations sur un fichier
 */
export interface FileInfo {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  extension: string;
  uploadedAt: Date;
  uploadedBy?: number;
}

/**
 * Résultat d'upload
 */
export interface UploadResult {
  success: boolean;
  message: string;
  file?: FileInfo;
  files?: FileInfo[];
}

/**
 * Résultat de liste de fichiers
 */
export interface ListFilesResult {
  success: boolean;
  files: FileInfo[];
  total: number;
  hasMore: boolean;
}

/**
 * Résultat de suppression de fichier
 */
export interface DeleteFileResult {
  success: boolean;
  message: string;
}

/**
 * Résultat de vérification d'existence
 */
export interface FileExistsResult {
  exists: boolean;
  filename: string;
}

/**
 * Statistiques d'upload
 */
export interface UploadStats {
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  filesByExtension: FilesByExtension[];
  recentUploads: FileInfo[];
}

/**
 * Fichiers par extension
 */
export interface FilesByExtension {
  extension: string;
  count: number;
}

/**
 * Health check du service upload
 */
export interface UploadHealthResult {
  status: string;
  message: string;
  uploadsDirectory: string;
  isWritable: boolean;
  diskSpace?: DiskSpace;
  timestamp: Date;
}

/**
 * Espace disque
 */
export interface DiskSpace {
  total: number;
  used: number;
  free: number;
  percentUsed: number;
}

/**
 * Résultat de nettoyage
 */
export interface CleanupResult {
  success: boolean;
  message: string;
  filesDeleted: string[];
  count: number;
}
