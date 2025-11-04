import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  Title,
  Spinner,
  Progress,
  Button,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon, LockIcon } from '@patternfly/react-icons';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRedirectPage, setShowRedirectPage] = useState(false);

  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = ['/pages/connexion', '/pages/inscription', '/login', '/register'];

  useEffect(() => {
    // Ne pas vérifier l'auth sur les routes publiques
    if (publicRoutes.includes(location.pathname)) {
      return;
    }

    const userData = localStorage.getItem('userData');
    
    if (!userData) {
      // Afficher la page de redirection mais ne pas rediriger immédiatement
      setShowRedirectPage(true);
      // Démarrer le timer après un court délai pour que l'utilisateur voie la page
      setTimeout(() => setIsRedirecting(true), 100);
      return;
    }

    try {
      JSON.parse(userData);
    } catch (error) {
      localStorage.removeItem('userData');
      setShowRedirectPage(true);
      setTimeout(() => setIsRedirecting(true), 100);
    }
  }, [location.pathname]);

  // Timer de redirection - démarrer seulement quand isRedirecting est true
  useEffect(() => {
    if (!isRedirecting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/pages/connexion', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRedirecting, navigate]);

  // Pour les routes publiques, afficher directement le contenu
  if (publicRoutes.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Vérifier à nouveau avant le rendu pour les routes protégées
  const userData = localStorage.getItem('userData');
  
  if (!userData || showRedirectPage) {
    const progressValue = ((10 - countdown) / 10) * 100;

    return (
      <Page>
        <PageSection 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardBody style={{ padding: '2rem', textAlign: 'center' }}>
              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Icon size="xl" status="warning">
                    <LockIcon />
                  </Icon>
                </FlexItem>
                
                <FlexItem spacer={{ default: 'spacerMd' }}>
                  <Title headingLevel="h1" size="2xl" style={{ color: '#2c3e50' }}>
                    Accès non autorisé
                  </Title>
                </FlexItem>

                <FlexItem spacer={{ default: 'spacerMd' }}>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    color: '#7f8c8d', 
                    marginBottom: '1.5rem',
                    lineHeight: '1.6'
                  }}>
                    Vous devez être connecté pour accéder à cette page.
                    <br />
                    Redirection automatique dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}...
                  </p>
                </FlexItem>

                <FlexItem spacer={{ default: 'spacerMd' }} style={{ width: '100%' }}>
                  <Progress 
                    value={progressValue} 
                    title="Redirection en cours"
                    variant="info"
                    style={{ marginBottom: '1.5rem' }}
                  />
                </FlexItem>

                <FlexItem>
                  <Flex gap={{ default: 'gapMd' }}>
                    <FlexItem>
                      <Button 
                        variant="primary" 
                        onClick={() => navigate('/pages/connexion', { replace: true })}
                        style={{ minWidth: '140px' }}
                      >
                        Se connecter maintenant
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/pages/inscription', { replace: true })}
                      >
                        Créer un compte
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>

                <FlexItem spacer={{ default: 'spacerMd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Spinner size="md" />
                    <span style={{ color: '#95a5a6', fontSize: '0.9rem' }}>
                      Préparation de la redirection...
                    </span>
                  </div>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </PageSection>
      </Page>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
