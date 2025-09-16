import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageGroup,
} from '@patternfly/react-core';
import { OPEN_RIGHT_NAVBAR } from '../redux/actions';
import { setUser } from '../redux/actions/authActions'; // Importez l'action pour mettre à jour le store
import AppPanelHeader from './header';
import AppSidebar from './sidebar';

const MainLayout = () => {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const notificationsCount = useSelector(
    (state: any) => state.notifications.notifications.length
  );
  let userData = useSelector((state: any) => state.auth?.user);

  // Si userData est null, essayez de le récupérer depuis le localStorage
  if (!userData) {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      userData = JSON.parse(storedUser);
      console.log('Récupération des données utilisateur depuis le localStorage:', userData);
      dispatch(setUser(userData)); // Mettez à jour le store Redux
    }
  }

  const username =
    userData && (userData.first_name || userData.last_name)
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
      : userData?.email || 'Utilisateur';

  const onSidebarToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    dispatch(OPEN_RIGHT_NAVBAR(notificationsCount > 0));
  }, [notificationsCount, dispatch]);

  console.log('Props reçues dans MainLayout:');
  console.log('Données critiques:', { userData, notificationsCount });

  if (!userData) {
    console.warn('Utilisateur non défini ou en cours de chargement dans MainLayout');
    return <div>Chargement des données utilisateur...</div>;
  }

  const userName = userData?.name || 'Utilisateur inconnu';
  console.log('Nom de l\'utilisateur:', userName);

  return (
    <>
      <AppPanelHeader
        username={username}
        onSidebarToggle={onSidebarToggle}
        userData={userData} // Pass user data to the header
      />
      <Page
        isManagedSidebar
        sidebar={<AppSidebar isOpen={isSidebarOpen} />}
      >
        <PageGroup>
          <PageSection variant="default">
            <Outlet />
          </PageSection>
        </PageGroup>
      </Page>
    </>
  );
};

export default MainLayout;
