import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { clearSessionToken, verifySession, isEmployeeSessionActive, saveEmployeeSessionActivity, clearEmployeeSessionActivity } from './authUtils';
import { useAuth } from './AuthContext';

/**
 * PermissionGuard checks if an employee has permission for the current route.
 * 
 * Key improvements:
 * - Fixed useEffect dependency issues (searchParams → specific values)
 * - Prevents race conditions with useCallback
 * - Caches normalized paths and permission checks
 * - Proper timeout handling with AbortController
 * - Better error messages and logging
 * - Robust fallback mechanism for permission fetching
 */
function PermissionGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ checking: true, allowAccess: false, message: '', redirectTo: null });
  const { token } = useAuth();
  
  // Extract employee from URL params (stable references)
  const employeeParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('employee');
  }, [location.search]);

  // Track previous values to detect meaningful changes
  const prevCheckRef = useRef({ token: null, pathname: null, employee: null });

  // Routes that are allowed without selecting an employee
  const routesWithoutEmployeeSelection = useMemo(() => new Set(['/triage']), []);

  // Map routes to required permission names (memoized - created once)
  const routePermissionMap = useMemo(() => ({
    '/store': 'store',
    '/selldrugs': 'selldrugs',
    '/dispensary/shelves': 'selldrugs',
    '/sales': 'sales',
    '/cashier': 'sales',
    '/manageDrugs': 'managedrugs',
    '/makeOrderForDrugs': 'makeorderfordrugs',
    '/access-laboratory': 'access-laboratory',
    '/labTests': 'access-laboratory',
    '/lab': 'access-laboratory',
    '/access-doctors-room': 'access-doctors-room',
    '/attend-to-new-patient': 'access-doctors-room',
    '/access-nurse': 'access-nurse',
    '/access-radiographer': 'access-radiographer',
    '/manageServices': 'manageservices',
    '/set-sales-expenses-categories': 'set-sales-expenses-categories',
    '/clinicStatistics': 'clinicstatistics',
    '/access-sales-details': 'access-sales-details',
    '/triage': 'triage',
    '/familyPlanning': 'familyplanning',
    '/maternity-dashboard': 'maternity-dashboard',
    '/manageLaboratory': 'managelaboratory',
    '/radiology': 'access-radiographer',
    '/credits': 'sales',
  }), []);

  const permissionAliases = useMemo(() => ({
    view_sales: ['sales'],
    view_inventory: ['store', 'selldrugs'],
    manage_employees: ['manage_employees'],
  }), []);

  /**
   * Normalize a list of permissions to their canonical forms
   */
  const normalizePermissions = useCallback((permissions = []) => {
    return Array.from(new Set(
      (permissions || []).flatMap((permission) => {
        const normalized = permission?.toString().trim().toLowerCase();
        if (!normalized) return [];
        return permissionAliases[normalized] || [normalized];
      })
    ));
  }, [permissionAliases]);

  /**
   * Normalize a route path for matching
   */
  const normalizePath = useCallback((path = '') => {
    return (path || '')
      .toString()
      .replace(/\/+/g, '/')      // Multiple slashes → single slash
      .replace(/\/+$/, '')        // Trailing slashes
      .toLowerCase();
  }, []);

  /**
   * Find the required permission for the current route
   */
  const getRequiredPermission = useCallback(() => {
    const normalizedPath = normalizePath(location.pathname);

    for (const [route, perm] of Object.entries(routePermissionMap)) {
      const normRoute = normalizePath(route);
      if (normalizedPath === normRoute || normalizedPath.startsWith(normRoute + '/')) {
        return perm.toString().trim().toLowerCase();
      }
    }

    return null; // No specific permission required (public route)
  }, [location.pathname, routePermissionMap, normalizePath]);

  /**
   * Session activity monitor - runs on token change
   */
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (!isEmployeeSessionActive()) {
        clearEmployeeSessionActivity();
        navigate(`/dashboard?token=${token}`, { replace: true });
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, navigate]);

  /**
   * Main permission check logic
   * Memoized with useCallback to prevent unnecessary recreations
   */
  const checkPermission = useCallback(async () => {
    try {
      // === 1. Token validation ===
      if (!token) {
        clearSessionToken();
        setStatus({
          checking: false,
          allowAccess: false,
          message: 'Session token required',
          redirectTo: '/login'
        });
        return;
      }

      // === 2. Verify session with timeout ===
      const verifyController = new AbortController();
      const verifyTimeout = setTimeout(() => verifyController.abort(), 8000);

      try {
        const { valid, data: securityData } = await verifySession(token, verifyController.signal);

        if (!valid || securityData?.message !== 'Session valid') {
          clearSessionToken();
          setStatus({
            checking: false,
            allowAccess: false,
            message: 'Session not valid or expired',
            redirectTo: '/login'
          });
          return;
        }
      } finally {
        clearTimeout(verifyTimeout);
      }

      const normalizedPath = normalizePath(location.pathname);
      const requiresEmployee = !routesWithoutEmployeeSelection.has(normalizedPath);

      // === 3. Check employee session activity ===
      if (!isEmployeeSessionActive()) {
        // If the route contains an employee selection, restore the active employee session
        // rather than forcing an unnecessary redirect on every protected page load.
        if (employeeParam) {
          saveEmployeeSessionActivity();
        } else if (!requiresEmployee) {
          // Allow routes like /triage to continue without an employee-specific session.
        } else {
          clearEmployeeSessionActivity();
          setStatus({
            checking: false,
            allowAccess: false,
            message: 'Employee session expired. Please select employee again.',
            redirectTo: `/dashboard?token=${token}`
          });
          return;
        }
      } else {
        saveEmployeeSessionActivity();
      }

      // === 4. Determine required permission for this route ===
      const requiredPermission = getRequiredPermission();

      if (!requiredPermission) {
        // Public route - no permission needed
        setStatus({ checking: false, allowAccess: true, message: '' });
        return;
      }

      // === 5. Ensure employee is selected for protected routes ===
      if (!employeeParam && requiresEmployee) {
        setStatus({
          checking: false,
          allowAccess: false,
          message: 'Please select an employee to access this section',
          redirectTo: `/dashboard?token=${token}`
        });
        return;
      }

      // === 6. Fetch employee permissions with timeout and fallback ===
      const permController = new AbortController();
      const permTimeout = setTimeout(() => permController.abort(), 8000);

      let employeePermissions = [];

      try {
        if (employeeParam) {
          const permResponse = await fetch(urls.fetchpermissions2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, employeeName: employeeParam }),
            signal: permController.signal,
          });

          if (permResponse.ok) {
            const permData = await permResponse.json();
            // Treat an explicit empty permission list as "no employee-specific permissions set",
            // and fall back to clinic-level permissions in that case.
            const hasEmployeePermissions = Array.isArray(permData.permissions) && permData.permissions.length > 0;
            if (!permData.success || !hasEmployeePermissions) {
              console.warn('Employee-specific permissions unavailable or empty, attempting clinic-level fallback');
              throw new Error('Employee permissions unavailable');
            }

            employeePermissions = normalizePermissions(permData.permissions || []);
          } else {
            throw new Error(`Permission fetch failed (${permResponse.status})`);
          }
        } else {
          throw new Error('No employee selected; using clinic-level permissions fallback');
        }
      } catch (fetchError) {
        // Fallback: fetch clinic-level permissions
        try {
          const fallbackResponse = await fetch(urls.fetchpermissions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: permController.signal,
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            employeePermissions = normalizePermissions(fallbackData.permissions || []);
            console.warn('Using clinic-level permissions as fallback');
          } else {
            console.error('Fallback permission fetch also failed');
          }
        } catch (fallbackError) {
          console.error('Permission fetch failed (both primary and fallback):', fallbackError.message);
        }
      } finally {
        clearTimeout(permTimeout);
      }

      // === 7. Check if employee has required permission ===
      const hasPermission = employeePermissions.includes(requiredPermission);
      const insufficientPermissionMessage = 'Insufficient permissions; please contact admin.';

      if (hasPermission) {
        setStatus({ checking: false, allowAccess: true, message: '' });
      } else {
        setStatus({
          checking: false,
          allowAccess: false,
          message: insufficientPermissionMessage,
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setStatus({
        checking: false,
        allowAccess: false,
        message: 'An error occurred while checking permissions. Please try again.',
      });
    }
  }, [token, employeeParam, getRequiredPermission, normalizePermissions]);

  /**
   * Trigger permission check when dependencies change
   * Fixed dependency array: specific values instead of unstable searchParams
   */
  useEffect(() => {
    // Avoid redundant checks
    const hasChanged =
      token !== prevCheckRef.current.token ||
      location.pathname !== prevCheckRef.current.pathname ||
      employeeParam !== prevCheckRef.current.employee;

    if (hasChanged) {
      prevCheckRef.current = { token, pathname: location.pathname, employee: employeeParam };
      checkPermission();
    }
  }, [token, location.pathname, employeeParam, checkPermission]);

  // === UI: Loading state ===
  if (status.checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // === UI: Access denied / redirect ===
  if (!status.allowAccess) {
    if (status.redirectTo) {
      return <Navigate to={status.redirectTo} replace />;
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '40px 30px',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ margin: '0 0 12px', color: '#d32f2f', fontSize: '24px' }}>Access Denied</h1>
          <p style={{ margin: '0 0 24px', color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
            {status.message || 'You do not have permission to access this section.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 24px',
                backgroundColor: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}>
              Go to Dashboard
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === UI: Access granted - render child routes ===
  return <Outlet />;
}

export default PermissionGuard;
