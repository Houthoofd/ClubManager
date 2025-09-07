import { apiUrl } from '../pages/apiUrl';

// Vérifie si un article existe déjà dans une catégorie (retourne true/false)
export function useCheckArticleByNomAndCategorie() {
  return async (nom: string, categorieId: string | null): Promise<boolean> => {
    if (!nom || !categorieId) return false;
    const params = new URLSearchParams({ nom, categorie_id: categorieId });
    const res = await fetch(apiUrl(`verification/magasin/article/categorie?${params.toString()}`));
    if (!res.ok) throw new Error('Erreur API');
    const data = await res.json();
    return !!data.exists;
  };
}

// Vérifie si un article existe déjà par nom (retourne true/false)
export function useCheckArticleByNom() {
  return async (nom: string): Promise<boolean> => {
    if (!nom) return false;
    const params = new URLSearchParams({ nom });
    const res = await fetch(apiUrl(`verification/magasin/article?${params.toString()}`));
    if (!res.ok) throw new Error('Erreur API');
    const data = await res.json();
    return !!data.exists;
  };
}
