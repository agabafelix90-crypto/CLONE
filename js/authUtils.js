import { urls } from './config.dev';

export const SESSION_TOKEN_KEY = 'clinic_session_token';
export const LEGACY_TOKEN_KEY = 'token';
export const SESSION_TOKEN_TIMESTAMP_KEY = 'clinic_session_token_timestamp';
const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const sanitizeToken = (value) => {
  if (!value || typeof value !== 'string') return '';
  const token = value.trim();
  if (token === 'null' || token === 'undefined') return '';
  return token.replace(/[\s\n\r]+/g, '');
};

export const getStoredToken = () => {
  try {
    const storedToken = sanitizeToken(sessionStorage.getItem(SESSION_TOKEN_KEY)) || sanitizeToken(localStorage.getItem(LEGACY_TOKEN_KEY));
    const timestampValue = sessionStorage.getItem(SESSION_TOKEN_TIMESTAMP_KEY);
    const timestamp = Number(timestampValue);

    if (!storedToken) {
      return '';
    }

    if (Number.isFinite(timestamp) && Date.now() - timestamp > SESSION_TTL_MS) {
      clearSessionToken();
      return '';
    }

    return storedToken;
  } catch (error) {
    console.error('Unable to read stored token:', error);
    return '';
  }
};

export const saveSessionToken = (token) => {
  const cleanToken = sanitizeToken(token);
  if (!cleanToken) return;
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, cleanToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, cleanToken);
    sessionStorage.setItem(SESSION_TOKEN_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Unable to save session token:', error);
  }
};

export const clearSessionToken = () => {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.error('Unable to clear session token:', error);
  }
};

export const clearTokenFromUrl = () => {
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('token')) {
      currentUrl.searchParams.delete('token');
      window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
    }
  } catch (error) {
    console.error('Unable to remove token from URL:', error);
  }
};

export const getTokenFromUrlOrSession = ({ stripUrl = false } = {}) => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = sanitizeToken(params.get('token'));
    if (stripUrl && urlToken) {
      clearTokenFromUrl();
    }
    return urlToken || getStoredToken();
  } catch (error) {
    console.error('Unable to parse token from URL:', error);
    return getStoredToken();
  }
};

export const handleInvalidSession = (navigate) => {
  clearSessionToken();
  navigate('/login');
};

export const handleLogout = (navigate, redirectTo = '/login', replace = true) => {
  clearSessionToken();
  if (typeof navigate === 'function') {
    try {
      if (replace) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  } else if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
};

export const verifySession = async (token) => {
  if (!token) {
    return { valid: false, error: 'No session token provided' };
  }

  try {
    const response = await fetch(urls.security, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Session validation failed' };
    }

    const data = await response.json();
    const isValid = data?.message === 'Session valid' && !!data?.clinic_session_token;

    return {
      valid: isValid,
      data,
      error: isValid ? null : data?.message || 'Session invalid',
    };
  } catch (error) {
    return { valid: false, error: error.message || 'Session validation request failed' };
  }
};
