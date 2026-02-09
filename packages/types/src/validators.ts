/**
 * Export centralisé des validators (Schémas Zod)
 * Utilisez: import { loginSchema, validerLogin, ... } from '@clubmanager/types/validators'
 */

// ============================================================================
// VALIDATORS AUTH
// ============================================================================
export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyTokenSchema,
  confirmEmailSchema,
  validerLogin,
  validerForgotPassword,
  validerResetPassword,
  validerVerifyToken,
  validerConfirmEmail,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyTokenInput,
  type ConfirmEmailInput,
} from "./validators/auth.validators.js";

// ============================================================================
// VALIDATORS UTILISATEURS
// ============================================================================
export {
  verifierUtilisateurSchema,
  inscriptionUtilisateurSchema,
  connexionUserIdSchema,
  connexionEmailSchema,
  utilisateurSchema,
  type VerifierUtilisateur,
  type InscriptionUtilisateur,
  type ConnexionUserId,
  type ConnexionEmail,
} from "./validators/utilisateurs.validators.js";
