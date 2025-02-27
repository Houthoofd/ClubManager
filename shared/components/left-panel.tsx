import React from 'react';
import { useLeftPanel } from '../context/left-panel';

const LeftPanel: React.FC = () => {
  // Récupération de l'état et de la fonction de bascule à partir du contexte
  const { isCollapsed, togglePanel } = useLeftPanel();

  console.log(isCollapsed)

  return (
    <div className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <button onClick={togglePanel}>
        {isCollapsed ? 'collapsed' : ''}
      </button>
    </div>
  );
};

export default LeftPanel;
