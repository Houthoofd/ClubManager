import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '../pages/apiUrl';



// CORRIGÉ: Fonction utilitaire pour récupérer l'ID utilisateur depuis userData.id
export const obtenirIdUtilisateur = (): number | null => {
  console.log(`🔍 [Utils] Recherche userId dans localStorage.userData.id`);
  
  try {
    // 1. PRIORITÉ: Chercher dans userData.id (c'est là que sont vos données)
    const userDataRaw = localStorage.getItem('userData');
    console.log(`🔍 [Utils] userData raw exists: ${!!userDataRaw}`);
    console.log(userDataRaw)
    if (userDataRaw) {
      try {
        const userData = JSON.parse(userDataRaw);
        console.log(`🔍 [Utils] userData parsé:`, userData);
        console.log(`🔍 [Utils] userData.id: ${userData?.id} (type: ${typeof userData?.id})`);
        
        if (userData && userData.id) {
          const userId = parseInt(userData.id.toString());
          if (!isNaN(userId) && userId > 0) {
            console.log(`✅ [Utils] ID utilisateur trouvé dans userData.id: ${userId}`);
            return userId;
          } else {
            console.log(`❌ [Utils] userData.id invalide: ${userData.id}`);
          }
        } else {
          console.log(`❌ [Utils] userData ou userData.id manquant:`, userData);
        }
      } catch (parseError) {
        console.error(`❌ [Utils] Erreur parsing userData JSON:`, parseError);
        console.error(`❌ [Utils] userData raw content:`, userDataRaw.substring(0, 200));
      }
    } else {
      console.log(`❌ [Utils] Aucun userData dans localStorage`);
    }

    // 2. Fallback: Chercher dans localStorage.userId direct
    const userIdDirect = localStorage.getItem('userId');
    if (userIdDirect && !isNaN(parseInt(userIdDirect))) {
      const userId = parseInt(userIdDirect);
      console.log(`✅ [Utils] ID utilisateur trouvé en fallback dans userId: ${userId}`);
      return userId;
    }

    // 3. Dernier fallback: Extraire du token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload && payload.id) {
            const userId = parseInt(payload.id.toString());
            if (!isNaN(userId) && userId > 0) {
              console.log(`✅ [Utils] ID utilisateur trouvé en fallback dans token: ${userId}`);
              return userId;
            }
          }
        }
      } catch (tokenError) {
        console.error(`❌ [Utils] Erreur extraction token:`, tokenError);
      }
    }

    console.error(`❌ [Utils] ÉCHEC TOTAL - Aucun userId trouvé`);
    console.error(`❌ [Utils] Debug localStorage:`, {
      userDataExists: !!localStorage.getItem('userData'),
      userIdExists: !!localStorage.getItem('userId'),
      tokenExists: !!localStorage.getItem('token'),
      allKeys: Object.keys(localStorage)
    });

    return null;

  } catch (error) {
    console.error(`❌ [Utils] Erreur générale dans obtenirIdUtilisateur:`, error);
    return null;
  }
};

// CORRIGÉ: Fonction utilitaire pour récupérer le token - priorité sur token direct et userData.token
const obtenirToken = (): string | null => {
  console.log('🔑 [Utils] Recherche token...');
  
  try {
    // 1. PRIORITÉ: Token direct dans localStorage
    let token = localStorage.getItem('token');
    if (token) {
      console.log('✅ [Utils] Token direct trouvé');
      return token;
    }

    // 2. FALLBACK: userData.token
    const userDataRaw = localStorage.getItem('userData');
    if (userDataRaw) {
      try {
        const userData = JSON.parse(userDataRaw);
        if (userData && userData.token) {
          console.log('✅ [Utils] Token trouvé dans userData.token');
          return userData.token;
        }
      } catch (parseError) {
        console.warn('⚠️ [Utils] Erreur parsing userData pour token:', parseError);
      }
    }

    // 3. Autres fallbacks
    token = localStorage.getItem('authToken') || 
           localStorage.getItem('jwt') || 
           localStorage.getItem('accessToken');
    
    if (token) {
      console.log('✅ [Utils] Token trouvé en fallback');
      return token;
    }

    console.error('❌ [Utils] Aucun token trouvé');
    return null;

  } catch (error) {
    console.error('❌ [Utils] Erreur récupération token:', error);
    return null;
  }
};

