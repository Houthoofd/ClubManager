import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardBody, Title } from '@patternfly/react-core';

interface DataSerie {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar';
}

interface GraphiqueLineaireProps {
  data: any[];
  series: DataSerie[];
  title?: string;
  height?: number;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  type?: 'line' | 'area' | 'bar';
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatTooltip?: (value: any, name: string, props: any) => [string, string];
  formatXAxisLabel?: (value: any) => string;
  formatYAxisLabel?: (value: any) => string;
  cardStyle?: React.CSSProperties;
  gradientColors?: boolean;
}

const GraphiqueLineaire: React.FC<GraphiqueLineaireProps> = ({
  data,
  series,
  title,
  height = 400,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  type = 'line',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  formatTooltip,
  formatXAxisLabel,
  formatYAxisLabel,
  cardStyle,
  gradientColors = false,
}) => {
  // Fonction de formatage par défaut pour le tooltip
  const defaultFormatTooltip = (value: any, name: string, props: any) => {
    if (name.includes('%')) {
      return [`${value}%`, name];
    }
    return [value, name];
  };

  // Fonction de formatage par défaut pour l'axe X
  const defaultFormatXAxis = (value: any) => {
    // Si c'est une date au format YYYY-MM, on la convertit
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = value.split('-');
      const monthNames = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return value;
  };

  // Rendu du graphique selon le type
  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height,
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const xAxisProps = {
      dataKey: xAxisKey,
      tickFormatter: formatXAxisLabel || defaultFormatXAxis,
      tick: { fontSize: 12 },
      ...(xAxisLabel && { label: { value: xAxisLabel, position: 'insideBottom', offset: -10 } })
    };

    const yAxisProps = {
      tickFormatter: formatYAxisLabel,
      tick: { fontSize: 12 },
      ...(yAxisLabel && { label: { value: yAxisLabel, angle: -90, position: 'insideLeft' } })
    };

    const tooltipProps = showTooltip ? {
      formatter: formatTooltip || defaultFormatTooltip,
      labelFormatter: formatXAxisLabel || defaultFormatXAxis,
      contentStyle: {
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }
    } : {};

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}
            {gradientColors && (
              <defs>
                {series.map((serie, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={serie.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={serie.color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
            )}
            {series.map((serie, index) => (
              <Area
                key={serie.dataKey}
                type="monotone"
                dataKey={serie.dataKey}
                stroke={serie.color}
                fill={gradientColors ? `url(#gradient-${index})` : serie.color}
                fillOpacity={gradientColors ? 1 : 0.3}
                strokeWidth={2}
                name={serie.name}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}
            {series.map((serie) => (
              <Bar
                key={serie.dataKey}
                dataKey={serie.dataKey}
                fill={serie.color}
                name={serie.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend />}
            {series.map((serie) => (
              <Line
                key={serie.dataKey}
                type="monotone"
                dataKey={serie.dataKey}
                stroke={serie.color}
                strokeWidth={3}
                dot={{ fill: serie.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: serie.color, strokeWidth: 2 }}
                name={serie.name}
              />
            ))}
          </LineChart>
        );
    }
  };

  const content = (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );

  // Si un titre est fourni, on encapsule dans une Card
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

export default GraphiqueLineaire;
