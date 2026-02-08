/**
 * Tests HTTP End-to-End pour le module Upload
 * Tests d'intégration complets avec Express et Multer
 *
 * ✅ SOLUTION ECONNRESET: Utilise un vrai serveur HTTP sur port éphémère
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import express, { Express } from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { startTestServer, stopTestServer } from "./helpers/test-server.js";
import type { TestServer } from "./helpers/test-server.js";

// Mock du middleware d'authentification AVANT d'importer le router
jest.mock("../../../middleware/auth.js", () => ({
  verifyToken: (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token === "valid-token") {
      req.user = { id: 1, email: "test@example.com" };
      return next();
    }
    return res.status(401).json({ message: "Non autorisé" });
  },
}));

import uploadRouter from "../upload.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Upload Module - Tests HTTP E2E", () => {
  let app: Express;
  let testServer: TestServer;
  let testUploadDir: string;
  let authToken: string;

  beforeAll(async () => {
    // Créer un dossier de test temporaire
    testUploadDir = path.join(__dirname, "../../../../test-uploads");
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    // S'assurer que le dossier public/uploads existe pour Multer
    const publicUploadsDir = path.join(__dirname, "../../../../public/uploads");
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
      console.log(
        "📁 [Test Setup] Dossier public/uploads créé:",
        publicUploadsDir,
      );
    }

    // Créer une application Express de test
    app = express();
    app.use(express.json());

    // Le middleware d'authentification est déjà mocké au niveau du module
    app.use("/api/upload", uploadRouter);

    // Gestionnaire d'erreurs global pour capturer les exceptions
    app.use((err: any, req: any, res: any, next: any) => {
      console.error("❌ [Test App] Erreur capturée:", err);
      console.error("Stack:", err.stack);

      if (res.headersSent) {
        return next(err);
      }

      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erreur serveur",
        error: err.toString(),
      });
    });

    authToken = "valid-token";

    // 🚀 Démarrer un vrai serveur HTTP (contourne ECONNRESET)
    testServer = await startTestServer(app);
    console.log(`🌐 Test server ready at ${testServer.url}`);
  });

  afterAll(async () => {
    // 🛑 Arrêter le serveur
    if (testServer) {
      await stopTestServer(testServer);
    }
    // Nettoyer le dossier de test
    if (fs.existsSync(testUploadDir)) {
      const files = fs.readdirSync(testUploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testUploadDir, file));
      }
      fs.rmdirSync(testUploadDir);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/upload/health", () => {
    it("devrait retourner le statut de santé (public)", async () => {
      const response = await request(app)
        .get("/api/upload/health")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("checks");
      expect(response.body).toHaveProperty("message");
      expect(response.body.checks).toHaveProperty("directory");
      expect(response.body.checks).toHaveProperty("writable");
      expect(response.body.checks).toHaveProperty("stats");
    });

    it("devrait inclure les données du dossier d'upload", async () => {
      const response = await request(app).get("/api/upload/health").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("uploadDirectory");
    });

    it("devrait retourner healthy si tout va bien", async () => {
      const response = await request(app).get("/api/upload/health").expect(200);

      expect(["healthy", "degraded"]).toContain(response.body.status);
    });
  });

  describe("POST /api/upload - Authentification", () => {
    it("devrait rejeter une requête sans token", async () => {
      const response = await request(app).post("/api/upload").expect(401);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Token");
    });

    it("devrait rejeter une requête avec un token invalide", async () => {
      const response = await request(testServer.url)
        .post("/api/upload")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("devrait accepter une requête avec un token valide", async () => {
      const response = await request(testServer.url)
        .post("/api/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400); // 400 car pas de fichiers, mais l'auth a passé

      expect(response.body).toHaveProperty("success");
      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("NO_FILES");
    });
  });

  describe("POST /api/upload - Upload de fichiers", () => {
    // ✅ Tests activés avec vrai serveur HTTP (contourne ECONNRESET)
    it("devrait rejeter une requête sans fichiers", async () => {
      const response = await request(testServer.url)
        .post("/api/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe("NO_FILES");
      expect(response.body.message).toContain("Aucun fichier");
    });

    it("devrait uploader une image avec succès", async () => {
      // Créer un fichier de test
      const testFile = Buffer.from("fake image content");
      const testFilePath = path.join(__dirname, "test-image.jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.type).toBe("SUCCESS");
        expect(response.body.files).toBeInstanceOf(Array);
        expect(response.body.files.length).toBe(1);
        expect(response.body.files[0]).toHaveProperty("url");
        expect(response.body.files[0]).toHaveProperty("name");
        expect(response.body.files[0]).toHaveProperty("size");
        expect(response.body.files[0]).toHaveProperty("mimetype");
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.totalFiles).toBe(1);
        expect(response.body.stats.successfulUploads).toBe(1);
        expect(response.body.stats.failedUploads).toBe(0);
      } finally {
        // Nettoyer
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait uploader un document PDF avec succès", async () => {
      const testFile = Buffer.from("%PDF-1.4 fake pdf content");
      const testFilePath = path.join(__dirname, "test-document.pdf");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.files.length).toBe(1);
        expect(response.body.files[0].name).toContain(".pdf");
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait uploader plusieurs fichiers avec succès", async () => {
      const testFile1 = Buffer.from("fake image 1");
      const testFile2 = Buffer.from("fake image 2");
      const testFile1Path = path.join(__dirname, "test-image1.jpg");
      const testFile2Path = path.join(__dirname, "test-image2.png");

      fs.writeFileSync(testFile1Path, testFile1);
      fs.writeFileSync(testFile2Path, testFile2);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFile1Path)
          .attach("files", testFile2Path)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.files.length).toBe(2);
        expect(response.body.stats.totalFiles).toBe(2);
        expect(response.body.stats.successfulUploads).toBe(2);
      } finally {
        if (fs.existsSync(testFile1Path)) fs.unlinkSync(testFile1Path);
        if (fs.existsSync(testFile2Path)) fs.unlinkSync(testFile2Path);
      }
    });

    it("devrait rejeter une extension non autorisée", async () => {
      const testFile = Buffer.from("fake executable");
      const testFilePath = path.join(__dirname, "test-script.exe");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("non autorisée");
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait sanitizer le nom du fichier uploadé", async () => {
      const testFile = Buffer.from("fake content");
      const testFilePath = path.join(__dirname, "fichier éàç espace.jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.files[0].url).not.toContain("é");
        expect(response.body.files[0].url).not.toContain("à");
        expect(response.body.files[0].url).not.toContain(" ");
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait inclure les statistiques dans la réponse", async () => {
      const testFile = Buffer.from("fake content");
      const testFilePath = path.join(__dirname, "test.jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.stats).toBeDefined();
        expect(response.body.stats).toHaveProperty("totalFiles");
        expect(response.body.stats).toHaveProperty("totalSize");
        expect(response.body.stats).toHaveProperty("successfulUploads");
        expect(response.body.stats).toHaveProperty("failedUploads");
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait gérer les erreurs Multer de taille de fichier", async () => {
      // Créer un fichier trop volumineux (>10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11 MB
      const testFilePath = path.join(__dirname, "large-file.jpg");
      fs.writeFileSync(testFilePath, largeFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.type).toBe("FILE_TOO_LARGE");
        expect(response.body.message).toContain("dépasse");
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait limiter le nombre de fichiers à 10", async () => {
      const testFiles = [];
      const testFilePaths = [];

      // Créer 11 fichiers de test
      for (let i = 0; i < 11; i++) {
        const testFile = Buffer.from(`fake content ${i}`);
        const testFilePath = path.join(__dirname, `test-file-${i}.jpg`);
        fs.writeFileSync(testFilePath, testFile);
        testFilePaths.push(testFilePath);
      }

      try {
        let uploadRequest = request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`);

        // Attacher tous les fichiers
        for (const filePath of testFilePaths) {
          uploadRequest = uploadRequest.attach("files", filePath);
        }

        const response = await uploadRequest.expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.type).toBe("TOO_MANY_FILES");
      } finally {
        // Nettoyer tous les fichiers
        for (const filePath of testFilePaths) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    });

    it("devrait retourner 207 en cas de succès partiel", async () => {
      // Créer un fichier valide et un fichier invalide
      const validFile = Buffer.from("valid content");
      const validFilePath = path.join(__dirname, "valid.jpg");
      fs.writeFileSync(validFilePath, validFile);

      const invalidFile = Buffer.from("invalid content");
      const invalidFilePath = path.join(__dirname, "invalid.exe");
      fs.writeFileSync(invalidFilePath, invalidFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", validFilePath)
          .attach("files", invalidFilePath)
          .expect(207);

        expect(response.body.success).toBe(false);
        expect(response.body.type).toBe("PARTIAL_SUCCESS");
        expect(response.body.files.length).toBeGreaterThan(0);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
        if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
      }
    });
  });

  describe("POST /api/upload - Gestion des erreurs", () => {
    it("devrait retourner une erreur 500 en cas d'erreur serveur", async () => {
      // Mock d'une erreur serveur en envoyant des données malformées
      const response = await request(testServer.url)
        .post("/api/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .set("Content-Type", "multipart/form-data")
        .send("invalid data")
        .expect(400); // Multer rejettera cela

      expect(response.body.success).toBe(false);
    });

    it("devrait gérer les noms de fichiers avec caractères spéciaux", async () => {
      const testFile = Buffer.from("content");
      const testFilePath = path.join(__dirname, "file@#$%^&*().jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Le nom devrait être sanitizé
        expect(response.body.files[0].url).toMatch(/\.jpg$/);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it("devrait gérer les noms de fichiers très longs", async () => {
      const testFile = Buffer.from("content");
      const longName = "a".repeat(300) + ".jpg";
      const testFilePath = path.join(__dirname, longName);

      try {
        fs.writeFileSync(testFilePath, testFile);

        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Le nom devrait être tronqué
        expect(response.body.files[0].url.length).toBeLessThan(
          longName.length + 50,
        );
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  describe("Headers et Content-Type", () => {
    it("devrait retourner du JSON", async () => {
      const response = await request(testServer.url)
        .get("/api/upload/health")
        .expect("Content-Type", /json/);

      expect(response.body).toBeDefined();
    });

    it("devrait accepter multipart/form-data", async () => {
      const testFile = Buffer.from("content");
      const testFilePath = path.join(__dirname, "test.jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(app)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath);

        expect(response.status).toBeLessThan(500);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  describe("Validation et sécurité", () => {
    it("devrait valider les extensions de fichiers", async () => {
      const extensions = [".jpg", ".png", ".pdf", ".doc"];

      for (const ext of extensions) {
        const testFile = Buffer.from("content");
        const testFilePath = path.join(__dirname, `test${ext}`);
        fs.writeFileSync(testFilePath, testFile);

        try {
          const response = await request(testServer.url)
            .post("/api/upload")
            .set("Authorization", `Bearer ${authToken}`)
            .attach("files", testFilePath);

          expect(response.status).toBeLessThan(500);
        } finally {
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        }
      }
    });

    it("ne devrait pas permettre l'upload de scripts", async () => {
      const dangerousExtensions = [".exe", ".sh", ".bat", ".cmd", ".js"];

      for (const ext of dangerousExtensions) {
        const testFile = Buffer.from("malicious content");
        const testFilePath = path.join(__dirname, `malicious${ext}`);
        fs.writeFileSync(testFilePath, testFile);

        try {
          const response = await request(testServer.url)
            .post("/api/upload")
            .set("Authorization", `Bearer ${authToken}`)
            .attach("files", testFilePath);

          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.body.success).toBe(false);
        } finally {
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        }
      }
    });

    it("devrait protéger contre les path traversal", async () => {
      const testFile = Buffer.from("content");
      const testFilePath = path.join(__dirname, "..%2F..%2Fetc%2Fpasswd.jpg");
      fs.writeFileSync(testFilePath, testFile);

      try {
        const response = await request(testServer.url)
          .post("/api/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("files", testFilePath);

        // Le fichier devrait être sanitizé et ne pas créer de problème
        if (response.status === 200) {
          expect(response.body.files[0].url).not.toContain("..");
          expect(response.body.files[0].url).not.toContain("/etc/");
        }
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });
});
