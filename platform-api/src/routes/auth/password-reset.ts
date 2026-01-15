import express from 'express';
import { EmailClient } from '../../clients/emailClient.js';
import { Auth } from '../../db/clients/auth/auth.js';

const router = express.Router();

// Route pour demander la récupération de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 [PasswordReset] Demande de récupération pour:', email);

    // Validation de l'email avec la méthode statique
    if (!email || !Auth.validerEmail(email)) {
      return res.status(400).json({
        error: 'Email invalide ou manquant'
      });
    }

    const auth = new Auth();

    // MODIFIÉ: Vérifier les tentatives récentes sans IP (conformité RGPD)
    const recentAttempts = await auth.verifierTentativesRecuperationRecentes(email, 15);
    if (recentAttempts >= 3) {
      console.warn('⚠️ [PasswordReset] Trop de tentatives récentes pour:', email);
      await auth.enregistrerTentativeRecuperation(email, false); // Sans IP
      
      return res.status(429).json({
        error: 'Trop de tentatives récentes. Veuillez attendre 15 minutes.',
        retryAfter: 15 * 60 // en secondes
      });
    }

    // Utiliser la méthode dédiée pour rechercher l'utilisateur
    const user = await auth.rechercherUtilisateurParEmail(email);

    if (!user) {
      console.log('⚠️ [PasswordReset] Email non trouvé, mais réponse positive pour sécurité');
      await auth.enregistrerTentativeRecuperation(email, false); // Sans IP
      
      return res.status(200).json({
        message: 'Si cet email existe, un lien de récupération a été envoyé'
      });
    }

    // MODIFIÉ: Récupérer les informations de sécurité pour l'email (sans IP)
    let securityInfo = null;
    try {
      securityInfo = await auth.obtenirInformationsSecurite(user.id);
    } catch (securityError) {
      console.warn('⚠️ [PasswordReset] Erreur récupération infos sécurité:', securityError);
      // Continuer sans les infos de sécurité
    }

    // Générer un token sécurisé avec la méthode statique
    const resetToken = Auth.genererTokenSecurise(32);
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    // Créer le token de récupération avec la méthode dédiée
    const tokenResult = await auth.creerTokenRecuperation(user.id, resetToken, expiresAt);

    if (!tokenResult.isConfirm) {
      console.error('❌ [PasswordReset] Erreur création token:', tokenResult.message);
      await auth.enregistrerTentativeRecuperation(email, false);
      return res.status(500).json({
        error: 'Erreur lors de la création du token de récupération'
      });
    }

    // Envoyer l'email de récupération avec informations de sécurité (sans IP)
    try {
      const emailClient = new EmailClient();
      // CORRIGÉ: URL avec le bon chemin /pages/reset-password
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/reset-password?token=${resetToken}`;
      
      console.log('🔗 [PasswordReset] URL de réinitialisation générée:', resetUrl);
      
      // CORRIGÉ: Préparer les informations avec les vrais noms de colonnes
      const emailVariables: any = {
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur',
        resetUrl: resetUrl,
        expiresIn: '1 heure'
      };

      // Ajouter les infos de sécurité si disponibles
      if (securityInfo) {
        emailVariables.securityInfo = {
          requestTime: new Date().toLocaleString('fr-FR'),
          lastLogin: securityInfo.last_login_at ? 
            new Date(securityInfo.last_login_at).toLocaleDateString('fr-FR') : 'Inconnue',
          accountCreated: securityInfo.date_inscription ? 
            new Date(securityInfo.date_inscription).getFullYear().toString() : 'Inconnu'
        };
      }

      await emailClient.sendPasswordResetEmail(user.email, emailVariables);

      console.log('✅ [PasswordReset] Email de récupération envoyé à:', email);
      await auth.enregistrerTentativeRecuperation(email, true);
      
    } catch (emailError) {
      console.error('❌ [PasswordReset] Erreur envoi email:', emailError);
      
      // Nettoyer le token créé si l'email a échoué - CORRIGÉ: utilisateur_id
      await auth.queryAsync(
        `DELETE FROM password_reset_tokens WHERE token = ?`,
        [resetToken]
      );
      
      await auth.enregistrerTentativeRecuperation(email, false);
      return res.status(500).json({
        error: 'Erreur lors de l\'envoi de l\'email de récupération'
      });
    }

    res.status(200).json({
      message: 'Si cet email existe, un lien de récupération a été envoyé'
    });

  } catch (error: any) {
    console.error('❌ [PasswordReset] Erreur demande récupération:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour vérifier la validité d'un token
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Token manquant'
      });
    }

    const auth = new Auth();

    // Utiliser la méthode dédiée pour vérifier le token
    const tokenData = await auth.verifierTokenRecuperation(token);

    if (!tokenData) {
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    res.status(200).json({
      valid: true,
      email: tokenData.email,
      userName: `${tokenData.first_name || ''} ${tokenData.last_name || ''}`.trim()
    });

  } catch (error: any) {
    console.error('❌ [PasswordReset] Erreur vérification token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔐 [PasswordReset] Tentative de réinitialisation avec token');

    // Validation des données
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token et nouveau mot de passe requis'
      });
    }

    // Validation du mot de passe avec la méthode statique
    const passwordValidation = Auth.validerMotDePasse(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Mot de passe invalide',
        details: passwordValidation.errors
      });
    }

    const auth = new Auth();

    // Hasher le nouveau mot de passe avec la méthode statique
    const hashedPassword = await Auth.hasherMotDePasse(newPassword);

    // Utiliser la méthode dédiée pour réinitialiser le mot de passe
    const resetResult = await auth.reinitialiserMotDePasseAvecToken(token, hashedPassword);

    if (!resetResult.isConfirm) {
      return res.status(400).json({
        error: resetResult.message
      });
    }

    console.log('✅ [PasswordReset] Mot de passe réinitialisé avec succès');

    // Optionnel: Envoyer un email de confirmation de changement de mot de passe
    try {
      const tokenData = await auth.verifierTokenRecuperation(token);
      if (tokenData) {
        const emailClient = new EmailClient();
        await emailClient.sendPasswordChangeConfirmation(
          tokenData.email,
          {
            userName: `${tokenData.first_name || ''} ${tokenData.last_name || ''}`.trim() || 'Utilisateur',
            changeDate: new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        );
        console.log('✅ [PasswordReset] Email de confirmation de changement envoyé');
      }
    } catch (emailError) {
      console.warn('⚠️ [PasswordReset] Erreur envoi email confirmation (non bloquant):', emailError);
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
    }

    res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error: any) {
    console.error('❌ [PasswordReset] Erreur réinitialisation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route utilitaire pour nettoyer les tokens expirés (optionnelle, pour maintenance)
router.post('/cleanup-expired-tokens', async (req, res) => {
  try {
    const auth = new Auth();
    const cleanupResult = await auth.nettoyerTokensExpires();
    
    console.log('🧹 [PasswordReset] Nettoyage tokens:', cleanupResult.message);
    
    res.status(200).json({
      message: cleanupResult.message
    });

  } catch (error: any) {
    console.error('❌ [PasswordReset] Erreur nettoyage tokens:', error);
    res.status(500).json({
      error: 'Erreur lors du nettoyage des tokens'
    });
  }
});

// MODIFIÉ: Route pour demander une récupération manuelle par un admin (sans IP)
router.post('/request-manual-recovery', async (req, res) => {
  try {
    const { email, raison, informationsPersonnelles } = req.body;

    console.log('👤 [AlternativeRecovery] Demande récupération manuelle:', email);

    if (!email || !raison || !informationsPersonnelles) {
      return res.status(400).json({
        error: 'Email, raison et informations personnelles requis'
      });
    }

    const auth = new Auth();
    const user = await auth.rechercherUtilisateurParEmail(email);
    
    if (!user) {
      return res.status(200).json({
        message: 'Demande enregistrée. Si ce compte existe, elle sera traitée par nos équipes.'
      });
    }

    // CORRIGÉ: Créer la demande sans données IP/User-Agent et avec les vrais noms de colonnes
    const demandeData = {
      informationsPersonnelles,
      timestamp: new Date().toISOString()
    };

    await auth.creerDemandeRecuperationManuelle(user.id, raison, demandeData);

    // Notifier les administrateurs
    try {
      const emailClient = new EmailClient();
      await emailClient.sendTemplatedEmailFromFile({
        to: process.env.ADMIN_EMAIL || 'admin@clubmanager.com',
        templateName: 'admin-manual-recovery-request',
        variables: {
          userName: `${user.first_name} ${user.last_name}`.trim(),
          userEmail: user.email,
          reason: raison,
          requestTime: new Date().toLocaleString('fr-FR')
        }
      });
    } catch (emailError) {
      console.warn('⚠️ [AlternativeRecovery] Erreur notification admin:', emailError);
    }

    res.status(200).json({
      message: 'Demande de récupération manuelle enregistrée. Nos équipes vous contacteront sous 48h.'
    });

  } catch (error: any) {
    console.error('❌ [AlternativeRecovery] Erreur récupération manuelle:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

export default router;
