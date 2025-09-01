import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer le nombre total de membres
export const useMembresCount = () => {
  return useQuery({
    queryKey: ['membresCount'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/count'));
      if (!response.ok) throw new Error('Erreur lors du chargement du nombre de membres');
      return response.json();
    },
  });
};

// Hook pour récupérer les paiements du mois
export const usePaiementsMois = () => {
  return useQuery({
    queryKey: ['paiementsMois'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/mois'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements du mois');
      return response.json();
    },
  });
};

// Hook pour récupérer les paiements récents
export const usePaiementsRecents = () => {
  return useQuery({
    queryKey: ['paiementsRecents'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/recents'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements récents');
      return response.json();
    },
  });
};

// Hook pour récupérer les paiements en attente
export const usePaiementsEnAttente = () => {
  return useQuery({
    queryKey: ['paiementsEnAttente'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/en-attente'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements en attente');
      return response.json();
    },
  });
};

// Hook pour récupérer les plans actifs
export const usePlansActifs = () => {
  return useQuery({
    queryKey: ['plansActifs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/plans/actifs'));
      if (!response.ok) throw new Error('Erreur lors du chargement des plans actifs');
      return response.json();
    },
  });
};

// Hook pour récupérer le taux de renouvellement
export const useTauxRenouvellement = () => {
  return useQuery({
    queryKey: ['tauxRenouvellement'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/plans/taux-renouvellement'));
      if (!response.ok) throw new Error('Erreur lors du chargement du taux de renouvellement');
      return response.json();
    },
  });
};

// Hook pour récupérer les paiements par mois
export const usePaiementsParMois = () => {
  return useQuery({
    queryKey: ['paiementsParMois'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/par-mois'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements par mois');
      return response.json();
    },
  });
};

// Hook pour récupérer les membres par plan
export const useMembresParPlan = () => {
  return useQuery({
    queryKey: ['membresParPlan'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/par-plan'));
      if (!response.ok) throw new Error('Erreur lors du chargement des membres par plan');
      return response.json();
    },
  });
};

// Hook pour récupérer les derniers paiements
export const useDerniersPaiements = () => {
  return useQuery({
    queryKey: ['derniersPaiements'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/derniers'));
      if (!response.ok) throw new Error('Erreur lors du chargement des derniers paiements');
      return response.json();
    },
  });
};

// Hook pour récupérer les paiements échus
export const usePaiementsEchus = () => {
  return useQuery({
    queryKey: ['paiementsEchus'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/paiements/echus'));
      if (!response.ok) throw new Error('Erreur lors du chargement des paiements échus');
      return response.json();
    },
  });
};

// Hook pour récupérer les nouveaux membres
export const useNouveauxMembres = () => {
  return useQuery({
    queryKey: ['nouveauxMembres'],
    queryFn: async () => {
      const response = await fetch(apiUrl('statistiques/membres/nouveaux'));
      if (!response.ok) throw new Error('Erreur lors du chargement des nouveaux membres');
      return response.json();
    },
  });
};
