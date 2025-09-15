import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageGroup,
} from '@patternfly/react-core';
import { OPEN_RIGHT_NAVBAR } from '../redux/actions';
import AppPanelHeader from './header';
import AppSidebar from './sidebar';

const MainLayout = () => {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const notificationsCount = useSelector(
    (state: any) => state.notifications.notifications.length
  );
  const userData = useSelector((state: any) => state.auth?.user);
  console.log(userData)
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
