import React, { useState } from 'react';
import ToastNotification from './notifications';
import { useLeftPanel } from '~/context/left-panel';

const Header: React.FC = () => {
  const { isCollapsed, togglePanel } = useLeftPanel();
  const [isChevronVisible, setIsChevronVisible] = useState(false);

  console.log(isCollapsed)

  // Toggle the chevron visibility and panel state
  const toggleChevron = () => {
    togglePanel();  // Toggling the panel state via context
    setIsChevronVisible(!isChevronVisible);
  };

  return (
    <header className="header">
      {/* Logo or Title */}
      <div className={`layer ${isCollapsed ? 'collapsed' : ''}`}>
        <a href="/">Houthoofd Benoit</a>

        <div className={`explode-btn ${isCollapsed ? 'collapsed' : ''}`} onClick={toggleChevron}>
          <button className="btn-explode">
            {/* Chevron Right */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              height="24px" 
              viewBox="0 -960 960 960" 
              width="24px" 
              fill="#5f6368"
              className={`${isChevronVisible ? 'hidden' : ''}`}
            >
              <path 
                d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"
              />
            </svg>

            {/* Chevron Left */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              height="24px" 
              viewBox="0 -960 960 960" 
              width="24px" 
              fill="#5f6368"
              className={`${isChevronVisible ? '' : 'hidden'}`}
            >
              <path 
                d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className={`${isCollapsed ? 'collapsed' : ''}`}>
        <ul className="flex space-x-4">
          <li>
            <a href="/dashboard" className="hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M320-520q17 0 28.5-11.5T360-560q0-17-11.5-28.5T320-600q-17 0-28.5 11.5T280-560q0 17 11.5 28.5T320-520Zm160 0q17 0 28.5-11.5T520-560q0-17-11.5-28.5T480-600q-17 0-28.5 11.5T440-560q0 17 11.5 28.5T480-520Zm160 0q17 0 28.5-11.5T680-560q0-17-11.5-28.5T640-600q-17 0-28.5 11.5T600-560q0 17 11.5 28.5T640-520ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>
            </a>
          </li>
          <li>
            <a href="/profile" className="hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h404q-4 20-4 40t4 40H160l320 200 146-91q14 13 30.5 22.5T691-572L480-440 160-640v400h640v-324q23-5 43-14t37-22v360q0 33-23.5 56.5T800-160H160Zm0-560v480-480Zm600 80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z"/></svg>
            </a>
          </li>
          <li>
            <a href="/settings" className="hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
            </a>
          </li>
          <li>
            <a href="/logout" className="hover:underline">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
            </a>
          </li>
          <li><ToastNotification /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
