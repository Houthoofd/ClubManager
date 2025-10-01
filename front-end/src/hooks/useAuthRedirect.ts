import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllAuthData } from '../utils/authCleaner';

interface UseAuthRedirectOptions {
  autoRedirectDelay?: number;
  checkInterval?: number;
  customMessage?: string;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const {
    autoRedirectDelay = 5,
    checkInterval = 30000, // Vérifier toutes les 30 secondes
    customMessage
  } = options;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Fonction pour vérifier si l'utilisateur est authentifié
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    // Vérifier la validité du token (basique)
    if (!token || !userData) {
      return false;
    }

    try {
      const userDataParsed = JSON.parse(userData);
      if (!userDataParsed.id || !userDataParsed.email) {
        return false;
      }

      // Vérifier si le token JWT n'est pas expiré
      if (token.startsWith('eyJ')) { // JWT token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          return false; // Token expiré
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
  };

  // Fonction pour déclencher la modal d'authentification
  const triggerAuthRequired = (message?: string) => {
    console.log('🔒 Authentification requise - Affichage de la modal');
    
    // Nettoyer les données corrompues/expirées
    clearAllAuthData();
    
    setShowAuthModal(true);
  };

  // Fonction pour rediriger vers la connexion
  const redirectToLogin = () => {
    console.log('🔄 Redirection vers la page de connexion');
    setShowAuthModal(false);
    clearAllAuthData();
    navigate('/pages/connexion');
  };

  // Vérification périodique de l'authentification
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!checkAuthStatus()) {
        triggerAuthRequired();
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval]);

  // Vérification au montage du composant
  useEffect(() => {
    if (!checkAuthStatus()) {
      triggerAuthRequired();
    }
  }, []);

  // Écouter les événements de nettoyage d'authentification
  useEffect(() => {
    const handleAuthCleared = () => {
      triggerAuthRequired('Votre session a été fermée.');
    };

    window.addEventListener('auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('auth-cleared', handleAuthCleared);
  }, []);

  return {
    showAuthModal,
    redirectToLogin,
    triggerAuthRequired,
    checkAuthStatus,
    customMessage: customMessage || "Votre session a expiré ou vous n'êtes pas connecté.",
    autoRedirectDelay
  };
};
