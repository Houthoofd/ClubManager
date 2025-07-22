import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { TextInput, Title, Spinner, FormSelect, FormSelectOption } from '@patternfly/react-core';

import { API_BASE_URL } from '../../../config';

interface Article {
  article: string;
  taille: string;
  quantite: number;
  prix: number;
}

interface Commande {
  commande_id: string;
  date_commande: string;
  statut: string;
  articles: Article[];
}

// Couleurs associées au statut (inutile si on ne met plus le badge, mais je les laisse au cas où)
// const statutCouleurs: Record<string, 'purple' | 'green' | 'orange' | 'red' | 'blue'> = {
//   'En attente': 'orange',
//   'Expédiée': 'green',
//   'Annulée': 'red',
//   'En cours': 'blue',
// };

// Options pour le FormSelect
const statutOptions = [
  { value: 'En attente', label: 'En attente' },
  { value: 'Expédiée', label: 'Expédiée' },
  { value: 'Annulée', label: 'Annulée' },
  { value: 'En cours', label: 'En cours' },
];

const Commandes = () => {
  const [data, setData] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);

  useEffect(() => {
    fetch(`${API_BASE_URL}api/magasin/commandes`)
      .then(res => res.json())
      .then(json => setData(json.commandes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    if (!filterInput) return data;
    return data.filter(c =>
      c.commande_id.toLowerCase().includes(filterInput.toLowerCase()) ||
      c.statut.toLowerCase().includes(filterInput.toLowerCase())
    );
  }, [data, filterInput]);

  const getSortableRowValues = (commande: Commande): (string | number)[] => [
    commande.commande_id,
    new Date(commande.date_commande).getTime(),
    commande.statut,
    commande.articles.length,
    commande.articles.reduce((sum, a) => sum + a.prix * a.quantite, 0),
  ];

  const sortedData = useMemo(() => {
    if (activeSortIndex === undefined || activeSortDirection === undefined) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, activeSortIndex, activeSortDirection]);


  const columns = [
    { title: '', key: 'expander' }, // pour le bouton d'expansion
    { title: 'ID', key: 'commande_id' },
    { title: 'Date', key: 'date_commande' },
    { title: 'Statut', key: 'statut' },
    { title: "Nombre d'articles", key: 'nombre_articles' },
    { title: 'Total (€)', key: 'total' },
  ];

  const toggleRow = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const onSort = (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
  };

  const onChangeStatut = (commandeId: string, newStatut: string) => {
    setData(current =>
      current.map(c =>
        c.commande_id === commandeId ? { ...c, statut: newStatut } : c
      )
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: 20 }}>
        Commandes
      </Title>

      <TextInput
        value={filterInput}
        type="search"
        onChange={(_e, value) => setFilterInput(value)}
        aria-label="Filtrer les commandes"
        placeholder="Filtrer par ID ou statut..."
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Table aria-label="Table des commandes" variant="compact" borders>
          <Thead>
            <Tr>
              {columns.map((col, index) => (
                <Th
                  key={col.key}
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
            {sortedData.length === 0 && (
              <Tr>
                <Td colSpan={columns.length} style={{ textAlign: 'center' }}>
                  Aucune commande trouvée.
                </Td>
              </Tr>
            )}

            {sortedData.map((commande, rowIndex) => {
              const total = commande.articles.reduce((sum, a) => sum + a.prix * a.quantite, 0).toFixed(2);
              return (
                <React.Fragment key={commande.commande_id}>
                  <Tr>
                    <Td
                      expand={{
                        rowIndex,
                        isExpanded: expandedRows.has(rowIndex),
                        onToggle: () => toggleRow(rowIndex),
                      }}
                    />
                    <Td dataLabel="ID">{commande.commande_id}</Td>
                    <Td dataLabel="Date">{new Date(commande.date_commande).toLocaleString()}</Td>
                    <Td dataLabel="Statut" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FormSelect
                        value={commande.statut}
                        onChange={(_event, value) => onChangeStatut(commande.commande_id, value)}
                        aria-label="Modifier le statut"
                        style={{ minWidth: 150 }}
                      >
                        {statutOptions.map((option) => (
                          <FormSelectOption key={option.value} value={option.value} label={option.label} />
                        ))}
                      </FormSelect>
                      {/* Badge retiré */}
                    </Td>
                    <Td dataLabel="Nombre d'articles">{commande.articles.length}</Td>
                    <Td dataLabel="Total (€)">{total}</Td>
                  </Tr>
                  {expandedRows.has(rowIndex) && (
                    <Tr isExpanded>
                      <Td />
                      <Td colSpan={columns.length - 1}>
                        <Title headingLevel="h3" size="lg" style={{ marginBottom: 10 }}>
                          Articles
                        </Title>
                        <Table variant="compact" borders>
                          <Thead>
                            <Tr>
                              <Th>Article</Th>
                              <Th>Taille</Th>
                              <Th>Quantité</Th>
                              <Th>Prix (€)</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {commande.articles.map((art, idx) => (
                              <Tr key={idx}>
                                <Td dataLabel="Article">{art.article}</Td>
                                <Td dataLabel="Taille">{art.taille}</Td>
                                <Td dataLabel="Quantité">{art.quantite}</Td>
                                <Td dataLabel="Prix (€)">{art.prix.toFixed(2)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
};

export default Commandes;
