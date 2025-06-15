import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { SET_RIGHT_SIDEBAR_ITEMS, TOGGLE_RIGHT_SIDEBAR } from "../../redux/actions";
import "../../app/styles/style-expand-menu.css";

export interface ExpandMenuProps {
  icon: React.ReactNode;
  text: string;
  subTitles?: string[];
  listUrls: string[];
  menuId: string;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

const ExpandMenu: React.FC<ExpandMenuProps> = ({
  icon,
  text,
  subTitles = [],
  listUrls = [],
  menuId,
  activeMenuId,
  setActiveMenuId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement>(null);
  const isLeftNavbarOpen = useSelector((state: any) => state.navigation.left_navbar);
  const rightSidebarOpen = useSelector((state: any) => state.navigation.right_sidebar_open);
  const hasSubMenu = subTitles.length > 0 && listUrls.length > 0;
  const [pendingSidebarData, setPendingSidebarData] = useState<{
    menuId: string;
    items: { label: string; link: string }[];
  } | null>(null);

  // Fermer si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setActiveMenuId]);

  // Fermer si un autre menu est actif
  useEffect(() => {
    setIsOpen(activeMenuId === menuId);
  }, [activeMenuId, menuId]);

  const handleClick = () => {
    // Toggle l’état actif
    if (activeMenuId === menuId) {
      setActiveMenuId(null);
      return;
    } else {
      setActiveMenuId(menuId);
    }

    // Cas particulier pour "chat"
    if (menuId === "chat") {
      const fetchUsers = async () => {
        try {
          const response = await fetch('http://localhost:3000/utilisateurs');
          if (!response.ok) {
            throw new Error('Erreur réseau lors de la récupération des utilisateurs');
          }
          const utilisateurs = await response.json();
          const items = utilisateurs.data.map((user: { first_name: string; last_name: string; id: string }) => ({
            label: `${user.first_name} ${user.last_name}`,
            link: `/chat/${user.id}`,
          }));

          if (rightSidebarOpen) {
            setPendingSidebarData({ menuId, items });
            dispatch(TOGGLE_RIGHT_SIDEBAR(false));
          } else {
            dispatch({ type: "SET_RIGHT_SIDEBAR_ITEMS", payload: { menuId, items } });
            dispatch(TOGGLE_RIGHT_SIDEBAR(true));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des utilisateurs:', error);
        }
      };
      fetchUsers();
      return;
    }

    // Pas de sous-menu → juste fermeture de la sidebar
    if (!hasSubMenu) {
      dispatch(TOGGLE_RIGHT_SIDEBAR(false));
      return;
    }

    // Sous-menus → sidebar + menu local
    const items = subTitles.map((subtitle, index) => ({
      label: subtitle,
      link: listUrls[index],
    }));

    if (rightSidebarOpen) {
      setPendingSidebarData({ menuId, items });
      dispatch(TOGGLE_RIGHT_SIDEBAR(false));
    } else {
      dispatch({ type: "SET_RIGHT_SIDEBAR_ITEMS", payload: { menuId, items } });
      dispatch(TOGGLE_RIGHT_SIDEBAR(true));
    }
  };

  // Rouvrir sidebar si elle était temporairement fermée
  useEffect(() => {
    if (!rightSidebarOpen && pendingSidebarData) {
      dispatch({ type: "SET_RIGHT_SIDEBAR_ITEMS", payload: pendingSidebarData });
      dispatch(TOGGLE_RIGHT_SIDEBAR(true));
      setPendingSidebarData(null);
    }
  }, [rightSidebarOpen, pendingSidebarData, dispatch]);

  return (
    <div
      ref={menuRef}
      className={`expand-menu ${isOpen ? "open" : "close"} ${isLeftNavbarOpen ? "expand" : "unexpand"}`}
      onClick={handleClick}
    >
      <div className={`menu-header ${isOpen ? "open" : "close"} ${hasSubMenu ? "with-arrow" : "without-arrow"}`}>
        {isLeftNavbarOpen ? (
          <span className="menu-icon open">
            <Link className="menu-link" to={listUrls[0] || "#"}>{icon}</Link>
            <span className="menu-text">{text}</span>
          </span>
        ) : (
          <Link to={listUrls[0] || "#"} className="menu-icon close">
            {icon}
          </Link>
        )}

        {hasSubMenu && isLeftNavbarOpen && (
          <span className="icon-arrow">
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
              </svg>
            )}
          </span>
        )}
      </div>

      {isLeftNavbarOpen && (
        <ul className="menu-list">
          {subTitles.map((subtitle, index) => {
            console.log(isLeftNavbarOpen)
            return (
              <li key={index} className="menu-item">
                {listUrls[index] ? <Link to={listUrls[index]}>{subtitle}</Link> : subtitle}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ExpandMenu;
