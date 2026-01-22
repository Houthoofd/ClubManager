import express, { Request, Response } from "express";
import { userManagerService as userService } from "../../services/members/users/user-manager.service.js";
import { verifyToken } from "../../middleware/auth/auth.js";

const router = express.Router();

/**
 * GET /api/users
 * List all users (with pagination and filters)
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const users = await userService.listUsers("default");

    return res.json({
      success: true,
      data: users.users || [],
      pagination: {
        page,
        limit,
        total: users.total || 0,
      },
    });
  } catch (error) {
    console.error("❌ List users error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
});

/**
 * GET /api/users/:id
 * Get specific user by ID
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    const user = await userService.getUserById(id, "default");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, genderId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être remplis",
      });
    }

    const result = await userService.register({
      tenantId: "default",
      firstName,
      lastName,
      email,
      password,
      dateOfBirth: new Date(dateOfBirth),
      genderId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: result.user,
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { firstName, lastName, email, dateOfBirth, genderId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    const result = await userService.updateUser(id, "default", {
      firstName,
      lastName,
      email,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      // genderId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: "Utilisateur modifié avec succès",
      data: result.user,
    });
  } catch (error) {
    console.error("❌ Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'utilisateur",
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (soft delete)
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    const result = await userService.deleteUser(id, "default");

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
    });
  }
});

/**
 * GET /api/users/statistics
 * Get user statistics
 */
router.get("/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    // Basic stats
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      usersByGender: {},
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ User statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

export default router;