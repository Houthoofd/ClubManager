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
  Popper
} from '@patternfly/react-core';
import {
  BarsIcon,
  BellIcon,
  EnvelopeIcon,
  ShoppingCartIcon
} from '@patternfly/react-icons';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { ouvrirPanier } from '../redux/slices/panierSlice';

interface AppPanelHeaderProps {
  username: string;
  onSidebarToggle: () => void;
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

  const handleLogout = () => {
    localStorage.removeItem('userData');
    onLogout?.();
    navigate('/pages/connexion');
  };

  const handleOuvrirPanier = () => {
    dispatch(ouvrirPanier());
    navigate('/pages/magasin/magasin');
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
                  <span style={{
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
                    fontWeight: 'bold'
                  }}>
                    {panierCount}
                  </span>
                )}
              </Button>
            </Tooltip>
          </FlexItem>

          <FlexItem>
            <Link to="/pages/notifications">
              <Tooltip content="Notifications">
                <Button variant="plain" aria-label="Notifications">
                  <BellIcon />
                </Button>
              </Tooltip>
            </Link>
          </FlexItem>

          <FlexItem>
            <Link to="/pages/messages">
              <Tooltip content="Messages">
                <Button variant="plain" aria-label="Messages">
                  <EnvelopeIcon />
                </Button>
              </Tooltip>
            </Link>
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
              icon={<Avatar src="" alt="Avatar" />}
            >
            </MenuToggle>

            <Popper
              triggerRef={toggleRef}
              popper={
                <Menu onSelect={handleSelect}>
                  <MenuContent>
                    <MenuList>
                      <MenuItem to="/pages/compte" component="a">Profil</MenuItem>
                      <MenuItem to="/pages/settings" component="a">Paramètres</MenuItem>
                      <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
                    </MenuList>
                  </MenuContent>
                </Menu>
              }
              isVisible={isDropdownOpen}
              position="center"
            />
          </FlexItem>
        </Flex>
      </MastheadContent>
    </Masthead>
  );
};

export default AppPanelHeader;