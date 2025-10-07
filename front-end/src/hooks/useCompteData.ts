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
import { useEcheancesUtilisateur } from './usePaiements';

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

  // Utiliser le hook des échéances avec une gestion d'erreur améliorée
  const { 
    data: paiementsEcheances = [], 
    isLoading: loadingEcheances,
    error: errorEcheances 
  } = useEcheancesUtilisateur(utilisateurId || 0);

  // Log pour debug - AMÉLIORÉ avec debug de l'ID utilisateur
  useEffect(() => {
    if (utilisateurId) {
      console.log('🔍 [useCompteData] Chargement des échéances pour utilisateur:', utilisateurId);
      
      // DEBUG: Vérifier toutes les sources d'ID utilisateur
      console.log('🔑 [useCompteData] Sources d\'ID utilisateur:', {
        utilisateurIdCalcule: utilisateurId,
        userDataId: userData?.id,
        paramId: id,
        localStorageUserId: localStorage.getItem('userId'),
        localStorageUserData: !!localStorage.getItem('userData')
      });
      
      // DEBUG: Vérifier l'état du token
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('jwt') || 
                   localStorage.getItem('accessToken');
      
      console.log('🔑 [useCompteData] État du token:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20),
        localStorageKeys: Object.keys(localStorage),
        userDataInLS: !!localStorage.getItem('userData')
      });

      // DEBUG: Si pas de token, vérifier si l'utilisateur devrait être connecté
      if (!token && localStorage.getItem('userData')) {
        console.warn('⚠️ [useCompteData] userData présent mais pas de token - possible problème de déconnexion');
        const userData = localStorage.getItem('userData');
        try {
          const user = JSON.parse(userData!);
          console.log('👤 [useCompteData] Info utilisateur sans token:', {
            id: user.id,
            email: user.email,
            role: user.role
          });
        } catch (e) {
          console.error('❌ [useCompteData] Erreur parsing userData:', e);
        }
      }
    }
    
    if (errorEcheances) {
      console.error('❌ [useCompteData] Erreur lors du chargement des échéances:', errorEcheances);
      
      // Vérifier si c'est une erreur d'authentification
      if (errorEcheances.message?.includes('403') || 
          errorEcheances.message?.includes('401') ||
          errorEcheances.message?.includes('Token manquant')) {
        console.error('🚨 [useCompteData] Erreur d\'authentification détectée');
        console.log('🔄 [useCompteData] Suggestion: Reconnectez-vous pour obtenir un nouveau token');
        console.log('🔄 [useCompteData] Debug localStorage complet:', {
          allKeys: Object.keys(localStorage),
          allValues: Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key)?.substring(0, 30) + '...';
            return acc;
          }, {} as Record<string, string>)
        });
      }
    }
    if (paiementsEcheances) {
      console.log('✅ [useCompteData] Échéances chargées:', paiementsEcheances.length, 'échéances');
    }
  }, [utilisateurId, errorEcheances, paiementsEcheances]);

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
    loadingEcheances,
    errorEcheances,
  };
};