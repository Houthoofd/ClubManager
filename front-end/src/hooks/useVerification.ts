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

// MODIFIÉ: Hook pour vérifier l'unicité de l'email avec meilleur debugging
export function useCheckEmail() {
  return async (email: string): Promise<boolean> => {
    if (!email) {
      console.log('🔍 useCheckEmail: Email vide, retour false');
      return false;
    }
    
    try {
      console.log('🔍 useCheckEmail: Vérification de l\'email:', email);
      
      const res = await fetch(apiUrl('verification/verifier-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      
      console.log('📡 useCheckEmail: Réponse HTTP status:', res.status);
      
      if (!res.ok) {
        console.error('❌ useCheckEmail: Erreur HTTP:', res.status, res.statusText);
        throw new Error(`Erreur HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('📊 useCheckEmail: Données reçues:', data);
      
      // La méthode checkUtilisateurByEmail retourne { isFind, message }
      // Si isFind est true, l'email existe déjà
      const emailExists = data.exists === true;
      console.log('📧 useCheckEmail: Email existe?', emailExists);
      
      return emailExists;
    } catch (error) {
      console.error('❌ useCheckEmail: Erreur lors de la vérification de l\'email:', error);
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };
}
