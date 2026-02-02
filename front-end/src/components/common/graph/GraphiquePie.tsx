import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardBody, Title } from '@patternfly/react-core';

interface DataSerie {
  dataKey: string;
  nameKey: string;
  colors: string[];
}

interface GraphiquePieProps {
  data: any[];
  serie: DataSerie;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  outerRadius?: number;
  innerRadius?: number;
  showLabels?: boolean;
  cardStyle?: React.CSSProperties;
  formatTooltip?: (value: any, name: string) => [string, string];
}

const GraphiquePie: React.FC<GraphiquePieProps> = ({
  data,
  serie,
  title,
  height = 300,
  showLegend = true,
  showTooltip = true,
  outerRadius = 80,
  innerRadius = 0,
  showLabels = true,
  cardStyle,
  formatTooltip,
}) => {
  const defaultFormatTooltip = (value: any, name: string) => {
    return [`${value}`, name];
  };

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={serie.dataKey}
          nameKey={serie.nameKey}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          label={showLabels}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={serie.colors[index % serie.colors.length]} 
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip 
            formatter={formatTooltip || defaultFormatTooltip}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        )}
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <Card style={{ ...cardStyle }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {title}
          </Title>
          {content}
        </CardBody>
      </Card>
    );
  }

  return content;
};

export default GraphiquePie;
