import React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { ChartBarIcon, TableIcon } from '@/shared/icons';

interface SwitchViewControlsProps {
  showChart: boolean;
  onToggle: () => void;
  chartLabel?: string;
  tableLabel?: string;
}

const SwitchViewControls: React.FC<SwitchViewControlsProps> = ({
  showChart,
  onToggle,
  chartLabel = 'Graphique',
  tableLabel = 'Tableau'
}) => {
  return (
    <div style={{ margin: '1.5rem 0' }}>
      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <span style={{ marginRight: '1rem', fontWeight: '500' }}>Affichage :</span>
        </FlexItem>
        <FlexItem>
          <Button
            variant={showChart ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => showChart ? null : onToggle()}
            icon={<ChartBarIcon />}
          >
            {chartLabel}
          </Button>
        </FlexItem>
        <FlexItem>
          <Button
            variant={!showChart ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => !showChart ? null : onToggle()}
            icon={<TableIcon />}
          >
            {tableLabel}
          </Button>
        </FlexItem>
      </Flex>
    </div>
  );
};

export default SwitchViewControls;
