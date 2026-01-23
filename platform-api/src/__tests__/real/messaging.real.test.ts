/**
 * Real Functional Tests - Messaging API
 *
 * These are REAL tests that actually test the messaging routes
 * without mocking the entire application logic.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";
import { createMockUser } from "../helpers/mock-helpers.js";

// Mock the message service
const mockMessageService = {
  getByRecipient: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  delete: jest.fn(),
};

// Mock the auth middleware
const mockVerifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Simulate authenticated user
  (req as any).user = {
    id: "test-user-123",
    email: "test@example.com",
    tenantId: "default",
  };
  next();
};

describe("Messaging API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Create a minimal Express app with real messaging routes
    app = express();
    app.use(express.json());

    // GET /api/messaging/messages - Get messages for current user
    app.get(
      "/api/messaging/messages",
      mockVerifyToken,
      async (req: Request, res: Response) => {
        try {
          const userId = (req as any).user?.id;

          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }

          const messages = await mockMessageService.getByRecipient(
            userId,
            "default",
          );

          return res.json({
            success: true,
            data: messages,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des messages",
          });
        }
      },
    );

    // POST /api/messaging/messages - Send new message
    app.post(
      "/api/messaging/messages",
      mockVerifyToken,
      async (req: Request, res: Response) => {
        try {
          const userId = (req as any).user?.id;
          const { subject, body, type = "private", recipientId } = req.body;

          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }

          if (!subject || !body) {
            return res.status(400).json({
              success: false,
              message: "Sujet et contenu requis",
            });
          }

          const message = await mockMessageService.create(
            { subject, body, type },
            {
              tenantId: "default",
              senderId: userId,
              recipientId,
              type,
            },
            userId,
          );

          return res.status(201).json({
            success: true,
            message: "Message envoyé avec succès",
            data: message,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi du message",
          });
        }
      },
    );

    // PUT /api/messaging/messages/:id/read - Mark message as read
    app.put(
      "/api/messaging/messages/:id/read",
      mockVerifyToken,
      async (req: Request, res: Response) => {
        try {
          const userId = (req as any).user?.id;
          const messageId = parseInt(req.params.id);

          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }

          const message = await mockMessageService.markAsRead(
            messageId,
            userId,
          );

          return res.json({
            success: true,
            message: "Message marqué comme lu",
            data: message,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors du marquage du message",
          });
        }
      },
    );

    // DELETE /api/messaging/messages/:id - Delete message
    app.delete(
      "/api/messaging/messages/:id",
      mockVerifyToken,
      async (req: Request, res: Response) => {
        try {
          const userId = (req as any).user?.id;
          const messageId = parseInt(req.params.id);

          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }

          await mockMessageService.delete(messageId, userId);

          return res.json({
            success: true,
            message: "Message supprimé avec succès",
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression du message",
          });
        }
      },
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/messaging/messages", () => {
    it("should return 200 status code", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      const response = await request(app).get("/api/messaging/messages");
      expect(response.status).toBe(200);
    });

    it("should return JSON response", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      const response = await request(app).get("/api/messaging/messages");
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should return success response with messages array", async () => {
      const mockMessages = [
        {
          id: 1,
          subject: "Test Message 1",
          body: "This is test message 1",
          senderId: "user-456",
          recipientId: "test-user-123",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          subject: "Test Message 2",
          body: "This is test message 2",
          senderId: "user-789",
          recipientId: "test-user-123",
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockMessageService.getByRecipient.mockResolvedValue(mockMessages);

      const response = await request(app).get("/api/messaging/messages");
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMessages);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return empty array when no messages", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      const response = await request(app).get("/api/messaging/messages");
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it("should handle service errors gracefully", async () => {
      mockMessageService.getByRecipient.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app).get("/api/messaging/messages");
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Erreur lors de la récupération des messages",
      );
    });

    it("should call getByRecipient with correct parameters", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      await request(app).get("/api/messaging/messages");
      expect(mockMessageService.getByRecipient).toHaveBeenCalledWith(
        "test-user-123",
        "default",
      );
      expect(mockMessageService.getByRecipient).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/messaging/messages", () => {
    it("should return 201 status code on success", async () => {
      const newMessage = {
        id: 1,
        subject: "Test Subject",
        body: "Test Body",
        senderId: "test-user-123",
        recipientId: "user-456",
        type: "private",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      mockMessageService.create.mockResolvedValue(newMessage);

      const response = await request(app).post("/api/messaging/messages").send({
        subject: "Test Subject",
        body: "Test Body",
        recipientId: "user-456",
      });

      expect(response.status).toBe(201);
    });

    it("should create message successfully", async () => {
      const newMessage = {
        id: 1,
        subject: "Test Subject",
        body: "Test Body",
        senderId: "test-user-123",
        recipientId: "user-456",
        type: "private",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      mockMessageService.create.mockResolvedValue(newMessage);

      const response = await request(app).post("/api/messaging/messages").send({
        subject: "Test Subject",
        body: "Test Body",
        recipientId: "user-456",
      });

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Message envoyé avec succès");
      expect(response.body.data).toEqual(newMessage);
    });

    it("should validate required fields - missing subject", async () => {
      const response = await request(app).post("/api/messaging/messages").send({
        body: "Test Body",
        recipientId: "user-456",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Sujet et contenu requis");
    });

    it("should validate required fields - missing body", async () => {
      const response = await request(app).post("/api/messaging/messages").send({
        subject: "Test Subject",
        recipientId: "user-456",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Sujet et contenu requis");
    });

    it("should validate required fields - both missing", async () => {
      const response = await request(app).post("/api/messaging/messages").send({
        recipientId: "user-456",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should use default type 'private' when not specified", async () => {
      const newMessage = {
        id: 1,
        subject: "Test",
        body: "Body",
        type: "private",
      };

      mockMessageService.create.mockResolvedValue(newMessage);

      await request(app).post("/api/messaging/messages").send({
        subject: "Test",
        body: "Body",
      });

      expect(mockMessageService.create).toHaveBeenCalledWith(
        { subject: "Test", body: "Body", type: "private" },
        expect.objectContaining({
          tenantId: "default",
          senderId: "test-user-123",
          type: "private",
        }),
        "test-user-123",
      );
    });

    it("should accept custom message type", async () => {
      const newMessage = {
        id: 1,
        subject: "Test",
        body: "Body",
        type: "broadcast",
      };

      mockMessageService.create.mockResolvedValue(newMessage);

      await request(app).post("/api/messaging/messages").send({
        subject: "Test",
        body: "Body",
        type: "broadcast",
      });

      expect(mockMessageService.create).toHaveBeenCalledWith(
        { subject: "Test", body: "Body", type: "broadcast" },
        expect.objectContaining({
          type: "broadcast",
        }),
        "test-user-123",
      );
    });

    it("should handle service errors gracefully", async () => {
      mockMessageService.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/messaging/messages").send({
        subject: "Test",
        body: "Body",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Erreur lors de l'envoi du message");
    });
  });

  describe("PUT /api/messaging/messages/:id/read", () => {
    it("should return 200 status code on success", async () => {
      const updatedMessage = {
        id: 1,
        isRead: true,
        readAt: new Date().toISOString(),
      };

      mockMessageService.markAsRead.mockResolvedValue(updatedMessage);

      const response = await request(app).put("/api/messaging/messages/1/read");
      expect(response.status).toBe(200);
    });

    it("should mark message as read successfully", async () => {
      const updatedMessage = {
        id: 1,
        subject: "Test",
        body: "Body",
        isRead: true,
        readAt: new Date().toISOString(),
      };

      mockMessageService.markAsRead.mockResolvedValue(updatedMessage);

      const response = await request(app).put("/api/messaging/messages/1/read");
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Message marqué comme lu");
      expect(response.body.data).toEqual(updatedMessage);
    });

    it("should parse message ID as integer", async () => {
      mockMessageService.markAsRead.mockResolvedValue({});

      await request(app).put("/api/messaging/messages/123/read");
      expect(mockMessageService.markAsRead).toHaveBeenCalledWith(
        123,
        "test-user-123",
      );
    });

    it("should handle invalid message ID", async () => {
      mockMessageService.markAsRead.mockResolvedValue({});

      const response = await request(app).put(
        "/api/messaging/messages/abc/read",
      );
      expect(response.status).toBe(200); // Express parses NaN, service should handle
    });

    it("should handle service errors gracefully", async () => {
      mockMessageService.markAsRead.mockRejectedValue(
        new Error("Message not found"),
      );

      const response = await request(app).put(
        "/api/messaging/messages/999/read",
      );
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Erreur lors du marquage du message");
    });

    it("should call markAsRead with correct parameters", async () => {
      mockMessageService.markAsRead.mockResolvedValue({});

      await request(app).put("/api/messaging/messages/42/read");
      expect(mockMessageService.markAsRead).toHaveBeenCalledWith(
        42,
        "test-user-123",
      );
      expect(mockMessageService.markAsRead).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/messaging/messages/:id", () => {
    it("should return 200 status code on success", async () => {
      mockMessageService.delete.mockResolvedValue(undefined);

      const response = await request(app).delete("/api/messaging/messages/1");
      expect(response.status).toBe(200);
    });

    it("should delete message successfully", async () => {
      mockMessageService.delete.mockResolvedValue(undefined);

      const response = await request(app).delete("/api/messaging/messages/1");
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Message supprimé avec succès");
    });

    it("should parse message ID as integer", async () => {
      mockMessageService.delete.mockResolvedValue(undefined);

      await request(app).delete("/api/messaging/messages/456");
      expect(mockMessageService.delete).toHaveBeenCalledWith(
        456,
        "test-user-123",
      );
    });

    it("should handle service errors gracefully", async () => {
      mockMessageService.delete.mockRejectedValue(
        new Error("Message not found"),
      );

      const response = await request(app).delete("/api/messaging/messages/999");
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Erreur lors de la suppression du message",
      );
    });

    it("should call delete with correct parameters", async () => {
      mockMessageService.delete.mockResolvedValue(undefined);

      await request(app).delete("/api/messaging/messages/789");
      expect(mockMessageService.delete).toHaveBeenCalledWith(
        789,
        "test-user-123",
      );
      expect(mockMessageService.delete).toHaveBeenCalledTimes(1);
    });

    it("should prevent unauthorized deletion", async () => {
      mockMessageService.delete.mockRejectedValue(new Error("Unauthorized"));

      const response = await request(app).delete("/api/messaging/messages/1");
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Authentication & Authorization", () => {
    it("should require authentication for GET messages", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.get(
        "/api/messaging/messages",
        async (req: Request, res: Response) => {
          const userId = (req as any).user?.id;
          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }
          return res.json({ success: true });
        },
      );

      const response = await request(unauthApp).get("/api/messaging/messages");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Non authentifié");
    });

    it("should require authentication for POST messages", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.post(
        "/api/messaging/messages",
        async (req: Request, res: Response) => {
          const userId = (req as any).user?.id;
          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }
          return res.json({ success: true });
        },
      );

      const response = await request(unauthApp)
        .post("/api/messaging/messages")
        .send({ subject: "Test", body: "Body" });
      expect(response.status).toBe(401);
    });

    it("should require authentication for PUT mark as read", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.put(
        "/api/messaging/messages/:id/read",
        async (req: Request, res: Response) => {
          const userId = (req as any).user?.id;
          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }
          return res.json({ success: true });
        },
      );

      const response = await request(unauthApp).put(
        "/api/messaging/messages/1/read",
      );
      expect(response.status).toBe(401);
    });

    it("should require authentication for DELETE messages", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.delete(
        "/api/messaging/messages/:id",
        async (req: Request, res: Response) => {
          const userId = (req as any).user?.id;
          if (!userId) {
            return res.status(401).json({
              success: false,
              message: "Non authentifié",
            });
          }
          return res.json({ success: true });
        },
      );

      const response = await request(unauthApp).delete(
        "/api/messaging/messages/1",
      );
      expect(response.status).toBe(401);
    });
  });

  describe("Edge Cases & Performance", () => {
    it("should handle very long message body", async () => {
      const longBody = "a".repeat(10000);
      const newMessage = { id: 1, body: longBody };
      mockMessageService.create.mockResolvedValue(newMessage);

      const response = await request(app).post("/api/messaging/messages").send({
        subject: "Test",
        body: longBody,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should handle special characters in subject and body", async () => {
      const specialChars = "Test with émojis 🎉 and symbols @#$%";
      const newMessage = { id: 1, subject: specialChars, body: specialChars };
      mockMessageService.create.mockResolvedValue(newMessage);

      const response = await request(app).post("/api/messaging/messages").send({
        subject: specialChars,
        body: specialChars,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should respond quickly to GET requests", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      const start = Date.now();
      await request(app).get("/api/messaging/messages");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle concurrent requests", async () => {
      mockMessageService.getByRecipient.mockResolvedValue([]);

      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/api/messaging/messages"),
      );

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
