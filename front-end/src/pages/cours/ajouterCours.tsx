import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { useAjouterCours, useProfesseurs, useJoursDeCours, useModifierCours } from '../../hooks/useCours';
import { useSupprimerCoursRecurrent, useRetirerProfesseursDuCours } from '../../hooks/useProfesseurs';
import { useCheckCoursPlanning } from '../../hooks/useVerification';
import CoursForm from '../../components/cours/CoursForm';
import CoursList from '../../components/cours/CoursList';
import CoursModals from '../../components/cours/CoursModals';

const AjouterCours = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [professeurADissocier, setProfesseurADissocier] = useState<{ cours: any; prof: any } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coursASupprimer, setCoursASupprimer] = useState<any | null>(null);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [ajoutMessage, setAjoutMessage] = useState<string | null>(null);
  const [ajoutSuccess, setAjoutSuccess] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState(false);
  const [originalCours, setOriginalCours] = useState<any | null>(null);
  const [showConfirmModificationModal, setShowConfirmModificationModal] = useState(false);
  const [modificationsResume, setModificationsResume] = useState<string[]>([]);

  // Hooks React Query
  const { data: professeurs = [], isLoading: loadingProfesseurs } = useProfesseurs();
  const { data: planningCours = [], isLoading: loadingPlanning } = useJoursDeCours();
  const ajouterCours = useAjouterCours();
  const modifierCours = useModifierCours();
  const supprimerCoursRecurrent = useSupprimerCoursRecurrent();
  const retirerProfesseursDuCours = useRetirerProfesseursDuCours();
  const checkCoursPlanning = useCheckCoursPlanning();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !selectedType || !jour || !heureDebut || !heureFin) return;

    try {
      if (isModifying) {
        const modifications: string[] = [];
        
        const originalNom = originalCours?.nom || `${originalCours?.type_cours} - ${originalCours?.jour || originalCours?.jour_semaine}`;
        if (nom !== originalNom) {
          modifications.push(`Nom: "${originalNom}" → "${nom}"`);
        }
        
        if (selectedType !== originalCours?.type_cours) {
          modifications.push(`Type: "${originalCours?.type_cours}" → "${selectedType}"`);
        }
        
        const originalJour = originalCours?.jour || originalCours?.jour_semaine;
        if (jour !== originalJour) {
          modifications.push(`Jour: "${originalJour}" → "${jour}"`);
        }
        
        if (heureDebut !== originalCours?.heure_debut.substring(0, 5)) {
          modifications.push(`Heure de début: "${originalCours?.heure_debut.substring(0, 5)}" → "${heureDebut}"`);
        }
        
        if (heureFin !== originalCours?.heure_fin.substring(0, 5)) {
          modifications.push(`Heure de fin: "${originalCours?.heure_fin.substring(0, 5)}" → "${heureFin}"`);
        }

        const professeursOriginaux = (originalCours?.professeurs || []).map((prof: any) => {
          if (typeof prof === 'string') return prof;
          if (prof?.prenom && prof?.nom) return `${prof.prenom} ${prof.nom}`;
          if (prof?.first_name && prof?.last_name) return `${prof.first_name} ${prof.last_name}`;
          if (prof?.name) return prof.name;
          return '';
        }).filter(Boolean).sort();
        
        const professeursActuels = selectedUsers.map(u => u.name).sort();
        
        if (JSON.stringify(professeursOriginaux) !== JSON.stringify(professeursActuels)) {
          const ajouts = professeursActuels.filter(p => !professeursOriginaux.includes(p));
          const retraits = professeursOriginaux.filter(p => !professeursActuels.includes(p));
          
          if (ajouts.length > 0) {
            modifications.push(`Professeurs ajoutés: ${ajouts.join(', ')}`);
          }
          if (retraits.length > 0) {
            modifications.push(`Professeurs retirés: ${retraits.join(', ')}`);
          }
        }

        if (modifications.length > 0) {
          setModificationsResume(modifications);
          setShowConfirmModificationModal(true);
          return;
        } else {
          setAjoutSuccess(false);
          setAjoutMessage("Aucune modification détectée.");
          setShowAjoutModal(true);
          return;
        }
      } else {
        const coursExiste = await checkCoursPlanning(jour, heureDebut, heureFin, selectedType);
        if (coursExiste) {
          setAjoutSuccess(false);
          setAjoutMessage(`Un cours existe déjà le ${jour} de ${heureDebut} à ${heureFin}. Veuillez choisir un autre créneau.`);
          setShowAjoutModal(true);
          return;
        }

        await executerAjoutCours();
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout/modification du cours:', error);
      setAjoutSuccess(false);
      setAjoutMessage(error?.message || 'Erreur lors de l\'ajout/modification du cours.');
      setShowAjoutModal(true);
    }
  };

  const resetFormulaire = () => {
    setNom('');
    setSelectedType(null);
    setJour(null);
    setHeureDebut('');
    setHeureFin('');
    setSelectedUsers([]);
    setIsModifying(false);
    setOriginalCours(null);
  };

  const confirmerModification = async () => {
    try {
      setShowConfirmModificationModal(false);
      const horaireChange = heureDebut !== originalCours?.heure_debut.substring(0, 5) ||
                           heureFin !== originalCours?.heure_fin.substring(0, 5) ||
                           jour !== originalCours?.jour;
      
      if (horaireChange) {
        const coursExiste = await checkCoursPlanning(jour, heureDebut, heureFin, '', {
          excludeOriginal: true,
          originalJour: originalCours?.jour,
          originalType: originalCours?.type_cours,
          originalHeureDebut: originalCours?.heure_debut.substring(0, 5),
          originalHeureFin: originalCours?.heure_fin.substring(0, 5)
        });
        
        if (coursExiste) {
          setAjoutSuccess(false);
          setAjoutMessage(`Un cours existe déjà le ${jour} de ${heureDebut} à ${heureFin}. Veuillez choisir un autre créneau.`);
          setShowAjoutModal(true);
          return;
        }
      }

      await executerModificationCours();
    } catch (error: any) {
      console.error('Erreur lors de la modification du cours:', error);
      setAjoutSuccess(false);
      setAjoutMessage(error?.message || 'Erreur lors de la modification du cours.');
      setShowAjoutModal(true);
    }
  };

  const executerAjoutCours = async () => {
    const coursData = {
      nom, type_cours: selectedType, jour_semaine: jour,
      heure_debut: heureDebut, heure_fin: heureFin,
      professeurs: selectedUsers.map(u => u.name)
    };

    await ajouterCours.mutateAsync(coursData);
    setAjoutSuccess(true);
    setAjoutMessage(`Le cours ${selectedType} du ${jour} a été ajouté avec succès !`);
    setShowAjoutModal(true);
    resetFormulaire();
  };

  const executerModificationCours = async () => {
    const coursData = {
      nom, type_cours: selectedType, jour: jour,
      heure_debut: heureDebut, heure_fin: heureFin,
      professeurs: selectedUsers.map(u => u.name),
      jour_original: originalCours?.jour,
      type_cours_original: originalCours?.type_cours,
      heure_debut_original: originalCours?.heure_debut.substring(0, 5),
      heure_fin_original: originalCours?.heure_fin.substring(0, 5)
    };

    await modifierCours.mutateAsync(coursData);
    setAjoutSuccess(true);
    setAjoutMessage(`Le cours ${selectedType} du ${jour} a été modifié avec succès !`);
    setShowAjoutModal(true);
    resetFormulaire();
  };

  const convertJourToFrench = (jourAnglais: string) => {
    const joursMapping: { [key: string]: string } = {
      'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
    };
    return joursMapping[jourAnglais] || jourAnglais;
  };

  const ouvrirModalModification = (cours: any) => {
    console.log("Cours à modifier:", cours);
    setNom(cours.nom || `${cours.type_cours} - ${cours.jour || cours.jour_semaine}`);
    setSelectedType(cours.type_cours);
    
    // PRIORITÉ À jour_semaine car c'est le jour du cours récurrent
    let jourToUse = cours.jour_semaine;
    if (!jourToUse && cours.jour_cours) {
      jourToUse = convertJourToFrench(cours.jour_cours);
    }
    if (!jourToUse && cours.jour) {
      jourToUse = cours.jour;
    }
    setJour(jourToUse);
    
    setHeureDebut(cours.heure_debut.substring(0, 5));
    setHeureFin(cours.heure_fin.substring(0, 5));
    
    let profs: { id: number; name: string }[] = [];
    
    if (Array.isArray(cours.professeurs)) {
      profs = cours.professeurs.map((prof: any, index: number) => {
        let profName = '';
        let profId = Math.random();
        
        if (typeof prof === 'string') {
          profName = prof;
        } else if (prof && typeof prof === 'object') {
          if (prof.prenom && prof.nom) {
            profName = `${prof.prenom} ${prof.nom}`;
            profId = prof.id || prof.professeur_id || Math.random();
          } else if (prof.first_name && prof.last_name) {
            profName = `${prof.first_name} ${prof.last_name}`;
            profId = prof.id || Math.random();
          } else if (prof.name) {
            profName = prof.name;
            profId = prof.id || Math.random();
          } else {
            console.warn("Format de professeur non reconnu:", prof);
            profName = `Professeur ${index + 1}`;
          }
        }
        
        const professeurComplet = professeurs.find(p => 
          `${p.first_name} ${p.last_name}` === profName ||
          `${p.prenom} ${p.nom}` === profName ||
          p.name === profName
        );
        
        return {
          id: professeurComplet?.id || profId,
          name: profName
        };
      }).filter(prof => prof.name);
    }
    
    setSelectedUsers(profs);
    setIsModifying(true);
    setOriginalCours({ ...cours, jour: jourToUse });
    setActiveTabKey(0);
  };

  const ouvrirModalDissociation = (cours: any, prof: string) => {
    setProfesseurADissocier({ 
      cours: { ...cours, jour: cours.jour_semaine || cours.jour }, 
      prof: { name: prof } 
    });
    setIsModalOpen(true);
  };

  const confirmerDissociation = async () => {
    if (!professeurADissocier) return;
    
    try {
      const professeursNoms = [professeurADissocier.prof.name];
      const jourCours = professeurADissocier.cours.jour_semaine || professeurADissocier.cours.jour;
      await retirerProfesseursDuCours.mutateAsync({ professeursNoms, jour: jourCours });
      setSuccessMessage(`Le professeur ${professeurADissocier.prof.name} a bien été dissocié du cours ${professeurADissocier.cours.type_cours} du ${jourCours}.`);
    } catch (error) {
      console.error('Erreur lors de la dissociation du professeur:', error);
      setSuccessMessage("Erreur lors de la dissociation du professeur.");
    }
  };

  const annulerDissociation = () => {
    setIsModalOpen(false);
    setProfesseurADissocier(null);
    setSuccessMessage(null); // Réinitialiser le message de succès
  };

  const ouvrirModalSuppression = (cours: any) => {
    setCoursASupprimer({ ...cours, jour: cours.jour_semaine || cours.jour });
    setShowSupprimerModal(true);
  };

  const confirmerSuppression = async () => {
    if (!coursASupprimer) return;
    
    try {
      const jourASupprimer = coursASupprimer.jour_semaine || coursASupprimer.jour;
      await supprimerCoursRecurrent.mutateAsync(jourASupprimer.toLowerCase().trim());
      setSuccessMessage(`Le cours ${coursASupprimer.type_cours} du ${jourASupprimer} a bien été supprimé.`);
      setShowSupprimerModal(false);
      setCoursASupprimer(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du cours:', error);
      setSuccessMessage("Erreur lors de la suppression du cours.");
      setShowSupprimerModal(false);
    }
  };

  const annulerSuppression = () => {
    setShowSupprimerModal(false);
    setCoursASupprimer(null);
  };

  const fermerAjoutModal = () => {
    setShowAjoutModal(false);
    setAjoutMessage(null);
    setAjoutSuccess(false);
  };

  const annulerConfirmationModification = () => {
    setShowConfirmModificationModal(false);
    setModificationsResume([]);
  };

  if (loadingProfesseurs || loadingPlanning) {
    return (
      <PageSection>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  return (
    <div className="cours-container">
      {/* Header */}
      <div className="cours-header">
        <Title headingLevel="h1" size="2xl" className="cours-header-title">
          Gestion des cours
        </Title>
        <p className="cours-header-subtitle">
          Planifiez et gérez les cours du club
        </p>
      </div>

      {/* Tabs */}
      <Tabs 
        activeKey={activeTabKey} 
        onSelect={(_e, key) => setActiveTabKey(key as number)}
        className="modern-tabs"
      >
        <Tab 
          eventKey={0} 
          title={<TabTitleText>Ajouter un cours</TabTitleText>}
        >
          <CoursForm
            nom={nom} setNom={setNom}
            selectedType={selectedType} setSelectedType={setSelectedType}
            jour={jour} setJour={setJour}
            heureDebut={heureDebut} setHeureDebut={setHeureDebut}
            heureFin={heureFin} setHeureFin={setHeureFin}
            selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers}
            professeurs={professeurs} isModifying={isModifying} originalCours={originalCours}
            onSubmit={handleSubmit} onAnnulerModification={resetFormulaire}
          />
        </Tab>
        <Tab 
          eventKey={1} 
          title={<TabTitleText>Voir les cours</TabTitleText>}
        >
          <CoursList
            cours={planningCours}
            onModifierCours={ouvrirModalModification}
            onSupprimerCours={ouvrirModalSuppression}
            onDissocierProfesseur={ouvrirModalDissociation}
          />
        </Tab>
      </Tabs>
      
      <CoursModals
        isModalOpen={isModalOpen} 
        successMessage={successMessage} 
        professeurADissocier={professeurADissocier}
        onAnnulerDissociation={annulerDissociation} 
        onConfirmerDissociation={confirmerDissociation}
        showSupprimerModal={showSupprimerModal} 
        coursASupprimer={coursASupprimer}
        onAnnulerSuppression={annulerSuppression} 
        onConfirmerSuppression={confirmerSuppression}
        showAjoutModal={showAjoutModal} 
        ajoutSuccess={ajoutSuccess} 
        ajoutMessage={ajoutMessage}
        onFermerAjoutModal={fermerAjoutModal}
        showConfirmModificationModal={showConfirmModificationModal} 
        modificationsResume={modificationsResume}
        originalCours={originalCours} 
        onAnnulerConfirmationModification={annulerConfirmationModification}
        onConfirmerModification={confirmerModification}
      />
    </div>
  );
};

export default AjouterCours;



