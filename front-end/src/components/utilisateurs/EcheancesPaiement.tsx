import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  CardBody,
  Title,
  Button,
  Alert,
  Flex,
  FlexItem,
  Badge,
} from '@patternfly/react-core';
import { EnvelopeIcon, CreditCardIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import { apiUrl } from '../../pages/apiUrl';

interface EcheancesPaiementProps {
  paiementsEcheances: any[];
  userId?: number;
}

const EcheancesPaiement: React.FC<EcheancesPaiementProps> = ({ 
  paiementsEcheances, 
  userId 
}) => {
  const location = useLocation();
  const [rappelLoading, setRappelLoading] = useState<{ [key: number]: boolean }>({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  // AJOUTÉ: Vérifications de sécurité pour éviter l'erreur undefined.length
  console.log('🔍 [EcheancesPaiement] Props reçues:', {
    paiementsEcheances: paiementsEcheances,
    paiementsEcheances_type: typeof paiementsEcheances,
    paiementsEcheances_isArray: Array.isArray(paiementsEcheances),
    paiementsEcheances_length: paiementsEcheances?.length,
    userId: userId,
    location_pathname: location.pathname
  });

  // AJOUTÉ: Vérification de sécurité critique
  if (!paiementsEcheances) {
    console.warn('⚠️ [EcheancesPaiement] paiementsEcheances est undefined/null');
    return (
      <Alert variant="info" title="Chargement des échéances...">
        <p>Les données des échéances sont en cours de chargement.</p>
      </Alert>
    );
  }

  if (!Array.isArray(paiementsEcheances)) {
    console.error('❌ [EcheancesPaiement] paiementsEcheances n\'est pas un tableau:', {
      type: typeof paiementsEcheances,
      value: paiementsEcheances
    });
    return (
      <Alert variant="danger" title="Erreur de données">
        <p>Les données des échéances ne sont pas dans le format attendu.</p>
      </Alert>
    );
  }

  // Déterminer si on est sur la page compte
  const isComptePage = location.pathname.includes('/compte');

  // Fonction pour envoyer un rappel de paiement
  // MODIFIÉ: Fonction pour envoyer un rappel avec plus de détails
  const handleEnvoyerRappel = async (echeanceId: number, userId: number) => {
    setRappelLoading(prev => ({ ...prev, [echeanceId]: true }));
    
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('userData') || '{}').token;

      // Trouver les détails de l'échéance
      const echeance = paiementsEcheances.find(e => e.id === echeanceId);
      
      console.log('📧 [Frontend] Envoi rappel pour:', { 
        echeanceId, 
        userId, 
        montant: echeance?.montant,
        dateEcheance: echeance?.date_echeance 
      });

      const response = await fetch(apiUrl('messages/envoyer-rappel'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId,
          typeRappel: 'paiement',
          echeanceId: echeanceId,
          montant: echeance?.montant,
          dateEcheance: echeance?.date_echeance
        })
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Réponse non-JSON reçue:', textResponse);
        throw new Error('Réponse serveur inattendue (non-JSON)');
      }

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Rappel envoyé avec succès:', data);
        
        let successMessage = 'Rappel de paiement envoyé avec succès !';
        
        if (data.data?.emailEnvoye) {
          if (data.data.emailEnvoye.success) {
            successMessage += `\n📧 Email envoyé à ${data.data.emailEnvoye.email}`;
            if (data.data.emailEnvoye.messageId) {
              successMessage += `\n🆔 ID: ${data.data.emailEnvoye.messageId}`;
            }
          } else {
            successMessage += `\n⚠️ Email non envoyé: ${data.data.emailEnvoye.error}`;
          }
        } else {
          successMessage += '\n⚠️ Aucun email configuré pour cet utilisateur';
        }
        
        alert(successMessage);
      } else {
        console.error('❌ Erreur serveur:', data);
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur envoi rappel:', error);
      
      let errorMessage = 'Erreur lors de l\'envoi du rappel.';
      
      if (error.message.includes('403') || error.message.includes('Permissions')) {
        errorMessage = 'Vous n\'avez pas les permissions pour envoyer des rappels.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Service de rappel non disponible.';
      } else if (error.message.includes('non-JSON')) {
        errorMessage = 'Erreur de communication avec le serveur.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setRappelLoading(prev => ({ ...prev, [echeanceId]: false }));
    }
  };

  // MODIFIÉ: Fonction pour rediriger vers le paiement AVEC userId
  const handleAllerPaiement = (echeanceId: number) => {
    const userIdToUse = userId || 
                       paiementsEcheances.find(e => e?.id === echeanceId)?.utilisateur_id ||
                       JSON.parse(localStorage.getItem('userData') || '{}')?.id;
    
    console.log(`🔗 [EcheancesPaiement] Génération URL paiement:`, {
      echeanceId,
      userId: userIdToUse,
      userIdProp: userId,
      fromEcheance: paiementsEcheances.find(e => e?.id === echeanceId)?.utilisateur_id
    });

    if (userIdToUse) {
      const urlPaiement = `/pages/paiement?echeance=${echeanceId}&userId=${userIdToUse}`;
      console.log(`✅ [EcheancesPaiement] Redirection vers: ${urlPaiement}`);
      window.location.href = urlPaiement;
    } else {
      console.error(`❌ [EcheancesPaiement] Aucun userId trouvé pour l'échéance ${echeanceId}`);
      window.location.href = `/pages/paiement?echeance=${echeanceId}`;
    }
  };

  // Fonction pour déterminer si un paiement est échu
  const isPaiementEchu = (dateEcheance: string) => {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    return echeance < today;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // MODIFIÉ: Vérification de sécurité avant d'accéder à .length
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
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
        Échéances de paiement
      </Title>

      {/* MODIFIÉ: Double vérification avec fallback sécurisé */}
      {!paiementsEcheances || !Array.isArray(paiementsEcheances) || paiementsEcheances.length === 0 ? (
        <Alert variant="info" title="Aucune échéance de paiement" />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {paiementsEcheances.map((echeance, index) => {
            // AJOUTÉ: Vérification de sécurité pour chaque échéance
            if (!echeance || typeof echeance !== 'object') {
              console.warn(`⚠️ [EcheancesPaiement] Échéance invalide à l'index ${index}:`, echeance);
              return null;
            }

            const isEchu = isPaiementEchu(echeance.date_echeance);
            const isLoading = rappelLoading[echeance.id] || false;

            return (
              <Card key={echeance.id || `echeance-${index}`} style={{ 
                border: isEchu ? '2px solid #dc3545' : '1px solid #dee2e6' 
              }}>
                <CardBody>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              <Title headingLevel="h4" size="lg">
                                {echeance.description || 'Paiement d\'abonnement'}
                              </Title>
                            </FlexItem>
                            {isEchu && (
                              <FlexItem>
                                <Badge variant="outline" color="red">
                                  <ExclamationTriangleIcon style={{ marginRight: '4px' }} />
                                  Échu
                                </Badge>
                              </FlexItem>
                            )}
                          </Flex>
                        </FlexItem>
                        
                        <FlexItem>
                          <div style={{ color: '#6a6e73', fontSize: '14px' }}>
                            <strong>Montant:</strong> {echeance.montant || 0}€
                          </div>
                        </FlexItem>
                        
                        <FlexItem>
                          <div style={{ color: '#6a6e73', fontSize: '14px' }}>
                            <strong>Date d'échéance:</strong> {formatDate(echeance.date_echeance)}
                          </div>
                        </FlexItem>
                        
                        <FlexItem>
                          <div style={{ color: '#6a6e73', fontSize: '14px' }}>
                            <strong>Statut:</strong> 
                            <Badge 
                              variant="outline" 
                              color={echeance.statut === 'payé' ? 'green' : 'orange'}
                              style={{ marginLeft: '8px' }}
                            >
                              {echeance.statut || 'En attente'}
                            </Badge>
                          </div>
                        </FlexItem>
                      </Flex>
                    </FlexItem>

                    {/* Boutons d'action pour les paiements échus */}
                    {isEchu && echeance.statut !== 'payé' && (
                      <FlexItem>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          {isComptePage ? (
                            <FlexItem>
                              <Button
                                variant="primary"
                                icon={<CreditCardIcon />}
                                onClick={() => handleAllerPaiement(echeance.id)}
                                size="sm"
                              >
                                Payer maintenant
                              </Button>
                            </FlexItem>
                          ) : (
                            <FlexItem>
                              <Button
                                variant="secondary"
                                icon={<EnvelopeIcon />}
                                onClick={() => handleEnvoyerRappel(echeance.id, echeance.utilisateur_id)}
                                isLoading={isLoading}
                                isDisabled={isLoading}
                                size="sm"
                              >
                                {isLoading ? 'Envoi...' : 'Envoyer rappel'}
                              </Button>
                            </FlexItem>
                          )}
                        </Flex>
                      </FlexItem>
                    )}
                  </Flex>

                  {/* Message d'alerte pour les paiements échus */}
                  {isEchu && echeance.statut !== 'payé' && (
                    <Alert 
                      variant="warning" 
                      title="Paiement en retard" 
                      style={{ marginTop: '1rem' }}
                      isInline
                    >
                      Ce paiement est en retard depuis le {formatDate(echeance.date_echeance)}.
                      {isComptePage 
                        ? ' Cliquez sur "Payer maintenant" pour régulariser votre situation.'
                        : ' Un rappel peut être envoyé à l\'utilisateur.'
                      }
                    </Alert>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// MODIFIÉ: Fonctions utilitaires avec vérifications de sécurité
const isPaiementEchu = (dateEcheance: string) => {
  if (!dateEcheance) return false;
  try {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    return echeance < today;
  } catch (e) {
    console.error('Erreur parsing date échéance:', dateEcheance);
    return false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Date invalide';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR');
  } catch (e) {
    console.error('Erreur formatage date:', dateString);
    return 'Date invalide';
  }
};

export default EcheancesPaiement;
