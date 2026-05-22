'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mf_user');
      const storedCart = localStorage.getItem('mf_cart');
      const storedWishlist = localStorage.getItem('mf_wishlist');
      const storedTheme = localStorage.getItem('mf_theme');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      if (storedTheme) {
        setTheme(storedTheme);
        document.body.classList.toggle('dark', storedTheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to parse stored local state', e);
    } finally {
      setLoading(false);
    }

    // Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
        .catch((err) => console.warn('ServiceWorker registration failed:', err));
    }
  }, []);

  // Update theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('mf_theme', nextTheme);
    document.body.classList.toggle('dark', nextTheme === 'dark');
  };

  // Auth helper
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('mf_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mf_user');
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('mf_cart');
    localStorage.removeItem('mf_wishlist');
  };

  // Cart actions
  const addToCart = (product, size = 'M', qty = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product === product._id && item.size === size
      );

      let newCart;
      if (existingItemIndex > -1) {
        newCart = [...prevCart];
        newCart[existingItemIndex].qty += qty;
      } else {
        newCart = [
          ...prevCart,
          {
            product: product._id,
            name: product.name,
            qty,
            image: product.images[0],
            price: product.discountPrice || product.price,
            size
          }
        ];
      }
      localStorage.setItem('mf_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId, size) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter(
        (item) => !(item.product === productId && item.size === size)
      );
      localStorage.setItem('mf_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateCartQty = (productId, size, qty) => {
    if (qty <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.product === productId && item.size === size ? { ...item, qty } : item
      );
      localStorage.setItem('mf_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('mf_cart');
  };

  // Wishlist actions
  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item._id === product._id);
      let newWishlist;
      if (exists) {
        newWishlist = prevWishlist.filter((item) => item._id !== product._id);
      } else {
        newWishlist = [...prevWishlist, product];
      }
      localStorage.setItem('mf_wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        wishlist,
        theme,
        loading,
        login,
        logout,
        toggleTheme,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
