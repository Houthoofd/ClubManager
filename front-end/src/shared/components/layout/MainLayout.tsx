import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Page, PageSection, PageGroup, PageSidebar } from "@patternfly/react-core";
import { useNavigation } from "@/app/providers/NavigationProvider";
import { useCart } from "@/app/providers/CartProvider";
import AppPanelHeader from "./header";
import AppSidebar from "./sidebar";
import RightSidePanel from "../common-legacy/panel/rightSidePanel";
import { getUser } from "@/shared/utils/storage";

const MainLayout = () => {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useNavigation();
  const { isOpen: isCartOpen, closeCart } = useCart();

  const userData = getUser();

  const username =
    userData?.first_name && userData?.last_name
      ? `${userData.first_name} ${userData.last_name}`
      : userData?.email || "Utilisateur";

  // Fermer le panier automatiquement lors du changement de page
  useEffect(() => {
    if (isCartOpen) {
      closeCart();
    }
  }, [location.pathname]);

  return (
    <>
      <AppPanelHeader username={username} onSidebarToggle={toggleSidebar} userData={userData} />
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

      {/* Panier - affiché en overlay quand isCartOpen est true */}
      {isCartOpen && <RightSidePanel />}
    </>
  );
};

export default MainLayout;
