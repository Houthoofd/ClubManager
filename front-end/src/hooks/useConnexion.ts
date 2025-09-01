import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

export const useConnexion = () => {
  return useMutation({
    mutationFn: async (formData: { email: string; password: string }) => {
      const response = await fetch(apiUrl('utilisateurs/connexion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la tentative de connexion');
      }

      return response.json();
    },
  });
};
