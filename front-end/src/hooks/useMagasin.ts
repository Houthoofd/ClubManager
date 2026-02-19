/**
 * Barrel export for shop hooks (useMagasin)
 * Maintains backward compatibility with existing imports
 *
 * @deprecated Import directly from '@/hooks/shop/useMagasin' instead
 */

export {
  useArticlesParCategorie,
  useCategoriesMagasin,
  useTaillesMagasin,
  useAjouterArticleMagasin,
  useModifierArticleMagasin,
  useSupprimerArticleMagasin,
  useCreerCommande,
} from './shop/useMagasin';
