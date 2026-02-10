/**
 * Service Upload - Logique métier
 * Gère les opérations d'upload de fichiers
 */

import fs from "fs";
import path from "path";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_ALL_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  type FileMetadata,
  type UploadStats,
  type SanitizationOptions,
  type UploadError,
} from "@clubmanager/types/validators";

/**
 * Nettoyer le nom de fichier
 */
export function sanitizeFilename(
  originalName: string,
  options: Partial<SanitizationOptions> = {},
): string {
  const {
    removeAccents = true,
    replaceSpaces = true,
    lowercase = false,
    addTimestamp = true,
    maxLength = 255,
  } = options;

  console.log(`🧹 [Service Upload] Sanitization du fichier: ${originalName}`);

  try {
    // Gérer le cas d'un nom vide
    if (!originalName || originalName.trim() === "") {
      const timestamp = Date.now();
      return addTimestamp ? `${timestamp}-file` : "file";
    }

    // Le nom est déjà en UTF-8 dans un environnement Node.js moderne
    let processedName = originalName;

    // Normaliser et supprimer les accents si demandé
    if (removeAccents) {
      processedName = processedName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    // Remplacer les espaces
    if (replaceSpaces) {
      processedName = processedName.replace(/\s+/g, "_");
    }

    // Mettre en minuscules si demandé
    if (lowercase) {
      processedName = processedName.toLowerCase();
    }

    // Remplacer les caractères spéciaux
    const ext = path.extname(processedName);
    const nameWithoutExt = path.basename(processedName, ext);
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    // Ajouter un timestamp si demandé
    let finalName = cleanName;
    if (addTimestamp) {
      const timestamp = Date.now();
      finalName = `${timestamp}-${cleanName}`;
    }

    // Limiter la longueur
    if (finalName.length + ext.length > maxLength) {
      const maxNameLength = maxLength - ext.length - 1;
      finalName = finalName.substring(0, maxNameLength);
    }

    const result = `${finalName}${ext}`;
    console.log(`✅ [Service Upload] Fichier sanitizé: ${result}`);

    return result;
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur sanitization:`, error);
    // Fallback: générer un nom simple avec timestamp
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    return `${timestamp}-file${ext}`;
  }
}

/**
 * Valider l'extension du fichier
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[] = ALLOWED_ALL_EXTENSIONS,
): {
  valid: boolean;
  extension: string;
  error?: string;
} {
  const ext = path.extname(filename).toLowerCase();

  console.log(`🔍 [Service Upload] Validation extension: ${ext}`);

  if (!ext) {
    return {
      valid: false,
      extension: "",
      error: "Le fichier doit avoir une extension",
    };
  }

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      extension: ext,
      error: `Extension ${ext} non autorisée. Extensions autorisées: ${allowedExtensions.join(", ")}`,
    };
  }

  console.log(`✅ [Service Upload] Extension valide: ${ext}`);
  return {
    valid: true,
    extension: ext,
  };
}

/**
 * Valider la taille du fichier
 */
export function validateFileSize(
  size: number,
  maxSize: number = MAX_FILE_SIZE,
): {
  valid: boolean;
  size: number;
  maxSize: number;
  error?: string;
} {
  console.log(
    `📏 [Service Upload] Validation taille: ${size} bytes (max: ${maxSize} bytes)`,
  );

  if (size <= 0) {
    return {
      valid: false,
      size,
      maxSize,
      error: "La taille du fichier doit être positive",
    };
  }

  if (size > maxSize) {
    return {
      valid: false,
      size,
      maxSize,
      error: `La taille du fichier (${(size / 1024 / 1024).toFixed(2)} MB) dépasse la limite autorisée (${(maxSize / 1024 / 1024).toFixed(2)} MB)`,
    };
  }

  console.log(`✅ [Service Upload] Taille valide`);
  return {
    valid: true,
    size,
    maxSize,
  };
}

/**
 * Valider le type MIME
 */
export function validateMimetype(
  mimetype: string,
  allowedMimetypes?: string[],
): {
  valid: boolean;
  mimetype: string;
  error?: string;
} {
  console.log(`🔍 [Service Upload] Validation MIME type: ${mimetype}`);

  if (!mimetype || typeof mimetype !== "string") {
    return {
      valid: false,
      mimetype: mimetype || "",
      error: "Type MIME invalide",
    };
  }

  // Si des types MIME spécifiques sont demandés
  if (allowedMimetypes && allowedMimetypes.length > 0) {
    if (!allowedMimetypes.includes(mimetype)) {
      return {
        valid: false,
        mimetype,
        error: `Type MIME ${mimetype} non autorisé`,
      };
    }
  }

  console.log(`✅ [Service Upload] Type MIME valide`);
  return {
    valid: true,
    mimetype,
  };
}

/**
 * Créer le dossier de destination s'il n'existe pas
 */
export function ensureUploadDirectory(dirPath: string): {
  success: boolean;
  path: string;
  error?: string;
} {
  console.log(`📁 [Service Upload] Vérification du dossier: ${dirPath}`);

  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`📁 [Service Upload] Création du dossier: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    console.log(`✅ [Service Upload] Dossier prêt: ${dirPath}`);
    return {
      success: true,
      path: dirPath,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur création dossier:`, error);
    return {
      success: false,
      path: dirPath,
      error: error.message || "Erreur lors de la création du dossier",
    };
  }
}

/**
 * Déplacer/renommer un fichier
 */
export function moveFile(
  sourcePath: string,
  destinationPath: string,
): {
  success: boolean;
  sourcePath: string;
  destinationPath: string;
  error?: string;
} {
  console.log(
    `🚚 [Service Upload] Déplacement fichier: ${sourcePath} -> ${destinationPath}`,
  );

  try {
    // Vérifier que le fichier source existe
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        sourcePath,
        destinationPath,
        error: "Le fichier source n'existe pas",
      };
    }

    // Vérifier que le fichier de destination n'existe pas déjà
    if (fs.existsSync(destinationPath)) {
      console.warn(
        `⚠️ [Service Upload] Le fichier de destination existe déjà, écrasement`,
      );
    }

    // Déplacer le fichier
    fs.renameSync(sourcePath, destinationPath);

    console.log(`✅ [Service Upload] Fichier déplacé avec succès`);
    return {
      success: true,
      sourcePath,
      destinationPath,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur déplacement fichier:`, error);
    return {
      success: false,
      sourcePath,
      destinationPath,
      error: error.message || "Erreur lors du déplacement du fichier",
    };
  }
}

/**
 * Supprimer un fichier
 */
export function deleteFile(filePath: string): {
  success: boolean;
  path: string;
  error?: string;
} {
  console.log(`🗑️ [Service Upload] Suppression fichier: ${filePath}`);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ [Service Upload] Fichier supprimé avec succès`);
      return {
        success: true,
        path: filePath,
      };
    } else {
      console.warn(`⚠️ [Service Upload] Fichier non trouvé: ${filePath}`);
      return {
        success: false,
        path: filePath,
        error: "Le fichier n'existe pas",
      };
    }
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur suppression fichier:`, error);
    return {
      success: false,
      path: filePath,
      error: error.message || "Erreur lors de la suppression du fichier",
    };
  }
}

