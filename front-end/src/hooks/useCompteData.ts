import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useCompteInfo,
  useUpdateCompte,
  useAbonnements,
  useGrades,
  useStatus,
  useGenres
} from './useCompte';
import { useFrequentationByUserId } from './useStatistiques';
import { useEcheancesByUserId } from './usePaiements';

export const useCompteData = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  // récupération userData depuis localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Erreur parsing localStorage:', error);
      }
    }
  }, []);

  const utilisateurId = userData?.id || id || null;

  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(
    userData?.first_name || null,
    userData?.last_name || null
  );

  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(
    utilisateurId
  );

  const { data: paiementsEcheances = [] } = useEcheancesByUserId(utilisateurId);
  const updateCompte = useUpdateCompte();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: status = [] } = useStatus();
  const { data: genres = [] } = useGenres();

  // data ready ?
  useEffect(() => {
    if (compteInfo && userData && !loadingCompte) {
      setIsDataReady(true);
    }
  }, [compteInfo, userData, loadingCompte]);

  // Transformation des données pour GraphiqueLineaire
  const statsDataReady =
    statFrequentation &&
    Array.isArray(statFrequentation.mois) &&
    statFrequentation.mois.length > 0;

  const statFrequentationForGraph = statsDataReady
    ? {
        ...statFrequentation,
        mois: statFrequentation.mois.map((item: any) => ({
          mois: item.mois,
          frequentation: item.frequentation,
          pourcentage_de_cours_valides: item.pourcentageCoursValides,
          nombres_total_de_cours_du_mois: item.totalCoursMois,
        }))
      }
    : undefined;

  return {
    userData,
    utilisateurId,
    compteInfo,
    statFrequentation,
    paiementsEcheances,
    updateCompte,
    abonnements,
    grades,
    status,
    genres,
    isDataReady,
    statsDataReady,
    statFrequentationForGraph,
    loadingCompte,
    errorCompte,
  };
};
