import React, { useEffect, useState } from 'react';
import { Alert, Spinner, Bullseye } from '@patternfly/react-core';
import { SortableTable } from '../components/table/sortableTable';
import type { VerifyResultWithData } from '@clubmanager/types';

export const Paiements: React.FC = () => {
  const [data, setData] = useState<VerifyResultWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3000/paiements');
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

  return <SortableTable data={data} ariaLabel="Table des paiements" />;
};

export default Paiements;
