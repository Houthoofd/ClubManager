import React, { useEffect, useMemo, useState } from 'react';
import {
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  ExpandableRowContent,
} from '@patternfly/react-table';
import {
  TextInput,
  Spinner,
  Title,
} from '@patternfly/react-core';

const Commandes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/magasin/commandes')
      .then(res => res.json())
      .then(json => setData(json.commandes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      {
        // Colonne pour bouton expand
        id: 'expander', // id obligatoire
        Header: () => null,
        Cell: ({ row }) => (
          <Td
            expand={{
              isExpanded: row.isExpanded,
              onToggle: row.getToggleRowExpandedHandler(),
            }}
          />
        ),
      },
      {
        Header: 'ID',
        accessor: 'commande_id',
      },
      {
        Header: 'Date',
        accessor: d => new Date(d.date_commande).toLocaleString(),
        id: 'date_commande',
      },
      {
        Header: 'Statut',
        accessor: 'statut',
      },
      {
        Header: "Nombre d'articles",
        accessor: d => d.articles.length,
        id: 'nombre_articles',
      },
      {
        Header: 'Total (€)',
        accessor: d =>
          d.articles.reduce((sum, a) => sum + a.prix * a.quantite, 0).toFixed(2),
        id: 'total',
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
  } = useTable(
    { columns, data },
    useGlobalFilter,
    useExpanded
  );

  // Met à jour le filtre global (sur toutes les colonnes)
  const handleFilterChange = value => {
    setFilterInput(value);
    setGlobalFilter(value || undefined);
  };

  return (
    <div style={{ padding: 20 }}>
      <Title component="h1" style={{ marginBottom: 20 }}>
        Commandes
      </Title>

      <TextInput
        value={filterInput}
        type="search"
        onChange={handleFilterChange}
        aria-label="Filtrer les commandes"
        placeholder="Filtrer..."
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {loading ? (
        <Spinner size="xl" />
      ) : (
        <TableComposable
          {...getTableProps()}
          aria-label="Tableau des commandes"
          variant="compact"
          borders
        >
          <Thead>
            {headerGroups.map(headerGroup => (
              <Tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <Th {...column.getHeaderProps()} key={column.id}>
                    {column.render('Header')}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {rows.length === 0 && (
              <Tr>
                <Td colSpan={columns.length} style={{ textAlign: 'center' }}>
                  Aucune commande trouvée.
                </Td>
              </Tr>
            )}
            {rows.map(row => {
              prepareRow(row);
              const isExpanded = row.isExpanded;
              return (
                <React.Fragment key={row.id}>
                  <Tr {...row.getRowProps()} isExpanded={isExpanded}>
                    {row.cells.map(cell => (
                      <Td {...cell.getCellProps()} key={cell.column.id}>
                        {cell.render('Cell')}
                      </Td>
                    ))}
                  </Tr>
                  {isExpanded && (
                    <Tr isExpanded>
                      <Td />
                      <Td colSpan={columns.length - 1}>
                        <ExpandableRowContent>
                          <Title component="h3" style={{ marginBottom: 10 }}>
                            Articles
                          </Title>
                          <TableComposable variant="compact" borders>
                            <Thead>
                              <Tr>
                                <Th>Article</Th>
                                <Th>Taille</Th>
                                <Th>Quantité</Th>
                                <Th>Prix (€)</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {row.original.articles.map((art, idx) => (
                                <Tr key={idx}>
                                  <Td>{art.article}</Td>
                                  <Td>{art.taille}</Td>
                                  <Td>{art.quantite}</Td>
                                  <Td>{art.prix.toFixed(2)}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </TableComposable>
                        </ExpandableRowContent>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              );
            })}
          </Tbody>
        </TableComposable>
      )}
    </div>
  );
};

export default Commandes;
