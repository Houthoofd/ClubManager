import { Request, Response } from 'express';

/**
 * Handler pour la déconnexion
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    console.log('🚪 Déconnexion demandée pour utilisateur:', req.user?.id);

    const cookieVariants = [
      { httpOnly: true, secure: true, sameSite: 'strict' as const, domain: 'clubmanagment.com', path: '/' },
      { httpOnly: true, secure: false, sameSite: 'lax' as const, domain: 'localhost', path: '/' },
      { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/' },
      { httpOnly: true, secure: false, path: '/' },
      { httpOnly: true, path: '/' },
      { path: '/' },
      { httpOnly: true, secure: false, sameSite: 'strict' as const, path: '/' },
      { httpOnly: true, secure: false, sameSite: 'none' as const, path: '/' },
      {}
    ];

    cookieVariants.forEach((variant, index) => {
      try {
        res.clearCookie('token', variant);
        console.log(`🗑️ [Logout] Suppression cookie 'token' variant ${index + 1}:`, variant);
      } catch (error: any) {
        console.log(`⚠️ [Logout] Échec variant ${index + 1}:`, error.message);
      }
    });

    const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const tokenCookieHeaders = [
      `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; domain=localhost`,
      `token=; expires=${expiredDate}; path=/`,
      `token=; max-age=0; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; max-age=0; path=/; HttpOnly`,
      `token=; max-age=0; path=/`,
      `token=deleted; expires=${expiredDate}; path=/; domain=localhost; HttpOnly`,
      `token=deleted; expires=${expiredDate}; path=/`,
      `token=; expires=${expiredDate}; path=/; domain=clubmanagment.com; HttpOnly; SameSite=Strict; Secure`,
      `token=; max-age=0; path=/; domain=clubmanagment.com; HttpOnly; SameSite=Strict; Secure`
    ];

    const allHeaders: string[] = [];
    tokenCookieHeaders.forEach((header, index) => {
      try {
        allHeaders.push(header);
        console.log(`🔨 [Logout] Header suppression token ${index + 1}: ${header}`);
      } catch (error) {
        console.log(`⚠️ [Logout] Échec header token ${index + 1}:`, error);
      }
    });

    if (allHeaders.length > 0) {
      res.setHeader('Set-Cookie', allHeaders);
      console.log(`🔨 [Logout] ${allHeaders.length} headers Set-Cookie définis pour suppression token`);
    }

    const authCookieNames = [
      'authToken', 'userData', 'user', 'auth_token',
      'access_token', 'refresh_token', 'sessionId', 'session', 'jwt', 'JWT'
    ];

    authCookieNames.forEach(cookieName => {
      cookieVariants.forEach(variant => {
        try {
          res.clearCookie(cookieName, variant);
        } catch (error: any) {
          // Ignorer les erreurs pour les cookies secondaires
        }
      });
      console.log(`🗑️ [Logout] Cookie "${cookieName}" supprimé avec toutes les variantes`);
    });

    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log('✅ [Logout] Déconnexion côté serveur terminée avec suppression exhaustive des cookies');

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie - Tous les cookies ont été supprimés',
      cookiesCleared: ['token', ...authCookieNames],
      headersSet: allHeaders.length
    });

  } catch (error) {
    console.error('❌ [Logout] Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
}