// Hook pour récupérer les échéances d'un utilisateur - CORRIGÉ l'utilisation du token
export const useEcheancesUtilisateur = (userId: number | null) => {
  return useQuery({
    queryKey: ['echeances', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log(`🔍 [Hook] Récupération échéances pour utilisateur: ${userId}`);

      const token = obtenirToken();

      if (!token) {
        console.error(`❌ [Hook] Aucun token trouvé pour échéances`);
        throw new Error('Token manquant - veuillez vous reconnecter');
      }

      console.log(`🔑 [Hook] Token présent - longueur: ${token.length} caractères`);
      
      const response = await fetch(`${apiUrl(`paiements/echeances/${userId}`)}`, {
        method: 'GET',
        credentials: 'include', // IMPORTANT: Envoie les cookies automatiquement
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 [Hook] Réponse HTTP pour échéances:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (response.status === 401 || response.status === 403) {
        console.error(`❌ [Hook] Erreur d'authentification (${response.status})`);
        throw new Error(`Authentification échouée (${response.status}): Token rejeté par le serveur`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Hook] Erreur HTTP ${response.status}:`, errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [Hook] ${data.length} échéances récupérées avec succès`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Token manquant')) {
        console.log(`🚫 [Hook] Pas de retry pour erreur d'authentification`);
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000
  });
};

// Hook pour récupérer une échéance spécifique - OPTIMISÉ SANS CACHE EXCESSIF
export const useEcheanceDetails = (echeanceId: string | null, userId: number | null) => {
  return useQuery({
    queryKey: ['echeance', echeanceId, userId],
    queryFn: async () => {
      if (!echeanceId || !userId) {
        throw new Error('ID échéance ou utilisateur manquant');
      }

      console.log('🔍 [useEcheanceDetails] Requête échéance:', { echeanceId, userId });

      const token = obtenirToken();

      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(apiUrl(`paiements/echeances/detail/${echeanceId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [useEcheanceDetails] Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 404) {
          throw new Error('Échéance non trouvée');
        } else if (response.status === 403) {
          throw new Error('Accès non autorisé à cette échéance');
        } else if (response.status === 401) {
          throw new Error('Session expirée - veuillez vous reconnecter');
        } else {
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('✅ [useEcheanceDetails] Données échéance reçues:', data);
      
      return data;
    },
    enabled: !!(echeanceId && userId),
    retry: 1, // Une seule tentative
    retryDelay: 1000, // 1 seconde de délai
    staleTime: 2 * 60 * 1000, // 2 minutes seulement
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // MODIFIÉ: Toujours refetch au mount pour avoir les données fraîches
    refetchInterval: false, // Pas de polling automatique
  });
};

// Hook pour créer un PaymentIntent - CORRIGÉ l'URL selon la structure modulaire
export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      currency?: string;
      echeanceId: string | number;
      userId?: number | null;
      description?: string;
    }) => {
      console.log(`💳 [Hook] Création PaymentIntent - Données reçues:`, data);
      
      // Auto-détection de l'ID utilisateur si non fourni
      let userId = data.userId;
      if (!userId || userId === null) {
        console.warn(`⚠️ [Hook] userId manquant, tentative de récupération automatique...`);
        userId = obtenirIdUtilisateur();
        
        if (!userId) {
          throw new Error('Impossible de déterminer l\'ID utilisateur - veuillez vous reconnecter');
        }
        console.log(`✅ [Hook] ID utilisateur récupéré automatiquement: ${userId}`);
      }
      
      console.log(`💳 [Hook] Validation des paramètres:`, {
        amount: data.amount,
        amountType: typeof data.amount,
        amountValid: !isNaN(data.amount) && data.amount > 0,
        echeanceId: data.echeanceId,
        echeanceIdType: typeof data.echeanceId,
        userId: userId,
        userIdType: typeof userId,
        userIdValid: !isNaN(userId) && userId > 0,
        userIdAutoDetected: data.userId !== userId
      });

      // Validation côté client renforcée
      if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        throw new Error('Montant invalide');
      }
      if (!data.echeanceId) {
        throw new Error('ID échéance manquant');
      }
      if (!userId || isNaN(userId) || userId <= 0) {
        throw new Error('ID utilisateur invalide - reconnectez-vous');
      }

      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('jwt') || 
                   localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Token d\'authentification manquant - reconnectez-vous');
      }

      const requestBody = {
        amount: Math.round(data.amount * 100), // Convertir en centimes
        currency: data.currency || 'eur',
        echeanceId: data.echeanceId,
        userId: userId, // Utiliser l'ID utilisateur résolu
        description: data.description || `Paiement échéance #${data.echeanceId}`
      };

      console.log(`💳 [Hook] Corps de la requête envoyé (corrigé):`, requestBody);
      console.log(`💳 [Hook] URL appelée (CORRIGÉE):`, `${apiUrl('paiements/stripe/create-payment-intent')}`);

      // CORRIGÉ: Utiliser la vraie route modulaire
      const response = await fetch(`${apiUrl('paiements/stripe/create-payment-intent')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`💳 [Hook] Statut de réponse:`, response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() };
        }
        console.error(`❌ [Hook] Erreur création PaymentIntent (${response.status}):`, errorData);
        
        // Messages d'erreur plus explicites
        if (response.status === 400) {
          throw new Error(`Erreur de validation: ${errorData.error || 'Paramètres invalides'}`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Session expirée - veuillez vous reconnecter');
        } else {
          throw new Error(errorData.error || `Erreur serveur ${response.status}`);
        }
      }

      const result = await response.json();
      console.log(`✅ [Hook] PaymentIntent créé avec succès:`, result.payment_intent_id || result.client_secret);
      return result;
    }
  });
};

// SIMPLIFIÉ: Hook pour créer un PaymentIntent avec userId obligatoire - sans callbacks complexes
export const useCreatePaymentIntentSecurise = (echeanceId: string | number, montant: number, userId: number) => {
  return useMutation({
    mutationFn: async (options?: {
      currency?: string;
      description?: string;
    }) => {
      console.log(`🔒 [Hook Sécurisé] Création PaymentIntent avec userId depuis URL:`, {
        echeanceId,
        montant,
        userId,
        userIdType: typeof userId,
        options
      });

      // Validation stricte du userId depuis l'URL
      if (!userId || isNaN(userId) || userId <= 0) {
        const error = `ID utilisateur invalide depuis l'URL: ${userId}`;
        console.error(`❌ [Hook Sécurisé] ${error}`);
        throw new Error(error);
      }
      
      const token = obtenirToken();

      if (!token) {
        throw new Error('Token d\'authentification manquant - reconnectez-vous');
      }

      const requestBody = {
        amount: Math.round(montant * 100), // Convertir en centimes
        currency: options?.currency || 'eur',
        echeanceId: echeanceId,
        userId: userId,
        description: options?.description || `Paiement échéance #${echeanceId}`
      };

      console.log(`📤 [Hook Sécurisé] Données envoyées:`, requestBody);

      const response = await fetch(`${apiUrl('paiements/stripe/create-payment-intent')}`, {
        method: 'POST',
        credentials: 'include', // IMPORTANT: Envoie les cookies automatiquement
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() };
        }
        console.error(`❌ [Hook Sécurisé] Erreur (${response.status}):`, errorData);
        throw new Error(errorData.error || `Erreur serveur ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ [Hook Sécurisé] PaymentIntent créé:`, result);
      return result;
    }
  });
};

// Hook pour confirmer un paiement - CORRIGÉ l'URL selon la structure modulaire
export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      paymentIntentId: string;
      echeanceId: string | number;
      userId: number;
      amount: number;
    }) => {
      console.log(`✅ [Hook] Confirmation paiement via route modulaire:`, data);

      // CORRIGÉ: Utiliser la vraie route modulaire
      const response = await fetch(`${apiUrl('paiements/confirmation/confirm-payment')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [Hook] Erreur confirmation paiement:`, errorData);
        throw new Error(errorData.error || 'Erreur lors de la confirmation du paiement');
      }

      const result = await response.json();
      console.log(`🎉 [Hook] Paiement confirmé:`, result);
      return result;
    },
    onSuccess: (data) => {
      // Invalider les caches des échéances pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
      queryClient.invalidateQueries({ queryKey: ['echeance'] });
      console.log(`🔄 [Hook] Cache des échéances invalidé après paiement confirmé`);
    }
  });
};

