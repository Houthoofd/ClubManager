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

// Hook pour récupérer les échéances d'un utilisateur - SUPPRIMÉ les redirections automatiques
export const useEcheancesUtilisateur = (userId: number | null) => {
  return useQuery({
    queryKey: ['echeances', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log(`🔍 [Hook] Récupération échéances pour utilisateur: ${userId}`);

      // DEBUG: Vérifier TOUTES les clés possibles dans localStorage
      console.log('🔍 [Hook] Contenu complet du localStorage:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key!);
        console.log(`  - ${key}: ${value?.substring(0, 50)}${value && value.length > 50 ? '...' : ''}`);
      }

      // Essayer plusieurs clés possibles pour le token
      let token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 localStorage.getItem('jwt') || 
                 localStorage.getItem('accessToken');
      
      console.log(`🔑 [Hook] Token trouvé:`, !!token);
      console.log(`🔑 [Hook] Source du token:`, 
        localStorage.getItem('token') ? 'token' :
        localStorage.getItem('authToken') ? 'authToken' :
        localStorage.getItem('jwt') ? 'jwt' :
        localStorage.getItem('accessToken') ? 'accessToken' : 'AUCUNE'
      );

      if (!token) {
        console.error(`❌ [Hook] Aucun token trouvé dans localStorage`);
        console.error(`❌ [Hook] Clés disponibles:`, Object.keys(localStorage));
        
        // Vérifier si l'utilisateur est connecté d'une autre manière
        const userData = localStorage.getItem('userData');
        console.log(`👤 [Hook] UserData disponible:`, !!userData);
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log(`👤 [Hook] UserData parsé:`, { id: user.id, email: user.email, role: user.role });
          } catch (e) {
            console.error(`❌ [Hook] Erreur parsing userData:`, e);
          }
        }
        
        throw new Error('Token manquant - veuillez vous reconnecter');
      }

      // DEBUG: Afficher des infos sur le token
      console.log(`🔑 [Hook] Token présent - longueur: ${token.length} caractères`);
      console.log(`🔑 [Hook] Token commence par: ${token.substring(0, 20)}...`);
      console.log(`🔑 [Hook] Token finit par: ...${token.substring(token.length - 10)}`);
      
      // Vérifier si le token n'est pas expiré (sans redirection)
      try {
        const tokenParts = token.split('.');
        console.log(`🔑 [Hook] Parties du token: ${tokenParts.length}`);
        
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = payload.exp ? payload.exp - now : 0;
          
          console.log(`🔑 [Hook] Token payload:`, {
            userId: payload.id,
            email: payload.email,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat,
            timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
            isExpired: timeUntilExpiry <= 0
          });
          
          if (payload.exp && payload.exp < now) {
            console.error(`❌ [Hook] Token expiré depuis ${Math.floor((now - payload.exp) / 60)} minutes`);
            // Nettoyer le token expiré
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('jwt');
            localStorage.removeItem('accessToken');
            throw new Error('Token expiré - veuillez vous reconnecter');
          }
        } else {
          console.warn(`⚠️ [Hook] Token ne semble pas être un JWT valide (${tokenParts.length} parties au lieu de 3)`);
        }
      } catch (tokenError) {
        console.warn(`⚠️ [Hook] Impossible de décoder le token:`, tokenError);
        console.warn(`⚠️ [Hook] Le token pourrait ne pas être un JWT standard`);
      }

      const response = await fetch(`${apiUrl(`paiements/echeances/${userId}`)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 [Hook] Réponse HTTP pour échéances:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: {
          'content-type': response.headers.get('content-type'),
          'authorization': response.headers.get('authorization') ? 'présent' : 'absent'
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.error(`❌ [Hook] Erreur d'authentification (${response.status}) - Token probablement rejeté par le serveur`);
        
        // DEBUG: Lire la réponse d'erreur du serveur
        try {
          const errorResponse = await response.text();
          console.error(`📄 [Hook] Réponse serveur:`, errorResponse);
        } catch (e) {
          console.error(`📄 [Hook] Impossible de lire la réponse d'erreur`);
        }
        
        // NE PLUS REDIRIGER AUTOMATIQUEMENT - laisser l'utilisateur décider
        console.warn(`⚠️ [Hook] Token rejeté par le serveur. L'utilisateur peut se reconnecter manuellement si nécessaire.`);
        
        throw new Error(`Authentification échouée (${response.status}): Token rejeté par le serveur - Cliquez sur "Se reconnecter" si nécessaire`);
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
      // Ne pas retry si erreur d'authentification
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Token manquant')) {
        console.log(`🚫 [Hook] Pas de retry pour erreur d'authentification`);
        return false;
      }
      // Retry jusqu'à 2 fois pour les autres erreurs
      return failureCount < 2;
    },
    retryDelay: 1000
  });
};

