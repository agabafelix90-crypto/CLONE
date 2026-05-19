import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession, clearSessionToken, verifySession, isEmployeeSessionActive, saveEmployeeSessionActivity, clearEmployeeSessionActivity } from './authUtils';

/**
 * PermissionGuard checks if an employee has permission for the current route
 * If no employee is specified, it attempts to use the session token directly
 */
function PermissionGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ checking: true, allowAccess: false, message: '', redirectTo: null });

  // Map routes to required permission names
  const routePermissionMap = {
    '/store': 'store',
    '/selldrugs': 'selldrugs',
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
  };

  const permissionAliases = {
    view_sales: ['sales'],
    view_inventory: ['store', 'selldrugs'],
    manage_employees: ['manage_employees'],
  };

  const normalizePermissions = (permissions = []) => {
    return Array.from(new Set(
      (permissions || []).flatMap((permission) => {
        const normalized = permission?.toString().trim().toLowerCase();
        if (!normalized) return [];
        return permissionAliases[normalized] || [normalized];
      })
    ));
  };

  useEffect(() => {
    const token = searchParams.get('token') || getTokenFromUrlOrSession();
    if (!token) return;

    const interval = setInterval(() => {
      if (!isEmployeeSessionActive()) {
        clearEmployeeSessionActivity();
        navigate(`/dashboard?token=${token}`, { replace: true });
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [searchParams, navigate]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const token = searchParams.get('token') || getTokenFromUrlOrSession();
        const employeeParam = searchParams.get('employee');

        if (!token) {
          clearSessionToken();
          setStatus({ checking: false, allowAccess: false, message: 'Session token required', redirectTo: '/login' });
          return;
        }

        // Add a 5-second timeout to permission check
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 10000);

        try {
          const { valid, data: securityData } = await Promise.race([
            verifySession(token, timeoutController.signal),
            new Promise((_, reject) => timeoutController.signal.addEventListener('abort', () => reject(new Error('Permission check timeout'))))
          ]);

          if (!valid || securityData?.message !== 'Session valid') {
            clearSessionToken();
            setStatus({ checking: false, allowAccess: false, message: 'Session not valid', redirectTo: '/login' });
            return;
          }
        } finally {
          clearTimeout(timeoutId);
        }

        if (!isEmployeeSessionActive()) {
          clearEmployeeSessionActivity();
          setStatus({
            checking: false,
            allowAccess: false,
            message: 'Employee session expired',
            redirectTo: `/dashboard?token=${token}`,
          });
          return;
        }

        saveEmployeeSessionActivity();

        // Normalize paths and determine the required permission for this route
        const normalizePath = (p = '') => (p || '').toString().replace(/\/+/g, '/').replace(/\/+$/,'').toLowerCase();
        const normalizedPath = normalizePath(location.pathname);

        let requiredPermission = null;
        for (const [route, perm] of Object.entries(routePermissionMap)) {
          const normRoute = normalizePath(route);
          if (normalizedPath === normRoute || normalizedPath.startsWith(normRoute + '/')) {
            requiredPermission = perm;
            break;
          }
        }

        // Normalize the required permission to match the normalized employee permissions
        if (requiredPermission) {
          requiredPermission = requiredPermission.toString().trim().toLowerCase();
        }

        // If no specific permission mapping, allow access (public sections)
        if (!requiredPermission) {
          setStatus({ checking: false, allowAccess: true, message: '' });
          return;
        }

        // Require an `employee` parameter for permission-protected routes
        if (!employeeParam) {
          setStatus({
            checking: false,
            allowAccess: false,
            message: 'Select an employee to access this section',
            redirectTo: `/dashboard?token=${token}`,
          });
          return;
        }

        // Fetch the employee's permissions with timeout
        const permController = new AbortController();
        const permTimeoutId = setTimeout(() => permController.abort(), 5000);

        try {
          const permResponse = await fetch(urls.fetchpermissions2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, employeeName: employeeParam }),
            signal: permController.signal,
          });

          if (!permResponse.ok) {
            setStatus({
              checking: false,
              allowAccess: false,
              message: `Failed to fetch permissions for ${employeeParam}`,
            });
            return;
          }

          const permData = await permResponse.json();
          let employeePermissions = normalizePermissions(permData.permissions || []);

          if (employeeParam && permData.success === false) {
            console.warn('Employee-specific permissions unavailable, falling back to clinic-level permissions:', permData.message);
            const fallbackResponse = await fetch(urls.fetchpermissions, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              employeePermissions = normalizePermissions(fallbackData.permissions || []);
            }
          }

          // Check if employee has the required permission
          const hasPermission = employeePermissions.includes(requiredPermission);

          if (hasPermission) {
            setStatus({ checking: false, allowAccess: true, message: '' });
          } else {
            setStatus({
              checking: false,
              allowAccess: false,
              message: `You don't have permission to access this section. Required: ${requiredPermission}`,
            });
          }
        } finally {
          clearTimeout(permTimeoutId);
        }
      } catch (error) {
        console.error('Permission check error:', error);
        setStatus({
          checking: false,
          allowAccess: false,
          message: 'Error checking permissions. Please try again.',
        });
      }
    };

    checkPermission();
  }, [location.pathname, searchParams]);

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
          <p style={{ color: '#666' }}>Checking permissions...</p>
        </div>
      </div>
    );
  }

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
          <p style={{ margin: '0 0 24px', color: '#666', lineHeight: '1.6' }}>
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

  return <Outlet />;
}

export default PermissionGuard;
