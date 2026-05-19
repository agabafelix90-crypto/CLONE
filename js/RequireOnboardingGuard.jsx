import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getTokenFromUrlOrSession, verifySession, handleInvalidSession } from './authUtils';

const onboardingAllowedPaths = [
  '/onboarding',
  '/settings',
  '/employeesettings',
  '/employee-settings',
  '/manageDrugs',
  '/adddrug',
  '/manageLaboratory',
  '/labTests',
  '/radiology',
  '/manageServices',
  '/set-sales-expenses-categories',
];

const adminPasswordRequiredPaths = [
  '/adddrug',
  '/labTests',
  '/radiology',
  '/manageServices',
  '/set-sales-expenses-categories',
];

function RequireOnboardingGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ checking: true, allowAccess: false, redirectTo: '/login' });

  useEffect(() => {
    const token = getTokenFromUrlOrSession();
    if (!token) {
      handleInvalidSession(navigate, location.pathname + location.search);
      return;
    }

    let isCancelled = false;

    const validateSession = async () => {
      try {
        const { valid, data } = await verifySession(token);

        if (!valid || !data?.clinic_session_token) {
          if (!isCancelled) {
            handleInvalidSession(navigate, location.pathname + location.search);
          }
          return;
        }

        const isFirstLogin = data.isFirstLogin === true;
        const isAdminPasswordChanged = data.admin_password_changed === true;
        const normalizePath = (p = '') => (p || '').toString().replace(/\/+/g, '/').replace(/\/+$/,'').toLowerCase();
        const normalizedPath = normalizePath(location.pathname);

        if (isFirstLogin) {
          if (normalizedPath === '/onboarding') {
            if (!isCancelled) {
              setStatus({ checking: false, allowAccess: true, redirectTo: '/onboarding' });
            }
            return;
          }

          if (!isAdminPasswordChanged && adminPasswordRequiredPaths.some((path) => {
            const normalizedAllowedPath = normalizePath(path);
            return normalizedPath === normalizedAllowedPath || normalizedPath.startsWith(normalizedAllowedPath + '/');
          })) {
            if (!isCancelled) {
              setStatus({ checking: false, allowAccess: false, redirectTo: `/onboarding?token=${token}` });
            }
            return;
          }

          const allowedDuringOnboarding = onboardingAllowedPaths.some((allowedPath) => {
            const normalizedAllowedPath = normalizePath(allowedPath);
            return normalizedPath === normalizedAllowedPath || normalizedPath.startsWith(normalizedAllowedPath + '/');
          });

          if (!allowedDuringOnboarding) {
            if (!isCancelled) {
              setStatus({ checking: false, allowAccess: false, redirectTo: `/onboarding?token=${token}` });
            }
            return;
          }
        }

        if (!isCancelled) {
          setStatus({ checking: false, allowAccess: true, redirectTo: '/login' });
        }
      } catch (error) {
        if (!isCancelled) {
          setStatus({ checking: false, allowAccess: false, redirectTo: '/login' });
        }
      }
    };

    validateSession();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  if (status.checking) {
    return null;
  }

  if (!status.allowAccess) {
    return <Navigate to={status.redirectTo} replace />;
  }

  return <Outlet />;
}

export default RequireOnboardingGuard;
