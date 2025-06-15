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
  EnvelopeIcon
} from '@patternfly/react-icons';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface AppPanelHeaderProps {
  onSidebarToggle: () => void;
  onLogout?: () => void;
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

const AppPanelHeader = ({ onSidebarToggle, onLogout }: AppPanelHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullName, setFullName] = useState('Utilisateur');
  const [roleLabel, setRoleLabel] = useState('');
  const toggleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const user = parsedData?.data;

      const name = user?.nom ?? 'Utilisateur';
      const statusId = user?.status_id;

      setFullName(name);
      setRoleLabel(mapRole(statusId));
    }
  }, []);

  const handleToggleClick = () => setIsDropdownOpen(prev => !prev);

  const handleSelect = () => setIsDropdownOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    onLogout?.();
    navigate('/pages/connexion');
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
                      <MenuItem to="/pages/profile" component="a">Profil</MenuItem>
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
