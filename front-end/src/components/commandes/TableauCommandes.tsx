import React from 'react';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { FormSelect, FormSelectOption, Title, Card, Badge } from '@patternfly/react-core';

interface TableauCommandesProps {
  commandes: any[];
  expandedRows: Set<number>;
  activeSortIndex: number | undefined;
  activeSortDirection: 'asc' | 'desc' | undefined;
  onToggleRow: (rowIndex: number) => void;
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  onChangeStatut: (commandeId: string, newStatut: string) => void;
}

const TableauCommandes: React.FC<TableauCommandesProps> = ({
  commandes,
  expandedRows,
  activeSortIndex,
  activeSortDirection,
  onToggleRow,
  onSort,
  onChangeStatut,
}) => {
  const columns = [
    { title: '', key: 'expander' },
    { title: 'ID Commande', key: 'commande_id' },
    { title: 'Date', key: 'date_commande' },
    { title: 'Statut', key: 'statut' },
    { title: "Nombre d'articles", key: 'nombre_articles' },
    { title: 'Total (€)', key: 'total' },
  ];

  const getStatutColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en attente':
        return { bg: '#fff3e0', text: '#ef6c00', border: '#ff9800' };
      case 'expédiée':
        return { bg: '#e8f5e8', text: '#2e7d32', border: '#4caf50' };
      case 'annulée':
        return { bg: '#ffebee', text: '#c62828', border: '#f44336' };
      case 'en cours':
        return { bg: '#e3f2fd', text: '#1976d2', border: '#2196f3' };
      default:
        return { bg: '#f5f5f5', text: '#666', border: '#ccc' };
    }
  };

  return (
    <Card className="table-container">
      <Table aria-label="Table des commandes" variant="compact" borders={false}>
        <Thead>
          <Tr className="table-header">
            {columns.map((col, index) => (
              <Th
                key={col.key}
                className="table-header"
                sort={
                  col.key !== 'expander'
                    ? {
                        sortBy: {
                          index: activeSortIndex,
                          direction: activeSortDirection || 'asc',
                        },
                        onSort,
                        columnIndex: index,
                      }
                    : undefined
                }
              >
                {col.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {commandes.length === 0 && (
            <Tr>
              <Td colSpan={columns.length} style={{ 
                textAlign: 'center',
                padding: '2rem',
                color: '#6c757d',
                fontStyle: 'italic'
              }}>
                Aucune commande trouvée
              </Td>
            </Tr>
          )}

          {commandes.map((commande, rowIndex) => {
            const total = commande.articles.reduce((sum: number, a: any) => sum + a.prix * a.quantite, 0);
            const statutColors = getStatutColor(commande.statut);
            
            return (
              <React.Fragment key={commande.commande_id}>
                <Tr className={expandedRows.has(rowIndex) ? "table-row-expanded" : "table-row"}>
                  <Td
                    expand={{
                      rowIndex,
                      isExpanded: expandedRows.has(rowIndex),
                      onToggle: () => onToggleRow(rowIndex),
                    }}
                    className="table-cell"
                  />
                  <Td className="table-cell table-id">
                    #{commande.commande_id}
                  </Td>
                  <Td className="table-cell" dataLabel="Date" style={{ padding: '1rem' }}>
                    {new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Td>
                  <Td className="table-cell" dataLabel="Statut" style={{ padding: '1rem' }}>
                    <FormSelect
                      value={commande.statut}
                      onChange={(_event, value) => onChangeStatut(commande.commande_id, value)}
                      aria-label="Modifier le statut"
                      style={{ 
                        minWidth: '150px',
                        borderRadius: '6px',
                        backgroundColor: statutColors.bg,
                        borderColor: statutColors.border,
                        color: statutColors.text,
                        fontWeight: 'bold'
                      }}
                    >
                      {['En attente', 'Expédiée', 'Annulée', 'En cours'].map((statut) => (
                        <FormSelectOption key={statut} value={statut} label={statut} />
                      ))}
                    </FormSelect>
                  </Td>
                  <Td className="table-cell" dataLabel="Nombre d'articles" style={{ padding: '1rem' }}>
                    <Badge style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontSize: '0.9rem',
                      padding: '0.25rem 0.5rem'
                    }}>
                      {commande.articles.length} article{commande.articles.length > 1 ? 's' : ''}
                    </Badge>
                  </Td>
                  <Td className="table-cell" dataLabel="Total (€)" style={{ 
                    padding: '1rem',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: '#28a745'
                  }}>
                    {total.toFixed(2)} €
                  </Td>
                </Tr>
                {expandedRows.has(rowIndex) && (
                  <Tr isExpanded className="table-row-expanded">
                    <Td />
                    <Td colSpan={columns.length - 1} className="table-cell">
                      <div className="table-detail-section">
                        <Title headingLevel="h4" className="table-detail-title">
                          Détail des articles
                        </Title>
                        <Table variant="compact" borders>
                          <Thead>
                            <Tr style={{ background: '#f8f9fa' }}>
                              <Th style={{ fontWeight: 'bold', color: '#495057' }}>Article</Th>
                              <Th style={{ fontWeight: 'bold', color: '#495057' }}>Taille</Th>
                              <Th style={{ fontWeight: 'bold', color: '#495057' }}>Quantité</Th>
                              <Th style={{ fontWeight: 'bold', color: '#495057' }}>Prix unitaire</Th>
                              <Th style={{ fontWeight: 'bold', color: '#495057' }}>Sous-total</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {commande.articles.map((art: any, idx: number) => (
                              <Tr key={idx} style={{ 
                                borderBottom: idx < commande.articles.length - 1 ? '1px solid #dee2e6' : 'none'
                              }}>
                                <Td dataLabel="Article" style={{ fontWeight: '500' }}>
                                  {art.article}
                                </Td>
                                <Td dataLabel="Taille">
                                  <Badge style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white'
                                  }}>
                                    {art.taille}
                                  </Badge>
                                </Td>
                                <Td dataLabel="Quantité" style={{ textAlign: 'center' }}>
                                  {art.quantite}
                                </Td>
                                <Td dataLabel="Prix unitaire" style={{ fontWeight: '500' }}>
                                  {art.prix.toFixed(2)} €
                                </Td>
                                <Td dataLabel="Sous-total" style={{ 
                                  fontWeight: 'bold',
                                  color: '#28a745'
                                }}>
                                  {(art.prix * art.quantite).toFixed(2)} €
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </div>
                    </Td>
                  </Tr>
                )}
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>
    </Card>
  );
};

export default TableauCommandes;
                              
