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
  PackageIcon,
  InboxIcon
} from '@patternfly/react-icons';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useMessagesNonLus } from '../hooks/useMessages.js';

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
  console.log('Sidebar isOpen:', isOpen);

  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // NOUVEAU

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const userRole = parsedData?.status;
      const userIdNum = parsedData?.id; // NOUVEAU
      setRole(userRole);
      setUserId(userIdNum); // NOUVEAU
    }
  }, []);

  // UTILISER LE STATE REDUX pour le badge
  const nombreMessagesNonLus = useSelector((state: RootState) => state.messages.nombreMessagesNonLus);

  // Toujours appeler le hook pour maintenir la synchronisation
  useMessagesNonLus(userId || 0);

  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <Nav aria-label="Primary navigation">
        <NavList>
          {/* Tableau de bord - exclure les visiteurs */}
          {hasRole(role, [ROLES.UTILISATEUR, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
            <>
              <div className="sidebar-section-title">Tableau de bord</div>
              
              {/* MODIFIÉ: Ajouter le badge pour les messages */}
              <NavItem to="/pages/messages" itemId="messages">
                <InboxIcon style={iconStyle} />
                Messages
                {nombreMessagesNonLus > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    textAlign: 'center',
                    display: 'inline-block'
                  }}>
                    {nombreMessagesNonLus > 99 ? '99+' : nombreMessagesNonLus}
                  </span>
                )}
              </NavItem>

              {/* Statistiques - uniquement pour admin et professeurs */}
              {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
                <NavItem itemId="statistiques" to="/pages/statistiques">
                  <ClipboardCheckIcon className="sidebar-icon" />
                  Statistiques avancées
                </NavItem>
              )}
              <Divider className="sidebar-divider" />
            </>
          )}

          {/* Cours - accessible à tous les utilisateurs connectés (y compris visiteurs) */}
          <div className="sidebar-section-title">Cours</div>
          <NavItem to="/pages/cours/inscription" data-item-id="inscription">
            <ClipboardCheckIcon className="sidebar-icon" />
            S'inscrire aux cours
          </NavItem>
          
          {/* Gestion des cours - uniquement pour admin et professeurs */}
          {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROFESSEUR]) && (
            <NavExpandable
              title={<span className="sidebar-nav-expandable-title"><BookIcon className="sidebar-icon" /> Gestion des cours</span>}
              itemID="courses-management"
            >
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
              {hasRole(role, [ROLES.PROFESSEUR]) && (
                <>
                  <NavItem to="/pages/professeurs/planning" itemId="planning-professeur">
                    <GraduationCapIcon className="sidebar-icon" />
                    Mon planning de cours
                  </NavItem>
                </>
              )}
            </NavExpandable>
          )}
          <Divider className="sidebar-divider" />

          {/* Magasin - accessible à tous les utilisateurs connectés */}
          <div className="sidebar-section-title">Magasin</div>
          <NavItem to="/pages/magasin/magasin" itemId="magasin">
            <StoreIcon className="sidebar-icon" />
            Boutique
          </NavItem>
          
          {/* Gestion du magasin - uniquement pour admin */}
          {hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN]) && (
            <NavExpandable
              title={<span className="sidebar-nav-expandable-title"><StoreIcon className="sidebar-icon" /> Gestion magasin</span>}
              itemID="store-management"
            >
              <NavItem to="/pages/magasin/commandes" itemId="commandes">
                <PackageIcon className="sidebar-icon" />
                Commandes
              </NavItem>
              <NavItem to="/pages/magasin/ajouter-article" itemId="ajouter-article">
                <ShoppingCartIcon className="sidebar-icon" />
                Ajouter un article
              </NavItem>
            </NavExpandable>
          )}
          <Divider className="sidebar-divider" />

          {/* Paiements - uniquement pour admin et professeurs */}
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

          {/* Gestion des utilisateurs - uniquement pour super admin */}
          {hasRole(role, [ROLES.SUPER_ADMIN]) && (
            <>
              <div className="sidebar-section-title">Administration</div>
              <NavExpandable
                title={<span className="sidebar-nav-expandable-title"><UsersIcon className="sidebar-icon" /> Utilisateurs</span>}
                itemID="users"
              >
                <NavItem to="/pages/utilisateurs/ajouter-utilisateur" itemId="ajouter-utilisateur">
                  <PlusCircleIcon className="sidebar-icon" />
                  Ajouter
                </NavItem>
              </NavExpandable>
              <Divider className="sidebar-divider" />
            </>
          )}

          {/* Paramètres - accessible à tous */}
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

