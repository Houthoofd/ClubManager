import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import VerticalCarousel  from './vertcialCarousel';

interface SidebarItem {
  label: string;
  link?: string;
}

interface SidebarItems {
  [key: string]: SidebarItem[];
}

const RightSidebar: React.FC = () => {
  const rightSidebarOpen = useSelector((state: any) => state.navigation.right_sidebar_open);
  const rightSidebarItems = useSelector((state: any) => state.navigation.right_sidebar_items) as SidebarItems;
  const rightSidebarUsers = useSelector((state: any) => state.navigation.right_sidebar_users);

  useEffect(() => {
    // Pour débug si besoin
    // console.log("Items:", rightSidebarItems);
    // console.log("Users:", rightSidebarUsers);
  }, [rightSidebarItems, rightSidebarUsers]);

  if (!rightSidebarOpen) return null;

  const hasItems = Object.values(rightSidebarItems).some(items => Array.isArray(items) && items.length > 0);
  const hasUsers = Array.isArray(rightSidebarUsers) && rightSidebarUsers.length > 0;


  return (
    <div className={`right-sidebar ${rightSidebarOpen ? "open" : "close"}`}>
      {hasItems ? (
        // ✅ Si items existent, on affiche SEULEMENT les menus
        <div>
          <h3>Menus</h3>
          {Object.entries(rightSidebarItems).map(([key, items], index) => (
            <div key={index}>
              <h4>{key}</h4>
              <ul className="right-sidebar-list">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {item.link ? (
                      <Link to={item.link}>{item.label}</Link>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : hasUsers ? (
        // ✅ Sinon, on affiche SEULEMENT les utilisateurs
        <VerticalCarousel users={rightSidebarUsers} />
      ) : (
        // ✅ Sinon, rien trouvé
        <ul className="right-sidebar-list">
          <li>Aucun élément à afficher</li>
        </ul>
      )}
    </div>
  );
};

export default RightSidebar;
