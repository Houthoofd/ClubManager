import { Request, Response } from 'express';

/**
 * Handler pour vérifier le token d'authentification
 */
export async function verifyAuth(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: { user: req.user }
  });
}
