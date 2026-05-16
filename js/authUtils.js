import { urls } from './config.dev';

export const SESSION_TOKEN_KEY = 'clinic_session_token';
export const LEGACY_TOKEN_KEY = 'token';
export const SESSION_TOKEN_TIMESTAMP_KEY = 'clinic_session_token_timestamp';
export const EMPLOYEE_SESSION_TIMESTAMP_KEY = 'employee_session_timestamp';
export const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login';
const CLINIC_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour storage retention for expired tokens
const EMPLOYEE_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

const sanitizeToken = (value) => {
  if (!value || typeof value !== 'string') return '';
  const token = value.trim();
  if (token === 'null' || token === 'undefined') return '';
  return token.replace(/[\s\n\r]+/g, '');
};

export const getStoredToken = () => {
  try {
    const storedToken = sanitizeToken(sessionStorage.getItem(SESSION_TOKEN_KEY)) || sanitizeToken(localStorage.getItem(LEGACY_TOKEN_KEY));
    const timestampValue = sessionStorage.getItem(SESSION_TOKEN_TIMESTAMP_KEY) || localStorage.getItem(SESSION_TOKEN_TIMESTAMP_KEY);
    const timestamp = Number(timestampValue);

    if (!storedToken) {
      return '';
    }

    if (!Number.isFinite(timestamp)) {
      clearSessionToken();
      return '';
    }

    if (Date.now() - timestamp > CLINIC_SESSION_TTL_MS) {
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
    const now = Date.now().toString();
    sessionStorage.setItem(SESSION_TOKEN_KEY, cleanToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, cleanToken);
    sessionStorage.setItem(SESSION_TOKEN_TIMESTAMP_KEY, now);
    localStorage.setItem(SESSION_TOKEN_TIMESTAMP_KEY, now);
  } catch (error) {
    console.error('Unable to save session token:', error);
  }
};

export const saveEmployeeSessionActivity = () => {
  try {
    sessionStorage.setItem(EMPLOYEE_SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Unable to save employee session activity:', error);
  }
};

export const isEmployeeSessionActive = () => {
  try {
    const timestampValue = sessionStorage.getItem(EMPLOYEE_SESSION_TIMESTAMP_KEY);
    const timestamp = Number(timestampValue);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp <= EMPLOYEE_SESSION_TTL_MS;
  } catch (error) {
    console.error('Unable to read employee session activity:', error);
    return false;
  }
};

export const clearEmployeeSessionActivity = () => {
  try {
    sessionStorage.removeItem(EMPLOYEE_SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Unable to clear employee session activity:', error);
  }
};

export const clearSessionToken = () => {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_TIMESTAMP_KEY);
    clearEmployeeSessionActivity();
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

export const isSessionExpiredResponse = (response, data) => {
  if (!response) return false;
  if (response.status === 401 || response.status === 403) return true;
  const message = (data?.message || data?.error || '').toString().toLowerCase();
  return message.includes('session expired') || message.includes('unauthorized');
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

export const saveRedirectAfterLogin = (path) => {
  try {
    if (!path || typeof path !== 'string') return;
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path);
  } catch (error) {
    console.error('Unable to save redirect path:', error);
  }
};

export const getRedirectAfterLogin = () => {
  try {
    return sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY) || '';
  } catch (error) {
    console.error('Unable to read redirect path:', error);
    return '';
  }
};

export const clearRedirectAfterLogin = () => {
  try {
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
  } catch (error) {
    console.error('Unable to clear redirect path:', error);
  }
};

export const handleInvalidSession = (navigate, redirectPath = null) => {
  clearTokenFromUrl();
  clearSessionToken();
  clearEmployeeSessionActivity();
  if (redirectPath) {
    try {
      const url = new URL(redirectPath, window.location.origin);
      url.searchParams.delete('token');
      saveRedirectAfterLogin(url.pathname + url.search + url.hash);
    } catch (error) {
      saveRedirectAfterLogin(redirectPath);
    }
  }
  navigate('/login', { replace: true });
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

export const verifySession = async (token, signal) => {
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
      signal,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const expired = isSessionExpiredResponse(response, data);
      return {
        valid: false,
        data,
        error: expired ? 'Session expired' : 'Session validation failed',
      };
    }

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
