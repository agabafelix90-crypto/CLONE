import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faExclamationCircle, faFileAlt, faWallet, faFlask, faXRay, faClock, faCheckCircle, faUserPlus, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession, saveSessionToken } from './authUtils';
import { useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import doctorsSvg from './images/doctors.svg';
import Topbar from './Topbar';
import MissingDrugs from './MissingDrugs';
import Resultmodal2 from './Resultmodal2';
import RadiologyResultsModal3 from './RadiologyResultsModal3';
import './DoctorsDashboard.css';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  // Blue theme
  blue: {
    sidebarBg: '#0a1e4a',
    sidebarBorder: '#1e3a8a',
    activeNavBg: '#2563eb',
    activeNavText: '#ffffff',
    inactiveNavText: '#e0e7ff',
    navHoverBg: '#1e3a8a',
    sectionHeaderText: '#94a3b8',
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    skyBlueLight: '#e0f2fe',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
    badgeGray: { bg: '#f1f5f9', text: '#475569' },
    filterSection: '#0d2257',
    collapseButtonBg: '#1e3a8a',
    collapseButtonHover: '#2563eb',
    collapseButtonText: '#ffffff',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    iconBright: '#fbbf24',
    iconHover: '#f59e0b',
    sidebarText: '#ffffff',
    sidebarTextMuted: '#a5b4fc',
  },
  // White/Light theme
  white: {
    sidebarBg: '#ffffff',
    sidebarBorder: '#e2e8f0',
    activeNavBg: '#f1f5f9',
    activeNavText: '#0f172a',
    inactiveNavText: '#475569',
    navHoverBg: '#f8fafc',
    sectionHeaderText: '#64748b',
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    skyBlueLight: '#e0f2fe',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
    badgeGray: { bg: '#f1f5f9', text: '#475569' },
    filterSection: '#f8fafc',
    collapseButtonBg: '#e2e8f0',
    collapseButtonHover: '#cbd5e1',
    collapseButtonText: '#0f172a',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    iconBright: '#f59e0b',
    iconHover: '#d97706',
    sidebarText: '#0f172a',
    sidebarTextMuted: '#64748b',
  }
};

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Parse date string from various formats and return Date object
 * Handles formats like "2025-02-24 10:30:00" or "2025-02-24T10:30:00"
 */
const parsePatientDate = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  try {
    // Replace space with T for consistent ISO parsing if needed
    const normalizedDate = dateTimeString.replace(' ', 'T');
    const date = new Date(normalizedDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateTimeString);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', dateTimeString, error);
    return null;
  }
};

/**
 * Check if a patient's date is within the last 2 days
 * Returns true if patient should be shown (within 2 days)
 */
const isWithinLastTwoDays = (dateTimeString) => {
  const patientDate = parsePatientDate(dateTimeString);
  if (!patientDate) return false; // If date is invalid, don't show
  
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0); // Start of day 2 days ago
  
  // Set patient date to start of its day for fair comparison
  const patientDayStart = new Date(patientDate);
  patientDayStart.setHours(0, 0, 0, 0);
  
  return patientDayStart >= twoDaysAgo;
};

/**
 * Sort patients by date (newest first)
 */
const sortPatientsByDateNewestFirst = (patients) => {
  return [...patients].sort((a, b) => {
    const dateA = parsePatientDate(a.date_time);
    const dateB = parsePatientDate(b.date_time);
    
    // Handle invalid dates (put them at the end)
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Newest first (descending order)
    return dateB - dateA;
  });
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const styles = (theme) => ({
  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  },
  navItem: (active, collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? '0' : '12px',
    padding: collapsed ? '12px 0' : '10px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: active ? '600' : '500',
    color: active ? theme.activeNavText : theme.inactiveNavText,
    background: active ? theme.activeNavBg : 'transparent',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    border: 'none',
    width: '100%',
    textAlign: collapsed ? 'center' : 'left',
    marginBottom: '2px',
    position: 'relative',
  }),
  sectionHeader: (collapsed) => ({
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: theme.sectionHeaderText,
    padding: collapsed ? '0' : '0 14px',
    marginBottom: '8px',
    marginTop: '12px',
    textAlign: collapsed ? 'center' : 'left',
  }),
  tooltip: {
    position: 'absolute',
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: '12px',
    padding: '8px 12px',
    background: theme.tooltipBg,
    color: theme.tooltipText,
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    pointerEvents: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    border: `1px solid ${theme.sidebarBorder}`,
  },
  collapseButton: {
    background: theme.collapseButtonBg,
    border: 'none',
    color: theme.collapseButtonText,
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '10px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    minWidth: '40px',
    height: '40px',
  },
  badge: (type) => {
    const map = {
      green: colors.blue.badgeGreen,
      red: colors.blue.badgeRed,
      orange: colors.blue.badgeOrange,
      blue: colors.blue.badgeBlue,
      sky: colors.blue.badgeSky,
      gray: colors.blue.badgeGray,
    };
    const c = map[type] || map.gray;
    return {
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
      background: c.bg, color: c.text,
    };
  },
  statCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
  },
  panel: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.tableBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: theme.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  patientCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '10px',
    transition: 'all 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(3px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
});

