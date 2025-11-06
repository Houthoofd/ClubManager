import { useCallback } from 'react';

// Types pour les notifications
export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  variant?: ToastVariant;
  timeout?: number;
}

// Hook pour gérer les notifications toast
export const useToast = () => {
  const showToast = useCallback((
    message: string, 
    variant: ToastVariant = 'info', 
    options?: ToastOptions
  ) => {
    // Pour l'instant, utiliser console.log avec des emojis pour différencier les types
    const icons = {
      success: '✅',
      danger: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const icon = icons[variant];
    const title = options?.title || variant.toUpperCase();
    
    console.log(`${icon} [${title}] ${message}`);
    
    // TODO: Intégrer avec un système de toast réel (react-hot-toast, PatternFly alerts, etc.)
    // Pour l'instant, utiliser une alerte native en développement
    if (process.env.NODE_ENV === 'development') {
      // Utiliser setTimeout pour ne pas bloquer l'exécution
      setTimeout(() => {
        if (variant === 'danger') {
          console.error(`${icon} ${message}`);
        } else if (variant === 'warning') {
          console.warn(`${icon} ${message}`);
        } else {
          console.info(`${icon} ${message}`);
        }
      }, 0);
    }
  }, []);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'danger', options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'info', options);
  }, [showToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useToast;
