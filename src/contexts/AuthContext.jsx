import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { clearCache } from '../utils/apiCache';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Interceptor: cerrar sesión solo cuando el token es inválido (401) o la cuenta está inactiva (403 + mensaje específico)
  const interceptorRef = useRef(null);
  useEffect(() => {
    interceptorRef.current = axios.interceptors.response.use(
      res => res,
      err => {
        const status  = err.response?.status;
        const message = err.response?.data?.message || '';
        const cuentaInactiva = status === 403 && (
          message.toLowerCase().includes('inactiv') ||
          message.toLowerCase().includes('bloquead') ||
          message.toLowerCase().includes('cuenta')
        );
        if (status === 401 || cuentaInactiva) {
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
          Cookies.remove('auth_token');
        }
        return Promise.reject(err);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptorRef.current);
    };
  }, []);

  // Verificar si existe token al cargar
  useEffect(() => {
    const storedToken = Cookies.get('auth_token');
    if (storedToken) {
      setToken(storedToken);
      validateToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchPermisos = async (cargo, authToken) => {
    try {
      const res = await axios.get(
        `${API_URL}/permisos/${encodeURIComponent(cargo)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return res.data.success ? (res.data.data || {}) : {};
    } catch {
      return {};
    }
  };

  const validateToken = async (authToken) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const response = await axios.get(`${API_URL}/me`);
      if (response.data.status === 'success') {
        const userData = response.data.user;
        userData.permisos = await fetchPermisos(userData.cargo, authToken);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch {
      delete axios.defaults.headers.common['Authorization'];
      Cookies.remove('auth_token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      if (response.data.status === 'success') {
        const authToken = response.data.token;
        const userData = response.data.user;
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        userData.permisos = await fetchPermisos(userData.cargo, authToken);

        clearCache();
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);

        Cookies.set('auth_token', authToken, {
          expires: 7,
          secure: window.location.protocol === 'https:',
          sameSite: 'Strict',
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || 'Error al iniciar sesión',
        };
      }
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        error: data?.message || error.message || 'Error al iniciar sesión',
        intentos_restantes: data?.intentos_restantes ?? null,
        bloqueado: data?.bloqueado ?? false,
      };
    }
  }, [API_URL]);

  const logout = useCallback(() => {
    clearCache();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    Cookies.remove('auth_token');
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => ({ ...prev, ...partial }));
  }, []);

  const refreshPermisos = useCallback(async (cargo) => {
    const targetCargo = cargo || user?.cargo;
    if (!targetCargo || !token) return;
    const permisos = await fetchPermisos(targetCargo, token);
    if ((!cargo || cargo === user?.cargo)) {
      setUser((prev) => ({ ...prev, permisos }));
    }
  }, [token, user?.cargo]); // eslint-disable-line

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshPermisos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
