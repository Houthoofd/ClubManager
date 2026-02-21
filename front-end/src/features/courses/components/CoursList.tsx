import React from "react";
import CoursCard from "./CoursCard";
import { EmptyList } from "@/shared/components/ui";

interface CoursListProps {
  cours: any[];
  onModifierCours: (cours: any) => void;
  onSupprimerCours: (cours: any) => void;
  onDissocierProfesseur: (cours: any, prof: string) => void;
}

const CoursList: React.FC<CoursListProps> = ({
  cours,
  onModifierCours,
  onSupprimerCours,
  onDissocierProfesseur,
}) => {
  if (cours.length === 0) {
    return <EmptyList entityName="cours" addButtonText="Ajouter un cours" />;
  }

  const handleDissocierProfesseur = (professeur: string, cours: any) => {
    console.log("🎯 Dissociation avec contexte complet:", {
      professeur,
      cours: {
        jour: cours.jour,
        type_cours: cours.type_cours,
        heure_debut: cours.heure_debut,
        heure_fin: cours.heure_fin,
      },
    });

    onDissocierProfesseur({
      prof: { name: professeur },
      cours: {
        jour_semaine: cours.jour,
        jour: cours.jour,
        type_cours: cours.type_cours,
        heure_debut: cours.heure_debut,
        heure_fin: cours.heure_fin,
      },
    });
  };

  return (
    <div className="cours-cards-grid">
      {cours.map((c, index) => (
        <CoursCard
          key={index}
          cours={c}
          onModifier={() => onModifierCours(c)}
          onSupprimer={() => onSupprimerCours(c)}
          onDissocierProfesseur={(prof) => handleDissocierProfesseur(prof, c)}
        />
      ))}
    </div>
  );
};

export default CoursList;
