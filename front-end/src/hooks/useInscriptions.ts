import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer les cours disponibles
export const useCoursDisponibles = () => {
  return useQuery({
    queryKey: ['coursDisponibles'],
    queryFn: async () => {
      const response = await fetch(apiUrl('cours'));
      if (!response.ok) throw new Error('Erreur lors du chargement des cours');
      return response.json();
    }
  });
};

// Hook pour récupérer les réservations d'un utilisateur
export const useReservationsUtilisateur = (userId: number) => {
  return useQuery({
    queryKey: ['reservations', userId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`cours/reservations/${userId}`));
      if (!response.ok) throw new Error('Erreur lors du chargement des réservations');
      return response.json();
    },
    enabled: !!userId // N'exécute pas la requête si userId est invalide
  });
};

// Hook pour inscrire un utilisateur à un cours (premier)
export const useInscrireUtilisateurCours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, coursId }: { userId: number; coursId: number }) => {
      const response = await fetch(apiUrl('cours/inscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, coursId })
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
        method: 'DELETE'
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

// Hook pour vérifier si un utilisateur existe déjà
export const useVerifierUtilisateur = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(apiUrl('inscription/verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

// Hook pour inscrire un utilisateur (deuxième - pour l'inscription générale)
export const useInscrireUtilisateur = () => {
  return useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(apiUrl('inscription/validation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'inscription.');
      }
      return response.json();
    },
  });
};
