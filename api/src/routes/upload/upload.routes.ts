/**
 * Routes du module Upload
 * Gestion de l'upload de fichiers (images, documents, etc.)
 */

import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  uploadFiles,
  healthCheck,
} from "./core/handlers/index.js";

const router = express.Router();

console.log("🔧 [Upload Routes] Initialisation des routes upload refactorisées");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer le chemin du dossier de destination
const uploadsDir = path.join(__dirname, "../../../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 [Upload Routes] Dossier créé: ${uploadsDir}`);
}

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Nom temporaire qui sera renommé par le handler
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// Configuration de Multer avec limites
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max par fichier
    files: 10, // Maximum 10 fichiers par requête
  },
  fileFilter: (_req, file, cb) => {
    // Liste des extensions autorisées
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extension ${ext} non autorisée. Extensions autorisées: ${allowedExtensions.join(', ')}`));
    }
  }
});

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * GET /api/upload/health
 * Health check du module Upload
 * Utile pour monitoring et diagnostics
 *
 * Response:
 * {
 *   status: "healthy" | "degraded" | "unhealthy",
 *   checks: {
 *     directory: boolean,
 *     writable: boolean,
 *     stats: boolean
 *   },
 *   message: string,
 *   data?: {
 *     uploadDirectory: string,
 *     stats?: object
 *   }
 * }
 */
router.get("/health", healthCheck);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (avec authentification)
 * =============================================================================
 */

// Appliquer l'authentification à toutes les routes suivantes
router.use(verifyToken);

/**
 * POST /api/upload
 * Upload de fichiers avec validation et sanitization automatique
 *
 * Headers:
 * - Authorization: Bearer <token>
 * - Content-Type: multipart/form-data
 *
 * Body (multipart/form-data):
 * - files: Array<File> - Fichiers à uploader (max 10 fichiers, 10MB chacun)
 *
 * Extensions autorisées:
 * - Images: .jpg, .jpeg, .png, .gif, .webp, .bmp
 * - Documents: .pdf, .doc, .docx, .xls, .xlsx, .txt
 *
 * Response (Success):
 * {
 *   success: true,
 *   message: string,
 *   type: "SUCCESS",
 *   stats: {
 *     totalFiles: number,
 *     totalSize: number,
 *     successfulUploads: number,
 *     failedUploads: number
 *   },
 *   files: [
 *     {
 *       url: string,
 *       name: string,
 *       size: number,
 *       mimetype: string
 *     }
 *   ]
 * }
 *
 * Response (Partial Success - 207):
 * {
 *   success: false,
 *   message: string,
 *   type: "PARTIAL_SUCCESS",
 *   stats: object,
 *   files: Array<object>,
 *   errors: Array<{
 *     filename: string,
 *     error: string,
 *     code: string
 *   }>
 * }
 *
 * Response (Error - 400):
 * {
 *   success: false,
 *   message: string,
 *   type: "NO_FILES" | "VALIDATION_ERROR" | "UPLOAD_FAILED",
 *   errors?: Array<object>
 * }
 */
router.post("/", upload.array("files"), uploadFiles);

/**
 * Middleware d'erreur pour Multer
 * Gère les erreurs spécifiques à Multer (taille de fichier, nombre de fichiers, etc.)
 */
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    console.error("❌ [Upload Routes] Erreur Multer:", err);

    let message = "Erreur lors de l'upload";
    let code = "UPLOAD_ERROR";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "La taille du fichier dépasse la limite autorisée (10 MB)";
        code = "FILE_TOO_LARGE";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Trop de fichiers (maximum 10 fichiers)";
        code = "TOO_MANY_FILES";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Champ de fichier inattendu";
        code = "UNEXPECTED_FIELD";
        break;
      case "LIMIT_PART_COUNT":
        message = "Trop de parties dans la requête multipart";
        code = "TOO_MANY_PARTS";
        break;
      default:
        message = err.message || "Erreur lors de l'upload";
    }

    return res.status(400).json({
      success: false,
      message,
      type: code,
      error: err.message,
    });
  } else if (err) {
    console.error("❌ [Upload Routes] Erreur:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Erreur lors de l'upload",
      type: "UPLOAD_ERROR",
    });
  }

  next();
});

console.log("✅ [Upload Routes] Routes upload initialisées avec succès");

export default router;
