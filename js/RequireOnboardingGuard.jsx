import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession, clearSessionToken, verifySession } from './authUtils';

const onboardingAllowedPaths = [
  '/onboarding',
  '/employeesettings',
  '/employee-settings',
  '/manageDrugs',
  '/adddrug',
  '/labTests',
  '/radiology',
  '/manageServices',
  '/set-sales-expenses-categories',
];

const adminPasswordRequiredPaths = [
  '/employeesettings',
  '/employee-settings',
  '/manageDrugs',
  '/adddrug',
  '/labTests',
  '/radiology',
  '/manageServices',
  '/set-sales-expenses-categories',
];

function RequireOnboardingGuard() {
  const location = useLocation();
  const [status, setStatus] = useState({ checking: true, allowAccess: false, redirectTo: '/login' });

  useEffect(() => {
    const token = getTokenFromUrlOrSession();
    if (!token) {
      clearSessionToken();
      setStatus({ checking: false, allowAccess: false, redirectTo: '/login' });
      return;
    }

    let isCancelled = false;

    const validateSession = async () => {
      try {
        const { valid, data } = await verifySession(token);

        if (!valid || !data?.clinic_session_token) {
          if (!isCancelled) {
            clearSessionToken();
            setStatus({ checking: false, allowAccess: false, redirectTo: '/login' });
          }
          return;
        }

        const isFirstLogin = data.isFirstLogin === true;
        const isAdminPasswordChanged = data.admin_password_changed === true;
        const normalizedPath = location.pathname.toLowerCase();

        if (isFirstLogin) {
          if (normalizedPath === '/onboarding') {
            if (!isCancelled) {
              setStatus({ checking: false, allowAccess: true, redirectTo: '/onboarding' });
            }
            return;
          }

          if (!isAdminPasswordChanged && adminPasswordRequiredPaths.some(path => normalizedPath === path || normalizedPath.startsWith(path))) {
            if (!isCancelled) {
              setStatus({ checking: false, allowAccess: false, redirectTo: `/onboarding?token=${token}` });
            }
            return;
          }

          const allowedDuringOnboarding = onboardingAllowedPaths.some((allowedPath) =>
            normalizedPath === allowedPath || normalizedPath.startsWith(allowedPath)
          );

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
