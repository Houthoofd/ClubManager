import React from 'react';
import { Button } from '@patternfly/react-core';
import { EditIcon, TrashIcon, ClockIcon, CalendarAltIcon, TimesIcon } from '@/shared/icons';

interface CoursCardProps {
  cours: any;
  onModifier: () => void;
  onSupprimer: () => void;
  onDissocierProfesseur: (prof: string) => void;
}

const CoursCard: React.FC<CoursCardProps> = ({
  cours,
  onModifier,
  onSupprimer,
  onDissocierProfesseur
}) => {
  return (
    <div className="cours-card">
      <div className="cours-card-header">
        <h3 className="cours-card-title">
          {cours.nom || `${cours.type_cours} - ${cours.jour_semaine || cours.jour}`}
        </h3>
        <span className="cours-card-type">
          {cours.type_cours}
        </span>
      </div>

      <div className="cours-card-info">
        <div className="cours-card-info-item">
          <CalendarAltIcon />
          <span>{cours.jour_semaine || cours.jour}</span>
        </div>
        <div className="cours-card-info-item">
          <ClockIcon />
          <span>{cours.heure_debut.substring(0, 5)} - {cours.heure_fin.substring(0, 5)}</span>
        </div>
      </div>

      {cours.professeurs && cours.professeurs.length > 0 && (
        <div className="cours-card-professeurs">
          <div className="cours-card-professeurs-title">Professeurs :</div>
          <div>
            {cours.professeurs.map((prof: any, index: number) => {
              const profName = typeof prof === 'string' 
                ? prof 
                : prof?.prenom && prof?.nom 
                  ? `${prof.prenom} ${prof.nom}`
                  : prof?.first_name && prof?.last_name
                    ? `${prof.first_name} ${prof.last_name}`
                    : prof?.name || `Professeur ${index + 1}`;

              return (
                <span key={index} className="cours-professeur-badge">
                  {profName}
                  <button
                    className="cours-professeur-remove"
                    onClick={() => onDissocierProfesseur(profName)}
                    aria-label="Dissocier professeur"
                  >
                    <TimesIcon />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="cours-card-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={onModifier}
          icon={<EditIcon />}
        >
          Modifier
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onSupprimer}
          icon={<TrashIcon />}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
};

export default CoursCard;
