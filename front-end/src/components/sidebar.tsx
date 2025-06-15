import {
  Nav,
  NavItem,
  NavList,
  NavExpandable,
  PageSidebar,
  Divider
} from '@patternfly/react-core';
import {
  TachometerAltIcon,
  UserIcon,
  BookIcon,
  StoreIcon,
  MoneyCheckAltIcon,
  UsersIcon,
  PlusCircleIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  EditIcon,
  ShoppingCartIcon,
  BoxesIcon,
  CogIcon, 
  PackageIcon
} from '@patternfly/react-icons';
import { useEffect, useState } from 'react';

interface AppSidebarProps {
  isOpen: boolean;
}

const iconStyle = { marginRight: '8px' };

const sectionTitleStyle = {
  padding: '0.5rem 1rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: '#6a6e73',
  fontWeight: 'bold'
};

const ROLES = {
  VISITEUR: 'visiteur',
  UTILISATEUR: 'utilisateur',
  ADMIN: 'administrateur',
  SUPER_ADMIN: 'super-administrateur',
  PROFESSEUR: 'professeur'
};

const hasRole = (role: string | null, allowedRoles: string[]) => {
  return role !== null && allowedRoles.includes(role);
};

const AppSidebar = ({ isOpen }: AppSidebarProps) => {
  const [role, setRole] = useState<string | null>(null);

  const mapRole = (id: number) => {
    switch (id) {
      case 1:
        return ROLES.VISITEUR;
      case 2:
        return ROLES.UTILISATEUR;
      case 3:
        return ROLES.ADMIN;
      case 4:
        return ROLES.SUPER_ADMIN;
      case 5:
        return ROLES.PROFESSEUR;
      default:
        return null;
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const statusId = parsedData?.data?.status_id;
      setRole(mapRole(statusId));
    }
  }, []);

  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <Nav aria-label="Primary navigation">
        <NavList>
          {/* Tableau de bord */}
          <div style={sectionTitleStyle}>Tableau de bord</div>
          <NavItem itemId="dashboard" to="/pages/dashboard">
            <TachometerAltIcon style={iconStyle} />
            Accueil
          </NavItem>

          <Divider />

          {/* Paiements */}
          {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
            <>
              <div style={sectionTitleStyle}>Paiements</div>
              <NavItem itemId="paiements" to="/pages/paiements">
                <MoneyCheckAltIcon style={iconStyle} />
                Paiements
              </NavItem>
              <Divider />
            </>
          )}

          {/* Gestion */}
          {(hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR])) && (
            <>
              <div style={sectionTitleStyle}>Gestion</div>

              {(hasRole(role, [ROLES.SUPER_ADMIN])) && (
                <NavExpandable
                  title={<span><UsersIcon style={iconStyle} /> Utilisateurs</span>}
                  itemId="users"
                >
                  <NavItem to="/pages/utilisateurs/ajouter-utilisateur" itemId="ajouter-utilisateur">
                    <PlusCircleIcon style={iconStyle} />
                    Ajouter
                  </NavItem>
                </NavExpandable>
              )}

              <NavExpandable
                title={<span><BookIcon style={iconStyle} /> Cours</span>}
                itemId="courses"
              >
                <NavItem to="/pages/cours/inscription" data-item-id="inscription">
                  <ClipboardCheckIcon style={iconStyle} />
                  S'inscrire
                </NavItem>
                {hasRole(role, [ROLES.SUPER_ADMIN]) && (
                  <>
                    <NavItem to="/pages/cours/ajouter-professeur" itemId="ajouter-professeur">
                      <GraduationCapIcon style={iconStyle} />
                      Ajouter un professeur
                    </NavItem>
                    <NavItem to="/pages/cours/ajouter-cours" itemId="ajouter-cours">
                      <EditIcon style={iconStyle} />
                      Ajouter un cours
                    </NavItem>
                  </>
                )}
              </NavExpandable>

              <NavExpandable
                title={<span><StoreIcon style={iconStyle} /> Magasins</span>}
                itemId="stores"
              >
                <NavItem to="/pages/magasin/magasin" itemId="magasin">
                  <StoreIcon style={iconStyle} />
                  Magasin
                </NavItem>
                {hasRole(role, [ROLES.SUPER_ADMIN]) && (
                  <>
                    <NavItem to="/pages/magasin/ajouter-cours" itemId="store-inventory">
                      <PackageIcon style={iconStyle} />
                      Commandes
                    </NavItem>
                    <NavItem to="/pages/magasin/ajouter-article" itemId="ajouter-article">
                      <ShoppingCartIcon style={iconStyle} />
                      Ajouter un article
                    </NavItem>
                  </>
                )}
              </NavExpandable>

              <Divider />
            </>
          )}

          {/* Paramètres */}
          <div style={sectionTitleStyle}>Paramètres</div>
          <NavItem itemId="profile" to="/pages/compte">
            <UserIcon style={iconStyle} />
            Compte
          </NavItem>
          <NavItem itemId="settings" to="/pages/settings">
            <CogIcon style={iconStyle} />
            Paramètres
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebar>
  );
};

export default AppSidebar;