/**
 * Traiter un fichier uploadé
 */
export function processUploadedFile(
  file: Express.Multer.File,
  baseUrl: string = "http://localhost:3000",
  options: {
    sanitize?: boolean;
    sanitizationOptions?: Partial<SanitizationOptions>;
    validateExtension?: boolean;
    allowedExtensions?: string[];
    validateSize?: boolean;
    maxSize?: number;
  } = {},
): {
  success: boolean;
  metadata?: FileMetadata;
  error?: UploadError;
} {
  const {
    sanitize = true,
    sanitizationOptions = {},
    validateExtension = true,
    allowedExtensions = ALLOWED_ALL_EXTENSIONS,
    validateSize = true,
    maxSize = MAX_FILE_SIZE,
  } = options;

  console.log(`⚙️ [Service Upload] Traitement fichier: ${file.originalname}`);

  try {
    // Valider l'extension
    if (validateExtension) {
      const extValidation = validateFileExtension(
        file.originalname,
        allowedExtensions,
      );
      if (!extValidation.valid) {
        console.error(
          `❌ [Service Upload] Extension invalide: ${extValidation.error}`,
        );
        return {
          success: false,
          error: {
            filename: file.originalname,
            error: extValidation.error || "Extension non autorisée",
            code: "INVALID_EXTENSION",
            details: { extension: extValidation.extension },
          },
        };
      }
    }

    // Valider la taille
    if (validateSize) {
      const sizeValidation = validateFileSize(file.size, maxSize);
      if (!sizeValidation.valid) {
        console.error(
          `❌ [Service Upload] Taille invalide: ${sizeValidation.error}`,
        );
        return {
          success: false,
          error: {
            filename: file.originalname,
            error: sizeValidation.error || "Taille de fichier non autorisée",
            code: "FILE_TOO_LARGE",
            details: { size: file.size, maxSize },
          },
        };
      }
    }

    // Sanitizer le nom du fichier
    let finalFilename = file.filename;
    if (sanitize) {
      try {
        const sanitizedName = sanitizeFilename(
          file.originalname,
          sanitizationOptions,
        );
        const newPath = path.join(file.destination, sanitizedName);

        // Déplacer le fichier avec le nouveau nom
        const moveResult = moveFile(file.path, newPath);
        if (!moveResult.success) {
          throw new Error(moveResult.error);
        }

        finalFilename = sanitizedName;
      } catch (sanitizeError: any) {
        console.error(
          `❌ [Service Upload] Erreur sanitization:`,
          sanitizeError,
        );
        return {
          success: false,
          error: {
            filename: file.originalname,
            error:
              sanitizeError.message ||
              "Erreur lors de la sanitization du nom de fichier",
            code: "SANITIZATION_FAILED",
          },
        };
      }
    }

    // Créer les métadonnées
    const metadata: FileMetadata = {
      originalName: file.originalname,
      sanitizedName: finalFilename,
      size: file.size,
      mimetype: file.mimetype,
      extension: path.extname(finalFilename).toLowerCase(),
      uploadDate: new Date(),
      path: path.join(file.destination, finalFilename),
      url: `${baseUrl}/uploads/${finalFilename}`,
    };

    console.log(
      `✅ [Service Upload] Fichier traité avec succès: ${finalFilename}`,
    );

    return {
      success: true,
      metadata,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur traitement fichier:`, error);
    return {
      success: false,
      error: {
        filename: file.originalname,
        error: error.message || "Erreur lors du traitement du fichier",
        code: "UPLOAD_FAILED",
      },
    };
  }
}

/**
 * Traiter plusieurs fichiers uploadés
 */
export function processUploadedFiles(
  files: Express.Multer.File[],
  baseUrl: string = "http://localhost:3000",
  options: Parameters<typeof processUploadedFile>[2] = {},
): {
  success: boolean;
  stats: UploadStats;
  successfulFiles: FileMetadata[];
  failedFiles: UploadError[];
} {
  console.log(`⚙️ [Service Upload] Traitement de ${files.length} fichier(s)`);

  const successfulFiles: FileMetadata[] = [];
  const failedFiles: UploadError[] = [];
  let totalSize = 0;

  for (const file of files) {
    const result = processUploadedFile(file, baseUrl, options);

    if (result.success && result.metadata) {
      successfulFiles.push(result.metadata);
      totalSize += result.metadata.size;
    } else if (result.error) {
      failedFiles.push(result.error);
    }
  }

  const stats: UploadStats = {
    totalFiles: files.length,
    totalSize,
    successfulUploads: successfulFiles.length,
    failedUploads: failedFiles.length,
  };

  console.log(`✅ [Service Upload] Traitement terminé:`, stats);

  return {
    success: failedFiles.length === 0,
    stats,
    successfulFiles,
    failedFiles,
  };
}

/**
 * Obtenir des informations sur un fichier
 */
export function getFileInfo(filePath: string): {
  exists: boolean;
  info?: {
    size: number;
    created: Date;
    modified: Date;
    extension: string;
  };
  error?: string;
} {
  console.log(`ℹ️ [Service Upload] Récupération info fichier: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      return {
        exists: false,
        error: "Le fichier n'existe pas",
      };
    }

    const stats = fs.statSync(filePath);
    const info = {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(filePath).toLowerCase(),
    };

    console.log(`✅ [Service Upload] Info récupérées:`, info);

    return {
      exists: true,
      info,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur récupération info:`, error);
    return {
      exists: false,
      error: error.message || "Erreur lors de la récupération des informations",
    };
  }
}

/**
 * Lister les fichiers d'un dossier
 */
export function listFiles(dirPath: string): {
  success: boolean;
  files?: string[];
  count?: number;
  error?: string;
} {
  console.log(`📋 [Service Upload] Liste des fichiers dans: ${dirPath}`);

  try {
    if (!fs.existsSync(dirPath)) {
      return {
        success: false,
        error: "Le dossier n'existe pas",
      };
    }

    const files = fs.readdirSync(dirPath).filter((file) => {
      const fullPath = path.join(dirPath, file);
      return fs.statSync(fullPath).isFile();
    });

    console.log(`✅ [Service Upload] ${files.length} fichier(s) trouvé(s)`);

    return {
      success: true,
      files,
      count: files.length,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur liste fichiers:`, error);
    return {
      success: false,
      error: error.message || "Erreur lors de la liste des fichiers",
    };
  }
}

