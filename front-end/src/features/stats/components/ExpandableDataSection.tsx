import React from 'react';
import {
  Card,
  CardBody,
  ExpandableSection,
  Badge,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { ChevronRightIcon, ChevronDownIcon } from '@/shared/icons';

interface ExpandableDataSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

export const ExpandableDataSection: React.FC<ExpandableDataSectionProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  children,
  variant = 'default',
}) => {
  const getVariantClass = () => {
    return `expandable-section--${variant}`;
  };

  const getBadgeVariant = () => {
    switch (variant) {
      case 'warning':
        return 'gold';
      case 'success':
        return 'green';
      case 'danger':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <Card className={`expandable-data-section ${getVariantClass()}`}>
      <div 
        className="expandable-data-section__header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <div className="expandable-data-section__icon">
                  {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </div>
              </FlexItem>
              <FlexItem>
                <h3 className="expandable-data-section__title">{title}</h3>
              </FlexItem>
              <FlexItem>
                <Badge variant={getBadgeVariant()} isRead>
                  {count}
                </Badge>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </div>

      {isExpanded && (
        <CardBody className="expandable-data-section__content">
          {children}
        </CardBody>
      )}
    </Card>
  );
};