// Hook pour récupérer tous les paiements (admin) - CORRIGÉ l'URL sans /crud
export const usePaiements = (filters?: {
  utilisateur_id?: number;
  statut?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['paiements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.utilisateur_id) params.append('utilisateur_id', filters.utilisateur_id.toString());
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      // CORRIGÉ: Utiliser la route directe sans /crud
      const url = `${apiUrl(`paiements?${params.toString()}`)}`;

      console.log('📡 [Hook] Appel API paiements (racine):', {
        url,
        filters,
        params: params.toString()
      });

      const token = obtenirToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [Hook] Réponse API paiements:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Hook] Erreur API paiements:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        if (response.status === 503) {
          throw new Error('Service CRUD des paiements temporairement indisponible');
        }
        
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [Hook] Paiements récupérés:', {
        success: data.success,
        count: data.data?.length || 0,
        total: data.pagination?.total || 0
      });
      
      return data.success ? data.data : [];
    },
    enabled: true,
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Ne pas retry si c'est une erreur 503 (service indisponible)
      if (error.message.includes('503') || error.message.includes('Service') || error.message.includes('indisponible')) {
        console.log('🚫 [Hook] Pas de retry pour service indisponible');
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 2000
  });
};

// Hook pour créer une nouvelle échéance (admin) - CORRIGÉ l'URL
export const useCreateEcheance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      utilisateur_id: number;
      abonnement_id?: number;
      montant: number;
      date_echeance: string;
      statut?: string;
    }) => {
      // CORRIGÉ: Utiliser la vraie route modulaire des échéances
      const response = await fetch(`${apiUrl('paiements/echeances')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de l\'échéance');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
    }
  });
};

// Hook pour mettre à jour une échéance (admin) - CORRIGÉ l'URL
export const useUpdateEcheance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      echeanceId: number;
      updates: {
        montant?: number;
        date_echeance?: string;
        statut?: string;
        date_paiement?: string;
      };
    }) => {
      const response = await fetch(`${apiUrl(`paiements/echeance/${data.echeanceId}`)}`, {
        method: 'PUT',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data.updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'échéance');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
      queryClient.invalidateQueries({ queryKey: ['echeance'] });
    }
  });
};

// Hook pour supprimer une échéance (admin) - CORRIGÉ l'URL sans /crud
export const useDeleteEcheance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (echeanceId: number) => {
      // CORRIGÉ: Utiliser la route directe sans /crud
      const response = await fetch(`${apiUrl(`paiements/${echeanceId}`)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de l\'échéance');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
    }
  });
};

