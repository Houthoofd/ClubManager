import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { VerifyResultWithData } from '@clubmanager/types';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/modal';
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

  const expandSearchButton = () => {
    setExpand(!expand);
  };

  const handleNextPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(1);
  };

  const handleApplyFilters = (filterType: string, filterValue: string) => {
    console.log(`Filtrer par ${filterType}: ${filterValue}`);
    // Logique de filtrage ici : tu peux appliquer les filtres à tes données de paiements
  };

  const getVisiblePages = () => {
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => {
      const direction = prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const expandRightSidePanel = () => {
    dispatch(MAIN_OPEN_RIGHT_SIDE_PANEL()); // Alterne l'affichage de la modale
  };

  // Filtrer les paiements selon le terme de recherche
  const filteredPaiements = paiements.filter(
    (paiement) =>
      paiement.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paiement.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les indices pour les paiements à afficher sur la page actuelle
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredPaiements.slice(indexOfFirstUser, indexOfLastUser);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredPaiements.length / usersPerPage);

  // Fonction pour changer de page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <Provider store={store}>
      <div className="paiements-header-content">
        <h1>Liste des paiements</h1>
          <div className='control-header-panel'>
                <div className={`search-box ${expand ? 'expanded' : ''}`}>
                <div className={`search-box-content ${expand ? 'expanded' : ''}`}>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou prénom..."
                    className={expand ? 'expanded' : ''}
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <div className={`search-box-icon ${expand ? 'expanded' : ''}`} onClick={expandSearchButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                  </svg>
                </div>
              </div>
              <div className={`filter-box ${expand ? 'expanded' : ''}`}>
                <div className={`filter-box-icon ${expand ? 'expanded' : ''}`} onClick={expandRightSidePanel}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/></svg>
                </div>
              </div>
          </div>
      </div>

      <div className="header">
        <div className="class-list-header">
          <div className="nom"><span>nom</span></div>
          <div className="prenom"><span>prenom</span></div>
          <div className="abonnement"><span>Abonnement</span></div>
          <div className="periode-debut"><span>Période début</span></div>
          <div className="periode-fin"><span>Période fin</span></div>
          <div className="Status"><span>Status</span></div>
          <div className="Status"><span></span></div>
        </div>
      </div>

      <div className="class-list">
        {currentUsers?.map((paiement) => (
          <div className="class-list-item" key={paiement.id}>
            <div className="first-name">{paiement.first_name}</div>
            <div className="last-name">{paiement.last_name}</div>
            <div className="abonnement">{paiement.nom_plan}</div>
            <div className="abonnement">{formatDateFromISO(paiement.periode_debut)}</div>
            <div className="abonnement">{formatDateFromISO(paiement.periode_fin)}</div>
            <div className="abonnement">{paiement.statut}</div>
            <div className='icon'><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg></div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Zm-80-240Zm0 90v-180l-136 90 136 90Z" /></svg>
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={page === currentPage ? 'active' : ''}
          >
            {page}
          </button>
        ))}

        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z"/></svg>
        </button>
      </div>

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
