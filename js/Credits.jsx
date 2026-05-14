import React, { useState, useEffect, useCallback, useRef } from 'react';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import './Credits.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, 
  faTimes, 
  faFileInvoice, 
  faComment, 
  faMoneyCheckAlt, 
  faEdit, 
  faInfoCircle, 
  faExclamationTriangle, 
  faTrash, 
  faCheckSquare, 
  faSquare,
  faWallet,
  faUsers,
  faFileAlt,
  faPlusCircle,
  faReceipt,
  faArrowLeft,
  faArrowRight,
  faUserMd,
  faClinicMedical,
  faChartPie,
  faBell,
  faSearch,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Topbar from './Topbar';
import printJS from 'print-js';
import './receiptStyles.css';
import Receipt from './Receipt';
import LoadingState from './LoadingState';
import EditBillModal from './EditBillModal';
import InvoiceModal from './InvoiceModal';

// ─── DESIGN TOKENS (unchanged) ───────────────────────────────────────────
const colors = {
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
    staffCardBg: 'rgba(255,255,255,0.05)',
    staffCardBorder: '#1e3a8a',
    logoBg: '#2563eb',
  },
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
    staffCardBg: '#f8fafc',
    staffCardBorder: '#e2e8f0',
    logoBg: '#2563eb',
  }
};

// ─── SHARED STYLES (unchanged) ────────────────────────────────────────────
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
    border: '1px solid rgba(0,0,0,0.05)',
    minWidth: '40px',
    height: '40px',
  },
  badge: (type) => {
    const map = {
      green: theme.badgeGreen,
      red: theme.badgeRed,
      orange: theme.badgeOrange,
      blue: theme.badgeBlue,
      sky: theme.badgeSky,
      gray: theme.badgeGray,
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
    maxWidth: '600px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
});

