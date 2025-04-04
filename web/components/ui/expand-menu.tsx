import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../app/styles/style-expand-menu.css";

export interface ExpandMenuProps {
  icon?: JSX.Element; // Icône facultative
  text: string; // Texte du menu principal
  subTitles?: string[]; // Liste des sous-titres
  listUrls?: string[]; // Liste des URLs correspondantes
}

const ExpandMenu: React.FC<ExpandMenuProps> = ({ icon, text, subTitles = [], listUrls = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubMenu = subTitles.length > 0 && listUrls.length > 0;

  return (
    <div className={`expand-menu ${isOpen ? "open" : "close"}`}>
      <div
        className={`menu-header ${isOpen ? "open" : "close"} ${hasSubMenu ? "with-arrow" : "without-arrow"}`}
        onClick={() => hasSubMenu && setIsOpen(!isOpen)}
      >
        {icon && <span className="menu-icon">{icon}</span>}
        <span className="menu-text">{text}</span>
        {hasSubMenu && (
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
      {isOpen && hasSubMenu && (
        <ul className={`menu-list ${isOpen ? "open" : "close"}`}>
          {subTitles.map((subtitle, index) => (
            <li key={index} className="menu-item">
              {listUrls[index] ? <Link to={listUrls[index]}>{subtitle}</Link> : subtitle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};



export default ExpandMenu;
