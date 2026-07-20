import { createContext, useState, useEffect } from 'react';
import { login as loginService } from '../api/auth';

export const AuthContext = createContext();

// Las llaves { children } aquí son obligatorias
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      localStorage.setItem('token', data.access_token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Error en login", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};