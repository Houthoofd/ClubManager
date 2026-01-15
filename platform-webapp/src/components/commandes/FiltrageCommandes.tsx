import React from 'react';
import { TextInput, Card, Title } from '@patternfly/react-core';

interface FiltrageCommandesProps {
  filterInput: string;
  onFilterChange: (value: string) => void;
  totalCommandes: number;
  commandesFiltrees: number;
}

const FiltrageCommandes: React.FC<FiltrageCommandesProps> = ({
  filterInput,
  onFilterChange,
  totalCommandes,
  commandesFiltrees,
}) => {
  return (
    <Card style={{ 
      padding: '1.5rem', 
      marginBottom: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
        Filtrer les commandes
      </Title>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <TextInput
            value={filterInput}
            type="search"
            onChange={(_e, value) => onFilterChange(value)}
            aria-label="Filtrer les commandes"
            placeholder="Rechercher par ID de commande ou statut..."
            style={{ 
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          fontSize: '0.9rem',
          color: '#495057',
          whiteSpace: 'nowrap'
        }}>
          {commandesFiltrees} / {totalCommandes} commande{totalCommandes > 1 ? 's' : ''}
        </div>
      </div>
    </Card>
  );
};

export default FiltrageCommandes;
