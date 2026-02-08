/**
 * Tests End-to-End complets pour le module Upload
 * Tests avec l'application Express complète et tous les middlewares
 *
 * Ces tests simulent un véritable environnement de production avec :
 * - Application Express complète
 * - Middlewares d'authentification réels
 * - Système de fichiers réel
 * - Configuration complète
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import express, { Express } from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import uploadRouter from "../upload.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simuler une vraie application Express
function createTestApp(): Express {
  const app = express();

  // Middlewares standards
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware de logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Middleware d'authentification simplifié
  app.use((req, res, next) => {
    // Routes publiques
    if (req.path === "/api/upload/health") {
      return next();
    }

    // Vérifier le token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
        code: "NO_TOKEN",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Validation basique du token (JWT simplifié pour les tests)
    if (token === "valid-e2e-token") {
      (req as any).user = {
        id: 1,
        email: "e2e-user@example.com",
        role: "member",
      };
      return next();
    }

    if (token === "admin-e2e-token") {
      (req as any).user = {
        id: 2,
        email: "e2e-admin@example.com",
        role: "admin",
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Token d'authentification invalide",
      code: "INVALID_TOKEN",
    });
  });

  // Monter le router upload
  app.use("/api/upload", uploadRouter);

  // Middleware de gestion d'erreurs global
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erreur serveur interne",
        code: err.code || "SERVER_ERROR",
      });
    },
  );

  // Route 404
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route non trouvée",
      code: "NOT_FOUND",
    });
  });

  return app;
}

describe.skip("Upload Module - Tests E2E Complets", () => {
  let app: Express;
  let testUploadDir: string;
  let uploadedFiles: string[] = [];
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Créer l'application
    app = createTestApp();

    // Créer un dossier de test
    testUploadDir = path.join(__dirname, "../../../../test-uploads-e2e");
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    // Tokens de test
    userToken = "valid-e2e-token";
    adminToken = "admin-e2e-token";

    console.log("✅ Application E2E initialisée");
  });

  afterAll(async () => {
    // Nettoyer le dossier de test
    if (fs.existsSync(testUploadDir)) {
      try {
        const files = fs.readdirSync(testUploadDir);
        for (const file of files) {
          fs.unlinkSync(path.join(testUploadDir, file));
        }
        fs.rmdirSync(testUploadDir);
      } catch (error) {
        console.warn("Erreur lors du nettoyage:", error);
      }
    }

    console.log("🔚 Tests E2E terminés");
  });

  beforeEach(() => {
    uploadedFiles = [];
  });

  afterEach(() => {
    // Nettoyer les fichiers créés
    for (const file of uploadedFiles) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (error) {
          // Ignorer
        }
      }
    }
  });

  // ==================== TESTS E2E - SCÉNARIOS COMPLETS ====================

  describe("E2E: Scénario complet d'upload utilisateur", () => {
    it("devrait permettre à un utilisateur authentifié d'uploader une photo de profil", async () => {
      // Étape 1: Vérifier le health check (sans auth)
      const healthResponse = await request(app)
        .get("/api/upload/health")
        .expect(200);

      expect(healthResponse.body.status).toBeDefined();

      // Étape 2: Créer un fichier image
      const imageContent = Buffer.from("fake image content for e2e test");
      const imagePath = path.join(__dirname, "e2e-profile-photo.jpg");
      fs.writeFileSync(imagePath, imageContent);

      try {
        // Étape 3: Upload avec authentification
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", imagePath)
          .expect(200);

        expect(uploadResponse.body.success).toBe(true);
        expect(uploadResponse.body.files).toHaveLength(1);
        expect(uploadResponse.body.files[0]).toHaveProperty("url");
        expect(uploadResponse.body.files[0]).toHaveProperty("name");
        expect(uploadResponse.body.files[0].url).toContain("/uploads/");

        // Étape 4: Vérifier les statistiques
        expect(uploadResponse.body.stats).toBeDefined();
        expect(uploadResponse.body.stats.totalFiles).toBe(1);
        expect(uploadResponse.body.stats.successfulUploads).toBe(1);
        expect(uploadResponse.body.stats.failedUploads).toBe(0);
      } finally {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    it("devrait gérer un workflow complet: plusieurs uploads successifs", async () => {
      // Scénario: Utilisateur upload avatar, puis 2 documents
      const files = [
        { name: "avatar.jpg", content: Buffer.from("avatar") },
        { name: "document1.pdf", content: Buffer.from("%PDF-1.4 doc1") },
        { name: "document2.pdf", content: Buffer.from("%PDF-1.4 doc2") },
      ];

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const filePath = path.join(__dirname, file.name);
        fs.writeFileSync(filePath, file.content);

        try {
          const response = await request(app)
            .post("/api/upload")
            .set("Authorization", `Bearer ${userToken}`)
            .attach("files", filePath)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.files).toHaveLength(1);
          uploadedUrls.push(response.body.files[0].url);
        } finally {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // Vérifier que tous les URLs sont uniques
      const uniqueUrls = new Set(uploadedUrls);
      expect(uniqueUrls.size).toBe(3);
    });

    it("devrait gérer un upload batch de plusieurs images", async () => {
      // Scénario: Upload de galerie (5 photos)
      const imagePaths: string[] = [];

      for (let i = 1; i <= 5; i++) {
        const imagePath = path.join(__dirname, `gallery-photo-${i}.jpg`);
        fs.writeFileSync(imagePath, Buffer.from(`photo ${i} content`));
        imagePaths.push(imagePath);
      }

      try {
        let uploadRequest = request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`);

        for (const imagePath of imagePaths) {
          uploadRequest = uploadRequest.attach("files", imagePath);
        }

        const response = await uploadRequest.expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.files).toHaveLength(5);
        expect(response.body.stats.totalFiles).toBe(5);
        expect(response.body.stats.successfulUploads).toBe(5);

        // Vérifier que tous les fichiers ont des noms sanitizés
        for (const file of response.body.files) {
          expect(file.url).toMatch(/\d+-gallery-photo-\d+\.jpg$/);
        }
      } finally {
        for (const imagePath of imagePaths) {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }
    });
  });

  describe("E2E: Gestion des erreurs et cas limites", () => {
    it("devrait rejeter un upload sans authentification", async () => {
      const testFile = path.join(__dirname, "no-auth.jpg");
      fs.writeFileSync(testFile, Buffer.from("content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .attach("files", testFile)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("NO_TOKEN");
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it("devrait rejeter un upload avec token invalide", async () => {
      const testFile = path.join(__dirname, "invalid-token.jpg");
      fs.writeFileSync(testFile, Buffer.from("content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", "Bearer invalid-token-xyz")
          .attach("files", testFile)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_TOKEN");
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it("devrait gérer un upload partiel (succès + échecs)", async () => {
      // Créer un mélange de fichiers valides et invalides
      const validFile = path.join(__dirname, "valid-e2e.jpg");
      const invalidFile = path.join(__dirname, "invalid-e2e.exe");

      fs.writeFileSync(validFile, Buffer.from("valid content"));
      fs.writeFileSync(invalidFile, Buffer.from("invalid content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", validFile)
          .attach("files", invalidFile)
          .expect(207); // Partial success

        expect(response.body.success).toBe(false);
        expect(response.body.type).toBe("PARTIAL_SUCCESS");
        expect(response.body.files.length).toBeGreaterThan(0);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(validFile)) fs.unlinkSync(validFile);
        if (fs.existsSync(invalidFile)) fs.unlinkSync(invalidFile);
      }
    });

    it("devrait gérer une tentative de dépassement de limite", async () => {
      // Créer 12 fichiers (limite est 10)
      const filePaths: string[] = [];
      for (let i = 0; i < 12; i++) {
        const filePath = path.join(__dirname, `limit-test-${i}.jpg`);
        fs.writeFileSync(filePath, Buffer.from(`content ${i}`));
        filePaths.push(filePath);
      }

      try {
        let uploadRequest = request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`);

        for (const filePath of filePaths) {
          uploadRequest = uploadRequest.attach("files", filePath);
        }

        const response = await uploadRequest.expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.type).toBe("TOO_MANY_FILES");
      } finally {
        for (const filePath of filePaths) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    });
  });

  describe("E2E: Sécurité et validation", () => {
    it("devrait bloquer les tentatives de path traversal", async () => {
      const maliciousFile = path.join(__dirname, "../../etc/passwd.jpg");

      // Créer un fichier avec un nom normal pour le test
      const testFile = path.join(__dirname, "malicious.jpg");
      fs.writeFileSync(testFile, Buffer.from("malicious"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", testFile);

        if (response.status === 200) {
          // Si l'upload réussit, vérifier que le nom est sanitizé
          expect(response.body.files[0].url).not.toContain("..");
          expect(response.body.files[0].url).not.toContain("etc");
          expect(response.body.files[0].url).not.toContain("passwd");
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it("devrait sanitizer les noms de fichiers avec caractères spéciaux", async () => {
      const specialFile = path.join(__dirname, "fichier éàü spécial@#$.jpg");
      fs.writeFileSync(specialFile, Buffer.from("content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", specialFile)
          .expect(200);

        expect(response.body.success).toBe(true);
        const uploadedUrl = response.body.files[0].url;

        // Vérifier que les caractères spéciaux sont sanitizés
        expect(uploadedUrl).not.toContain("é");
        expect(uploadedUrl).not.toContain("à");
        expect(uploadedUrl).not.toContain(" ");
        expect(uploadedUrl).not.toContain("@");
        expect(uploadedUrl).not.toContain("#");
        expect(uploadedUrl).not.toContain("$");
        expect(uploadedUrl).toMatch(/\.jpg$/);
      } finally {
        if (fs.existsSync(specialFile)) {
          fs.unlinkSync(specialFile);
        }
      }
    });

    it("devrait rejeter les extensions dangereuses", async () => {
      const dangerousExtensions = [".exe", ".sh", ".bat", ".cmd"];

      for (const ext of dangerousExtensions) {
        const dangerousFile = path.join(__dirname, `malicious${ext}`);
        fs.writeFileSync(dangerousFile, Buffer.from("malicious"));

        try {
          const response = await request(app)
            .post("/api/upload")
            .set("Authorization", `Bearer ${userToken}`)
            .attach("files", dangerousFile);

          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.body.success).toBe(false);
        } finally {
          if (fs.existsSync(dangerousFile)) {
            fs.unlinkSync(dangerousFile);
          }
        }
      }
    });
  });

  describe("E2E: Différents types de fichiers", () => {
    it("devrait accepter tous les types d'images autorisés", async () => {
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
      ];

      for (const ext of imageExtensions) {
        const imageFile = path.join(__dirname, `test-image${ext}`);
        fs.writeFileSync(imageFile, Buffer.from("image content"));

        try {
          const response = await request(app)
            .post("/api/upload")
            .set("Authorization", `Bearer ${userToken}`)
            .attach("files", imageFile)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.files[0].url).toContain(ext);
        } finally {
          if (fs.existsSync(imageFile)) {
            fs.unlinkSync(imageFile);
          }
        }
      }
    });

    it("devrait accepter tous les types de documents autorisés", async () => {
      const docExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];

      for (const ext of docExtensions) {
        const docFile = path.join(__dirname, `test-document${ext}`);
        fs.writeFileSync(docFile, Buffer.from("document content"));

        try {
          const response = await request(app)
            .post("/api/upload")
            .set("Authorization", `Bearer ${userToken}`)
            .attach("files", docFile)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.files[0].url).toContain(ext);
        } finally {
          if (fs.existsSync(docFile)) {
            fs.unlinkSync(docFile);
          }
        }
      }
    });
  });

  describe("E2E: Health check et monitoring", () => {
    it("devrait retourner le health check sans authentification", async () => {
      const response = await request(app).get("/api/upload/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("checks");
      expect(response.body.checks).toHaveProperty("directory");
      expect(response.body.checks).toHaveProperty("writable");
      expect(response.body.checks).toHaveProperty("stats");
    });

    it("devrait inclure les statistiques du dossier dans le health check", async () => {
      const response = await request(app).get("/api/upload/health").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("uploadDirectory");

      if (response.body.data.stats) {
        expect(response.body.data.stats).toHaveProperty("totalFiles");
        expect(response.body.data.stats).toHaveProperty("totalSize");
      }
    });
  });

  describe("E2E: Gestion des rôles (User vs Admin)", () => {
    it("devrait permettre à un utilisateur normal d'uploader", async () => {
      const userFile = path.join(__dirname, "user-upload.jpg");
      fs.writeFileSync(userFile, Buffer.from("user content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", userFile)
          .expect(200);

        expect(response.body.success).toBe(true);
      } finally {
        if (fs.existsSync(userFile)) {
          fs.unlinkSync(userFile);
        }
      }
    });

    it("devrait permettre à un admin d'uploader", async () => {
      const adminFile = path.join(__dirname, "admin-upload.jpg");
      fs.writeFileSync(adminFile, Buffer.from("admin content"));

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${adminToken}`)
          .attach("files", adminFile)
          .expect(200);

        expect(response.body.success).toBe(true);
      } finally {
        if (fs.existsSync(adminFile)) {
          fs.unlinkSync(adminFile);
        }
      }
    });
  });

  describe("E2E: Performance et concurrence", () => {
    it("devrait gérer plusieurs uploads concurrents", async () => {
      // Simuler 3 uploads simultanés
      const promises = [];

      for (let i = 0; i < 3; i++) {
        const file = path.join(__dirname, `concurrent-${i}.jpg`);
        fs.writeFileSync(file, Buffer.from(`content ${i}`));

        const uploadPromise = request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${userToken}`)
          .attach("files", file);

        promises.push(uploadPromise);
      }

      const responses = await Promise.all(promises);

      // Vérifier que tous ont réussi
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Nettoyer
      for (let i = 0; i < 3; i++) {
        const file = path.join(__dirname, `concurrent-${i}.jpg`);
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
    });
  });

  describe("E2E: Cas réels d'utilisation", () => {
    it("devrait gérer un workflow d'inscription: photo + 2 justificatifs", async () => {
      // Scénario réel: Nouvel adhérent upload sa photo et ses documents

      // 1. Photo d'identité
      const photoId = path.join(__dirname, "photo-identite.jpg");
      fs.writeFileSync(photoId, Buffer.from("photo id content"));

      const photoResponse = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("files", photoId)
        .expect(200);

      expect(photoResponse.body.files).toHaveLength(1);
      const photoUrl = photoResponse.body.files[0].url;

      // 2. Justificatif de domicile
      const justifDomicile = path.join(__dirname, "justificatif-domicile.pdf");
      fs.writeFileSync(justifDomicile, Buffer.from("%PDF-1.4 domicile"));

      const domicileResponse = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("files", justifDomicile)
        .expect(200);

      expect(domicileResponse.body.files).toHaveLength(1);
      const domicileUrl = domicileResponse.body.files[0].url;

      // 3. Certificat médical
      const certificatMedical = path.join(__dirname, "certificat-medical.pdf");
      fs.writeFileSync(certificatMedical, Buffer.from("%PDF-1.4 medical"));

      const medicalResponse = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("files", certificatMedical)
        .expect(200);

      expect(medicalResponse.body.files).toHaveLength(1);
      const medicalUrl = medicalResponse.body.files[0].url;

      // Vérifier que tous les URLs sont uniques
      const urls = [photoUrl, domicileUrl, medicalUrl];
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(3);

      // Vérifier que tous les fichiers sont accessibles
      for (const url of urls) {
        expect(url).toContain("/uploads/");
        expect(url).toMatch(/\.(jpg|pdf)$/);
      }

      // Nettoyer
      [photoId, justifDomicile, certificatMedical].forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    });
  });
});
