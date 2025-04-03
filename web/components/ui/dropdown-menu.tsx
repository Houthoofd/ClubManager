import React, { useState } from "react";
import '../../app/styles/style-dropdown-menu.css';

const DropdownMenu = ({ title, icon, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown">
      <button className="dropdown-button" onClick={toggleDropdown}>
        {icon && <span className="dropdown-icon">{icon}</span>}
        {title}
        <span className={`arrow ${isOpen ? "open" : ""}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 0 24 24"
            width="18px"
            fill="white"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {items.map((item, index) => (
            <li key={index} className="dropdown-item">
              {item.icon && <span className="item-icon">{item.icon}</span>}
              {item.label}
              {item.submenu && (
                <ul className="submenu">
                  {item.submenu.map((sub, subIndex) => (
                    <li key={subIndex} className="submenu-item">
                      {sub.icon && <span className="item-icon">{sub.icon}</span>}
                      {sub.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DropdownMenu;
