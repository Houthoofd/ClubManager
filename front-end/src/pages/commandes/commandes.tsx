import React, { useMemo, useState } from 'react';
import { Title, Spinner, Alert, PageSection } from '@patternfly/react-core';
import { useCommandes, useUpdateCommandeStatut } from '../../hooks/useCommandes';
import TableauCommandes from '../../components/commandes/TableauCommandes';
import FiltrageCommandes from '../../components/commandes/FiltrageCommandes';
import StatistiquesCommandes from '../../components/commandes/StatistiquesCommandes';
import { PageHeader } from '../../components/common/PageHeader';

const Commandes = () => {
  const [filterInput, setFilterInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);

  // Utilisation des hooks React Query
  const { data: commandes = [], isLoading, error } = useCommandes();
  const updateCommandeStatut = useUpdateCommandeStatut();

  const filteredData = useMemo(() => {
    if (!filterInput) return commandes;
    return commandes.filter(c =>
      c.commande_id.toLowerCase().includes(filterInput.toLowerCase()) ||
      c.statut.toLowerCase().includes(filterInput.toLowerCase())
    );
  }, [commandes, filterInput]);

  const getSortableRowValues = (commande: any): (string | number)[] => [
    commande.commande_id,
    new Date(commande.date_commande).getTime(),
    commande.statut,
    commande.articles.length,
    commande.articles.reduce((sum: number, a: any) => sum + a.prix * a.quantite, 0),
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

  const onChangeStatut = async (commandeId: string, newStatut: string) => {
    try {
      await updateCommandeStatut.mutateAsync({ commandeId, newStatut });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  if (isLoading) {
    return (
      <PageSection>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  if (error) {
    return (
      <div className="commandes-page">
        <PageHeader
          title="Gestion des commandes"
          subtitle="Suivez et gérez les commandes de votre magasin"
          variant="commandes"
        />
        <PageSection className="commandes-content">
          <Alert 
            variant="danger" 
            title="Erreur lors du chargement des commandes"
            style={{ borderRadius: '8px' }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div className="commandes-page">
      <PageHeader
        title="Gestion des commandes"
        subtitle="Suivez et gérez les commandes de votre magasin"
        variant="commandes"
      />

      <PageSection className="commandes-content">
        <StatistiquesCommandes commandes={commandes} />

        <FiltrageCommandes
          filterInput={filterInput}
          onFilterChange={setFilterInput}
          totalCommandes={commandes.length}
          commandesFiltrees={filteredData.length}
        />

        <TableauCommandes
          commandes={sortedData}
          expandedRows={expandedRows}
          activeSortIndex={activeSortIndex}
          activeSortDirection={activeSortDirection}
          onToggleRow={toggleRow}
          onSort={onSort}
          onChangeStatut={onChangeStatut}
        />
      </PageSection>
    </div>
  );
};

export default Commandes;
