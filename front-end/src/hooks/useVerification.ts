/**
 * Barrel export for verification hooks (useVerification)
 * Maintains backward compatibility with existing imports
 *
 * @deprecated Import directly from '@/hooks/auth/useVerification' instead
 */

export {
  useCheckEmail,
  useCheckArticleByNomAndCategorie,
  useCheckArticleByNom,
  useCheckCoursPlanning,
} from './auth/useVerification';
