import React from 'react';
import { Card, CardBody, Title, Flex, FlexItem } from '@patternfly/react-core';

interface CarteStatistiqueProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
}

const CarteStatistique: React.FC<CarteStatistiqueProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#007bff',
  backgroundColor = '#f8f9fa'
}) => {
  return (
    <Card 
      isCompact 
      style={{ 
        border: `2px solid ${color}`,
        borderRadius: '12px',
        backgroundColor
      }}
    >
      <CardBody style={{ padding: '1.5rem' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          {icon && (
            <FlexItem>
              <div style={{ color, fontSize: '2rem' }}>
                {icon}
              </div>
            </FlexItem>
          )}
          <FlexItem flex={{ default: 'flex_1' }}>
            <div style={{ textAlign: icon ? 'left' : 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>
                {value}
              </div>
              <Title headingLevel="h4" size="md" style={{ marginTop: '0.5rem', color: '#495057' }}>
                {title}
              </Title>
              {subtitle && (
                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.25rem' }}>
                  {subtitle}
                </div>
              )}
            </div>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CarteStatistique;
