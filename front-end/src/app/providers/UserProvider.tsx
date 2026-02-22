import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserData } from "@clubmanager/types";
import { logger } from "@/core/utils/appLogger";

// Définir le type pour le contexte
interface UserContextType {
  selectedUser: UserData | null;
  setSelectedUser: (user: UserData | null) => void;
  selectedUserId: number | null; // Ajout de l'état pour l'ID
  setSelectedUserId: (id: number | null) => void; // Setter pour l'ID
}

// Créer le contexte
const UserContext = createContext<UserContextType | undefined>(undefined);

// Fournisseur du contexte
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    logger.debug("UserContext - selectedUserId updated", {
      feature: "user-context",
      component: "UserProvider",
      metadata: { selectedUserId },
    });
  }, [selectedUserId]);

  return (
    <UserContext.Provider
      value={{ selectedUser, setSelectedUser, selectedUserId, setSelectedUserId }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
