import React from 'react';
import { Badge, Tooltip } from '@patternfly/react-core';
import { ExclamationTriangleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

interface AlertesBadgeProps {
  alertes: {
    priorite: 'critique' | 'haute' | 'normale' | 'basse';
    type_alerte: string;
    code: string;
  }[];
}

const AlertesBadge: React.FC<AlertesBadgeProps> = ({ alertes }) => {
  if (!alertes || alertes.length === 0) return null;

  const alertesCritiques = alertes.filter(a => a.priorite === 'critique').length;
  const alertesHautes = alertes.filter(a => a.priorite === 'haute').length;
  const alertesNormales = alertes.filter(a => a.priorite === 'normale').length;
  const alertesBasses = alertes.filter(a => a.priorite === 'basse').length;

  const getVariant = () => {
    if (alertesCritiques > 0) return 'danger';
    if (alertesHautes > 0) return 'warning';
    if (alertesNormales > 0) return 'info';
    return 'outline';
  };

  const getIcon = () => {
    if (alertesCritiques > 0) return <ExclamationCircleIcon />;
    if (alertesHautes > 0) return <ExclamationTriangleIcon />;
    return null;
  };

  const getTooltipContent = () => {
    const messages = [];
    if (alertesCritiques > 0) messages.push(`${alertesCritiques} critique(s)`);
    if (alertesHautes > 0) messages.push(`${alertesHautes} haute(s)`);
    if (alertesNormales > 0) messages.push(`${alertesNormales} normale(s)`);
    if (alertesBasses > 0) messages.push(`${alertesBasses} basse(s)`);
    
    return `Alertes: ${messages.join(', ')}`;
  };

  const totalAlertes = alertes.length;

  return (
    <div onClick={(e) => e.stopPropagation()}> {/* Empêche la propagation */}
      <Tooltip content={getTooltipContent()}>
        <Badge 
          variant={getVariant()}
          screenReaderText={`${totalAlertes} alerte(s)`}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            cursor: 'help'
          }}
        >
          {getIcon()}
          {totalAlertes}
        </Badge>
      </Tooltip>
    </div>
  );
};

export default AlertesBadge;
