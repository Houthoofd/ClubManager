/**
 * Tests de validation pour le module Upload
 * Tests des schémas Zod et de la validation des données
 */

import { describe, it, expect } from "@jest/globals";
import {
  uploadedFileSchema,
  uploadedFilesArraySchema,
  uploadResponseSchema,
  uploadOptionsSchema,
  filenameSchema,
  fileExtensionSchema,
  mimetypeSchema,
  fileSizeSchema,
  fileMetadataSchema,
  encodingSchema,
  sanitizationOptionsSchema,
  uploadStatsSchema,
  storageConfigSchema,
  uploadErrorSchema,
  uploadErrorResponseSchema,
  uploadSuccessResponseSchema,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_ALL_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from "@clubmanager/types/validators";

describe("Upload Module - Tests de validation", () => {
  describe("Schema: uploadedFileSchema", () => {
    it("devrait valider un fichier uploadé correct", () => {
      const validFile = {
        fieldname: "files",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: "/uploads",
        filename: "1234567890-test.jpg",
        path: "/uploads/1234567890-test.jpg",
        size: 1024,
      };

      const result = uploadedFileSchema.safeParse(validFile);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un fichier sans originalname", () => {
      const invalidFile = {
        fieldname: "files",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: "/uploads",
        filename: "test.jpg",
        path: "/uploads/test.jpg",
        size: 1024,
      };

      const result = uploadedFileSchema.safeParse(invalidFile);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un fichier avec une taille trop grande", () => {
      const invalidFile = {
        fieldname: "files",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: "/uploads",
        filename: "test.jpg",
        path: "/uploads/test.jpg",
        size: 20 * 1024 * 1024, // 20 MB (> MAX_FILE_SIZE)
      };

      const result = uploadedFileSchema.safeParse(invalidFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dépasser");
      }
    });

    it("devrait rejeter un fichier avec une taille négative", () => {
      const invalidFile = {
        fieldname: "files",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: "/uploads",
        filename: "test.jpg",
        path: "/uploads/test.jpg",
        size: -100,
      };

      const result = uploadedFileSchema.safeParse(invalidFile);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un fichier avec une taille de 0", () => {
      const invalidFile = {
        fieldname: "files",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        destination: "/uploads",
        filename: "test.jpg",
        path: "/uploads/test.jpg",
        size: 0,
      };

      const result = uploadedFileSchema.safeParse(invalidFile);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: uploadedFilesArraySchema", () => {
    it("devrait valider un tableau de fichiers", () => {
      const validFiles = [
        {
          fieldname: "files",
          originalname: "test1.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          destination: "/uploads",
          filename: "test1.jpg",
          path: "/uploads/test1.jpg",
          size: 1024,
        },
        {
          fieldname: "files",
          originalname: "test2.png",
          encoding: "7bit",
          mimetype: "image/png",
          destination: "/uploads",
          filename: "test2.png",
          path: "/uploads/test2.png",
          size: 2048,
        },
      ];

      const result = uploadedFilesArraySchema.safeParse(validFiles);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un tableau vide", () => {
      const result = uploadedFilesArraySchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un fichier");
      }
    });

    it("devrait rejeter un tableau avec des fichiers invalides", () => {
      const invalidFiles = [
        {
          fieldname: "files",
          originalname: "test.jpg",
          // Manque encoding
          mimetype: "image/jpeg",
          destination: "/uploads",
          filename: "test.jpg",
          path: "/uploads/test.jpg",
          size: 1024,
        },
      ];

      const result = uploadedFilesArraySchema.safeParse(invalidFiles);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: filenameSchema", () => {
    it("devrait valider un nom de fichier correct", () => {
      const result = filenameSchema.safeParse("test-file_123.jpg");

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom de fichier vide", () => {
      const result = filenameSchema.safeParse("");

      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom de fichier trop long", () => {
      const longName = "a".repeat(256) + ".jpg";
      const result = filenameSchema.safeParse(longName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255 caractères");
      }
    });

    it("devrait rejeter un nom de fichier avec ..", () => {
      const result = filenameSchema.safeParse("../../../etc/passwd");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("..");
      }
    });

    it("devrait rejeter un nom de fichier avec des séparateurs de chemin", () => {
      const result1 = filenameSchema.safeParse("folder/file.jpg");
      const result2 = filenameSchema.safeParse("folder\\file.jpg");

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe("Schema: fileExtensionSchema", () => {
    it("devrait valider une extension correcte", () => {
      const result = fileExtensionSchema.safeParse(".jpg");

      expect(result.success).toBe(true);
    });

    it("devrait rejeter une extension sans point", () => {
      const result = fileExtensionSchema.safeParse("jpg");

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une extension avec des caractères spéciaux", () => {
      const result = fileExtensionSchema.safeParse(".jpg@");

      expect(result.success).toBe(false);
    });

    it("devrait accepter les extensions avec des chiffres", () => {
      const result = fileExtensionSchema.safeParse(".mp3");

      expect(result.success).toBe(true);
    });
  });

  describe("Schema: mimetypeSchema", () => {
    it("devrait valider un type MIME correct", () => {
      const validMimetypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "text/plain",
        "video/mp4",
      ];

      for (const mimetype of validMimetypes) {
        const result = mimetypeSchema.safeParse(mimetype);
        expect(result.success).toBe(true);
      }
    });

    it("devrait rejeter un type MIME invalide", () => {
      const invalidMimetypes = ["image", "jpeg", "image/", "/jpeg", ""];

      for (const mimetype of invalidMimetypes) {
        const result = mimetypeSchema.safeParse(mimetype);
        expect(result.success).toBe(false);
      }
    });

    it("devrait accepter les types MIME avec des caractères spéciaux", () => {
      const result = mimetypeSchema.safeParse("application/vnd.ms-excel");

      expect(result.success).toBe(true);
    });
  });

  describe("Schema: fileSizeSchema", () => {
    it("devrait valider une taille correcte", () => {
      const result = fileSizeSchema.safeParse(1024);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter une taille négative", () => {
      const result = fileSizeSchema.safeParse(-100);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille de 0", () => {
      const result = fileSizeSchema.safeParse(0);

      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille trop grande", () => {
      const result = fileSizeSchema.safeParse(20 * 1024 * 1024);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dépasser");
      }
    });

    it("devrait accepter la taille maximale exacte", () => {
      const result = fileSizeSchema.safeParse(MAX_FILE_SIZE);

      expect(result.success).toBe(true);
    });
  });

  describe("Schema: fileMetadataSchema", () => {
    it("devrait valider des métadonnées complètes", () => {
      const validMetadata = {
        originalName: "test.jpg",
        sanitizedName: "1234567890-test.jpg",
        size: 1024,
        mimetype: "image/jpeg",
        extension: ".jpg",
        uploadDate: new Date(),
        path: "/uploads/1234567890-test.jpg",
        url: "http://localhost:3000/uploads/1234567890-test.jpg",
      };

      const result = fileMetadataSchema.safeParse(validMetadata);

      expect(result.success).toBe(true);
    });

    it("devrait valider des métadonnées sans uploadDate", () => {
      const validMetadata = {
        originalName: "test.jpg",
        sanitizedName: "1234567890-test.jpg",
        size: 1024,
        mimetype: "image/jpeg",
        extension: ".jpg",
        path: "/uploads/1234567890-test.jpg",
        url: "http://localhost:3000/uploads/1234567890-test.jpg",
      };

      const result = fileMetadataSchema.safeParse(validMetadata);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter des métadonnées avec une URL invalide", () => {
      const invalidMetadata = {
        originalName: "test.jpg",
        sanitizedName: "1234567890-test.jpg",
        size: 1024,
        mimetype: "image/jpeg",
        extension: ".jpg",
        path: "/uploads/1234567890-test.jpg",
        url: "not-a-valid-url",
      };

      const result = fileMetadataSchema.safeParse(invalidMetadata);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: encodingSchema", () => {
    it("devrait valider les encodages autorisés", () => {
      const validEncodings = [
        "7bit",
        "8bit",
        "binary",
        "base64",
        "quoted-printable",
      ];

      for (const encoding of validEncodings) {
        const result = encodingSchema.safeParse(encoding);
        expect(result.success).toBe(true);
      }
    });

    it("devrait rejeter un encodage invalide", () => {
      const result = encodingSchema.safeParse("invalid-encoding");

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: sanitizationOptionsSchema", () => {
    it("devrait valider des options par défaut", () => {
      const result = sanitizationOptionsSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.removeAccents).toBe(true);
        expect(result.data.replaceSpaces).toBe(true);
        expect(result.data.lowercase).toBe(false);
        expect(result.data.addTimestamp).toBe(true);
        expect(result.data.maxLength).toBe(255);
      }
    });

    it("devrait valider des options personnalisées", () => {
      const customOptions = {
        removeAccents: false,
        replaceSpaces: false,
        lowercase: true,
        addTimestamp: false,
        maxLength: 100,
      };

      const result = sanitizationOptionsSchema.safeParse(customOptions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(customOptions);
      }
    });

    it("devrait rejeter une maxLength négative", () => {
      const invalidOptions = {
        maxLength: -100,
      };

      const result = sanitizationOptionsSchema.safeParse(invalidOptions);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: uploadStatsSchema", () => {
    it("devrait valider des statistiques correctes", () => {
      const validStats = {
        totalFiles: 5,
        totalSize: 10240,
        successfulUploads: 4,
        failedUploads: 1,
      };

      const result = uploadStatsSchema.safeParse(validStats);

      expect(result.success).toBe(true);
    });

    it("devrait accepter des valeurs à 0", () => {
      const validStats = {
        totalFiles: 0,
        totalSize: 0,
        successfulUploads: 0,
        failedUploads: 0,
      };

      const result = uploadStatsSchema.safeParse(validStats);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter des valeurs négatives", () => {
      const invalidStats = {
        totalFiles: -1,
        totalSize: 10240,
        successfulUploads: 4,
        failedUploads: 1,
      };

      const result = uploadStatsSchema.safeParse(invalidStats);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: uploadErrorSchema", () => {
    it("devrait valider une erreur complète", () => {
      const validError = {
        filename: "test.exe",
        error: "Extension non autorisée",
        code: "INVALID_EXTENSION",
        details: { extension: ".exe" },
      };

      const result = uploadErrorSchema.safeParse(validError);

      expect(result.success).toBe(true);
    });

    it("devrait valider une erreur minimale", () => {
      const validError = {
        error: "Erreur inconnue",
        code: "UNKNOWN_ERROR",
      };

      const result = uploadErrorSchema.safeParse(validError);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter un code d'erreur invalide", () => {
      const invalidError = {
        error: "Erreur",
        code: "INVALID_CODE",
      };

      const result = uploadErrorSchema.safeParse(invalidError);

      expect(result.success).toBe(false);
    });

    it("devrait accepter tous les codes d'erreur définis", () => {
      const errorCodes = [
        "FILE_TOO_LARGE",
        "INVALID_EXTENSION",
        "INVALID_MIMETYPE",
        "UPLOAD_FAILED",
        "SANITIZATION_FAILED",
        "STORAGE_ERROR",
        "UNKNOWN_ERROR",
      ];

      for (const code of errorCodes) {
        const error = {
          error: "Test error",
          code,
        };

        const result = uploadErrorSchema.safeParse(error);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Schema: uploadSuccessResponseSchema", () => {
    it("devrait valider une réponse de succès complète", () => {
      const validResponse = {
        success: true as const,
        message: "Upload réussi",
        files: [
          {
            originalName: "test.jpg",
            sanitizedName: "1234567890-test.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            extension: ".jpg",
            path: "/uploads/1234567890-test.jpg",
            url: "http://localhost:3000/uploads/1234567890-test.jpg",
          },
        ],
        stats: {
          totalFiles: 1,
          totalSize: 1024,
          successfulUploads: 1,
          failedUploads: 0,
        },
      };

      const result = uploadSuccessResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter une réponse avec success=false", () => {
      const invalidResponse = {
        success: false,
        files: [],
      };

      const result = uploadSuccessResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("Schema: uploadErrorResponseSchema", () => {
    it("devrait valider une réponse d'erreur", () => {
      const validResponse = {
        success: false as const,
        message: "Upload échoué",
        errors: [
          {
            filename: "test.exe",
            error: "Extension non autorisée",
            code: "INVALID_EXTENSION",
          },
        ],
      };

      const result = uploadErrorResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("devrait rejeter une réponse avec success=true", () => {
      const invalidResponse = {
        success: true,
        message: "Erreur",
      };

      const result = uploadErrorResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("Constants", () => {
    it("devrait avoir les bonnes valeurs pour ALLOWED_IMAGE_EXTENSIONS", () => {
      expect(ALLOWED_IMAGE_EXTENSIONS).toEqual([
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
      ]);
    });

    it("devrait avoir les bonnes valeurs pour ALLOWED_DOCUMENT_EXTENSIONS", () => {
      expect(ALLOWED_DOCUMENT_EXTENSIONS).toEqual([
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".txt",
      ]);
    });

    it("devrait combiner toutes les extensions dans ALLOWED_ALL_EXTENSIONS", () => {
      const combined = [
        ...ALLOWED_IMAGE_EXTENSIONS,
        ...ALLOWED_DOCUMENT_EXTENSIONS,
      ];
      expect(ALLOWED_ALL_EXTENSIONS).toEqual(combined);
    });

    it("devrait avoir MAX_FILE_SIZE = 10 MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it("devrait avoir MAX_IMAGE_SIZE = 5 MB", () => {
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
    });
  });
});
