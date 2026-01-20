import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface JWTPayload {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  status_id?: string | number;
  role?: string;
  status?: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  status_id?: string | number;
  role?: string;
  status?: string;
}): string => {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const expiresIn = process.env.JWT_EXPIRES_IN;

  let options: jwt.SignOptions | undefined = undefined;
  if (expiresIn) {
    if (!isNaN(Number(expiresIn))) {
      options = { expiresIn: Number(expiresIn) };
    } else {
      options = {
        expiresIn: expiresIn as unknown as jwt.SignOptions["expiresIn"],
      };
    }
    return jwt.sign(payload, secret, options);
  } else {
    return jwt.sign(payload, secret);
  }
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token d'accès requis",
      });
      return;
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Mapper les données JWT vers le format attendu par Express
    req.user = {
      id: decoded.id,
      email: decoded.email,
      first_name: decoded.first_name || "",
      last_name: decoded.last_name || "",
      role: decoded.role || decoded.status_id?.toString(),
      status: decoded.status || decoded.status_id?.toString(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expiré",
      });
      return;
    }

    res.status(403).json({
      success: false,
      message: "Token invalide",
    });
    return;
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies?.token;

    if (token) {
      const secret = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, secret) as JWTPayload;

      // Même mapping pour l'auth optionnelle
      req.user = {
        id: decoded.id,
        email: decoded.email,
        first_name: decoded.first_name || "",
        last_name: decoded.last_name || "",
        role: decoded.role || decoded.status_id?.toString(),
        status: decoded.status || decoded.status_id?.toString(),
      };
    }
    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
      return;
    }

    if (!roles.includes(req.user.role as unknown as string)) {
      res.status(403).json({
        success: false,
        message: "Permissions insuffisantes",
      });
      return;
    }

    next();
  };
};

// Étendre les types Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        role?: string;
        status?: string;
        tenantId?: string;
      };
    }
  }
}
