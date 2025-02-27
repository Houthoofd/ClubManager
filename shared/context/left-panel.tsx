import React, { createContext, useState, useContext } from 'react';

// Définir le type du contexte
interface LeftPanelContextType {
  isCollapsed: boolean;
  togglePanel: () => void;
}

// Créer le contexte, avec une valeur par défaut `undefined`
const LeftPanelContext = createContext<LeftPanelContextType | undefined>(undefined);

// Le Provider qui enveloppe l'application et gère l'état global
export const LeftPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log("context"+ isCollapsed)

  const togglePanel = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <LeftPanelContext.Provider value={{ isCollapsed, togglePanel }}>
      {children}
    </LeftPanelContext.Provider>
  );
};

// Hook personnalisé pour accéder au contexte dans les composants enfants
export const useLeftPanel = () => {
  const context = useContext(LeftPanelContext);
  if (!context) {
    throw new Error('useLeftPanel must be used within a LeftPanelProvider');
  }
  return context;
};
