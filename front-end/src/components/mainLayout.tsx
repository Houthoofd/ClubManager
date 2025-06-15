import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom'; // ✅ important
import {
  Page,
  PageSection,
  PageGroup,
} from '@patternfly/react-core';

import { OPEN_RIGHT_NAVBAR } from '../redux/actions';

import ModalSize from './modal';
import AppPanelHeader from './header';
import AppSidebar from './sidebar';

const MainLayout = () => {
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
      <AppPanelHeader
        username={userData.username}
        onSidebarToggle={onSidebarToggle}
      />
      <Page
        isManagedSidebar
        sidebar={<AppSidebar isOpen={isSidebarOpen} />}
      >
        <PageGroup>
          <PageSection variant="default">
            <Outlet /> {/* ✅ Affiche le contenu des routes enfants */}
          </PageSection>
        </PageGroup>
      </Page>
    </>
  );
};

export default MainLayout;
