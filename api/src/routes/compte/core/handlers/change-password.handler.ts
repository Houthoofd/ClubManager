import { Request, Response } from 'express';
import { Compte } from '../../../../db/clients/compte/compte.js';
import bcrypt from 'bcrypt';

/**
 * Handler pour modifier le mot de passe (si le compte en a déjà un)
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      res.status(400).json({
        success: false,
        message: "L'id et le mot de passe sont requis."
      });
      return;
    }

    // Hash du mot de passe
    const hash = await bcrypt.hash(password, 10);

    const client = new Compte();
    const result = await client.mettreAJourMotDePasse(id, hash, false); // false = modification

    if (result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Mot de passe modifié avec succès."
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Échec de la modification du mot de passe."
      });
    }
  } catch (error) {
    console.error('❌ [Change Password] Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
