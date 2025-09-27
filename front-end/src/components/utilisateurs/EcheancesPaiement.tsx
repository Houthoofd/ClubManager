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

  // Fonction pour calculer les jours restants (corrigée)
  const calculateDaysRemaining = (echeance: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
    const echeanceDate = new Date(echeance);
    echeanceDate.setHours(0, 0, 0, 0); // Reset time to midnight
    
    // Vérifier si la date est valide
    if (isNaN(echeanceDate.getTime())) {
      return 0; // Return 0 if date is invalid
    }
    
    const diffTime = echeanceDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  // Trier les paiements par ordre de priorité (échéances les plus proches en premier)
  const sortedPaiements = [...paiementsEcheances].sort((a, b) => {
    const daysA = calculateDaysRemaining(a.date_echeance || a.echeance);
    const daysB = calculateDaysRemaining(b.date_echeance || b.echeance);
    return daysA - daysB; // Ordre croissant (échéances les plus proches en premier)
  });

  return (
    <div>
      <Title headingLevel="h3" style={{ marginBottom: '1.5rem' }}>
        Échéances de paiement
      </Title>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1rem',
        gridAutoFlow: 'row'
      }}>
        {sortedPaiements.map((paiement, index) => {
          const daysRemaining = calculateDaysRemaining(paiement.date_echeance || paiement.echeance);
          
          return (
            <Card key={index} style={{ 
              padding: '0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header avec statut */}
              <div 
                style={{ 
                  background: getStatusColor(paiement.statut, false).bg,
                  padding: '0.75rem',
                  borderBottom: `1px solid ${getStatusColor(paiement.statut, false).border}`
                }}
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(paiement.statut, false).text, 
                        color: 'white',
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.5rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {paiement.statut}
                    </Badge>
                  </FlexItem>
                  {daysRemaining < 0 && (
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
              <CardBody style={{ 
                padding: '1.25rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }} style={{ height: '100%' }}>
                  {/* Montant */}
                  <FlexItem style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getStatusColor(paiement.statut, false).text }}>
                        {paiement.montant} €
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        Montant à payer
                      </div>
                    </div>
                  </FlexItem>
                  
                  {/* Date d'échéance */}
                  <FlexItem style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#333' }}>
                        {new Date(paiement.date_echeance || paiement.echeance).toLocaleDateString('fr-FR', {
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
                  
                  {/* Jours restants */}
                  <FlexItem style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: daysRemaining <= 7 ? '#dc3545' : daysRemaining <= 30 ? '#ffc107' : '#28a745',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        {isNaN(daysRemaining) ? 'Date invalide' : 
                         daysRemaining < 0 ? `Échu depuis ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}` : 
                         daysRemaining === 0 ? 'Échéance aujourd\'hui' :
                         `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          );
        })}
      </div>
      
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
    </div>
  );
};

export default EcheancesPaiement;
