import express, { Request, Response } from "express";
import { courseService } from "../services/course/course.service.js";
import { auditService, AuditAction } from "../services/audit/audit.service.js";

const router = express.Router();

/**
 * Extract tenantId from request
 */
function getTenantId(req: Request): string {
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  const headerTenant = req.headers["x-tenant-id"] as string;
  if (headerTenant) {
    return headerTenant;
  }

  return process.env.DEFAULT_TENANT_ID || "default-tenant";
}

/**
 * GET /api/cours
 * List all courses with filters and pagination
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, limit, typeCours, startDate, endDate, actif } = req.query;

    const result = await courseService.listCourses({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      typeCours: typeCours as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      actif: actif !== undefined ? actif === "true" : undefined,
    });

    return res.json({
      success: true,
      data: result,
      message: "Cours récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ List courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cours",
    });
  }
});

/**
 * GET /api/cours/types
 * Get all distinct course types
 */
router.get("/types", async (req: Request, res: Response) => {
  try {
    const types = await courseService.getCourseTypes();

    return res.json({
      success: true,
      data: types,
      message: "Types de cours récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ Get course types error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des types de cours",
    });
  }
});

/**
 * GET /api/cours/:coursId
 * Get course by ID with stats and enrollments
 */
router.get("/:coursId", async (req: Request, res: Response) => {
  try {
    const coursId = parseInt(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const course = await courseService.getCourseById(coursId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé",
      });
    }

    // Get enrollments
    const enrollments = await courseService.getCourseEnrollments(coursId);

    // Get stats
    const stats = await courseService.getCourseStats(coursId);

    return res.json({
      success: true,
      data: {
        course,
        enrollments,
        stats,
      },
      message: "Cours récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ Get course error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du cours",
    });
  }
});

/**
 * POST /api/cours
 * Create a new course (admin only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);

    const {
      dateCours,
      typeCours,
      heureDebut,
      heureFin,
      capaciteMax,
      description,
    } = req.body;

    // Validate required fields
    if (!dateCours || !typeCours || !heureDebut || !heureFin) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être remplis",
      });
    }

    const result = await courseService.createCourse({
      dateCours: new Date(dateCours),
      typeCours,
      heureDebut: new Date(heureDebut),
      heureFin: new Date(heureFin),
      capaciteMax: capaciteMax ? parseInt(capaciteMax) : undefined,
      description,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.CREATE,
        resource: "cours",
        resourceId: result.course?.id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.status(201).json({
      success: true,
      data: result.course,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Create course error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du cours",
    });
  }
});

/**
 * PUT /api/cours/:coursId
 * Update a course (admin only)
 */
router.put("/:coursId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const coursId = parseInt(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const {
      dateCours,
      typeCours,
      heureDebut,
      heureFin,
      capaciteMax,
      description,
      actif,
    } = req.body;

    const result = await courseService.updateCourse(coursId, {
      dateCours: dateCours ? new Date(dateCours) : undefined,
      typeCours,
      heureDebut: heureDebut ? new Date(heureDebut) : undefined,
      heureFin: heureFin ? new Date(heureFin) : undefined,
      capaciteMax:
        capaciteMax !== undefined ? parseInt(capaciteMax) : undefined,
      description,
      actif:
        actif !== undefined ? actif === "true" || actif === true : undefined,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: "cours",
        resourceId: coursId.toString(),
        changes: {
          dateCours,
          typeCours,
          heureDebut,
          heureFin,
          capaciteMax,
          description,
          actif,
        },
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      data: result.course,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Update course error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du cours",
    });
  }
});

/**
 * DELETE /api/cours/:coursId
 * Delete (soft delete) a course (admin only)
 */
router.delete("/:coursId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const coursId = parseInt(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const result = await courseService.deleteCourse(coursId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.DELETE,
        resource: "cours",
        resourceId: coursId.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Delete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du cours",
    });
  }
});

