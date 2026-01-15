import React from 'react';
import {
  Card,
  Badge,
  Flex,
  FlexItem,
  CardTitle,
  CardBody,
  CardFooter,
  Button,
} from '@patternfly/react-core';
import { PencilAltIcon, ClockIcon, UserIcon, CalendarAltIcon } from '@patternfly/react-icons';

interface CarteCoursProps {
  cours: any;
  onModifier: (cours: any) => void;
  onSupprimer: (cours: any) => void;
  onDissocierProfesseur: (cours: any, prof: string) => void;
}

const CarteCours: React.FC<CarteCoursProps> = ({
  cours,
  onModifier,
  onSupprimer,
  onDissocierProfesseur,
}) => {
  const formatDateSansJour = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const convertJourToFrench = (jourAnglais: string) => {
    const joursMapping: { [key: string]: string } = {
      'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
    };
    return joursMapping[jourAnglais] || jourAnglais;
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'JJB': return { color: '#2e7d32', bgColor: '#e8f5e8' };
      case 'Grappling': return { color: '#f57c00', bgColor: '#fff3e0' };
      case 'Judo': return { color: '#1565c0', bgColor: '#e1f5fe' };
      default: return { color: '#007bff', bgColor: '#e3f2fd' };
    }
  };

  const { color: typeColor, bgColor: typeBgColor } = getTypeColors(cours.type_cours);
  
  // IMPORTANT: Utiliser jour_semaine en priorité car c'est le jour du cours récurrent
  const jourAffiche = cours.jour_semaine || cours.jour || (cours.date_cours ? convertJourToFrench(cours.jour_cours) : '');

  return (
    <Card 
      isHoverable 
      style={{ 
        height: '100%',
        border: `2px solid ${typeColor}`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <div style={{ background: typeBgColor, padding: '0.75rem', borderBottom: `1px solid ${typeColor}` }}>
        <CardTitle>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Badge style={{ backgroundColor: typeColor, color: 'white', fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
                {cours.type_cours}
              </Badge>
            </FlexItem>
          </Flex>
        </CardTitle>
      </div>
      
      <CardBody style={{ padding: '1rem' }}>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <CalendarAltIcon style={{ marginRight: 8, color: typeColor, fontSize: '1.1rem' }} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {cours.date_cours ? (
                  <>
                    {jourAffiche} - {formatDateSansJour(cours.date_cours)}
                  </>
                ) : (
                  jourAffiche
                )}
              </span>
            </Flex>
          </FlexItem>
          
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <ClockIcon style={{ marginRight: 8, color: '#6a6e73', fontSize: '1rem' }} />
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {cours.heure_debut} - {cours.heure_fin}
              </span>
            </Flex>
          </FlexItem>
          
          {Array.isArray(cours.professeurs) && cours.professeurs.length > 0 && (
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                <UserIcon style={{ marginRight: 8, color: '#6a6e73', fontSize: '1rem' }} />
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  Professeur{cours.professeurs.length > 1 ? 's' : ''}:
                </span>
              </Flex>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {cours.professeurs.map((prof: any, idx: number) => (
                  <Badge 
                    key={idx}
                    style={{ 
                      backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ddd',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                      gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '6px',
                      marginRight: '0.5rem', marginBottom: '0.25rem'
                    }}
                    onClick={() => onDissocierProfesseur(cours, typeof prof === 'string' ? prof : `${prof.prenom} ${prof.nom}`)}
                  >
                    {typeof prof === 'string' ? prof : `${prof.prenom} ${prof.nom}`}
                    <span style={{ marginLeft: '0.25rem', fontWeight: 'bold' }}>×</span>
                  </Badge>
                ))}
              </div>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
      
      <CardFooter style={{ padding: '0.75rem 1rem', background: '#fafafa' }}>
        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
          <Button variant="secondary" size="sm" onClick={() => onModifier(cours)}>
            <PencilAltIcon style={{ marginRight: '0.25rem' }} />
            Modifier
          </Button>
          <Button variant="danger" size="sm" onClick={() => onSupprimer(cours)}>
            Supprimer
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default CarteCours;