/**
 * Calculer les statistiques du dossier d'uploads
 */
export function getUploadDirectoryStats(dirPath: string): {
  success: boolean;
  stats?: {
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    byExtension: Record<string, { count: number; size: number }>;
  };
  error?: string;
} {
  console.log(`📊 [Service Upload] Calcul statistiques: ${dirPath}`);

  try {
    if (!fs.existsSync(dirPath)) {
      return {
        success: false,
        error: "Le dossier n'existe pas",
      };
    }

    const files = fs.readdirSync(dirPath);
    let totalSize = 0;
    let totalFiles = 0;
    const byExtension: Record<string, { count: number; size: number }> = {};

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        totalFiles++;
        totalSize += stat.size;

        const ext = path.extname(file).toLowerCase() || ".none";
        if (!byExtension[ext]) {
          byExtension[ext] = { count: 0, size: 0 };
        }
        byExtension[ext].count++;
        byExtension[ext].size += stat.size;
      }
    }

    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const stats = {
      totalFiles,
      totalSize,
      averageSize,
      byExtension,
    };

    console.log(`✅ [Service Upload] Statistiques calculées:`, stats);

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    console.error(`❌ [Service Upload] Erreur calcul statistiques:`, error);
    return {
      success: false,
      error: error.message || "Erreur lors du calcul des statistiques",
    };
  }
}

