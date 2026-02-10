/**
 * Tests unitaires de base pour le module Upload
 * Tests des fonctions de service et handlers
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock de multer et des modules de fichiers
jest.mock("fs");
// Ne pas mocker 'path' car c'est un module purement fonctionnel sans effets de bord

// Import des services à tester
import {
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
  listFiles,
  getUploadDirectoryStats,
} from "../core/services/upload.service.js";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_ALL_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from "@clubmanager/types/validators";

describe("Upload Module - Tests unitaires de base", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Service: sanitizeFilename", () => {
    it("devrait sanitizer un nom de fichier simple", () => {
      const result = sanitizeFilename("test-file.jpg", { addTimestamp: false });

      expect(result).toMatch(/^test-file\.jpg$/);
    });

    it("devrait ajouter un timestamp par défaut", () => {
      const result = sanitizeFilename("test.jpg");

      expect(result).toMatch(/^\d+-test\.jpg$/);
    });

    it("devrait supprimer les accents", () => {
      const result = sanitizeFilename("fichier-éàü.pdf", {
        addTimestamp: false,
      });

      expect(result).not.toContain("é");
      expect(result).not.toContain("à");
      expect(result).not.toContain("ü");
      expect(result).toMatch(/^fichier-eau\.pdf$/);
    });

    it("devrait remplacer les espaces par des underscores", () => {
      const result = sanitizeFilename("mon fichier test.doc", {
        addTimestamp: false,
      });

      expect(result).toMatch(/^mon_fichier_test\.doc$/);
    });

    it("devrait remplacer les caractères spéciaux", () => {
      const result = sanitizeFilename("file@#$%.txt", { addTimestamp: false });

      expect(result).toMatch(/^file____\.txt$/);
    });

    it("devrait gérer les noms avec plusieurs extensions", () => {
      const result = sanitizeFilename("archive.tar.gz", {
        addTimestamp: false,
      });

      expect(result).toMatch(/\.gz$/);
    });

    it("devrait respecter la longueur maximale", () => {
      const longName = "a".repeat(300) + ".jpg";
      const result = sanitizeFilename(longName, { maxLength: 50 });

      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toMatch(/\.jpg$/);
    });

    it("devrait mettre en minuscules si demandé", () => {
      const result = sanitizeFilename("TEST-FILE.JPG", {
        addTimestamp: false,
        lowercase: true,
      });

      expect(result).toBe("test-file.jpg");
    });

    it("devrait gérer un nom vide", () => {
      const result = sanitizeFilename("", { addTimestamp: true });

      expect(result).toMatch(/^\d+-file$/);
    });
  });

  describe("Service: validateFileExtension", () => {
    it("devrait valider une extension d'image autorisée", () => {
      const result = validateFileExtension("photo.jpg");

      expect(result.valid).toBe(true);
      expect(result.extension).toBe(".jpg");
      expect(result.error).toBeUndefined();
    });

    it("devrait valider une extension de document autorisée", () => {
      const result = validateFileExtension("document.pdf");

      expect(result.valid).toBe(true);
      expect(result.extension).toBe(".pdf");
    });

    it("devrait rejeter une extension non autorisée", () => {
      const result = validateFileExtension("script.exe");

      expect(result.valid).toBe(false);
      expect(result.extension).toBe(".exe");
      expect(result.error).toContain("non autorisée");
    });

    it("devrait rejeter un fichier sans extension", () => {
      const result = validateFileExtension("fichier");

      expect(result.valid).toBe(false);
      expect(result.extension).toBe("");
      expect(result.error).toContain("doit avoir une extension");
    });

    it("devrait être insensible à la casse", () => {
      const result = validateFileExtension("photo.JPG");

      expect(result.valid).toBe(true);
      expect(result.extension).toBe(".jpg");
    });

    it("devrait accepter les extensions personnalisées", () => {
      const result = validateFileExtension("file.custom", [".custom"]);

      expect(result.valid).toBe(true);
      expect(result.extension).toBe(".custom");
    });
  });

  describe("Service: validateFileSize", () => {
    it("devrait valider une taille de fichier correcte", () => {
      const size = 1024 * 1024; // 1 MB
      const result = validateFileSize(size);

      expect(result.valid).toBe(true);
      expect(result.size).toBe(size);
      expect(result.error).toBeUndefined();
    });

    it("devrait rejeter une taille de fichier trop grande", () => {
      const size = 20 * 1024 * 1024; // 20 MB
      const result = validateFileSize(size, MAX_FILE_SIZE);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("dépasse la limite");
    });

    it("devrait rejeter une taille négative", () => {
      const result = validateFileSize(-100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("doit être positive");
    });

    it("devrait rejeter une taille zéro", () => {
      const result = validateFileSize(0);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("doit être positive");
    });

    it("devrait accepter une taille limite exacte", () => {
      const result = validateFileSize(MAX_FILE_SIZE, MAX_FILE_SIZE);

      expect(result.valid).toBe(true);
    });

    it("devrait respecter la limite personnalisée", () => {
      const customLimit = 1024 * 1024; // 1 MB
      const result = validateFileSize(2 * 1024 * 1024, customLimit);

      expect(result.valid).toBe(false);
      expect(result.maxSize).toBe(customLimit);
    });
  });

  describe("Service: validateMimetype", () => {
    it("devrait valider un type MIME d'image", () => {
      const result = validateMimetype("image/jpeg");

      expect(result.valid).toBe(true);
      expect(result.mimetype).toBe("image/jpeg");
    });

    it("devrait valider un type MIME de document", () => {
      const result = validateMimetype("application/pdf");

      expect(result.valid).toBe(true);
      expect(result.mimetype).toBe("application/pdf");
    });

    it("devrait rejeter un type MIME invalide", () => {
      const result = validateMimetype("");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("invalide");
    });

    it("devrait valider avec une liste de types autorisés", () => {
      const result = validateMimetype("image/png", ["image/png", "image/jpeg"]);

      expect(result.valid).toBe(true);
    });

    it("devrait rejeter un type non autorisé", () => {
      const result = validateMimetype("application/exe", ["image/png"]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("non autorisé");
    });
  });

  describe("Service: ensureUploadDirectory", () => {
    it("devrait créer le dossier s'il n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);
      const mockMkdirSync = jest
        .spyOn(fs, "mkdirSync")
        .mockImplementation(() => undefined);

      const result = ensureUploadDirectory("/test/uploads");

      expect(result.success).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith("/test/uploads");
      expect(mockMkdirSync).toHaveBeenCalledWith("/test/uploads", {
        recursive: true,
      });
    });

    it("devrait réussir si le dossier existe déjà", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockMkdirSync = jest.spyOn(fs, "mkdirSync");

      const result = ensureUploadDirectory("/test/uploads");

      expect(result.success).toBe(true);
      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de création", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);
      const mockMkdirSync = jest
        .spyOn(fs, "mkdirSync")
        .mockImplementation(() => {
          throw new Error("Permission denied");
        });

      const result = ensureUploadDirectory("/test/uploads");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });
  });

  describe("Service: moveFile", () => {
    it("devrait déplacer un fichier avec succès", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValueOnce(true) // Source existe
        .mockReturnValueOnce(false); // Destination n'existe pas
      const mockRenameSync = jest
        .spyOn(fs, "renameSync")
        .mockImplementation(() => undefined);

      const result = moveFile("/source/file.jpg", "/dest/file.jpg");

      expect(result.success).toBe(true);
      expect(mockRenameSync).toHaveBeenCalledWith(
        "/source/file.jpg",
        "/dest/file.jpg",
      );
    });

    it("devrait échouer si le fichier source n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);

      const result = moveFile("/source/file.jpg", "/dest/file.jpg");

      expect(result.success).toBe(false);
      expect(result.error).toContain("n'existe pas");
    });

    it("devrait gérer les erreurs de déplacement", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockRenameSync = jest
        .spyOn(fs, "renameSync")
        .mockImplementation(() => {
          throw new Error("Access denied");
        });

      const result = moveFile("/source/file.jpg", "/dest/file.jpg");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Access denied");
    });
  });

  describe("Service: deleteFile", () => {
    it("devrait supprimer un fichier existant", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockUnlinkSync = jest
        .spyOn(fs, "unlinkSync")
        .mockImplementation(() => undefined);

      const result = deleteFile("/test/file.jpg");

      expect(result.success).toBe(true);
      expect(mockUnlinkSync).toHaveBeenCalledWith("/test/file.jpg");
    });

    it("devrait échouer si le fichier n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);

      const result = deleteFile("/test/file.jpg");

      expect(result.success).toBe(false);
      expect(result.error).toContain("n'existe pas");
    });

    it("devrait gérer les erreurs de suppression", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockUnlinkSync = jest
        .spyOn(fs, "unlinkSync")
        .mockImplementation(() => {
          throw new Error("Permission denied");
        });

      const result = deleteFile("/test/file.jpg");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });
  });

  describe("Service: getFileInfo", () => {
    it("devrait retourner les informations d'un fichier existant", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockStatSync = jest.spyOn(fs, "statSync").mockReturnValue({
        size: 1024,
        birthtime: new Date("2024-01-01"),
        mtime: new Date("2024-01-02"),
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const result = getFileInfo("/test/file.jpg");

      expect(result.exists).toBe(true);
      expect(result.info).toBeDefined();
      expect(result.info?.size).toBe(1024);
    });

    it("devrait indiquer si le fichier n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);

      const result = getFileInfo("/test/nonexistent.jpg");

      expect(result.exists).toBe(false);
      expect(result.error).toContain("n'existe pas");
    });
  });

  describe("Service: listFiles", () => {
    it("devrait lister les fichiers d'un dossier", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockReaddirSync = jest
        .spyOn(fs, "readdirSync")
        .mockReturnValue(["file1.jpg", "file2.png", "subfolder"] as any);
      const mockStatSync = jest
        .spyOn(fs, "statSync")
        .mockImplementation((filePath: any) => {
          const isDir = filePath.includes("subfolder");
          return {
            isFile: () => !isDir,
            isDirectory: () => isDir,
          } as any;
        });

      const result = listFiles("/test/uploads");

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it("devrait échouer si le dossier n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);

      const result = listFiles("/test/nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("n'existe pas");
    });
  });

  describe("Service: getUploadDirectoryStats", () => {
    it("devrait calculer les statistiques d'un dossier", () => {
      const mockExistsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const mockReaddirSync = jest
        .spyOn(fs, "readdirSync")
        .mockReturnValue(["file1.jpg", "file2.jpg", "doc.pdf"] as any);
      const mockStatSync = jest.spyOn(fs, "statSync").mockImplementation(
        (filePath: any) =>
          ({
            isFile: () => true,
            isDirectory: () => false,
            size: 1024,
          }) as any,
      );

      const result = getUploadDirectoryStats("/test/uploads");

      expect(result.success).toBe(true);
      expect(result.stats?.totalFiles).toBe(3);
      expect(result.stats?.totalSize).toBe(3072);
      expect(result.stats?.byExtension[".jpg"]).toBeDefined();
      expect(result.stats?.byExtension[".jpg"].count).toBe(2);
      expect(result.stats?.byExtension[".pdf"]).toBeDefined();
      expect(result.stats?.byExtension[".pdf"].count).toBe(1);
    });

    it("devrait échouer si le dossier n'existe pas", () => {
      const mockExistsSync = jest
        .spyOn(fs, "existsSync")
        .mockReturnValue(false);

      const result = getUploadDirectoryStats("/test/nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("n'existe pas");
    });
  });

  describe("Constants et Schema", () => {
    it("devrait avoir les bonnes extensions d'images", () => {
      expect(ALLOWED_IMAGE_EXTENSIONS).toContain(".jpg");
      expect(ALLOWED_IMAGE_EXTENSIONS).toContain(".png");
      expect(ALLOWED_IMAGE_EXTENSIONS).toContain(".gif");
    });

    it("devrait avoir les bonnes extensions de documents", () => {
      expect(ALLOWED_DOCUMENT_EXTENSIONS).toContain(".pdf");
      expect(ALLOWED_DOCUMENT_EXTENSIONS).toContain(".doc");
      expect(ALLOWED_DOCUMENT_EXTENSIONS).toContain(".docx");
    });

    it("devrait combiner toutes les extensions autorisées", () => {
      expect(ALLOWED_ALL_EXTENSIONS).toContain(".jpg");
      expect(ALLOWED_ALL_EXTENSIONS).toContain(".pdf");
    });

    it("devrait définir les limites de taille", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10 MB
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024); // 5 MB
    });
  });
});
