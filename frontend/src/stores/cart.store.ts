import { create } from 'zustand';
import api from '@/lib/api';
import { Cart } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (artistProductId: string, quantity: number, variantSelection?: Record<string, string>, personalization?: string, customizations?: { type: string; price: number; notes?: string }[]) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    try {
      const { data } = await api.get<Cart>('/cart');
      set({ cart: data });
    } catch {
      // User not logged in, no cart
    }
  },

  addItem: async (artistProductId, quantity, variantSelection, personalization, customizations) => {
    set({ isLoading: true });
    try {
      const payload: Record<string, unknown> = { artistProductId, quantity };
      if (variantSelection && Object.keys(variantSelection).length > 0) payload.variantSelection = variantSelection;
      if (personalization) payload.personalization = personalization;
      if (customizations && customizations.length > 0) payload.customizations = customizations;
      await api.post('/cart/items', payload);
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch {
      // ignore
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
    } catch {
      // ignore
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ cart: null });
    } catch {
      // ignore
    }
  },

  itemCount: () => {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
