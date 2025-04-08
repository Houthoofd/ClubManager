import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom"; // pour les liens

const RightSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const rightSidebarOpen = useSelector((state: any) => state.navigation.right_sidebar_open);
  const rightSidebarItems = useSelector((state: any) => state.navigation.right_sidebar_items);

  console.log(rightSidebarItems)

  if (!rightSidebarOpen) return null;

  return (
    <div className={`right-sidebar ${rightSidebarOpen ? "open" : "close"}`}>
      <ul className="right-sidebar-list">
        {Object.values(rightSidebarItems).map((items:any, index) => (
          <div key={index} className="right-sidebar-list">
            {items.map((item: any, itemIndex: number) => (
              <li key={itemIndex} className="right-sidebar-list-item">
                {item.link ? (
                  <Link to={item.link}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </div>
        ))}
      </ul>
    </div>
  );
};


export default RightSidebar;
