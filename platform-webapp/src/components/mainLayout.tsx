import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageGroup,
  PageSidebar,
} from '@patternfly/react-core';
import { OPEN_RIGHT_NAVBAR } from '../redux/actions';
import AppPanelHeader from './header';
import AppSidebar from './sidebar';

const MainLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // État pour gérer la sidebar
  const notificationsCount = useSelector(
    (state: any) => state.notifications.notifications.length
  );

  const userData = useSelector((state: any) => state.auth?.user) || JSON.parse(localStorage.getItem('userData') || '{}');

  const username =
    userData && (userData.first_name || userData.last_name)
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
      : userData?.email || 'Utilisateur';

  const onSidebarToggle = () => {
    setIsSidebarOpen(prev => !prev); // Inverse l'état de la sidebar
  };

  useEffect(() => {
    dispatch(OPEN_RIGHT_NAVBAR(notificationsCount > 0));
  }, [notificationsCount, dispatch]);

  return (
    <>
      <AppPanelHeader
        username={username}
        onSidebarToggle={onSidebarToggle} // Passez la fonction pour basculer la sidebar
        userData={userData}
      />
      <Page
        isManagedSidebar
        sidebar={
          <PageSidebar isSidebarOpen={isSidebarOpen}>
            <AppSidebar isOpen={isSidebarOpen} />
          </PageSidebar>
        }
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