// ─── Global Styles Component ─────────────────────────────────────────────────
const GlobalStyles = ({ theme }) => {
  // Determine scrollbar colors based on theme
  const scrollbarTrack = theme === colors.blue ? '#1e293b' : '#f1f5f9';
  const scrollbarThumb = theme === colors.blue ? '#475569' : '#cbd5e1';
  const scrollbarThumbHover = theme === colors.blue ? '#64748b' : '#94a3b8';
  
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: ${scrollbarTrack}; }
      ::-webkit-scrollbar-thumb { background: ${scrollbarThumb}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${scrollbarThumbHover}; }
      
      .nav-item:hover { 
        background: ${theme.navHoverBg} !important; 
        color: ${theme === colors.blue ? '#ffffff' : theme.activeNavText} !important; 
      }
      
      .nav-icon { 
        color: ${theme.iconBright}; 
        font-size: 18px; 
        transition: all 0.2s ease; 
      }
      
      .nav-item:hover .nav-icon { 
        color: ${theme.iconHover}; 
        transform: scale(1.1); 
      }
      
      .active-tab { 
        background: ${theme.activeNavBg} !important; 
        border-radius: 8px !important;
        color: ${theme.activeNavText} !important;
      }
      
      .active-tab .nav-icon { 
        color: ${theme.activeNavText} !important; 
      }
      
      .collapse-btn:hover { 
        background: ${theme.collapseButtonHover} !important; 
        transform: scale(1.05); 
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
      
      .patient-card {
        animation: fadeScale 0.4s ease-out;
      }
      
      .patient-card-exit {
        animation: slideOut 0.3s ease-out forwards;
        pointer-events: none;
        opacity: 0.7;
      }
      
      .patient-card-enter {
        animation: slideIn 0.4s ease-out;
      }
      
      .patient-card:hover {
        border-color: ${theme.info} !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.1);
      }
      
      .stat-card:hover {
        border-color: ${theme.cardBorder} !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      
      .fade-in { 
        animation: fadeScale 0.4s ease; 
      }
      
      @keyframes fadeScale { 
        0% { opacity: 0; transform: scale(0.95); } 
        100% { opacity: 1; transform: scale(1); } 
      }
      
      @keyframes slideIn {
        0% { 
          opacity: 0; 
          transform: translateX(-30px) scale(0.9);
        }
        70% {
          transform: translateX(5px) scale(1.02);
        }
        100% { 
          opacity: 1; 
          transform: translateX(0) scale(1);
        }
      }
      
      @keyframes slideOut {
        0% { 
          opacity: 1; 
          transform: translateX(0) scale(1);
        }
        30% {
          transform: translateX(-10px) scale(0.98);
        }
        100% { 
          opacity: 0; 
          transform: translateX(50px) scale(0.9);
        }
      }
      
      @keyframes walkIn {
        0% {
          opacity: 0;
          transform: translateX(-50px) translateY(10px);
        }
        50% {
          opacity: 0.8;
          transform: translateX(5px) translateY(0);
        }
        100% {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }
      }
      
      @keyframes walkOut {
        0% {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }
        50% {
          opacity: 0.8;
          transform: translateX(20px) translateY(-5px);
        }
        100% {
          opacity: 0;
          transform: translateX(80px) translateY(-15px);
        }
      }
      
      .walk-in {
        animation: walkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .walk-out {
        animation: walkOut 0.5s ease-in forwards;
      }
      
      @keyframes spin { 
        to { transform: rotate(360deg); } 
      }
      
      .spinning span { 
        animation: spin 0.8s linear; 
      }
      
      .blinking {
        animation: blink 1s infinite;
      }
      
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .critical-badge {
        background: ${theme.dangerLight};
        color: ${theme.danger};
        border: 1px solid ${theme.danger};
      }
      
      .warning-badge {
        background: ${theme.warningLight};
        color: ${theme.warning};
        border: 1px solid ${theme.warning};
      }
      
      .normal-badge {
        background: ${theme.accentLight};
        color: ${theme.accent};
        border: 1px solid ${theme.accent};
      }
      
      .expired-badge {
        background: #f1f5f9;
        color: #64748b;
        border: 1px dashed #94a3b8;
        font-style: italic;
      }
      
      /* Bright person icon animation */
      .bright-person-icon {
        color: ${theme.iconBright};
        filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.5));
        }
        50% {
          filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.8));
        }
        100% {
          filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.5));
        }
      }
      
      /* Click here button styles */
      .click-here-btn {
        background: linear-gradient(135deg, ${theme.info}, ${theme === colors.blue ? '#0a1e4a' : '#0f172a'});
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        width: 100%;
        text-align: center;
        letter-spacing: 0.5px;
        position: relative;
        overflow: hidden;
      }
      
      .click-here-btn:hover {
        background: linear-gradient(135deg, #1d4ed8, ${theme.info});
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
      }
      
      .click-here-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      }
      
      .click-here-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(255, 255, 255, 0.5);
        opacity: 0;
        border-radius: 100%;
        transform: scale(1, 1) translate(-50%);
        transform-origin: 50% 50%;
      }
      
      .click-here-btn:focus:not(:active)::after {
        animation: ripple 1s ease-out;
      }
      
      @keyframes ripple {
        0% {
          transform: scale(0, 0);
          opacity: 0.5;
        }
        20% {
          transform: scale(25, 25);
          opacity: 0.3;
        }
        100% {
          opacity: 0;
          transform: scale(40, 40);
        }
      }
      
      .sidebar-text-primary {
        color: ${theme.sidebarText};
      }
      
      .sidebar-text-secondary {
        color: ${theme.sidebarTextMuted};
      }
      
      .sidebar-bg {
        background: ${theme.sidebarBg};
      }
      
      .sidebar-border {
        border-color: ${theme.sidebarBorder};
      }
      
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr !important;
        }
        .patients-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
  );
};

