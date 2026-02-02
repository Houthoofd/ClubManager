import { Request, Response } from 'express';

/**
 * Handler pour le test public
 */
export async function testPublic(req: Request, res: Response): Promise<void> {
  res.json({ ok: true });
}
