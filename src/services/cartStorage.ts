import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'customkaos_cart_v1';

export const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load cart from localStorage:', err);
    return [];
  }
};

export const saveCart = (items: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart-updated'));
    }
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
};

export const addToCart = (item: CartItem): CartItem[] => {
  const current = loadCart();
  // Ensure every item added to cart has a distinct unique ID
  const hasDuplicateId = !item.id || current.some((i) => i.id === item.id);
  const itemToAdd: CartItem = hasDuplicateId
    ? {
        ...item,
        id: 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        createdAt: new Date().toISOString(),
      }
    : item;

  const updated = [itemToAdd, ...current];
  saveCart(updated);
  return updated;
};

export const removeFromCart = (itemId: string): CartItem[] => {
  const current = loadCart();
  const index = current.findIndex((i) => i.id === itemId);
  if (index >= 0) {
    const updated = [...current];
    updated.splice(index, 1);
    saveCart(updated);
    return updated;
  }
  return current;
};

export const updateCartItemQty = (itemId: string, quantity: number): CartItem[] => {
  const current = loadCart();
  const updated = current.map((i) => {
    if (i.id === itemId) {
      const newQty = Math.max(1, quantity);
      return {
        ...i,
        quantity: newQty,
        subtotal: i.unitPrice * newQty,
      };
    }
    return i;
  });
  saveCart(updated);
  return updated;
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cart-updated'));
    }
  } catch (err) {
    console.error('Failed to clear cart:', err);
  }
};