// ─── Global Styles Component (unchanged) ─────────────────────────────────
const GlobalStyles = ({ theme }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${theme.tableHeader}; }
    ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textSecondary}; }
    
    .nav-item:hover { 
      background: ${theme.navHoverBg} !important; 
      color: ${theme.sidebarText} !important; 
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
    }
    
    .active-tab .nav-icon { 
      color: ${theme.activeNavText} !important; 
    }
    
    .collapse-btn:hover { 
      background: ${theme.collapseButtonHover} !important; 
      transform: scale(1.05); 
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .patient-card:hover {
      border-color: ${theme.accent} !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .fade-in { 
      animation: fadeIn 0.3s ease; 
    }
    
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(6px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
    
    .spinning { 
      animation: spin 0.8s linear; 
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr !important;
      }
      .patients-grid {
        grid-template-columns: 1fr !important;
      }
    }
    
    .patient-action-buttons {
      display: flex;
      flex-wrap: nowrap;
      gap: 6px;
      margin-top: 16px;
      width: 100%;
    }
    
    .patient-action-buttons button {
      flex: 1 1 0;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 8px 4px;
    }
    
    @media (max-width: 480px) {
      .patient-action-buttons {
        gap: 3px;
      }
      .patient-action-buttons button {
        padding: 8px 2px;
        font-size: 11px;
      }
      .patient-action-buttons button svg {
        margin-right: 2px;
      }
    }
  `}</style>
);

// ─── Clock Component (unchanged) ────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontSize: '13px', color: colors.white.textMuted, fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' })}
      {' · '}
      {time.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─── Loading Spinner (unchanged) ────────────────────────────────────────
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
        borderTopColor: theme.accent, 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading credits dashboard...</div>
    </div>
  );
}

// ─── Notification Component (unchanged) ─────────────────────────────────
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

// ─── Helper functions for FP ID handling ──────────────────────────────────

/**
 * Extracts all file IDs from a patient's file_details, including FP IDs.
 * @param {Object} patient - The patient object from patient_balances.
 * @returns {string[]} Array of file IDs (strings).
 */
const extractFileIds = (patient) => {
  if (!patient.file_details || !Array.isArray(patient.file_details)) {
    return [];
  }

  const ids = [];
  patient.file_details.forEach(file => {
    // Include normal file_id if present and not empty
    if (file.file_id && file.file_id !== '') {
      ids.push(file.file_id.toString());
    }
    // Include FP IDs from amounts.family_planning_ids
    if (file.amounts && Array.isArray(file.amounts.family_planning_ids)) {
      file.amounts.family_planning_ids.forEach(fpId => {
        if (fpId && fpId !== '') {
          ids.push(fpId.toString());
        }
      });
    }
  });
  return ids;
};

/**
 * Gets the amount associated with a specific file ID (including FP IDs).
 * @param {Object} patient - The patient object.
 * @param {string} fileId - The file ID to look up.
 * @returns {number} The amount for that file, or 0 if not found.
 */
const getFileAmount = (patient, fileId) => {
  if (!patient.file_details || !Array.isArray(patient.file_details)) return 0;

  // First check if fileId is a normal file_id
  const normalFile = patient.file_details.find(f => f.file_id && f.file_id.toString() === fileId);
  if (normalFile) {
    return normalFile.file_total_amount || 0;
  }

  // Otherwise, look for FP IDs
  for (const file of patient.file_details) {
    if (file.amounts && Array.isArray(file.amounts.family_planning_ids)) {
      const index = file.amounts.family_planning_ids.findIndex(id => id.toString() === fileId);
      if (index !== -1) {
        const totalFp = file.amounts.family_planning || 0;
        const count = file.amounts.family_planning_ids.length;
        // If multiple FP IDs, split equally; if only one, use total.
        return count > 0 ? totalFp / count : 0;
      }
    }
  }
  return 0;
};

/**
 * Returns an array of file-like objects for display/selection, including virtual FP files.
 * @param {Object} patient - The patient object.
 * @returns {Array<{id: string, amount: number, displayName: string}>}
 */
const getAllFileItems = (patient) => {
  const items = [];
  if (!patient.file_details || !Array.isArray(patient.file_details)) return items;

  patient.file_details.forEach(file => {
    // Normal file (with file_id)
    if (file.file_id && file.file_id !== '') {
      items.push({
        id: file.file_id.toString(),
        amount: file.file_total_amount || 0,
        displayName: `File ID: ${file.file_id}`
      });
    }
    // FP files (virtual)
    if (file.amounts && Array.isArray(file.amounts.family_planning_ids)) {
      const totalFp = file.amounts.family_planning || 0;
      const count = file.amounts.family_planning_ids.length;
      file.amounts.family_planning_ids.forEach((fpId, idx) => {
        const amount = count > 0 ? totalFp / count : 0;
        items.push({
          id: fpId.toString(),
          amount: amount,
          displayName: `FP ID: ${fpId}`
        });
      });
    }
  });
  return items;
};

/**
 * Calculate total amount for selected file IDs.
 * @param {Object} patient - The patient object.
 * @param {string[]} selectedIds - Array of selected file IDs.
 * @returns {number} Sum of amounts for selected files.
 */
const calculateSelectedFilesTotal = (patient, selectedIds) => {
  if (!selectedIds.length) return 0;
  return selectedIds.reduce((total, id) => total + getFileAmount(patient, id), 0);
};

/**
 * Sort file IDs numerically (descending) for display.
 * @param {string[]} fileIds - Array of file ID strings.
 * @returns {string[]} Sorted array.
 */
const getSortedFileIds = (fileIds) => {
  if (!fileIds || fileIds.length === 0) return [];
  return [...fileIds].sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA; // descending numeric
    }
    return b.localeCompare(a); // fallback string compare
  });
};

// ─── Main Component ─────────────────────────────────────────────────────────
function Credits() {
  const [employeeName, setEmployeeName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGiveCreditPrompt, setShowGiveCreditPrompt] = useState(false);
  const [newCreditAmount, setNewCreditAmount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showMakePaymentPrompt, setShowMakePaymentPrompt] = useState(false);
  const [message, setMessage] = useState('');
  const [showSendMessagePrompt, setShowSendMessagePrompt] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [confirmingCredit, setConfirmingCredit] = useState(false);
  const navigate = useNavigate();
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [token, setToken] = useState('');
  const [canSendReminder, setCanSendReminder] = useState(false);
  const [smsSettings, setSmsSettings] = useState({
    billPayment: false,
    birthdayMessage: false,
    debtReminder: false,
    customSingle: false,
    customGroup: false,
  });
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [reason, setReason] = useState('Treatment');
  const [district, setDistrict] = useState('');
  const [ownersContact, setOwnersContact] = useState('');
  const [town, setTown] = useState('');
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [showClearFilePrompt, setShowClearFilePrompt] = useState(false);
  const [fileToClear, setFileToClear] = useState(null);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasSalesPermission, setHasSalesPermission] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const urlTheme = parseThemeFromSearch(window.location.search);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const intervalRef = useRef(null);
  const isMounted = useRef(true);

  const [patientsData, setPatientsData] = useState({ 
    patient_balances: [], 
    summary: {
      department_totals: {
        family_planning: 0,
        consultation: 0,
        services: { total: 0, balance: 0 },
        lab: 0,
        radiology: 0,
        rx_treatments: { total: 0, balance: 0 },
        credits: 0
      },
      total_unpaid_balance: 0,
      net_unpaid_balance: 0
    } 
  });

  // Get the active theme colors
  const theme = colors[currentTheme];

  // ── Notification helpers (unchanged) ─────────────────────────────────
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Function to reset all modal states
  const resetModalStates = () => {
    setShowGiveCreditPrompt(false);
    setShowMakePaymentPrompt(false);
    setShowSendMessagePrompt(false);
    setShowEditBillModal(false);
    setShowInvoiceModal(false);
    setShowClearFilePrompt(false);
    setShowReceipt(false);
    
    setNewCreditAmount(0);
    setPaymentAmount(0);
    setMessage('');
    setSelectedPatient(null);
    setSelectedPatientForEdit(null);
    setSelectedFileIds([]);
    setFileToClear(null);
    setSuggestions([]);
  };

  // ── Security check with theme detection (unchanged) ─────────────────
  useEffect(() => {
    if (!urlToken) { navigate('/login'); return; }
    const check = async () => {
      try {
        const res = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken }),
        });
        if (!res.ok) throw new Error('Security check failed');
        const data = await res.json();
        if (data.message === 'Session valid') {
          setEmployeeName(data.employee_name || '');
          setClinicName(data.clinic);
          setDistrict(data.district);
          setOwnersContact(data.owners_contact);
          setTown(data.town);
          
          const themeColor = data.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          saveSessionToken(data.clinic_session_token);
          
          await fetchUserPermissions(urlToken);
          await fetchMessagingPermission(urlToken);
          await fetchSMSSettings(urlToken);
        } else if (data.error === 'Session expired') {
          navigate(`/dashboard?token=${data.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    };
    check();
  }, [navigate, urlToken]);

  // Add function to fetch permissions (unchanged)
  const fetchUserPermissions = async (token) => {
    try {
      const response = await fetch(urls.fetchpermissions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
        
        const hasEditBillsPermission = data.permissions && data.permissions.includes('editbills');
        setHasEditPermission(hasEditBillsPermission);
        
        const hasSalesPerm = data.permissions && data.permissions.includes('sales');
        setHasSalesPermission(hasSalesPerm);
      } else {
        setHasSalesPermission(false);
        setHasEditPermission(false);
      }
    } catch (error) {
      setHasSalesPermission(false);
      setHasEditPermission(false);
    }
  };

  const fetchMessagingPermission = async (token) => {
    try {
      const response = await fetch(urls.messagingPermission, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setCanSendReminder(data.messages === 'yes');
      }
    } catch (error) {
      console.error('Error fetching messaging permission:', error.message);
    }
  };

  const fetchSMSSettings = async (token) => {
    try {
      const response = await fetch(urls.fetchSMSsettings, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        console.error('Failed to fetch SMS settings.');
        return;
      }
      const data = await response.json();
      setSmsSettings({
        billPayment: data.billPayment === '1' || data.billPayment === true,
        birthdayMessage: data.birthdayMessage === '1' || data.birthdayMessage === true,
        debtReminder: data.debtReminder === '1' || data.debtReminder === true,
        customSingle: data.customSingle === '1' || data.customSingle === true,
        customGroup: data.customGroup === '1' || data.customGroup === true,
      });
    } catch (error) {
      console.error('Error fetching SMS settings:', error.message);
    }
  };

  // Initialize selected file IDs when patient is selected for payment
  useEffect(() => {
    if (selectedPatient) {
      const fileIds = extractFileIds(selectedPatient);
      const sortedFiles = getSortedFileIds(fileIds);
      setSelectedFileIds([...sortedFiles]);
    } else {
      setSelectedFileIds([]);
    }
  }, [selectedPatient]);

  const toggleFileSelection = (fileId) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const selectAllFiles = () => {
    if (selectedPatient) {
      const fileIds = extractFileIds(selectedPatient);
      const sortedFiles = getSortedFileIds(fileIds);
      setSelectedFileIds([...sortedFiles]);
    }
  };

  const deselectAllFiles = () => {
    setSelectedFileIds([]);
  };

  const handleClearFile = (fileId) => {
    setFileToClear(fileId);
    setShowClearFilePrompt(true);
  };

  const confirmClearFile = async () => {
    if (!fileToClear || !selectedPatient) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      const payload = {
        token: tokenFromUrl,
        file_id: fileToClear,
        contact_id: selectedPatient.details.contact_id
      };

      const response = await fetch(urls.clearunconditionally, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('File cleared successfully');
        setShowClearFilePrompt(false);
        setFileToClear(null);
        fetchPatients();
      } else {
        throw new Error('Failed to clear file');
      }
    } catch (error) {
      toast.error(`Error clearing file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (!tokenFromUrl) {
        throw new Error('Token not found in URL');
      }

      const response = await fetch(urls.fetchcredits2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenFromUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add computed file_ids for each patient using our new extractor
        const processedData = {
          ...data,
          patient_balances: data.patient_balances.map(patient => ({
            ...patient,
            file_ids: extractFileIds(patient)
          }))
        };
        
        setPatientsData(processedData);
      } else {
        throw new Error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error.message);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchPatients();

    intervalRef.current = setInterval(() => {
      if (isMounted.current) {
        fetchPatients();
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refreshAll = async () => {
    setIsRefreshing(true);
    await fetchPatients();
    setIsRefreshing(false);
  };

  const handleInvoiceButtonClick = (patient) => {
    const invoiceDetails = {
      contactId: patient.details?.contact_id,
      patientName: `${patient.details?.first_name} ${patient.details?.last_name}`,
      phoneNumber: patient.details?.phone_number,
      age: patient.details?.age,
      sex: patient.details?.sex,
      credits: [],
      files: [],
      token: urlToken,
    };
    
    setInvoiceData(invoiceDetails);
    setShowInvoiceModal(true);
  };
  
  const handleGiveCreditButtonClick = () => {
    setShowGiveCreditPrompt(true);
  };

  const handleMakePaymentButtonClick = (patient) => {
    setSelectedPatient(patient);
    setPaymentAmount(0);
    setShowMakePaymentPrompt(true);
  };

  const handleSendMessageButtonClick = (patient) => {
    const phoneNumber = patient.details.phone_number;
    const message = `Hello our esteemed Client, warm greetings from ${clinicName}. You are kindly reminded to clear your outstanding balance of UGX ${patient.net_balance}, medical bill that has been due, in order to enable us efficient service delivery. Thank you. We wish you good health.`;
    setMessage(message);
    setSelectedPatient(patient);
    setShowSendMessagePrompt(true);
  };

  const handleGiveCredit = async () => {
    try {
      if (!selectedPatient) {
        throw new Error('No patient selected');
      }
      setConfirmingCredit(true);

      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (!tokenFromUrl) {
        throw new Error('Token not found in URL');
      }

      const payload = {
        user: selectedPatient,
        amount: newCreditAmount,
        token: tokenFromUrl,
      };

      const response = await fetch(urls.confirmcredit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Credit confirmed successfully');
        setNewCreditAmount(0);
        setShowGiveCreditPrompt(false);
        fetchPatients();
      } else {
        throw new Error('Failed to confirm credit');
      }
    } catch (error) {
      toast.error(`Error confirming credit: ${error.message}`);
    } finally {
      setConfirmingCredit(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      if (!selectedPatient || !paymentAmount || paymentAmount <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }

      // Use the new helper that accounts for FP IDs
      const selectedFilesTotal = calculateSelectedFilesTotal(selectedPatient, selectedFileIds);
      const creditsAmount = selectedPatient.department_totals?.credits || 0;
      
      const maxAllowedAmount = selectedFileIds.length > 0 
        ? selectedFilesTotal + creditsAmount
        : creditsAmount;

      if (paymentAmount > maxAllowedAmount) {
        toast.error(`Payment amount cannot exceed UGX ${maxAllowedAmount.toLocaleString()} for the selected files`);
        return;
      }

      const patientDetails = selectedPatient.details;
      const contactId = patientDetails.contact_id;
      const patientName = `${patientDetails.first_name} ${patientDetails.last_name}`;
      
      const totalBalanceDue = selectedPatient.net_balance;
      
      if (paymentAmount > totalBalanceDue) {
        throw new Error("Payment amount exceeds remaining balance");
      }

      setIsSubmittingPayment(true);

      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");

      if (!tokenFromUrl) {
        throw new Error("Token not found in URL");
      }

      const payload = {
        employeeName: employeeName,
        contactId: contactId,
        patientName: patientName,
        phoneNumber: patientDetails.phone_number,
        religion: patientDetails.religion,
        dob: patientDetails.dob,
        age: patientDetails.age,
        sex: patientDetails.sex,
        amount: paymentAmount,
        token: tokenFromUrl,
        file_ids: selectedFileIds,
      };

      const response = await fetch(urls.submitpayment2, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const paymentResponseData = await response.json();
        
        const isPaymentSuccessful = paymentResponseData.status && 
          paymentResponseData.status.toLowerCase().includes("success");

        if (isPaymentSuccessful) {
          let linktoken = "no token";
          let balanceRemaining = selectedPatient.net_balance - paymentAmount;

          const smsPayload = {
            ...payload,
            linktoken,
            balanceRemaining,
          };

          if (smsSettings.billPayment) {
            try {
              await fetch(urls.SendPaymentSms, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...smsPayload,
                  smsType: 'billing',
                }),
              });
            } catch (error) {
              console.error("Error sending payment SMS:", error);
            }
          } else {
            console.info('Bill payment SMS is disabled in admin SMS settings; skipping SMS send.');
          }

          const totalBill = paymentResponseData.totalBill || selectedPatient.total_bill;
          const totalPaid = paymentResponseData.totalPaid || paymentAmount;
          const balance = paymentResponseData.balance || balanceRemaining;

          const completeReceiptDetails = {
            clinicName: clinicName,
            town: town,
            district: district,
            ownersContact: ownersContact,
            patientName: patientName,
            patientAge: patientDetails.age,
            totalBill: paymentResponseData.totalBill || Math.round(totalBill),
            totalPaid: paymentResponseData.amount_received || Math.round(totalPaid),
            balance: paymentResponseData.balance || Math.round(balance),
            patientId: contactId,
            reason: reason,
            linktoken: linktoken,
            totalBalanceDue: selectedPatient.net_balance,
            paymentResponse: paymentResponseData,
            transactionDetails: {
              status: paymentResponseData.status,
              message: paymentResponseData.message,
              amountReceived: paymentResponseData.amount_received,
              amountUsed: paymentResponseData.amount_used,
              change: paymentResponseData.change,
              shiftInfo: paymentResponseData.shift_info,
              debtsPaid: paymentResponseData.debts_paid,
              consultationPaid: paymentResponseData.consultation_paid,
              labPaid: paymentResponseData.lab_paid,
              radiologyPaid: paymentResponseData.radiology_paid,
              billsPaid: paymentResponseData.bills_paid,
              servicesPaid: paymentResponseData.services_paid,
              fpPaid: paymentResponseData.fp_paid
            },
            paymentBreakdown: paymentResponseData.payment_details
          };

          setReceiptDetails(completeReceiptDetails);
          setShowMakePaymentPrompt(false);
          setShowReceipt(true);
          setSelectedFileIds([]);
          setPaymentAmount(0);

          toast.success("Payment processed successfully!");
          fetchPatients();
        } else {
          throw new Error(paymentResponseData.message || "Payment processing failed");
        }
      } else {
        throw new Error("Failed to process payment");
      }
    } catch (error) {
      toast.error(`Error processing payment: ${error.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    const patientWithDetails = {
      details: {
        contact_id: suggestion.contact_id || suggestion.id,
        first_name: suggestion.first_name || '',
        last_name: suggestion.last_name || '',
        phone_number: suggestion.phone_number || '',
        age: suggestion.age || 'N/A',
        sex: suggestion.sex || 'N/A',
      },
      net_balance: 0,
    };
    
    setSelectedPatient(patientWithDetails);
    setSuggestions([]);
    setShowGiveCreditPrompt(true);
  };

  const handleCancel = () => {
    resetModalStates();
  };

  const handleSendReminder = async () => {
    setIsLoading(true);
    try {
      if (!selectedPatient) {
        throw new Error('No selected patient to send reminder');
      }

      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      const payload = {
        phoneNumber: selectedPatient.details.phone_number,
        message: message,
        token: tokenFromUrl
      };

      const response = await fetch(urls.whatsappall, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const messages = responseData.messages || [];

        const sentNumbers = messages.filter(result => result.status.description === 'Message sent to next instance').map(result => result.to);
        const failedNumbersNotRegistered = messages.filter(result => result.status.description === 'Destination not registered').map(result => result.to);
        const failedNumbersUnknownReason = messages.filter(result => result.status.description !== 'Message sent to next instance' && result.status.description !== 'Destination not registered').map(result => result.to);

        const successCount = sentNumbers.length;
        const notRegisteredCount = failedNumbersNotRegistered.length;
        const unknownReasonCount = failedNumbersUnknownReason.length;

        let toastMessage = '';

        if (successCount > 0) {
          const charge = successCount * 30;
          toastMessage += `${successCount} messages sent successfully to the following numbers:\n${sentNumbers.join(', ')}\n\n`;
          toastMessage += `You have been charged UGX ${charge}.\n\n`;
        } else {
          toastMessage += `No successful messages were sent. You have not been charged.\n\n`;
        }

        if (notRegisteredCount > 0) {
          toastMessage += `${notRegisteredCount} messages failed to send because the numbers are not registered on WhatsApp:\n${failedNumbersNotRegistered.join(', ')}\n\n`;
        }

        if (unknownReasonCount > 0) {
          toastMessage += `${unknownReasonCount} messages failed to send for unknown reasons:\n${failedNumbersUnknownReason.join(', ')}`;
        }

        if (toastMessage) {
          toast.success(toastMessage, {
            autoClose: 15000,
          });
        }
      } else {
        toast.error(`Failed to send reminder: ${response.statusText}`);
      }
    } catch (error) {
      toast.error(`Error sending reminder: ${error.message}`);
    }

    setIsLoading(false);
    setMessage('');
    setShowSendMessagePrompt(false);
  };
  
  const handleSuggestName = async (name) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
  
      const queryString = `?name=${encodeURIComponent(name)}&token=${encodeURIComponent(tokenFromUrl)}`;
  
      const response = await fetch(`${urls.suggest}${queryString}`);
  
      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message === 'No patient records found for the specified clinic') {
          setSuggestions([]);
          setMessage('No patient records found');
        } else {
          setSuggestions(data);
          setMessage('');
        }
      } else {
        throw new Error('Failed to suggest names');
      }
    } catch (error) {
      console.error('Error suggesting names:', error.message);
    }
  };
  
  const handleSaveEditedBill = async (editedDetails) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      const filteredPayload = {
        token: tokenFromUrl,
        credit_id: editedDetails.credit_id,
        contact_id: editedDetails.contact_id,
        new_balance: editedDetails.new_balance
      };

      const response = await fetch(urls.updatecredit2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredPayload),
      });

      if (response.ok) {
        toast.success('Bill updated successfully');
        setShowEditBillModal(false);
        fetchPatients();
      } else {
        throw new Error('Failed to update bill');
      }
    } catch (error) {
      toast.error(`Error updating bill: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBillButtonClick = (patient) => {
    setSelectedPatientForEdit(patient);
    setShowEditBillModal(true);
  };

  // Avatar initials (unchanged)
  const initials = (name) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  // Navigation sections (unchanged)
  const navSections = [
    {
      label: 'ACTIONS',
      items: [
        { 
          id: 'new-bill', 
          icon: '➕', 
          label: 'Create New Bill', 
          action: handleGiveCreditButtonClick,
        },
      ],
    },
  ];

  if (isLoading && patientsData.patient_balances.length === 0) {
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
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, marginRight: '6px' }} />
                ClinicPro
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

        {/* Notification Container (unchanged) */}
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

        {/* ─── Sidebar (unchanged) ─────────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '300px',
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
          boxShadow: currentTheme === 'blue' ? '2px 0 8px rgba(0,0,0,0.1)' : '2px 0 8px rgba(0,0,0,0.05)',
          transition: 'width 0.3s ease',
          zIndex: 900,
        }}>
          {/* Logo with Collapse Button (unchanged) */}
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
                background: theme.logoBg,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: currentTheme === 'blue' ? '0 4px 10px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                CP
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>ClinicPro</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Credits Management</div>
                </div>
              )}
            </div>

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
                boxShadow: currentTheme === 'blue' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
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

          {/* Navigation (unchanged) */}
          <nav style={{ 
            padding: sidebarCollapsed ? '12px 0' : '8px 12px', 
            overflowY: 'visible',
            marginBottom: '8px'
          }}>
            {navSections.map(section => (
              <div key={section.label} style={{ marginBottom: '16px' }}>
                {!sidebarCollapsed && <div style={styles(theme).sectionHeader(sidebarCollapsed)}>{section.label}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {section.items.map(item => {
                    const isActive = item.id === 'dashboard';
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
                          color: isActive ? theme.activeNavText : theme.iconBright,
                        }}>
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span style={{ fontWeight: '500', flex: 1, textAlign: 'left', color: isActive ? theme.activeNavText : theme.sidebarText }}>
                              {item.label}
                            </span>
                            {item.badge > 0 && (
                              <span style={{
                                background: theme.danger,
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

          {/* Summary Section in Sidebar (unchanged) */}
          {!sidebarCollapsed && (
            <div style={{
              margin: '0 16px 16px 16px',
              padding: '16px',
              background: theme.filterSection,
              borderRadius: '12px',
              border: `1px solid ${theme.sidebarBorder}`,
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: theme.sidebarText,
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Department Summary
              </div>

              {patientsData.summary && patientsData.summary.department_totals && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {patientsData.summary.department_totals.family_planning > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Family Planning</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.family_planning.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.services?.balance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Services</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.services.balance.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.consultation > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Consultation</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.consultation.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.lab > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Lab</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.lab.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.radiology > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Radiology</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.radiology.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.rx_treatments?.balance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Treatments</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                        UGX {patientsData.summary.department_totals.rx_treatments.balance.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {patientsData.summary.department_totals.credits > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: theme.sidebarTextMuted }}>Unspecified Debts</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.accent }}>
                        UGX {patientsData.summary.department_totals.credits.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: `2px solid ${theme.sidebarBorder}`,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontWeight: '700'
                  }}>
                    <span style={{ fontSize: '13px', color: theme.sidebarText }}>Total Unpaid</span>
                    <span style={{ fontSize: '16px', color: theme.danger }}>
                      UGX {patientsData.summary.net_unpaid_balance?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '300px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          paddingTop: '80px',
        }}>
          
          <Topbar token={urlToken} themeColor={currentTheme} />

          {/* Secondary Topbar (unchanged) */}
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
              Credits Management
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LiveClock />
              <button
                className={isRefreshing ? 'spinning' : ''}
                onClick={refreshAll}
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

            {/* Stats Row (unchanged) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              className: 'stats-grid'
            }}>
              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Total Debtors
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: theme.accent, lineHeight: 1 }}>
                  {patientsData.patient_balances?.length || 0}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                  Patients with outstanding balances
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Total Unpaid
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: theme.danger, lineHeight: 1 }}>
                  UGX {(patientsData.summary?.net_unpaid_balance || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                  Total outstanding balance
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Unspecified Debts
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: theme.warning, lineHeight: 1 }}>
                  UGX {(patientsData.summary?.department_totals?.credits || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                  Bills without file attachments
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Active Files
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: theme.info, lineHeight: 1 }}>
                  {patientsData.patient_balances?.reduce((acc, p) => acc + (p.file_count || 0), 0)}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
                  Total active patient files (incl. FP)
                </div>
              </div>
            </div>

            {/* Search Section (unchanged) */}
            <div style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: theme.textMuted,
                      fontSize: '14px'
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Search patient by name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      fontSize: '14px',
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: theme.mainBg,
                      color: theme.textPrimary,
                    }}
                    onFocus={e => e.target.style.borderColor = theme.info}
                    onBlur={e => e.target.style.borderColor = theme.cardBorder}
                  />
                </div>
                {message && (
                  <div style={{
                    color: theme.danger,
                    backgroundColor: theme.dangerLight,
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>{message}</div>
                )}
              </div>
            </div>

            {/* Patients List */}
            <div style={{
              marginTop: '10px'
            }}>
              <h2 style={{
                color: theme.textPrimary,
                fontSize: '18px',
                marginBottom: '20px',
                fontWeight: '600'
              }}>Patient Bills / Debts</h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '20px',
                className: 'patients-grid'
              }}>
                {patientsData.patient_balances
                  .filter((patient) => {
                    const firstName = patient.details?.first_name || '';
                    const lastName = patient.details?.last_name || '';
                    return (
                      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      lastName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  })
                  .map((patient, index) => {
                    const fileIds = extractFileIds(patient);
                    const sortedFileIds = getSortedFileIds(fileIds);
                    
                    return (
                      <div 
                        key={index} 
                        className="patient-card"
                        style={{
                          background: theme.cardBg,
                          border: `1px solid ${theme.cardBorder}`,
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '15px'
                        }}>
                          <h3 style={{
                            margin: '0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: theme.textPrimary,
                            textTransform: 'uppercase'
                          }}>
                            {patient.details?.first_name?.toUpperCase() || ''} {patient.details?.last_name?.toUpperCase() || ''}
                          </h3>
                          <span style={styles(theme).badge('gray')}>
                            {patient.details?.phone_number || 'No phone'}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '15px'
                        }}>
                          <div>
                            <p style={{
                              margin: '0',
                              fontSize: '11px',
                              color: theme.textMuted,
                              fontWeight: '500'
                            }}>Age/Sex</p>
                            <p style={{
                              margin: '4px 0 0 0',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: theme.textPrimary
                            }}>{patient.details?.age || 'N/A'} / {patient.details?.sex || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <p style={{
                              margin: '0',
                              fontSize: '11px',
                              color: theme.textMuted,
                              fontWeight: '500'
                            }}>OPD Number</p>
                            <p style={{
                              margin: '4px 0 0 0',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: theme.textPrimary
                            }}>{patient.details?.opd_no || 'N/A'}</p>
                          </div>
                          
                          {fileIds.length > 0 && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <p style={{
                                margin: '0',
                                fontSize: '11px',
                                color: theme.textMuted,
                                fontWeight: '500'
                              }}>Files ({patient.file_count})</p>
                              <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: theme.info
                              }}>
                                IDs: {sortedFileIds.join(', ')}
                              </p>
                            </div>
                          )}
                          
                          {/* TOTAL BALANCE DUE */}
                          <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: `1px dashed ${theme.cardBorder}` }}>
                            <p style={{
                              margin: '0',
                              fontSize: '11px',
                              color: theme.textMuted,
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>Total Balance Due</p>
                            <p style={{
                              margin: '5px 0 0 0',
                              fontSize: '18px',
                              fontWeight: '700',
                              color: patient.net_balance > 0 ? theme.danger : theme.accent
                            }}>
                              UGX {patient.net_balance?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons (unchanged) */}
                        <div className="patient-action-buttons">
                          {hasSalesPermission && (
                            <button 
                              onClick={() => handleMakePaymentButtonClick(patient)}
                              style={{
                                backgroundColor: theme.accent,
                                color: 'white',
                                border: 'none',
                                padding: '8px 4px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                minWidth: '0',
                                flex: '1 1 0'
                              }}
                              title="Make Payment"
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.accent}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.accent}
                            >
                              <FontAwesomeIcon icon={faMoneyCheckAlt} size="sm" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Pay</span>
                            </button>
                          )}
                          
                          {hasEditPermission && (
                            <button 
                              onClick={() => handleEditBillButtonClick(patient)}
                              style={{
                                backgroundColor: theme.warning,
                                color: 'white',
                                border: 'none',
                                padding: '8px 4px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                minWidth: '0',
                                flex: '1 1 0'
                              }}
                              title="Edit Bill"
                            >
                              <FontAwesomeIcon icon={faEdit} size="sm" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Edit</span>
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleInvoiceButtonClick(patient)}
                            style={{
                              backgroundColor: theme.info,
                              color: 'white',
                              border: 'none',
                              padding: '8px 4px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                              minWidth: '0',
                              flex: '1 1 0'
                            }}
                            title="Generate Invoice"
                          >
                            <FontAwesomeIcon icon={faFileInvoice} size="sm" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Invoice</span>
                          </button>

                          {canSendReminder && (
                            <button 
                              onClick={() => handleSendMessageButtonClick(patient)}
                              style={{
                                backgroundColor: theme.skyBlue,
                                color: 'white',
                                border: 'none',
                                padding: '8px 4px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                minWidth: '0',
                                flex: '1 1 0'
                              }}
                              title="Send Reminder"
                            >
                              <FontAwesomeIcon icon={faComment} size="sm" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Remind</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {patientsData.patient_balances.filter((patient) => {
                const firstName = patient.details?.first_name || '';
                const lastName = patient.details?.last_name || '';
                return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lastName.toLowerCase().includes(searchTerm.toLowerCase());
              }).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: theme.textMuted,
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💰</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No patients found</div>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>Try adjusting your search term</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}

      {/* Give Credit Modal (unchanged) */}
      {showGiveCreditPrompt && (
        <div style={styles(theme).modalOverlay} onClick={handleCancel}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${theme.tableBorder}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>Create New Bill</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
                  Create unspecified debt bill for patient
                </div>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: theme.warningLight,
                border: `1px solid ${theme.warning}`,
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: theme.warning,
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
                <strong>Important:</strong> Billing with unspecified files will not be supported in future updates. 
                Please ensure that when billing patients, you use the "Approve Bill" button under the treatment plan creation table.
              </div>
              
              {!selectedPatient && (
                <>
                  <input
                    type="text"
                    placeholder="Search patient name..."
                    onChange={(e) => handleSuggestName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '16px',
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: theme.mainBg,
                      color: theme.textPrimary,
                    }}
                  />
                  
                  {suggestions.length > 0 && (
                    <div style={{
                      marginBottom: '20px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: '8px',
                    }}>
                      {suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: index < suggestions.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: theme.cardBg,
                            color: theme.textPrimary,
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.navHoverBg}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.cardBg}
                        >
                          {suggestion.first_name} {suggestion.last_name} - {suggestion.phone_number}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {selectedPatient && (
                <div style={{
                  backgroundColor: theme.infoLight,
                  border: `1px solid ${theme.info}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: theme.textPrimary }}>
                    {selectedPatient.details?.first_name} {selectedPatient.details?.last_name}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: theme.textSecondary }}>
                    📞 {selectedPatient.details?.phone_number}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: theme.textSecondary }}>
                    👤 {selectedPatient.details?.age} yrs / {selectedPatient.details?.sex}
                  </p>
                </div>
              )}
              
              <input
                type="number"
                value={newCreditAmount}
                onChange={(e) => setNewCreditAmount(parseFloat(e.target.value))}
                placeholder="Enter amount"
                onWheel={(e) => e.target.blur()}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.mainBg,
                  color: theme.textPrimary,
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={handleCancel}
                  style={{
                    backgroundColor: theme.tableHeader,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.cardBorder}`,
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGiveCredit} 
                  disabled={confirmingCredit || !selectedPatient || newCreditAmount <= 0}
                  style={{
                    backgroundColor: confirmingCredit || !selectedPatient || newCreditAmount <= 0 ? theme.textMuted : theme.accent,
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: confirmingCredit || !selectedPatient || newCreditAmount <= 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  {confirmingCredit ? 'Processing...' : 'Create Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Payment Modal (modified to use getAllFileItems and new helper) */}
      {showMakePaymentPrompt && selectedPatient && (
        <div style={styles(theme).modalOverlay} onClick={handleCancel}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${theme.tableBorder}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>Make Payment</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
                  {selectedPatient?.details?.first_name} {selectedPatient?.details?.last_name}
                </div>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  marginBottom: '12px', 
                  fontWeight: '500',
                  color: theme.textSecondary,
                  fontSize: '14px'
                }}>
                  Enter payment amount
                </p>
                
                <div style={{
                  backgroundColor: theme.infoLight,
                  border: `1px solid ${theme.info}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '13px', color: theme.textSecondary }}>Total Amount Due: </span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: theme.danger, marginLeft: '8px' }}>
                    UGX {selectedPatient ? selectedPatient.net_balance.toLocaleString() : '0'}
                  </span>
                </div>
                
                <input
                  type="text"
                  value={paymentAmount === 0 ? '' : paymentAmount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    const decimalCount = (numericValue.match(/\./g) || []).length;
                    const sanitizedValue = decimalCount > 1 
                      ? numericValue.substring(0, numericValue.lastIndexOf('.'))
                      : numericValue;
                    
                    const value = parseFloat(sanitizedValue) || 0;
                    
                    // Use updated helper that accounts for FP IDs
                    const selectedFilesTotal = calculateSelectedFilesTotal(selectedPatient, selectedFileIds);
                    const creditsAmount = selectedPatient.department_totals?.credits || 0;
                    const maxAllowedAmount = selectedFileIds.length > 0 
                      ? selectedFilesTotal + creditsAmount
                      : creditsAmount;
                    
                    if (selectedFileIds.length > 0 && value > maxAllowedAmount) {
                      toast.error(`Amount cannot exceed UGX ${maxAllowedAmount.toLocaleString()} for selected files`);
                      return;
                    }
                    
                    setPaymentAmount(value);
                  }}
                  placeholder="Enter amount"
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    padding: '14px',
                    margin: '0 auto 10px',
                    border: `2px solid ${theme.cardBorder}`,
                    borderRadius: '8px',
                    fontSize: '18px',
                    textAlign: 'center',
                    display: 'block',
                    backgroundColor: theme.mainBg,
                    color: theme.textPrimary,
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9.]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              {/* File Selection Section - now using getAllFileItems */}
              {selectedPatient.file_details && selectedPatient.file_details.length > 0 && (
                <div style={{
                  marginBottom: '24px',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: theme.mainBg
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textPrimary
                    }}>
                      Select Files to Pay For ({selectedFileIds.length} of {getAllFileItems(selectedPatient).length} selected)
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={selectAllFiles}
                        style={{
                          backgroundColor: theme.accent,
                          color: 'white',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllFiles}
                        style={{
                          backgroundColor: theme.danger,
                          color: 'white',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {getAllFileItems(selectedPatient).map((fileItem) => (
                      <div key={fileItem.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        backgroundColor: selectedFileIds.includes(fileItem.id) ? theme.accentLight : theme.cardBg,
                        border: `1px solid ${selectedFileIds.includes(fileItem.id) ? theme.accent : theme.cardBorder}`,
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}
                          onClick={() => toggleFileSelection(fileItem.id)}
                        >
                          <FontAwesomeIcon 
                            icon={selectedFileIds.includes(fileItem.id) ? faCheckSquare : faSquare} 
                            style={{ 
                              color: selectedFileIds.includes(fileItem.id) ? theme.accent : theme.textMuted,
                              fontSize: '16px'
                            }} 
                          />
                          <div>
                            <span style={{ fontWeight: '500', color: theme.textPrimary }}>{fileItem.displayName}</span>
                            <span style={{
                              display: 'block',
                              fontSize: '11px',
                              color: theme.textMuted,
                              marginTop: '2px'
                            }}>
                              Amount: UGX {fileItem.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {hasEditPermission && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFile(fileItem.id);
                            }}
                            style={{
                              backgroundColor: theme.dangerLight,
                              color: theme.danger,
                              border: `1px solid ${theme.danger}`,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} size="sm" />
                            Clear
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedFileIds.length > 0 && (
                    <div style={{
                      backgroundColor: theme.accentLight,
                      border: `1px solid ${theme.accent}`,
                      borderRadius: '6px',
                      padding: '10px',
                      marginTop: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: theme.accent,
                      textAlign: 'center'
                    }}>
                      Selected Files Total: UGX {calculateSelectedFilesTotal(selectedPatient, selectedFileIds).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {selectedPatient.file_count === 0 && (
                <div style={{
                  backgroundColor: theme.infoLight,
                  border: `1px solid ${theme.info}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: theme.info,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faInfoCircle} />
                  No files associated with this patient. Payment will be applied to unspecified debts.
                </div>
              )}
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button 
                  onClick={handleCancel}
                  style={{
                    backgroundColor: theme.tableHeader,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.cardBorder}`,
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPayment} 
                  disabled={isSubmittingPayment || paymentAmount <= 0 || (selectedPatient.file_details && selectedPatient.file_details.length > 0 && selectedFileIds.length === 0)}
                  style={{
                    backgroundColor: isSubmittingPayment || paymentAmount <= 0 || (selectedPatient.file_details && selectedPatient.file_details.length > 0 && selectedFileIds.length === 0) ? theme.textMuted : theme.accent,
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (paymentAmount <= 0 || (selectedPatient.file_details && selectedPatient.file_details.length > 0 && selectedFileIds.length === 0)) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyCheckAlt} />
                  {isSubmittingPayment ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear File Confirmation Modal (unchanged) */}
      {showClearFilePrompt && hasEditPermission && (
        <div style={styles(theme).modalOverlay} onClick={() => setShowClearFilePrompt(false)}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${theme.tableBorder}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.danger }}>High Risk Action</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
                  This action cannot be undone
                </div>
              </div>
              <button
                onClick={() => setShowClearFilePrompt(false)}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: theme.dangerLight,
                border: `1px solid ${theme.danger}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: theme.danger }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
                  WARNING: You are about to clear File ID {fileToClear} without receiving payment!
                </p>
                <p style={{ margin: '0', fontSize: '13px', color: theme.textSecondary }}>
                  This action will permanently mark this file as paid without any actual payment being made. 
                  This should only be done under special circumstances approved by administration.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={() => setShowClearFilePrompt(false)}
                  style={{
                    backgroundColor: theme.tableHeader,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.cardBorder}`,
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmClearFile}
                  disabled={isLoading}
                  style={{
                    backgroundColor: isLoading ? theme.textMuted : theme.danger,
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  {isLoading ? 'Processing...' : 'Clear File Unconditionally'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal (unchanged) */}
      {showSendMessagePrompt && (
        <div style={styles(theme).modalOverlay} onClick={handleCancel}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${theme.tableBorder}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>Send Reminder</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
                  WhatsApp reminder to {selectedPatient?.details?.first_name}
                </div>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {isLoading ? (
                <LoadingState />
              ) : (
                <>
                  <div style={{
                    backgroundColor: theme.mainBg,
                    border: `1px solid ${theme.cardBorder}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: theme.textPrimary,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {message}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button 
                      onClick={handleCancel}
                      style={{
                        backgroundColor: theme.tableHeader,
                        color: theme.textSecondary,
                        border: `1px solid ${theme.cardBorder}`,
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendReminder}
                      style={{
                        backgroundColor: theme.skyBlue,
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <FontAwesomeIcon icon={faComment} />
                      Send Reminder
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal (unchanged) */}
      {showEditBillModal && selectedPatientForEdit && (
        <EditBillModal 
          creditDetails={selectedPatientForEdit}
          onClose={() => setShowEditBillModal(false)}
          onSave={handleSaveEditedBill}
          theme={theme}
        />
      )}

      {/* Invoice Modal (unchanged) */}
      {showInvoiceModal && invoiceData && (
        <InvoiceModal
          invoiceData={invoiceData}
          onClose={() => setShowInvoiceModal(false)}
          clinicName={clinicName}
          district={district}
          town={town}
          ownersContact={ownersContact}
          theme={theme}
        />
      )}

      {/* Receipt Modal (unchanged) */}
      {showReceipt && receiptDetails && (
        <Receipt
          receiptDetails={receiptDetails}
          paymentAmount={paymentAmount}
          employeeName={employeeName}
          setShowReceipt={setShowReceipt}
          theme={theme}
        />
      )}

      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={currentTheme === 'blue' ? 'dark' : 'light'}
      />
    </>
  );
}

export default Credits;