import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession, saveSessionToken, handleInvalidSession, isSessionExpiredResponse } from './authUtils';

function Onboarding() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    isFirstLogin: false,
    admin_password_changed: false,
    employee_count: 0,
    drug_count: 0,
    facilityConfigCount: 0,
    canFinishOnboarding: false,
    clinic: '',
  });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const tk = getTokenFromUrlOrSession();
    if (!tk) {
      handleInvalidSession(navigate, window.location.pathname + window.location.search);
      return;
    }

    setToken(tk);
    fetchStatus(tk);
  }, [navigate]);

  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        fetchStatus(token);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token]);

  const fetchStatus = async (tk) => {
    try {
      const res = await fetch(urls.security, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (isSessionExpiredResponse(res, data)) {
          handleInvalidSession(navigate, window.location.pathname + window.location.search);
          return;
        }
        toast.error(data?.message || data?.error || 'Session validation failed. Please log in again.');
        handleInvalidSession(navigate, window.location.pathname + window.location.search);
        return;
      }

      if (!data.isFirstLogin) {
        saveSessionToken(tk);
        navigate(`/dashboard?token=${tk}`);
        return;
      }

      saveSessionToken(tk);
      setStatus({
        isFirstLogin: data.isFirstLogin === true,
        admin_password_changed: data.admin_password_changed === true,
        employee_count: Number(data.employee_count || 0),
        drug_count: Number(data.drug_count || 0),
        facilityConfigCount: Number(data.facilityConfigCount ?? data.drug_count ?? 0),
        canFinishOnboarding: data.canFinishOnboarding === true,
        clinic: data.clinic || '',
      });
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
      handleInvalidSession(navigate, window.location.pathname + window.location.search);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Fill all password fields to continue.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(urls.changepasswords, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          old_password: oldPassword,
          new_password: newPassword,
          password_type: 'admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success('Admin password updated. Continue setup below.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await fetchStatus(token);
      } else {
        toast.error(data.message || data.error || 'Unable to change password.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Network error while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch(urls.finishOnboarding, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success('Onboarding completed. Redirecting to dashboard...');
        // Use redirectTo from backend if provided, otherwise default to dashboard
        const redirectPath = data.redirectTo || `/dashboard?token=${token}`;
        setTimeout(() => navigate(redirectPath), 500); // Small delay to let success message show
      } else {
        if (isSessionExpiredResponse(res, data)) {
          // Auto-redirect to previous page on session expiry
          handleInvalidSession(navigate);
          return;
        }
        // If redirectTo is provided (e.g., redirect to login on session expired), handle it
        if (data?.redirectTo) {
          toast.error(data?.message || 'Session expired. Redirecting to login...');
          setTimeout(() => navigate(data.redirectTo), 1500);
          return;
        }
        toast.error(data?.message || data?.error || 'Complete all required setup steps before continuing.');
      }
    } catch (error) {
      console.error('Finish onboarding error:', error);
      toast.error('Unable to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const buildAuthenticatedPath = (path) => {
    if (!token) return path;
    const params = new URLSearchParams({ token });
    return `${path}?${params.toString()}`;
  };

  const handleQuickNavigate = (path) => {
    if (!token) {
      toast.error('Token missing. Please refresh the page and try again.');
      return;
    }

    const targetUrl = buildAuthenticatedPath(path);
    if (typeof window !== 'undefined') {
      window.location.assign(targetUrl);
    } else {
      navigate(targetUrl);
    }
  };

  const canComplete =
    status.canFinishOnboarding ||
    (status.admin_password_changed && status.employee_count > 0 && status.facilityConfigCount > 0);

  const billingRules = [
    'All MEDCORE charges are payable in UGX and must be issued with an official MEDCORE receipt.',
    'Subscription wallet credit is preloaded once on first login as UGX 10,000 and may only be used for authorized clinic operational expenses.',
    `Default admin access (${status.clinic || 'Admin'} / 12345) is permitted only on first login and must be changed immediately.`,
    'Admin must complete the onboarding guide before dashboard access is granted.',
    'Billing statements are final and managed by clinic administration under MEDCORE policy.',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer position="top-right" />
      <div style={{ maxWidth: '1220px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#4338ca', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '24px' }}>CP</div>
            <div>
              <h1 style={{ fontSize: '34px', marginBottom: '10px', color: '#111827' }}>Welcome to MEDCORE System</h1>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '16px', maxWidth: '760px' }}>
                Complete the full first-time onboarding guide before accessing the normal dashboard. MEDCORE is enforcing strict first-login setup so your clinic is secure and ready to manage patients, inventory, and billing.
              </p>
            </div>
          </div>
        </header>

        <section style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1.5fr 1fr' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ padding: '26px', background: '#ffffff', borderRadius: '22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.06)' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: '22px', color: '#111827' }}>🎉 Getting Started</h2>
              <p style={{ color: '#374151', lineHeight: 1.75, marginBottom: '22px' }}>
                Welcome to your new MEDCORE System! We're excited to help you streamline your clinic operations.
              </p>

              <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: '#111827' }}>🚀 Complete Setup Guide</h3>
              <div style={{ display: 'grid', gap: '14px', color: '#334155', lineHeight: 1.8 }}>
                <div>
                  <strong>Add Employees:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Click on <strong>Settings (admin only)</strong> to add your employees.
                  </p>
                </div>
                <div>
                  <strong>Admin Access:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    The admin password is <strong>12345</strong> <br /> <strong>change it immediately for security</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                  <button
                    onClick={() => handleQuickNavigate('/settings')}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #9d174d',
                      background: '#ffffff',
                      color: '#9d174d',
                      padding: '12px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Change Admin Password
                  </button>
                </div>
                <div>
                  <strong>Employee Settings:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Go to <strong>Employee Settings</strong> in the left sidebar.
                  </p>
                </div>
                <div>
                  <strong>Add Employee Details:</strong>
                  <ul style={{ margin: '8px 0 0 18px', padding: 0, listStyleType: 'disc' }}>
                    <li>Insert employee name (<strong>one name in CAPITAL LETTERS</strong>)</li>
                    <li>Set appropriate permissions for each employee</li>
                    <li>Assign individual passwords (<strong>numbers only, no zeros</strong>)</li>
                  </ul>
                </div>
                <div>
                  <strong>Select Employee:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Return to dashboard and select your name before any action.
                  </p>
                </div>
                <div>
                  <strong>Configure Facility Settings:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    With your name selected, auth password entered, go to:
                  </p>
                  <ul style={{ margin: '8px 0 0 18px', padding: 0, listStyleType: 'disc' }}>
                    <li><strong>Set Drugs</strong> → Add your pharmacy inventory and prices</li>
                    <li><strong>Set Lab/Radiology Exams</strong> → Configure available tests and pricing</li>
                    <li><strong>Set Categories</strong> → Organize your services</li>
                    <li><strong>Set Procedures</strong> → Define medical procedures and costs</li>
                  </ul>
                </div>
                <div>
                  <strong>Start Managing:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Once setup is complete, select your name and go to any department!
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '26px', background: '#ffffff', borderRadius: '22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#111827' }}>Important Billing & Account Rules</h3>
              <div style={{ display: 'grid', gap: '12px', color: '#334155', lineHeight: 1.8 }}>
                {billingRules.map((rule, index) => (
                  <div key={rule} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ minWidth: '20px', color: '#4338ca', fontWeight: 700 }}>{index + 1}.</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '20px', color: '#475569', fontWeight: 600 }}>
                Get Started
                <br />
                For support contact: <strong>+256700123457 | MEDCORE Systems</strong>
              </p>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: '20px', position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <div style={{ padding: '24px', background: '#ffffff', borderRadius: '22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#111827' }}>Progress Checklist</h3>
              <div style={{ display: 'grid', gap: '12px', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: status.admin_password_changed ? '#10b981' : '#e2e8f0', color: status.admin_password_changed ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {status.admin_password_changed ? '✓' : '1'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Change Admin Password</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{status.admin_password_changed ? 'Completed' : 'Required'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: status.employee_count > 0 ? '#10b981' : '#e2e8f0', color: status.employee_count > 0 ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {status.employee_count > 0 ? '✓' : '2'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Add Employee</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{status.employee_count > 0 ? `${status.employee_count} added` : 'Required'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '999px', background: status.facilityConfigCount > 0 ? '#10b981' : '#e2e8f0', color: status.facilityConfigCount > 0 ? '#fff' : '#64748b', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {status.facilityConfigCount > 0 ? '✓' : '3'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Configure Facility</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{status.facilityConfigCount > 0 ? `${status.facilityConfigCount} items added` : 'Add drugs/tests/procedures'}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinishSetup}
                disabled={!canComplete || loading}
                style={{
                  marginTop: '22px',
                  width: '100%',
                  borderRadius: '14px',
                  border: 'none',
                  background: canComplete ? '#4338ca' : '#c7d2fe',
                  color: '#ffffff',
                  padding: '16px 18px',
                  cursor: canComplete ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  fontSize: '15px',
                }}
              >
                {loading ? 'Completing setup…' : 'Finish onboarding'}
              </button>
            </div>

            <div style={{ padding: '24px', background: '#ffffff', borderRadius: '22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.06)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '18px', color: '#111827' }}>Quick actions</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => handleQuickNavigate('/employeesettings')}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #4338ca', background: '#ffffff', color: '#4338ca', padding: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Go to Employee Settings
                </button>
                <button
                  onClick={() => handleQuickNavigate('/settings')}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #9d174d', background: '#ffffff', color: '#9d174d', padding: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Change Admin Password
                </button>
                <button
                  onClick={() => handleQuickNavigate('/manageDrugs')}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #047857', background: '#ffffff', color: '#047857', padding: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Go to Set Drugs
                </button>
                <button
                  onClick={() => handleQuickNavigate('/manageLaboratory')}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #0c4a6e', background: '#ffffff', color: '#0c4a6e', padding: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Go to Lab/Radiology Exams
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

export default Onboarding;

