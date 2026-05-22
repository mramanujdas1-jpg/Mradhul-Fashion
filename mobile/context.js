import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const MobileContext = createContext();

const API_HOST = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

export function MobileProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

  // Authenticate helper
  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
  };

  // Cart operations
  const addToCart = (product, size = 'M', qty = 1) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product === product._id && item.size === size
      );
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].qty += qty;
        return updated;
      } else {
        return [
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
    });
  };

  const removeFromCart = (productId, size) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product === productId && item.size === size))
    );
  };

  const updateCartQty = (productId, size, qty) => {
    if (qty <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product === productId && item.size === size ? { ...item, qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist toggle
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) {
        return prev.filter((item) => item._id !== product._id);
      } else {
        return [...prev, product];
      }
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
