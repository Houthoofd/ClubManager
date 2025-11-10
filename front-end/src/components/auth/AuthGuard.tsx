import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
// CORRIGÉ: Import direct des actions exportées
import { setUser, logout } from '../../redux/slices/authSlice';
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

  // Routes publiques plus complètes
  const publicRoutes = [
    '/pages/connexion', 
    '/pages/inscription', 
    '/pages/auth/forgot-password', 
    '/pages/auth/reset-password',
    '/login', 
    '/register',
    '/auth',
    '/'
  ];

  const handleLoginRedirect = () => {
    console.log('🔄 [AuthGuard] Redirection vers la page de connexion');
    window.location.href = `${window.location.origin}/pages/connexion`;
  };

  const handleRegisterRedirect = () => {
    console.log('🔄 [AuthGuard] Redirection vers la page d\'inscription');
    window.location.href = `${window.location.origin}/pages/inscription`;
  };

  const verifyAuthentication = async () => {
    try {
      console.log('🔐 [AuthGuard] Vérification authentification (production mode)...');
      
      // ÉTAPE 1: Vérifier d'abord localStorage
      const localUserData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('authToken');
      
      console.log('🔍 [AuthGuard] Données locales:', {
        hasUserData: !!localUserData,
        hasToken: !!authToken,
        userDataPreview: localUserData ? JSON.parse(localUserData).email : 'none'
      });

      if (localUserData && authToken) {
        try {
          const userData = JSON.parse(localUserData);
          
          // Vérifier la validité des données
          if (userData.id && userData.email && userData.status) {
            console.log('✅ [AuthGuard] Données locales valides trouvées');
            
            // CORRIGÉ: Utiliser setUser importé directement
            dispatch(setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.first_name || userData.firstName || '',
              lastName: userData.last_name || userData.lastName || '',
              userName: userData.nom_utilisateur || userData.userName || '',
              status: userData.status,
              role: userData.status,
              genres: userData.genres || null,
              grades: userData.grades || null,
              abonnement: userData.abonnement || null,
              dateOfBirth: userData.date_of_birth || userData.dateOfBirth || null
            }));

            setAuthError(null);
            setRetryCount(0);
            console.log('✅ [AuthGuard] Authentification locale réussie');
            return true;
          } else {
            console.warn('⚠️ [AuthGuard] Données locales incomplètes');
          }
        } catch (parseError) {
          console.error('❌ [AuthGuard] Erreur parsing données locales:', parseError);
          localStorage.removeItem('userData');
          localStorage.removeItem('authToken');
        }
      }

      // ÉTAPE 2: Vérification serveur
      console.log('🔍 [AuthGuard] Tentative vérification serveur...');
      
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000';
      
      const verifyUrl = `${apiBaseUrl}/auth/status`;
      console.log('🌐 [AuthGuard] URL de vérification:', verifyUrl);

      const response = await fetch(verifyUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log('🔐 [AuthGuard] Réponse serveur:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔐 [AuthGuard] Données serveur:', data);
        
        if (data.authentifie && data.user) {
          const userData = {
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
          };

          // CORRIGÉ: Utiliser setUser importé directement
          dispatch(setUser(userData));
          
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            first_name: userData.firstName,
            last_name: userData.lastName,
            nom_utilisateur: userData.userName,
            date_of_birth: userData.dateOfBirth
          }));
          
          setAuthError(null);
          setRetryCount(0);
          console.log('✅ [AuthGuard] Authentification serveur réussie');
          return true;
        } else {
          console.warn('⚠️ [AuthGuard] Serveur indique utilisateur non authentifié');
          return false;
        }
      } else if (response.status === 401) {
        console.warn('🚫 [AuthGuard] Session expirée (401)');
        return false;
      } else {
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }

    } catch (error: any) {
      console.error('❌ [AuthGuard] Erreur vérification authentification:', error);
      
      if (error.name === 'TimeoutError') {
        setAuthError('Délai de connexion au serveur dépassé');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setAuthError('Impossible de contacter le serveur');
      } else {
        setAuthError(`Erreur de vérification: ${error.message}`);
      }
      
      // Fallback sur les données locales en cas d'erreur serveur
      const localUserData = localStorage.getItem('userData');
      if (localUserData) {
        try {
          const userData = JSON.parse(localUserData);
          if (userData.id && userData.email) {
            console.log('⚠️ [AuthGuard] Fallback sur données locales suite à erreur serveur');
            
            // CORRIGÉ: Utiliser setUser importé directement
            dispatch(setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.first_name || userData.firstName || '',
              lastName: userData.last_name || userData.lastName || '',
              userName: userData.nom_utilisateur || userData.userName || '',
              status: userData.status,
              role: userData.status,
              genres: userData.genres || null,
              grades: userData.grades || null,
              abonnement: userData.abonnement || null,
              dateOfBirth: userData.date_of_birth || userData.dateOfBirth || null
            }));
            
            setAuthError('Mode hors ligne - données locales utilisées');
            return true;
          }
        } catch (parseError) {
          console.error('❌ [AuthGuard] Erreur parsing fallback:', parseError);
        }
      }
      
      return false;
    }
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('🔍 [AuthGuard] Vérification route:', currentPath);
    
    const isPublicRoute = publicRoutes.some(route => {
      return currentPath === route || 
             currentPath.startsWith(route + '/') || 
             (route === '/' && currentPath === '/');
    });

    if (isPublicRoute) {
      console.log('🌍 [AuthGuard] Route publique détectée:', currentPath);
      setIsVerifying(false);
      return;
    }

    console.log('🔐 [AuthGuard] Route protégée - vérification authentification...');
    
    const checkAuthentication = async () => {
      if (isAuthenticated && user) {
        console.log('✅ [AuthGuard] Utilisateur déjà authentifié dans Redux');
        setIsVerifying(false);
        return;
      }
      
      const authResult = await verifyAuthentication();
      
      if (authResult === true) {
        console.log('✅ [AuthGuard] Authentification réussie');
        setIsVerifying(false);
        setShowRedirectPage(false);
      } else {
        console.log('❌ [AuthGuard] Authentification échouée');
        // CORRIGÉ: Utiliser logout importé directement
        dispatch(logout());
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        setShowRedirectPage(true);
        setIsVerifying(false);
      }
    };

    checkAuthentication();
  }, [isAuthenticated, user, dispatch]);

  // CORRIGÉ: Vérification de route publique au rendu
  const currentPath = window.location.pathname;
  const isPublicRoute = publicRoutes.some(route => {
    return currentPath === route || 
           currentPath.startsWith(route + '/') || 
           (route === '/' && currentPath === '/');
  });

  if (isPublicRoute) {
    console.log('🌍 [AuthGuard] Route publique au rendu, accès autorisé');
    return <>{children}</>;
  }

  // État de chargement
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
              {process.env.NODE_ENV === 'production' ? 'Mode production' : 'Mode développement'}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Page de redirection si non authentifié
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
                    {authError.includes('hors ligne') && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        ℹ️ L'application fonctionne avec vos données sauvegardées
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
                    💡 <strong>Problème de connexion ?</strong><br />
                    Vérifiez votre connexion internet et réessayez.
                    {process.env.NODE_ENV === 'production' && <><br />Mode production actif.</>}
                  </p>
                </div>
              </FlexItem>

              <FlexItem spacer={{ default: 'spacerMd' }}>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#adb5bd',
                  margin: 0
                }}>
                  Club Manager - Protection des données utilisateur
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
