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
        const parsed = JSON.parse(stored);
        if (parsed?.name === 'Miguel Fox') {
          // Clear legacy default profile
          localStorage.removeItem('hydra_user');
          setUser(null);
        } else {
          setUser(parsed);
        }
      } else {
        setUser(null);
      }
    } catch {}
  }, []);

  const signup = ({ name, email, gender, password }) => {
    const newUser = {
      name: name || 'Sports Fan',
      email: email || '',
      gender: gender || '',
      avatar: '/images/hydra/avatar_naufal.png',
    };
    setUser(newUser);
    try {
      localStorage.setItem('hydra_user', JSON.stringify(newUser));
    } catch {}
    return newUser;
  };

  const login = ({ email, password }) => {
    const defaultName = email ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)) : 'Sports Fan';
    const existing = {
      name: defaultName,
      email: email || '',
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
