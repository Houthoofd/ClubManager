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
      const response = await fetch(apiUrl('informations/abonnements'), {
        credentials: 'include',
      });
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
      const response = await fetch(apiUrl('informations/genres'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des genres');
      const data = await response.json();
      return data.map((item: any) => ({
        value: String(item.id),
        label: item.genre_name,
      }));
    },
  });
};

// Hook pour vérifier si un utilisateur existe déjà
export const useVerifierUtilisateur = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(apiUrl('inscription/verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      if (response.status === 409) {
        throw new Error('Cet utilisateur existe déjà.');
      }
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de l\'utilisateur.');
      }
      return response.json();
    },
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
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'inscription.');
      }
      return response.json();
    },
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
