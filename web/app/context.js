'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from './config';
import { onAuthStateChange, logOut, processRedirectResult } from './firebase';

const AppContext = createContext();

const readJsonFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [authSyncError, setAuthSyncError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const syncFirebaseUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return null;

    setLoading(true);
    setAuthSyncError('');

    try {
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('mf_auth_token', token);

      const guestCart = readJsonFromStorage('mf_cart', []);
      const guestWishlist = readJsonFromStorage('mf_wishlist', []);

      const response = await fetch(`${API_BASE}/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart: guestCart,
          wishlist: guestWishlist
        })
      });

      if (response.ok) {
        const syncedUser = await response.json();
        setUser(syncedUser);
        localStorage.setItem('mf_user', JSON.stringify(syncedUser));
        setCart(syncedUser.cart || []);
        setWishlist(syncedUser.wishlist || []);
        localStorage.setItem('mf_cart', JSON.stringify(syncedUser.cart || []));
        localStorage.setItem('mf_wishlist', JSON.stringify(syncedUser.wishlist || []));
        return syncedUser;
      }

      const fallbackUser = {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Mradhul Customer',
        email: firebaseUser.email || '',
        role: 'customer',
        token,
        syncPending: true
      };
      setUser(fallbackUser);
      setAuthSyncError('Signed in with Firebase, but the backend profile sync is currently unavailable.');
      return fallbackUser;
    } catch {
      const token = await firebaseUser.getIdToken().catch(() => '');
      const fallbackUser = {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Mradhul Customer',
        email: firebaseUser.email || '',
        role: 'customer',
        token,
        syncPending: true
      };
      if (token) localStorage.setItem('mf_auth_token', token);
      setUser(fallbackUser);
      setAuthSyncError('Signed in with Firebase, but the backend profile sync is currently unavailable.');
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up Firebase auth observer & local storage hydration
  useEffect(() => {
    // 1. Initial local storage hydration for fast offline load
    try {
      const storedCart = localStorage.getItem('mf_cart');
      const storedWishlist = localStorage.getItem('mf_wishlist');
      const storedTheme = localStorage.getItem('mf_theme');

      if (storedCart) setCart(readJsonFromStorage('mf_cart', []));
      if (storedWishlist) setWishlist(readJsonFromStorage('mf_wishlist', []));
      if (storedTheme) {
        setTheme(storedTheme);
        document.body.classList.toggle('dark', storedTheme === 'dark');
      }
    } catch {
      setCart([]);
      setWishlist([]);
    }

    // 1.5 Process potential Firebase redirect result (only relevant after signInWithRedirect)
    processRedirectResult()
      .then(result => {
        if (result?.user) return syncFirebaseUser(result.user);
        return null;
      })
      .catch(err => {
        if (err?.code && err.code !== 'auth/null-user') setAuthSyncError(err.message);
      });

    // 2. Firebase Authentication Observer
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      setAuthSyncError('');
      if (firebaseUser) {
        await syncFirebaseUser(firebaseUser);
      } else {
        // Clear authenticated session details on sign out
        setUser(null);
        localStorage.removeItem('mf_user');
        localStorage.removeItem('mf_auth_token');
      }
      setLoading(false);
    });

    // PWA Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(() => {});
    }

    return () => unsubscribe();
  }, [syncFirebaseUser]);

  // Update theme settings
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('mf_theme', nextTheme);
    document.body.classList.toggle('dark', nextTheme === 'dark');
  };

  // Logout Trigger
  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      setCart([]);
      setWishlist([]);
      localStorage.removeItem('mf_user');
      localStorage.removeItem('mf_auth_token');
      localStorage.removeItem('mf_cart');
      localStorage.removeItem('mf_wishlist');
    } catch (err) {
      setAuthSyncError('Unable to sign out right now. Please try again.');
    }
  };

  // helper to sync cart state to API database if user is logged in
  const syncCartToDatabase = (updatedCart) => {
    const token = localStorage.getItem('mf_auth_token');
    if (!token) return;
    
    fetch(`${API_BASE}/auth/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart: updatedCart })
    }).catch(() => {});
  };

  // helper to sync wishlist state to API database if user is logged in
  const syncWishlistToDatabase = (updatedWishlist) => {
    const token = localStorage.getItem('mf_auth_token');
    if (!token) return;

    fetch(`${API_BASE}/auth/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ wishlist: updatedWishlist })
    }).catch(() => {});
  };

  // Add Item to Cart
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
      syncCartToDatabase(newCart);
      return newCart;
    });
    setCartOpen(true);
  };

  // Remove Item from Cart
  const removeFromCart = (productId, size) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter(
        (item) => !(item.product === productId && item.size === size)
      );
      localStorage.setItem('mf_cart', JSON.stringify(newCart));
      syncCartToDatabase(newCart);
      return newCart;
    });
  };

  // Update Cart Quantity
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
      syncCartToDatabase(newCart);
      return newCart;
    });
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('mf_cart');
    syncCartToDatabase([]);
  };

  // Add/Remove Wishlist
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
      syncWishlistToDatabase(newWishlist);
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
        authSyncError,
        syncFirebaseUser,
        logout,
        toggleTheme,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist,
        cartOpen,
        setCartOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
