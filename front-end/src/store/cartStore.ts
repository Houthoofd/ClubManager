import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// CART STORE - Zustand State Management
// ============================================================================
//
// 🎉 Migré depuis Redux (panierSlice) - Phase 6 Option B
//
// Ce store gère l'état du panier d'achat avec:
// ✅ Persistance automatique dans localStorage
// ✅ Type safety complet avec TypeScript
// ✅ Immutabilité via middleware Immer
// ✅ Performance optimisée (selective re-renders)
//
// Architecture:
// - State: items[], isOpen
// - Actions: addItem, removeItem, updateQuantity, clearCart, toggleCart
// - Computed: getTotalItems, getTotalPrice, getItemCount, hasItem
// - Selectors: selectCartItems, selectIsCartOpen, etc.
// - Hooks: useCartItems, useIsCartOpen, useCartCount, useCartTotal
//
// Persistance:
// - LocalStorage key: 'cart-storage'
// - Seuls les items sont persistés (pas l'état UI isOpen)
// - Hydratation automatique au chargement
//
// Compatibilité Redux:
// - Layer de compatibilité: src/core/compat/redux-compat.ts
// - Les actions Redux sont mappées vers ce store
// - Migration transparente pour les anciens composants
//
// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  id: string; // unique cart item ID
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  stockId?: number | null;
  size?: string | null;
  imageUrl?: string | null;
  maxQuantity?: number; // Available stock
}

export interface CartState {
  // State
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (productId: number) => number;
  hasItem: (productId: number, stockId?: number | null) => boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const generateCartItemId = (productId: number, stockId?: number | null): string => {
  return `${productId}-${stockId ?? "default"}`;
};

// ============================================================================
// Store
// ============================================================================

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      items: [],
      isOpen: false,

      // Actions
      addItem: (newItem) =>
        set((state) => {
          const itemId = generateCartItemId(newItem.productId, newItem.stockId);
          const existingItemIndex = state.items.findIndex((item) => item.id === itemId);

          if (existingItemIndex >= 0) {
            // Item exists, update quantity
            const existingItem = state.items[existingItemIndex];
            const newQuantity = existingItem.quantity + newItem.quantity;
            const maxQty = existingItem.maxQuantity ?? Infinity;

            state.items[existingItemIndex].quantity = Math.min(newQuantity, maxQty);
            console.log("✅ [CartStore] Updated item quantity:", itemId, newQuantity);
          } else {
            // Add new item
            state.items.push({
              ...newItem,
              id: itemId,
            });
            console.log("✅ [CartStore] Added new item:", itemId);
          }
        }),

      removeItem: (itemId) =>
        set((state) => {
          state.items = state.items.filter((item) => item.id !== itemId);
          console.log("🗑️ [CartStore] Removed item:", itemId);
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const itemIndex = state.items.findIndex((item) => item.id === itemId);
          if (itemIndex >= 0) {
            if (quantity <= 0) {
              // Remove item if quantity is 0 or less
              state.items = state.items.filter((item) => item.id !== itemId);
              console.log("🗑️ [CartStore] Removed item (quantity 0):", itemId);
            } else {
              const maxQty = state.items[itemIndex].maxQuantity ?? Infinity;
              state.items[itemIndex].quantity = Math.min(quantity, maxQty);
              console.log("✅ [CartStore] Updated quantity:", itemId, quantity);
            }
          }
        }),

      clearCart: () =>
        set((state) => {
          state.items = [];
          console.log("🗑️ [CartStore] Cart cleared");
        }),

      toggleCart: () =>
        set((state) => {
          state.isOpen = !state.isOpen;
          console.log("🛒 [CartStore] Cart toggled:", state.isOpen);
        }),

      openCart: () =>
        set((state) => {
          state.isOpen = true;
        }),

      closeCart: () =>
        set((state) => {
          state.isOpen = false;
        }),

      // Computed
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: (productId) => {
        const state = get();
        return state.items
          .filter((item) => item.productId === productId)
          .reduce((total, item) => total + item.quantity, 0);
      },

      hasItem: (productId, stockId) => {
        const state = get();
        const itemId = generateCartItemId(productId, stockId);
        return state.items.some((item) => item.id === itemId);
      },
    })),
    {
      name: "cart-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist items, not UI state
        items: state.items,
      }),
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

export const selectCartItems = (state: CartState) => state.items;
export const selectIsCartOpen = (state: CartState) => state.isOpen;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);

// ============================================================================
// Hooks (convenience)
// ============================================================================

export const useCartItems = () => useCartStore(selectCartItems);
export const useIsCartOpen = () => useCartStore(selectIsCartOpen);
export const useCartCount = () => useCartStore(selectCartCount);
export const useCartTotal = () => useCartStore(selectCartTotal);
