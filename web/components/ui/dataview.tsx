import React, { useState, useMemo } from "react";
import '../../app/styles/style-dataview.css';
import Pills from '../ui/pills';

interface DataViewProps {
  data: Array<Record<string, any>>;
  title: string;
  addExtraColumn?: string[];
  excludedColumns?: string[];  // Columns to exclude from the table
  columnOrder?: string[];      // Column order
  excludedFilteredValues?: string[];  // Columns to exclude from filter dropdown
}

function formatColumnName(chaine: string) {
  return chaine
    .split('_') // Sépare la chaîne par les underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Met la première lettre de chaque mot en majuscule
    .join(' '); // Rejoint les mots sans underscore
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

const DataView: React.FC<DataViewProps> = ({ data, title, excludedColumns = [], columnOrder = [], excludedFilteredValues = [], addExtraColumn = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expand, setExpand] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedUnfilteredColumn, setSelectedUnfilteredColumn] = useState<string | null>(null); // Nouveau pour colonne non filtrée
  const [selectedUnfilteredValue, setSelectedUnfilteredValue] = useState<string | null>(null); // Nouveau pour colonne non filtrée
  const [sortedData, setSortedData] = useState(data); // Nouvel état pour les données triées
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Column filtering logic
  let columns = data.length > 0
    ? Object.keys(data[0])
      .filter((col) => !excludedColumns.includes(col))  // Exclude unwanted columns
      .sort((a, b) => {
        const indexA = columnOrder.indexOf(a);
        const indexB = columnOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
    : [];

  // Adding extra columns if defined
  addExtraColumn.forEach(extraCol => {
    if (extraCol && !columns.includes(extraCol)) {
      columns.push(extraCol);  // Add extra columns
    }
  });

  columns = columnOrder.concat(columns.filter(col => !columnOrder.includes(col)));

  const filterableColumns = columns.filter(col => !excludedFilteredValues.includes(col));  // Filterable columns dropdown

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, ' ')  // Replace underscores with spaces
      .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize each word
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
        return Object.values(item).some((value) => {
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      })
      .filter((item) => {
        return filter ? item.type === filter : true;
      })
      .filter((item) => {
        return selectedValue ? item[selectedColumn || ''].toString() === selectedValue.toString() : true;
      })
      // Filtre sur la colonne non sélectionnée (si applicable)
      .filter((item) => {
        console.log(item[selectedUnfilteredColumn], item)
        return selectedUnfilteredColumn ? !item[selectedUnfilteredColumn] : true;
      })
      .filter((item) => {
        console.log(selectedUnfilteredValue)
        return selectedUnfilteredValue ? item[selectedUnfilteredColumn || ''].toString() === selectedUnfilteredValue.toString() : true;
      });
  }, [data, searchTerm, filter, selectedColumn, selectedValue, selectedUnfilteredColumn, selectedUnfilteredValue]);
  

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

  const handleUnfilteredColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("handleUnfilteredColumnChange" + e.target.value)
    setSelectedUnfilteredColumn(e.target.value);
  };

  const handleUnfilteredValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("handleUnfilteredValueChange" + e.target.value)
    setSelectedUnfilteredValue(e.target.value);
  };

  // const alphabelicalSort = (col: string) => {
  //   console.log(col, data);
  
  //   // Étape 1 : Créer une copie du tableau original pour ne pas muter l'état directement
  //   const sorted = [...data];
  //   console.log(sorted)
  
  //   // Étape 2 : Déterminer l'ordre de tri en fonction de l'état actuel
  //   // sorted.sort((a, b) => {
  //   //   const valueA = (a[col] || '').toString().toLowerCase(); // Comparaison en chaîne de caractères, ignore les majuscules
  //   //   const valueB = (b[col] || '').toString().toLowerCase(); // Pareil pour b[col]
  
  //   //   if (sortOrder === 'asc') {
  //   //     // Tri ascendant
  //   //     if (valueA < valueB) return -1;
  //   //     if (valueA > valueB) return 1;
  //   //   } else {
  //   //     // Tri descendant
  //   //     if (valueA < valueB) return 1;
  //   //     if (valueA > valueB) return -1;
  //   //   }
  
  //   //   return 0;
  //   // });
  
  //   // console.log(sorted);  // Affichage des données triées pour débogage
  //   // setSortedData(sorted);  // Mise à jour de l'état avec les données triées
  
  //   // // Étape 3 : Basculer l'ordre de tri pour le prochain clic
  //   // setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  // };
  
  

  



  return (
    <div className="data-view">
      <h2>{title}</h2>
      <div className="panel-control">
        <div className={`search-box ${expand ? 'expanded' : ''}`}>
          <div className={`search-box-content ${expand ? 'expanded' : ''}`}>
            <input
              type='text'
              placeholder="Search by name or surname..."
              className={expand ? 'expanded' : ''}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className={`search-box-icon ${expand ? 'expanded' : ''}`} onClick={expandSearchButton}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
          </div>
        </div>
        <div className="filter-box">
          <div className="dropdown">
            <label>Filter by key: </label>
            <select value={selectedColumn || ''} onChange={handleColumnChange}>
              <option value="">All</option>
              {filterableColumns.map((col, index) => (
                <option key={index} value={col}>{formatColumnName(col)}</option>
              ))}
            </select>
          </div>
          {selectedColumn && (
            <div className="dropdown">
              <label>Filter by {selectedColumn}: </label>
              <select value={selectedValue || ''} onChange={handleValueChange}>
                <option value="">All</option>
                {getDistinctValues(selectedColumn).map((value, index) => (
                  <option key={index} value={value}>{value}</option>
                ))}
              </select>
            </div>
          )}
          {/* Dropdown pour les colonnes non sélectionnées */}
          {selectedValue && (
            <div className="dropdown">
              <label>Filter by key: </label>
              <select value={selectedUnfilteredColumn || ''} onChange={handleUnfilteredColumnChange}>
                <option value="">None</option>
                {filterableColumns.filter(col => col !== selectedColumn).map((col, index) => (
                  <option key={index} value={col}>{formatColumnName(col)}</option>
                ))}
              </select>
            </div>
          )}
          {selectedUnfilteredColumn && (
            <div className="dropdown">
              <label>Filter by {selectedUnfilteredColumn}: </label>
              <select value={selectedUnfilteredColumn || ''} onChange={handleUnfilteredValueChange}>
                <option value="">None</option>
                {getDistinctValues(selectedUnfilteredColumn).map((value, index) => (
                  <option key={index} value={value}>{value}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="panel-control-actions">
        <Pills 
          icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
            <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM80-560q0-100 44.5-183.5T244-882l47 64q-60 44-95.5 111T160-560H80Zm720 0q0-80-35.5-147T669-818l47-64q75 55 119.5 138.5T880-560h-80Z"/>
          </svg>} 
          text={"notification"} 
        />
        <Pills 
          icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg>} 
          text={"supprimer"} 
        />
        <Pills 
          icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>} 
          text={"modifier"} 
        />
      </div>

      <table>
        <thead>
        <tr>
          {columns.map((col, index) => {
            if (col === 'first_name' || col === 'last_name') {
              return (
                <th
                  key={index}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formatColumnName(col)}
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368" style={{ marginLeft: '8px' }}>
                      <path d="M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z" />
                    </svg>
                  </span>
                </th>
              );
            }

            return (
              <th key={index}>{formatColumnName(col)}</th>
            );
          })}
        </tr>


        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <tr key={index}>
                {columns.map((col, colIndex) => {
                  const value = item[col];
                  const formattedValue = (typeof value === 'string' && value.includes('T')) ? formatDateFromISO(value) : value;
                  return col === "Selected" ? (
                    <td key={colIndex}>
                      <input type="checkbox" />
                    </td>
                  ) : (
                    <td key={colIndex}>{formattedValue}</td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>No results found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Zm-80-240Zm0 90v-180l-136 90 136 90Z" /></svg>
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default DataView;

