import { createContext, useContext, useState, useEffect } from 'react';

// Cart lives entirely in the browser — no database needed.
// We persist it to localStorage so it survives page refreshes.
//
// Cart item shape:
// {
//   cartItemId: "uuid",           ← client-generated, used as React key
//   menuItemId: "...",
//   name: "Classic Burger",
//   basePrice: 12.99,
//   selectedChoices: [{ id, label, priceModifier }],
//   quantity: 2,
//   unitPrice: 14.99,             ← basePrice + sum of priceModifiers
//   notes: ""
// }

const CartContext = createContext(null);

function calcUnitPrice(basePrice, choices) {
  return parseFloat(basePrice) + choices.reduce((sum, c) => sum + parseFloat(c.priceModifier), 0);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    // Initialize from localStorage if data exists.
    // The function form of useState only runs once on mount — it's not called on every render.
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  function addItem(menuItem, selectedChoices, quantity, notes) {
    const unitPrice = calcUnitPrice(menuItem.basePrice, selectedChoices);
    const cartItemId = crypto.randomUUID(); // built into modern browsers

    setItems(prev => [...prev, {
      cartItemId,
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.basePrice,
      imageUrl: menuItem.imageUrl,
      selectedChoices,
      quantity,
      unitPrice,
      notes: notes || ''
    }]);
  }

  function removeItem(cartItemId) {
    setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  }

  function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) return removeItem(cartItemId);
    setItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
