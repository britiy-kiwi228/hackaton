import React, { useState, useEffect, createContext, useContext } from 'react';
import { loginWithEmailPassword, registerUser, loginWithTelegram, getCurrentUser } from '../api/authApi';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginWithToken = async (token) => {
    setToken(token);
    localStorage.setItem('token', token);
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setError(error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      loginWithToken(storedToken);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
