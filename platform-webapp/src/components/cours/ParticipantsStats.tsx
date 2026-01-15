import React from 'react';
import { Card, CardBody, Title } from '@patternfly/react-core';

interface ParticipantsStatsProps {
  totalParticipants: number;
  presents: number;
  absents: number;
  nonDefinis: number;
}

const ParticipantsStats: React.FC<ParticipantsStatsProps> = ({
  totalParticipants,
  presents,
  absents,
  nonDefinis
}) => {
  return (
    <Card className="participants-stats">
      <CardBody>
        <Title headingLevel="h3" style={{ marginBottom: '1rem', color: '#495057' }}>
          Statistiques de présence
        </Title>
        <div className="participants-stats-grid">
          <div className="participants-stat-item">
            <div className="participants-stat-number">{totalParticipants}</div>
            <div className="participants-stat-label">Total</div>
          </div>
          <div className="participants-stat-item">
            <div className="participants-stat-number" style={{ color: '#28a745' }}>
              {presents}
            </div>
            <div className="participants-stat-label">Présents</div>
          </div>
          <div className="participants-stat-item">
            <div className="participants-stat-number" style={{ color: '#dc3545' }}>
              {absents}
            </div>
            <div className="participants-stat-label">Absents</div>
          </div>
          <div className="participants-stat-item">
            <div className="participants-stat-number" style={{ color: '#6c757d' }}>
              {nonDefinis}
            </div>
            <div className="participants-stat-label">Non définis</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ParticipantsStats;
