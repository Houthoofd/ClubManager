import React, { useState, useEffect, ReactNode } from 'react';
import {
  Page,
  PageSidebar,
  PanelHeader,
  PageSection,
  PageToggleButton,
  Nav,
  NavItem,
  NavList,
  Avatar,
  Dropdown,
  DropdownItem,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  PageSidebarBody
} from '@patternfly/react-core';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { OPEN_RIGHT_NAVBAR } from '@/redux/actions';
import NotificationBell from '../ui/notification-bell';
import DarkModeButton from '../ui/dark-mode-btn';
import LogOutButton from '../ui/logout';
import RightSideBar from '../ui/rightSidebar';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useDispatch();

  const [isNavOpen, setIsNavOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [userData, setUserData] = useState<any | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const notificationsCount = useSelector((state: any) => state.notifications.notifications.length);
  const isDarkMode = useSelector((state: any) => state.settings.darkMode);

  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData.data);
    } else {
      setModalMessage("Veuillez vous connecter afin d'accèder à l'application");
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    dispatch(OPEN_RIGHT_NAVBAR(notificationsCount > 0));
  }, [notificationsCount, dispatch]);

  const onDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);
  const onDropdownSelect = () => setIsDropdownOpen(false);

  const header = (
    <PanelHeader
      logo="My App"
      headerTools={
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <NotificationBell />
            </ToolbarItem>
            <ToolbarItem>
              <DarkModeButton />
            </ToolbarItem>
            <ToolbarItem>
              <LogOutButton />
            </ToolbarItem>
            <ToolbarItem>
              <Dropdown
                onSelect={onDropdownSelect}
                toggle={<DropdownToggle onToggle={onDropdownToggle}>{userData?.prenom}</DropdownToggle>}
                isOpen={isDropdownOpen}
                dropdownItems={[
                  <DropdownItem key="account">Compte</DropdownItem>,
                  <DropdownItem key="logout">Déconnexion</DropdownItem>,
                ]}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      }
      showNavToggle
      onNavToggle={() => setIsNavOpen(!isNavOpen)}
    />
  );

  const sidebar = (
    <PageSidebar
      isNavOpen={isNavOpen}
      nav={
        <Nav>
          <NavList>
            <NavItem to="/pages/dashboard" itemId="dashboard">
              Dashboard
            </NavItem>
            <NavItem to="/pages/cours" itemId="cours">
              Cours
            </NavItem>
            <NavItem to="/pages/compte" itemId="compte">
              Compte
            </NavItem>
            <NavItem to="/pages/utilisateurs" itemId="utilisateurs">
              Utilisateurs
            </NavItem>
          </NavList>
        </Nav>
      }
    />
  );

  return (
    <Page
      header={header}
      sidebar={sidebar}
      isManagedSidebar
      additionalGroupedContent={<RightSideBar />}
    >
      <PageSection isFilled variant="light">
        {children ?? <Outlet />}
      </PageSection>
    </Page>
  );
};

export default MainLayout;
