import React, { useState } from 'react';
import { useNotification } from '../context/notification';

const ToastNotification = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Utiliser le contexte pour obtenir les notifications
  const { notifications } = useNotification(); // notifications est un tableau d'objets Notification

  const togglePanel = () => {
    const rightPanel = document?.querySelector('.right-panel');
    const content = document?.querySelector('.content');
    const isCurrentlyOpen = isOpen;

    setIsOpen(!isOpen);

    if (rightPanel) {
      if (isCurrentlyOpen) {
        rightPanel.classList.remove('open');
        content?.classList.remove('open');
      } else {
        rightPanel.classList.add('open');
        content?.classList.add('open');
      }
    }
  };

  return (
    <div className="relative inline-block">
      {/* Icône de notification */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 text-gray-500 cursor-pointer"
        onClick={togglePanel}
      >
        <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm7-6V10c0-3.07-1.64-5.64-4.5-6.32V3a1.5 1.5 0 10-3 0v.68C6.64 4.36 5 6.92 5 10v6l-1 1v1h16v-1l-1-1zm-6 4c.552 0 1-.448 1-1h-4c0 .552.448 1 1 1zM18 17H6v-7c0-2.48 1.51-4.58 3.72-5.37.235.197.378.5.378.83V5c.552 0 1 .448 1 1s-.448 1-1 1V8h2V7c.552 0 1-.448 1-1s-.448-1-1V4.43c.34.003.66.18.849.52C16.508 6.424 18 8.5 18 11v6z" />
      </svg>

      {/* Badge pour afficher le nombre de notifications */}
      {notifications.length > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
          {notifications.length}
        </span>
      )}
    </div>
  );
};

export default ToastNotification;