// Hook pour récupérer une échéance spécifique - SUPPRIMÉ les redirections automatiques
export const useEcheanceDetails = (echeanceId: string | number | null, userId?: number | null) => {
  return useQuery({
    queryKey: ['echeance', echeanceId, userId],
    queryFn: async () => {
      if (!echeanceId) return null;
      
      console.log(`🔍 [Hook] Récupération détails échéance: ${echeanceId}`);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error(`❌ [Hook] Aucun token trouvé pour échéance`);
        throw new Error('Token manquant - veuillez vous reconnecter');
      }
      
      const url = userId 
        ? `${apiUrl(`paiements/echeance/${echeanceId}?userId=${userId}`)}`
        : `${apiUrl(`paiements/echeance/${echeanceId}`)}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // AJOUTÉ
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.error(`❌ [Hook] Erreur d'authentification pour échéance (${response.status})`);
        
        // NE PLUS REDIRIGER AUTOMATIQUEMENT
        throw new Error(`Authentification échouée pour échéance: Token rejeté - Reconnectez-vous si nécessaire`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Échéance non trouvée (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        console.log(`✅ [Hook] Détails échéance récupérés:`, data.data);
        return data.data;
      } else {
        throw new Error('Données d\'échéance invalides');
      }
    },
    enabled: !!echeanceId && (typeof echeanceId === 'string' || typeof echeanceId === 'number'),
    staleTime: 60000,
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 1;
    }
  });
};

// Hook pour créer un PaymentIntent - CORRIGÉ avec auto-détection userId
export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      currency?: string;
      echeanceId: string | number;
      userId?: number | null; // Rendu optionnel
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
      console.log(`💳 [Hook] URL appelée:`, `${apiUrl('paiements/create-payment-intent')}`);

      const response = await fetch(`${apiUrl('paiements/create-payment-intent')}`, {
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

// MODIFIÉ: Hook pour créer un PaymentIntent avec userId obligatoire en paramètre
export const useCreatePaymentIntentSecurise = (echeanceId: string | number, montant: number, userId: number) => {
  const createPaymentIntent = useCreatePaymentIntent();
  
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
      
      console.log(`🔒 [Hook Sécurisé] Création PaymentIntent pour échéance ${echeanceId}, utilisateur ${userId} (depuis URL), montant ${montant}`);
      
      const requestData = {
        amount: montant,
        currency: options?.currency || 'eur',
        echeanceId: echeanceId,
        userId: userId, // Utilisateur depuis l'URL - toujours défini
        description: options?.description || `Paiement échéance #${echeanceId}`
      };

      console.log(`📤 [Hook Sécurisé] Données envoyées (userId depuis URL):`, requestData);

      const result = await createPaymentIntent.mutateAsync(requestData);

      console.log(`✅ [Hook Sécurisé] Succès - PaymentIntent créé avec userId depuis URL:`, result);

      return result;
    },
    onSuccess: (data) => {
      console.log(`🎉 [Hook Sécurisé] onSuccess déclenché (userId depuis URL):`, data);
      if (createPaymentIntent.onSuccess) {
        createPaymentIntent.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error(`❌ [Hook Sécurisé] onError déclenché (userId depuis URL):`, error);
      if (createPaymentIntent.onError) {
        createPaymentIntent.onError(error);
      }
    }
  });
};

// Hook pour confirmer un paiement - CORRIGÉ l'URL
export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      paymentIntentId: string;
      echeanceId: string | number;
      userId: number;
      amount: number;
    }) => {
      console.log(`✅ [Hook] Confirmation paiement:`, data);

      const response = await fetch(`${apiUrl('paiements/confirm-payment')}`, {
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

// Hook pour récupérer tous les paiements (admin) - CORRIGÉ l'URL
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

      const url = `${apiUrl(`paiements?${params.toString()}`)}`;

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

      return response.json();
    },
    staleTime: 30000
  });
};

// Hook pour créer une nouvelle échéance (admin)
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
      const response = await fetch(`${apiUrl('paiements/echeances')}`, {
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

// Hook pour supprimer une échéance (admin) - CORRIGÉ l'URL
export const useDeleteEcheance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (echeanceId: number) => {
      const response = await fetch(`${apiUrl(`paiements/echeance/${echeanceId}`)}`, {
        method: 'DELETE',
        credentials: 'include', // AJOUTÉ
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

// Hook pour créer un paiement générique
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
      console.log(`💳 [Hook] Création paiement:`, data);

      const response = await fetch(`${apiUrl('paiements')}`, {
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

// Hook pour modifier un paiement
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
      const response = await fetch(`${apiUrl(`paiements/${data.paiementId}`)}`, {
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
        throw new Error(errorData.error || 'Erreur lors de la modification du paiement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    }
  });
};

// Hook pour supprimer un paiement
export const useSupprimerPaiement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiementId: number) => {
      const response = await fetch(`${apiUrl(`paiements/${paiementId}`)}`, {
        method: 'DELETE',
        credentials: 'include', // AJOUTÉ
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

// Hook pour récupérer les paiements d'un utilisateur spécifique - CORRIGÉ l'URL
export const usePaiementsUtilisateur = (userId: number | null) => {
  return useQuery({
    queryKey: ['paiements-utilisateur', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log(`🔍 [Hook] Récupération paiements pour utilisateur: ${userId}`);

      const response = await fetch(`${apiUrl(`paiements/utilisateur/${userId}`)}`, {
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

