import React, { useState, useRef, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession, saveSessionToken, saveEmployeeSessionActivity, handleLogout } from './authUtils';
import EmployeeOfTheMonth from './EmployeeOfTheMonth';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign, faCommentDots, faClipboardList, faNotesMedical,
  faUserNurse, faTimes, faUserMd, faRadiation,
  faPills, faUser, faFlask, faShoppingCart,
  faAddressBook, faCalendar, faTachometerAlt, faChartBar,
  faCogs, faSpinner, faCreditCard, faBoxes,
  faReceipt, faLock, faShieldAlt, faPhone,
  faCalendarCheck, faWallet, faCircle, faBars,
  faChevronLeft, faChevronRight, faSignOutAlt, faStore
} from '@fortawesome/free-solid-svg-icons';

// ─── Keyframe injection ───────────────────────────────────────
const STYLE_ID = 'dashboard-global-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fadeIn        { from{opacity:0} to{opacity:1} }
    @keyframes slideIn       { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes modalSlideIn  { from{transform:translateY(-30px) scale(0.95);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
    @keyframes sp-shimmer    { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes sp-fadein     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes sp-dot-blink  { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes sp-pulse-red  { 0%,100%{box-shadow:0 0 0 0 rgba(255,77,79,0.55)} 60%{box-shadow:0 0 0 7px rgba(255,77,79,0)} }
    @keyframes sp-pulse-orange{ 0%,100%{box-shadow:0 0 0 0 rgba(250,140,22,0.5)} 60%{box-shadow:0 0 0 7px rgba(250,140,22,0)} }
    .radiating-icon { color: #ffffff; }
    .sb-btn:hover { background-color: rgba(255,255,255,0.10) !important; transform: translateX(2px); }
    @media (max-width: 768px) {
      .sidebar-mobile-open { transform: translateX(0) !important; }
      .main-content-shifted { margin-left: 0 !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ──────────────────────────────────────────────────
const isSmsMode = (data) =>
  data !== null && data !== undefined && data.days_remaining !== undefined && data.days_remaining !== null;

const getDaysColor = (days) => {
  if (days < 10)  return { primary: '#ff4d4f', glow: 'rgba(255,77,79,0.45)',  label: 'Critical', pulse: 'sp-pulse-red 1.4s infinite' };
  if (days <= 30) return { primary: '#fa8c16', glow: 'rgba(250,140,22,0.35)', label: 'Low',      pulse: 'sp-pulse-orange 1.6s infinite' };
  return           { primary: '#52c41a', glow: 'rgba(82,196,26,0.30)',         label: 'Active',   pulse: 'none' };
};

// ─── Sidebar Subscription Panel ───────────────────────────────
const SidebarSubscriptionPanel = ({ subscriptionData, loading }) => {
  const smsMode = isSmsMode(subscriptionData);

  const cardStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '8px',
    animation: 'sp-fadein 0.4s ease both',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  };

  const shimmerBlue = {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.4px',
    fontVariantNumeric: 'tabular-nums',
    background: 'linear-gradient(90deg,#fff 0%,#a8d8ff 40%,#fff 80%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'sp-shimmer 3.5s linear infinite',
  };

  const shimmerGreen = {
    ...shimmerBlue,
    background: 'linear-gradient(90deg,#fff 0%,#b9f0c8 40%,#fff 80%)',
    backgroundSize: '200% auto',
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Loading...</span>
      </div>
    );
  }

  if (smsMode) {
    const airtime = subscriptionData?.airtime ?? subscriptionData?.current_balance ?? 0;
    const days    = subscriptionData?.days_remaining ?? 0;
    const dc      = getDaysColor(days);

    return (
      <>
        <div style={cardStyle}>
          <div style={labelStyle}>
            <FontAwesomeIcon icon={faCommentDots} />
            SMS Airtime
          </div>
          <div style={shimmerBlue}>
            UGX {Number(airtime).toLocaleString()}
          </div>
        </div>
        <div style={{ ...cardStyle, animationDelay: '0.07s' }}>
          <div style={labelStyle}>
            <FontAwesomeIcon icon={faCalendarCheck} />
            Subscription Days
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '17px', fontWeight: '800', color: dc.primary, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 12px ${dc.glow}` }}>
              {days}
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginLeft: '4px' }}>days</span>
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              backgroundColor: `${dc.primary}22`,
              border: `1px solid ${dc.primary}66`,
              borderRadius: '20px', padding: '2px 9px',
              fontSize: '10px', fontWeight: '700', color: dc.primary,
              letterSpacing: '0.6px', animation: dc.pulse,
            }}>
              <FontAwesomeIcon icon={faCircle} style={{ fontSize: '6px', animation: days < 30 ? 'sp-dot-blink 1s infinite' : 'none' }} />
              {dc.label}
            </span>
          </div>
        </div>
      </>
    );
  }

  const balance = subscriptionData?.current_balance ?? 0;
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>
        <FontAwesomeIcon icon={faWallet} />
        Subscription Balance
      </div>
      <div style={shimmerGreen}>
        UGX {Number(balance).toLocaleString()}
      </div>
    </div>
  );
};

// ─── Welcome Modal ────────────────────────────────────────────
const WelcomeModal = ({ onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)'
  }}>
    <div style={{
      backgroundColor: '#fff', padding: '30px', borderRadius: '10px',
      maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
      position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', borderBottom: '2px solid #001969', paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#001969' }}>Welcome to MEDCORE System</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>
          <FontAwesomeIcon icon={faTimes} className="radiating-icon" style={{ color: '#666' }} />
        </button>
      </div>
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#001969' }}>🎉 Getting Started</h3>
          <p>Welcome to your new MEDCORE System! We're excited to help you streamline your clinic operations.</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#001969' }}>🚀 Complete Setup Guide</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>🔑 Access Admin Settings:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>Click <strong>Settings (admin only)</strong> button in the left sidebar</li>
                <li>Enter the admin password: <strong style={{ color: '#dc2626' }}>12345</strong></li>
                <li>This takes you to the Admin Dashboard where you can manage employees</li>
              </ul>
            </li>
            <li><strong>⚠️ First Time:</strong> Change your admin password immediately for security</li>
            <li><strong>Add Employees:</strong> In Admin Dashboard → Go to "Employee Settings" section</li>
            <li><strong>Add Employee Details:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>Insert employee name (one name in CAPITAL LETTERS)</li>
                <li>Set appropriate permissions for each employee</li>
                <li>Assign individual passwords (numbers only, no zeros)</li>
              </ul>
            </li>
            <li><strong>Select Employee:</strong> Return to dashboard and select your name before any action</li>
            <li><strong>Configure Facility Settings:</strong> With your name selected, go to:
              <ul style={{ marginTop: '5px' }}>
                <li><strong>Set Drugs</strong> - Add your pharmacy inventory and prices</li>
                <li><strong>Set Lab/Radiology Exams</strong> - Configure available tests and pricing</li>
                <li><strong>Set Categories</strong> - Organize your services</li>
                <li><strong>Set Procedures</strong> - Define medical procedures and costs</li>
              </ul>
            </li>
            <li><strong>Start Managing:</strong> Once setup is complete, select your name and go to any department!</li>
          </ol>
        </div>
      </div>
      <div style={{
        marginBottom: '20px', backgroundColor: '#fff3cd',
        border: '1px solid #ffeeba', borderRadius: '5px', padding: '15px'
      }}>
        <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>📝 Important Notes</h3>
        <ul style={{ margin: 0, color: '#856404' }}>
          <li>Charges are based on active usage - no usage, no charges</li>
          <li>Multiple users? Each active user costs UGX 500 per 24 hours</li>
          <li>Single user clinics are charged the minimum UGX 700 daily rate</li>
          <li>Keep your account active to avoid automatic deletion after 30 days of inactivity</li>
        </ul>
      </div>
      <div style={{ textAlign: 'center', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
        <button onClick={onClose} style={{
          backgroundColor: '#001969', color: 'white', border: 'none',
          padding: '12px 30px', borderRadius: '5px', fontSize: '16px',
          cursor: 'pointer', marginBottom: '10px'
        }}>Get Started</button>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          For support contact: +2567526488447 | MEDCORE Systems
        </p>
      </div>
    </div>
  </div>
);

// ─── Security Modal ───────────────────────────────────────────
const SecurityModal = ({ onClose, onConfirm, loading, title, subtitle, showThemeToggle, currentTheme, onThemeChange, employeeName }) => {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px',
        margin: '0 16px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        overflow: 'hidden', animation: 'modalSlideIn 0.3s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #001969 0%, #0033cc 100%)',
          padding: '24px 24px 20px', position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer', color: '#fff',
            fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
            <FontAwesomeIcon icon={faTimes} className="radiating-icon" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%',
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '22px', color: '#fff' }} className="radiating-icon" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                {title || 'Authentication Required'}
              </h3>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                {subtitle || (employeeName ? `Verifying identity for ${employeeName}` : 'Enter your security code to proceed')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {showThemeToggle && employeeName && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px', padding: '10px 14px',
              backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>Interface Theme</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['blue', 'system', 'dark'].map(t => (
                  <button key={t} type="button" onClick={() => onThemeChange(t)} style={{
                    padding: '5px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    backgroundColor: currentTheme === t
                      ? (t === 'blue' ? '#0056b3' : t === 'system' ? '#495057' : '#343a40')
                      : '#e9ecef',
                    color: currentTheme === t ? 'white' : '#495057',
                    fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
                    boxShadow: currentTheme === t
                      ? `0 2px 6px ${t === 'blue' ? 'rgba(0,86,179,0.4)' : t === 'system' ? 'rgba(73,80,87,0.45)' : 'rgba(52,58,64,0.45)'}`
                      : 'none'
                  }}>
                    {t === 'system' ? 'System' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151',
              marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight: '6px', color: '#001969' }} className="radiating-icon" />
              Employee Password / PIN
            </label>
            <input
              ref={inputRef}
              type="password"
              placeholder="••••••••"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && onConfirm(code)}
              style={{
                width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '18px', letterSpacing: '6px',
                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box', backgroundColor: '#fafafa', color: '#1f2937'
              }}
              onFocus={e => { e.target.style.borderColor = '#001969'; e.target.style.boxShadow = '0 0 0 3px rgba(0,25,105,0.12)'; e.target.style.backgroundColor = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#fafafa'; }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Press Enter or click Proceed to authenticate
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: '1', padding: '13px', backgroundColor: '#f3f4f6', color: '#374151',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
              Cancel
            </button>
            <button onClick={() => onConfirm(code)} disabled={loading} style={{
              flex: '2', padding: '13px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #001969 0%, #0033cc 100%)',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              {loading
                ? <><FontAwesomeIcon icon={faSpinner} spin className="radiating-icon" /> Verifying...</>
                : <><FontAwesomeIcon icon={faShieldAlt} className="radiating-icon" /> Proceed</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Admin Modal ──────────────────────────────────────────────
const AdminModal = ({ onClose, onConfirm, loading }) => {
  const [pwd, setPwd] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px',
        margin: '0 16px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        overflow: 'hidden', animation: 'modalSlideIn 0.3s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
          padding: '24px', position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer', color: '#fff',
            fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FontAwesomeIcon icon={faTimes} className="radiating-icon" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%',
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FontAwesomeIcon icon={faTachometerAlt} style={{ fontSize: '22px', color: '#fff' }} className="radiating-icon" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '700' }}>Admin Access</h3>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>Enter admin password to continue</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <label style={{
            display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            <FontAwesomeIcon icon={faLock} style={{ marginRight: '6px', color: '#7b1fa2' }} className="radiating-icon" />
            Admin Password
          </label>
          <input
            ref={inputRef}
            type="password"
            placeholder="••••••••"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && onConfirm(pwd)}
            style={{
              width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
              borderRadius: '10px', fontSize: '18px', letterSpacing: '6px',
              outline: 'none', boxSizing: 'border-box', backgroundColor: '#fafafa', marginBottom: '20px'
            }}
            onFocus={e => { e.target.style.borderColor = '#7b1fa2'; e.target.style.boxShadow = '0 0 0 3px rgba(123,31,162,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: '1', padding: '13px', backgroundColor: '#f3f4f6', color: '#374151',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}>Cancel</button>
            <button onClick={() => onConfirm(pwd)} disabled={loading} style={{
              flex: '2', padding: '13px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {loading
                ? <><FontAwesomeIcon icon={faSpinner} spin className="radiating-icon" /> Verifying...</>
                : 'Access Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard() {
  const [selectedEmployee, setSelectedEmployee]         = useState(null);
  const [selectedEmployeeTheme, setSelectedEmployeeTheme] = useState('blue');
  const [action, setAction]                             = useState(null);
  const [currentTime, setCurrentTime]                   = useState(new Date());
  const [employees, setEmployees]                       = useState([]);
  const [showAdminModal, setShowAdminModal]             = useState(false);
  const [appointmentCount, setAppointmentCount]         = useState(0);
  const [birthdayCount, setBirthdayCount]               = useState(0);
  const [showModal, setShowModal]                       = useState(false);
  const [loading, setLoading]                           = useState(false);
  const [clinicName, setClinicName]                     = useState('');
  const [token, setToken]                               = useState('');
  const [currentPage, setCurrentPage]                   = useState(1);
  const [searchTerm, setSearchTerm]                     = useState('');

  const [screenWidth, setScreenWidth]                   = useState(window.innerWidth);
  const [showWelcomeModal, setShowWelcomeModal]         = useState(false);
  const [clinicWelcomeShown, setClinicWelcomeShown]       = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen]         = useState(false);
  const [setupType, setSetupType]                       = useState(null); // 'pharmacy', 'clinic', or null

  const [showSidebarModal, setShowSidebarModal]         = useState(false);
  const [sidebarLoading, setSidebarLoading]             = useState(false);
  const [sidebarAction, setSidebarAction]               = useState('');
  const [sidebarEmployeeTheme, setSidebarEmployeeTheme] = useState('blue');

  const [subscriptionData, setSubscriptionData]         = useState(null);
  const [subscriptionLoading, setSubscriptionLoading]   = useState(false);

  const searchInputRef      = useRef(null);
  const employeesContainerRef = useRef(null);
  const isMounted           = useRef(true);
  const navigate            = useNavigate();

  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAup3FU135mAvJT6OheYW3
pQyWf6jvS4duUMY4cXrlJXyGqu8HqvTU0ewPy6w2HhCPxWboNclkAkPhOCc4URNT
x1Grg+mCsWmfhVimP2wtfmlBCJ09cyDMYf93iGj8RFf3CshY5yhppT/pX+RgTuXw
ClpOXe24CLG2VF9suNylk+ReAMLyOxaekYofAMBvvrD4+GYPJgvkTMXCXCKp2PnO
8+OjiltNMnoyqPEZoXHTV4EXtTrjYnwzSe0WZSSuzgVMhmtdx+IS4eisSumHV1eI
wBeZwI0bYGxDCedPRassmSFgTFqkkcgIXmEP1n5w/08S/QPr2G+myKTeRqp5RJA5
PQIDAQAB
-----END PUBLIC KEY-----`;

  // Check if we are in pharmacy mode
  const isPharmacyMode = setupType === 'pharmacy';

  // Responsive layout helpers
  const getEmployeesPerPage = () => {
    if (screenWidth >= 1920) return { maxEmployees: 20, perRow: 10 };
    if (screenWidth >= 1600) return { maxEmployees: 16, perRow: 8 };
    if (screenWidth >= 1440) return { maxEmployees: 14, perRow: 7 };
    if (screenWidth >= 1200) return { maxEmployees: 12, perRow: 6 };
    if (screenWidth >= 992)  return { maxEmployees: 8,  perRow: 4 };
    if (screenWidth >= 768)  return { maxEmployees: 6,  perRow: 3 };
    if (screenWidth >= 576)  return { maxEmployees: 4,  perRow: 2 };
    return { maxEmployees: 3, perRow: 1 };
  };
  const { maxEmployees: employeesPerPage, perRow: employeesPerRow } = getEmployeesPerPage();
  const sidebarWidth = screenWidth < 768 ? '260px' : '250px';
  const isMobile = screenWidth < 768;

  // Effects
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const tk = getTokenFromUrlOrSession();
    setToken(tk);

    if (!tk) {
      handleLogout(navigate);
      return;
    }

    saveSessionToken(tk);

    const fetchClinicName = async () => {
      try {
        const response = await fetch(`${urls.fetchclinicname}?token=${tk}`);
        const data = await response.json();
        if (response.ok) {
          if (isMounted.current) {
            setClinicName(data.clinic_name);
            setClinicWelcomeShown(data.welcome_shown === true);
            if (data.subscription_balance !== undefined) {
              setSubscriptionData({ current_balance: Number(data.subscription_balance || 10000), currency: 'UGX' });
            }
            if (data.set_up === 'pharmacy') {
              setSetupType('pharmacy');
            } else if (data.set_up === 'clinic') {
              setSetupType('clinic');
            } else {
              setSetupType(null);
            }
          }
        } else if (data.error === 'Session expired') {
          handleLogout(navigate);
        }
      } catch (error) {
        console.error('Error fetching clinic name:', error);
      }
    };

    fetchClinicName();
  }, [navigate]);

  useEffect(() => {
    const fetchBirthdayCount = async () => {
      try {
        const response = await fetch(`${urls.birthdaycount}?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted.current) {
            setBirthdayCount(data.birthday_count);
          }
        }
      } catch (error) {
        console.error('Error fetching birthday count:', error);
      }
    };
    if (token) fetchBirthdayCount();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const markWelcomeShown = async (tk) => {
    try {
      if (!tk) return;
      await fetch(`${urls.markWelcomeShown}?token=${tk}`);
    } catch (error) {
      console.error('Error marking welcome shown:', error);
    }
  };

  const fetchEmployees = async () => {
    const tk = token;
    if (!tk) {
      return;
    }

    try {
      const response = await fetch(`${urls.fetchemployees2}?token=${tk}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const payload = await response.json();
      const data = Array.isArray(payload)
        ? payload
        : payload.data ?? payload.employees ?? [];
      if (isMounted.current) {
        setEmployees(data);
        if (data.length === 0 && !clinicWelcomeShown) {
          setShowWelcomeModal(true);
          setClinicWelcomeShown(true);
          markWelcomeShown(tk);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error.message);
      if (isMounted.current) {
        setEmployees([]);
        if (!clinicWelcomeShown) {
          setShowWelcomeModal(true);
          setClinicWelcomeShown(true);
          markWelcomeShown(tk);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    if (token) fetchEmployees();
  }, [token, clinicWelcomeShown]);

  useEffect(() => {
    const fetchAppointmentCount = async () => {
      try {
        const response = await fetch(`${urls.countappointments}?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted.current) {
            setAppointmentCount(data.appointment_count);
          }
        }
      } catch (error) {
        console.error('Error fetching appointment count:', error);
      }
    };
    if (token) fetchAppointmentCount();
  }, [token]);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        if (!token) return;
        setSubscriptionLoading(true);
        const response = await fetch(urls.fetchbalance, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted.current) {
            setSubscriptionData(data);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        if (isMounted.current) {
          setSubscriptionLoading(false);
        }
      }
    };
    if (token) fetchSubscriptionData();
  }, [token]);

  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      if (!showModal && !showAdminModal && !showSidebarModal &&
        e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' &&
        e.target.tagName !== 'BUTTON' && employees.length > employeesPerPage) {
        if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [showModal, showAdminModal, showSidebarModal, employees.length, employeesPerPage]);

  const checkEmployeeSelected = () => {
    if (!selectedEmployee) {
      toast.warning('⚠️ Please select your name first before performing any action!', {
        position: 'top-center', autoClose: 3000,
        hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true,
      });
      return false;
    }
    return true;
  };

  const handleEmployeeClick = (employeeName, employeeTheme = 'blue') => {
    setSelectedEmployee(employeeName);
    setSelectedEmployeeTheme(employeeTheme);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleButtonClick = (act) => {
    if (!checkEmployeeSelected()) return;
    setAction(act);
    setShowModal(true);
  };

  const handleLaboratoryButtonClick    = () => { if (!checkEmployeeSelected()) return; setAction('access-laboratory');   setShowModal(true); };
  const handleContactsButtonClick      = () => handleButtonClick('contacts');
  const handleTriageButtonClick        = () => { if (!checkEmployeeSelected()) return; setAction('triage');              setShowModal(true); };
  const handleStoreButtonClick         = () => handleButtonClick('store');
  const handleNurseButtonClick         = () => { if (!checkEmployeeSelected()) return; setAction('access-nurse');        setShowModal(true); };
  const handlePatientAppointmentsButtonClick = () => handleButtonClick('patient-appointments');
  const handleDoctorsRoomButtonClick   = () => { if (!checkEmployeeSelected()) return; setAction('access-doctors-room'); setShowModal(true); };
  const handleRadiographerButtonClick  = () => { if (!checkEmployeeSelected()) return; setAction('access-radiographer'); setShowModal(true); };

  const handleSidebarButtonClick = async (act = null, navPath = null) => {
    if (!checkEmployeeSelected()) return;
    if (act) {
      setSidebarAction(act);
      setShowSidebarModal(true);
      if (selectedEmployeeTheme) setSidebarEmployeeTheme(selectedEmployeeTheme);
    }
    if (navPath) {
      if (navPath.includes('/generate-drug-order')) {
        const params = new URLSearchParams();
        params.append('token', token);
        navigate(`${navPath}?${params.toString()}`);
      } else {
        navigate(navPath);
      }
    }
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const confirmAction = async (securityCode) => {
    try {
      setLoading(true);
      const tk = token || getTokenFromUrlOrSession();

      if (!tk) {
        toast.error('Session token missing. Please log in again.');
        return;
      }

      const codeResponse = await fetch(urls.code, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: selectedEmployee, action, securityCode, token: tk, theme: selectedEmployeeTheme }),
      });

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        if (codeData.result === 'yes') {
          const permitResponse = await fetch(urls.permit, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee: selectedEmployee, action, token: tk, theme: selectedEmployeeTheme }),
          });
          if (permitResponse.ok) {
            const permitData = await permitResponse.json();
            if (permitData.result === 'yes') {
              saveEmployeeSessionActivity();
              const loginToken = permitData.login_token;
              const routeMap = {
                'access-laboratory':   `/access-laboratory/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'access-radiographer': `/access-radiographer/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'access-doctors-room': `/access-doctors-room/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'access-nurse':        `/access-nurse/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'sales':               `/sales/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'credits':             `/credits/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'selldrugs':           `/selldrugs/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'triage':              `/triage/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'store':               `/store/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'contacts':            `/contacts/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`,
                'patient-appointments':`/patient-appointments/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${selectedEmployeeTheme}`
              };
              const route = routeMap[action];
              if (route) navigate(route);
            } else if (permitData.redirectUrl) {
              const confirmed = window.confirm('Sorry, your subscription expired. Please press OK to proceed and make a payment.');
              if (confirmed) window.location.href = permitData.redirectUrl;
            } else {
              toast.warning('Permission not granted. Please contact the administrator.');
            }
          }
        } else {
          toast.error('Invalid security code. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSidebarAction = async (sidebarSecurityCode) => {
    try {
      setSidebarLoading(true);
      const tk = token || getTokenFromUrlOrSession();

      if (!tk) {
        toast.error('Session token missing. Please log in again.');
        return;
      }

      const response = await fetch(urls.code, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: selectedEmployee, action: sidebarAction, securityCode: sidebarSecurityCode, token: tk, theme: sidebarEmployeeTheme }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result === 'yes') {
          const permitResponse = await fetch(urls.permit, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee: selectedEmployee, action: sidebarAction, token: tk, theme: sidebarEmployeeTheme }),
          });
          if (permitResponse.ok) {
            const permitData = await permitResponse.json();
            if (permitData.result === 'yes') {
              saveEmployeeSessionActivity();
              const loginToken = permitData.login_token;
              navigate(`/${sidebarAction}/?token=${loginToken}&employee=${encodeURIComponent(selectedEmployee)}&theme=${sidebarEmployeeTheme}`);
            } else if (permitData.redirectUrl) {
              const confirmed = window.confirm('Sorry, your subscription expired. Please press OK to proceed and make a payment.');
              if (confirmed) window.location.href = permitData.redirectUrl;
            } else {
              toast.warning('Permission not granted. Please contact the administrator.');
            }
          } else {
            throw new Error('Failed to get permit response');
          }
        } else {
          toast.error('Invalid security code. Please try again.');
        }
      } else {
        throw new Error('Failed to check security code');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleAdminConfirm = async (adminPassword) => {
    setLoading(true);
    try {
      if (adminPassword) {
        const tk = token || getTokenFromUrlOrSession();
        if (!tk) {
          toast.error('Session token missing. Please log in again.');
          return;
        }

        const response = await fetch(urls.permitadmin, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee: 'admin', adminPassword, token: tk }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result === 'yes') {
            navigate(`/admin-dashboard?token=${data.login_token}`);
          } else if (data.redirectUrl) {
            const confirmed = window.confirm('Sorry, your subscription expired. Please press OK to proceed and make a payment.');
            if (confirmed) window.location.href = data.redirectUrl;
          } else if (data.success === false) {
            // Backend returned an error but with 200 status
            const errorMsg = data.message || data.error || 'Invalid admin password. Please try again.';
            toast.error(errorMsg);
          } else {
            toast.warning(data.message || 'Permission not granted. Please contact the administrator.');
          }
        } else {
          try {
            const errorData = await response.json();
            if (errorData.error === 'Invalid admin password') {
              toast.error('Invalid admin password');
            } else {
              toast.error(errorData.message || errorData.error || 'Authentication failed');
            }
          } catch (e) {
            toast.error('Invalid admin password');
          }
        }
      } else {
        toast.error('Admin password cannot be empty. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setShowAdminModal(false);
      setLoading(false);
    }
  };

  const handleSuggestionClick = () => {
    if (!checkEmployeeSelected()) return;
    token && navigate(`/suggestion-box/${token}`);
  };

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees    = safeEmployees.filter(e => e.Name.toLowerCase().includes(searchTerm.toLowerCase()));
  const indexOfLastEmployee  = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees     = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const shouldShowSearchAndPagination = safeEmployees.length > employeesPerPage;

  // Enhanced button styles for pharmacy mode (bigger and more spaced)
  const employeeButtonStyle = (employeeName) => {
    const baseStyle = {
      backgroundColor: selectedEmployee === employeeName ? '#dc2626' : '#315532',
      color: 'white',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      textTransform: 'uppercase',
      borderRadius: '4px',
      boxShadow: selectedEmployee === employeeName ? '0 0 0 3px rgba(220,38,38,0.35)' : '0 2px 5px rgba(0,0,0,0.2)',
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      border: 'none'
    };

    if (isPharmacyMode) {
      // Bigger buttons for pharmacy mode with more spacing
      return {
        ...baseStyle,
        padding: isMobile ? '14px 12px' : '22px 16px',
        fontSize: isMobile ? '14px' : '18px',
        fontWeight: '600',
        margin: isMobile ? '6px' : '12px',
        flex: `1 0 calc(${100 / employeesPerRow}% - 24px)`,
        minWidth: isMobile ? '160px' : '220px',
      };
    }

    // Normal style for clinic mode
    return {
      ...baseStyle,
      padding: isMobile ? '10px 8px' : '15px 10px',
      fontSize: isMobile ? '12px' : '14px',
      margin: isMobile ? '4px' : '5px',
      flex: `1 0 calc(${100 / employeesPerRow}% - 10px)`,
      minWidth: isMobile ? '140px' : '180px',
    };
  };

  const sidebarBtnStyle = {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: 'none',
    padding: isMobile ? '8px' : '10px',
    marginBottom: '5px',
    cursor: 'pointer',
    fontSize: isMobile ? '0.8em' : '1em',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    textAlign: 'left',
    paddingLeft: '10px',
    width: '100%',
    borderRadius: '6px',
  };

  // Enhanced action button styles for pharmacy mode
  const getActionBtnStyle = (act, isSmall = false) => {
    const baseStyle = {
      backgroundColor: action === act ? '#f50202' : '#007bff',
      color: '#ecf0f1',
      border: 'none',
      cursor: !selectedEmployee ? 'not-allowed' : 'pointer',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      transition: 'background-color 0.3s ease, transform 0.3s ease',
      opacity: !selectedEmployee ? 0.6 : 1
    };

    if (isPharmacyMode) {
      if (isSmall) {
        return {
          ...baseStyle,
          padding: isMobile ? '12px 16px' : '18px 28px',
          margin: isMobile ? '8px' : '12px',
          fontSize: isMobile ? '0.9em' : '1.1em',
          fontWeight: '500',
        };
      }
      return {
        ...baseStyle,
        padding: isMobile ? '12px 20px' : '18px 32px',
        margin: isMobile ? '8px' : '15px',
        fontSize: isMobile ? '1em' : '1.2em',
        fontWeight: '600',
      };
    }

    // Normal style for clinic mode
    if (isSmall) {
      return {
        ...baseStyle,
        padding: isMobile ? '10px 12px' : '15px 25px',
        margin: isMobile ? '4px' : '5px',
        fontSize: isMobile ? '0.75em' : '1em',
      };
    }
    return {
      ...baseStyle,
      padding: isMobile ? '10px 15px' : '15px 25px',
      margin: isMobile ? '5px' : '10px',
      fontSize: isMobile ? '0.8em' : '1em',
    };
  };

  const actionBtnStyle = (act) => getActionBtnStyle(act, false);
  const actionBtnSmStyle = (act) => getActionBtnStyle(act, true);

  // Define sidebar items based on mode
  const getSidebarItems = () => {
    if (isPharmacyMode) {
      return [
        { icon: faPills, label: 'Set Drugs', action: 'manageDrugs' },
        { icon: faShoppingCart, label: 'Re-Stock Drugs', action: 'makeOrderForDrugs' },
        { icon: faBoxes, label: 'Stock Tracking', action: 'stocktracking' },
        { icon: faReceipt, label: 'Set Categories', action: 'set-sales-expenses-categories' },
      ];
    }
    return [
      { icon: faPills, label: 'Set Drugs', action: 'manageDrugs' },
      { icon: faShoppingCart, label: 'Re-Stock Drugs', action: 'makeOrderForDrugs' },
      { icon: faClipboardList, label: 'Set Lab and Radiology Exams', action: 'manageLaboratory' },
      { icon: faCogs, label: 'Set Services and Procedures', action: 'manageServices' },
      { icon: faReceipt, label: 'Set Categories', action: 'set-sales-expenses-categories' },
      { icon: faUserMd, label: 'Set Family Planning', action: 'familyPlanning' },
      { icon: faBoxes, label: 'Stock Tracking', action: 'stocktracking' },
    ];
  };

  const getTopActionButtons = () => {
    if (isPharmacyMode) {
      return [
        { act: 'sales', icon: faDollarSign, label: 'Cashier', handler: () => handleButtonClick('sales') },
        { act: 'credits', icon: faClipboardList, label: 'Go to Credits', handler: () => handleButtonClick('credits') },
        { act: 'selldrugs', icon: faPills, label: 'Sell Drugs', handler: () => handleButtonClick('selldrugs') },
      ];
    }
    return [
      { act: 'sales', icon: faDollarSign, label: 'Cashier', handler: () => handleButtonClick('sales') },
      { act: 'credits', icon: faClipboardList, label: 'Billing', handler: () => handleButtonClick('credits') },
      { act: 'selldrugs', icon: faPills, label: 'Dispensary & Shelves', handler: () => handleButtonClick('selldrugs') },
      { act: 'triage', icon: faNotesMedical, label: 'Triage', handler: handleTriageButtonClick },
      { act: 'access-radiographer', icon: faRadiation, label: 'Radiographer', handler: handleRadiographerButtonClick },
    ];
  };

  const getBottomActionButtons = () => {
    if (isPharmacyMode) {
      return [
        { act: 'store', icon: faShoppingCart, label: 'Go to Store', handler: handleStoreButtonClick },
        { act: 'contacts', icon: faAddressBook, label: 'Customer Details', handler: handleContactsButtonClick },
      ];
    }
    return [
      { act: 'store', icon: faShoppingCart, label: 'Store', handler: handleStoreButtonClick },
      { act: 'contacts', icon: faAddressBook, label: 'Patient Details', handler: handleContactsButtonClick },
      { act: 'access-doctors-room', icon: faUserMd, label: 'Doctor', handler: handleDoctorsRoomButtonClick },
      { act: 'access-laboratory', icon: faFlask, label: 'Lab', handler: handleLaboratoryButtonClick },
      { act: 'access-nurse', icon: faUserNurse, label: 'Nurse', handler: handleNurseButtonClick },
    ];
  };

  const getDiseaseStatsItems = () => {
    if (isPharmacyMode) return null;
    return (
      <>
        <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />
        <h3 style={{ fontSize: isMobile ? '0.9em' : '1.2em', margin: '0 0 10px', paddingLeft: '10px', color: '#ffffff' }}>
          Disease Statistics
        </h3>
        <button style={sidebarBtnStyle} onClick={() => handleSidebarButtonClick('malariaBarGraph')}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}>
          <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} className="radiating-icon" />
          <span>Disease Bar Graphs</span>
        </button>
      </>
    );
  };

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: isMobile ? '1.1em' : '1.5em', margin: 0, color: '#ffffff' }}>
          {isPharmacyMode ? 'PHARMACY MODE' : 'MEDCORE UG'}
        </h2>
        {isMobile && (
          <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      <SidebarSubscriptionPanel subscriptionData={subscriptionData} loading={subscriptionLoading} />

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />

      <button className="sb-btn" style={sidebarBtnStyle} onClick={() => handleSidebarButtonClick('makePayment')}>
        <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} />
        <span>Make a Payment</span>
      </button>

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />

      <button style={sidebarBtnStyle} onClick={() => setShowAdminModal(true)}>
        <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} />
        <span>Settings (admin only)</span>
      </button>

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />

      {getSidebarItems().map(item => (
        <button key={item.action} style={sidebarBtnStyle} onClick={() => handleSidebarButtonClick(item.action)}>
          <FontAwesomeIcon icon={item.icon} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} />
          <span>{item.label}</span>
        </button>
      ))}

      {getDiseaseStatsItems()}

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />

      <h3 style={{ fontSize: isMobile ? '0.9em' : '1.2em', margin: '0 0 10px', paddingLeft: '10px', color: '#ffffff' }}>
        See Employee Participation
      </h3>
      <button style={{ ...sidebarBtnStyle, fontSize: isMobile ? '1em' : '1.2em', padding: isMobile ? '12px 8px' : '15px 10px' }}
        onClick={() => handleSidebarButtonClick('employeePerformance')}>
        <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} />
        <span style={{ fontSize: isMobile ? '0.75em' : '0.83em' }}>See Each Employee Performance</span>
      </button>

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />

      <h3 style={{ fontSize: isMobile ? '0.9em' : '1.2em', margin: '0 0 10px', paddingLeft: '10px', color: '#ffffff' }}>
        {isPharmacyMode ? 'Pharmacy Statistics and History' : 'Sales Statistics and History'}
      </h3>
      <button style={sidebarBtnStyle} onClick={() => handleSidebarButtonClick('clinicStatistics')}>
        {isPharmacyMode ? 'Pharmacy Statistics' : 'Clinic Statistics'}
      </button>
      <button style={sidebarBtnStyle} onClick={() => handleSidebarButtonClick('access-sales-details')}>
        Financial History / Report
      </button>

      <div style={{ padding: '14px 12px', margin: '16px 10px 0', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <h3 style={{ fontSize: isMobile ? '0.9em' : '1.05em', margin: '0 0 10px', color: '#ffffff' }}>
          Display Theme
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
          {['blue', 'system', 'dark'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setSelectedEmployeeTheme(t); setSidebarEmployeeTheme(t); }}
              style={{
                padding: '10px 8px', borderRadius: '10px', border: '1px solid',
                borderColor: selectedEmployeeTheme === t ? '#ffffff' : 'rgba(255,255,255,0.18)',
                backgroundColor: selectedEmployeeTheme === t
                  ? (t === 'blue' ? '#0a3fc7' : t === 'system' ? '#495057' : '#1f2937')
                  : 'transparent',
                color: selectedEmployeeTheme === t ? '#ffffff' : '#f8fafc',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%'
              }}
            >
              {t === 'system' ? 'System Default' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button style={{ ...sidebarBtnStyle, marginTop: '12px', backgroundColor: '#dc2626', color: '#ffffff' }} onClick={() => handleLogout(navigate)}>
        <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '10px', fontSize: '1.2em', flexShrink: 0 }} />
        <span>Log Out</span>
      </button>

      <hr style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', margin: '16px 0' }} />
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ecf0f1', fontFamily: 'Arial, sans-serif' }}>
      <ToastContainer />

      {/* Mobile Hamburger Button */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 200,
            backgroundColor: '#001969',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      )}

      {/* Sidebar */}
      <div style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        backgroundColor: '#001969',
        color: '#ffffff',
        padding: isMobile ? '15px 10px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        fontFamily: 'Roboto, sans-serif',
        zIndex: 150,
        flexShrink: 0,
        transition: 'transform 0.3s ease-in-out',
        transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobile && isMobileMenuOpen ? '2px 0 10px rgba(0,0,0,0.3)' : 'none'
      }}>
        {sidebarContent}
      </div>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 140,
          }}
        />
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'black',
        minHeight: '100vh',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth})`,
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        {/* Employee of the Month */}
        <div style={{ padding: isMobile ? '60px 15px 0 15px' : '20px 20px 0 20px', backgroundColor: 'black' }}>
          {token && <EmployeeOfTheMonth token={token} />}
        </div>

        {/* Content area */}
        <div style={{
          flex: 1, padding: isMobile ? '15px' : '20px', display: 'flex', flexDirection: 'column',
          backgroundColor: 'black', alignItems: 'center', justifyContent: 'flex-start',
          boxSizing: 'border-box'
        }}>
          <div style={{
            padding: isMobile ? '15px' : '20px',
            backgroundColor: '#e9e8f0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '100%',
            minHeight: isMobile ? 'auto' : '70vh',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            borderTop: '1px solid rgb(9,243,114)',
            borderBottom: '1px solid rgb(9,243,114)',
            borderLeft: '1px solid rgb(9,243,114)',
            borderRight: 'none',
            boxSizing: 'border-box',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'354\' height=\'354\' viewBox=\'0 0 200 200\'%3E%3Cdefs%3E%3ClinearGradient id=\'a\' gradientUnits=\'userSpaceOnUse\' x1=\'100\' y1=\'33\' x2=\'100\' y2=\'-3\'%3E%3Cstop offset=\'0\' stop-color=\'%23000\' stop-opacity=\'0\'/%3E%3Cstop offset=\'1\' stop-color=\'%23000\' stop-opacity=\'1\'/%3E%3C/linearGradient%3E%3ClinearGradient id=\'b\' gradientUnits=\'userSpaceOnUse\' x1=\'100\' y1=\'135\' x2=\'100\' y2=\'97\'%3E%3Cstop offset=\'0\' stop-color=\'%23000\' stop-opacity=\'0\'/%3E%3Cstop offset=\'1\' stop-color=\'%23000\' stop-opacity=\'1\'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg fill=\'%23b3b1ca\' fill-opacity=\'0.22\'%3E%3Crect x=\'100\' width=\'100\' height=\'100\'/%3E%3Crect y=\'100\' width=\'100\' height=\'100\'/%3E%3C/g%3E%3Cg fill-opacity=\'0.22\'%3E%3Cpolygon fill=\'url(%23a)\' points=\'100 30 0 0 200 0\'/%3E%3Cpolygon fill=\'url(%23b)\' points=\'100 100 0 130 0 100 200 100 200 130\'/%3E%3C/g%3E%3C/svg%3E")',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            borderRadius: isMobile ? '8px' : '0'
          }}>
            <h1 style={{ color: 'black', margin: '10px 0', fontSize: isMobile ? '1.8rem' : '4.5rem', textAlign: 'center' }}>
              {clinicName}
            </h1>
            <h2 style={{ fontSize: isMobile ? '0.9em' : '1.2em', color: '#95a5a6', margin: '10px 0', textAlign: 'center' }}>
              {currentTime.toLocaleString('en-US', { timeZone: 'Africa/Kampala' })}
            </h2>

            {!selectedEmployee && (
              <div style={{
                backgroundColor: '#fff3cd', border: '1px solid #ffeeba',
                borderRadius: '5px', padding: '10px 15px', margin: '10px 0',
                color: '#856404', fontSize: isMobile ? '12px' : '16px', fontWeight: 'bold', textAlign: 'center'
              }}>
                ⚠️ Please select your name from the buttons below before performing any action on this platform
              </div>
            )}

            {/* Top action buttons */}
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isPharmacyMode ? (isMobile ? '8px' : '15px') : '0px' }}>
              {getTopActionButtons().map(btn => (
                <button key={btn.act} style={actionBtnStyle(btn.act)} onClick={btn.handler} disabled={!selectedEmployee}
                  onMouseEnter={e => { if (selectedEmployee) e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  <FontAwesomeIcon icon={btn.icon} style={{ marginRight: '8px', fontSize: '1.2em' }} className="radiating-icon" />
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Search */}
            {shouldShowSearchAndPagination && (
              <div style={{ marginTop: '10px', marginBottom: '10px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{
                    padding: isMobile ? '8px' : '10px',
                    width: isMobile ? '90%' : '300px',
                    maxWidth: '80%',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    fontSize: isMobile ? '14px' : '16px'
                  }}
                />
              </div>
            )}

            {/* Employee list */}
            <div ref={employeesContainerRef} style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
              gap: isPharmacyMode ? (isMobile ? '10px' : '20px') : (isMobile ? '6px' : '10px'),
              margin: isPharmacyMode ? '30px auto' : '20px auto',
              maxWidth: isPharmacyMode ? '1400px' : '1200px',
              padding: isMobile ? '0 10px' : '0 20px',
              width: '100%',
              maxHeight: isMobile ? '350px' : (isPharmacyMode ? '500px' : '400px'),
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1'
            }}>
              {currentEmployees.map(employee => (
                <button
                  key={employee.EmployeeID}
                  onClick={() => handleEmployeeClick(employee.Name, employee.colour || 'blue')}
                  style={employeeButtonStyle(employee.Name)}
                >
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} className="radiating-icon" />
                  {employee.Name}
                </button>
              ))}
            </div>

            {/* Pagination */}
            {shouldShowSearchAndPagination && filteredEmployees.length > employeesPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px', flexWrap: 'wrap' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage === 1 ? '#f8f9fa' : '#007bff',
                  color: currentPage === 1 ? '#6c757d' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '4px',
                  fontSize: isMobile ? '12px' : '14px'
                }}>Previous</button>
                {[...Array(Math.ceil(filteredEmployees.length / employeesPerPage)).keys()].map(n => {
                  const pageNum = n + 1;
                  if (Math.ceil(filteredEmployees.length / employeesPerPage) > 7 && (pageNum < currentPage - 2 || pageNum > currentPage + 2) && pageNum !== 1 && pageNum !== Math.ceil(filteredEmployees.length / employeesPerPage)) {
                    if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                      return <span key={n} style={{ padding: '8px 12px' }}>...</span>;
                    }
                    return null;
                  }
                  return (
                    <button key={n} onClick={() => setCurrentPage(pageNum)} style={{
                      padding: isMobile ? '6px 10px' : '8px 12px',
                      border: '1px solid #ddd',
                      backgroundColor: currentPage === pageNum ? '#007bff' : 'white',
                      color: currentPage === pageNum ? 'white' : '#007bff',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: isMobile ? '12px' : '14px'
                    }}>{pageNum}</button>
                  );
                })}
                <button
                  disabled={currentPage === Math.ceil(filteredEmployees.length / employeesPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{
                    padding: isMobile ? '6px 10px' : '8px 12px',
                    border: '1px solid #ddd',
                    backgroundColor: currentPage === Math.ceil(filteredEmployees.length / employeesPerPage) ? '#f8f9fa' : '#007bff',
                    color: currentPage === Math.ceil(filteredEmployees.length / employeesPerPage) ? '#6c757d' : 'white',
                    cursor: currentPage === Math.ceil(filteredEmployees.length / employeesPerPage) ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>Next</button>
              </div>
            )}
          </div>

          {/* Bottom action buttons */}
          <div style={{ marginTop: isPharmacyMode ? '15px' : '5px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isPharmacyMode ? (isMobile ? '8px' : '15px') : '0px' }}>
            {getBottomActionButtons().map(btn => (
              <button key={btn.act} style={actionBtnSmStyle(btn.act)} onClick={btn.handler} disabled={!selectedEmployee}
                onMouseEnter={e => { if (selectedEmployee) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                <FontAwesomeIcon icon={btn.icon} style={{ marginRight: '8px', fontSize: '1.2em' }} className="radiating-icon" />
                {btn.label}
              </button>
            ))}

            {/* Appointments - only show in clinic mode */}
            {!isPharmacyMode && (
              <button style={actionBtnSmStyle('patient-appointments')}
                onClick={handlePatientAppointmentsButtonClick} disabled={!selectedEmployee}
                onMouseEnter={e => { if (selectedEmployee) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                <FontAwesomeIcon icon={faCalendar} style={{ marginRight: '8px', fontSize: '1.2em' }} className="radiating-icon" />
                Pt Appointments
                {appointmentCount > 0 && (
                  <span style={{
                    backgroundColor: '#ec240e', color: '#ecf0f1',
                    borderRadius: '50%', padding: '3px 8px', marginLeft: '8px',
                    fontSize: isMobile ? '10px' : '12px'
                  }}>
                    {appointmentCount}
                  </span>
                )}
              </button>
            )}

            {/* Suggestion box FAB */}
            {token && (
              <div onClick={handleSuggestionClick} style={{
                position: 'fixed',
                bottom: isMobile ? '20px' : '60px',
                right: isMobile ? '20px' : '20px',
                cursor: 'pointer',
                backgroundColor: '#FF6347',
                borderRadius: '50%',
                padding: isMobile ? '10px' : '12px',
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s, opacity 0.5s',
                zIndex: 100
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                <FontAwesomeIcon icon={faCommentDots} style={{ fontSize: isMobile ? '1.5em' : '2em' }} className="radiating-icon" />
              </div>
            )}
          </div>

          <footer style={{ marginTop: '20px', textAlign: 'center', color: '#6c757d', fontSize: isMobile ? '10px' : '14px', padding: '0 10px' }}>
            This system was created by MEDCORE Systems. For support or help contact +2567526488447
          </footer>
        </div>

        {/* Modals */}
        {showWelcomeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
          </div>
        )}

        {showAdminModal && (
          <AdminModal
            onClose={() => setShowAdminModal(false)}
            onConfirm={handleAdminConfirm}
            loading={loading}
          />
        )}

        {showModal && (
          <SecurityModal
            onClose={() => { setShowModal(false); setAction(null); }}
            onConfirm={(code) => { confirmAction(code); }}
            loading={loading}
            employeeName={selectedEmployee}
            showThemeToggle={true}
            currentTheme={selectedEmployeeTheme}
            onThemeChange={setSelectedEmployeeTheme}
          />
        )}

        {showSidebarModal && (
          <SecurityModal
            onClose={() => { setShowSidebarModal(false); setSidebarAction(''); }}
            onConfirm={(code) => { confirmSidebarAction(code); }}
            loading={sidebarLoading}
            employeeName={selectedEmployee}
            showThemeToggle={true}
            currentTheme={sidebarEmployeeTheme}
            onThemeChange={setSidebarEmployeeTheme}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
