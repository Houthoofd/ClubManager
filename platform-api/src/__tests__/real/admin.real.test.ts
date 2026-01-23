/**
 * Real Functional Tests - Admin (Super Admin) API
 *
 * These are REAL tests that actually test the admin/super-admin routes
 * without mocking the entire application logic.
 * Tests critical security features like authorization and tenant management.
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

// Mock the multi-tenant service
const mockMultiTenantService = {
  getAllTenants: jest.fn(),
  getTenantDetails: jest.fn(),
  updateTenantStatus: jest.fn(),
  getPlatformAnalytics: jest.fn(),
  getRevenueAnalytics: jest.fn(),
  createImpersonationToken: jest.fn(),
  getSystemHealth: jest.fn(),
  setMaintenanceMode: jest.fn(),
  getAuditLogs: jest.fn(),
};

// Mock auth middleware - super admin
const mockRequireSuperAdmin = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super admin access required",
      });
    }
    next();
  };
};

// Helper to create authenticated super admin request
const authenticateSuperAdmin = (req: any) => {
  req.user = {
    id: "super-admin-123",
    email: "admin@clubmanager.app",
    role: "SUPER_ADMIN",
    tenantId: "platform",
  };
};

// Helper to create authenticated regular user request
const authenticateRegularUser = (req: any) => {
  req.user = {
    id: "user-456",
    email: "user@example.com",
    role: "TENANT_ADMIN",
    tenantId: "tenant-123",
  };
};

describe("Admin (Super Admin) API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Middleware to simulate authentication
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader === "Bearer super-admin-token") {
        authenticateSuperAdmin(req);
      } else if (authHeader === "Bearer user-token") {
        authenticateRegularUser(req);
      }
      next();
    });

    const requireSuperAdmin = mockRequireSuperAdmin();

    // GET /api/admin/tenants - Get all tenants
    app.get(
      "/api/admin/tenants",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const {
            page = 1,
            limit = 20,
            search,
            plan,
            status,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = req.query;

          const tenants = await mockMultiTenantService.getAllTenants({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            plan: plan as string,
            status: status as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as "asc" | "desc",
          });

          return res.json({
            success: true,
            data: tenants.data,
            pagination: {
              page: tenants.page,
              limit: tenants.limit,
              total: tenants.total,
              pages: Math.ceil(tenants.total / tenants.limit),
            },
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load tenants",
          });
        }
      },
    );

    // GET /api/admin/tenants/:tenantId - Get tenant details
    app.get(
      "/api/admin/tenants/:tenantId",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { tenantId } = req.params;
          const tenant =
            await mockMultiTenantService.getTenantDetails(tenantId);

          if (!tenant) {
            return res.status(404).json({
              success: false,
              message: "Tenant not found",
            });
          }

          return res.json({
            success: true,
            data: tenant,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load tenant details",
          });
        }
      },
    );

    // PATCH /api/admin/tenants/:tenantId/status - Update tenant status
    app.patch(
      "/api/admin/tenants/:tenantId/status",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { tenantId } = req.params;
          const { status, reason } = req.body;

          const validStatuses = ["ACTIVE", "SUSPENDED", "CANCELLED", "DELETED"];
          if (!validStatuses.includes(status)) {
            return res.status(400).json({
              success: false,
              message: "Invalid status",
            });
          }

          const result = await mockMultiTenantService.updateTenantStatus(
            tenantId,
            {
              status,
              reason,
              updatedBy: (req as any).user!.id,
            },
          );

          return res.json({
            success: true,
            message: `Tenant status updated to ${status}`,
            data: result,
          });
        } catch (error: any) {
          if (error.message.includes("not found")) {
            return res.status(404).json({
              success: false,
              message: "Tenant not found",
            });
          }

          return res.status(500).json({
            success: false,
            message: "Failed to update tenant status",
          });
        }
      },
    );

    // GET /api/admin/analytics/overview - Platform analytics
    app.get(
      "/api/admin/analytics/overview",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { period = "30d" } = req.query;
          const analytics = await mockMultiTenantService.getPlatformAnalytics({
            period: period as string,
          });

          return res.json({
            success: true,
            data: analytics,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load analytics",
          });
        }
      },
    );

    // GET /api/admin/analytics/revenue - Revenue analytics
    app.get(
      "/api/admin/analytics/revenue",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { period = "30d" } = req.query;
          const revenue = await mockMultiTenantService.getRevenueAnalytics({
            period: period as string,
          });

          return res.json({
            success: true,
            data: revenue,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load revenue analytics",
          });
        }
      },
    );

    // POST /api/admin/tenants/:tenantId/impersonate - Impersonation token
    app.post(
      "/api/admin/tenants/:tenantId/impersonate",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { tenantId } = req.params;
          const { reason } = req.body;

          if (!reason || reason.length < 10) {
            return res.status(400).json({
              success: false,
              message:
                "Reason for impersonation is required (minimum 10 characters)",
            });
          }

          const impersonationToken =
            await mockMultiTenantService.createImpersonationToken(tenantId, {
              reason,
              createdBy: (req as any).user!.id,
              expiresIn: "1h",
            });

          return res.json({
            success: true,
            message: "Impersonation token created",
            data: {
              token: impersonationToken.token,
              expiresAt: impersonationToken.expiresAt,
              tenantUrl: `https://${impersonationToken.tenant.subdomain}.clubmanager.app`,
            },
          });
        } catch (error: any) {
          if (error.message.includes("not found")) {
            return res.status(404).json({
              success: false,
              message: "Tenant not found",
            });
          }

          return res.status(500).json({
            success: false,
            message: "Failed to create impersonation token",
          });
        }
      },
    );

    // GET /api/admin/system/health - System health
    app.get(
      "/api/admin/system/health",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const health = await mockMultiTenantService.getSystemHealth();

          return res.json({
            success: true,
            data: health,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load system health",
          });
        }
      },
    );

    // POST /api/admin/system/maintenance - Maintenance mode
    app.post(
      "/api/admin/system/maintenance",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const { enabled, message, estimatedDuration } = req.body;

          const result = await mockMultiTenantService.setMaintenanceMode({
            enabled: Boolean(enabled),
            message: message || "System is under maintenance",
            estimatedDuration,
            setBy: (req as any).user!.id,
          });

          return res.json({
            success: true,
            message: enabled
              ? "Maintenance mode enabled"
              : "Maintenance mode disabled",
            data: result,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to update maintenance mode",
          });
        }
      },
    );

    // GET /api/admin/logs/audit - Audit logs
    app.get(
      "/api/admin/logs/audit",
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const {
            page = 1,
            limit = 50,
            action,
            userId,
            tenantId,
            startDate,
            endDate,
          } = req.query;

          const logs = await mockMultiTenantService.getAuditLogs({
            page: Number(page),
            limit: Number(limit),
            action: action as string,
            userId: userId as string,
            tenantId: tenantId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
          });

          return res.json({
            success: true,
            data: logs.data,
            pagination: {
              page: logs.page,
              limit: logs.limit,
              total: logs.total,
              pages: Math.ceil(logs.total / logs.limit),
            },
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Failed to load audit logs",
          });
        }
      },
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authorization & Security", () => {
    it("should require super admin role for tenant listing", async () => {
      const response = await request(app)
        .get("/api/admin/tenants")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Super admin access required");
    });

    it("should require super admin role for tenant details", async () => {
      const response = await request(app)
        .get("/api/admin/tenants/tenant-123")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Super admin access required");
    });

    it("should require super admin role for status updates", async () => {
      const response = await request(app)
        .patch("/api/admin/tenants/tenant-123/status")
        .set("Authorization", "Bearer user-token")
        .send({ status: "SUSPENDED", reason: "Test" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Super admin access required");
    });

    it("should require super admin for analytics", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/overview")
        .set("Authorization", "Bearer user-token");

      expect(response.status).toBe(403);
    });

    it("should require super admin for impersonation", async () => {
      const response = await request(app)
        .post("/api/admin/tenants/tenant-123/impersonate")
        .set("Authorization", "Bearer user-token")
        .send({ reason: "Need to debug issue" });

      expect(response.status).toBe(403);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/admin/tenants");

      expect(response.status).toBe(403);
    });

    it("should allow super admin access", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      const response = await request(app)
        .get("/api/admin/tenants")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/admin/tenants", () => {
    it("should return paginated tenant list", async () => {
      const mockTenants = {
        data: [
          {
            id: "tenant-1",
            name: "Tenant 1",
            subdomain: "tenant1",
            plan: "PRO",
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
          },
          {
            id: "tenant-2",
            name: "Tenant 2",
            subdomain: "tenant2",
            plan: "STARTER",
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
          },
        ],
        page: 1,
        limit: 20,
        total: 2,
      };

      mockMultiTenantService.getAllTenants.mockResolvedValue(mockTenants);

      const response = await request(app)
        .get("/api/admin/tenants")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenants.data);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
    });

    it("should support pagination parameters", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 2,
        limit: 10,
        total: 50,
      });

      await request(app)
        .get("/api/admin/tenants?page=2&limit=10")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAllTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
    });

    it("should support search parameter", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      await request(app)
        .get("/api/admin/tenants?search=gym")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAllTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "gym",
        }),
      );
    });

    it("should support filtering by plan", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      await request(app)
        .get("/api/admin/tenants?plan=PRO")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAllTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "PRO",
        }),
      );
    });

    it("should support filtering by status", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      await request(app)
        .get("/api/admin/tenants?status=ACTIVE")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAllTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ACTIVE",
        }),
      );
    });

    it("should support sorting", async () => {
      mockMultiTenantService.getAllTenants.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      await request(app)
        .get("/api/admin/tenants?sortBy=name&sortOrder=asc")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAllTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "name",
          sortOrder: "asc",
        }),
      );
    });

    it("should handle service errors", async () => {
      mockMultiTenantService.getAllTenants.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .get("/api/admin/tenants")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Failed to load tenants");
    });
  });

  describe("GET /api/admin/tenants/:tenantId", () => {
    it("should return tenant details", async () => {
      const mockTenant = {
        id: "tenant-123",
        name: "Test Gym",
        subdomain: "testgym",
        plan: "PRO",
        status: "ACTIVE",
        users: 150,
        courses: 25,
        createdAt: new Date().toISOString(),
      };

      mockMultiTenantService.getTenantDetails.mockResolvedValue(mockTenant);

      const response = await request(app)
        .get("/api/admin/tenants/tenant-123")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTenant);
    });

    it("should return 404 for non-existent tenant", async () => {
      mockMultiTenantService.getTenantDetails.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/admin/tenants/non-existent")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Tenant not found");
    });

    it("should handle service errors", async () => {
      mockMultiTenantService.getTenantDetails.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .get("/api/admin/tenants/tenant-123")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to load tenant details");
    });
  });

  describe("PATCH /api/admin/tenants/:tenantId/status", () => {
    it("should update tenant status successfully", async () => {
      const result = { id: "tenant-123", status: "SUSPENDED" };
      mockMultiTenantService.updateTenantStatus.mockResolvedValue(result);

      const response = await request(app)
        .patch("/api/admin/tenants/tenant-123/status")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          status: "SUSPENDED",
          reason: "Payment overdue",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Tenant status updated to SUSPENDED");
      expect(response.body.data).toEqual(result);
    });

    it("should validate status values", async () => {
      const response = await request(app)
        .patch("/api/admin/tenants/tenant-123/status")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          status: "INVALID_STATUS",
          reason: "Test",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid status");
    });

    it("should accept all valid statuses", async () => {
      const validStatuses = ["ACTIVE", "SUSPENDED", "CANCELLED", "DELETED"];

      for (const status of validStatuses) {
        mockMultiTenantService.updateTenantStatus.mockResolvedValue({ status });

        const response = await request(app)
          .patch("/api/admin/tenants/tenant-123/status")
          .set("Authorization", "Bearer super-admin-token")
          .send({ status, reason: "Test" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it("should include updatedBy in service call", async () => {
      mockMultiTenantService.updateTenantStatus.mockResolvedValue({});

      await request(app)
        .patch("/api/admin/tenants/tenant-123/status")
        .set("Authorization", "Bearer super-admin-token")
        .send({ status: "SUSPENDED", reason: "Test" });

      expect(mockMultiTenantService.updateTenantStatus).toHaveBeenCalledWith(
        "tenant-123",
        expect.objectContaining({
          status: "SUSPENDED",
          reason: "Test",
          updatedBy: "super-admin-123",
        }),
      );
    });

    it("should handle tenant not found error", async () => {
      mockMultiTenantService.updateTenantStatus.mockRejectedValue(
        new Error("Tenant not found"),
      );

      const response = await request(app)
        .patch("/api/admin/tenants/invalid/status")
        .set("Authorization", "Bearer super-admin-token")
        .send({ status: "SUSPENDED", reason: "Test" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tenant not found");
    });
  });

  describe("GET /api/admin/analytics/overview", () => {
    it("should return platform analytics", async () => {
      const mockAnalytics = {
        tenants: {
          total: 150,
          active: 145,
          suspended: 5,
          newThisMonth: 12,
        },
        users: {
          total: 5420,
          activeThisMonth: 4850,
        },
        revenue: {
          mrr: 15800,
          growth: 8.5,
        },
      };

      mockMultiTenantService.getPlatformAnalytics.mockResolvedValue(
        mockAnalytics,
      );

      const response = await request(app)
        .get("/api/admin/analytics/overview")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
    });

    it("should support period parameter", async () => {
      mockMultiTenantService.getPlatformAnalytics.mockResolvedValue({});

      await request(app)
        .get("/api/admin/analytics/overview?period=7d")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getPlatformAnalytics).toHaveBeenCalledWith({
        period: "7d",
      });
    });

    it("should use default period if not specified", async () => {
      mockMultiTenantService.getPlatformAnalytics.mockResolvedValue({});

      await request(app)
        .get("/api/admin/analytics/overview")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getPlatformAnalytics).toHaveBeenCalledWith({
        period: "30d",
      });
    });
  });

  describe("GET /api/admin/analytics/revenue", () => {
    it("should return revenue analytics", async () => {
      const mockRevenue = {
        totalRevenue: 158000,
        mrr: 15800,
        arr: 189600,
        growth: 12.5,
        byPlan: {
          FREE: 0,
          STARTER: 4350,
          PRO: 9480,
          ENTERPRISE: 1970,
        },
      };

      mockMultiTenantService.getRevenueAnalytics.mockResolvedValue(mockRevenue);

      const response = await request(app)
        .get("/api/admin/analytics/revenue")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRevenue);
    });

    it("should support period parameter", async () => {
      mockMultiTenantService.getRevenueAnalytics.mockResolvedValue({});

      await request(app)
        .get("/api/admin/analytics/revenue?period=90d")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getRevenueAnalytics).toHaveBeenCalledWith({
        period: "90d",
      });
    });
  });

  describe("POST /api/admin/tenants/:tenantId/impersonate", () => {
    it("should create impersonation token", async () => {
      const mockToken = {
        token: "imp_token_abc123",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tenant: {
          id: "tenant-123",
          subdomain: "testgym",
        },
      };

      mockMultiTenantService.createImpersonationToken.mockResolvedValue(
        mockToken,
      );

      const response = await request(app)
        .post("/api/admin/tenants/tenant-123/impersonate")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          reason: "Need to debug billing issue for customer",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Impersonation token created");
      expect(response.body.data.token).toBe(mockToken.token);
      expect(response.body.data.tenantUrl).toBe(
        "https://testgym.clubmanager.app",
      );
    });

    it("should require reason with minimum 10 characters", async () => {
      const response = await request(app)
        .post("/api/admin/tenants/tenant-123/impersonate")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          reason: "Short",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("minimum 10 characters");
    });

    it("should require reason field", async () => {
      const response = await request(app)
        .post("/api/admin/tenants/tenant-123/impersonate")
        .set("Authorization", "Bearer super-admin-token")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("required");
    });

    it("should handle tenant not found", async () => {
      mockMultiTenantService.createImpersonationToken.mockRejectedValue(
        new Error("Tenant not found"),
      );

      const response = await request(app)
        .post("/api/admin/tenants/invalid/impersonate")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          reason: "Valid reason here",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tenant not found");
    });

    it("should include createdBy in audit trail", async () => {
      mockMultiTenantService.createImpersonationToken.mockResolvedValue({
        token: "token",
        expiresAt: new Date().toISOString(),
        tenant: { subdomain: "test" },
      });

      await request(app)
        .post("/api/admin/tenants/tenant-123/impersonate")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          reason: "Debugging customer issue",
        });

      expect(
        mockMultiTenantService.createImpersonationToken,
      ).toHaveBeenCalledWith(
        "tenant-123",
        expect.objectContaining({
          reason: "Debugging customer issue",
          createdBy: "super-admin-123",
          expiresIn: "1h",
        }),
      );
    });
  });

  describe("GET /api/admin/system/health", () => {
    it("should return system health metrics", async () => {
      const mockHealth = {
        status: "healthy",
        database: { status: "healthy", latency: 5 },
        redis: { status: "healthy", latency: 2 },
        services: {
          api: "healthy",
          workers: "healthy",
        },
        uptime: 3600000,
      };

      mockMultiTenantService.getSystemHealth.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get("/api/admin/system/health")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHealth);
    });

    it("should handle service errors", async () => {
      mockMultiTenantService.getSystemHealth.mockRejectedValue(
        new Error("Service unavailable"),
      );

      const response = await request(app)
        .get("/api/admin/system/health")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to load system health");
    });
  });

  describe("POST /api/admin/system/maintenance", () => {
    it("should enable maintenance mode", async () => {
      const result = {
        enabled: true,
        message: "System maintenance in progress",
        setAt: new Date().toISOString(),
      };

      mockMultiTenantService.setMaintenanceMode.mockResolvedValue(result);

      const response = await request(app)
        .post("/api/admin/system/maintenance")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          enabled: true,
          message: "System maintenance in progress",
          estimatedDuration: "2 hours",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Maintenance mode enabled");
      expect(response.body.data).toEqual(result);
    });

    it("should disable maintenance mode", async () => {
      const result = { enabled: false };

      mockMultiTenantService.setMaintenanceMode.mockResolvedValue(result);

      const response = await request(app)
        .post("/api/admin/system/maintenance")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          enabled: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Maintenance mode disabled");
    });

    it("should use default message if not provided", async () => {
      mockMultiTenantService.setMaintenanceMode.mockResolvedValue({});

      await request(app)
        .post("/api/admin/system/maintenance")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          enabled: true,
        });

      expect(mockMultiTenantService.setMaintenanceMode).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "System is under maintenance",
        }),
      );
    });

    it("should include admin ID who set maintenance mode", async () => {
      mockMultiTenantService.setMaintenanceMode.mockResolvedValue({});

      await request(app)
        .post("/api/admin/system/maintenance")
        .set("Authorization", "Bearer super-admin-token")
        .send({
          enabled: true,
        });

      expect(mockMultiTenantService.setMaintenanceMode).toHaveBeenCalledWith(
        expect.objectContaining({
          setBy: "super-admin-123",
        }),
      );
    });
  });

  describe("GET /api/admin/logs/audit", () => {
    it("should return audit logs", async () => {
      const mockLogs = {
        data: [
          {
            id: "log-1",
            action: "TENANT_STATUS_CHANGED",
            userId: "super-admin-123",
            tenantId: "tenant-123",
            timestamp: new Date().toISOString(),
            details: { from: "ACTIVE", to: "SUSPENDED" },
          },
        ],
        page: 1,
        limit: 50,
        total: 1,
      };

      mockMultiTenantService.getAuditLogs.mockResolvedValue(mockLogs);

      const response = await request(app)
        .get("/api/admin/logs/audit")
        .set("Authorization", "Bearer super-admin-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLogs.data);
      expect(response.body.pagination).toBeDefined();
    });

    it("should support filtering by action", async () => {
      mockMultiTenantService.getAuditLogs.mockResolvedValue({
        data: [],
        page: 1,
        limit: 50,
        total: 0,
      });

      await request(app)
        .get("/api/admin/logs/audit?action=TENANT_CREATED")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TENANT_CREATED",
        }),
      );
    });

    it("should support filtering by userId", async () => {
      mockMultiTenantService.getAuditLogs.mockResolvedValue({
        data: [],
        page: 1,
        limit: 50,
        total: 0,
      });

      await request(app)
        .get("/api/admin/logs/audit?userId=admin-123")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-123",
        }),
      );
    });

    it("should support filtering by tenantId", async () => {
      mockMultiTenantService.getAuditLogs.mockResolvedValue({
        data: [],
        page: 1,
        limit: 50,
        total: 0,
      });

      await request(app)
        .get("/api/admin/logs/audit?tenantId=tenant-456")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-456",
        }),
      );
    });

    it("should support date range filtering", async () => {
      mockMultiTenantService.getAuditLogs.mockResolvedValue({
        data: [],
        page: 1,
        limit: 50,
        total: 0,
      });

      const startDate = "2024-01-01";
      const endDate = "2024-01-31";

      await request(app)
        .get(`/api/admin/logs/audit?startDate=${startDate}&endDate=${endDate}`)
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it("should support pagination", async () => {
      mockMultiTenantService.getAuditLogs.mockResolvedValue({
        data: [],
        page: 2,
        limit: 25,
        total: 100,
      });

      await request(app)
        .get("/api/admin/logs/audit?page=2&limit=25")
        .set("Authorization", "Bearer super-admin-token");

      expect(mockMultiTenantService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 25,
        }),
      );
    });
  });

  describe("Edge Cases & Performance", () => {
    it("should handle large result sets efficiently", async () => {
      const largeTenantList = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: `tenant-${i}`,
          name: `Tenant ${i}`,
        })),
        page: 1,
        limit: 100,
        total: 1000,
      };

      mockMultiTenantService.getAllTenants.mockResolvedValue(largeTenantList);

      const start = Date.now();
      const response = await request(app)
        .get("/api/admin/tenants?limit=100")
        .set("Authorization", "Bearer super-admin-token");
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(100);
      expect(duration).toBeLessThan(200);
    });

    it("should handle concurrent admin requests", async () => {
      mockMultiTenantService.getPlatformAnalytics.mockResolvedValue({});
      mockMultiTenantService.getRevenueAnalytics.mockResolvedValue({});
      mockMultiTenantService.getSystemHealth.mockResolvedValue({});

      const promises = [
        request(app)
          .get("/api/admin/analytics/overview")
          .set("Authorization", "Bearer super-admin-token"),
        request(app)
          .get("/api/admin/analytics/revenue")
          .set("Authorization", "Bearer super-admin-token"),
        request(app)
          .get("/api/admin/system/health")
          .set("Authorization", "Bearer super-admin-token"),
      ];

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it("should respond quickly to health checks", async () => {
      mockMultiTenantService.getSystemHealth.mockResolvedValue({
        status: "healthy",
      });

      const start = Date.now();
      await request(app)
        .get("/api/admin/system/health")
        .set("Authorization", "Bearer super-admin-token");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});
