import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
// CORRIGÉ: Import direct des actions exportées
import { setUser, logout } from '../../redux/slices/authSlice';
import { apiUrl } from '../../pages/apiUrl';
import {
  Card,
  CardBody,
  Title,
  Button,
  Flex,
  FlexItem,
  Icon,
  Alert,
  Spinner,
} from '@patternfly/react-core';
import { LockIcon, UserIcon, PlusCircleIcon } from '@patternfly/react-icons';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [showRedirectPage, setShowRedirectPage] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = ['/pages/connexion', '/pages/inscription', '/login', '/register', '/pages/auth/forgot-password', '/pages/auth/reset-password'];

  // Fonction pour redirection vers connexion
  const handleLoginRedirect = () => {
    console.log('🔄 [AuthGuard] Redirection vers la page de connexion');
    window.location.href = `${window.location.origin}/pages/connexion`;
  };

  // Fonction pour redirection vers inscription
  const handleRegisterRedirect = () => {
    console.log('🔄 [AuthGuard] Redirection vers la page d\'inscription');
    window.location.href = `${window.location.origin}/pages/inscription`;
  };

  // Fonction pour vérifier l'authentification côté serveur avec apiUrl
  const verifyServerAuthentication = async () => {
    try {
      console.log('🔐 [AuthGuard] Vérification authentification serveur...');
      
      const url = apiUrl('auth/status');
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔐 [AuthGuard] Réponse serveur:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔐 [AuthGuard] Données utilisateur serveur:', data);
        
        if (data.authentifie && data.user) {
          // CORRIGÉ: Utiliser les actions importées directement
          dispatch(setUser({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            userName: data.user.nom_utilisateur || '',
            status: data.user.status,
            role: data.user.status,
            genres: data.user.genres,
            grades: data.user.grades,
            abonnement: data.user.abonnement,
            dateOfBirth: data.user.date_of_birth
          }));
          
          // Synchroniser avec localStorage pour compatibilité
          localStorage.setItem('userData', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            userName: data.user.nom_utilisateur || '',
            status: data.user.status,
            isAuthenticated: true
          }));
          
          setAuthError(null);
          setRetryCount(0);
          console.log('✅ [AuthGuard] Utilisateur authentifié par le serveur');
          return true;
        } else {
          console.warn('⚠️ [AuthGuard] Serveur indique utilisateur non authentifié');
          return false;
        }
      } else if (response.status === 401) {
        console.warn('🚫 [AuthGuard] Session expirée (401)');
        return false;
      } else {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ [AuthGuard] Erreur vérification serveur:', error);
      
      if (retryCount < 2) {
        console.log(`🔄 [AuthGuard] Tentative ${retryCount + 1}/3 dans 2s...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => verifyServerAuthentication(), 2000);
        return null;
      }
      
      setAuthError(`Erreur de connexion: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    // Ne pas vérifier l'auth sur les routes publiques
    if (publicRoutes.some(route => window.location.pathname.startsWith(route))) {
      console.log('🌍 [AuthGuard] Route publique détectée:', window.location.pathname);
      setIsVerifying(false);
      return;
    }

    console.log('🔐 [AuthGuard] Initialisation vérification authentification...');
    
    const checkAuthentication = async () => {
      // ÉTAPE 1: Vérifier Redux d'abord (plus rapide)
      if (isAuthenticated && user) {
        console.log('✅ [AuthGuard] Utilisateur déjà authentifié dans Redux');
        setIsVerifying(false);
        return;
      }
      
      // ÉTAPE 2: Vérifier localStorage comme fallback
      const localUserData = localStorage.getItem('userData');
      if (localUserData) {
        try {
          const userData = JSON.parse(localUserData);
          if (userData.isAuthenticated) {
            console.log('🔍 [AuthGuard] Utilisateur trouvé dans localStorage, vérification serveur...');
          }
        } catch (e) {
          console.warn('⚠️ [AuthGuard] Données localStorage corrompues');
          localStorage.removeItem('userData');
        }
      }
      
      // ÉTAPE 3: Vérification serveur (obligatoire en production)
      const serverAuthResult = await verifyServerAuthentication();
      
      if (serverAuthResult === null) {
        return;
      }
      
      if (serverAuthResult === true) {
        console.log('✅ [AuthGuard] Authentification serveur réussie');
        setIsVerifying(false);
      } else {
        console.log('❌ [AuthGuard] Authentification serveur échouée');
        // CORRIGÉ: Utiliser l'action logout importée directement
        dispatch(logout());
        localStorage.removeItem('userData');
        setAuthError('Session expirée ou invalide');
        setShowRedirectPage(true);
        setIsVerifying(false);
      }
    };

    checkAuthentication();
  }, [isAuthenticated, user, dispatch, retryCount]);

  // Pour les routes publiques, afficher directement le contenu
  if (publicRoutes.some(route => window.location.pathname.startsWith(route))) {
    console.log('🌍 [AuthGuard] Route publique, accès autorisé');
    return <>{children}</>;
  }

  // État de chargement pendant la vérification
  if (isVerifying) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 9999
      }}>
        <Card style={{ 
          maxWidth: '500px', 
          width: '90%',
          textAlign: 'center'
        }}>
          <CardBody style={{ padding: '3rem' }}>
            <Spinner size="xl" />
            <div style={{ marginTop: '1rem', color: '#6c757d' }}>
              {retryCount > 0 
                ? `Vérification authentification (tentative ${retryCount}/3)...`
                : 'Vérification de l\'authentification...'
              }
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#adb5bd' }}>
              Connexion au serveur en cours...
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Vérifier à nouveau avant le rendu pour les routes protégées
  const userData = localStorage.getItem('userData');
  const reduxAuthenticated = isAuthenticated && user;
  
  if (!reduxAuthenticated && (!userData || showRedirectPage)) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 9999,
        overflow: 'auto'
      }}>
        <Card style={{ 
          maxWidth: '600px', 
          width: '90%',
          margin: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderRadius: '12px'
        }}>
          <CardBody style={{ padding: '3rem', textAlign: 'center' }}>
            <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Icon size="xl" status="warning">
                  <LockIcon />
                </Icon>
              </FlexItem>
              
              <FlexItem spacer={{ default: 'spacerMd' }}>
                <Title headingLevel="h1" size="2xl" style={{ color: '#2c3e50' }}>
                  Authentification requise
                </Title>
              </FlexItem>

              <FlexItem spacer={{ default: 'spacerMd' }}>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#7f8c8d', 
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  Vous devez être connecté pour accéder à cette application.
                </p>
              </FlexItem>

              {authError && (
                <FlexItem spacer={{ default: 'spacerMd' }} style={{ width: '100%' }}>
                  <Alert 
                    variant="warning" 
                    title="Problème d'authentification"
                    style={{ marginBottom: '1.5rem', textAlign: 'left' }}
                  >
                    {authError}
                    {retryCount > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Tentatives de reconnexion : {retryCount}/3
                      </div>
                    )}
                  </Alert>
                </FlexItem>
              )}

              <FlexItem spacer={{ default: 'spacerLg' }}>
                <Flex gap={{ default: 'gapLg' }} direction={{ default: 'column', md: 'row' }}>
                  <FlexItem>
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleLoginRedirect}
                      icon={<UserIcon />}
                      style={{ minWidth: '200px' }}
                    >
                      Se connecter
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button 
                      variant="secondary"
                      size="lg"
                      onClick={handleRegisterRedirect}
                      icon={<PlusCircleIcon />}
                      style={{ minWidth: '200px' }}
                    >
                      Créer un compte
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem spacer={{ default: 'spacerLg' }}>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #007bff'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.9rem', 
                    color: '#6c757d' 
                  }}>
                    💡 <strong>Session expirée ?</strong><br />
                    Reconnectez-vous pour accéder à votre espace personnel et continuer à utiliser l'application.
                  </p>
                </div>
              </FlexItem>

              <FlexItem spacer={{ default: 'spacerMd' }}>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#adb5bd',
                  margin: 0
                }}>
                  Club Manager - Authentification sécurisée
                </p>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </div>
    );
  }

  console.log('✅ [AuthGuard] Utilisateur authentifié, accès accordé');
  return <>{children}</>;
};

export default AuthGuard;
