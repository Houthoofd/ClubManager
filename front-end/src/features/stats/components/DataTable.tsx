import React, { useState } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Button,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@/shared/icons';

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  emptyMessage: string;
  maxRows?: number;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  onRowClick?: (row: any) => void;
  actions?: React.ReactNode;
  hideTitle?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  data,
  columns,
  emptyMessage,
  maxRows,
  variant = 'default',
  onRowClick,
  actions,
  hideTitle = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayData = maxRows && !isExpanded ? data.slice(0, maxRows) : data;
  const hasMoreData = maxRows && data.length > maxRows;

  const getVariantClass = () => {
    return `data-table--${variant}`;
  };

  const renderTable = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="data-table__empty">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <>
        <div className="data-table__container">
          <table className={`data-table ${getVariantClass()}`}>
            <thead className="data-table__header">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="data-table__header-cell">
                    {column.label}
                  </th>
                ))}
                {onRowClick && <th className="data-table__header-cell"></th>}
              </tr>
            </thead>
            <tbody className="data-table__body">
              {displayData.map((row, index) => (
                <tr key={index} className="data-table__row">
                  {columns.map((column) => (
                    <td key={column.key} className="data-table__cell">
                      {row[column.key] || 'N/A'}
                    </td>
                  ))}
                  {onRowClick && (
                    <td className="data-table__cell data-table__cell--action">
                      <Button
                        variant="link"
                        icon={<ExternalLinkAltIcon />}
                        onClick={() => onRowClick(row)}
                        aria-label="Voir détails"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreData && (
          <div className="data-table__footer">
            <Button
              variant="link"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded 
                ? 'Voir moins' 
                : `Voir tout (${data.length - maxRows!} de plus)`
              }
            </Button>
          </div>
        )}
      </>
    );
  };

  if (hideTitle) {
    return (
      <div className="data-table-wrapper">
        {renderTable()}
      </div>
    );
  }

  return (
    <Card className="data-table-card">
      <CardTitle className="data-table-card__header">
        <span>{title}</span>
        {actions && <div className="data-table-card__actions">{actions}</div>}
      </CardTitle>
      <CardBody className="data-table-card__body">
        {renderTable()}
      </CardBody>
    </Card>
  );
};
