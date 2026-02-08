/**
 * Resolvers GraphQL pour le module Upload
 * Expose les fonctionnalités d'upload via GraphQL
 */

import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";
import { uploadService } from "./core/services/upload.service.js";
import * as fs from "fs/promises";
import * as path from "path";

export interface UploadContext {
  prisma: PrismaClient;
  userId?: number;
  userRole?: string;
}

export interface FileUploadInput {
  filename: string;
  mimetype: string;
  encoding: string;
  content: string; // Base64 encoded file content
}

export interface DeleteFileInput {
  filename: string;
}

export interface ListFilesInput {
  limit?: number;
  offset?: number;
  sortBy?: "name" | "size" | "date";
  sortOrder?: "asc" | "desc";
  extension?: string;
}

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

export interface UploadResult {
  success: boolean;
  message: string;
  file?: FileInfo;
  files?: FileInfo[];
}

export interface UploadStats {
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  filesByExtension: { extension: string; count: number }[];
  recentUploads: FileInfo[];
}

/**
 * Crée les resolvers GraphQL pour Upload
 */
export const uploadResolvers = (prisma: PrismaClient) => {
  return {
    Query: {
      /**
       * Vérifie la santé du service d'upload
       */
      uploadHealth: async (
        _parent: any,
        _args: any,
        _context: UploadContext,
      ) => {
        try {
          const health = await uploadService.checkHealth();
          return {
            status: health.status,
            message: health.message,
            uploadsDirectory: health.uploadsDirectory,
            isWritable: health.isWritable,
            diskSpace: health.diskSpace,
            timestamp: new Date(),
          };
        } catch (error) {
          throw new GraphQLError("Failed to check upload service health", {
            extensions: {
              code: "UPLOAD_HEALTH_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Liste les fichiers uploadés
       */
      listUploadedFiles: async (
        _parent: any,
        args: ListFilesInput,
        _context: UploadContext,
      ) => {
        try {
          const {
            limit = 50,
            offset = 0,
            sortBy = "date",
            sortOrder = "desc",
            extension,
          } = args;

          const files = await uploadService.listFiles({
            limit,
            offset,
            sortBy,
            sortOrder,
            extension,
          });

          return {
            success: true,
            files,
            total: files.length,
            hasMore: files.length === limit,
          };
        } catch (error) {
          throw new GraphQLError("Failed to list uploaded files", {
            extensions: {
              code: "LIST_FILES_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Récupère les informations d'un fichier spécifique
       */
      getFileInfo: async (
        _parent: any,
        args: { filename: string },
        _context: UploadContext,
      ) => {
        try {
          const { filename } = args;

          if (!filename) {
            throw new GraphQLError("Filename is required", {
              extensions: { code: "INVALID_INPUT" },
            });
          }

          // Validation du nom de fichier
          const validation = uploadService.validateFilename(filename);
          if (!validation.isValid) {
            throw new GraphQLError(validation.error || "Invalid filename", {
              extensions: { code: "INVALID_FILENAME" },
            });
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, filename);

          // Vérifier que le fichier existe
          const exists = await uploadService.fileExists(filePath);
          if (!exists) {
            throw new GraphQLError("File not found", {
              extensions: { code: "FILE_NOT_FOUND" },
            });
          }

          const stats = await fs.stat(filePath);
          const ext = path.extname(filename).toLowerCase();

          return {
            filename,
            originalName: filename,
            path: `/uploads/${filename}`,
            size: stats.size,
            mimetype: uploadService.getMimeTypeFromExtension(ext),
            extension: ext,
            uploadedAt: stats.birthtime,
          };
        } catch (error) {
          if (error instanceof GraphQLError) {
            throw error;
          }
          throw new GraphQLError("Failed to get file info", {
            extensions: {
              code: "GET_FILE_INFO_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Récupère les statistiques d'upload
       */
      uploadStats: async (
        _parent: any,
        _args: any,
        _context: UploadContext,
      ) => {
        try {
          const stats = await uploadService.getUploadStats();

          return {
            totalFiles: stats.totalFiles,
            totalSize: stats.totalSize,
            averageSize: stats.averageSize,
            filesByExtension: stats.filesByExtension,
            recentUploads: stats.recentUploads || [],
          };
        } catch (error) {
          throw new GraphQLError("Failed to get upload statistics", {
            extensions: {
              code: "STATS_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Vérifie si un fichier existe
       */
      fileExists: async (
        _parent: any,
        args: { filename: string },
        _context: UploadContext,
      ) => {
        try {
          const { filename } = args;

          if (!filename) {
            return { exists: false, filename };
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, filename);
          const exists = await uploadService.fileExists(filePath);

          return {
            exists,
            filename,
          };
        } catch (error) {
          return {
            exists: false,
            filename: args.filename,
          };
        }
      },
    },

    Mutation: {
      /**
       * Upload un fichier (base64)
       */
      uploadFile: async (
        _parent: any,
        args: { input: FileUploadInput },
        _context: UploadContext,
      ) => {
        try {
          const { input } = args;
          const { filename, mimetype, content } = input;

          // Validation de base
          if (!filename || !content) {
            throw new GraphQLError("Filename and content are required", {
              extensions: { code: "INVALID_INPUT" },
            });
          }

          // Valider le nom de fichier
          const validation = uploadService.validateFilename(filename);
          if (!validation.isValid) {
            throw new GraphQLError(validation.error || "Invalid filename", {
              extensions: { code: "INVALID_FILENAME" },
            });
          }

          // Décoder le contenu base64
          let buffer: Buffer;
          try {
            buffer = Buffer.from(content, "base64");
          } catch (error) {
            throw new GraphQLError("Invalid base64 content", {
              extensions: { code: "INVALID_CONTENT" },
            });
          }

          // Valider la taille
          const sizeValidation = uploadService.validateFileSize(buffer.length);
          if (!sizeValidation.valid) {
            throw new GraphQLError(sizeValidation.error || "File too large", {
              extensions: { code: "FILE_TOO_LARGE" },
            });
          }

          // Valider l'extension
          const ext = path.extname(filename).toLowerCase();
          const extValidation = uploadService.validateExtension(ext);
          if (!extValidation.isValid) {
            throw new GraphQLError(extValidation.error || "Invalid file type", {
              extensions: { code: "INVALID_FILE_TYPE" },
            });
          }

          // Sanitizer le nom de fichier
          const sanitizedName = uploadService.sanitizeFilename(filename, {
            addTimestamp: true,
            lowercase: true,
          });

          // Créer le répertoire d'upload
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await uploadService.ensureUploadDirectory(uploadsDir);

          // Sauvegarder le fichier
          const filePath = path.join(uploadsDir, sanitizedName);
          await fs.writeFile(filePath, buffer);

          const stats = await fs.stat(filePath);

          return {
            success: true,
            message: "File uploaded successfully",
            file: {
              filename: sanitizedName,
              originalName: filename,
              path: `/uploads/${sanitizedName}`,
              size: stats.size,
              mimetype: mimetype || uploadService.getMimeTypeFromExtension(ext),
              extension: ext,
              uploadedAt: new Date(),
              uploadedBy: _context.userId,
            },
          };
        } catch (error) {
          if (error instanceof GraphQLError) {
            throw error;
          }
          throw new GraphQLError("Failed to upload file", {
            extensions: {
              code: "UPLOAD_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Supprime un fichier
       */
      deleteFile: async (
        _parent: any,
        args: { input: DeleteFileInput },
        _context: UploadContext,
      ) => {
        try {
          const { input } = args;
          const { filename } = input;

          if (!filename) {
            throw new GraphQLError("Filename is required", {
              extensions: { code: "INVALID_INPUT" },
            });
          }

          // Validation du nom de fichier
          const validation = uploadService.validateFilename(filename);
          if (!validation.isValid) {
            throw new GraphQLError(validation.error || "Invalid filename", {
              extensions: { code: "INVALID_FILENAME" },
            });
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, filename);

          // Vérifier que le fichier existe
          const exists = await uploadService.fileExists(filePath);
          if (!exists) {
            throw new GraphQLError("File not found", {
              extensions: { code: "FILE_NOT_FOUND" },
            });
          }

          // Supprimer le fichier
          await uploadService.deleteFile(filePath);

          return {
            success: true,
            message: "File deleted successfully",
          };
        } catch (error) {
          if (error instanceof GraphQLError) {
            throw error;
          }
          throw new GraphQLError("Failed to delete file", {
            extensions: {
              code: "DELETE_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },

      /**
       * Nettoie les fichiers temporaires/anciens
       */
      cleanupOldFiles: async (
        _parent: any,
        args: { daysOld?: number },
        _context: UploadContext,
      ) => {
        try {
          const { daysOld = 30 } = args;

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const files = await uploadService.listFiles({});

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysOld);

          let deletedCount = 0;
          const deletedFiles: string[] = [];

          for (const file of files) {
            if (file.uploadedAt < cutoffDate) {
              const filePath = path.join(uploadsDir, file.filename);
              try {
                await uploadService.deleteFile(filePath);
                deletedCount++;
                deletedFiles.push(file.filename);
              } catch (error) {
                // Continue si erreur sur un fichier
                console.error(`Failed to delete ${file.filename}:`, error);
              }
            }
          }

          return {
            success: true,
            message: `Deleted ${deletedCount} old file(s)`,
            filesDeleted: deletedFiles,
            count: deletedCount,
          };
        } catch (error) {
          throw new GraphQLError("Failed to cleanup old files", {
            extensions: {
              code: "CLEANUP_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },
    },
  };
};

export default uploadResolvers;
