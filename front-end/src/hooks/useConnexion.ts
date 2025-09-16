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
        const errorText = await response.text(); // Lire la réponse en texte brut
        console.error('Erreur serveur:', errorText); // Log de la réponse brute
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }

      try {
        const data = await response.json();
        console.log('Données retournées par l\'API:', data);
        return data.data; // Retourner directement `data.data` pour simplifier l'accès
      } catch (err) {
        console.error('Erreur de parsing JSON:', err);
        throw new Error('La réponse du serveur n\'est pas un JSON valide.');
      }
    },
  });

  const checkStatus = async () => {
    const token = localStorage.getItem('authToken'); // Récupérer le jeton depuis le localStorage
    if (!token) {
      throw new Error('Jeton manquant. Veuillez vous reconnecter.');
    }

    const response = await fetch(apiUrl('auth/status'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, // Inclure le jeton dans les en-têtes
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur lors de la vérification du statut:', errorText);
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Statut de l\'utilisateur:', data);
    return data;
  };

  return {
    ...mutation,
    isLoading: mutation.status === 'pending',
    checkStatus,
  };
};
