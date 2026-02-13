/**
 * Resolvers GraphQL pour le module Upload
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 * - Authentification (requireAuth, requireAdmin)
 * - Monitoring Sentry (withSentry)
 * - Validation Zod centralisée
 * - Erreurs GraphQL standardisées
 */

import { PrismaClient } from "@prisma/client";
import { uploadService } from "../services/upload.service.js";
import * as fs from "fs/promises";
import * as path from "path";
import {
  fileUploadInputSchema,
  deleteFileInputSchema,
  listFilesInputSchema,
  getFileInfoInputSchema,
  fileExistsInputSchema,
  cleanupOldFilesInputSchema,
} from "@clubmanager/types/validators";
import {
  combineMiddlewares,
  requireAuth,
  requireAdmin,
  withSentry,
  ValidationError,
  NotFoundError,
  InternalServerError,
  type GraphQLContext,
} from '@/shared/index.js';

interface Context extends GraphQLContext {
  prisma: PrismaClient;
}

/**
 * Crée les resolvers GraphQL pour Upload
 */
export const uploadResolvers = (prisma: PrismaClient) => {
  return {
    Query: {
      /**
       * ✅ Health check du service d'upload (public - avec Sentry)
       */
      uploadHealth: combineMiddlewares(withSentry)(
        async (_parent: any, _args: any, _context: Context) => {
          console.log("🏥 [Upload] Health check demandé");

          const health = await uploadService.checkHealth();

          console.log("✅ [Upload] Health check:", health.status);

          return {
            status: health.status,
            message: health.message,
            uploadsDirectory: health.uploadsDirectory,
            isWritable: health.isWritable,
            diskSpace: health.diskSpace,
            timestamp: new Date(),
          };
        },
      ),

      /**
       * ✅ Liste les fichiers uploadés (auth requise + Sentry)
       */
      listUploadedFiles: combineMiddlewares(
        requireAuth,
        withSentry,
      )(
        async (
          _parent: any,
          args: { input?: any },
          _context: Context,
        ) => {
          console.log("📋 [Upload] Liste des fichiers demandée");

          // Validation Zod avec valeurs par défaut
          const validated = listFilesInputSchema.parse(args.input || {});

          const files = await uploadService.listFiles({
            limit: validated.limit,
            offset: validated.offset,
            sortBy: validated.sortBy,
            sortOrder: validated.sortOrder,
            extension: validated.extension,
          });

          console.log(`✅ [Upload] ${files.length} fichier(s) récupéré(s)`);

          return {
            success: true,
            files,
            total: files.length,
            hasMore: files.length === validated.limit,
          };
        },
      ),

      /**
       * ✅ Récupère les informations d'un fichier spécifique (auth requise + Sentry)
       */
      getFileInfo: combineMiddlewares(
        requireAuth,
        withSentry,
      )(
        async (
          _parent: any,
          args: { filename: string },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = getFileInfoInputSchema.parse(args);

          console.log(
            "🔍 [Upload] Informations fichier demandées:",
            validated.filename,
          );

          // Validation du nom de fichier
          const validation = uploadService.validateFilename(
            validated.filename,
          );
          if (!validation.isValid) {
            throw new ValidationError(
              validation.error || "Nom de fichier invalide",
            );
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, validated.filename);

          // Vérifier que le fichier existe
          const exists = await uploadService.fileExists(filePath);
          if (!exists) {
            throw new NotFoundError("Fichier non trouvé");
          }

          const stats = await fs.stat(filePath);
          const ext = path.extname(validated.filename).toLowerCase();

          const fileInfo = {
            filename: validated.filename,
            originalName: validated.filename,
            path: `/uploads/${validated.filename}`,
            size: stats.size,
            mimetype: uploadService.getMimeTypeFromExtension(ext),
            extension: ext,
            uploadedAt: stats.birthtime,
          };

          console.log("✅ [Upload] Informations fichier récupérées");

          return fileInfo;
        },
      ),

      /**
       * ✅ Récupère les statistiques d'upload (auth + admin requise + Sentry)
       */
      uploadStats: combineMiddlewares(
        requireAdmin,
        withSentry,
      )(async (_parent: any, _args: any, _context: Context) => {
        console.log("📊 [Upload] Statistiques demandées");

        const stats = await uploadService.getUploadStats();

        console.log("✅ [Upload] Statistiques récupérées");

        return {
          totalFiles: stats.totalFiles,
          totalSize: stats.totalSize,
          averageSize: stats.averageSize,
          filesByExtension: stats.filesByExtension,
          recentUploads: stats.recentUploads || [],
        };
      }),

      /**
       * ✅ Vérifie si un fichier existe (auth requise + Sentry)
       */
      fileExists: combineMiddlewares(
        requireAuth,
        withSentry,
      )(
        async (
          _parent: any,
          args: { filename: string },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = fileExistsInputSchema.parse(args);

          console.log(
            "🔍 [Upload] Vérification existence fichier:",
            validated.filename,
          );

          if (!validated.filename) {
            return { exists: false, filename: validated.filename };
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, validated.filename);
          const exists = await uploadService.fileExists(filePath);

          console.log(
            `✅ [Upload] Fichier ${validated.filename} - Existe: ${exists}`,
          );

          return {
            exists,
            filename: validated.filename,
          };
        },
      ),
    },

    Mutation: {
      /**
       * ✅ Upload un fichier (base64) (auth requise + Sentry)
       */
      uploadFile: combineMiddlewares(
        requireAuth,
        withSentry,
      )(
        async (
          _parent: any,
          args: { input: any },
          context: Context,
        ) => {
          // Validation Zod
          const validated = fileUploadInputSchema.parse(args.input);

          console.log("📤 [Upload] Upload fichier:", validated.filename);

          // Valider le nom de fichier
          const validation = uploadService.validateFilename(validated.filename);
          if (!validation.isValid) {
            throw new ValidationError(
              validation.error || "Nom de fichier invalide",
            );
          }

          // Décoder le contenu base64
          let buffer: Buffer;
          try {
            buffer = Buffer.from(validated.content, "base64");
          } catch (error) {
            throw new ValidationError("Contenu base64 invalide");
          }

          // Valider la taille
          const sizeValidation = uploadService.validateFileSize(buffer.length);
          if (!sizeValidation.valid) {
            throw new ValidationError(
              sizeValidation.error || "Fichier trop volumineux",
            );
          }

          // Valider l'extension
          const ext = path.extname(validated.filename).toLowerCase();
          const extValidation = uploadService.validateExtension(ext);
          if (!extValidation.isValid) {
            throw new ValidationError(
              extValidation.error || "Type de fichier invalide",
            );
          }

          // Sanitizer le nom de fichier
          const sanitizedName = uploadService.sanitizeFilename(
            validated.filename,
            {
              addTimestamp: true,
              lowercase: true,
            },
          );

          // Créer le répertoire d'upload
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await uploadService.ensureUploadDirectory(uploadsDir);

          // Sauvegarder le fichier
          const filePath = path.join(uploadsDir, sanitizedName);
          await fs.writeFile(filePath, buffer);

          const stats = await fs.stat(filePath);

          console.log("✅ [Upload] Fichier uploadé:", sanitizedName);

          return {
            success: true,
            message: "Fichier uploadé avec succès",
            file: {
              filename: sanitizedName,
              originalName: validated.filename,
              path: `/uploads/${sanitizedName}`,
              size: stats.size,
              mimetype:
                validated.mimetype ||
                uploadService.getMimeTypeFromExtension(ext),
              extension: ext,
              uploadedAt: new Date(),
              uploadedBy: context.user?.id,
            },
          };
        },
      ),

      /**
       * ✅ Supprime un fichier (auth + admin requise + Sentry)
       */
      deleteFile: combineMiddlewares(
        requireAdmin,
        withSentry,
      )(
        async (
          _parent: any,
          args: { input: any },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = deleteFileInputSchema.parse(args.input);

          console.log("🗑️ [Upload] Suppression fichier:", validated.filename);

          // Validation du nom de fichier
          const validation = uploadService.validateFilename(
            validated.filename,
          );
          if (!validation.isValid) {
            throw new ValidationError(
              validation.error || "Nom de fichier invalide",
            );
          }

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const filePath = path.join(uploadsDir, validated.filename);

          // Vérifier que le fichier existe
          const exists = await uploadService.fileExists(filePath);
          if (!exists) {
            throw new NotFoundError("Fichier non trouvé");
          }

          // Supprimer le fichier
          await uploadService.deleteFile(filePath);

          console.log("✅ [Upload] Fichier supprimé:", validated.filename);

          return {
            success: true,
            message: "Fichier supprimé avec succès",
          };
        },
      ),

      /**
       * ✅ Nettoie les fichiers anciens (admin requise + Sentry)
       */
      cleanupOldFiles: combineMiddlewares(
        requireAdmin,
        withSentry,
      )(
        async (
          _parent: any,
          args: { daysOld?: number },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = cleanupOldFilesInputSchema.parse(args);

          console.log(
            `🧹 [Upload] Nettoyage fichiers > ${validated.daysOld} jours`,
          );

          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          const files = await uploadService.listFiles({});

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - validated.daysOld);

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
                console.error(`Échec suppression ${file.filename}:`, error);
              }
            }
          }

          console.log(`✅ [Upload] ${deletedCount} fichier(s) supprimé(s)`);

          return {
            success: true,
            message: `${deletedCount} ancien(s) fichier(s) supprimé(s)`,
            filesDeleted: deletedFiles,
            count: deletedCount,
          };
        },
      ),
    },
  };
};

export default uploadResolvers;
