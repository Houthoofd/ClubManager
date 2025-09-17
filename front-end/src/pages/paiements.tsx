import React, { useState } from 'react';
import { Alert, Spinner, Bullseye, PageSection } from '@patternfly/react-core';
import { SortableTable } from '../components/common/table/sortableTable';
import { usePaiements } from '../hooks/usePaiements';
import { PageHeader } from '../components/common/PageHeader';

export const Paiements: React.FC = () => {
  const [search, setSearch] = useState('');

  // Utilisation du hook React Query pour récupérer les paiements
  const { data: paiements, isLoading, error } = usePaiements();

  if (isLoading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner />
        </Bullseye>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant="danger" title="Impossible de charger les paiements" />
      </PageSection>
    );
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

  const breadcrumbItems = [
    { title: 'Accueil', to: '/' },
    { title: 'Paiements', isActive: true },
  ];

  return (
    <div className="payments-page">
      <PageHeader
        title="Paiements"
        subtitle="Consultez la liste des paiements des membres"
        variant="payments"
        breadcrumbItems={breadcrumbItems}
      />
      <PageSection>
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
    </div>
  );
};

export default Paiements;

