import { Request, Response } from "express";
import { generateToken } from "../../../../middleware/auth.js";

/**
 * Handler pour rafraîchir le token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const newToken = generateToken({
    id: req.user!.id,
    email: req.user!.email,
    status_id: req.user!.role,
  });

  res.cookie("token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { token: newToken },
  });
}
