import React from 'react';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from '@patternfly/react-table';
import { 
  FormSelect, 
  FormSelectOption, 
  Title, 
  Card, 
  CardTitle,
  CardBody,
  Badge,
  Label,
  Button,
  EmptyState,
  EmptyStateBody
} from '@patternfly/react-core';
import { 
  ShoppingCartIcon, 
  AngleUpIcon, 
  AngleDownIcon 
} from '@patternfly/react-icons';

interface TableauCommandesProps {
  commandes: any[];
  expandedRows: Set<number>;
  activeSortIndex: number | undefined;
  activeSortDirection: 'asc' | 'desc' | undefined;
  onToggleRow: (rowIndex: number) => void;
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  onChangeStatut: (commandeId: string, newStatut: string) => void;
  isUpdatingStatut?: string | null;
  stocks?: any;
}

// AJOUTÉ: Composant StatutSelector
const StatutSelector: React.FC<{
  currentStatut: string;
  onStatutChange: (newStatut: string) => void;
  isLoading?: boolean;
}> = ({ currentStatut, onStatutChange, isLoading }) => {
  const statutsOptions = [
    { value: 'en attente', label: 'En attente' },
    { value: 'payée', label: 'Payée' },
    { value: 'expédiée', label: 'Expédiée' },
    { value: 'annulée', label: 'Annulée' }
  ];

  return (
    <FormSelect
      value={currentStatut}
      onChange={(event, value) => onStatutChange(value)}
      isDisabled={isLoading}
      style={{ minWidth: '120px' }}
    >
      {statutsOptions.map((option) => (
        <FormSelectOption 
          key={option.value} 
          value={option.value} 
          label={option.label} 
        />
      ))}
    </FormSelect>
  );
};

