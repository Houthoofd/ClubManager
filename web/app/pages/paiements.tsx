import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { VerifyResultWithData } from '@clubmanager/types';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/modal';
import DataView  from '../../components/ui/dataview';
import '../styles/paiements-style.css';
import { MAIN_OPEN_RIGHT_SIDE_PANEL } from '@/redux/actions';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Paiements = () => {
  const dispatch = useDispatch();


  const [paiements, setPaiements] = useState<VerifyResultWithData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(7);
  const [expand, setExpand] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMainRightSidePanelOpen = useSelector((state: any) => state.navigation.main_content_right_panel);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'first_name',
    direction: 'asc',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/paiements');
        if (!response.ok) {
          throw new Error('Erreur réseau lors de la récupération des paiements');
        }
        const data: VerifyResultWithData[] = await response.json();
        setPaiements(data);
      } catch (error) {
        setError('Erreur lors de la récupération des données');
        setModalMessage('Erreur lors de la récupération des paiements.');
        setShowModal(true);
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Provider store={store}>
      
      <DataView
        data={paiements}
        title="Liste des statuts par utilisateur"
        addExtraColumn={["selected"]}
        excludedColumns={["abonnement_id", "utilisateur_id", "id"]}  // Exclure ces colonnes du tableau
        columnOrder={["selected","first_name", "last_name", "nom_plan", "montant"]} // Ordre des colonnes
        excludedFilteredValues={["selected", "first_name", "last_name", "date_paiement", "periode_debut", "periode_fin"]}  // Exclure 'first_name' et 'last_name' du menu de filtre
      />



      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </Provider>
  );
};

export default Paiements;
