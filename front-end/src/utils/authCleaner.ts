import React from 'react';
import { apiUrl } from '../pages/apiUrl';

/**
 * NOUVEAU: Nettoyer les cookies côté serveur via API
 */
export const clearServerCookies = async (): Promise<boolean> => {
  try {
    console.log('🌐 Nettoyage des cookies côté serveur...');
    
    const token = localStorage.getItem('authToken');
    
    // Essayer d'abord la route authentifiée
    if (token) {
      try {
        const response = await fetch(`${apiUrl('/auth/logout')}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Important pour envoyer les cookies
        });

        if (response.ok) {
          console.log('✅ Cookies serveur supprimés avec authentification');
          return true;
        }
      } catch (authError) {
        console.log('⚠️ Échec route authentifiée, tentative route de secours...');
      }
    }

    // Route de secours sans authentification
    const fallbackResponse = await fetch(`${apiUrl('/auth/cleanup-cookies')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (fallbackResponse.ok) {
      console.log('✅ Cookies serveur supprimés via route de secours');
      return true;
    } else {
      console.log('❌ Échec suppression cookies serveur');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors de la suppression des cookies serveur:', error);
    return false;
  }
};

/**
 * Utilitaire pour nettoyer complètement toutes les données d'authentification
 */
export const clearAllAuthData = async () => {
  console.log('🧹 Nettoyage complet des données d\'authentification...');
  
  // 1. NOUVEAU: Nettoyer côté serveur en premier
  await clearServerCookies();
  
  // 2. Nettoyer localStorage
  const localStorageKeys = [
    'authToken', 'userData', 'token', 'user',
    'auth_token', 'access_token', 'refresh_token'
  ];
  
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // 3. Nettoyer sessionStorage
  localStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // 4. Nettoyer les cookies côté client (pour ceux non HttpOnly)
  const knownAuthCookies = [
    'token', 'authToken', 'userData', 'user', 'auth_token',
    'access_token', 'refresh_token', 'sessionId', 'session', 'jwt', 'JWT'
  ];

  knownAuthCookies.forEach(cookieName => {
    const deletionStrategies = [
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=`,
      `${cookieName}=; max-age=0; path=/`,
      `${cookieName}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    ];
    
    deletionStrategies.forEach(strategy => {
      document.cookie = strategy;
    });
  });

  // 5. Nettoyer tous les autres cookies d'authentification détectés
  const authCookiePatterns = ['auth', 'token', 'user', 'session', 'jwt'];
  
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    
    if (name.length === 0) return;
    
    const isAuthCookie = authCookiePatterns.some(pattern => 
      name.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isAuthCookie) {
      console.log(`🎯 Cookie d'authentification côté client détecté: "${name}"`);
      
      const deletionStrategies = [
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=`,
        `${name}=; max-age=0; path=/`
      ];
      
      deletionStrategies.forEach(strategy => {
        document.cookie = strategy;
      });
    }
  });

  // 6. Vérification finale et log des cookies restants
  const remainingCookies = document.cookie.split(';').filter(c => c.trim().length > 0);
  if (remainingCookies.length > 0) {
    console.log('⚠️ Cookies restants après nettoyage:', remainingCookies);
    
    // Dernière tentative agressive pour les cookies persistants
    remainingCookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (authCookiePatterns.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()))) {
        console.log(`🚨 Cookie persistant détecté: "${name}" - Suppression forcée`);
        
        // Suppression ultra-agressive
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=; SameSite=None; Secure=false`;
        document.cookie = `${name}=; max-age=0; path=/; domain=`;
        document.cookie = `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  } else {
    console.log('✅ Tous les cookies supprimés avec succès');
  }
  
  // 7. Forcer le rafraîchissement de l'état d'authentification
  window.dispatchEvent(new Event('auth-cleared'));
  
  console.log('✅ Nettoyage complet terminé (client + serveur)');
};

/**
 * Hook pour nettoyer l'authentification au montage d'un composant
 */
export const useClearAuthOnMount = () => {
  React.useEffect(() => {
    clearAllAuthData();
  }, []);
};

/**
 * Vérifier si un utilisateur est authentifié
 */
export const isUserAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (!token || !userData) {
    return false;
  }

  try {
    const userDataParsed = JSON.parse(userData);
    return !!(userDataParsed.id && userDataParsed.email);
  } catch {
    return false;
  }
};

/**
 * NOUVEAU: Fonction de diagnostic pour déboguer les cookies
 */
export const debugCookies = () => {
  console.log('🔍 DIAGNOSTIC COOKIES:');
  console.log('📋 Tous les cookies actuels:');
  
  if (document.cookie.length === 0) {
    console.log('   ✅ Aucun cookie présent');
    return;
  }
  
  document.cookie.split(';').forEach((cookie, index) => {
    const [name, value] = cookie.split('=').map(s => s.trim());
    const isAuth = ['auth', 'token', 'user', 'session', 'jwt'].some(pattern => 
      name.toLowerCase().includes(pattern.toLowerCase())
    );
    
    console.log(`   ${index + 1}. ${isAuth ? '🔐' : '📄'} "${name}" = "${value?.substring(0, 20)}${value?.length > 20 ? '...' : ''}"`);
  });
  
  console.log('🌐 Domaine actuel:', window.location.hostname);
  console.log('📁 Chemin actuel:', window.location.pathname);
};
