import {
  Masthead,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  MastheadLogo,
  MastheadContent,
  Button,
  Flex,
  FlexItem,
  Tooltip,
  Avatar,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Popper,
} from "@patternfly/react-core";
import {
  BarsIcon,
  EnvelopeIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  SignOutAltIcon,
} from "@patternfly/react-icons";
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/app/providers/CartProvider";
import { useUnreadMessagesCountQuery } from "@/core/api/apollo/generated/graphql";
import { clearAllAuthData } from "@/shared/utils/authCleaner";
import logger from "@/shared/utils/logger";
import { LanguageSelector } from "@/shared/components/LanguageSelector";

interface AppPanelHeaderProps {
  username: string;
  onSidebarToggle: () => void;
  onLogout?: () => void;
  userData: any;
}

const AppPanelHeader = ({ onSidebarToggle, onLogout, userData }: AppPanelHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullName, setFullName] = useState("Utilisateur");
  const [roleLabel, setRoleLabel] = useState("");
  const toggleRef = useRef(null);
  const navigate = useNavigate();
  const { count: panierCount, openCart } = useCart();

  // Récupérer le nombre de messages non lus avec GraphQL
  const { data: messagesData } = useUnreadMessagesCountQuery({
    variables: { userId: userData?.id || 0 },
    skip: !userData?.id,
    pollInterval: 30000, // Actualiser toutes les 30 secondes
    fetchPolicy: "cache-and-network",
    onError: (error: any) => {
      logger.error("Erreur lors de la récupération du nombre de messages non lus:", error);
    },
  });

  const nombreMessagesNonLus = messagesData?.unreadMessagesCount?.count || 0;

  useEffect(() => {
    if (userData) {
      const name =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Utilisateur";
      const role = userData.status || "Inconnu";

      setFullName(name);
      setRoleLabel(role);
    }
  }, [userData]);

  const handleToggleClick = () => setIsDropdownOpen((prev) => !prev);

  const handleSelect = () => setIsDropdownOpen(false);

  const handleLogout = async () => {
    console.log("🚪 [Header] Début de la déconnexion...");

    try {
      // MODIFIÉ: Utiliser la version async de clearAllAuthData qui appelle le serveur
      await clearAllAuthData();

      // Appeler le callback de déconnexion
      onLogout?.();

      console.log("✅ [Header] Déconnexion terminée (serveur + client), redirection...");

      // AJOUTÉ: Petit délai pour s'assurer que les cookies sont bien supprimés
      setTimeout(() => {
        // Rediriger vers la page de connexion
        navigate("/pages/connexion");
      }, 100);
    } catch (error) {
      console.error("❌ [Header] Erreur lors de la déconnexion:", error);

      // Même en cas d'erreur, rediriger vers la connexion
      navigate("/pages/connexion");
    }
  };

  const handleOuvrirPanier = () => {
    openCart();
    navigate("/pages/magasin/magasin");
  };

  // Fonction pour naviguer vers les messages non lus
  const handleNavigateToMessages = () => {
    // Naviguer vers la page des messages avec l'onglet "non-lus" activé
    navigate("/pages/messages?tab=non-lus");
  };

  return (
    <Masthead id="app-header">
      <MastheadMain>
        <MastheadToggle>
          <Button
            variant="plain"
            onClick={onSidebarToggle}
            aria-label="Toggle navigation"
            icon={<BarsIcon />}
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo component="a">MonApp</MastheadLogo>
        </MastheadBrand>
      </MastheadMain>

      <MastheadContent>
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentFlexEnd" }}
          style={{ width: "100%" }}
        >
          <FlexItem grow={{ default: "grow" }} />

          {/* ============================================================
           * LANGUAGE SELECTOR - i18n Support (EN/FR/NL)
           * ============================================================
           *
           * Permet à l'utilisateur de changer la langue de l'interface.
           *
           * Features:
           * - Variante "compact": 🇫🇷 FR
           * - Dropdown PatternFly avec drapeaux
           * - Changement instantané sans rechargement
           * - Persistence automatique dans localStorage
           * - Mobile-friendly
           *
           * Langues disponibles:
           * - 🇬🇧 EN (English) - défaut
           * - 🇫🇷 FR (Français)
           * - 🇳🇱 NL (Nederlands)
           *
           * Component: src/shared/components/LanguageSelector.tsx
           * Config: src/core/i18n/config.ts
           * Traductions: src/core/i18n/locales/{en,fr,nl}/index.ts
           *
           * Usage dans autre composant:
           * import { useTranslation } from 'react-i18next';
           * const { t } = useTranslation();
           * <button>{t('common.actions.save')}</button>
           * ============================================================ */}
          <FlexItem>
            <LanguageSelector variant="compact" />
          </FlexItem>

          {/* Bouton Messages avec notification */}
          <FlexItem>
            <Tooltip
              content={`Messages${nombreMessagesNonLus > 0 ? ` (${nombreMessagesNonLus} non lus)` : ""}`}
            >
              <Button
                variant="plain"
                aria-label={`Messages${nombreMessagesNonLus > 0 ? ` (${nombreMessagesNonLus} non lus)` : ""}`}
                style={{ position: "relative" }}
                onClick={handleNavigateToMessages}
              >
                <EnvelopeIcon />
                {nombreMessagesNonLus > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      fontSize: "0.75rem",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {nombreMessagesNonLus > 99 ? "99+" : nombreMessagesNonLus}
                  </span>
                )}
              </Button>
            </Tooltip>
          </FlexItem>

          <FlexItem>
            <Tooltip content="Panier">
              <Button
                variant="plain"
                aria-label="Panier"
                style={{ position: "relative" }}
                onClick={handleOuvrirPanier}
              >
                <ShoppingCartIcon />
                {panierCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      fontSize: "0.75rem",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {panierCount}
                  </span>
                )}
              </Button>
            </Tooltip>
          </FlexItem>

          <FlexItem>
            <Link to="/pages/compte" style={{ textDecoration: "none", color: "inherit" }}>
              <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsFlexEnd" }}>
                <span style={{ fontWeight: "bold" }}>{fullName}</span>
                <span style={{ fontSize: "0.75rem", color: "#6a6e73" }}>{roleLabel}</span>
              </Flex>
            </Link>
          </FlexItem>

          <FlexItem>
            <MenuToggle
              ref={toggleRef}
              onClick={handleToggleClick}
              isExpanded={isDropdownOpen}
              icon={<Avatar src="https://via.placeholder.com/150" alt="Avatar utilisateur" />}
            />
            <Popper
              triggerRef={toggleRef}
              popper={
                <Menu onSelect={handleSelect}>
                  <MenuContent>
                    <MenuList>
                      <MenuItem to="/pages/compte" component="a">
                        <UserIcon style={{ marginRight: "8px" }} />
                        Profil
                      </MenuItem>
                      <MenuItem to="/pages/settings" component="a">
                        <CogIcon style={{ marginRight: "8px" }} />
                        Paramètres
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <SignOutAltIcon style={{ marginRight: "8px" }} />
                        Déconnexion
                      </MenuItem>
                    </MenuList>
                  </MenuContent>
                </Menu>
              }
              isVisible={isDropdownOpen}
              position="bottom-end"
            />
          </FlexItem>
        </Flex>
      </MastheadContent>
    </Masthead>
  );
};

export default AppPanelHeader;
