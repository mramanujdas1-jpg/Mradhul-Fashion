'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from './config';
import { onAuthStateChange, logOut, processRedirectResult } from './firebase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // Set up Firebase auth observer & local storage hydration
  useEffect(() => {
    // 1. Initial local storage hydration for fast offline load
    try {
      const storedCart = localStorage.getItem('mf_cart');
      const storedWishlist = localStorage.getItem('mf_wishlist');
      const storedTheme = localStorage.getItem('mf_theme');

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      if (storedTheme) {
        setTheme(storedTheme);
        document.body.classList.toggle('dark', storedTheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to parse local storage hydration:', e);
    }

    // 1.5 Process potential Firebase redirect result
    processRedirectResult().catch(err => {
      console.error('Redirect sign-in failed:', err);
      alert('Google Sign-In failed due to cross-origin or popup blocking. Please ensure you are not blocking cookies.');
    });

    // 2. Firebase Authentication Observer
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('mf_auth_token', token);

          // Retrieve any offline guest cart/wishlist to merge
          const guestCart = JSON.parse(localStorage.getItem('mf_cart') || '[]');
          const guestWishlist = JSON.parse(localStorage.getItem('mf_wishlist') || '[]');

          // Sync profiles and merge items on Express API
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

            // Sync context state with merged database data
            setCart(syncedUser.cart || []);
            setWishlist(syncedUser.wishlist || []);
            localStorage.setItem('mf_cart', JSON.stringify(syncedUser.cart || []));
            localStorage.setItem('mf_wishlist', JSON.stringify(syncedUser.wishlist || []));
          } else {
            console.error('Express user sync failed', await response.text());
            alert('Login failed: Our backend server is currently unable to verify your account. Please try again later.');
            await logOut();
          }
        } catch (err) {
          console.error('Error syncing auth state with API:', err);
          alert('Login failed: Network error occurred while contacting our servers.');
          await logOut();
        }
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
        .then((reg) => console.log('ServiceWorker active on scope:', reg.scope))
        .catch((err) => console.warn('ServiceWorker registration error:', err));
    }

    return () => unsubscribe();
  }, []);

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
      console.error('Logout failed:', err);
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
    }).catch(err => console.error('Failed to sync cart updates with database:', err));
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
    }).catch(err => console.error('Failed to sync wishlist updates with database:', err));
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
