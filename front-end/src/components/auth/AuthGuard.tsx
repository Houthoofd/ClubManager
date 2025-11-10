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

  // AJOUTÉ: Fonction pour vérifier la présence du cookie token
  const getCookie = (name: string): string | null => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue || null;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ [AuthGuard] Erreur lecture cookie:', error);
      return null;
    }
  };

  const verifyAuthentication = async () => {
    try {
      console.log('🔐 [AuthGuard] Vérification authentification (production mode)...');
      
      // ÉTAPE 1: Vérifier d'abord localStorage
      const localUserData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('authToken');
      const cookieToken = getCookie('token');
      
      console.log('🔍 [AuthGuard] Données locales:', {
        hasUserData: !!localUserData,
        hasLocalStorageToken: !!authToken,
        hasCookieToken: !!cookieToken,
        userDataPreview: localUserData ? JSON.parse(localUserData).email : 'none'
      });

      // MODIFIÉ: Considérer comme authentifié si on a userData ET un token
      const hasValidToken = authToken || cookieToken;
      const hasValidUserData = localUserData;

      if (hasValidUserData && hasValidToken) {
        try {
          const userData = JSON.parse(localUserData);
          
          if (userData.id && userData.email && userData.status) {
            console.log('✅ [AuthGuard] Données locales ET token valides trouvés');
            
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
            console.log('✅ [AuthGuard] Authentification locale réussie (userData + token)');
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

      // ÉTAPE 2: Vérification serveur seulement si nécessaire
      console.log('🔍 [AuthGuard] Tentative vérification serveur...');
      
      // CORRIGÉ: Construire l'URL correctement selon l'environnement
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000';
      
      // AJOUTÉ: Vérifier si on est sur le bon domaine
      const currentDomain = window.location.hostname;
      console.log('🌐 [AuthGuard] Domaine actuel:', currentDomain);
      
      let verifyUrl: string;
      if (process.env.NODE_ENV === 'production') {
        // En production, utiliser le même domaine
        verifyUrl = `${window.location.origin}/auth/status`;
      } else {
        // En développement, utiliser l'API backend
        verifyUrl = `http://localhost:3000/auth/status`;
      }
      
      console.log('🌐 [AuthGuard] URL de vérification:', verifyUrl);

      const tokenToUse = cookieToken || authToken;
      
      try {
        const response = await fetch(verifyUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(tokenToUse && { 'Authorization': `Bearer ${tokenToUse}` })
          },
          signal: AbortSignal.timeout(8000) // Réduire le timeout
        });

        console.log('🔐 [AuthGuard] Réponse serveur:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          url: response.url,
          tokenUsed: tokenToUse ? 'Bearer token' : 'cookies only'
        });

        // AJOUTÉ: Vérifier le content-type avant de parser
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ [AuthGuard] Réponse non-JSON reçue:', {
            contentType,
            status: response.status,
            url: response.url
          });
          
          // En production, si l'API n'est pas accessible, utiliser les données locales
          if (process.env.NODE_ENV === 'production' && localUserData && hasValidToken) {
            console.log('🔄 [AuthGuard] Fallback production - utilisation des données locales');
            const userData = JSON.parse(localUserData);
            
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
            
            setAuthError('Mode hors ligne - API non accessible');
            return true;
          }
          
          throw new Error(`Réponse non-JSON: ${contentType} (status: ${response.status})`);
        }

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

            dispatch(setUser(userData));
            
            localStorage.setItem('userData', JSON.stringify({
              ...userData,
              first_name: userData.firstName,
              last_name: userData.lastName,
              nom_utilisateur: userData.userName,
              date_of_birth: userData.dateOfBirth
            }));

            if (data.token) {
              localStorage.setItem('authToken', data.token);
            }
            
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
        } else if (response.status === 404) {
          console.warn('🚫 [AuthGuard] Route auth/status non trouvée (404)');
          
          // AJOUTÉ: En cas de 404, utiliser les données locales si disponibles
          if (localUserData && hasValidToken) {
            console.log('🔄 [AuthGuard] Fallback 404 - utilisation des données locales');
            const userData = JSON.parse(localUserData);
            
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
            
            setAuthError('API non disponible - données locales utilisées');
            return true;
          }
          
          return false;
        } else {
          throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
        }

      } catch (fetchError: any) {
        console.error('❌ [AuthGuard] Erreur fetch:', fetchError);
        
        // AJOUTÉ: Gestion spécifique des erreurs de réseau
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          setAuthError('Impossible de contacter le serveur d\'authentification');
        } else if (fetchError.name === 'TimeoutError') {
          setAuthError('Délai de connexion au serveur dépassé');
        } else if (fetchError.message.includes('Unexpected token')) {
          setAuthError('Erreur de communication avec le serveur (réponse invalide)');
        } else {
          setAuthError(`Erreur de vérification: ${fetchError.message}`);
        }
        
        // Fallback intelligent sur les données locales
        if (localUserData && hasValidToken) {
          try {
            const userData = JSON.parse(localUserData);
            if (userData.id && userData.email) {
              console.log('⚠️ [AuthGuard] Fallback sur données locales suite à erreur serveur');
              
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

    } catch (error: any) {
      console.error('❌ [AuthGuard] Erreur générale vérification authentification:', error);
      setAuthError(`Erreur système: ${error.message}`);
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

    console.log('🔐 [AuthGuard] Route protégée - vérification authentification complète...');
    
    const checkAuthentication = async () => {
      // Vérifier d'abord Redux
      if (isAuthenticated && user) {
        console.log('✅ [AuthGuard] Utilisateur déjà authentifié dans Redux');
        setIsVerifying(false);
        return;
      }
      
      // Sinon, vérifier via la fonction de vérification complète
      const authResult = await verifyAuthentication();
      
      if (authResult === true) {
        console.log('✅ [AuthGuard] Authentification complète réussie');
        setIsVerifying(false);
        setShowRedirectPage(false);
      } else {
        console.log('❌ [AuthGuard] Authentification complète échouée');
        // Nettoyer toutes les données d'authentification
        dispatch(logout());
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        // Note: On ne peut pas supprimer les cookies depuis le client, ils seront gérés côté serveur
        setShowRedirectPage(true);
        setIsVerifying(false);
      }
    };

    checkAuthentication();
  }, [isAuthenticated, user, dispatch]);

  // MODIFIÉ: Vérification finale avant le rendu plus stricte
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

  // MODIFIÉ: Vérification finale plus stricte avant d'afficher la page de redirection
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  const cookieToken = getCookie('token');
  const reduxAuthenticated = isAuthenticated && user;
  const hasCompleteAuth = userData && (authToken || cookieToken);

  if (!reduxAuthenticated && (!hasCompleteAuth || showRedirectPage)) {
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

              {/* AJOUTÉ: Debug info en développement */}
              {process.env.NODE_ENV === 'development' && (
                <FlexItem spacer={{ default: 'spacerMd' }} style={{ width: '100%' }}>
                  <Alert 
                    variant="info" 
                    title="Debug Authentication (Dev Mode)"
                    style={{ marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.8rem' }}
                  >
                    <div>userData: {!!userData ? '✅' : '❌'}</div>
                    <div>authToken (localStorage): {!!authToken ? '✅' : '❌'}</div>
                    <div>token (cookie): {!!cookieToken ? '✅' : '❌'}</div>
                    <div>Redux user: {!!user ? '✅' : '❌'}</div>
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

  console.log('✅ [AuthGuard] Utilisateur authentifié avec données complètes, accès accordé');
  return <>{children}</>;
};

export default AuthGuard;
