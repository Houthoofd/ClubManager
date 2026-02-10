/**
 * Handler POST /api/upload
 * Upload de fichiers avec validation et sanitization
 */

import { Request, Response } from "express";
import { processUploadedFiles } from "../services/upload.service.js";
import { uploadedFilesArraySchema } from "@clubmanager/types/validators";
import {
  ValidationError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour l'upload de fichiers
 * POST /api/upload
 *
 * Body (multipart/form-data):
 * - files: Array<File> - Fichiers à uploader
 *
 * @returns 200 - Fichiers uploadés avec succès
 * @returns 400 - Aucun fichier fourni ou validation échouée
 * @returns 500 - Erreur serveur
 */
export async function uploadFiles(req: Request, res: Response): Promise<void> {
  try {
    console.log("📤 [Handler Upload] POST /upload - Upload de fichiers");

    // Vérifier qu'il y a des fichiers
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log("⚠️ [Handler Upload] Aucun fichier fourni");
      throw new ValidationError("Aucun fichier fourni", [
        { field: "files", message: "Au moins un fichier est requis" },
      ]);
    }

    const files = req.files as Express.Multer.File[];
    console.log(`📦 [Handler Upload] ${files.length} fichier(s) reçu(s)`);

    // Validation des fichiers avec Zod
    const validationResult = uploadedFilesArraySchema.safeParse(files);

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Upload] Erreur de validation:",
        validationResult.error.issues,
      );
      throw new ValidationError(
        "Validation des fichiers échouée",
        formatZodErrors(validationResult.error.issues),
      );
    }

    // Traiter les fichiers
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const result = processUploadedFiles(files, baseUrl, {
      sanitize: true,
      validateExtension: true,
      validateSize: true,
    });

    if (!result.success) {
      console.error(
        "❌ [Handler Upload] Certains fichiers ont échoué:",
        result.failedFiles,
      );

      // Si tous les fichiers ont échoué
      if (result.successfulFiles.length === 0) {
        throw new ValidationError("Tous les fichiers ont échoué", [
          {
            field: "files",
            message: `${result.failedFiles.length} fichier(s) ont échoué`,
          },
        ]);
      }

      // Si seulement certains fichiers ont échoué
      res.status(207).json({
        success: false,
        message: `${result.successfulFiles.length}/${result.stats.totalFiles} fichier(s) uploadé(s)`,
        type: "PARTIAL_SUCCESS",
        stats: result.stats,
        files: result.successfulFiles.map((file) => ({
          url: file.url,
          name: file.originalName,
          size: file.size,
          mimetype: file.mimetype,
        })),
        errors: result.failedFiles,
      });
      return;
    }

    // Tous les fichiers ont été uploadés avec succès
    console.log(
      `✅ [Handler Upload] ${result.successfulFiles.length} fichier(s) uploadé(s)`,
    );

    res.status(200).json({
      success: true,
      message: `${result.successfulFiles.length} fichier(s) uploadé(s) avec succès`,
      type: "SUCCESS",
      stats: result.stats,
      files: result.successfulFiles.map((file) => ({
        url: file.url,
        name: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  } catch (error: any) {
    console.error("❌ [Handler Upload] Erreur lors de l'upload:", error);

    // Re-throw si c'est déjà une ApplicationError
    if (
      error.name === "ValidationError" ||
      error.name === "InternalServerError"
    ) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur interne du serveur lors de l'upload",
      error,
    );
  }
}
