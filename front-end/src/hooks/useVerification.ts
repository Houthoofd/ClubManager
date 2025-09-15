import { apiUrl } from '../pages/apiUrl';

// Vérifie si un article existe déjà dans une catégorie (retourne true/false)
export function useCheckArticleByNomAndCategorie() {
  return async (nom: string, categorieId: string | null): Promise<boolean> => {
    if (!nom || !categorieId) return false;
    const params = new URLSearchParams({ nom, categorie_id: categorieId });
    const res = await fetch(apiUrl(`verification/magasin/article/categorie?${params.toString()}`), {
      credentials: 'include',
    });
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
    const res = await fetch(apiUrl(`verification/magasin/article?${params.toString()}`), {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Erreur API');
    const data = await res.json();
    return !!data.exists;
  };
}

// Vérifie si un cours récurrent existe déjà dans le planning (retourne true/false)
export function useCheckCoursPlanning() {
  return async (
    jour: string, 
    heure_debut: string, 
    heure_fin: string, 
    type_cours: string = '',
    options?: {
      excludeOriginal?: boolean;
      originalJour?: string;
      originalType?: string;
      originalHeureDebut?: string;
      originalHeureFin?: string;
    }
  ): Promise<boolean> => {
    if (!jour || !heure_debut || !heure_fin) return false;
    
    const res = await fetch(apiUrl('verification/planning'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jour,
        heure_debut,
        heure_fin,
        type_cours: type_cours || 'ANY',
        ...options
      }),
      credentials: 'include',
    });
    
    if (!res.ok) throw new Error('Erreur API');
    const data = await res.json();
    return !!data.exists;
  };
}
