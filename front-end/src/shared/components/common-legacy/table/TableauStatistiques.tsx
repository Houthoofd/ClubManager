import React from 'react';
import { Card, CardBody, Title } from '@patternfly/react-core';

interface ColonneTableau {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface TableauStatistiquesProps {
  data: any[];
  colonnes: ColonneTableau[];
  title?: string;
  cardStyle?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
}

const TableauStatistiques: React.FC<TableauStatistiquesProps> = ({
  data,
  colonnes,
  title,
  cardStyle,
  tableStyle = {}
}) => {
  const defaultTableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '1rem',
    ...tableStyle
  };

  const headerStyle = {
    padding: '12px 8px',
    border: '1px solid #dee2e6',
    background: '#f8f9fa',
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    color: '#495057'
  };

  const cellStyle = {
    padding: '10px 8px',
    border: '1px solid #dee2e6',
    color: '#6c757d'
  };

  const table = (
    <table style={defaultTableStyle}>
      <thead>
        <tr>
          {colonnes.map((colonne) => (
            <th key={colonne.key} style={headerStyle}>
              {colonne.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
            {colonnes.map((colonne) => (
              <td key={colonne.key} style={cellStyle}>
                {colonne.format 
                  ? colonne.format(item[colonne.key]) 
                  : item[colonne.key]
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (title) {
    return (
      <Card style={{ ...cardStyle }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: '1.5rem' }}>
            {title}
          </Title>
          {table}
        </CardBody>
      </Card>
    );
  }

  return table;
};

export default TableauStatistiques;
