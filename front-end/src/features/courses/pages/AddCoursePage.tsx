import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  PageSection,
} from "@patternfly/react-core";
import {
  useAjouterCours,
  useProfesseurs,
  useJoursDeCours,
  useModifierCours,
} from "../hooks/useCours";
import {
  useSupprimerCoursRecurrent,
  useRetirerProfesseursDuCours,
} from "../hooks/useProfesseurs";
import { useCheckCoursPlanning } from "@/hooks/useVerification";
import CoursForm from "../components/CoursForm";
import CoursList from "../components/CoursList";
import CoursModals from "../components/CoursModals";
import { PageHeader } from "@/components/common/PageHeader";
import { safeSubstring } from "@/utils/safeSubstring";
import ResultModal from "@/components/common/modal/ResultModal";
import { LastProfessorWarningModal } from "@/components/modals/LastProfessorWarningModal";

const AjouterCoursPage: React.FC = () => {
  // États pour la gestion des onglets, formulaires et modales
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    { id: number; name: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [professeurADissocier, setProfesseurADissocier] = useState<{
    cours: any;
    prof: any;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coursASupprimer, setCoursASupprimer] = useState<any | null>(null);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [showAjoutModal, setShowAjoutModal] = useState(false);
  const [ajoutMessage, setAjoutMessage] = useState<string | null>(null);
  const [ajoutSuccess, setAjoutSuccess] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState(false);
  const [originalCours, setOriginalCours] = useState<any | null>(null);
  const [showConfirmModificationModal, setShowConfirmModificationModal] =
    useState(false);
  const [modificationsResume, setModificationsResume] = useState<string[]>([]);

  // Nouveaux états pour ResultModal
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalSuccess, setResultModalSuccess] = useState(false);

  // Nouveaux états pour la modal d'avertissement du dernier professeur
  const [showLastProfessorWarning, setShowLastProfessorWarning] =
    useState(false);
  const [
    pendingLastProfessorDissociation,
    setPendingLastProfessorDissociation,
  ] = useState<{
    cours: any;
    prof: any;
    isLastProfessor: boolean;
  } | null>(null);

  // Hooks React Query
  const { data: professeurs = [], isLoading: loadingProfesseurs } =
    useProfesseurs();
  const { data: planningCours = [], isLoading: loadingPlanning } =
    useJoursDeCours();

  const ajouterCours = useAjouterCours();
  const modifierCours = useModifierCours();
  const supprimerCoursRecurrent = useSupprimerCoursRecurrent();
  const retirerProfesseursDuCours = useRetirerProfesseursDuCours();
  const checkCoursPlanning = useCheckCoursPlanning();

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !selectedType || !jour || !heureDebut || !heureFin) {
      console.warn("Certains champs obligatoires sont manquants.");
      return;
    }

    try {
      if (isModifying && originalCours) {
        const modifications: string[] = [];
        const originalNom =
          originalCours?.nom ||
          `${originalCours?.type_cours} - ${originalCours?.jour || originalCours?.jour_semaine}`;

        // Comparaison des heures avec valeurs par défaut
        const originalHeureDebutFormatted = safeSubstring(
          originalCours?.heure_debut || "00:00",
          0,
          5,
        );
        const originalHeureFinFormatted = safeSubstring(
          originalCours?.heure_fin || "00:00",
          0,
          5,
        );

        if (heureDebut !== originalHeureDebutFormatted) {
          modifications.push(
            `Heure de début: "${originalHeureDebutFormatted}" → "${heureDebut}"`,
          );
        }

        if (heureFin !== originalHeureFinFormatted) {
          modifications.push(
            `Heure de fin: "${originalHeureFinFormatted}" → "${heureFin}"`,
          );
        }

        // Comparaison du nom
        if (nom !== originalNom) {
          modifications.push(`Nom: "${originalNom}" → "${nom}"`);
        }

        // Comparaison du type de cours
        if (selectedType !== originalCours?.type_cours) {
          modifications.push(
            `Type: "${originalCours?.type_cours}" → "${selectedType}"`,
          );
        }

        // Comparaison du jour
        const originalJour = originalCours?.jour || originalCours?.jour_semaine;
        if (jour !== originalJour) {
          modifications.push(`Jour: "${originalJour}" → "${jour}"`);
        }

        // Comparaison des professeurs
        const professeursOriginaux = (originalCours?.professeurs || [])
          .map((prof: any) => {
            if (typeof prof === "string") return prof;
            if (prof?.prenom && prof?.nom) return `${prof.prenom} ${prof.nom}`;
            if (prof?.first_name && prof?.last_name)
              return `${prof.first_name} ${prof.last_name}`;
            if (prof?.name) return prof.name;
            return "";
          })
          .filter(Boolean)
          .sort();

        const professeursActuels = selectedUsers.map((u) => u.name).sort();

        if (
          JSON.stringify(professeursOriginaux) !==
          JSON.stringify(professeursActuels)
        ) {
          const ajouts = professeursActuels.filter(
            (p) => !professeursOriginaux.includes(p),
          );
          const retraits = professeursOriginaux.filter(
            (p) => !professeursActuels.includes(p),
          );

          if (ajouts.length > 0) {
            modifications.push(`Professeurs ajoutés: ${ajouts.join(", ")}`);
          }
          if (retraits.length > 0) {
            modifications.push(`Professeurs retirés: ${retraits.join(", ")}`);
          }
        }

        // Affichage des modifications ou message si aucune modification
        if (modifications.length > 0) {
          setModificationsResume(modifications);
          setShowConfirmModificationModal(true);
        } else {
          setAjoutSuccess(false);
          setAjoutMessage("Aucune modification détectée.");
          setShowAjoutModal(true);
        }
      } else {
        // Vérification si un cours existe déjà au même créneau
        const coursExiste = await checkCoursPlanning(
          jour,
          heureDebut,
          heureFin,
          selectedType,
        );
        if (coursExiste) {
          setAjoutSuccess(false);
          setAjoutMessage(
            `Un cours existe déjà le ${jour} de ${heureDebut} à ${heureFin}. Veuillez choisir un autre créneau.`,
          );
          setShowAjoutModal(true);
          return;
        }
        await executerAjoutCours();
      }
    } catch (error: any) {
      console.error("Erreur lors de l'ajout/modification du cours:", error);
      setAjoutSuccess(false);
      setAjoutMessage(
        error?.message || "Erreur lors de l'ajout/modification du cours.",
      );
      setShowAjoutModal(true);
    }
  };

  // Réinitialisation du formulaire
  const resetFormulaire = () => {
    setNom("");
    setSelectedType(null);
    setJour(null);
    setHeureDebut("");
    setHeureFin("");
    setSelectedUsers([]);
    setIsModifying(false);
    setOriginalCours(null);
  };

  // Confirmation des modifications
  const confirmerModification = async () => {
    try {
      setShowConfirmModificationModal(false);
      const horaireChange =
        heureDebut !==
          safeSubstring(originalCours?.heure_debut || "00:00", 0, 5) ||
        heureFin !== safeSubstring(originalCours?.heure_fin || "00:00", 0, 5) ||
        jour !== originalCours?.jour;

      if (horaireChange && originalCours) {
        const coursExiste = await checkCoursPlanning(
          jour,
          heureDebut,
          heureFin,
          "",
          {
            excludeOriginal: true,
            originalJour: originalCours?.jour,
            originalType: originalCours?.type_cours,
            originalHeureDebut: safeSubstring(
              originalCours?.heure_debut || "00:00",
              0,
              5,
            ),
            originalHeureFin: safeSubstring(
              originalCours?.heure_fin || "00:00",
              0,
              5,
            ),
          },
        );

        if (coursExiste) {
          setAjoutSuccess(false);
          setAjoutMessage(
            `Un cours existe déjà le ${jour} de ${heureDebut} à ${heureFin}. Veuillez choisir un autre créneau.`,
          );
          setShowAjoutModal(true);
          return;
        }
      }
      await executerModificationCours();
    } catch (error: any) {
      setAjoutSuccess(false);
      setAjoutMessage(
        error?.message || "Erreur lors de la modification du cours.",
      );
      setShowAjoutModal(true);
    }
  };

  // Exécution de l'ajout d'un cours
  const executerAjoutCours = async () => {
    // Validation : Vérifier qu'au moins un professeur est sélectionné
    if (selectedUsers.length === 0) {
      setAjoutSuccess(false);
      setAjoutMessage(
        "Veuillez sélectionner au moins un professeur pour ce cours.",
      );
      setShowAjoutModal(true);
      return;
    }

    const coursData = {
      nom,
      type_cours: selectedType,
      jour_semaine: jour,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      professeurs: selectedUsers.map((u) => u.name),
    };

    try {
      const result = await ajouterCours.mutateAsync(coursData);

      // Attendre un peu pour que les invalidations se propagent
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAjoutSuccess(true);
      setAjoutMessage(
        `Le cours ${selectedType} du ${jour} a été ajouté avec succès !`,
      );
      setShowAjoutModal(true);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur lors de l'ajout du cours:", error);
      throw error;
    }
  };

  // Exécution de la modification d'un cours
  const executerModificationCours = async () => {
    if (!originalCours) return;

    // Validation : Vérifier qu'au moins un professeur est sélectionné
    if (selectedUsers.length === 0) {
      setAjoutSuccess(false);
      setAjoutMessage("Un cours doit avoir au moins un professeur assigné.");
      setShowAjoutModal(true);
      return;
    }

    const coursData = {
      nom,
      type_cours: selectedType,
      jour: jour,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      professeurs: selectedUsers.map((u) => u.name),
      jour_original: originalCours?.jour,
      type_cours_original: originalCours?.type_cours,
      heure_debut_original: originalCours?.heure_debut
        ? originalCours.heure_debut.substring(0, 5)
        : "",
      heure_fin_original: originalCours?.heure_fin
        ? originalCours.heure_fin.substring(0, 5)
        : "",
    };

    console.log("Données du cours à modifier:", coursData);

    try {
      const result = await modifierCours.mutateAsync(coursData);
      console.log("Résultat modification cours:", result);

      // Attendre un peu pour que les invalidations se propagent
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAjoutSuccess(true);
      setAjoutMessage(
        `Le cours ${selectedType} du ${jour} a été modifié avec succès !`,
      );
      setShowAjoutModal(true);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur lors de la modification du cours:", error);
      throw error;
    }
  };

  // Conversion du jour en français
  const convertJourToFrench = (jourAnglais: string) => {
    const joursMapping: { [key: string]: string } = {
      Monday: "Lundi",
      Tuesday: "Mardi",
      Wednesday: "Mercredi",
      Thursday: "Jeudi",
      Friday: "Vendredi",
      Saturday: "Samedi",
      Sunday: "Dimanche",
    };
    return joursMapping[jourAnglais] || jourAnglais;
  };

  // Ouverture de la modale de modification
  const ouvrirModalModification = (cours: any) => {
    console.log("Cours à modifier:", cours);
    setNom(
      cours.nom || `${cours.type_cours} - ${cours.jour || cours.jour_semaine}`,
    );
    setSelectedType(cours.type_cours);

    let jourToUse = cours.jour_semaine || cours.jour;
    if (!jourToUse && cours.jour_cours) {
      jourToUse = convertJourToFrench(cours.jour_cours);
    }
    setJour(jourToUse);

    // Utilisation de valeurs par défaut pour éviter les erreurs
    setHeureDebut(safeSubstring(cours.heure_debut || "00:00", 0, 5));
    setHeureFin(safeSubstring(cours.heure_fin || "00:00", 0, 5));

    // Correction : Améliorer la gestion des professeurs
    let profs: { id: number; name: string }[] = [];
    if (Array.isArray(cours.professeurs)) {
      profs = cours.professeurs
        .map((prof: any, index: number) => {
          let profName = "";
          let profId = Math.random();

          if (typeof prof === "string") {
            profName = prof;
            // Chercher l'ID du professeur dans la liste complète
            const professeurComplet = professeurs.find(
              (p) =>
                `${p.first_name} ${p.last_name}` === profName ||
                `${p.prenom} ${p.nom}` === profName ||
                p.name === profName,
            );
            profId = professeurComplet?.id || Math.random();
          } else if (prof && typeof prof === "object") {
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

          return {
            id: profId,
            name: profName,
          };
        })
        .filter((prof) => prof.name && prof.name !== "Aucun professeur");
    }

    console.log("Professeurs extraits pour modification:", profs);
    setSelectedUsers(profs);
    setIsModifying(true);
    setOriginalCours({ ...cours, jour: jourToUse });
    setActiveTabKey(0);
  };

  // Fonction pour vérifier si c'est le dernier professeur d'un cours (CORRIGÉE)
  const isLastProfessorForCourse = (cours: any, professorName: string) => {
    console.log("🔍 DEBUG - Vérification dernier professeur");
    console.log("🔍 Cours reçu:", cours);
    console.log("🔍 Professeur à vérifier:", professorName);

    if (!cours.professeurs) {
      console.log("❌ Pas de professeurs dans le cours");
      return false;
    }

    // Gérer le cas où professeurs est une string (un seul professeur)
    let professeursArray: string[] = [];
    if (typeof cours.professeurs === "string") {
      professeursArray = [cours.professeurs];
    } else if (Array.isArray(cours.professeurs)) {
      professeursArray = cours.professeurs;
    } else {
      console.log("❌ Format de professeurs non reconnu:", cours.professeurs);
      return false;
    }

    console.log("🔍 Array des professeurs:", professeursArray);

    // Filtrer les professeurs valides (exclure "Aucun professeur", null, undefined, chaînes vides)
    const professeursValides = professeursArray.filter((prof: any) => {
      if (!prof) return false;
      if (typeof prof !== "string") return false;
      const profTrimmed = prof.trim();
      return (
        profTrimmed !== "" &&
        profTrimmed !== "Aucun professeur" &&
        profTrimmed !== "null" &&
        profTrimmed !== "undefined"
      );
    });

    console.log("🔍 Professeurs valides filtrés:", professeursValides);
    console.log("🔍 Nombre de professeurs valides:", professeursValides.length);

    // Vérifier si le professeur à dissocier est dans la liste
    const professeurTrouve = professeursValides.some((prof: string) => {
      const profNormalized = prof.trim().toLowerCase();
      const professorNameNormalized = professorName.trim().toLowerCase();
      console.log(
        `🔍 Comparaison: "${profNormalized}" === "${professorNameNormalized}" ?`,
        profNormalized === professorNameNormalized,
      );
      return profNormalized === professorNameNormalized;
    });

    console.log("🔍 Professeur trouvé dans la liste:", professeurTrouve);

    // C'est le dernier professeur SI:
    // 1. Il n'y a qu'un seul professeur valide ET
    // 2. Ce professeur est celui qu'on veut dissocier
    const isLast = professeursValides.length === 1 && professeurTrouve;

    console.log("🔍 RÉSULTAT - Est le dernier professeur:", isLast);
    console.log(
      "🔍 Logique: professeursValides.length === 1 &&",
      professeursValides.length === 1,
    );
    console.log("🔍 Logique: professeurTrouve &&", professeurTrouve);

    return isLast;
  };

  // Ouverture de la modale de dissociation (AMÉLIORÉE avec enrichissement des données)
  const ouvrirModalDissociation = (professeurOuCours: any, prof?: string) => {
    console.log("🔍 === DÉBUT DISSOCIATION ===");
    console.log("🔍 Données reçues pour dissociation:", {
      professeurOuCours,
      prof,
    });

    let cours: any;
    let professeurName: string;

    // Gestion des deux formats possibles d'appel
    if (prof) {
      // Format: ouvrirModalDissociation(cours, professeurName)
      cours = professeurOuCours;
      professeurName = prof;
      console.log("✅ Format détecté: (cours, professeurName)");
    } else if (professeurOuCours?.prof?.name && professeurOuCours?.cours) {
      // Format: ouvrirModalDissociation({prof: {name: "..."}, cours: {...}})
      cours = professeurOuCours.cours;
      professeurName = professeurOuCours.prof.name;
      console.log("✅ Format détecté: {prof: {name}, cours: {}}");
    } else {
      console.error(
        "❌ Format de données invalide pour la dissociation:",
        professeurOuCours,
      );
      setResultModalMessage("Erreur: Données de dissociation invalides.");
      setResultModalSuccess(false);
      setShowResultModal(true);
      return;
    }

    console.log("✅ Cours identifié:", cours);
    console.log("✅ Professeur identifié:", `"${professeurName}"`);

    // 🎯 ENRICHISSEMENT: Récupérer les professeurs du cours depuis planningCours
    if (!cours.professeurs && planningCours) {
      const coursComplet = planningCours.find(
        (c) =>
          c.type_cours === cours.type_cours &&
          c.jour === cours.jour &&
          c.heure_debut === cours.heure_debut &&
          c.heure_fin === cours.heure_fin,
      );

      if (coursComplet && coursComplet.professeurs) {
        cours.professeurs = coursComplet.professeurs;
        console.log(
          "✅ Professeurs enrichis depuis planningCours:",
          cours.professeurs,
        );
      } else {
        console.log(
          "⚠️ Cours complet non trouvé dans planningCours, recherche par jour uniquement",
        );
        const coursParJour = planningCours.find(
          (c) => c.jour === cours.jour && c.type_cours === cours.type_cours,
        );
        if (coursParJour && coursParJour.professeurs) {
          cours.professeurs = coursParJour.professeurs;
          console.log("✅ Professeurs enrichis par jour:", cours.professeurs);
        } else {
          console.log("❌ Impossible d'enrichir les professeurs");
        }
      }
    }

    // Validation des données
    if (!professeurName || professeurName.trim() === "") {
      console.error("❌ Nom du professeur manquant ou vide");
      setResultModalMessage("Erreur: Nom du professeur manquant.");
      setResultModalSuccess(false);
      setShowResultModal(true);
      return;
    }

    if (!cours) {
      console.error("❌ Informations du cours manquantes");
      setResultModalMessage("Erreur: Informations du cours manquantes.");
      setResultModalSuccess(false);
      setShowResultModal(true);
      return;
    }

    // Vérifier si c'est le dernier professeur (avec debug amélioré)
    console.log("🔍 === VÉRIFICATION DERNIER PROFESSEUR ===");
    console.log("🔍 Cours avec professeurs enrichis:", cours);
    const isLast = isLastProfessorForCourse(cours, professeurName);
    console.log("🔍 === RÉSULTAT FINAL ===");
    console.log(
      `🔍 Est le dernier professeur: ${isLast ? "✅ OUI" : "❌ NON"}`,
    );

    if (isLast) {
      // C'est le dernier professeur - afficher l'avertissement spécial
      console.log("🚨 ACTIVATION LastProfessorWarningModal");
      setPendingLastProfessorDissociation({
        cours: { ...cours, jour: cours.jour_semaine || cours.jour },
        prof: { name: professeurName },
        isLastProfessor: true,
      });
      setShowLastProfessorWarning(true);
    } else {
      // Dissociation normale
      console.log("👍 ACTIVATION Modal normale");
      setProfesseurADissocier({
        cours: { ...cours, jour: cours.jour_semaine || cours.jour },
        prof: { name: professeurName },
      });
      setIsModalOpen(true);
    }

    console.log("🔍 === FIN DISSOCIATION ===");
  };

  // Confirmation de la dissociation (normale)
  const confirmerDissociation = async () => {
    if (!professeurADissocier) return;

    const professeurName = professeurADissocier.prof.name;
    const coursInfo = professeurADissocier.cours;

    console.log("🔍 Confirmation dissociation - Professeur:", professeurName);
    console.log("🔍 Confirmation dissociation - Cours:", coursInfo);

    // Validation finale
    if (!professeurName || professeurName.trim() === "") {
      console.error("❌ Nom du professeur invalide lors de la confirmation");
      setResultModalMessage("Erreur: Nom du professeur invalide.");
      setResultModalSuccess(false);
      setShowResultModal(true);
      setIsModalOpen(false);
      setProfesseurADissocier(null);
      return;
    }

    try {
      const professeursNoms = [professeurName];
      const jourCours = coursInfo.jour_semaine || coursInfo.jour;

      console.log("🎯 Envoi des données:", {
        professeursNoms,
        jour: jourCours,
        type_cours: coursInfo.type_cours,
        heure_debut: coursInfo.heure_debut,
        heure_fin: coursInfo.heure_fin,
      });

      // 🎯 IMPORTANT: Passer TOUTES les informations du cours pour éviter les ambiguïtés
      await retirerProfesseursDuCours.mutateAsync({
        professeursNoms,
        jour: jourCours,
        type_cours: coursInfo.type_cours,
        heure_debut: coursInfo.heure_debut,
        heure_fin: coursInfo.heure_fin,
      });

      // Remplacer setSuccessMessage par ResultModal
      setResultModalMessage(
        `Le professeur ${professeurName} a bien été dissocié du cours ${coursInfo.type_cours} du ${jourCours} (${coursInfo.heure_debut}-${coursInfo.heure_fin}).`,
      );
      setResultModalSuccess(true);
      setShowResultModal(true);

      // Fermer la modal de confirmation
      setIsModalOpen(false);
      setProfesseurADissocier(null);
    } catch (error: any) {
      console.error("Erreur lors de la dissociation du professeur:", error);
      setResultModalMessage(
        error?.message || "Erreur lors de la dissociation du professeur.",
      );
      setResultModalSuccess(false);
      setShowResultModal(true);

      // Fermer la modal de confirmation
      setIsModalOpen(false);
      setProfesseurADissocier(null);
    }
  };

  // Handler pour confirmer la dissociation du dernier professeur
  const confirmerDissociationDernierProfesseur = async () => {
    if (!pendingLastProfessorDissociation) return;

    const professeurName = pendingLastProfessorDissociation.prof.name;
    const coursInfo = pendingLastProfessorDissociation.cours;

    console.log(
      "🔍 Confirmation dernier professeur - Professeur:",
      professeurName,
    );
    console.log("🔍 Confirmation dernier professeur - Cours:", coursInfo);

    // Validation finale
    if (!professeurName || professeurName.trim() === "") {
      console.error(
        "❌ Nom du professeur invalide lors de la confirmation du dernier professeur",
      );
      setResultModalMessage("Erreur: Nom du professeur invalide.");
      setResultModalSuccess(false);
      setShowResultModal(true);
      setShowLastProfessorWarning(false);
      setPendingLastProfessorDissociation(null);
      return;
    }

    setShowLastProfessorWarning(false);

    try {
      const jourCours = coursInfo.jour;

      console.log("🎯 Envoi des données pour dernier professeur:", {
        professeursNoms: [professeurName],
        jour: jourCours,
        type_cours: coursInfo.type_cours,
        heure_debut: coursInfo.heure_debut,
        heure_fin: coursInfo.heure_fin,
      });

      // Dissocier le professeur
      await retirerProfesseursDuCours.mutateAsync({
        professeursNoms: [professeurName],
        jour: jourCours,
        type_cours: coursInfo.type_cours,
        heure_debut: coursInfo.heure_debut,
        heure_fin: coursInfo.heure_fin,
      });

      // Supprimer également le cours récurrent car il n'a plus de professeur
      await supprimerCoursRecurrent.mutateAsync(jourCours.toLowerCase().trim());

      // Afficher le succès avec message spécifique
      setResultModalSuccess(true);
      setResultModalMessage(
        `Le professeur ${professeurName} a été dissocié et le cours "${coursInfo.type_cours} - ${coursInfo.jour}" a été supprimé car il n'avait plus de professeur assigné.`,
      );
      setShowResultModal(true);
    } catch (error: any) {
      console.error(
        "Erreur lors de la dissociation du dernier professeur:",
        error,
      );
      setResultModalSuccess(false);
      setResultModalMessage(
        error?.message ||
          "Erreur lors de la dissociation du dernier professeur",
      );
      setShowResultModal(true);
    } finally {
      setPendingLastProfessorDissociation(null);
    }
  };

  // Vérification si les données sont en cours de chargement ou non disponibles
  const isLoadingData =
    loadingProfesseurs || loadingPlanning || !planningCours || !professeurs;
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    // Vérifiez si les données sont prêtes
    if (!loadingProfesseurs && !loadingPlanning) {
      // Permettre l'affichage même si planningCours est vide (pour pouvoir créer le premier cours)
      setIsDataReady(true);
    }
  }, [loadingProfesseurs, loadingPlanning, planningCours, professeurs]);

  if (!isDataReady) {
    return (
      <PageSection>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  // Permettre l'affichage même si planningCours est vide
  const filteredPlanningCours = planningCours
    ? planningCours.filter((cours) => {
        return (
          cours.heure_debut && cours.heure_fin && cours.jour && cours.type_cours
        );
      })
    : [];

  const normalizedPlanningCours = filteredPlanningCours.map((cours) => ({
    ...cours,
    heure_debut: cours.heure_debut || "00:00",
    heure_fin: cours.heure_fin || "00:00",
    professeurs:
      cours.professeurs &&
      cours.professeurs.length > 0 &&
      cours.professeurs[0] !== null
        ? cours.professeurs
        : ["Aucun professeur"],
  }));

  const coursList =
    normalizedPlanningCours.length > 0 ? (
      normalizedPlanningCours.map((cours, index) => (
        <div key={index}>
          <p>Type de cours : {cours.type_cours}</p>
          <p>Jour : {cours.jour}</p>
          <p>
            Heure : {cours.heure_debut} - {cours.heure_fin}
          </p>
          <p>Professeurs : {cours.professeurs.join(", ")}</p>
        </div>
      ))
    ) : (
      <p>Aucun cours à afficher.</p>
    );

  // Ouverture de la modale de suppression
  const ouvrirModalSuppression = (cours: any) => {
    console.log("🗑️ Ouverture modal suppression pour:", cours);
    setCoursASupprimer({ ...cours, jour: cours.jour_semaine || cours.jour });
    setShowSupprimerModal(true);
  };

  // Confirmation de la suppression
  const confirmerSuppression = async () => {
    if (!coursASupprimer) return;

    try {
      const jourASupprimer =
        coursASupprimer.jour_semaine || coursASupprimer.jour;
      console.log("🗑️ Suppression du cours:", jourASupprimer);

      await supprimerCoursRecurrent.mutateAsync(
        jourASupprimer.toLowerCase().trim(),
      );

      // Remplacer setSuccessMessage par ResultModal
      setResultModalMessage(
        `Le cours ${coursASupprimer.type_cours} du ${jourASupprimer} a bien été supprimé.`,
      );
      setResultModalSuccess(true);
      setShowResultModal(true);

      setShowSupprimerModal(false);
      setCoursASupprimer(null);
    } catch (error: any) {
      console.error("Erreur lors de la suppression du cours:", error);
      setResultModalMessage(
        error?.message || "Erreur lors de la suppression du cours.",
      );
      setResultModalSuccess(false);
      setShowResultModal(true);

      setShowSupprimerModal(false);
      setCoursASupprimer(null);
    }
  };

  // Annulation de la suppression
  const annulerSuppression = () => {
    console.log("❌ Annulation suppression cours");
    setShowSupprimerModal(false);
    setCoursASupprimer(null);
  };

  // Handler pour annuler la dissociation du dernier professeur
  const annulerDissociationDernierProfesseur = () => {
    console.log("❌ Annulation dissociation dernier professeur");
    setShowLastProfessorWarning(false);
    setPendingLastProfessorDissociation(null);
  };

  // Annulation de la dissociation (normale)
  const annulerDissociation = () => {
    console.log("❌ Annulation dissociation normale");
    setIsModalOpen(false);
    setProfesseurADissocier(null);
    setSuccessMessage(null);
  };

  // Fermeture de la modale d'ajout
  const fermerAjoutModal = () => {
    console.log("❌ Fermeture modal ajout");
    setShowAjoutModal(false);
    setAjoutMessage(null);
    setAjoutSuccess(false);
  };

  // Annulation de la confirmation de modification
  const annulerConfirmationModification = () => {
    console.log("❌ Annulation confirmation modification");
    setShowConfirmModificationModal(false);
    setModificationsResume([]);
  };

  // Rendu principal
  return (
    <div className="courses-page">
      <PageHeader
        title="Ajouter un cours"
        subtitle="Créez un nouveau cours de jiu-jitsu brésilien"
        variant="courses"
      />
      <PageSection className="courses-content">
        <div className="cours-container">
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
                nom={nom}
                setNom={setNom}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                jour={jour}
                setJour={setJour}
                heureDebut={heureDebut}
                setHeureDebut={setHeureDebut}
                heureFin={heureFin}
                setHeureFin={setHeureFin}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                professeurs={professeurs}
                isModifying={isModifying}
                originalCours={originalCours}
                onSubmit={handleSubmit}
                onAnnulerModification={resetFormulaire}
              />
            </Tab>
            <Tab
              eventKey={1}
              title={<TabTitleText>Voir les cours</TabTitleText>}
            >
              <CoursList
                cours={filteredPlanningCours}
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

          {/* Modal d'avertissement pour le dernier professeur */}
          <LastProfessorWarningModal
            isOpen={showLastProfessorWarning}
            onClose={annulerDissociationDernierProfesseur}
            onConfirm={confirmerDissociationDernierProfesseur}
            professorName={
              pendingLastProfessorDissociation
                ? pendingLastProfessorDissociation.prof.name
                : ""
            }
            courseName={
              pendingLastProfessorDissociation
                ? `${pendingLastProfessorDissociation.cours.type_cours} - ${pendingLastProfessorDissociation.cours.jour}`
                : ""
            }
          />

          {/* Nouvelle ResultModal pour les opérations de cours */}
          <ResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            title={resultModalSuccess ? "Succès" : "Erreur"}
            message={resultModalMessage}
            isSuccess={resultModalSuccess}
          />
        </div>
      </PageSection>
    </div>
  );
};

export default AjouterCoursPage;
