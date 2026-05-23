import { urls } from './config.dev';

/*
 * Token model and security notes:
 * - Tokens are accepted from the URL first, then from stored client state.
 * - Supported storage keys are both modern "clinic_auth_token" and legacy "token".
 * - Tokens may exist in either sessionStorage or localStorage for compatibility.
 * - URL tokens are accepted once on initial load and optionally stripped from the address bar
 *   when getTokenFromUrlOrSession({ stripUrl: true }) resolves them.
 * - Application code must use centralized helpers instead of direct
 *   localStorage.getItem('token') access.
 * - Tokens must be cleared from both URL and storage on logout/invalid session.
 */

export const LEGACY_TOKEN_KEY = 'clinic_auth_token';
export const LEGACY_COMPAT_TOKEN_KEY = 'token';
export const EMPLOYEE_SESSION_TIMESTAMP_KEY = 'employee_session_timestamp';
export const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login';
const EMPLOYEE_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

const sanitizeToken = (value) => {
  if (!value || typeof value !== 'string') return '';
  const token = value.trim();
  if (token === 'null' || token === 'undefined') return '';
  return token.replace(/[\s\n\r]+/g, '');
};

export const getStoredToken = () => {
  try {
    const keys = [LEGACY_TOKEN_KEY, LEGACY_COMPAT_TOKEN_KEY];
    const storages = [sessionStorage, localStorage];

    for (const storage of storages) {
      for (const key of keys) {
        const stored = sanitizeToken(storage.getItem(key));
        if (stored) return stored;
      }
    }

    return '';
  } catch (error) {
    console.error('Unable to read stored token:', error);
    return '';
  }
};

export const saveSessionToken = (token, { persistToLocal = false } = {}) => {
  const cleanToken = sanitizeToken(token);
  if (!cleanToken) return;
  try {
    sessionStorage.setItem(LEGACY_TOKEN_KEY, cleanToken);
    if (persistToLocal) {
      localStorage.setItem(LEGACY_TOKEN_KEY, cleanToken);
      localStorage.setItem(LEGACY_COMPAT_TOKEN_KEY, cleanToken);
    }
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
    const keys = [LEGACY_TOKEN_KEY, LEGACY_COMPAT_TOKEN_KEY];
    const storages = [sessionStorage, localStorage];

    for (const storage of storages) {
      for (const key of keys) {
        storage.removeItem(key);
      }
    }

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
    if (urlToken) {
      saveSessionToken(urlToken);
      if (stripUrl) {
        clearTokenFromUrl();
      }
      return urlToken;
    }
  } catch (error) {
    console.error('Unable to parse token from URL:', error);
  }

  return getStoredToken();
};

export const getVerifiedToken = () => getTokenFromUrlOrSession({ stripUrl: true });

export const getActiveToken = () => getTokenFromUrlOrSession();

export const getTokenPayload = (token) => {
  const cleanToken = sanitizeToken(token);
  return cleanToken ? { token: cleanToken } : {};
};

export const getAuthConfig = (options = {}) => {
  const token = getVerifiedToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If we have a token use Authorization header. Otherwise rely on cookies and send credentials.
  const credentials = options.credentials ?? (token ? 'same-origin' : 'include');
  if (token) headers.Authorization = `Bearer ${token}`;

  return { ...options, headers, credentials };
};

export const createAuthenticatedRequest = (input, init = {}) => fetch(input, getAuthConfig(init));

export const refreshSessionToken = async ({ createRedirect = false } = {}) => {
  // Attempt refresh via cookie-based endpoint. Server should set HttpOnly cookie or return a new short-lived token.
  try {
    const response = await fetch(urls.refreshtoken, getAuthConfig({
      method: 'POST',
      body: JSON.stringify({ createRedirect }),
    }));

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      // Server may provide a clinic_session_token (for non-cookie flows) or rely on HttpOnly cookie.
      if (data.clinic_session_token) saveSessionToken(data.clinic_session_token);
      return data;
    }

    // If server indicates session expired, clear local state.
    if (isSessionExpiredResponse(response, data)) {
      handleInvalidSession();
    }

    return null;
  } catch (error) {
    console.error('Unable to refresh session token:', error);
    return null;
  }
};

let _refresherCleanup = null;
export const startSessionRefresher = (intervalMs = 20 * 60 * 1000) => {
  if (_refresherCleanup) return _refresherCleanup;

  const timerId = setInterval(async () => {
    if (isEmployeeSessionActive()) {
      await refreshSessionToken();
    }
  }, intervalMs);

  _refresherCleanup = () => clearInterval(timerId);
  return _refresherCleanup;
};

if (typeof window !== 'undefined') {
  startSessionRefresher();
}

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
  // Always redirect to login to reset application state. Save redirect and then navigate.
  try {
    if (typeof navigate === 'function') {
      navigate('/login', { replace: true });
      return;
    }
  } catch (e) {
    // If router navigation fails, fall back to a hard redirect.
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
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
  // If a token was provided, validate it explicitly. If not, rely on cookie-based validation by sending credentials.
  try {
    const payload = token ? { token } : {};
    const response = await fetch(urls.security, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: token ? 'same-origin' : 'include',
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

    const isValid = data?.message === 'Session valid' || !!data?.clinic_session_valid;

    if (data?.clinic_session_token) {
      saveSessionToken(data.clinic_session_token);
    }

    return {
      valid: isValid,
      data,
      error: isValid ? null : data?.message || 'Session invalid',
    };
  } catch (error) {
    return { valid: false, error: error.message || 'Session validation request failed' };
  }
};
