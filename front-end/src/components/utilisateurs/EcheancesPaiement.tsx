import React from 'react';
import {
  Title,
  Card,
  CardBody,
  Badge,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Alert,
} from '@patternfly/react-core';

interface EcheancesPaiementProps {
  paiementsEcheances: any[];
}

const EcheancesPaiement: React.FC<EcheancesPaiementProps> = ({ paiementsEcheances }) => {
  if (paiementsEcheances.length === 0) {
    return <Alert variant="info" title="Aucune échéance de paiement pour cet utilisateur." />;
  }

  const getStatusColor = (statut: string, isOverdue: boolean) => {
    const isPaid = statut === 'payé';
    if (isPaid) return { bg: '#e8f5e8', text: '#2e7d32', border: '#4caf50' };
    if (isOverdue) return { bg: '#ffebee', text: '#c62828', border: '#f44336' };
    return { bg: '#fff3e0', text: '#ef6c00', border: '#ff9800' };
  };

  const calculateDaysDifference = (dateEcheance: Date) => {
    const today = new Date();
    const diffTime = dateEcheance.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderStatusIndicator = (paiement: any, diffDays: number) => {
    const isPaid = paiement.statut === 'payé';
    
    if (isPaid) {
      return (
        <div style={{ color: '#2e7d32', fontSize: '0.9rem', fontWeight: '500' }}>
          ✓ Payé
        </div>
      );
    } else if (diffDays > 0) {
      return (
        <div style={{ color: '#ef6c00', fontSize: '0.9rem' }}>
          Dans {diffDays} jour{diffDays > 1 ? 's' : ''}
        </div>
      );
    } else if (diffDays === 0) {
      return (
        <div style={{ color: '#f57c00', fontSize: '0.9rem', fontWeight: '500' }}>
          Échéance aujourd'hui
        </div>
      );
    } else {
      return (
        <div style={{ color: '#c62828', fontSize: '0.9rem', fontWeight: '500' }}>
          En retard de {Math.abs(diffDays)} jour{Math.abs(diffDays) > 1 ? 's' : ''}
        </div>
      );
    }
  };

  return (
    <>
      <Title headingLevel="h3" style={{ marginBottom: '1.5rem' }}>
        Échéances de paiement
      </Title>
      <Gallery hasGutter>
        {paiementsEcheances.map((paiement, idx) => {
          const dateEcheance = new Date(paiement.date_echeance);
          const isOverdue = dateEcheance < new Date() && paiement.statut !== 'payé';
          const statusColor = getStatusColor(paiement.statut, isOverdue);
          const diffDays = calculateDaysDifference(dateEcheance);

          return (
            <GalleryItem key={idx}>
              <Card 
                isHoverable={true} // Correction : passer isHoverable uniquement au Card
                style={{ 
                  border: `2px solid ${statusColor.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '100%'
                }}
              >
                {/* Header avec statut */}
                <div 
                  style={{ 
                    background: statusColor.bg,
                    padding: '0.75rem',
                    borderBottom: `1px solid ${statusColor.border}`
                  }}
                >
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Badge 
                        style={{ 
                          backgroundColor: statusColor.text, 
                          color: 'white',
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {paiement.statut}
                      </Badge>
                    </FlexItem>
                    {isOverdue && (
                      <FlexItem>
                        <Badge 
                          style={{ 
                            backgroundColor: '#d32f2f', 
                            color: 'white',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.4rem'
                          }}
                        >
                          En retard
                        </Badge>
                      </FlexItem>
                    )}
                  </Flex>
                </div>
                
                {/* Corps de la carte */}
                <CardBody style={{ padding: '1.25rem' }}>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    {/* Montant */}
                    <FlexItem>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: statusColor.text }}>
                          {paiement.montant} €
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                          Montant à payer
                        </div>
                      </div>
                    </FlexItem>
                    
                    {/* Date d'échéance */}
                    <FlexItem>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#333' }}>
                          {dateEcheance.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          Date d'échéance
                        </div>
                      </div>
                    </FlexItem>
                    
                    {/* Jours restants ou en retard */}
                    <FlexItem>
                      <div style={{ textAlign: 'center' }}>
                        {renderStatusIndicator(paiement, diffDays)}
                      </div>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GalleryItem>
          );
        })}
      </Gallery>
      
      {/* Résumé des paiements */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <Title headingLevel="h4" style={{ marginBottom: '1rem' }}>
          Résumé des paiements
        </Title>
        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
          <FlexItem>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                {paiementsEcheances.filter(p => p.statut === 'payé').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Payés</div>
            </div>
          </FlexItem>
          <FlexItem>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef6c00' }}>
                {paiementsEcheances.filter(p => p.statut === 'en_attente').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>En attente</div>
            </div>
          </FlexItem>
          <FlexItem>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c62828' }}>
                {paiementsEcheances.filter(p => {
                  const dateEcheance = new Date(p.date_echeance);
                  return dateEcheance < new Date() && p.statut !== 'payé';
                }).length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>En retard</div>
            </div>
          </FlexItem>
          <FlexItem>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                {paiementsEcheances.reduce((total, p) => total + p.montant, 0)} €
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Total</div>
            </div>
          </FlexItem>
        </Flex>
      </div>
    </>
  );
};

export default EcheancesPaiement;
