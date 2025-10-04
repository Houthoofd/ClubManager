import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les cours disponibles
export const useCoursDisponibles = () => {
  return useQuery({
    queryKey: ['coursDisponibles'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des cours');
      return response.json();
    }
  });
};

// Hook pour inscrire un utilisateur à un cours
export const useInscrireUtilisateurCours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, coursId }: { userId: number; coursId: number }) => {
      const response = await fetch(apiUrl('cours/inscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, coursId }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'inscription');
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', userId] });
    }
  });
};

// Hook pour annuler une inscription
export const useAnnulerInscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, coursId }: { userId: number; coursId: number }) => {
      const response = await fetch(apiUrl(`cours/inscription/${userId}/${coursId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'annulation de l\'inscription');
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', userId] });
    }
  });
};

// Hook pour annuler une inscription (version body nom/prenom)
export const useAnnulerInscriptionParNomPrenom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cours_id: number; utilisateur_nom: string; utilisateur_prenom: string }) => {
      const response = await fetch(apiUrl('cours/annulation'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'annulation de l'inscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });
};

// Hook pour récupérer les options d'abonnements
export const useAbonnementOptions = () => {
  return useQuery({
    queryKey: ['abonnements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/abonnements'));
      if (!response.ok) throw new Error('Erreur lors du chargement des abonnements');
      const data = await response.json();
      return data.map((item: any) => ({
        value: String(item.id),
        label: item.nom_plan,
        prix: item.prix
      }));
    },
  });
};

// Hook pour récupérer les options de genres
export const useGenreOptions = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await fetch(apiUrl('informations/genres'));
      if (!response.ok) throw new Error('Erreur lors du chargement des genres');
      const data = await response.json();
      return data.map((item: any) => ({
        value: String(item.id),
        label: item.genre_name,
      }));
    },
  });
};

// Hook pour vérifier si un utilisateur existe déjà (basé sur nom + prénom + date de naissance)
export const useVerifierUtilisateur = () => {
  return useMutation({
    mutationFn: async (userData: { nom: string; prenom: string; date_naissance: string }) => {
      console.log('[Hook] Vérification utilisateur pour:', userData);
      
      const response = await fetch(apiUrl('utilisateurs/verifier'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: userData.nom,
          prenom: userData.prenom,
          date_naissance: userData.date_naissance
        }),
      });

      const data = await response.json();
      console.log('[Hook] Réponse vérification:', data);

      if (!response.ok) {
        // Si l'utilisateur existe, le serveur retourne une erreur 409
        if (response.status === 409) {
          throw new Error(data.message || 'Un utilisateur avec ces informations existe déjà');
        }
        throw new Error(data.message || 'Erreur lors de la vérification');
      }

      return data;
    },
    onError: (error: any) => {
      console.error('[Hook] Erreur lors de la vérification:', error);
    },
    onSuccess: (data) => {
      console.log('[Hook] Vérification réussie:', data);
    }
  });
};

// Nouveau type pour le payload d'inscription utilisateur (front-end)
export type UtilisateurInscriptionPayload = {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  password: string;
  genre_id: number;
  abonnement_id: number;
  date_naissance: string;
  date_inscription: string;
  status_id: number;
  grade_id: number;
};

// Hook pour inscrire un utilisateur (inscription générale, typé proprement)
export const useInscrireUtilisateur = () => {
  return useMutation({
    mutationFn: async (payload: UtilisateurInscriptionPayload) => {
      const response = await fetch(apiUrl('utilisateurs/inscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Gestion spécifique des différents types d'erreurs
        if (response.status === 409 && data.type === 'USER_EXISTS') {
          throw new Error(data.message || 'Un utilisateur avec ces informations existe déjà');
        }
        if (response.status === 400 && data.type === 'AGE_INSUFFICIENT') {
          throw new Error(data.message || 'Âge insuffisant pour l\'inscription');
        }
        if (response.status === 400 && data.type === 'INVALID_BIRTH_DATE') {
          throw new Error(data.message || 'Date de naissance invalide');
        }
        throw new Error(data.message || 'Erreur lors de l\'inscription.');
      }
      
      return data;
    },
    onError: (error: any) => {
      console.error('[Hook] Erreur lors de l\'inscription:', error);
    },
    onSuccess: (data) => {
      console.log('[Hook] Inscription réussie:', data);
    }
  });
};

// Hook pour inscrire un utilisateur à un cours (version DataReservation)
export const useInscrireUtilisateurReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cours_id: number; utilisateur_nom: string; utilisateur_prenom: string }) => {
      const response = await fetch(apiUrl('cours/inscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'inscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });
};

// Hook pour récupérer les utilisateurs inscrits à un cours
export const useUtilisateursParCours = (coursId: number) => {
  return useQuery({
    queryKey: ['utilisateursParCours', coursId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`cours/${coursId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs du cours');
      const data = await response.json();
      if (Array.isArray(data.data.Cours)) {
        if (data.data.Cours.length > 0 && typeof data.data.Cours[0] === 'object' && 'id' in data.data.Cours[0]) {
          return data.data.Cours.map((u: any) => u.id);
        }
        return data.data.Cours;
      }
      return [];
    },
    enabled: !!coursId
  });
};

// Hook pour récupérer les utilisateurs inscrits à tous les cours (tableau de cours)
export const useUtilisateursPourTousLesCours = (coursList: { id: number }[]) => {
  return useQueries({
    queries: coursList.map((c) => ({
      queryKey: ['utilisateursParCours', c.id],
      queryFn: async () => {
        const response = await fetch(apiUrl(`cours/${c.id}`), {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs du cours');
        const data = await response.json();
        if (Array.isArray(data.data.Cours)) {
          if (data.data.Cours.length > 0 && typeof data.data.Cours[0] === 'object' && 'id' in data.data.Cours[0]) {
            return data.data.Cours.map((u: { id: number }) => u.id);
          }
          return data.data.Cours;
        }
        return [];
      },
      enabled: !!c.id
    }))
  });
};