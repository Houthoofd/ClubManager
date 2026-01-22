import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedUser } from "@clubmanager/types";

const prisma = new PrismaClient();

/**
 * Middleware d'authentification tenant-aware
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded.id || !decoded.tenantId) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Récupérer l'utilisateur avec validation tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
        actif: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Vérifier que le tenant est actif
    if (user.tenant.status !== "ACTIVE") {
      return res.status(403).json({ error: "Tenant access suspended" });
    }

    // Attacher les informations utilisateur à la requête
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }

    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Middleware pour vérifier les rôles (optionnel)
 */
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          status: true,
        },
      });

      if (!user || !user.status) {
        return res.status(403).json({ error: "User role not found" });
      }

      if (!roles.includes(user.status.nomRole)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: roles,
          current: user.status.nomRole,
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à une ressource spécifique
 */
export const authorizeResource = (checkOwnership: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenant) {
      return res
        .status(401)
        .json({ error: "Authentication and tenant context required" });
    }

    // Vérifier que l'utilisateur appartient au bon tenant
    if (req.user.tenantId !== req.tenant.tenantId) {
      return res
        .status(403)
        .json({ error: "Access denied to this tenant resource" });
    }

    // Si checkOwnership est true, des vérifications supplémentaires peuvent être ajoutées
    // basées sur les paramètres de la route (par exemple, userId dans l'URL)
    if (checkOwnership && req.params.userId) {
      const resourceUserId = parseInt(req.params.userId);
      if (resourceUserId !== req.user.id) {
        // Vérifier si l'utilisateur a les permissions admin pour accéder aux ressources d'autres utilisateurs
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { status: true },
        });

        if (
          !user?.status ||
          !["admin", "manager"].includes(user.status.nomRole.toLowerCase())
        ) {
          return res
            .status(403)
            .json({ error: "Access denied to this resource" });
        }
      }
    }

    next();
  };
};

/**
 * Helper pour créer un token d'authentification
 */
export const createAuthToken = (user: AuthenticatedUser): string => {
  const payload = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn,
  } as jwt.SignOptions);
};

export default {
  authenticateToken,
  requireRole,
  authorizeResource,
  createAuthToken,
};
