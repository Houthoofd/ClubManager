/**
 * Schémas de validation Zod pour le module Upload
 * Validation des données de fichiers uploadés
 */

import { z } from "zod";

/**
 * Extensions de fichiers autorisées
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
];
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
];
export const ALLOWED_ALL_EXTENSIONS = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_DOCUMENT_EXTENSIONS,
];

/**
 * Taille maximale de fichier (en bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Schéma pour un fichier uploadé
 */
export const uploadedFileSchema = z.object({
  fieldname: z.string().min(1, "Le nom du champ est requis"),
  originalname: z.string().min(1, "Le nom original du fichier est requis"),
  encoding: z.string().min(1, "L'encodage est requis"),
  mimetype: z.string().min(1, "Le type MIME est requis"),
  destination: z.string().min(1, "La destination est requise"),
  filename: z.string().min(1, "Le nom du fichier est requis"),
  path: z.string().min(1, "Le chemin est requis"),
  size: z
    .number()
    .positive("La taille doit être positive")
    .max(
      MAX_FILE_SIZE,
      `La taille du fichier ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    ),
});

/**
 * Schéma pour la validation d'un tableau de fichiers
 */
export const uploadedFilesArraySchema = z
  .array(uploadedFileSchema)
  .min(1, "Au moins un fichier est requis");

/**
 * Schéma pour la réponse d'upload
 */
export const uploadResponseSchema = z.object({
  files: z.array(
    z.object({
      url: z.string().url("L'URL doit être valide"),
      name: z.string().min(1, "Le nom du fichier ne peut pas être vide"),
      size: z.number().positive().optional(),
      mimetype: z.string().optional(),
    }),
  ),
});

/**
 * Schéma pour les options d'upload
 */
export const uploadOptionsSchema = z.object({
  allowedExtensions: z.array(z.string()).optional(),
  maxFileSize: z.number().positive().optional(),
  sanitizeFilename: z.boolean().optional().default(true),
});

/**
 * Schéma pour la validation d'un nom de fichier
 */
export const filenameSchema = z
  .string()
  .min(1, "Le nom de fichier ne peut pas être vide")
  .max(255, "Le nom de fichier ne peut pas dépasser 255 caractères")
  .refine(
    (filename) => !filename.includes(".."),
    "Le nom de fichier ne peut pas contenir '..'",
  )
  .refine(
    (filename) => !filename.includes("/") && !filename.includes("\\"),
    "Le nom de fichier ne peut pas contenir de séparateurs de chemin",
  );

/**
 * Schéma pour la validation de l'extension d'un fichier
 */
export const fileExtensionSchema = z
  .string()
  .regex(
    /^\.[a-zA-Z0-9]+$/,
    "L'extension doit commencer par un point et contenir uniquement des caractères alphanumériques",
  );

/**
 * Schéma pour la validation du type MIME
 */
export const mimetypeSchema = z
  .string()
  .regex(
    /^[a-z]+\/[a-z0-9\-\+\.]+$/i,
    "Le type MIME doit être au format 'type/subtype'",
  );

/**
 * Schéma pour la validation de la taille de fichier
 */
export const fileSizeSchema = z
  .number()
  .positive("La taille du fichier doit être positive")
  .max(
    MAX_FILE_SIZE,
    `La taille du fichier ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024} MB`,
  );

/**
 * Schéma pour les métadonnées de fichier
 */
export const fileMetadataSchema = z.object({
  originalName: z.string().min(1, "Le nom original est requis"),
  sanitizedName: z.string().min(1, "Le nom sanitizé est requis"),
  size: fileSizeSchema,
  mimetype: mimetypeSchema,
  extension: fileExtensionSchema,
  uploadDate: z.date().optional(),
  path: z.string().min(1, "Le chemin est requis"),
  url: z.string().url("L'URL doit être valide"),
});

/**
 * Schéma pour la validation de l'encodage
 */
export const encodingSchema = z.enum([
  "7bit",
  "8bit",
  "binary",
  "base64",
  "quoted-printable",
]);

/**
 * Schéma pour les paramètres de sanitization
 */
export const sanitizationOptionsSchema = z.object({
  removeAccents: z.boolean().optional().default(true),
  replaceSpaces: z.boolean().optional().default(true),
  lowercase: z.boolean().optional().default(false),
  addTimestamp: z.boolean().optional().default(true),
  maxLength: z.number().positive().optional().default(255),
});

/**
 * Schéma pour les statistiques d'upload
 */
export const uploadStatsSchema = z.object({
  totalFiles: z
    .number()
    .nonnegative("Le nombre de fichiers doit être positif ou nul"),
  totalSize: z
    .number()
    .nonnegative("La taille totale doit être positive ou nulle"),
  successfulUploads: z
    .number()
    .nonnegative("Le nombre d'uploads réussis doit être positif ou nul"),
  failedUploads: z
    .number()
    .nonnegative("Le nombre d'uploads échoués doit être positif ou nul"),
});

/**
 * Schéma pour la configuration du stockage
 */
export const storageConfigSchema = z.object({
  destination: z.string().min(1, "Le dossier de destination est requis"),
  createIfNotExists: z.boolean().optional().default(true),
  maxStorageSize: z.number().positive().optional(),
});

/**
 * Schéma pour les erreurs d'upload
 */
export const uploadErrorSchema = z.object({
  filename: z.string().optional(),
  error: z.string().min(1, "Le message d'erreur ne peut pas être vide"),
  code: z.enum([
    "FILE_TOO_LARGE",
    "INVALID_EXTENSION",
    "INVALID_MIMETYPE",
    "UPLOAD_FAILED",
    "SANITIZATION_FAILED",
    "STORAGE_ERROR",
    "UNKNOWN_ERROR",
  ]),
  details: z.any().optional(),
});

/**
 * Schéma pour la réponse d'erreur d'upload
 */
export const uploadErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string().min(1, "Le message d'erreur ne peut pas être vide"),
  errors: z.array(uploadErrorSchema).optional(),
});

/**
 * Schéma pour la réponse de succès d'upload
 */
export const uploadSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  files: z.array(fileMetadataSchema),
  stats: uploadStatsSchema.optional(),
});

/**
 * Schéma pour l'input GraphQL d'upload de fichier
 */
export const fileUploadInputSchema = z.object({
  filename: z.string().min(1, "Le nom du fichier est requis"),
  mimetype: z.string().min(1, "Le type MIME est requis"),
  encoding: z.string().min(1, "L'encodage est requis"),
  content: z.string().min(1, "Le contenu base64 est requis"),
});

/**
 * Schéma pour l'input GraphQL de suppression de fichier
 */
export const deleteFileInputSchema = z.object({
  filename: filenameSchema,
});

/**
 * Schéma pour l'input GraphQL de liste de fichiers
 */
export const listFilesInputSchema = z.object({
  limit: z.number().positive().optional().default(50),
  offset: z.number().nonnegative().optional().default(0),
  sortBy: z.enum(["name", "size", "date"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  extension: z.string().optional(),
});

/**
 * Schéma pour l'input GraphQL de récupération d'info fichier
 */
export const getFileInfoInputSchema = z.object({
  filename: filenameSchema,
});

/**
 * Schéma pour l'input GraphQL de vérification d'existence de fichier
 */
export const fileExistsInputSchema = z.object({
  filename: z.string().min(1, "Le nom du fichier est requis"),
});

/**
 * Schéma pour l'input GraphQL de nettoyage de fichiers anciens
 */
export const cleanupOldFilesInputSchema = z.object({
  daysOld: z.number().positive().optional().default(30),
});

/**
 * Type exports pour TypeScript
 */
export type UploadedFile = z.infer<typeof uploadedFileSchema>;
export type UploadedFilesArray = z.infer<typeof uploadedFilesArraySchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
export type UploadOptions = z.infer<typeof uploadOptionsSchema>;
export type Filename = z.infer<typeof filenameSchema>;
export type FileExtension = z.infer<typeof fileExtensionSchema>;
export type Mimetype = z.infer<typeof mimetypeSchema>;
export type FileSize = z.infer<typeof fileSizeSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type Encoding = z.infer<typeof encodingSchema>;
export type SanitizationOptions = z.infer<typeof sanitizationOptionsSchema>;
export type UploadStats = z.infer<typeof uploadStatsSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type UploadError = z.infer<typeof uploadErrorSchema>;
export type UploadErrorResponse = z.infer<typeof uploadErrorResponseSchema>;
export type UploadSuccessResponse = z.infer<typeof uploadSuccessResponseSchema>;
export type FileUploadInput = z.infer<typeof fileUploadInputSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileInputSchema>;
export type ListFilesInput = z.infer<typeof listFilesInputSchema>;
export type GetFileInfoInput = z.infer<typeof getFileInfoInputSchema>;
export type FileExistsInput = z.infer<typeof fileExistsInputSchema>;
export type CleanupOldFilesInput = z.infer<typeof cleanupOldFilesInputSchema>;
