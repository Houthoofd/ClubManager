import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  status: string;
  genres: string;
  grades: string;
  abonnement: string;
  date_of_birth: string;
}

interface LoginResponse {
  user: User; // Ajout de la propriété `user`
  token: string; // Ajout de la propriété `token`
}

interface LoginFormData {
  email: string;
  password: string;
}

export const useConnexion = () => {
  const mutation = useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: async (formData) => {
      const response = await fetch(apiUrl('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la tentative de connexion');
      }

      const data = await response.json();
      console.log('Données retournées par l\'API:', data);

      return data.data; // Retourner directement `data.data` pour simplifier l'accès
    },
  });

  return {
    ...mutation,
    isLoading: mutation.status === 'pending',
  };
};
