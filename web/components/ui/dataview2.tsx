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

function formatDateFromISO(word: string) {
  const date = new Date(word);
  if (isNaN(date.getTime())) {
    return word;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DataView: React.FC<DataViewProps> = ({ data, title, excludedColumns = [], columnOrder = [], excludedFilteredValues = [], addExtraColumn = [] }) => {

  // gestion de l'état du premier dropdown //
  const [selectedKey, setSelectedKey] = useState<string>("");
  // gestion de l'état du second dropdown //
  const [selectedValue, setSelectedValue] = useState<string>("");

  // gestion de l'état pour gérer le tri par ordre alphabétique //
  const [alphabeticalOrder, setAlphabeticalOrder] = useState<'asc' | 'desc'>('asc');

  const [sortedColumn, setSortedColumn] = useState<string>(''); 


  const columnNames = useMemo(() => {
    let names = data.length > 0 ? Object.keys(data[0]).filter((colName) => !excludedColumns.includes(colName)) : [];
    if (Array.isArray(addExtraColumn) && addExtraColumn.length > 0) {
      addExtraColumn.forEach((colName) => {
        if (!names.includes(colName)) names.push(colName);
      });
    }
    return names;
  }, [data, excludedColumns, addExtraColumn]);

  const orderedColumnsNames = useMemo(() => {
    return columnOrder
      .filter(orderedColumn => orderedColumn !== null && columnNames.includes(orderedColumn))
      .concat(columnNames.filter(columnName => !columnOrder.includes(columnName)));
  }, [columnOrder, columnNames]);

  const dropdownKeysNames = orderedColumnsNames.filter((columnName) => !excludedFilteredValues.includes(columnName));

  const isISODate = (value: any) => {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
  };

  const handleSelectedKey = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedKey(value);
  };

  const handleSelectedValue = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedValue(value);
  };

  const sortedData = useMemo(() => {
    if (!selectedKey || !selectedValue) return data; // Si aucune clé ou valeur n'est sélectionnée, retourner les données originales
  
    // Filtrage des données selon selectedKey et selectedValue
    let filteredData = data.filter((row) => row[selectedKey] === selectedValue);
    
    console.log(alphabeticalOrder)
    // Tri des données par ordre alphabétique basé sur alphabeticalOrder
    filteredData = filteredData.sort((a, b) => {
      if (a[selectedKey] < b[selectedKey]) return alphabeticalOrder === "asc" ? -1 : 1;
      if (a[selectedKey] > b[selectedKey]) return alphabeticalOrder === "asc" ? 1 : -1;
      return 0;
    });
  
    return filteredData;
  }, [data, selectedKey, selectedValue, alphabeticalOrder]);
  


  const getValuesByKeyNames = (key: string) => {
    const uniqueValues: Set<any> = new Set();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const keysNames = Object.keys(item);
        if (keysNames.includes(key)) {
          uniqueValues.add(item[key]);
        }
      });
      return Array.from(uniqueValues);
    } else {
      console.error("Les données ne sont pas sous forme de tableau.");
      return [];
    }
  };

  const handleSortClick = (key: string) => {
    if (sortedColumn === key) {
      // Si la même colonne est cliquée, inverser l'ordre de tri
      setAlphabeticalOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      // Si une autre colonne est cliquée, définir la clé et trier en ordre ascendant
      setSortedColumn(key);  // Définir la colonne actuellement triée
      setAlphabeticalOrder('asc');  // Par défaut, commencer avec l'ordre ascendant
    }
  };

  return (
    <div>
      <h2>{title}</h2>
      <div className="content-filter">
        <div className="dropdown">
          <label htmlFor="columnFilter">Filtrer par :</label>
          <select id="columnFilter" onChange={handleSelectedKey}>
            <option value="">Tous</option>
            {dropdownKeysNames.map((key) => (
              <option key={key} value={key}>{formatColumnName(key)}</option>
            ))}
          </select>
        </div>
        <div className="dropdown">
          <label htmlFor="columnFilter">Filtrer par {selectedKey}:</label>
          <select id="columnFilter" value={selectedValue || ''} onChange={handleSelectedValue}>
            <option value="">Tous</option>
            {getValuesByKeyNames(selectedKey)?.map((value, index) => (
              <option key={index} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <table>
        <thead>
        <tr>
          {orderedColumnsNames.map((columnName, index) => {
            if (columnName === 'first_name' || columnName === 'last_name') {
              return (
                <th
                  key={index}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => handleSortClick(columnName)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formatColumnName(columnName)}
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368" style={{ marginLeft: '8px' }}>
                      <path d="M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z" />
                    </svg>
                  </span>
                </th>
              );
            }

            // Si ce n'est pas 'first_name' ou 'last_name', afficher normalement
            return <th key={index}>{formatColumnName(columnName)}</th>;
          })}
        </tr>

        </thead>
        <tbody>
          {sortedData.map((row) => {
            const rowKey = row.id || row.name || row[orderedColumnsNames[0]];
            return (
              <tr key={rowKey}>
                {orderedColumnsNames.map((columnName) => {
                  const cellValue = row[columnName];
                  const displayValue = cellValue ? (isISODate(cellValue) ? formatDateFromISO(cellValue) : cellValue) : "N/A";
                  if(columnName === "selected"){
                    return <th><input type="checkbox"></input></th>
                  }
                  return <td key={columnName}>{displayValue}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataView;
