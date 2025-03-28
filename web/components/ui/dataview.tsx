import React, { useState, useMemo } from "react";

interface DataViewProps {
  data: Array<Record<string, any>>;
  excludedColumns?: string[];  // Colonnes à exclure du tableau
  columnOrder?: string[];      // Ordre des colonnes
  excludedFilteredValues?: string[];  // Colonnes à exclure du dropdown de filtrage
}

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);

  if (isNaN(date.getTime())) {
    console.error("Invalid date:", isoDateString);
    return "Invalid Date";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DataView: React.FC<DataViewProps> = ({ data, excludedColumns = [], columnOrder = [], excludedFilteredValues = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expand, setExpand] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const itemsPerPage = 10;


  const columns = data.length > 0
    ? Object.keys(data[0])
        .filter((col) => !excludedColumns.includes(col))  // Exclure les colonnes non désirées du tableau
        .sort((a, b) => {
          const indexA = columnOrder.indexOf(a);
          const indexB = columnOrder.indexOf(b);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        })
    : [];

  const filterableColumns = columns.filter(col => !excludedFilteredValues.includes(col));  // Exclure les colonnes du dropdown

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, ' ')  // Remplacer les underscores par des espaces
      .replace(/\b\w/g, char => char.toUpperCase());  // Capitaliser chaque mot
  };

  const getDistinctValues = (column: string) => {
    const values = new Set<string>();
    data.forEach(item => {
      if (item[column] !== undefined && item[column] !== null) {
        values.add(item[column].toString());
      }
    });
    return Array.from(values);
  };

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        return Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .filter((item) => {
        return filter ? item.type === filter : true;
      })
      .filter((item) => {
        return selectedValue ? item[selectedColumn || ''].toString() === selectedValue.toString() : true;
      });
      
  }, [data, searchTerm, filter, selectedColumn, selectedValue]);
  
  

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const expandSearchButton = () => {
    setExpand(!expand);
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedColumn(e.target.value);
    setSelectedValue(null);  // Reset selected value when column changes
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;  
    setSelectedValue(value);
  };
  

  return (
    <div>
      {/* Barre de recherche */}
      <div className={`search-box ${expand ? 'expanded' : ''}`}>
        <div className={`search-box-content ${expand ? 'expanded' : ''}`}>
          <input
            type='text'
            placeholder="Rechercher par nom ou prénom..."
            className={expand ? 'expanded' : ''}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className={`search-box-icon ${expand ? 'expanded' : ''}`} onClick={expandSearchButton}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
          </svg>
        </div>
      </div>

      {/* Zone de filtre */}
      <div>
        <label>Filter by key: </label>
        <select value={selectedColumn || ''} onChange={handleColumnChange}>
          <option value="">All</option>
          {filterableColumns.map((col, index) => (
            <option key={index} value={col}>{formatColumnName(col)}</option>
          ))}
        </select>

        {/* Si une colonne est sélectionnée, afficher les valeurs distinctes */}
        {selectedColumn && (
          <div>
            <label>Filter by value: </label>
            <select value={selectedValue || ''} onChange={handleValueChange}>
              <option value="">All</option>
              {getDistinctValues(selectedColumn).map((value, index) => (
                <option key={index} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tableau */}
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{formatColumnName(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <tr key={index}>
                {columns.map((col, colIndex) => {
                  const value = item[col];
                  const formattedValue = (typeof value === 'string' && value.includes('T')) ? formatDateFromISO(value) : value;

                  return <td key={colIndex}>{formattedValue}</td>;
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>Aucun résultat trouvé</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataView;
