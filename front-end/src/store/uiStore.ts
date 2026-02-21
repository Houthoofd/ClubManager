import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'fr' | 'en' | 'nl';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // milliseconds, null for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UIState {
  // Theme & Layout
  theme: Theme;
  sidebarCollapsed: boolean;
  language: Language;

  // Notifications
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Modal state
  activeModal: string | null;

  // Actions - Theme & Layout
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (language: Language) => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  clearGlobalLoading: () => void;

  // Actions - Modals
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const generateNotificationId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Store
// ============================================================================

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      theme: 'light',
      sidebarCollapsed: false,
      language: 'fr',
      notifications: [],
      globalLoading: false,
      loadingMessage: null,
      activeModal: null,

      // Actions - Theme & Layout
      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
          console.log('🎨 [UIStore] Theme changed:', theme);

          // Apply theme to document
          if (typeof document !== 'undefined') {
            if (theme === 'dark') {
              document.documentElement.classList.add('pf-v6-theme-dark');
            } else if (theme === 'light') {
              document.documentElement.classList.remove('pf-v6-theme-dark');
            } else {
              // Auto: check system preference
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (prefersDark) {
                document.documentElement.classList.add('pf-v6-theme-dark');
              } else {
                document.documentElement.classList.remove('pf-v6-theme-dark');
              }
            }
          }
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
          console.log('🔀 [UIStore] Sidebar toggled:', state.sidebarCollapsed);
        }),

      setSidebarCollapsed: (collapsed) =>
        set((state) => {
          state.sidebarCollapsed = collapsed;
        }),

      setLanguage: (language) =>
        set((state) => {
          state.language = language;
          console.log('🌍 [UIStore] Language changed:', language);
          // TODO: Update i18n instance if using i18next
        }),

      // Actions - Notifications
      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: generateNotificationId(),
            timestamp: Date.now(),
          };

          state.notifications.push(newNotification);
          console.log('🔔 [UIStore] Notification added:', newNotification.type, newNotification.title);

          // Auto-remove after duration (if specified)
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }
        }),

      removeNotification: (id) =>
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id);
          console.log('🗑️ [UIStore] Notification removed:', id);
        }),

      clearNotifications: () =>
        set((state) => {
          state.notifications = [];
          console.log('🗑️ [UIStore] All notifications cleared');
        }),

      // Actions - Loading
      setGlobalLoading: (loading, message) =>
        set((state) => {
          state.globalLoading = loading;
          state.loadingMessage = message ?? null;
          if (loading) {
            console.log('⏳ [UIStore] Global loading started:', message);
          } else {
            console.log('✅ [UIStore] Global loading stopped');
          }
        }),

      clearGlobalLoading: () =>
        set((state) => {
          state.globalLoading = false;
          state.loadingMessage = null;
        }),

      // Actions - Modals
      openModal: (modalId) =>
        set((state) => {
          state.activeModal = modalId;
          console.log('🪟 [UIStore] Modal opened:', modalId);
        }),

      closeModal: () =>
        set((state) => {
          console.log('🪟 [UIStore] Modal closed:', state.activeModal);
          state.activeModal = null;
        }),
    })),
    {
      name: 'ui-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences, not runtime state
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectTheme = (state: UIState) => state.theme;
export const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
export const selectLanguage = (state: UIState) => state.language;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectGlobalLoading = (state: UIState) => state.globalLoading;
export const selectLoadingMessage = (state: UIState) => state.loadingMessage;
export const selectActiveModal = (state: UIState) => state.activeModal;

// ============================================================================
// Hooks (convenience)
// ============================================================================

export const useTheme = () => useUIStore(selectTheme);
export const useSidebarCollapsed = () => useUIStore(selectSidebarCollapsed);
export const useLanguage = () => useUIStore(selectLanguage);
export const useNotifications = () => useUIStore(selectNotifications);
export const useGlobalLoading = () => useUIStore(selectGlobalLoading);
export const useLoadingMessage = () => useUIStore(selectLoadingMessage);
export const useActiveModal = () => useUIStore(selectActiveModal);

// ============================================================================
// Notification Helpers (convenience functions)
// ============================================================================

export const showSuccessNotification = (title: string, message: string, duration = 5000) => {
  useUIStore.getState().addNotification({
    type: 'success',
    title,
    message,
    duration,
  });
};

export const showErrorNotification = (title: string, message: string, duration = 8000) => {
  useUIStore.getState().addNotification({
    type: 'error',
    title,
    message,
    duration,
  });
};

export const showWarningNotification = (title: string, message: string, duration = 6000) => {
  useUIStore.getState().addNotification({
    type: 'warning',
    title,
    message,
    duration,
  });
};

export const showInfoNotification = (title: string, message: string, duration = 5000) => {
  useUIStore.getState().addNotification({
    type: 'info',
    title,
    message,
    duration,
  });
};