/**
 * POST /api/cours/:coursId/enroll
 * Enroll current user in a course
 */
router.post("/:coursId/enroll", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const coursId = parseInt(req.params.coursId);

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const { notes } = req.body;

    const result = await courseService.enrollUser({
      userId: user.id,
      coursId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    await auditService.log({
      tenantId,
      userId: user.id,
      action: AuditAction.CREATE,
      resource: "inscription",
      resourceId: result.enrollment?.id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || undefined,
    });

    return res.status(201).json({
      success: true,
      data: result.enrollment,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Enroll user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription au cours",
    });
  }
});

/**
 * DELETE /api/cours/:coursId/enroll
 * Unenroll current user from a course
 */
router.delete("/:coursId/enroll", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const coursId = parseInt(req.params.coursId);

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const result = await courseService.unenrollUser(user.id, coursId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    await auditService.log({
      tenantId,
      userId: user.id,
      action: AuditAction.DELETE,
      resource: "inscription",
      resourceId: `${user.id}-${coursId}`,
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || undefined,
    });

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Unenroll user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désinscription du cours",
    });
  }
});

/**
 * GET /api/cours/:coursId/enrollments
 * Get all enrollments for a course (admin only)
 */
router.get("/:coursId/enrollments", async (req: Request, res: Response) => {
  try {
    const coursId = parseInt(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const enrollments = await courseService.getCourseEnrollments(coursId);

    return res.json({
      success: true,
      data: enrollments,
      message: "Inscriptions récupérées avec succès",
    });
  } catch (error) {
    console.error("❌ Get course enrollments error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des inscriptions",
    });
  }
});

/**
 * GET /api/cours/user/:userId/enrollments
 * Get all enrollments for a user
 */
router.get("/user/:userId/enrollments", async (req: Request, res: Response) => {
  try {
    const utilisateurId = parseInt(req.params.userId);
    const { upcoming, past } = req.query;

    if (isNaN(utilisateurId)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    const enrollments = await courseService.getUserEnrollments(utilisateurId, {});

    return res.json({
      success: true,
      data: enrollments,
      message: "Inscriptions récupérées avec succès",
    });
  } catch (error) {
    console.error("❌ Get user enrollments error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des inscriptions",
    });
  }
});

/**
 * PUT /api/cours/:coursId/attendance/:userId
 * Mark user attendance for a course (admin only)
 */
router.put(
  "/:coursId/attendance/:userId",
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = getTenantId(req);
      const coursId = parseInt(req.params.coursId);
      const utilisateurId = parseInt(req.params.userId);
      const { present } = req.body;

      if (isNaN(coursId) || isNaN(utilisateurId)) {
        return res.status(400).json({
          success: false,
          message: "ID invalide",
        });
      }

      if (typeof present !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Le champ 'present' doit être un booléen",
        });
      }

      const result = await courseService.markAttendance({
        userId: utilisateurId,
        courseId: 1,
        present: true
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      // Audit log
      if (user?.id) {
        await auditService.log({
          tenantId,
          userId: user.id,
          action: AuditAction.UPDATE,
          resource: "attendance",
          resourceId: `${utilisateurId}-${coursId}`,
          changes: { present },
          ipAddress: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || undefined,
        });
      }

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("❌ Mark attendance error:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la présence",
      });
    }
  },
);

/**
 * GET /api/cours/:coursId/stats
 * Get course statistics (admin only)
 */
router.get("/:coursId/stats", async (req: Request, res: Response) => {
  try {
    const coursId = parseInt(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({
        success: false,
        message: "ID de cours invalide",
      });
    }

    const stats = await courseService.getCourseStats(coursId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Statistiques non disponibles",
      });
    }

    return res.json({
      success: true,
      data: stats,
      message: "Statistiques récupérées avec succès",
    });
  } catch (error) {
    console.error("❌ Get course stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

export default router;