/**
 * Vérifier la santé du service d'upload
 */
export async function checkHealth(): Promise<{
  status: string;
  message: string;
  uploadsDirectory: string;
  isWritable: boolean;
  diskSpace?: {
    free: number;
    total: number;
    used: number;
  };
}> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  try {
    // Vérifier que le répertoire existe
    const dirExists = fs.existsSync(uploadsDir);
    if (!dirExists) {
      return {
        status: "unhealthy",
        message: "Upload directory does not exist",
        uploadsDirectory: uploadsDir,
        isWritable: false,
      };
    }

    // Vérifier les permissions d'écriture
    try {
      const testFile = path.join(uploadsDir, ".health-check");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Upload directory is not writable",
        uploadsDirectory: uploadsDir,
        isWritable: false,
      };
    }

    return {
      status: "healthy",
      message: "Upload service is operational",
      uploadsDirectory: uploadsDir,
      isWritable: true,
    };
  } catch (error: any) {
    return {
      status: "unhealthy",
      message: error.message || "Unknown error",
      uploadsDirectory: uploadsDir,
      isWritable: false,
    };
  }
}

/**
 * Vérifier si un fichier existe
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valider un nom de fichier
 */
export function validateFilename(filename: string): {
  isValid: boolean;
  error?: string;
} {
  if (!filename || typeof filename !== "string") {
    return { isValid: false, error: "Filename is required" };
  }

  // Bloquer les path traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return {
      isValid: false,
      error: "Invalid filename: path traversal detected",
    };
  }

  // Bloquer les NULL bytes
  if (filename.includes("\0")) {
    return { isValid: false, error: "Invalid filename: null byte detected" };
  }

  // Vérifier la longueur
  if (filename.length === 0 || filename.length > 255) {
    return { isValid: false, error: "Invalid filename length" };
  }

  return { isValid: true };
}

