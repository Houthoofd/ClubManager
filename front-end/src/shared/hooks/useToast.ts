/**
 * useToast Hook
 *
 * Hook pour afficher des notifications toast de manière programmatique.
 * Utilise PatternFly Alert dans un système de notification toast.
 *
 * @example
 * ```tsx
 * const { showSuccess, showError, showWarning, showInfo } = useToast();
 *
 * showSuccess('User created successfully!');
 * showError('Failed to save changes');
 * showWarning('This action cannot be undone');
 * showInfo('New update available');
 * ```
 */

import { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastOptions {
  /**
   * Durée d'affichage du toast en millisecondes
   * @default 5000
   */
  timeout?: number;

  /**
   * Permet de fermer le toast manuellement
   * @default true
   */
  dismissible?: boolean;

  /**
   * Titre du toast (optionnel)
   */
  title?: string;

  /**
   * Action personnalisée (bouton)
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
  title?: string;
  timeout?: number;
  dismissible?: boolean;
  action?: ToastOptions['action'];
}

// ============================================================================
// Toast Manager (Global State)
// ============================================================================

// Simple event-based toast manager
// Utilise CustomEvent pour communiquer avec le ToastContainer
let toastIdCounter = 0;

const dispatchToastEvent = (toast: Omit<ToastMessage, 'id'>) => {
  const id = `toast-${++toastIdCounter}-${Date.now()}`;
  const event = new CustomEvent('app:toast', {
    detail: { ...toast, id },
  });
  window.dispatchEvent(event);
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour afficher des notifications toast
 *
 * @returns Fonctions pour afficher différents types de toasts
 */
export function useToast() {
  /**
   * Affiche un toast de succès
   */
  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    dispatchToastEvent({
      variant: 'success',
      message,
      title: options?.title || 'Succès',
      timeout: options?.timeout ?? 5000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }, []);

  /**
   * Affiche un toast d'erreur
   */
  const showError = useCallback((message: string, options?: ToastOptions) => {
    dispatchToastEvent({
      variant: 'danger',
      message,
      title: options?.title || 'Erreur',
      timeout: options?.timeout ?? 7000, // Plus long pour les erreurs
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }, []);

  /**
   * Affiche un toast d'avertissement
   */
  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    dispatchToastEvent({
      variant: 'warning',
      message,
      title: options?.title || 'Attention',
      timeout: options?.timeout ?? 6000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }, []);

  /**
   * Affiche un toast d'information
   */
  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    dispatchToastEvent({
      variant: 'info',
      message,
      title: options?.title || 'Information',
      timeout: options?.timeout ?? 5000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }, []);

  /**
   * Affiche un toast personnalisé
   */
  const showToast = useCallback(
    (message: string, variant: ToastVariant, options?: ToastOptions) => {
      dispatchToastEvent({
        variant,
        message,
        title: options?.title,
        timeout: options?.timeout ?? 5000,
        dismissible: options?.dismissible ?? true,
        action: options?.action,
      });
    },
    []
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
  };
}

export default useToast;

// ============================================================================
// Export types for ToastContainer component
// ============================================================================

export type { ToastMessage };
export { dispatchToastEvent };
