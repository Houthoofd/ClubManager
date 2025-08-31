import React, { useEffect, useState } from 'react';
import { Alert, Spinner, Bullseye, PageSection, Title } from '@patternfly/react-core';
import { SortableTable } from '../components/table/sortableTable';
import type { VerifyResultWithData } from '@clubmanager/types';
import { apiUrl } from './apiUrl';

export const Paiements: React.FC = () => {
  const [data, setData] = useState<VerifyResultWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(apiUrl('paiements'));
        if (!res.ok) throw new Error('Erreur de chargement');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Impossible de charger les paiements');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return <Alert variant="danger" title={error} />;
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
    ? data.filter(row =>
        columns.some(col =>
          String((row as any)[col.key]).toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : data;

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