// ─── Clock Component ────────────────────────────────────────────────────────
function LiveClock({ theme }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontSize: '13px', color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' })}
      {' · '}
      {time.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─── Loading Spinner ────────────────────────────────────────────────────────
function LoadingSpinner({ theme }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px', 
      gap: '16px' 
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: `3px solid ${theme.tableBorder}`, 
        borderTopColor: theme.info, 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading doctor's dashboard...</div>
    </div>
  );
}

// ─── Notification Component ─────────────────────────────────────────────────
const Notification = ({ message, type, onDismiss, theme }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(), 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '8px',
      padding: '14px 18px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderLeft: `4px solid ${type === 'success' ? theme.accent : theme.danger}`,
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ fontSize: '18px' }}>
        {type === 'success' ? '✓' : '⚠'}
      </span>
      <span style={{ fontSize: '13px', color: theme.textPrimary }}>{message}</span>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
function DoctorsDashboard() {
  const [triagePatients, setTriagePatients] = useState([]);
  const [filteredTriagePatients, setFilteredTriagePatients] = useState([]);
  const [waitingPaymentPatients, setWaitingPaymentPatients] = useState([]);
  const [inProcessPatients, setInProcessPatients] = useState([]);
  const [completedResultsPatients, setCompletedResultsPatients] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [activeSection, setActiveSection] = useState('triage');
  const [isRadiologyResultsModalOpen, setIsRadiologyResultsModalOpen] = useState(false);
  const [isLabResultsModalOpen, setIsLabResultsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicDetails, setClinicDetails] = useState(null);
  const [expiredPatientsCount, setExpiredPatientsCount] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('blue'); // default theme
  
  // Animation state tracking
  const [exitingPatients, setExitingPatients] = useState({});
  const [enteringPatients, setEnteringPatients] = useState({});
  const previousPatientsRef = useRef({
    triage: [],
    cashier: [],
    inprocess: [],
    results: []
  });

  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const animationTimeoutsRef = useRef([]);

  const navigate = useNavigate();
  const urlToken = getTokenFromUrlOrSession();
  const urlTheme = parseThemeFromSearch(window.location.search);

  // Store token from URL (when present) and get the active theme colors
  useEffect(() => {
    if (urlToken) {
      saveSessionToken(urlToken);
    }
  }, [urlToken]);

  const theme = colors[currentTheme];

  // Cleanup animations
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // ── Theme check from security response ────────────────────────────────────
  useEffect(() => {
    if (!urlToken) { 
      navigate('/login'); 
      return; 
    }
    
    const checkSecurity = async () => {
      try {
        const res = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken }),
        });
        
        if (!res.ok) throw new Error('Security check failed');
        
        const data = await res.json();
        if (data.message === 'Session valid') {
          const themeColor = data.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          setEmployeeName(data.employee_name || '');
          saveSessionToken(data.clinic_session_token);
        } else if (data.error === 'Session expired') {
          navigate(`/dashboard?token=${data.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    };
    
    checkSecurity();
  }, [navigate, urlToken]);

  // ── Notification helpers ─────────────────────────────────────────────────
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ── Filter and sort triage patients ─────────────────────────────────────
  const processTriagePatients = useCallback((patients) => {
    if (!patients || patients.length === 0) {
      setFilteredTriagePatients([]);
      setExpiredPatientsCount(0);
      return [];
    }
    
    // Filter out patients older than 2 days
    const validPatients = patients.filter(patient => {
      const isValid = isWithinLastTwoDays(patient.date_time);
      return isValid;
    });
    
    const expiredCount = patients.length - validPatients.length;
    setExpiredPatientsCount(expiredCount);
    
    // Sort valid patients by date (newest first)
    const sortedPatients = sortPatientsByDateNewestFirst(validPatients);
    
    setFilteredTriagePatients(sortedPatients);
    return sortedPatients;
  }, []);

  // ── Animation helper for patient changes ─────────────────────────────────
  const detectPatientChanges = (newPatients, oldPatients, sectionKey) => {
    // Find patients that left
    const oldIds = new Set(oldPatients.map(p => p.contact_id || p.file_id || JSON.stringify(p)));
    const newIds = new Set(newPatients.map(p => p.contact_id || p.file_id || JSON.stringify(p)));
    
    const leftPatients = oldPatients.filter(p => {
      const id = p.contact_id || p.file_id || JSON.stringify(p);
      return !newIds.has(id);
    });
    
    const enteredPatients = newPatients.filter(p => {
      const id = p.contact_id || p.file_id || JSON.stringify(p);
      return !oldIds.has(id);
    });

    // Set exiting animation for patients that left
    if (leftPatients.length > 0) {
      const exitState = {};
      leftPatients.forEach(p => {
        const id = p.contact_id || p.file_id || JSON.stringify(p);
        exitState[id] = true;
      });
      
      setExitingPatients(prev => ({ ...prev, ...exitState }));
      
      // Clear exit flags after animation
      const timeout = setTimeout(() => {
        setExitingPatients(prev => {
          const newState = { ...prev };
          leftPatients.forEach(p => {
            const id = p.contact_id || p.file_id || JSON.stringify(p);
            delete newState[id];
          });
          return newState;
        });
      }, 500);
      
      animationTimeoutsRef.current.push(timeout);
    }
    
    // Set entering animation for new patients
    if (enteredPatients.length > 0) {
      const enterState = {};
      enteredPatients.forEach(p => {
        const id = p.contact_id || p.file_id || JSON.stringify(p);
        enterState[id] = true;
      });
      
      setEnteringPatients(prev => ({ ...prev, ...enterState }));
      
      // Clear enter flags after animation
      const timeout = setTimeout(() => {
        setEnteringPatients(prev => {
          const newState = { ...prev };
          enteredPatients.forEach(p => {
            const id = p.contact_id || p.file_id || JSON.stringify(p);
            delete newState[id];
          });
          return newState;
        });
      }, 500);
      
      animationTimeoutsRef.current.push(timeout);
    }
    
    // Show notifications for critical changes in triage
    if (sectionKey === 'triage' && enteredPatients.length > 0) {
      enteredPatients.forEach(patient => {
        if (patient.attention === 'critical') {
          addNotification(`🚨 Critical patient arrived: ${patient.first_name} ${patient.last_name}`, 'warning');
        }
      });
    }
  };

  // ── Fetch functions ────────────────────────────────────────────────────────
  const fetchTriagePatients = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.patientnames, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) {
        // Detect changes from previous state using raw data
        detectPatientChanges(data, previousPatientsRef.current.triage, 'triage');
        
        // Update previous ref
        previousPatientsRef.current.triage = data;
        
        // Set raw data and process filtered data
        setTriagePatients(data);
        processTriagePatients(data);
      }
    } catch {
      if (isMounted.current) {
        addNotification('Error fetching triage patients', 'error');
      }
    }
  }, [urlToken, processTriagePatients]);

  const fetchWaitingPaymentPatients = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.awaitingnames, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) {
        // Detect changes from previous state
        detectPatientChanges(data || [], previousPatientsRef.current.cashier, 'cashier');
        
        // Update previous ref
        previousPatientsRef.current.cashier = data || [];
        
        setWaitingPaymentPatients(data || []);
      }
    } catch {
      if (isMounted.current) {
        addNotification('Error fetching payment patients', 'error');
      }
    }
  }, [urlToken]);

  const fetchInProcessPatients = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.inprocessnames, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) {
        // Detect changes from previous state
        detectPatientChanges(data || [], previousPatientsRef.current.inprocess, 'inprocess');
        
        // Update previous ref
        previousPatientsRef.current.inprocess = data || [];
        
        setInProcessPatients(data || []);
      }
    } catch {
      if (isMounted.current) {
        addNotification('Error fetching in-process patients', 'error');
      }
    }
  }, [urlToken]);

  const fetchCompletedResultsPatients = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.completedlabnames, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) {
        const completedPatients = data.map(patient => ({
          ...patient,
          status_type: patient.status_type || 'Completed',
        }));
        
        // Detect changes from previous state
        detectPatientChanges(completedPatients, previousPatientsRef.current.results, 'results');
        
        // Update previous ref
        previousPatientsRef.current.results = completedPatients;
        
        setCompletedResultsPatients(completedPatients);
      }
    } catch {
      if (isMounted.current) {
        addNotification('Error fetching completed results', 'error');
      }
    }
  }, [urlToken]);

  const refreshAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    await Promise.allSettled([
      fetchTriagePatients(),
      fetchWaitingPaymentPatients(),
      fetchInProcessPatients(),
      fetchCompletedResultsPatients()
    ]);
    if (showSpinner && isMounted.current) setIsRefreshing(false);
  }, [fetchTriagePatients, fetchWaitingPaymentPatients, fetchInProcessPatients, fetchCompletedResultsPatients]);

  // ── Init + polling ────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchTriagePatients(),
        fetchWaitingPaymentPatients(),
        fetchInProcessPatients(),
        fetchCompletedResultsPatients()
      ]);
      if (isMounted.current) {
        setLoading(false);
      }
    };

    init();

    intervalRef.current = setInterval(() => {
      refreshAll(false);
    }, 10000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTriagePatients, fetchWaitingPaymentPatients, fetchInProcessPatients, fetchCompletedResultsPatients, refreshAll]);

  // ── Clinical classification functions ──────────────────────────────────────
  const classifyTemperature = (temperature) => {
    if (!temperature) return '';
    if (temperature < 35) return 'critical';
    if (temperature >= 35 && temperature < 36.5) return 'warning';
    if (temperature >= 36.5 && temperature <= 37.5) return 'normal';
    if (temperature > 37.5 && temperature <= 38.5) return 'warning';
    return 'critical';
  };

  const classifyRespiratoryRate = (rate) => {
    if (!rate) return '';
    if (rate < 12) return 'warning';
    if (rate > 20) return 'warning';
    return 'normal';
  };

  const classifySPO2 = (spo2) => {
    if (!spo2) return '';
    if (spo2 < 90) return 'critical';
    if (spo2 < 95) return 'warning';
    return 'normal';
  };

  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const getBMIWarning = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'warning';
    if (bmi >= 18.5 && bmi <= 24.9) return 'normal';
    if (bmi >= 25 && bmi <= 29.9) return 'warning';
    if (bmi >= 30) return 'critical';
    return '';
  };

  const classifyPulseRate = (pulseRate) => {
    if (!pulseRate) return '';
    if (pulseRate < 60) return 'warning';
    if (pulseRate > 100) return 'warning';
    return 'normal';
  };

  const classifyBloodPressure = (bloodPressure) => {
    if (!bloodPressure || bloodPressure === 'N/A') return '';
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    if (systolic < 90 || diastolic < 60) return 'warning';
    if (systolic > 140 || diastolic > 90) return 'warning';
    return 'normal';
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePatientClick = (patient) => {
    navigate(`/patient-file/${urlToken}/${patient.file_id}`);
  };

  const handlePatientClick2 = (patient) => {
    setSelectedPatient(patient);
    setClinicDetails(patient);

    if (patient.status_type === 'radiology') {
      setIsRadiologyResultsModalOpen(true);
    } else if (patient.status_type === 'lab') {
      setIsLabResultsModalOpen(true);
    }
  };

  // ── Stats calculations ─────────────────────────────────────────────────────
  const getAttentionCount = (attentionType) => 
    filteredTriagePatients.filter(patient => patient.attention === attentionType).length;

  const stats = [
    {
      label: 'Triage Patients',
      value: filteredTriagePatients.length,
      color: theme.info,
      sublabel: `${getAttentionCount('critical')} critical, ${expiredPatientsCount} expired`,
      icon: '🩺',
      section: 'triage'
    },
    {
      label: 'At Cashier',
      value: waitingPaymentPatients.length,
      color: theme.warning,
      sublabel: 'Awaiting payment',
      icon: '💰',
      section: 'cashier'
    },
    {
      label: 'In Lab/Radiology',
      value: inProcessPatients.length,
      color: theme.skyBlue,
      sublabel: 'Processing',
      icon: '🔬',
      section: 'inprocess'
    },
    {
      label: 'Results Ready',
      value: completedResultsPatients.length,
      color: theme.accent,
      sublabel: 'Unseen results',
      icon: '✅',
      section: 'results'
    }
  ];

  // ── Avatar initials ───────────────────────────────────────────────────────
  const initials = (name) => {
    if (!name) return 'D';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  // ── Navigation sections ────────────────────────────────────────────────────
  const navSections = [
    {
      label: 'PATIENT QUEUES',
      items: [
        { 
          id: 'triage', 
          icon: '🩺', 
          label: 'From Triage', 
          action: () => setActiveSection('triage'), 
          badge: filteredTriagePatients.length,
          badgeColor: getAttentionCount('critical') > 0 ? 'danger' : 'info'
        },
        { 
          id: 'cashier', 
          icon: '💰', 
          label: 'At Cashier', 
          action: () => setActiveSection('cashier'), 
          badge: waitingPaymentPatients.length 
        },
        { 
          id: 'inprocess', 
          icon: '🔬', 
          label: 'In Lab/Radiology', 
          action: () => setActiveSection('inprocess'), 
          badge: inProcessPatients.length 
        },
        { 
          id: 'results', 
          icon: '✅', 
          label: 'Results Ready', 
          action: () => setActiveSection('results'), 
          badge: completedResultsPatients.length,
          badgeColor: completedResultsPatients.length > 0 ? 'accent' : 'gray'
        },
      ],
    },
    {
      label: 'ACTIONS',
      items: [
        { 
          id: 'new-patient', 
          icon: '👤', 
          label: 'Attend to New Patient', 
          action: () => navigate(`/attend-to-new-patient?token=${urlToken}`) 
        },
        { 
          id: 'review-files', 
          icon: '📂', 
          label: 'Review Patient Files', 
          action: () => navigate(`/patientfiles?token=${urlToken}`) 
        },
      ],
    },
    {
      label: 'MODULES',
      items: [
        { 
          id: 'maternity', 
          icon: '🤱', 
          label: 'Maternity', 
          action: () => navigate(`/maternity-dashboard/?token=${urlToken}`) 
        },
        { 
          id: 'fp', 
          icon: '🩺', 
          label: 'Nurses', 
          action: () => navigate(`/access-nurse/?token=${urlToken}`) 
        },
      ],
    },
  ];

  // ── Get animation class for patient card ─────────────────────────────────
  const getPatientAnimationClass = (patient) => {
    const id = patient.contact_id || patient.file_id || JSON.stringify(patient);
    
    if (exitingPatients[id]) {
      return 'walk-out';
    }
    
    if (enteringPatients[id]) {
      return 'walk-in';
    }
    
    return 'fade-in';
  };

  // ── Format date for display ──────────────────────────────────────────────
  const formatDate = (dateTimeString) => {
    const date = parsePatientDate(dateTimeString);
    if (!date) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // ── Render patient based on active section ────────────────────────────────
  const renderActiveSection = () => {
    const currentStyles = styles(theme);
    
    switch (activeSection) {
      case 'triage':
        return (
          <div style={currentStyles.panel}>
            <div style={currentStyles.panelHeader}>
              <div style={currentStyles.panelTitle}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.info, flexShrink: 0 }} />
                Patients from Triage (Newest First)
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={currentStyles.badge('red')}>⚠ Critical: {getAttentionCount('critical')}</span>
                <span style={currentStyles.badge('orange')}>⚠ Moderate: {getAttentionCount('average')}</span>
                <span style={currentStyles.badge('green')}>ℹ Mild: {getAttentionCount('routine')}</span>
                {expiredPatientsCount > 0 && (
                  <span style={currentStyles.badge('gray')}>⌛ Expired: {expiredPatientsCount}</span>
                )}
              </div>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {filteredTriagePatients.length === 0 ? (
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: theme.textMuted }}>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>🩺</div>
                  <div style={{ fontSize: '14px' }}>No patients in triage queue</div>
                  {expiredPatientsCount > 0 && (
                    <div style={{ fontSize: '12px', marginTop: '8px', color: theme.textMuted }}>
                      ({expiredPatientsCount} older patients filtered out)
                    </div>
                  )}
                </div>
              ) : (
                filteredTriagePatients.map(patient => {
                  const temperatureClass = classifyTemperature(patient.temperature);
                  const respiratoryClass = classifyRespiratoryRate(patient.respiratory_rate);
                  const spo2Class = classifySPO2(patient.spo2);
                  const bmi = calculateBMI(patient.body_weight, patient.height);
                  const bmiClass = getBMIWarning(bmi);
                  const bpClass = classifyBloodPressure(patient.blood_pressure);
                  const pulseClass = classifyPulseRate(patient.pulse_rate);
                  const animationClass = getPatientAnimationClass(patient);
                  const timeAgo = formatDate(patient.date_time);

                  const getVitalBadge = (level, label, value) => {
                    if (!level) return null;
                    const badgeClass = level === 'critical' ? 'critical-badge' : level === 'warning' ? 'warning-badge' : 'normal-badge';
                    return (
                      <span className={badgeClass} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '12px', marginLeft: '4px' }}>
                        {label}: {value} {level === 'critical' && '⚠️'}
                      </span>
                    );
                  };

                  return (
                    <div
                      key={patient.contact_id}
                      className={`patient-card ${animationClass}`}
                      style={{
                        ...currentStyles.patientCard,
                        cursor: 'pointer',
                        border: patient.attention === 'critical' ? `2px solid ${theme.danger}` : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Bright person icon beside the name */}
                          <span className="bright-person-icon" style={{ fontSize: '20px' }}>👤</span>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: theme.textPrimary }}>
                            {patient.first_name} {patient.last_name}
                          </div>
                        </div>
                        {patient.attention === 'critical' && (
                          <span className="blinking" style={{ fontSize: '20px' }}>🔴</span>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px', fontSize: '12px' }}>
                        <div><span style={{ color: theme.textMuted }}>Age:</span> {patient.age || 'N/A'}</div>
                        <div><span style={{ color: theme.textMuted }}>Sex:</span> {patient.sex || 'N/A'}</div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {getVitalBadge(temperatureClass, 'Temp', `${patient.temperature}°C`)}
                        {getVitalBadge(bpClass, 'BP', patient.blood_pressure)}
                        {getVitalBadge(pulseClass, 'Pulse', patient.pulse_rate)}
                        {getVitalBadge(spo2Class, 'SPO2', `${patient.spo2}%`)}
                        {getVitalBadge(respiratoryClass, 'RR', patient.respiratory_rate)}
                        {bmi && getVitalBadge(bmiClass, 'BMI', bmi)}
                      </div>

                      <div style={{ fontSize: '11px', color: theme.textMuted, borderTop: `1px solid ${theme.tableBorder}`, paddingTop: '10px' }}>
                        <div><span style={{ color: theme.textSecondary }}>Visit:</span> {patient.visit || 'N/A'} · <span style={{ color: theme.textSecondary }}>Sent by:</span> {patient.employee_name || 'N/A'}</div>
                        {patient.message && <div style={{ marginTop: '4px' }}>📝 {patient.message}</div>}
                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>🕒 {patient.date_time}</span>
                          <span style={{ fontWeight: '500', color: theme.info }}>{timeAgo}</span>
                        </div>
                      </div>

                      {/* Click here button at the bottom of each triage patient card */}
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          className="click-here-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(patient);
                          }}
                        >
                          Click here to attend
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'cashier':
        return (
          <div style={styles(theme).panel}>
            <div style={styles(theme).panelHeader}>
              <div style={styles(theme).panelTitle}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.warning, flexShrink: 0 }} />
                Patients at Cashier
              </div>
              <span style={styles(theme).badge('orange')}>{waitingPaymentPatients.length} waiting</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {waitingPaymentPatients.length === 0 ? (
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: theme.textMuted }}>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>💰</div>
                  <div style={{ fontSize: '14px' }}>No patients at cashier</div>
                </div>
              ) : (
                waitingPaymentPatients.map((patient, index) => {
                  const animationClass = getPatientAnimationClass(patient);
                  return (
                    <div key={index} className={`patient-card ${animationClass}`} style={styles(theme).patientCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', color: theme.warning }}>👤</span>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: theme.textPrimary }}>
                          {patient.name}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
                        <div><span style={{ color: theme.textMuted }}>Age:</span> {patient.age}</div>
                        <div><span style={{ color: theme.textMuted }}>Sex:</span> {patient.sex}</div>
                      </div>
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: theme.textMuted }}>Contact:</span> {patient.contact}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={styles(theme).badge('orange')}>⏳ Paying for investigations</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'inprocess':
        return (
          <div style={styles(theme).panel}>
            <div style={styles(theme).panelHeader}>
              <div style={styles(theme).panelTitle}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.skyBlue, flexShrink: 0 }} />
                Patients in Lab/Radiology
              </div>
              <span style={styles(theme).badge('sky')}>{inProcessPatients.length} in process</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {inProcessPatients.length === 0 ? (
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: theme.textMuted }}>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>🔬</div>
                  <div style={{ fontSize: '14px' }}>No patients in lab/radiology</div>
                </div>
              ) : (
                inProcessPatients.map((patient, index) => {
                  const tests = patient.tests_or_exams
                    ? patient.tests_or_exams
                        .replace(/Lab Test:\s*/g, '')
                        .replace(/Radiology Exam:\s*/g, '')
                        .split(',')
                    : [];
                  
                  const isRadiology = patient.status_type?.toLowerCase().includes('radio');
                  const animationClass = getPatientAnimationClass(patient);

                  return (
                    <div key={index} className={`patient-card ${animationClass}`} style={styles(theme).patientCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', color: isRadiology ? theme.info : theme.skyBlue }}>👤</span>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: theme.textPrimary }}>
                          {patient.name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={isRadiology ? styles(theme).badge('blue') : styles(theme).badge('sky')}>
                          {isRadiology ? '🩻 Radiology' : '🔬 Lab'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '10px' }}>
                        <div><span style={{ color: theme.textMuted }}>Age:</span> {patient.age}</div>
                        <div><span style={{ color: theme.textMuted }}>Sex:</span> {patient.sex}</div>
                      </div>

                      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: theme.textMuted }}>Contact:</span> {patient.contact}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, marginBottom: '4px' }}>
                          {isRadiology ? 'Exams:' : 'Tests:'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {tests.map((test, i) => (
                            <span key={i} style={{
                              background: theme.tableHeader,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: theme.textSecondary,
                              border: `1px solid ${theme.cardBorder}`,
                            }}>
                              {test.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'results':
        return (
          <div style={styles(theme).panel}>
            <div style={styles(theme).panelHeader}>
              <div style={styles(theme).panelTitle}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, flexShrink: 0 }} />
                Results Ready for Review
              </div>
              <span style={styles(theme).badge('green')}>{completedResultsPatients.length} ready</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {completedResultsPatients.length === 0 ? (
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: theme.textMuted }}>
                  <div style={{ fontSize: '48px', opacity: 0.3 }}>✅</div>
                  <div style={{ fontSize: '14px' }}>No unseen results</div>
                </div>
              ) : (
                completedResultsPatients.map((patient, index) => {
                  const tests = patient.tests_or_exams ? JSON.parse(patient.tests_or_exams || '[]') : [];
                  const isRadiology = patient.status_type === 'radiology';
                  const animationClass = getPatientAnimationClass(patient);

                  return (
                    <div
                      key={index}
                      className={`patient-card ${animationClass}`}
                      onClick={() => handlePatientClick2(patient)}
                      style={{
                        ...styles(theme).patientCard,
                        cursor: 'pointer',
                        border: `2px solid ${theme.accentLight}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', color: theme.accent }}>👤</span>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: theme.textPrimary }}>
                          {patient.name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={isRadiology ? styles(theme).badge('blue') : styles(theme).badge('sky')}>
                          {isRadiology ? '🩻 Radiology' : '🔬 Lab'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginBottom: '8px' }}>
                        <div><span style={{ color: theme.textMuted }}>Age:</span> {patient.age}</div>
                        <div><span style={{ color: theme.textMuted }}>Sex:</span> {patient.sex}</div>
                      </div>

                      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: theme.textMuted }}>Contact:</span> {patient.contact}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, marginBottom: '4px' }}>
                          Completed Tests:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {tests.map((test, i) => (
                            <span key={i} style={{
                              background: theme.accentLight,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: theme.accent,
                              border: `1px solid ${theme.accent}`,
                            }}>
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <span style={{
                          background: theme.accent,
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-block',
                        }}>
                          Click to view results
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>
          <aside style={{
            width: sidebarCollapsed ? '80px' : '260px',
            background: theme.sidebarBg,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            transition: 'width 0.3s ease',
          }}>
            <div style={{ padding: '28px 24px' }}>
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: theme.sidebarText }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: theme.info, marginRight: '6px' }} />
                ClinicOS
              </h1>
            </div>
          </aside>
          <main style={{ marginLeft: '260px', flex: 1 }}>
            <Topbar token={urlToken} themeColor={currentTheme} />
            <div style={{ padding: '28px' }}>
              <LoadingSpinner theme={theme} />
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles theme={theme} />
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg, position: 'relative' }}>

        {/* Notification Container */}
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '350px',
        }}>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onDismiss={() => removeNotification(notification.id)}
              theme={theme}
            />
          ))}
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '260px',
          background: theme.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: `1px solid ${theme.sidebarBorder}`,
          position: 'fixed',
          paddingTop: '80px',
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: 'auto',
          boxShadow: sidebarCollapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
          zIndex: 900,
          color: theme.sidebarText,
        }}>
          {/* Logo with Collapse Button */}
          <div style={{
            padding: sidebarCollapsed ? '20px 10px' : '20px 16px',
            borderBottom: `2px solid ${theme.sidebarBorder}`,
            display: 'flex',
            flexDirection: sidebarCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            minHeight: sidebarCollapsed ? '120px' : '80px',
          }}>
            {/* Logo section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              order: sidebarCollapsed ? 2 : 1,
              marginTop: sidebarCollapsed ? '12px' : 0,
            }}>
              <div style={{
                width: '45px',
                height: '45px',
                background: theme.info,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
              }}>
                CP
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>MEDCORE</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Doctor's Portal</div>
                </div>
              )}
            </div>

            {/* Collapse Button */}
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                ...styles(theme).collapseButton,
                background: theme.collapseButtonBg,
                border: currentTheme === 'blue' ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.05)',
                color: theme.collapseButtonText,
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                order: sidebarCollapsed ? 1 : 2,
                marginLeft: sidebarCollapsed ? 0 : 'auto',
                flexShrink: 0
              }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Staff Card - Only when not collapsed */}
          {!sidebarCollapsed && employeeName && (
            <div style={{
              margin: '16px 16px 20px',
              background: currentTheme === 'blue' ? 'rgba(255,255,255,0.05)' : theme.filterSection,
              borderRadius: '10px',
              padding: '14px 16px',
              border: `1px solid ${theme.sidebarBorder}`,
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.info}, ${theme.activeNavBg})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '10px',
              }}>
                {initials(employeeName)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>Dr. {employeeName}</div>
              <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Physician
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav style={{ flex: 1, padding: sidebarCollapsed ? '12px 0' : '8px 12px', overflowY: 'auto' }}>
            {navSections.map(section => (
              <div key={section.label} style={{ marginBottom: '16px' }}>
                {!sidebarCollapsed && <div style={styles(theme).sectionHeader(sidebarCollapsed)}>{section.label}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {section.items.map(item => {
                    const isActive = item.id === activeSection;
                    return (
                      <button
                        key={item.id}
                        className={`nav-item ${isActive ? 'active-tab' : ''}`}
                        onClick={item.action}
                        onMouseEnter={() => setHoveredNavItem(item.id)}
                        onMouseLeave={() => setHoveredNavItem(null)}
                        style={{
                          ...styles(theme).navItem(isActive, sidebarCollapsed),
                          padding: sidebarCollapsed ? '12px 0' : '10px 14px',
                          margin: sidebarCollapsed ? '0' : '0 0 2px 0',
                          position: 'relative',
                        }}
                      >
                        <span className="nav-icon" style={{
                          fontSize: '18px',
                          width: '20px',
                          textAlign: 'center',
                          filter: currentTheme === 'blue' ? 'brightness(1.2)' : 'none',
                          textShadow: currentTheme === 'blue' ? '0 0 5px rgba(251, 191, 36, 0.3)' : 'none',
                        }}>
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span style={{ fontWeight: '500', flex: 1, textAlign: 'left', color: isActive ? theme.activeNavText : theme.inactiveNavText }}>{item.label}</span>
                            {item.badge > 0 && (
                              <span style={{
                                background: item.badgeColor === 'danger' ? theme.danger : 
                                           item.badgeColor === 'info' ? theme.info : 
                                           item.badgeColor === 'accent' ? theme.accent : theme.textMuted,
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                textAlign: 'center',
                              }}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip for collapsed mode */}
                        {sidebarCollapsed && hoveredNavItem === item.id && (
                          <div style={styles(theme).tooltip}>
                            {item.label}
                            {item.badge > 0 && ` (${item.badge})`}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Footer - Collapsed/Expanded version */}
          <div style={{
            padding: sidebarCollapsed ? '16px 0' : '16px',
            borderTop: `1px solid ${theme.sidebarBorder}`,
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            textAlign: sidebarCollapsed ? 'center' : 'left'
          }}>
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.info}, ${theme.activeNavBg})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {employeeName ? initials(employeeName) : 'D'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, fontWeight: '500' }}>
                    Doctor
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.sidebarText,
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>Dr. {employeeName}</div>
                </div>
              </div>
            ) : (
              <div
                style={{ fontSize: '14px', color: theme.sidebarText, fontWeight: '500', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setHoveredNavItem('user')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                👤
                {hoveredNavItem === 'user' && (
                  <div style={{ ...styles(theme).tooltip, left: '100%' }}>
                    Dr. {employeeName} - Physician
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '260px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          paddingTop: '80px',
        }}>
          {/* Topbar - Pass themeColor */}
          <Topbar token={urlToken} themeColor={currentTheme} />

          {/* Missing Drugs Component - Positioned below Topbar */}
          <MissingDrugs token={urlToken} />

          {/* Secondary Topbar */}
          <div style={{
            background: theme.cardBg,
            borderBottom: `1px solid ${theme.cardBorder}`,
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: '60px',
            zIndex: 50,
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>
              Doctor's Dashboard
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LiveClock theme={theme} />
              <button
                className={isRefreshing ? 'spinning' : ''}
                onClick={() => refreshAll(true)}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.textMuted}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.cardBorder}
              >
                <span style={{ fontSize: '14px' }}>↻</span>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Stats Row - 4 squares */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
            className="stats-grid">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-card" 
                  style={styles(theme).statCard}
                  onClick={() => setActiveSection(stat.section)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Section Panel */}
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Modals */}
      {isRadiologyResultsModalOpen && selectedPatient && (
        <RadiologyResultsModal3
          patient={selectedPatient}
          onClose={() => {
            setIsRadiologyResultsModalOpen(false);
            setSelectedPatient(null);
            refreshAll();
          }}
          clinicDetails={clinicDetails}
          token={urlToken}
        />
      )}

      {isLabResultsModalOpen && selectedPatient && (
        <Resultmodal2
          patient={selectedPatient}
          onClose={() => {
            setIsLabResultsModalOpen(false);
            setSelectedPatient(null);
            refreshAll();
          }}
          clinicDetails={clinicDetails}
          token={urlToken}
        />
      )}
    </>
  );
}

export default DoctorsDashboard;
