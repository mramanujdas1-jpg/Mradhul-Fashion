import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChange, logOut as firebaseLogOut } from './firebase';
import { requireApiHost } from './config';

const MobileContext = createContext();

const API_HOST = requireApiHost();

export function MobileProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage and set up auth observer
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('mf_cart');
        const storedWishlist = await AsyncStorage.getItem('mf_wishlist');
        const storedTheme = await AsyncStorage.getItem('mf_theme');
        if (storedCart) setCart(JSON.parse(storedCart));
        if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
        if (storedTheme) setTheme(storedTheme);
      } catch (e) {
        console.warn('AsyncStorage load error:', e);
      }
    };
    loadData();

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem('mf_auth_token', token);

          const guestCart = JSON.parse(await AsyncStorage.getItem('mf_cart') || '[]');
          const guestWishlist = JSON.parse(await AsyncStorage.getItem('mf_wishlist') || '[]');

          const response = await fetch(`${API_HOST}/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cart: guestCart, wishlist: guestWishlist })
          });

          if (response.ok) {
            const syncedUser = await response.json();
            setUser({ ...syncedUser, token });
            await AsyncStorage.setItem('mf_user', JSON.stringify(syncedUser));
            
            setCart(syncedUser.cart || []);
            setWishlist(syncedUser.wishlist || []);
            await AsyncStorage.setItem('mf_cart', JSON.stringify(syncedUser.cart || []));
            await AsyncStorage.setItem('mf_wishlist', JSON.stringify(syncedUser.wishlist || []));
          }
        } catch (err) {
          console.warn('Sync failed on auth change:', err);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('mf_user');
        await AsyncStorage.removeItem('mf_auth_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync cart helper
  const syncCartToDatabase = (updatedCart, token) => {
    if (!token) return;
    fetch(`${API_HOST}/auth/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart: updatedCart })
    }).catch(err => console.error('Failed to sync cart to DB on mobile:', err));
  };

  // Sync wishlist helper
  const syncWishlistToDatabase = (updatedWishlist, token) => {
    if (!token) return;
    fetch(`${API_HOST}/auth/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ wishlist: updatedWishlist })
    }).catch(err => console.error('Failed to sync wishlist to DB on mobile:', err));
  };

  // Authenticate helper
  const login = async (userData) => {
    setUser(userData);
    
    // Sync guest cart & wishlist with the database upon login
    try {
      const response = await fetch(`${API_HOST}/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          cart: cart,
          wishlist: wishlist
        })
      });
      if (response.ok) {
        const syncedUser = await response.json();
        setUser({ ...userData, ...syncedUser });
        setCart(syncedUser.cart || []);
        setWishlist(syncedUser.wishlist || []);
      }
    } catch (e) {
      console.warn('Sync failed on mobile login:', e.message);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogOut();
      setUser(null);
      setCart([]);
      setWishlist([]);
      await AsyncStorage.removeItem('mf_user');
      await AsyncStorage.removeItem('mf_auth_token');
      await AsyncStorage.removeItem('mf_cart');
      await AsyncStorage.removeItem('mf_wishlist');
    } catch (e) {
      console.warn('Logout failed:', e);
    }
  };

  // Cart operations
  const addToCart = (product, size = 'M', qty = 1, color = '', image = '') => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product === product._id && item.size === size && (item.color || '') === (color || '')
      );
      let updated;
      if (existingIdx > -1) {
        updated = [...prevCart];
        updated[existingIdx].qty += qty;
      } else {
        updated = [
          ...prevCart,
          {
            product: product._id,
            name: product.name,
            qty,
            image: image || product.images[0],
            price: product.discountPrice || product.price,
            size,
            color
          }
        ];
      }
      if (user) {
        syncCartToDatabase(updated, user.token);
      }
      AsyncStorage.setItem('mf_cart', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const removeFromCart = (productId, size, color = '') => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => !(item.product === productId && item.size === size && (item.color || '') === (color || '')));
      if (user) {
        syncCartToDatabase(updated, user.token);
      }
      AsyncStorage.setItem('mf_cart', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const updateCartQty = (productId, size, qty, color = '') => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prevCart) => {
      const updated = prevCart.map((item) =>
        item.product === productId && item.size === size && (item.color || '') === (color || '') ? { ...item, qty } : item
      );
      if (user) {
        syncCartToDatabase(updated, user.token);
      }
      AsyncStorage.setItem('mf_cart', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    AsyncStorage.removeItem('mf_cart').catch(console.warn);
    if (user) {
      syncCartToDatabase([], user.token);
    }
  };

  // Wishlist toggle
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item._id !== product._id);
      } else {
        updated = [...prev, product];
      }
      if (user) {
        syncWishlistToDatabase(updated, user.token);
      }
      AsyncStorage.setItem('mf_wishlist', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  return (
    <MobileContext.Provider
      value={{
        user,
        cart,
        wishlist,
        theme,
        loading,
        API_HOST,
        login,
        logout,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist
      }}
    >
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  return useContext(MobileContext);
}
