'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  login: () => {},
  signup: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hydra_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default user profile matching Image 1 & Image 3 ("Miguel Fox")
        const defaultUser = {
          name: 'Miguel Fox',
          email: 'miguel.fox@fifa.com',
          avatar: '/images/hydra/avatar_naufal.png',
          gender: 'Male',
        };
        setUser(defaultUser);
        localStorage.setItem('hydra_user', JSON.stringify(defaultUser));
      }
    } catch {}
  }, []);

  const signup = ({ name, email, gender, password }) => {
    const newUser = {
      name: name || 'Football Fan',
      email: email || 'fan@fifaid.com',
      gender: gender || 'Male',
      avatar: '/images/hydra/avatar_naufal.png',
    };
    setUser(newUser);
    try {
      localStorage.setItem('hydra_user', JSON.stringify(newUser));
    } catch {}
    return newUser;
  };

  const login = ({ email, password }) => {
    const existing = {
      name: email ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)) : 'Miguel Fox',
      email: email || 'miguel.fox@fifa.com',
      avatar: '/images/hydra/avatar_naufal.png',
    };
    setUser(existing);
    try {
      localStorage.setItem('hydra_user', JSON.stringify(existing));
    } catch {}
    return existing;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('hydra_user');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
