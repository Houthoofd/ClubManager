import {
  Masthead,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  MastheadLogo,
  MastheadContent,
  Button,
  Flex,
  FlexItem,
  Tooltip,
  Avatar,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Popper,
} from '@patternfly/react-core';
import {
  BarsIcon,
  BellIcon,
  EnvelopeIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  SignOutAltIcon,
} from '@patternfly/react-icons';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { ouvrirPanier } from '../redux/slices/panierSlice';
import { setUnreadCount, setNombreMessagesNonLus } from '../redux/slices/messagesSlice';
import { apiUrl } from '../pages/apiUrl';
import { clearAllAuthData } from '../utils/authCleaner';

const avatarImg = '/assets/avatar.png'; // Chemin relatif à partir de `public`

interface AppPanelHeaderProps {
  username: string;
  onSidebarToggle: () => void; // Fonction pour basculer la sidebar
  onLogout?: () => void;
  userData: any; // Ajout de la propriété userData
}

const ROLES = {
  VISITEUR: 'Visiteur',
  UTILISATEUR: 'Utilisateur',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super-Administrateur',
  PROFESSEUR: 'Professeur'
};

const mapRole = (id: number): string => {
  switch (id) {
    case 1: return ROLES.VISITEUR;
    case 2: return ROLES.UTILISATEUR;
    case 3: return ROLES.ADMIN;
    case 4: return ROLES.SUPER_ADMIN;
    case 5: return ROLES.PROFESSEUR;
    default: return 'Inconnu';
  }
};

const AppPanelHeader = ({ onSidebarToggle, onLogout, userData }: AppPanelHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullName, setFullName] = useState('Utilisateur');
  const [roleLabel, setRoleLabel] = useState('');
  const toggleRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const panierCount = useSelector((state: RootState) => state.panier.articles.length);
  const nombreMessagesNonLus = useSelector((state: RootState) => state.messages.nombreMessagesNonLus);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userData?.id) return;
      
      try {
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     JSON.parse(localStorage.getItem('userData') || '{}').token;

        const response = await fetch(apiUrl(`messages/non-lus/${userData.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            dispatch(setNombreMessagesNonLus(data.data.count));
          }
        } else {
          console.warn('⚠️ [Header] Réponse non-OK pour messages non lus:', response.status);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
      }
    };

    fetchUnreadCount();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [userData?.id, dispatch]);

  useEffect(() => {
    if (userData) {
      const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Utilisateur';
      const role = userData.status || 'Inconnu';

      setFullName(name);
      setRoleLabel(role);
    }
  }, [userData]);

  const handleToggleClick = () => setIsDropdownOpen(prev => !prev);

  const handleSelect = () => setIsDropdownOpen(false);

  const handleLogout = async () => {
    console.log('🚪 Début de la déconnexion...');
    
    // CORRECTION: Utiliser la version async de clearAllAuthData
    await clearAllAuthData();
    
    // Appeler le callback de déconnexion
    onLogout?.();
    
    console.log('✅ Déconnexion terminée, redirection...');
    
    // Rediriger vers la page de connexion
    navigate('/pages/connexion');
  };

  const handleOuvrirPanier = () => {
    dispatch(ouvrirPanier());
    navigate('/pages/magasin/magasin');
  };

  // Fonction pour naviguer vers les messages non lus
  const handleNavigateToMessages = () => {
    // Naviguer vers la page des messages avec l'onglet "non-lus" activé
    navigate('/pages/messages?tab=non-lus');
  };

  return (
    <Masthead id="app-header">
      <MastheadMain>
        <MastheadToggle>
          <Button
            variant="plain"
            onClick={onSidebarToggle}
            aria-label="Toggle navigation"
            icon={<BarsIcon />}
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo component="a">MonApp</MastheadLogo>
        </MastheadBrand>
      </MastheadMain>

      <MastheadContent>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentFlexEnd' }}
          style={{ width: '100%' }}
        >
          <FlexItem grow={{ default: 'grow' }} />

          {/* Bouton Messages avec notification */}
          <FlexItem>
            <Tooltip content={`Messages${nombreMessagesNonLus > 0 ? ` (${nombreMessagesNonLus} non lus)` : ''}`}>
              <Button
                variant="plain"
                aria-label={`Messages${nombreMessagesNonLus > 0 ? ` (${nombreMessagesNonLus} non lus)` : ''}`}
                style={{ position: 'relative' }}
                onClick={handleNavigateToMessages}
              >
                <EnvelopeIcon />
                {nombreMessagesNonLus > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {nombreMessagesNonLus > 99 ? '99+' : nombreMessagesNonLus}
                  </span>
                )}
              </Button>
            </Tooltip>
          </FlexItem>

          <FlexItem>
            <Tooltip content="Panier">
              <Button
                variant="plain"
                aria-label="Panier"
                style={{ position: 'relative' }}
                onClick={handleOuvrirPanier}
              >
                <ShoppingCartIcon />
                {panierCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {panierCount}
                  </span>
                )}
              </Button>
            </Tooltip>
          </FlexItem>

          <FlexItem>
            <Link to="/pages/compte" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsFlexEnd' }}>
                <span style={{ fontWeight: 'bold' }}>{fullName}</span>
                <span style={{ fontSize: '0.75rem', color: '#6a6e73' }}>{roleLabel}</span>
              </Flex>
            </Link>
          </FlexItem>

          <FlexItem>
            <MenuToggle
              ref={toggleRef}
              onClick={handleToggleClick}
              isExpanded={isDropdownOpen}
              icon={<Avatar src="https://via.placeholder.com/150" alt="Avatar utilisateur" />}
            />
            <Popper
              triggerRef={toggleRef}
              popper={
                <Menu onSelect={handleSelect}>
                  <MenuContent>
                    <MenuList>
                      <MenuItem to="/pages/compte" component="a">
                        <UserIcon style={{ marginRight: '8px' }} />
                        Profil
                      </MenuItem>
                      <MenuItem to="/pages/settings" component="a">
                        <CogIcon style={{ marginRight: '8px' }} />
                        Paramètres
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <SignOutAltIcon style={{ marginRight: '8px' }} />
                        Déconnexion
                      </MenuItem>
                    </MenuList>
                  </MenuContent>
                </Menu>
              }
              isVisible={isDropdownOpen}
              position="bottom-end"
            />
          </FlexItem>
        </Flex>
      </MastheadContent>
    </Masthead>
  );
};

export default AppPanelHeader;