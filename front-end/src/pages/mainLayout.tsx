import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Page,
  PageSection,
  PageGroup,
  PageSidebar
} from '@patternfly/react-core';
import { OPEN_RIGHT_NAVBAR } from '../redux/actions';

import ModalSize from './modal';
import DashboardPage from '../pages/dashboard';
import AppPanelHeader from './header'; // Composant custom
import AppSidebar from './sidebar';    // Doit retourner <PageSidebar />

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useDispatch();
  const [userData, setUserData] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const notificationsCount = useSelector(
    (state: any) => state.notifications.notifications.length
  );

  const onSidebarToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData.data);
    } else {
      setModalMessage("Veuillez vous connecter pour accéder à l'application.");
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    dispatch(OPEN_RIGHT_NAVBAR(notificationsCount > 0));
  }, [notificationsCount, dispatch]);

  if (!userData) {
    return (
      <ModalSize
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Connexion requise"
      >
        {modalMessage}
      </ModalSize>
    );
  }

  return (
    <>
      {/* Header manuel, pas dans <Page /> */}
      <AppPanelHeader
        username={userData.username}
        onSidebarToggle={onSidebarToggle}
      />

      {/* Page avec gestion automatique de la sidebar */}
      <Page
        isManagedSidebar
        sidebar={<AppSidebar isOpen={isSidebarOpen} />}
      >
        <PageGroup>
          <PageSection variant="default">
            {children}
          </PageSection>
        </PageGroup>
      </Page>
    </>
  );
};

export default MainLayout;