/**
 * Valider l'extension d'un fichier (version GraphQL)
 */
export function validateExtensionGraphQL(extension: string): {
  isValid: boolean;
  error?: string;
} {
  const ext = extension.toLowerCase();

  if (!ALLOWED_ALL_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `File extension ${ext} is not allowed`,
    };
  }

  return { isValid: true };
}

/**
 * Obtenir le MIME type à partir de l'extension
 */
export function getMimeTypeFromExtensionGraphQL(extension: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}

/**
 * Lister les fichiers avec options de tri et filtrage
 */
export async function listFilesGraphQL(options: {
  limit?: number;
  offset?: number;
  sortBy?: "name" | "size" | "date";
  sortOrder?: "asc" | "desc";
  extension?: string;
}): Promise<
  Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    extension: string;
    uploadedAt: Date;
  }>
> {
  const {
    limit = 50,
    offset = 0,
    sortBy = "date",
    sortOrder = "desc",
    extension,
  } = options;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    return [];
  }

  const files = await fs.promises.readdir(uploadsDir);
  const fileInfos = [];

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    const stat = await fs.promises.stat(filePath);

    if (stat.isFile()) {
      const ext = path.extname(filename).toLowerCase();

      // Filtrer par extension si spécifié
      if (extension && ext !== extension.toLowerCase()) {
        continue;
      }

      fileInfos.push({
        filename,
        originalName: filename,
        path: `/uploads/${filename}`,
        size: stat.size,
        mimetype: getMimeTypeFromExtensionGraphQL(ext),
        extension: ext,
        uploadedAt: stat.birthtime,
      });
    }
  }

  // Trier
  fileInfos.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.filename.localeCompare(b.filename);
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "date":
        comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Paginer
  return fileInfos.slice(offset, offset + limit);
}

/**
 * Obtenir les statistiques d'upload
 */
export async function getUploadStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  filesByExtension: Array<{ extension: string; count: number }>;
  recentUploads: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    extension: string;
    uploadedAt: Date;
  }>;
}> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    return {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      filesByExtension: [],
      recentUploads: [],
    };
  }

  const dirStats = getUploadDirectoryStats(uploadsDir);

  if (!dirStats.success || !dirStats.stats) {
    return {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      filesByExtension: [],
      recentUploads: [],
    };
  }

  const filesByExtension = Object.entries(dirStats.stats.byExtension).map(
    ([extension, data]) => ({
      extension,
      count: data.count,
    }),
  );

  // Récupérer les fichiers récents
  const recentUploads = await listFilesGraphQL({
    limit: 10,
    sortBy: "date",
    sortOrder: "desc",
  });

  return {
    totalFiles: dirStats.stats.totalFiles,
    totalSize: dirStats.stats.totalSize,
    averageSize: dirStats.stats.averageSize,
    filesByExtension,
    recentUploads,
  };
}

/**
 * Exporter tout le service en tant qu'objet
 */
export const uploadService = {
  sanitizeFilename,
  validateFileExtension,
  validateFileSize,
  validateMimetype,
  ensureUploadDirectory,
  moveFile,
  deleteFile,
  processUploadedFile,
  processUploadedFiles,
  getFileInfo,
  listFiles: listFilesGraphQL,
  getUploadDirectoryStats,
  checkHealth,
  fileExists,
  validateFilename,
  validateExtension: validateExtensionGraphQL,
  getMimeTypeFromExtension: getMimeTypeFromExtensionGraphQL,
  getUploadStats,
};
