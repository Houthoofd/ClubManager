import React, { useEffect, useState } from 'react';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  Title,
  Button,
  Flex,
  FlexItem,
  Icon,
  Alert,
} from '@patternfly/react-core';
import { LockIcon, UserIcon, PlusCircleIcon } from '@patternfly/react-icons';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [showRedirectPage, setShowRedirectPage] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = ['/pages/connexion', '/pages/inscription', '/login', '/register'];

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

  useEffect(() => {
    // Ne pas vérifier l'auth sur les routes publiques
    if (publicRoutes.includes(window.location.pathname)) {
      return;
    }

    console.log('🔐 [AuthGuard] Vérification authentification...');
    
    const userData = localStorage.getItem('userData');
    
    if (!userData) {
      console.log('⚠️ [AuthGuard] Aucune donnée utilisateur trouvée');
      setAuthError('Session expirée ou aucune connexion détectée');
      setShowRedirectPage(true);
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      console.log('✅ [AuthGuard] Utilisateur authentifié:', parsedData.email);
      // Utilisateur valide, pas besoin d'afficher la page de redirection
      setShowRedirectPage(false);
    } catch (error) {
      console.error('❌ [AuthGuard] Données utilisateur corrompues:', error);
      localStorage.removeItem('userData');
      setAuthError('Données de session corrompues');
      setShowRedirectPage(true);
    }
  }, []);

  // Pour les routes publiques, afficher directement le contenu
  if (publicRoutes.includes(window.location.pathname)) {
    console.log('🌍 [AuthGuard] Route publique, accès autorisé');
    return <>{children}</>;
  }

  // Vérifier à nouveau avant le rendu pour les routes protégées
  const userData = localStorage.getItem('userData');
  
  if (!userData || showRedirectPage) {
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
                    💡 <strong>Première visite ?</strong><br />
                    Créez votre compte pour accéder aux cours, au magasin et à votre espace personnel.
                  </p>
                </div>
              </FlexItem>

              <FlexItem spacer={{ default: 'spacerMd' }}>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#adb5bd',
                  margin: 0
                }}>
                  Club Manager - Gestion des membres et des cours
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
