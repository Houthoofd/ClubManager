import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { tenantResolver, validateUserTenant } from "../middleware/tenant.js";
import { AuthenticatedUser } from "../types/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation middleware helper
 */
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Generate JWT token for authenticated user
 */
const generateAuthToken = (user: AuthenticatedUser): string => {
  const payload = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    status: user.status,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn,
  } as jwt.SignOptions);
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user within tenant context
 * @access  Public (requires tenant resolution)
 */
router.post(
  "/login",
  tenantResolver, // Resolve tenant first
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const { tenantId } = req.tenant!;

      // Find user in tenant context
      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          tenantId,
          actif: true,
        },
        include: {
          status: true,
          grade: true,
          tenant: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check tenant status
      if (user.tenant.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Tenant access suspended",
          tenantStatus: user.tenant.status,
        });
      }

      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.status?.nomRole,
        grade: user.grade?.nom,
        actif: user.actif,
      };

      // Generate token
      const token = generateAuthToken(authenticatedUser);

      // Update last login (optional)
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: authenticatedUser,
          token,
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
          },
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user in tenant context
 * @access  Public (requires tenant resolution + user limits check)
 */
router.post(
  "/register",
  tenantResolver,
  [
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name required (1-50 chars)"),
    body("lastName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name required (1-50 chars)"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("dateOfBirth").isISO8601().withMessage("Valid date of birth required"),
    body("genderId")
      .optional()
      .isInt()
      .withMessage("Gender ID must be integer"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password, dateOfBirth, genderId } =
        req.body;
      const { tenantId, tenant } = req.tenant!;

      // Check if user already exists in tenant
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          tenantId,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      // Check tenant user limits
      const userCount = await prisma.user.count({
        where: { tenantId, actif: true },
      });

      if (userCount >= tenant.maxUsers) {
        return res.status(403).json({
          success: false,
          message: "User limit reached for this tenant",
          current: userCount,
          limit: tenant.maxUsers,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          tenantId,
          firstName,
          lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          dateOfBirth: new Date(dateOfBirth),
          genderId: genderId || null,
        },
        include: {
          status: true,
          grade: true,
        },
      });

      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        id: newUser.id,
        tenantId: newUser.tenantId,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        status: newUser.status?.nomRole,
        grade: newUser.grade?.nom,
        actif: newUser.actif,
      };

      // Generate token
      const token = generateAuthToken(authenticatedUser);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: authenticatedUser,
          token,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
  "/me",
  tenantResolver,
  validateUserTenant,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      // Get fresh user data
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          status: true,
          grade: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: userData.id,
            tenantId: userData.tenantId,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            status: userData.status?.nomRole,
            grade: userData.grade?.nom,
            actif: userData.actif,
          },
          tenant: userData.tenant,
        },
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post(
  "/logout",
  tenantResolver,
  validateUserTenant,
  (req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    // Could implement token blacklisting here if needed
    res.json({
      success: true,
      message: "Logout successful",
    });
  },
);

export default router;
