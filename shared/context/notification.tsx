import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Notification {
  id: string;
  message: string;
  timestamp: number;
  taskId?: string; // Lier la notification à une tâche si nécessaire
}

interface Task {
  id: string;
  title: string;
}

interface NotificationContextType {
  notifications: Notification[];
  tasks: Task[];
  addNotification: (message: string, taskId?: string) => void;
  handleDeleteTask: (taskId: string) => void; // Fonction de suppression par taskId
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // Chaque tâche a un id et un titre

  // Ajouter une notification
  const addNotification = (message: string, taskId?: string) => {
    const newNotification = {
      id: uuidv4(), // Générer un identifiant unique pour la notification
      message,
      timestamp: Date.now(),
      taskId, // Optionnel : lier à une tâche spécifique
    };
    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
  };

  // Supprimer une tâche et ses notifications associées
  const handleDeleteTask = (taskId: string) => {
    // Supprimer la tâche en fonction de son ID
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);

    // Supprimer les notifications liées à cette tâche
    const updatedNotifications = notifications.filter(
      (notification) => notification.taskId !== taskId
    );
    setNotifications(updatedNotifications);

    // Ajouter une notification pour informer de la suppression de la tâche
    addNotification('Tâche supprimée', taskId);
  };

  return (
    <NotificationContext.Provider value={{ notifications, tasks, addNotification, handleDeleteTask }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé pour accéder aux notifications et tâches
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
