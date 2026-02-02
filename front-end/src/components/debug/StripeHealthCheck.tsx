import React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Button,
  Alert,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
  Label,
  Progress,
  ProgressMeasureLocation
} from '@patternfly/react-core';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  TimesCircleIcon,
  SyncAltIcon 
} from '@patternfly/react-icons';
import { useStripeDiagnostic, useStripeCompatibilityTest } from '../../hooks/usePaiements';

const StripeHealthCheck: React.FC = () => {
  const { 
    data: diagnostic, 
    isLoading: diagnosticLoading, 
    error: diagnosticError,
    refetch: refetchDiagnostic 
  } = useStripeDiagnostic();
  
  const compatibilityTest = useStripeCompatibilityTest();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'compatible':
        return <Label color="green" icon={<CheckCircleIcon />}>OPÉRATIONNEL</Label>;
      case 'warning':
        return <Label color="orange" icon={<ExclamationTriangleIcon />}>ATTENTION</Label>;
      case 'error':
      case 'incompatible':
        return <Label color="red" icon={<TimesCircleIcon />}>ERREUR</Label>;
      default:
        return <Label color="grey">INCONNU</Label>;
    }
  };

  const getHealthPercentage = (diagnostic: any) => {
    if (!diagnostic) return 0;
    
    let score = 0;
    const maxScore = 6;
    
    if (diagnostic.diagnostic?.backend?.stripe_initialized) score++;
    if (diagnostic.diagnostic?.backend?.secret_key?.exists) score++;
    if (diagnostic.diagnostic?.backend?.public_key?.exists) score++;
    if (diagnostic.diagnostic?.compatibility?.account_match) score++;
    if (diagnostic.diagnostic?.compatibility?.both_test_mode || diagnostic.diagnostic?.compatibility?.both_live_mode) score++;
    if (diagnostic.diagnostic?.stripe_api_test?.success) score++;
    
    return Math.round((score / maxScore) * 100);
  };

  if (diagnosticLoading) {
    return (
      <Card>
        <CardBody>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <div style={{ marginTop: '1rem' }}>
              Diagnostic Stripe en cours...
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (diagnosticError) {
    return (
      <Card>
        <CardTitle>🔧 Diagnostic Stripe</CardTitle>
        <CardBody>
          <Alert variant="danger" title="Erreur de diagnostic">
            <p>{diagnosticError.message}</p>
            <Button variant="primary" onClick={() => refetchDiagnostic()}>
              Réessayer
            </Button>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  const healthPercentage = getHealthPercentage(diagnostic);

  return (
    <div>
      <Card>
        <CardTitle>
          🔧 Diagnostic Stripe - Santé du Service
        </CardTitle>
        <CardBody>
          <div style={{ marginBottom: '1rem' }}>
            {getStatusIcon(diagnostic?.status)}
            <div style={{ marginTop: '10px' }}>
              <Progress
                value={healthPercentage}
                title="Santé globale"
                size="lg"
                measureLocation={ProgressMeasureLocation.top}
                variant={
                  healthPercentage >= 80 ? 'success' :
                  healthPercentage >= 60 ? 'warning' : 'danger'
                }
              />
            </div>
          </div>

          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Status Backend</DescriptionListTerm>
              <DescriptionListDescription>
                {diagnostic?.diagnostic?.backend?.stripe_initialized ? 
                  <Label color="green" icon={<CheckCircleIcon />}>Initialisé</Label> :
                  <Label color="red" icon={<TimesCircleIcon />}>Non initialisé</Label>
                }
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Clé Secrète (Backend)</DescriptionListTerm>
              <DescriptionListDescription>
                <div>
                  <Label color={diagnostic?.diagnostic?.backend?.secret_key?.exists ? 'green' : 'red'}>
                    {diagnostic?.diagnostic?.backend?.secret_key?.format || 'MANQUANTE'}
                  </Label>
                </div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  Compte: {diagnostic?.diagnostic?.backend?.secret_key?.account_id || 'N/A'}
                </div>
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Clé Publique (Frontend)</DescriptionListTerm>
              <DescriptionListDescription>
                <div>
                  <Label color={import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'green' : 'red'}>
                    {import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_') ? 'TEST' :
                     import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_') ? 'LIVE' : 'MANQUANTE'}
                  </Label>
                </div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  Compte: {import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(8, 23) || 'N/A'}
                </div>
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Compatibilité des Clés</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color={diagnostic?.diagnostic?.compatibility?.account_match ? 'green' : 'red'}>
                  {diagnostic?.diagnostic?.compatibility?.account_match ? 'Compatible' : 'Incompatible'}
                </Label>
                {diagnostic?.diagnostic?.compatibility?.both_test_mode && (
                  <Label color="orange" style={{ marginLeft: '5px' }}>MODE TEST</Label>
                )}
                {diagnostic?.diagnostic?.compatibility?.both_live_mode && (
                  <Label color="blue" style={{ marginLeft: '5px' }}>MODE LIVE</Label>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Test API Stripe</DescriptionListTerm>
              <DescriptionListDescription>
                {diagnostic?.diagnostic?.stripe_api_test?.success ? (
                  <div>
                    <Label color="green" icon={<CheckCircleIcon />}>Succès</Label>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                      Compte: {diagnostic?.diagnostic?.stripe_api_test?.response?.account_id}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label color="red" icon={<TimesCircleIcon />}>Échec</Label>
                    {diagnostic?.diagnostic?.stripe_api_test?.error && (
                      <div style={{ fontSize: '12px', marginTop: '5px', color: 'red' }}>
                        {diagnostic.diagnostic.stripe_api_test.error.message}
                      </div>
                    )}
                  </div>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>

          {diagnostic?.analysis?.recommendations && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Recommandations:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                {diagnostic.analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} style={{ 
                    color: rec.includes('🔴') ? 'red' : 
                           rec.includes('🟡') ? 'orange' : 'green',
                    fontSize: '14px'
                  }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
            <Button 
              variant="primary" 
              icon={<SyncAltIcon />}
              onClick={() => refetchDiagnostic()}
            >
              Actualiser Diagnostic
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => compatibilityTest.mutate()}
              isLoading={compatibilityTest.isPending}
            >
              {compatibilityTest.isPending ? <Spinner size="sm" /> : 'Tester Compatibilité'}
            </Button>
          </div>

          {compatibilityTest.data && (
            <Alert 
              variant={compatibilityTest.data.status === 'compatible' ? 'success' : 'danger'}
              title={`Test de Compatibilité: ${compatibilityTest.data.status.toUpperCase()}`}
              style={{ marginTop: '1rem' }}
            >
              <p>{compatibilityTest.data.recommendation}</p>
              {compatibilityTest.data.next_steps && (
                <ul>
                  {compatibilityTest.data.next_steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

          {compatibilityTest.error && (
            <Alert variant="danger" title="Erreur Test de Compatibilité" style={{ marginTop: '1rem' }}>
              {compatibilityTest.error.message}
            </Alert>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default StripeHealthCheck;
