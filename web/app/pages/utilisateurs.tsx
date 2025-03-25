import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { VerifyResultWithData } from '@clubmanager/types';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/modal';
import '../styles/utilisateurs-style.css';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fonction pour calculer l'âge à partir de la date de naissance
function calculateAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState<VerifyResultWithData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  const [expand, setExpand] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Term for search

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/utilisateurs');
        if (!response.ok) {
          throw new Error('Erreur réseau lors de la récupération des utilisateurs');
        }
        const utilisateurs: VerifyResultWithData[] = await response.json();
        setUtilisateurs(utilisateurs.data);
      } catch (error) {
        setError('Erreur lors de la récupération des données');
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, []);

  const showUtilisateur = async (utilisateurId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/utilisateurs/${utilisateurId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur de récupération des utilisateurs');
      }

      const participants = await response.json();
      navigate(`/pages/utilisateurs/participants`, {
        state: { participants },
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert("Impossible de récupérer les participants pour cet utilisateur.");
    }
  };

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = utilisateurs.filter((utilisateur) => {
    const fullName = `${utilisateur.first_name} ${utilisateur.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleNextPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(1);
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

  const expandSearchButton = () => {
    setExpand(!expand);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value)
    setSearchTerm(event.target.value);
  };

  return (
    <Provider store={store}>
      <div className='utilisateurs-header-content'>
        <h1>Liste des utilisateurs</h1>
        <div className={`search-box ${expand ? 'expanded' : ''}`}>
          <div className={`search-box-content ${expand ? 'expanded' : ''}`}>
            <input
              type='text'
              placeholder="Rechercher par nom ou prénom..."
              className={expand ? 'expanded' : ''}
              value={searchTerm}
              onChange={handleSearch} // Gérer la recherche en temps réel
            />
          </div>
          <div className='search-box-icon' onClick={expandSearchButton}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="header">
        <div className="class-list-header">
          <div className="first-name"><span>Prénom</span></div>
          <div className="last-name"><span>Nom</span></div>
          <div className="email"><span>Email</span></div>
          <div className="date-naissance"><span>Date de naissance</span></div>
          <div className="age"><span>Âge</span></div>
        </div>
      </div>
      <div className="class-list">
        {currentUsers.map((utilisateur) => (
          <div
            className="class-list-item"
            key={utilisateur.id}
            onClick={() => showUtilisateur(utilisateur.id)}
          >
            <div className="first-name">{utilisateur.first_name}</div>
            <div className="last-name">{utilisateur.last_name}</div>
            <div className="email">{utilisateur.email}</div>
            <div className="date-naissance">{formatDateFromISO(utilisateur.date_of_birth)}</div>
            <div className="age">{calculateAge(utilisateur.date_of_birth)}</div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Zm-80-240Zm0 90v-180l-136 90 136 90Z" /></svg>
        </button>

        {/* Affichage des pages dynamiquement */}
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
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z" /></svg>
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

export default Utilisateurs;
