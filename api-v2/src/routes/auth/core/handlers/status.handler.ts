import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Auth } from "../../../../db/clients/auth/auth.js";

/**
 * Handler pour vérifier le statut d'authentification
 */
export async function checkStatus(req: Request, res: Response): Promise<void> {
  try {
    console.log("🔍 [Auth] Vérification du statut d'authentification...");
    console.log("🔍 [Auth] Headers reçus:", {
      authorization: req.headers.authorization ? "Present" : "Missing",
      cookie: req.headers.cookie ? "Present" : "Missing",
      userAgent: req.headers["user-agent"],
    });

    // MÉTHODE 1: Vérifier le token Bearer
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("🔑 [Auth] Token Bearer détecté");
    }

    // MÉTHODE 2: Vérifier les cookies de session
    const sessionToken =
      req.cookies?.authToken || req.cookies?.sessionId || req.cookies?.token;
    if (!token && sessionToken) {
      token = sessionToken;
      console.log("🍪 [Auth] Token de session détecté");
    }

    if (!token) {
      console.log("❌ [Auth] Aucun token trouvé");
      res.status(401).json({
        authentifie: false,
        error: "Token d'authentification manquant",
      });
      return;
    }

    // Vérifier et décoder le token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "votre-secret-jwt");
      console.log("✅ [Auth] Token valide, utilisateur:", decoded.id);
    } catch (tokenError: any) {
      console.log("❌ [Auth] Token invalide:", tokenError.message);
      res.status(401).json({
        authentifie: false,
        error: "Token invalide ou expiré",
      });
      return;
    }

    // Récupérer les informations utilisateur depuis la base de données
    try {
      const authClient = new Auth();
      const userQuery = `
        SELECT
          u.id,
          u.userId,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.status_id,
          g.genre_name AS genres,
          s.nom_role AS status,
          gr.grade_id AS grades,
          a.nom_plan AS abonnement,
          u.date_of_birth
        FROM utilisateurs u
        LEFT JOIN genres g ON u.genre_id = g.id
        LEFT JOIN status s ON u.status_id = s.id
        LEFT JOIN grades gr ON u.grade_id = gr.id
        LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
        WHERE u.id = ?
      `;

      const userResults = await authClient.queryAsync(userQuery, [decoded.id]);

      if (userResults.length === 0) {
        console.log("❌ [Auth] Utilisateur non trouvé:", decoded.id);
        res.status(401).json({
          authentifie: false,
          error: "Utilisateur non trouvé",
        });
        return;
      }

      const utilisateur = userResults[0];

      console.log("✅ [Auth] Utilisateur authentifié:", {
        id: utilisateur.id,
        email: utilisateur.email,
        status: utilisateur.status,
      });

      // Retourner les données dans le format attendu par AuthGuard
      res.status(200).json({
        authentifie: true,
        user: {
          id: utilisateur.id,
          email: utilisateur.email,
          first_name: utilisateur.first_name,
          last_name: utilisateur.last_name,
          nom_utilisateur: utilisateur.nom_utilisateur,
          status: utilisateur.status,
          genres: utilisateur.genres,
          grades: utilisateur.grades,
          abonnement: utilisateur.abonnement,
          date_of_birth: utilisateur.date_of_birth,
        },
        token: token,
        timestamp: new Date().toISOString(),
      });
    } catch (dbError: any) {
      console.error("❌ [Auth] Erreur base de données:", dbError);
      res.status(500).json({
        authentifie: false,
        error: "Erreur lors de la vérification de l'utilisateur",
      });
    }
  } catch (error: any) {
    console.error("❌ [Auth] Erreur vérification statut:", error);
    res.status(500).json({
      authentifie: false,
      error: "Erreur interne du serveur",
    });
  }
}
