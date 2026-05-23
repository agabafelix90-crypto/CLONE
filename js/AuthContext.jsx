import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getTokenFromUrlOrSession,
  getStoredToken,
  getTokenPayload,
  saveSessionToken,
  clearSessionToken,
} from './authUtils';

const AuthContext = createContext({
  token: '',
  isAuthenticated: false,
  tokenSource: 'none',
  setActiveToken: () => {},
  clearAuth: () => {},
  getTokenPayload: () => ({}),
});

export function AuthProvider({ children }) {
  const location = useLocation();
  const [token, setToken] = useState(() => getTokenFromUrlOrSession());
  const [tokenSource, setTokenSource] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return 'url';
    return getStoredToken() ? 'storage' : 'none';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      const resolved = getTokenFromUrlOrSession();
      setToken(resolved);
      setTokenSource('url');
      return;
    }

    const storedToken = getStoredToken();
    setToken(storedToken);
    setTokenSource(storedToken ? 'storage' : 'none');
  }, [location.search]);

  const setActiveToken = useCallback((nextToken, { persistToLocal = false } = {}) => {
    saveSessionToken(nextToken, { persistToLocal });
    setToken(nextToken);
    setTokenSource('storage');
  }, []);

  const clearAuth = useCallback(() => {
    clearSessionToken();
    setToken('');
    setTokenSource('none');
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      tokenSource,
      setActiveToken,
      clearAuth,
      getTokenPayload,
    }),
    [token, tokenSource, setActiveToken, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
