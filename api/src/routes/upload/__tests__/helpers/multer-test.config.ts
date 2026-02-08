/**
 * Configuration Multer pour les tests
 *
 * Utilise memoryStorage au lieu de diskStorage pour éviter:
 * - Les problèmes ECONNRESET avec Jest ESM
 * - Les limitations de chemins Windows (caractères spéciaux, longueur)
 * - Les problèmes de filesystem
 *
 * @module multer-test-config
 */

import multer from "multer";
import path from "path";

/**
 * Configuration Multer pour les tests avec stockage en mémoire
 */
export const createTestMulterConfig = () => {
  // Utiliser memoryStorage pour éviter les problèmes de filesystem
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB max par fichier
      files: 10, // Maximum 10 fichiers par requête
    },
    fileFilter: (_req, file, cb) => {
      // Liste des extensions autorisées
      const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".txt",
      ];

      const ext = path.extname(file.originalname).toLowerCase();

      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            `Extension ${ext} non autorisée. Extensions autorisées: ${allowedExtensions.join(", ")}`,
          ),
        );
      }
    },
  });
};

/**
 * Mock du handler d'upload qui simule le traitement de fichiers en mémoire
 */
export const mockProcessUploadedFiles = (files: Express.Multer.File[]) => {
  return files.map((file) => {
    // Simuler le traitement comme le vrai handler
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);

    // Nettoyer le nom (simuler sanitizeFilename)
    const cleanBaseName = baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);

    const finalName = `${timestamp}_${randomNum}_${cleanBaseName}${ext}`;
    const url = `/uploads/${finalName}`;

    return {
      success: true,
      filename: finalName,
      originalName: file.originalname,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  });
};

/**
 * Créer un fichier de test en mémoire (Buffer)
 */
export const createTestFile = (
  content: string,
  originalname: string,
  mimetype: string = "image/jpeg",
): Express.Multer.File => {
  const buffer = Buffer.from(content);

  return {
    fieldname: "files",
    originalname,
    encoding: "7bit",
    mimetype,
    buffer,
    size: buffer.length,
    stream: null as any,
    destination: "",
    filename: "",
    path: "",
  } as Express.Multer.File;
};

export default createTestMulterConfig;