// Hook pour créer un paiement générique - CORRIGÉ l'URL sans /crud
export const useCreerPaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      utilisateur_id: number;
      montant: number;
      methode_paiement: string;
      commande_id?: number;
      stripe_payment_intent_id?: string;
      paypal_order_id?: string;
      bitcoin_address?: string;
      statut?: string;
      description?: string;
      abonnement_id?: number;
      echeance_id?: number;
    }) => {
      console.log(`💳 [Hook] Création paiement via CRUD (racine):`, data);

      // CORRIGÉ: Utiliser la route directe sans /crud
      const response = await fetch(`${apiUrl('paiements')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [Hook] Erreur création paiement:`, errorData);
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const result = await response.json();
      console.log(`✅ [Hook] Paiement créé:`, result);
      return result;
    },
    onSuccess: () => {
      // Invalider les caches des paiements
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
      console.log(`🔄 [Hook] Cache des paiements invalidé après création`);
    }
  });
};

// Hook pour traiter un paiement Stripe/Bancontact
export const useTraiterPaiementStripe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      currency?: string;
      commande?: any;
      utilisateur_id: number;
      methode?: 'bancontact' | 'card';
    }) => {
      console.log(`💳 [Hook] Traitement paiement Stripe:`, data);

      const endpoint = data.methode === 'bancontact' ? 'bancontact' : 'stripe';
      const response = await fetch(`${apiUrl(`paiements/${endpoint}`)}`, {
        method: 'POST',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency || 'eur',
          commande: data.commande,
          utilisateur_id: data.utilisateur_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [Hook] Erreur traitement paiement:`, errorData);
        throw new Error(errorData.error || 'Erreur lors du traitement du paiement');
      }

      const result = await response.json();
      console.log(`✅ [Hook] Paiement traité:`, result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
    }
  });
};

// Hook pour traiter un paiement PayPal
export const useTraiterPaiementPayPal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      totalAmount: number;
      userId: number;
      commande?: any;
    }) => {
      console.log(`💳 [Hook] Traitement paiement PayPal:`, data);

      const response = await fetch(`${apiUrl('paiements/paypal')}`, {
        method: 'POST',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [Hook] Erreur traitement PayPal:`, errorData);
        throw new Error(errorData.error || 'Erreur lors du traitement du paiement PayPal');
      }

      const result = await response.json();
      console.log(`✅ [Hook] Paiement PayPal traité:`, result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour traiter un paiement Bitcoin
export const useTraiterPaiementBitcoin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      sats: number;
      commande?: any;
    }) => {
      console.log(`₿ [Hook] Traitement paiement Bitcoin:`, data);

      const response = await fetch(`${apiUrl('paiements/bitcoin')}`, {
        method: 'POST',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [Hook] Erreur traitement Bitcoin:`, errorData);
        throw new Error(errorData.error || 'Erreur lors du traitement du paiement Bitcoin');
      }

      const result = await response.json();
      console.log(`✅ [Hook] Paiement Bitcoin traité:`, result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour modifier un paiement - CORRIGÉ l'URL sans /crud
export const useModifierPaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      paiementId: number;
      updates: {
        montant?: number;
        statut?: string;
        methode_paiement?: string;
        description?: string;
      };
    }) => {
      // CORRIGÉ: Utiliser la route directe sans /crud
      const response = await fetch(`${apiUrl(`paiements/${data.paiementId}`)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data.updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification du paiement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour supprimer un paiement - CORRIGÉ l'URL sans /crud
export const useSupprimerPaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiementId: number) => {
      // CORRIGÉ: Utiliser la route directe sans /crud
      const response = await fetch(`${apiUrl(`paiements/${paiementId}`)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du paiement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour mettre à jour le statut d'un paiement
export const useMettreAJourStatutPaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: number;
      statut: string;
    }) => {
      const response = await fetch(`${apiUrl('paiements/update')}`, {
        method: 'PUT',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du statut');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
    }
  });
};

// Hook pour récupérer les échéances par userId (alias pour useEcheancesUtilisateur)
export const useEcheancesByUserId = (userId: number | null) => {
  return useEcheancesUtilisateur(userId);
};

// Hook pour récupérer les échéances d'un utilisateur avec plus d'options
export const useEcheancesUtilisateurAvecOptions = (
  userId: number | null, 
  options?: {
    statut?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['echeances', userId, options],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log(`🔍 [Hook] Récupération échéances avec options pour utilisateur: ${userId}`, options);

      const params = new URLSearchParams();
      if (options?.statut) params.append('statut', options.statut);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.includeInactive) params.append('includeInactive', 'true');

      const url = `${apiUrl(`paiements/echeances/${userId}?${params.toString()}`)}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [Hook] ${data.length} échéances récupérées avec options`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: 2
  });
};

// Hook pour récupérer les paiements d'un utilisateur spécifique - CORRIGÉ l'URL sans /crud
export const usePaiementsUtilisateur = (userId: number | null) => {
  return useQuery({
    queryKey: ['paiements-utilisateur', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log(`🔍 [Hook] Récupération paiements pour utilisateur: ${userId}`);

      // CORRIGÉ: Utiliser la route directe sans /crud
      const response = await fetch(`${apiUrl(`paiements/utilisateur/${userId}`)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [Hook] ${data.length} paiements récupérés pour utilisateur`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: 2
  });
};

// Hook pour récupérer l'historique complet d'un utilisateur (paiements + échéances)
export const useHistoriqueUtilisateur = (userId: number | null) => {
  const { data: paiements = [], isLoading: loadingPaiements } = usePaiementsUtilisateur(userId);
  const { data: echeances = [], isLoading: loadingEcheances } = useEcheancesUtilisateur(userId);

  return {
    data: {
      paiements,
      echeances,
      historique: [
        ...paiements.map((p: any) => ({ ...p, type: 'paiement' })),
        ...echeances.map((e: any) => ({ ...e, type: 'echeance' }))
      ].sort((a: any, b: any) => new Date(b.date_creation || b.date_echeance).getTime() - new Date(a.date_creation || a.date_echeance).getTime())
    },
    isLoading: loadingPaiements || loadingEcheances,
    paiements,
    echeances
  };
};

export default {
  useEcheancesUtilisateur,
  useEcheancesByUserId,
  useEcheancesUtilisateurAvecOptions,
  usePaiementsUtilisateur,
  useHistoriqueUtilisateur,
  useEcheanceDetails,
  useCreatePaymentIntent,
  useCreatePaymentIntentSecurise,
  useConfirmPayment,
  usePaiements,
  useCreateEcheance,
  useUpdateEcheance,
  useDeleteEcheance,
  useCreerPaiement,
  useTraiterPaiementStripe,
  useTraiterPaiementPayPal,
  useTraiterPaiementBitcoin,
  useModifierPaiement,
  useSupprimerPaiement,
  useMettreAJourStatutPaiement
};