const TableauCommandes: React.FC<TableauCommandesProps> = ({
  commandes,
  expandedRows,
  activeSortIndex,
  activeSortDirection,
  onToggleRow,
  onSort,
  onChangeStatut,
  isUpdatingStatut,
  stocks
}) => {
  // AJOUTÉ: Fonction pour calculer le total des articles de manière sécurisée
  const calculateTotal = (commande: any): number => {
    if (!commande) return 0;
    
    // Si le total est déjà calculé dans la DB
    if (commande.total) {
      return parseFloat(commande.total);
    }
    
    // Sinon calculer depuis les articles si disponibles
    if (Array.isArray(commande.articles)) {
      return commande.articles.reduce((sum: number, article: any) => {
        const prix = parseFloat(article?.prix || 0);
        const quantite = parseInt(article?.quantite || 0);
        return sum + (prix * quantite);
      }, 0);
    }
    
    return 0;
  };

  // AJOUTÉ: Fonction pour obtenir les articles de manière sécurisée
  const getArticles = (commande: any): any[] => {
    if (!commande) return [];
    
    // Si les articles sont déjà parsés
    if (Array.isArray(commande.articles)) {
      return commande.articles;
    }
    
    // Si les articles sont stockés en JSON string
    if (typeof commande.articles === 'string') {
      try {
        return JSON.parse(commande.articles);
      } catch {
        return [];
      }
    }
    
    return [];
  };

  // AJOUTÉ: Fonction pour formater la date de manière sécurisée
  const formatDate = (commande: any): string => {
    if (!commande) return 'Date inconnue';
    
    const dateStr = commande.date_commande || commande.created_at;
    if (!dateStr) return 'Date inconnue';
    
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // AJOUTÉ: Fonction pour obtenir l'ID de commande
  const getCommandeId = (commande: any): string => {
    return commande?.numero_commande || commande?.unique_id || commande?.id?.toString() || 'N/A';
  };

  // AJOUTÉ: Fonction pour obtenir le nom du client
  const getClientName = (commande: any): string => {
    if (!commande) return 'Client inconnu';
    
    const firstName = commande.first_name || '';
    const lastName = commande.last_name || '';
    const username = commande.nom_utilisateur || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (username) {
      return username;
    }
    
    return `Utilisateur ${commande.utilisateur_id || 'inconnu'}`;
  };

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h3">
          Liste des commandes ({Array.isArray(commandes) ? commandes.length : 0})
        </Title>
      </CardTitle>
      <CardBody>
        {!Array.isArray(commandes) || commandes.length === 0 ? (
          <EmptyState>
            <EmptyState variant="large">
              <ShoppingCartIcon style={{ fontSize: '64px', color: '#6c757d', marginBottom: '1rem' }} />
              <Title headingLevel="h4" size="lg">
                Aucune commande trouvée
              </Title>
              <EmptyStateBody>
                {!Array.isArray(commandes) 
                  ? "Erreur de chargement des données" 
                  : "Aucune commande n'a été passée pour le moment."
                }
              </EmptyStateBody>
            </EmptyState>
          </EmptyState>
        ) : (
          <Table aria-label="Tableau des commandes" variant="compact">
            <Thead>
              <Tr>
                <Th 
                  sort={{
                    sortBy: { index: activeSortIndex, direction: activeSortDirection },
                    onSort: onSort,
                    columnIndex: 0
                  }}
                >
                  Numéro
                </Th>
                <Th 
                  sort={{
                    sortBy: { index: activeSortIndex, direction: activeSortDirection },
                    onSort: onSort,
                    columnIndex: 1
                  }}
                >
                  Date
                </Th>
                <Th>Client</Th>
                <Th 
                  sort={{
                    sortBy: { index: activeSortIndex, direction: activeSortDirection },
                    onSort: onSort,
                    columnIndex: 3
                  }}
                >
                  Statut
                </Th>
                <Th 
                  sort={{
                    sortBy: { index: activeSortIndex, direction: activeSortDirection },
                    onSort: onSort,
                    columnIndex: 4
                  }}
                >
                  Articles
                </Th>
                <Th 
                  sort={{
                    sortBy: { index: activeSortIndex, direction: activeSortDirection },
                    onSort: onSort,
                    columnIndex: 5
                  }}
                >
                  Total
                </Th>
                <Th>Actions</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {commandes.map((commande: any, rowIndex: number) => {
                const isExpanded = expandedRows.has(rowIndex);
                const commandeId = getCommandeId(commande);
                const articles = getArticles(commande);
                const total = calculateTotal(commande);

                return (
                  <React.Fragment key={`commande-${commande?.id || rowIndex}`}>
                    <Tr>
                      <Td dataLabel="Numéro">
                        <strong>{commandeId}</strong>
                      </Td>
                      <Td dataLabel="Date">
                        {formatDate(commande)}
                      </Td>
                      <Td dataLabel="Client">
                        {getClientName(commande)}
                      </Td>
                      <Td dataLabel="Statut">
                        <Label 
                          color={getStatutColor(commande?.statut)}
                          variant="filled"
                        >
                          {commande?.statut || 'Inconnu'}
                        </Label>
                      </Td>
                      <Td dataLabel="Articles">
                        {articles.length} article{articles.length > 1 ? 's' : ''}
                      </Td>
                      <Td dataLabel="Total">
                        <strong>{total.toFixed(2)} €</strong>
                      </Td>
                      <Td dataLabel="Actions">
                        <StatutSelector
                          currentStatut={commande?.statut || 'en attente'}
                          onStatutChange={(newStatut) => onChangeStatut(commandeId, newStatut)}
                          isLoading={isUpdatingStatut === commandeId}
                        />
                      </Td>
                      <Td isActionCell>
                        <Button
                          variant="plain"
                          onClick={() => onToggleRow(rowIndex)}
                          icon={isExpanded ? <AngleUpIcon /> : <AngleDownIcon />}
                        />
                      </Td>
                    </Tr>
                    
                    {/* MODIFIÉ: Ligne étendue avec vérifications */}
                    {isExpanded && (
                      <Tr isExpanded>
                        <Td colSpan={8}>
                          <ExpandableRowContent>
                            <div style={{ padding: '1rem' }}>
                              <Title headingLevel="h5" size="md" style={{ marginBottom: '1rem' }}>
                                Détails de la commande {commandeId}
                              </Title>
                              
                              {/* Informations générales */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <strong>Informations générales :</strong>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                  <li>ID interne: {commande?.id || 'N/A'}</li>
                                  <li>ID unique: {commande?.unique_id || 'N/A'}</li>
                                  <li>Utilisateur ID: {commande?.utilisateur_id || 'N/A'}</li>
                                  <li>Email: {commande?.utilisateur_email || commande?.email || 'N/A'}</li>
                                  {commande?.ip_address && <li>IP: {commande.ip_address}</li>}
                                </ul>
                              </div>

                              {/* Articles */}
                              <div>
                                <strong>Articles commandés :</strong>
                                {articles.length > 0 ? (
                                  <Table aria-label="Articles de la commande" variant="compact" style={{ marginTop: '0.5rem' }}>
                                    <Thead>
                                      <Tr>
                                        <Th>Article</Th>
                                        <Th>Taille</Th>
                                        <Th>Quantité</Th>
                                        <Th>Prix unitaire</Th>
                                        <Th>Sous-total</Th>
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {articles.map((article: any, index: number) => (
                                        <Tr key={`article-${index}`}>
                                          <Td>{article?.nom || article?.name || 'Article inconnu'}</Td>
                                          <Td>{article?.taille || article?.size || 'N/A'}</Td>
                                          <Td>{article?.quantite || article?.quantity || 0}</Td>
                                          <Td>{parseFloat(article?.prix || article?.price || 0).toFixed(2)} €</Td>
                                          <Td>
                                            <strong>
                                              {(parseFloat(article?.prix || article?.price || 0) * parseInt(article?.quantite || article?.quantity || 0)).toFixed(2)} €
                                            </strong>
                                          </Td>
                                        </Tr>
                                      ))}
                                    </Tbody>
                                  </Table>
                                ) : (
                                  <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>
                                    Aucun détail d'article disponible
                                  </p>
                                )}
                              </div>
                            </div>
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    )}
                  </React.Fragment>
                );
              })}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
};

// AJOUTÉ: Fonction helper pour obtenir la couleur du statut
const getStatutColor = (statut: string) => {
  switch (statut) {
    case 'en attente':
      return 'orange';
    case 'payée':
      return 'green';
    case 'expédiée':
      return 'blue';
    case 'annulée':
      return 'red';
    default:
      return 'grey';
  }
};

export default TableauCommandes;

