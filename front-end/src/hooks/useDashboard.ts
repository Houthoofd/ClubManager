import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';

// Hook pour récupérer le nombre total de membres
export const useMembresCount = () => {
  return useQuery({
    queryKey: ['membresCount'],
    queryFn: async () => {
      console.log('🔍 Fetching membres count...');
      try {
        const response = await fetch(apiUrl('statistiques/membres/count'), {
          credentials: 'include',
        });
        console.log('📡 Membres count response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Membres count error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement du nombre de membres');
        }
        
        const data = await response.json();
        console.log('✅ Membres count data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Membres count fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les paiements du mois
export const usePaiementsMois = () => {
  return useQuery({
    queryKey: ['paiementsMois'],
    queryFn: async () => {
      console.log('🔍 Fetching paiements mois...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/mois'), {
          credentials: 'include',
        });
        console.log('📡 Paiements mois response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Paiements mois error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des paiements du mois');
        }
        
        const data = await response.json();
        console.log('✅ Paiements mois data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Paiements mois fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les paiements récents
export const usePaiementsRecents = () => {
  return useQuery({
    queryKey: ['paiementsRecents'],
    queryFn: async () => {
      console.log('🔍 Fetching paiements récents...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/recents'), {
          credentials: 'include',
        });
        console.log('📡 Paiements récents response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Paiements récents error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des paiements récents');
        }
        
        const data = await response.json();
        console.log('✅ Paiements récents data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Paiements récents fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les paiements en attente
export const usePaiementsEnAttente = () => {
  return useQuery({
    queryKey: ['paiementsEnAttente'],
    queryFn: async () => {
      console.log('🔍 Fetching paiements en attente...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/en-attente'), {
          credentials: 'include',
        });
        console.log('📡 Paiements en attente response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Paiements en attente error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des paiements en attente');
        }
        
        const data = await response.json();
        console.log('✅ Paiements en attente data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Paiements en attente fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les plans actifs
export const usePlansActifs = () => {
  return useQuery({
    queryKey: ['plansActifs'],
    queryFn: async () => {
      console.log('🔍 Fetching plans actifs...');
      try {
        const response = await fetch(apiUrl('statistiques/plans/actifs'), {
          credentials: 'include',
        });
        console.log('📡 Plans actifs response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Plans actifs error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des plans actifs');
        }
        
        const data = await response.json();
        console.log('✅ Plans actifs data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Plans actifs fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer le taux de renouvellement
export const useTauxRenouvellement = () => {
  return useQuery({
    queryKey: ['tauxRenouvellement'],
    queryFn: async () => {
      console.log('🔍 Fetching taux renouvellement...');
      try {
        const response = await fetch(apiUrl('statistiques/plans/taux-renouvellement'), {
          credentials: 'include',
        });
        console.log('📡 Taux renouvellement response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Taux renouvellement error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement du taux de renouvellement');
        }
        
        const data = await response.json();
        console.log('✅ Taux renouvellement data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Taux renouvellement fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les paiements par mois
export const usePaiementsParMois = () => {
  return useQuery({
    queryKey: ['paiementsParMois'],
    queryFn: async () => {
      console.log('🔍 Fetching paiements par mois...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/par-mois'), {
          credentials: 'include',
        });
        console.log('📡 Paiements par mois response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Paiements par mois error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des paiements par mois');
        }
        
        const data = await response.json();
        console.log('✅ Paiements par mois data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Paiements par mois fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les membres par plan
export const useMembresParPlan = () => {
  return useQuery({
    queryKey: ['membresParPlan'],
    queryFn: async () => {
      console.log('🔍 Fetching membres par plan...');
      try {
        const response = await fetch(apiUrl('statistiques/membres/par-plan'), {
          credentials: 'include',
        });
        console.log('📡 Membres par plan response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Membres par plan error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des membres par plan');
        }
        
        const data = await response.json();
        console.log('✅ Membres par plan data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Membres par plan fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les derniers paiements
export const useDerniersPaiements = () => {
  return useQuery({
    queryKey: ['derniersPaiements'],
    queryFn: async () => {
      console.log('🔍 Fetching derniers paiements...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/derniers'), {
          credentials: 'include',
        });
        console.log('📡 Derniers paiements response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Derniers paiements error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des derniers paiements');
        }
        
        const data = await response.json();
        console.log('✅ Derniers paiements data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Derniers paiements fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les paiements échus
export const usePaiementsEchus = () => {
  return useQuery({
    queryKey: ['paiementsEchus'],
    queryFn: async () => {
      console.log('🔍 Fetching paiements échus...');
      try {
        const response = await fetch(apiUrl('statistiques/paiements/echus'), {
          credentials: 'include',
        });
        console.log('📡 Paiements échus response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Paiements échus error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des paiements échus');
        }
        
        const data = await response.json();
        console.log('✅ Paiements échus data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Paiements échus fetch error:', error);
        throw error;
      }
    },
  });
};

// Hook pour récupérer les nouveaux membres
export const useNouveauxMembres = () => {
  return useQuery({
    queryKey: ['nouveauxMembres'],
    queryFn: async () => {
      console.log('🔍 Fetching nouveaux membres...');
      try {
        const response = await fetch(apiUrl('statistiques/membres/nouveaux'), {
          credentials: 'include',
        });
        console.log('📡 Nouveaux membres response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Nouveaux membres error:', response.status, response.statusText);
          throw new Error('Erreur lors du chargement des nouveaux membres');
        }
        
        const data = await response.json();
        console.log('✅ Nouveaux membres data received:', data);
        return data;
      } catch (error) {
        console.error('💥 Nouveaux membres fetch error:', error);
        throw error;
      }
    },
  });
};
