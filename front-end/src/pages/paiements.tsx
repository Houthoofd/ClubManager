import React, { useState } from 'react';
import { Alert, Spinner, Bullseye, PageSection, Title } from '@patternfly/react-core';
import { SortableTable } from '../components/table/sortableTable';
import { usePaiements } from '../hooks/usePaiements';

export const Paiements: React.FC = () => {
  const [search, setSearch] = useState('');

  // Utilisation du hook React Query pour récupérer les paiements
  const { data: paiements, isLoading, error } = usePaiements();

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return <Alert variant="danger" title="Impossible de charger les paiements" />;
  }

  // Colonnes personnalisées pour la table des paiements
  const columns = [
    { key: 'last_name', label: 'Nom' },
    { key: 'first_name', label: 'Prénom' },
    { key: 'nom_plan', label: "Type d'abonnement" },
    { key: 'periode_debut', label: 'Période début' },
    { key: 'periode_fin', label: 'Période fin' }
  ];

  // Filtrage par recherche sur toutes les colonnes affichées
  const filteredData = search.trim()
    ? paiements.filter(row =>
        columns.some(col =>
          String((row as any)[col.key]).toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : paiements;

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">Liste des paiements</Title>
      <div style={{ marginBottom: '1rem', maxWidth: 300 }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #ccc'
          }}
        />
      </div>
      <SortableTable data={filteredData} ariaLabel="Table des paiements" columns={columns} />
    </PageSection>
  );
};

export default Paiements;
          
