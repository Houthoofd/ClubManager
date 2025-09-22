import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les informations utilisateur par prénom et nom
export const useCompteInfo = (prenom: string | undefined, nom: string | undefined) => {
  console.log('Récupération des informations du compte pour:', { prenom, nom });
  return useQuery({
    queryKey: ['compteInfo', prenom, nom],
    queryFn: async () => {
      const response = await fetch(apiUrl(`compte/informations`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des informations utilisateur');
      return response.json();
    },
    enabled: !!prenom && !!nom,
  });
};

// Hook pour récupérer les statistiques de fréquentation
export const useStatFrequentation = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['statFrequentation', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`statistiques/frequentation/${userId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques de fréquentation');
      return response.json();
    },
    enabled: !!userId,
  });
};

// Hook pour récupérer les abonnements
export const useAbonnements = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements');
      return response.json();
    },
  });
};

// Hook pour récupérer les grades
export const useGrades = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/grades'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des grades');
      return response.json();
    },
  });
};

// Hook pour récupérer les statuts
export const useStatus = () => {
  return useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/status'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statuts');
      return response.json();
    },
  });
};

// Hook pour mettre à jour les informations utilisateur
export const useUpdateCompte = () => {
  const queryClient = useQueryClient(); // Initialisez le queryClient

  return useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(apiUrl('utilisateurs/modifier'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour des informations utilisateur');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalide les queries associées pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['compteInfo'] }); // Passez un objet avec queryKey
      queryClient.invalidateQueries({ queryKey: ['echeancesByUserId'] }); // Passez un objet avec queryKey
    },
  });
};

// Hook pour récupérer les statuts
export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/genres'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des genres');
      return response.json();
    }
  });
};
