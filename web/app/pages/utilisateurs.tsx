import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { UserData, VerifyResultWithData } from '@clubmanager/types';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'first_name', // Colonne initiale à trier
    direction: 'asc',
  });

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

      const utilisateur: UserData = await response.json();
      console.log(utilisateur)
      navigate(`/pages/utilisateurs/utilisateur`, {
        state: { utilisateur },
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert("Impossible de récupérer les participants pour cet utilisateur.");
    }
  };

  async function handleDeleteUtilisateur(utilisateurId: number) {
    try {
        await deleteUtilisateur(utilisateurId);

        // Mise à jour de la liste après suppression
        setUtilisateurs((prevUtilisateurs) =>
            prevUtilisateurs.filter((utilisateur) => utilisateur.id !== utilisateurId)
        );

        // Message de confirmation
        setModalMessage('Utilisateur supprimé avec succès');
        setShowModal(true);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la suppression de l\'utilisateur.');
    }
}


  async function deleteUtilisateur(utilisateurId: number): Promise<void> {

    console.log(utilisateurId);
    try {
        // Envoi de la requête de suppression vers le back-end
        const response = await fetch(`http://localhost:3000/utilisateurs/supprimer`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ utilisateurId }),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de l\'utilisateur');
        }

        const result = await response.json();
        console.log(result.message); // Affiche le message du back-end

    } catch (error) {
        console.error('Erreur:', error);
    }
  }


  // Fonction de tri des utilisateurs
  const sortUsers = (users: VerifyResultWithData[], config: { key: string; direction: 'asc' | 'desc' }) => {
    const sortedUsers = [...users];
    sortedUsers.sort((a, b) => {
      if (a[config.key] < b[config.key]) return config.direction === 'asc' ? -1 : 1;
      if (a[config.key] > b[config.key]) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedUsers;
  };

  // Filtrer et trier les utilisateurs
  const sortedUsers = sortUsers(utilisateurs, sortConfig);

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = sortedUsers.filter((utilisateur) => {
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
    setSearchTerm(event.target.value);
  };

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => {
      const direction = prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
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
              onChange={handleSearch}
            />
          </div>
          <div className={`search-box-icon ${expand ? 'expanded' : ''}`} onClick={expandSearchButton}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="header">
        <div className="class-list-header">
          <div className="first-name" onClick={() => handleSort('first_name')}>
            <div className='sort-icon'>
              <span>Prénom</span>
              
            </div>
          </div>
          <div className="last-name" onClick={() => handleSort('last_name')}>
            <div className='sort-icon'></div><span>Nom</span>
          </div>
          <div className="email"><span>Email</span></div>
          <div className="date-naissance" onClick={() => handleSort('date_of_birth')}>
            <div className='sort-icon'></div><span>Date de naissance</span>
          </div>
          <div className="age" onClick={() => handleSort('date_of_birth')}>
            <div className='sort-icon'></div><span>Âge</span>
          </div>
          <div className="rest"></div>
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
      <div className="age">{calculateAge(utilisateur.date_of_birth)} ans</div>
      <span
        className="icon"
        onClick={(e) => {
          e.stopPropagation(); // évite de déclencher aussi le clic du parent
          handleDeleteUtilisateur(utilisateur.id);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#5f6368"
        >
          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z" />
        </svg>
      </span>
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

export default Utilisateurs;
