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
  CogIcon, 
  PackageIcon
} from '@patternfly/react-icons';
import { useEffect, useState } from 'react';

interface AppSidebarProps {
  isOpen: boolean;
}

const iconStyle = { marginRight: '8px' };

const sectionTitleStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase', // ici c'est OK
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
  console.log('Sidebar isOpen:', isOpen); // Ajoutez ce log pour vérifier la valeur

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const userRole = parsedData?.status; // Utiliser directement le champ `status`
      setRole(userRole);
    }
  }, []);

  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <Nav aria-label="Primary navigation">
        <NavList>
          {/* Tableau de bord */}
          <div className="sidebar-section-title">Tableau de bord</div>
          <NavItem itemId="dashboard" to="/pages/dashboard">
            <TachometerAltIcon className="sidebar-icon" />
            Accueil
          </NavItem>
          <NavItem itemId="statistiques" to="/pages/statistiques">
            <ClipboardCheckIcon className="sidebar-icon" />
            Statistiques avancées
          </NavItem>
          <Divider className="sidebar-divider" />

          {/* Paiements */}
          {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
            <>
              <div className="sidebar-section-title">Paiements</div>
              <NavItem itemId="paiements" to="/pages/paiements">
                <MoneyCheckAltIcon className="sidebar-icon" />
                Paiements
              </NavItem>
              <Divider className="sidebar-divider" />
            </>
          )}

          {/* Gestion */}
          {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
            <>
              <div className="sidebar-section-title">Gestion</div>

              {hasRole(role, [ROLES.SUPER_ADMIN]) && (
                <NavExpandable
                  title={<span className="sidebar-nav-expandable-title"><UsersIcon className="sidebar-icon" /> Utilisateurs</span>}
                  itemID="users"
                >
                  <NavItem to="/pages/utilisateurs/ajouter-utilisateur" itemId="ajouter-utilisateur">
                    <PlusCircleIcon className="sidebar-icon" />
                    Ajouter
                  </NavItem>
                </NavExpandable>
              )}

              <NavExpandable
                title={<span className="sidebar-nav-expandable-title"><BookIcon className="sidebar-icon" /> Cours</span>}
                itemID="courses"
              >
                <NavItem to="/pages/cours/inscription" data-item-id="inscription">
                  <ClipboardCheckIcon className="sidebar-icon" />
                  S'inscrire
                </NavItem>
                {hasRole(role, [ROLES.SUPER_ADMIN]) && (
                  <>
                    <NavItem to="/pages/cours/ajouter-professeur" itemId="ajouter-professeur">
                      <GraduationCapIcon className="sidebar-icon" />
                      Ajouter un professeur
                    </NavItem>
                    <NavItem to="/pages/cours/ajouter-cours" itemId="ajouter-cours">
                      <EditIcon className="sidebar-icon" />
                      Ajouter un cours
                    </NavItem>
                  </>
                )}
              </NavExpandable>

              <NavExpandable
                title={<span className="sidebar-nav-expandable-title"><StoreIcon className="sidebar-icon" /> Magasins</span>}
                itemID="stores"
              >
                <NavItem to="/pages/magasin/magasin" itemId="magasin">
                  <StoreIcon className="sidebar-icon" />
                  Magasin
                </NavItem>
                {hasRole(role, [ROLES.SUPER_ADMIN]) && (
                  <>
                    <NavItem to="/pages/magasin/commandes" itemId="commandes">
                      <PackageIcon className="sidebar-icon" />
                      Commandes
                    </NavItem>
                    <NavItem to="/pages/magasin/ajouter-article" itemId="ajouter-article">
                      <ShoppingCartIcon className="sidebar-icon" />
                      Ajouter un article
                    </NavItem>
                  </>
                )}
              </NavExpandable>

              <Divider className="sidebar-divider" />
            </>
          )}

          {/* Paramètres */}
          <div className="sidebar-section-title">Paramètres</div>
          <NavItem itemId="profile" to="/pages/compte">
            <UserIcon className="sidebar-icon" />
            Compte
          </NavItem>
          <NavItem itemId="settings" to="/pages/settings">
            <CogIcon className="sidebar-icon" />
            Paramètres
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebar>
  );
};

export default AppSidebar;

