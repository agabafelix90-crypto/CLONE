import React, { useState, useEffect, useRef } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faUserPlus, faUser, faCheckCircle, faArrowLeft,
  faTimesCircle, faClock, faMoneyBillWave,
  faHistory, faCalendarAlt, faChartLine,
  faArrowRight, faExclamationTriangle, faPhone,
  faInfoCircle, faWallet, faTimes, faTrashAlt,
  faStar, faBolt, faCreditCard, faMobileAlt,
  faBuilding, faPhoneAlt, faTag, faReceipt,
  faChevronRight, faHome,
} from '@fortawesome/free-solid-svg-icons';

// ─── Country Data ──────────────────────────────────────────────────────────────
const countryData = {
  'Uganda':       { iso: 'UG', code: '256', currency: 'UGX', flag: '🇺🇬' },
  'Kenya':        { iso: 'KE', code: '254', currency: 'KES', flag: '🇰🇪' },
  'Rwanda':       { iso: 'RW', code: '250', currency: 'RWF', flag: '🇷🇼' },
  'Tanzania':     { iso: 'TZ', code: '255', currency: 'TZS', flag: '🇹🇿' },
  'Nigeria':      { iso: 'NG', code: '234', currency: 'NGN', flag: '🇳🇬' },
  'Ghana':        { iso: 'GH', code: '233', currency: 'GHS', flag: '🇬🇭' },
  'South Africa': { iso: 'ZA', code: '27',  currency: 'ZAR', flag: '🇿🇦' },
  'Ethiopia':     { iso: 'ET', code: '251', currency: 'ETB', flag: '🇪🇹' },
  'DR Congo':     { iso: 'CD', code: '243', currency: 'CDF', flag: '🇨🇩' },
  'Sudan':        { iso: 'SD', code: '249', currency: 'SDG', flag: '🇸🇩' },
};

const NETWORK_PREFIXES = { MTN: ['77', '78', '76'], AIRTEL: ['70', '75', '74'] };

const validateNetworkPrefix = (phoneNumber, network) => {
  if (!phoneNumber || !network) return { isValid: true, warning: '' };
  const clean = phoneNumber.replace(/\D/g, '');
  if (clean.length < 11) return { isValid: true, warning: '' };
  const prefix = clean.substring(3, 5);
  const net = network.toUpperCase();
  if (net === 'MTN' && NETWORK_PREFIXES.AIRTEL.includes(prefix))
    return { isValid: false, warning: `This number (+256${prefix}…) typically belongs to AIRTEL, not MTN.` };
  if (net === 'AIRTEL' && NETWORK_PREFIXES.MTN.includes(prefix))
    return { isValid: false, warning: `This number (+256${prefix}…) typically belongs to MTN, not AIRTEL.` };
  return { isValid: true, warning: '' };
};

// ─── Payment Mode Config ───────────────────────────────────────────────────────
const PAYMENT_MODES = [
  { id: 'wallet',  label: 'Wallet',   icon: faWallet,      shortLabel: 'Wallet', popular: false },
  { id: '1month',  label: '1 Month',  icon: faBolt,        shortLabel: 'Monthly', popular: false },
  { id: '3months', label: '3 Months', icon: faCalendarAlt, shortLabel: '3 Months', popular: false },
  { id: '6months', label: '6 Months', icon: faCalendarAlt, shortLabel: '6 Months', popular: true },
  { id: '9months', label: '9 Months', icon: faCalendarAlt, shortLabel: '9 Months', popular: false },
  { id: '1year',   label: '1 Year',   icon: faStar,        shortLabel: 'Annual', popular: false },
];

const PLAN_CONFIG = {
  '1month':  { months: 1,  rateMulti: 650, flatAbove10: 150000  },
  '3months': { months: 3,  rateMulti: 600, flatAbove10: 400000  },
  '6months': { months: 6,  rateMulti: 500, flatAbove10: 820000  },
  '9months': { months: 9,  rateMulti: 400, flatAbove10: 1000000 },
  '1year':   { months: 12, rateMulti: 370, flatAbove10: 1300000 },
};

const calculateAmount = (modeId, employeeCount) => {
  if (modeId === 'wallet') return null;
  const cfg = PLAN_CONFIG[modeId];
  if (!cfg) return null;
  const days = cfg.months * 30;
  if (employeeCount === 'above10') return cfg.flatAbove10;
  const count = parseInt(employeeCount, 10);
  if (modeId === '1month' && count === 2) return 38000;
  if (count === 1) return days * 700;
  return Math.round(days * cfg.rateMulti * count * 0.9);
};

// ─── White Theme Only ──────────────────────────────────────────────────────────
const theme = {
  sidebarBg: '#ffffff',
  sidebarBorder: '#e2e8f0',
  activeNavBg: '#f1f5f9',
  activeNavText: '#0f172a',
  inactiveNavText: '#334155',
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
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  headerBg: '#ffffff',
  tableHeader: '#f8fafc',
  tableBorder: '#e2e8f0',
  modalOverlay: 'rgba(0, 0, 0, 0.3)',
  modalBg: '#ffffff',
  pureWhite: '#ffffff',
  iconBright: '#f59e0b',
  badgeGreen: { bg: '#dcfce7', text: '#166534' },
  badgeRed: { bg: '#fee2e2', text: '#991b1b' },
  badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
  badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
  badgeGray: { bg: '#f1f5f9', text: '#334155' },
  tooltipBg: '#1e293b',
  tooltipText: '#ffffff',
};

// ─── Animated Components ───────────────────────────────────────────────────────
const AnimatedCard = ({ children, delay = 0, className = '' }) => (
  <div className={`animated-card ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
);

const AnimatedButton = ({ children, onClick, style, disabled, className = '' }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`animated-button ${className}`}
    style={style}
  >
    {children}
  </button>
);

const RippleEffect = ({ children, onClick }) => {
  const [ripples, setRipples] = useState([]);
  
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    
    if (onClick) onClick(e);
  };
  
  return (
    <div className="ripple-container" onClick={handleClick}>
      {children}
      {ripples.map(ripple => (
        <div 
          key={ripple.id}
          className="ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
};

const FloatingElement = ({ children, delay = 0 }) => (
  <div className="floating-element" style={{ animationDelay: `${delay}s` }}>
    {children}
  </div>
);

const GlowingBorder = ({ children, isActive = false }) => (
  <div className={`glowing-border ${isActive ? 'active' : ''}`}>
    {children}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
function PaymentNew() {
  const [view, setView] = useState('selectPayer');
  const [showNewPayerForm, setShowNewPayerForm] = useState(false);
  const [clinicDetails, setClinicDetails] = useState({
    healthFacilityName: '', country: '', countryIso: 'UG', district: '', town: '', subCounty: '',
    currentBalance: 0, currency: 'UGX', token: '', modeAmount: '0',
  });
  const [payers, setPayers] = useState([]);
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPayers, setFetchingPayers] = useState(false);
  const [errors, setErrors] = useState({});
  const [networkWarning, setNetworkWarning] = useState('');
  const [forceNetworkConfirmation, setForceNetworkConfirmation] = useState(false);
  const [activeMode, setActiveMode] = useState('wallet');
  const [employeeCount, setEmployeeCount] = useState('1');
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [confirmationData, setConfirmationData] = useState(null);
  const [showFinalStatus, setShowFinalStatus] = useState(false);
  const [statusTimer, setStatusTimer] = useState(40);
  const pollingIntervalRef = useRef(null);
  const statusTimerRef = useRef(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ totalMonth: 0, totalYear: 0, totalTransactions: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const navigate = useNavigate();
  const [registrationForm, setRegistrationForm] = useState({ firstName: '', lastName: '', phone: '', network: '', amount: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeletePayer, setPendingDeletePayer] = useState(null);
  const [isDeletingPayer, setIsDeletingPayer] = useState(false);
  const [hoveredPayer, setHoveredPayer] = useState(null);
  const [animatedAmount, setAnimatedAmount] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');

  const computedAmount = activeMode !== 'wallet' ? calculateAmount(activeMode, employeeCount) : null;

  // Animate amount changes
  useEffect(() => {
    if (computedAmount !== null) {
      const start = animatedAmount;
      const end = computedAmount;
      const duration = 500;
      const step = (end - start) / (duration / 16);
      let current = start;
      
      const interval = setInterval(() => {
        current += step;
        if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
          setAnimatedAmount(end);
          clearInterval(interval);
        } else {
          setAnimatedAmount(Math.round(current));
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [computedAmount]);

  const showToast = (message, type = 'info') => setToast({ show: true, message, type });

  // ── Shared Styles ────────────────────────────────────────────────────────────
  const styles = {
    card: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    tableWrapper: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: theme.textSecondary,
      background: theme.tableHeader,
      borderBottom: `1px solid ${theme.tableBorder}`,
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '13px 16px',
      fontSize: '13.5px',
      color: theme.textPrimary,
      borderBottom: `1px solid ${theme.tableBorder}`,
      verticalAlign: 'middle',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: (type) => {
      const map = {
        green: theme.badgeGreen,
        red: theme.badgeRed,
        orange: theme.badgeOrange,
        blue: theme.badgeBlue,
        gray: theme.badgeGray,
      };
      const c = map[type] || map.gray;
      return {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
        background: c.bg, color: c.text,
      };
    },
    input: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme.cardBorder}`,
      fontSize: '13px',
      color: theme.textPrimary,
      background: theme.cardBg,
      width: '100%',
      outline: 'none',
      fontFamily: "'Inter', -apple-system, sans-serif",
      boxSizing: 'border-box',
    },
    inputError: {
      border: `1px solid ${theme.danger}`,
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme.cardBorder}`,
      fontSize: '13px',
      color: theme.textPrimary,
      background: theme.cardBg,
      width: '100%',
      outline: 'none',
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '12px',
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: '0.04em',
    },
    errorText: {
      color: theme.danger,
      fontSize: '11px',
      marginTop: '4px',
      display: 'block',
    },
    mainHeader: {
      padding: '20px 28px',
      borderBottom: `1px solid ${theme.cardBorder}`,
      background: theme.headerBg,
    },
    statBox: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '10px',
      padding: '12px 20px',
      minWidth: '120px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    },
    statLabel: {
      fontSize: '12px',
      color: theme.textMuted,
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.textPrimary,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: theme.modalOverlay,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      background: theme.modalBg,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '460px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      animation: 'modalSlideIn 0.3s ease',
    },
    actionButton: {
      padding: '6px 14px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.15s ease',
    },
    primaryButton: {
      background: theme.info,
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 20px',
      fontSize: '13.5px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.15s ease',
    },
    dangerButton: {
      background: theme.danger,
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0',
      background: 'transparent',
      border: 'none',
      color: theme.textMuted,
      fontSize: '13.5px',
      fontWeight: '500',
      cursor: 'pointer',
      marginBottom: '20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    modeButton: (active) => ({
      padding: '8px 16px',
      borderRadius: '10px',
      border: active ? `2px solid ${theme.info}` : `1px solid ${theme.cardBorder}`,
      background: active ? theme.infoLight : theme.cardBg,
      color: active ? theme.info : theme.textSecondary,
      fontSize: '13px',
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      transition: 'all 0.15s ease',
      position: 'relative',
    }),
    payerCard: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    },
    sidebar: {
      width: '300px',
      background: theme.sidebarBg,
      borderRight: `1px solid ${theme.sidebarBorder}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    },
    historyItem: {
      padding: '12px 16px',
      borderBottom: `1px solid ${theme.sidebarBorder}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
  };

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!tokenFromUrl) throw new Error('No token provided');

        await fetch(urls.security, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        const resp = await fetch(urls.fetchpaymentdetails, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (!resp.ok) throw new Error('Failed to fetch clinic details');
        const data = await resp.json();
        const ci = countryData[data.country] || countryData['Uganda'];
        setClinicDetails({
          healthFacilityName: data.clinic_name || '', country: data.country || 'Uganda',
          countryIso: ci.iso, district: data.district || '', town: data.town || '',
          subCounty: data.sub_county || '', currentBalance: data.current_balance || 0,
          currency: ci.currency, token: tokenFromUrl, modeAmount: '0',
        });
        await fetchAllowedPayers(tokenFromUrl);
        await fetchPaymentData(tokenFromUrl);
      } catch {
        setErrors({ general: 'Failed to load clinic details. Please check your link or contact support.' });
        setTimeout(() => navigate('/login'), 3000);
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  useEffect(() => () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
  }, []);

  useEffect(() => {
    if (showFinalStatus && statusTimer > 0) {
      statusTimerRef.current = setInterval(() => {
        setStatusTimer(prev => {
          if (prev <= 1) { clearInterval(statusTimerRef.current); window.location.reload(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (statusTimerRef.current) clearInterval(statusTimerRef.current); };
  }, [showFinalStatus, statusTimer]);

  useEffect(() => {
    if (activeMode !== 'wallet' && computedAmount !== null) {
      const s = String(computedAmount);
      setPaymentForm(p => ({ ...p, amount: s }));
      setRegistrationForm(p => ({ ...p, amount: s }));
    }
  }, [activeMode, employeeCount, computedAmount]);

  // ── API ──────────────────────────────────────────────────────────────────────
  const fetchPaymentData = async (token) => {
    try {
      setLoadingStats(true);
      const resp = await fetch(urls.paymentsdata, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.success) {
        if (Array.isArray(data.charges))
          setPaymentHistory([...data.charges].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setPaymentStats({ totalMonth: data.total_payments_this_month || 0, totalYear: data.total_payments_this_year || 0, totalTransactions: data.total_records || 0 });
        if (data.clinic) setClinicDetails(p => ({ ...p, healthFacilityName: data.clinic }));
        const clean = (data.mode_amount || '0').split('.')[0];
        setClinicDetails(p => ({ ...p, modeAmount: clean }));
        if (clean && clean !== '0') setPaymentForm(p => ({ ...p, amount: clean }));
      }
    } finally { setLoadingStats(false); }
  };

  const fetchAllowedPayers = async (token) => {
    try {
      setFetchingPayers(true);
      const resp = await fetch(urls.fetchallowedpayers, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!resp.ok) { setPayers([]); return; }
      const data = await resp.json();
      if (Array.isArray(data.payment_information)) {
        setPayers(data.payment_information.map((p, idx) => ({
          id: p.customer_id, customer_id: p.customer_id, email: p.email,
          displayName: `${p.first_name} ${p.middle_name || ''} ${p.last_name || ''}`.trim(),
          first_name: p.first_name, middle_name: p.middle_name, last_name: p.last_name,
          phone_country: p.phone_country, phone_number: p.phone_number,
          network: p.network || p.payment_methods?.[0]?.network || '',
          status: 'active', country_code: p.phone_country || '256',
          phoneLabel: `${p.first_name} ${p.last_name}`.trim(),
          anonymousIndex: idx + 1,
        })));
      } else setPayers([]);
    } catch { setPayers([]); }
    finally { setFetchingPayers(false); }
  };

  const handleDeletePayer = async () => {
    if (!pendingDeletePayer) return;
    const payer = pendingDeletePayer;
    setShowDeleteConfirm(false);
    setIsDeletingPayer(true);
    try {
      const payload = {
        token: clinicDetails.token,
        payer_details: { customer_id: payer.customer_id, phone_number: payer.phone_number, phone_country: payer.phone_country, network: payer.network, email: payer.email, first_name: payer.first_name, last_name: payer.last_name, display_name: payer.displayName },
        payment_mode_details: { active_mode: activeMode, employee_count: employeeCount, calculated_amount: computedAmount },
        timestamp: new Date().toISOString(),
      };
      const resp = await fetch(urls.deletepayer, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(await resp.text() || 'Failed to delete payer');
      const result = await resp.json();
      if (result.status === 'success') {
        setPayers(prev => prev.filter(p => p.customer_id !== payer.customer_id));
        showToast('Payer removed successfully.', 'success');
        if (selectedPayer?.customer_id === payer.customer_id) setSelectedPayer(null);
      } else throw new Error(result.message || 'Deletion failed');
    } catch (err) {
      showToast(`Failed to delete payer: ${err.message}`, 'error');
    } finally {
      setIsDeletingPayer(false);
      setPendingDeletePayer(null);
    }
  };

  const confirmPayment = async (chargeId) => {
    try {
      const resp = await fetch(urls.ConfirmPayment, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ charge_id: chargeId }) });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      let chargeStatus = null, chargeData = null;
      if (data.charge?.charge_response) { chargeData = data.charge.charge_response.response.data; chargeStatus = chargeData?.status; }
      else if (data.charge_details) { chargeData = data.charge_details; chargeStatus = data.charge_details.status; }
      else if (data.data) { chargeData = data.data; chargeStatus = data.data.status; }
      else { chargeStatus = data.status; chargeData = data; }
      if (chargeStatus === 'succeeded') await fetchPaymentData(clinicDetails.token);
      return { ...data, charge_details: chargeData, status: chargeStatus };
    } catch { return null; }
  };

  const startPaymentPolling = (chargeId, initial = null) => {
    setIsPolling(true); setPollingAttempts(0);
    if (initial) {
      const s = initial.status;
      if (s === 'succeeded' || s === 'failed') { handleConfirmationResponse({ charge_details: initial, status: s }, chargeId); return; }
    }
    setTimeout(async () => { const r = await confirmPayment(chargeId); handleConfirmationResponse(r, chargeId); }, 10000);
  };

  const scheduleNextPoll = (chargeId) => {
    pollingIntervalRef.current = setTimeout(async () => { const r = await confirmPayment(chargeId); handleConfirmationResponse(r, chargeId); }, 10000);
  };

  const handleConfirmationResponse = (data, chargeId) => {
    if (!data) { setPollingAttempts(p => p + 1); scheduleNextPoll(chargeId); return; }
    const status = data.charge_details?.status || data.status;
    const chargeData = data.charge_details || data;
    if (status === 'succeeded' || status === 'failed') {
      setConfirmationData({ ...data, charge_details: chargeData, status, clinic_balance_update: data.clinic_balance_update || chargeData?.balance_update });
      setIsPolling(false); setShowFinalStatus(true); setStatusTimer(40);
      if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => window.location.reload(), 40000);
    } else if (pollingAttempts < 12) {
      setPollingAttempts(p => p + 1); scheduleNextPoll(chargeId);
    } else {
      setConfirmationData({ charge_details: chargeData, status: 'timeout' });
      setIsPolling(false); setShowFinalStatus(true);
    }
  };

  const buildPaymentModePayload = () => {
    if (activeMode === 'wallet') return { payment_mode: 'wallet', employees_description: 'unlimited' };
    const isAbove10 = employeeCount === 'above10';
    return { payment_mode: activeMode, employee_count: isAbove10 ? 'above10' : parseInt(employeeCount), employees_description: isAbove10 ? 'above 10 employees' : `${employeeCount} employee${parseInt(employeeCount) > 1 ? 's' : ''}`, calculated_amount: computedAmount };
  };

  const handleSelectPayerForPayment = (payer) => {
    setSelectedPayer(payer);
    const amount = computedAmount !== null ? String(computedAmount) : (clinicDetails.modeAmount && clinicDetails.modeAmount !== '0' ? clinicDetails.modeAmount : '');
    setPaymentForm({ amount });
  };

  const handleBackToSelection = () => {
    setSelectedPayer(null); setShowNewPayerForm(false);
    setPaymentForm({ amount: '' }); setConfirmationData(null);
    setIsPolling(false); setPollingAttempts(0); setShowFinalStatus(false); setStatusTimer(40);
    setErrors({}); setNetworkWarning(''); setForceNetworkConfirmation(false);
    if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
    if (statusTimerRef.current) { clearInterval(statusTimerRef.current); statusTimerRef.current = null; }
  };

  const validateRegistrationForm = () => {
    const errs = {};
    if (!registrationForm.firstName || registrationForm.firstName.trim().length < 2) errs.firstName = 'First name required';
    if (!registrationForm.lastName || registrationForm.lastName.trim().length < 2) errs.lastName = 'Last name required';
    if (!registrationForm.phone) {
      errs.phone = 'Phone number is required.';
    } else {
      const ci = countryData[clinicDetails.country] || countryData['Uganda'];
      const digits = registrationForm.phone.replace(/\D/g, '');
      if (!digits.startsWith(ci.code)) errs.phone = `Must start with +${ci.code}`;
      else if (digits.length !== ci.code.length + 9) errs.phone = `Must have exactly 9 digits after +${ci.code}`;
    }
    if (!registrationForm.network) errs.network = 'Please select a mobile network.';
    if (activeMode === 'wallet' && (!registrationForm.amount || parseFloat(registrationForm.amount) <= 0)) errs.amount = 'Please enter a valid amount.';
    return errs;
  };

  const handleNewPayerRegistration = async (e) => {
    e.preventDefault();
    if (networkWarning && !forceNetworkConfirmation) { setErrors({ network: 'Please confirm your network selection.' }); return; }
    const errs = validateRegistrationForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      setLoading(true); setErrors({});
      const ci = countryData[clinicDetails.country] || countryData['Uganda'];
      let phone = registrationForm.phone.trim();
      if (!phone.startsWith('+')) phone = `+${phone}`;
      const cc = `+${ci.code}`;
      const userNumber = phone.startsWith(cc) ? phone.substring(cc.length) : phone;
      if (userNumber.length !== 9) throw new Error(`Phone must have exactly 9 digits after ${cc}.`);
      const cleanAmount = (computedAmount !== null ? String(computedAmount) : registrationForm.amount).split('.')[0];
      const payload = {
        token: clinicDetails.token, currency: clinicDetails.currency,
        clinicName: clinicDetails.healthFacilityName,
        first_name: registrationForm.firstName.trim(), last_name: registrationForm.lastName.trim(),
        network: registrationForm.network.toUpperCase(),
        phone: { country_code: ci.code, number: userNumber },
        amount: parseFloat(cleanAmount),
        ...buildPaymentModePayload(),
      };
      const resp = await fetch(urls.flutter_submit2, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(`Server error: ${await resp.text()}`);
      const data = await resp.json();
      if (data.success && data.charge?.charge_response) {
        const cd = data.charge.charge_response.response.data;
        if (cd?.id) { setView('paymentSuccess'); startPaymentPolling(cd.id, cd); setConfirmationData({ charge_details: cd, status: cd.status, charge_id: cd.id }); }
        else throw new Error('No charge ID returned');
      } else if (data.success || data.status === 'success' || data.status === 'pending') {
        const id = data.charge_id || data.id;
        if (id) { setView('paymentSuccess'); startPaymentPolling(id); }
        else throw new Error('No charge ID returned');
      } else throw new Error(data.message || data.msg || 'Registration or payment failed');
    } catch (err) {
      setErrors({ general: err.message || 'Something went wrong. Please contact support.' });
    } finally { setLoading(false); }
  };

  const handleChargePayment = async (e) => {
    e.preventDefault();
    const amount = computedAmount !== null ? computedAmount : parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { setErrors({ amount: 'Please enter a valid amount.' }); return; }
    try {
      setLoading(true); setErrors({});
      const payload = {
        token: clinicDetails.token, customer_id: selectedPayer.customer_id,
        amount: Math.round(amount), network: selectedPayer?.network?.toUpperCase() || '',
        currency: clinicDetails.currency, clinicName: clinicDetails.healthFacilityName,
        ...buildPaymentModePayload(),
      };
      const resp = await fetch(urls.chargeCustomer, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(`Server error: ${await resp.text()}`);
      const data = await resp.json();
      if (data.success && data.charge?.charge_response) {
        const cd = data.charge.charge_response.response.data;
        if (cd?.id) { setView('paymentSuccess'); startPaymentPolling(cd.id, cd); setConfirmationData({ charge_details: cd, status: cd.status, charge_id: cd.id }); }
        else throw new Error('No charge ID returned');
      } else if (data.success || data.status === 'success') {
        const id = data.data?.id || data.id;
        if (id) { setView('paymentSuccess'); startPaymentPolling(id); }
        else throw new Error('No charge ID returned');
      } else throw new Error(data.message || data.msg || 'Payment failed');
    } catch (err) { setErrors({ general: err.message || 'Error processing payment.' }); }
    finally { setLoading(false); }
  };

  const handleRegistrationInputChange = (e) => {
    const { name, value } = e.target; let v = value;
    if (name === 'amount') {
      v = value.replace(/\D/g, '');
    } else if (name === 'phone') {
      const ci = countryData[clinicDetails.country] || countryData['Uganda'];
      v = value.replace(/\D/g, '');
      if (!v.startsWith(ci.code)) v = ci.code + v;
      v = `+${v.substring(0, ci.code.length + 9)}`;
      if (v.length >= 6 && registrationForm.network) { const { warning } = validateNetworkPrefix(v, registrationForm.network); setNetworkWarning(warning); setForceNetworkConfirmation(false); }
    } else if (name === 'network') {
      if (registrationForm.phone) { const { warning } = validateNetworkPrefix(registrationForm.phone, value); setNetworkWarning(warning); setForceNetworkConfirmation(false); }
    }
    setRegistrationForm(p => ({ ...p, [name]: v }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(p => ({ ...p, [name]: name === 'amount' ? value.replace(/\D/g, '') : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (ds) => new Date(ds).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0';
    return Math.round(numValue).toLocaleString('en-UG');
  };

  // ── Plan Selector ────────────────────────────────────────────────────────────
  const renderPlanSelector = () => (
    <AnimatedCard delay={100}>
      <div style={{ ...styles.card, marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PAYMENT_MODES.map((mode, idx) => {
              const isActive = activeMode === mode.id;
              return (
                <FloatingElement key={mode.id} delay={idx * 0.05}>
                  <RippleEffect>
                    <button onClick={() => { setActiveMode(mode.id); setShowModeInfo(false); }}
                      style={styles.modeButton(isActive)}>
                      <FontAwesomeIcon icon={mode.icon} style={{ fontSize: '11px' }} />
                      {mode.label}
                      {mode.popular && (
                        <span style={{ ...styles.badge('orange'), padding: '2px 6px', fontSize: '10px', marginLeft: '6px' }}>Popular</span>
                      )}
                    </button>
                  </RippleEffect>
                </FloatingElement>
              );
            })}
          </div>
          <AnimatedButton onClick={() => setShowModeInfo(p => !p)}
            style={{ ...styles.actionButton, background: theme.tableHeader, color: theme.textSecondary, border: `1px solid ${theme.cardBorder}` }}>
            <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '11px' }} /> Pricing
          </AnimatedButton>
        </div>
      </div>
    </AnimatedCard>
  );

  // ── Pricing Info Panel ───────────────────────────────────────────────────────
  const renderPricingInfo = () => {
    if (!showModeInfo) return null;
    const getModeInfo = () => {
      if (activeMode === 'wallet') {
        return {
          title: 'Wallet Pricing',
          rates: [
            { label: '1 active employee', amount: '700 UGX/day' },
            { label: '2+ active employees', amount: '600 UGX/employee/day' },
          ],
          note: 'No commitment required. Top up anytime.'
        };
      }
      const cfg = PLAN_CONFIG[activeMode];
      const days = cfg.months * 30;
      const twoEmployeeAmount = activeMode === '1month' ? 38000 : Math.round(days * cfg.rateMulti * 2 * 0.9);
      return {
        title: `${activeMode === '1month' ? 'Monthly' : activeMode === '3months' ? '3-Month' : activeMode === '6months' ? '6-Month' : activeMode === '9months' ? '9-Month' : 'Annual'} Plan`,
        rates: [
          { label: '1 employee', amount: `${(days * 700).toLocaleString()} UGX` },
          { label: '2 employees', amount: `${twoEmployeeAmount.toLocaleString()} UGX` },
          { label: '3–10 employees', amount: `${days} × ${cfg.rateMulti} × count − 10%` },
          { label: 'Above 10', amount: `${cfg.flatAbove10.toLocaleString()} UGX (flat)` },
        ],
        note: 'Best value for stable teams. No daily deductions.'
      };
    };
    const info = getModeInfo();
    return (
      <AnimatedCard delay={150}>
        <div style={{ ...styles.card, marginBottom: '20px', background: theme.tableHeader, border: `1px solid ${theme.tableBorder}` }}>
          <div style={styles.sectionTitle}>
            <FontAwesomeIcon icon={faTag} style={{ fontSize: '14px', color: theme.info }} />
            <span>{info.title}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {info.rates.map((rate, idx) => (
              <FloatingElement key={idx} delay={idx * 0.1}>
                <div style={{ background: theme.cardBg, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${theme.cardBorder}` }}>
                  <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>{rate.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary }}>{rate.amount}</div>
                </div>
              </FloatingElement>
            ))}
          </div>
          <div style={{ background: theme.infoLight, borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faInfoCircle} style={{ color: theme.info, fontSize: '12px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: theme.info, fontWeight: '500' }}>{info.note}</span>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  // ── Employee Selector ────────────────────────────────────────────────────────
  const renderEmployeeSelector = () => {
    if (activeMode === 'wallet') return null;
    const options = [
      ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} Employee${i > 0 ? 's' : ''}` })),
      { value: 'above10', label: 'Above 10 Employees (Flat Rate)' },
    ];
    return (
      <AnimatedCard delay={200}>
        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={styles.label}>Number of Employees</label>
              <select value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} style={styles.select}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {computedAmount !== null && (
              <div style={{ ...styles.statBox, textAlign: 'right', minWidth: '160px' }}>
                <div style={styles.statLabel}>Plan Total</div>
                <div style={{ ...styles.statValue, fontSize: '22px', color: theme.info, transition: 'all 0.3s ease' }}>
                  {formatCurrency(animatedAmount)}
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{clinicDetails.currency}</div>
              </div>
            )}
          </div>
        </div>
      </AnimatedCard>
    );
  };

  // ── Payer Selection ──────────────────────────────────────────────────────────
  const renderPayerSelection = () => {
    if (selectedPayer) return renderPaymentForm();
    if (showNewPayerForm) return renderNewPayerForm();

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={styles.sectionTitle}>Select Payer</div>
            <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '-10px' }}>Choose a registered payer or add a new one</div>
          </div>
          <GlowingBorder isActive={showNewPayerForm}>
            <RippleEffect>
              <button 
                onClick={() => setShowNewPayerForm(true)} 
                style={{
                  ...styles.primaryButton,
                  background: theme.accent,
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '13px' }} /> New Payer
              </button>
            </RippleEffect>
          </GlowingBorder>
        </div>

        {renderPlanSelector()}
        {renderPricingInfo()}
        {renderEmployeeSelector()}

        {fetchingPayers ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '28px', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '13px' }}>Loading payers...</div>
          </div>
        ) : payers.length === 0 ? (
          <AnimatedCard delay={300}>
            <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: '56px', height: '56px', background: theme.tableHeader, borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FontAwesomeIcon icon={faUser} style={{ fontSize: '24px', color: theme.textMuted }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>No Payers Found</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Get started by registering a new payer</div>
              <RippleEffect>
                <button onClick={() => setShowNewPayerForm(true)} style={styles.primaryButton}>
                  <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '13px' }} /> Register New Payer
                </button>
              </RippleEffect>
            </div>
          </AnimatedCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {payers.map((payer, idx) => (
              <AnimatedCard key={payer.customer_id} delay={idx * 50}>
                <div 
                  style={{ ...styles.payerCard, transform: hoveredPayer === payer.customer_id ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hoveredPayer === payer.customer_id ? '0 8px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)' }}
                  onMouseEnter={() => setHoveredPayer(payer.customer_id)}
                  onMouseLeave={() => setHoveredPayer(null)}
                >
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '22px', background: theme.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FontAwesomeIcon icon={faUser} style={{ color: theme.info, fontSize: '18px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px' }}>
                          Phone Number {payer.anonymousIndex}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FontAwesomeIcon icon={faPhoneAlt} style={{ fontSize: '10px', color: theme.textMuted }} />
                          <span style={{ fontSize: '12.5px', color: theme.textSecondary }}>+{payer.phone_country} {payer.phone_number}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        ...styles.badge(payer.network?.toLowerCase() === 'mtn' ? 'orange' : 'red'),
                        fontSize: '11px',
                      }}>
                        {payer.network?.toUpperCase() || 'N/A'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <RippleEffect>
                          <button
                            onClick={() => { setPendingDeletePayer(payer); setShowDeleteConfirm(true); }}
                            style={{ ...styles.actionButton, background: theme.dangerLight, color: theme.danger, border: `1px solid ${theme.danger}30` }}>
                            <FontAwesomeIcon icon={faTrashAlt} style={{ fontSize: '11px' }} /> Remove
                          </button>
                        </RippleEffect>
                        <RippleEffect>
                          <button onClick={() => handleSelectPayerForPayment(payer)}
                            style={{ ...styles.actionButton, background: theme.info, color: '#fff' }}>
                            Pay <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '10px' }} />
                          </button>
                        </RippleEffect>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── New Payer Form ────────────────────────────────────────────────────────────
  const renderNewPayerForm = () => (
    <div>
      <RippleEffect>
        <button onClick={() => setShowNewPayerForm(false)} disabled={loading} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '11px' }} /> Back to Payers
        </button>
      </RippleEffect>

      {renderPlanSelector()}
      {renderPricingInfo()}
      {renderEmployeeSelector()}

      {networkWarning && (
        <AnimatedCard delay={100}>
          <div style={{ background: theme.warningLight, border: `1px solid ${theme.warning}40`, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: theme.warning, flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ color: theme.warning, fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Network Mismatch</div>
    
              <div style={{ color: theme.textSecondary, fontSize: '12px', marginBottom: '10px' }}>{networkWarning}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={forceNetworkConfirmation} onChange={e => setForceNetworkConfirmation(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                <span style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: '500' }}>I confirm my selection is correct</span>
              </label>
            </div>
          </div>
        </AnimatedCard>
      )}

      <form onSubmit={handleNewPayerRegistration}>
        <AnimatedCard delay={200}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>
              <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '14px', color: theme.info }} />
              Register New Payer
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={styles.label}>First Name *</label>
                <input type="text" name="firstName" value={registrationForm.firstName} onChange={handleRegistrationInputChange}
                  style={{ ...styles.input, ...(errors.firstName ? styles.inputError : {}) }} placeholder="John" disabled={loading} />
                {errors.firstName && <span style={styles.errorText}>{errors.firstName}</span>}
              </div>
              <div>
                <label style={styles.label}>Last Name *</label>
                <input type="text" name="lastName" value={registrationForm.lastName} onChange={handleRegistrationInputChange}
                  style={{ ...styles.input, ...(errors.lastName ? styles.inputError : {}) }} placeholder="Doe" disabled={loading} />
                {errors.lastName && <span style={styles.errorText}>{errors.lastName}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={styles.label}>Phone Number *</label>
                <input type="tel" name="phone" value={registrationForm.phone} onChange={handleRegistrationInputChange}
                  style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }} placeholder="+2567XXXXXXXX" disabled={loading} />
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Include country code</div>
                {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
              </div>
              <div>
                <label style={styles.label}>Mobile Network *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['mtn', 'airtel'].map(net => (
                    <label key={net} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '9px', border: `1px solid ${registrationForm.network === net ? theme.info : theme.cardBorder}`,
                      borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                      background: registrationForm.network === net ? theme.infoLight : theme.cardBg,
                      fontSize: '13px', fontWeight: '600',
                      color: registrationForm.network === net ? theme.info : theme.textSecondary,
                      transition: 'all 0.15s ease',
                    }}>
                      <input type="radio" name="network" value={net} checked={registrationForm.network === net}
                        onChange={handleRegistrationInputChange} style={{ display: 'none' }} disabled={loading} />
                      {net.toUpperCase()}
                    </label>
                  ))}
                </div>
                {errors.network && <span style={styles.errorText}>{errors.network}</span>}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>Amount ({clinicDetails.currency}) *</label>
              {activeMode !== 'wallet' && computedAmount !== null ? (
                <div style={{ padding: '14px 16px', borderRadius: '8px', background: theme.tableHeader, border: `1px solid ${theme.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: theme.textMuted }}>Plan Amount</span>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary }}>{formatCurrency(computedAmount)} {clinicDetails.currency}</span>
                </div>
              ) : (
                <>
                  <input type="text" name="amount" value={registrationForm.amount} onChange={handleRegistrationInputChange}
                    style={{ ...styles.input, fontSize: '15px', ...(errors.amount ? styles.inputError : {}) }} placeholder="Enter amount" disabled={loading} />
                  {errors.amount && <span style={styles.errorText}>{errors.amount}</span>}
                </>
              )}
            </div>

            {errors.general && (
              <div style={{ background: theme.dangerLight, border: `1px solid ${theme.danger}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faTimesCircle} style={{ color: theme.danger, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: theme.danger }}>{errors.general}</span>
              </div>
            )}

            <RippleEffect>
              <button type="submit" disabled={loading || (networkWarning && !forceNetworkConfirmation)}
                style={{
                  ...styles.primaryButton, width: '100%', justifyContent: 'center', padding: '12px',
                  background: (loading || (networkWarning && !forceNetworkConfirmation)) ? theme.textMuted : theme.info,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || (networkWarning && !forceNetworkConfirmation)) ? 0.7 : 1,
                }}>
                {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Processing...</> : 'Register & Pay'}
              </button>
            </RippleEffect>
          </div>
        </AnimatedCard>
      </form>
    </div>
  );

  // ── Payment Form (existing payer) ────────────────────────────────────────────
  const renderPaymentForm = () => (
    <div>
      <RippleEffect>
        <button onClick={handleBackToSelection} disabled={loading} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '11px' }} /> Back to Payers
        </button>
      </RippleEffect>

      {renderPlanSelector()}
      {renderPricingInfo()}
      {renderEmployeeSelector()}

      <AnimatedCard delay={300}>
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${theme.tableBorder}` }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '26px', background: theme.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FontAwesomeIcon icon={faUser} style={{ color: theme.info, fontSize: '22px' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px' }}>Phone Number {selectedPayer?.anonymousIndex}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12.5px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ fontSize: '10px' }} />
                  +{selectedPayer?.phone_country} {selectedPayer?.phone_number}
                </span>
                <span style={styles.badge(selectedPayer?.network?.toLowerCase() === 'mtn' ? 'orange' : 'red')}>
                  {selectedPayer?.network?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleChargePayment}>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Amount ({clinicDetails.currency}) *</label>
              {activeMode !== 'wallet' && computedAmount !== null ? (
                <div style={{ padding: '14px 16px', borderRadius: '8px', background: theme.tableHeader, border: `1px solid ${theme.tableBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: theme.textMuted }}>Plan Amount</span>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary }}>{formatCurrency(computedAmount)} {clinicDetails.currency}</span>
                </div>
              ) : (
                <>
                  <input type="text" name="amount" value={paymentForm.amount} onChange={handlePaymentInputChange}
                    style={{ ...styles.input, fontSize: '15px', ...(errors.amount ? styles.inputError : {}) }} placeholder="Enter amount" disabled={loading} />
                  {errors.amount && <span style={styles.errorText}>{errors.amount}</span>}
                </>
              )}
            </div>

            {errors.general && (
              <div style={{ background: theme.dangerLight, border: `1px solid ${theme.danger}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faTimesCircle} style={{ color: theme.danger, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: theme.danger }}>{errors.general}</span>
              </div>
            )}

            <RippleEffect>
              <button type="submit" disabled={loading}
                style={{ ...styles.primaryButton, width: '100%', justifyContent: 'center', padding: '12px', background: loading ? theme.textMuted : theme.info, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Processing...</> : 'Confirm Payment'}
              </button>
            </RippleEffect>
          </form>
        </div>
      </AnimatedCard>
    </div>
  );

  // ── Payment Success / Polling ─────────────────────────────────────────────────
  const renderPaymentSuccess = () => {
    const status = confirmationData?.charge_details?.status || confirmationData?.status;
    const isSucceeded = status === 'succeeded';
    const isFailed = status === 'failed';
    const isPending = !isSucceeded && !isFailed;

    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center' }}>
        {isPolling && isPending && (
          <AnimatedCard delay={0}>
            <div style={styles.card}>
              <div className="pulse-animation" style={{ width: '72px', height: '72px', borderRadius: '36px', background: theme.warningLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <FontAwesomeIcon icon={faClock} style={{ fontSize: '32px', color: theme.warning }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>Confirming Payment...</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>Please check your phone and approve the payment prompt</div>
              <div style={{ background: theme.warningLight, border: `1px solid ${theme.warning}30`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: theme.warning, fontWeight: '600', marginBottom: '2px' }}>Checking payment status</div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>Attempt {pollingAttempts + 1} of 12</div>
              </div>
              <div style={{ width: '100%', height: '4px', background: theme.tableBorder, borderRadius: '2px', overflow: 'hidden' }}>
                <div className="progress-bar" style={{ width: `${(pollingAttempts / 12) * 100}%`, height: '100%', background: theme.warning, borderRadius: '2px' }} />
              </div>
            </div>
          </AnimatedCard>
        )}

        {(showFinalStatus || isSucceeded || isFailed) && (
          <AnimatedCard delay={0}>
            <div style={styles.card}>
              <div className={`bounce-animation`} style={{ width: '72px', height: '72px', borderRadius: '36px', background: isSucceeded ? theme.accentLight : theme.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <FontAwesomeIcon icon={isSucceeded ? faCheckCircle : faTimesCircle} style={{ fontSize: '36px', color: isSucceeded ? theme.accent : theme.danger }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: isSucceeded ? theme.accent : theme.danger, marginBottom: '8px' }}>
                {isSucceeded ? 'Payment Successful' : 'Payment Failed'}
              </div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>
                {isSucceeded ? 'Your payment has been processed successfully.' : 'Something went wrong. Please try again.'}
              </div>
              {showFinalStatus && (
                <div style={{ background: theme.tableHeader, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Auto-refreshing in {statusTimer}s</div>
                  <div style={{ width: '100%', height: '4px', background: theme.tableBorder, borderRadius: '2px', overflow: 'hidden' }}>
                    <div className="countdown-bar" style={{ width: `${((40 - statusTimer) / 40) * 100}%`, height: '100%', background: statusTimer <= 10 ? theme.danger : statusTimer <= 20 ? theme.warning : theme.accent, borderRadius: '2px' }} />
                  </div>
                </div>
              )}
              {!showFinalStatus && (
                <RippleEffect>
                  <button onClick={handleBackToSelection} style={styles.primaryButton}>
                    {isSucceeded ? 'Make Another Payment' : 'Try Again'}
                  </button>
                </RippleEffect>
              )}
            </div>
          </AnimatedCard>
        )}
      </div>
    );
  };

  // ── Sidebar Component (Non-collapsible) ────────────────────────────────────────
  const renderSidebar = () => (
    <div style={styles.sidebar}>
      {/* Clinic Info Header */}
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${theme.sidebarBorder}`, textAlign: 'left' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: theme.textPrimary, marginBottom: '4px' }}>
          {clinicDetails.healthFacilityName || 'Loading...'}
        </div>
        <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{clinicDetails.country || 'Location'}</span>
          <span>•</span>
          <span>{clinicDetails.currency}</span>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={styles.statLabel}>Current Balance</div>
   
          <div className="balance-counter" style={{ ...styles.statValue, fontSize: '24px', color: theme.accent }}>{formatCurrency(clinicDetails.currentBalance)}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={styles.statLabel}>This Month</div>
            <div style={{ ...styles.statValue, fontSize: '14px' }}>{formatCurrency(paymentStats.totalMonth)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.statLabel}>This Year</div>
            <div style={{ ...styles.statValue, fontSize: '14px' }}>{formatCurrency(paymentStats.totalYear)}</div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faHistory} style={{ color: theme.textMuted, fontSize: '13px' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Transactions
            </span>
            <span style={{ ...styles.badge('gray'), fontSize: '10px', padding: '2px 6px' }}>{paymentStats.totalTransactions}</span>
          </div>

          {loadingStats ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <FontAwesomeIcon icon={faSpinner} spin style={{ color: theme.textMuted, fontSize: '18px' }} />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '12px' }}>
              <FontAwesomeIcon icon={faReceipt} style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }} />
              <div>No transactions yet</div>
            </div>
          ) : (
            paymentHistory.slice(0, 10).map((payment, idx) => (
              <div 
                key={idx} 
                style={styles.historyItem}
                className="history-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={styles.badge(payment.status === 'succeeded' ? 'green' : payment.status === 'failed' ? 'red' : 'orange')}>
                      {payment.status === 'succeeded' ? '✓' : payment.status === 'failed' ? '✗' : '⌛'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textPrimary }}>
                      {formatCurrency(payment.amount || 0)} {clinicDetails.currency}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: theme.textMuted }}>{formatDate(payment.created_at)}</span>
                </div>
                <div style={{ fontSize: '10px', color: theme.textMuted }}>
                  {formatTime(payment.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── Loading State ─────────────────────────────────────────────────────────────
  if (loading && !clinicDetails.token) {
    return (
      <div style={{ minHeight: '100vh', background: theme.mainBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading Payment Center...</div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: theme.mainBg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${theme.sidebarBorder}; }
        ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; border-radius: 4px; }
        
        /* Fade In Animation */
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Modal Slide In */
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Spin Animation */
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Slide Up In */
        @keyframes slideUpIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        /* Card Animation */
        .animated-card {
          animation: slideUpIn 0.4s ease forwards;
          opacity: 0;
        }
        
        /* Button Hover Animation */
        .animated-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .animated-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .animated-button:active {
          transform: translateY(1px);
        }
        
        /* Ripple Effect */
        .ripple-container {
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple-animation 0.6s linear;
          pointer-events: none;
        }
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        /* Floating Animation */
        .floating-element {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        
        /* Pulse Animation */
        .pulse-animation {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        /* Bounce Animation */
        .bounce-animation {
          animation: bounce 0.5s ease-out;
        }
        @keyframes bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        /* Progress Bar Animation */
        .progress-bar {
          animation: progressPulse 1s ease-in-out infinite;
        }
        @keyframes progressPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .countdown-bar {
          animation: countdown linear;
        }
        
        /* Glowing Border */
        .glowing-border {
          position: relative;
          border-radius: 10px;
        }
        .glowing-border.active {
          animation: glowPulse 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        
        /* Balance Counter Animation */
        .balance-counter {
          animation: countUp 0.5s ease-out;
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* History Item Hover */
        .history-item {
          transition: all 0.3s ease;
        }
        .history-item:hover {
          background: ${theme.tableHeader};
          transform: translateX(4px);
        }
        
        /* Input Focus Animation */
        input:focus, select:focus, textarea:focus { 
          border-color: ${theme.info} !important; 
          box-shadow: 0 0 0 3px ${theme.infoLight};
          transition: all 0.2s ease;
        }
        
        /* Button Active State */
        button:active:not(:disabled) { 
          transform: scale(0.98);
          transition: transform 0.05s ease;
        }
        
        /* Loading Spinner */
        .spinner {
          animation: spin 0.8s linear infinite;
        }
        
        /* Skeleton Loading */
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        /* Scale Animation */
        .scale-up {
          animation: scaleUp 0.3s ease-out;
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Sidebar - Non-collapsible */}
      {renderSidebar()}

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Scrollable Main Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
        }} className="fade-in">
          
          {/* Header with Animation */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px', background: 'linear-gradient(135deg, #2563eb, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              PAYMENT CENTER
            </h1>
            <p style={{ fontSize: '13px', color: theme.textMuted }}>
              Manage payments and view transaction history
            </p>
          </div>

          {errors.general && view !== 'selectPayer' && (
            <div style={{ background: theme.dangerLight, border: `1px solid ${theme.danger}30`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: theme.danger }} />
              <span style={{ color: theme.danger, fontSize: '13px' }}>{errors.general}</span>
            </div>
          )}

          {view === 'selectPayer' && renderPayerSelection()}
          {view === 'paymentSuccess' && renderPaymentSuccess()}
        </div>
      </div>

      {/* Delete Confirm Modal with Animation */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} className="fade-in">
          <div style={styles.modalContent} className="scale-up">
            <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: theme.danger, fontSize: '18px' }} />
              Remove Payer
            </div>
            <div style={{ fontSize: '13.5px', color: theme.textSecondary, marginBottom: '24px', lineHeight: '1.6' }}>
              Remove <strong>Phone Number {pendingDeletePayer?.anonymousIndex}</strong>? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <RippleEffect>
                <button onClick={() => { setShowDeleteConfirm(false); setPendingDeletePayer(null); }}
                  style={{ padding: '9px 18px', background: theme.tableHeader, border: `1px solid ${theme.cardBorder}`, borderRadius: '8px', color: theme.textPrimary, fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </RippleEffect>
              <RippleEffect>
                <button onClick={handleDeletePayer} disabled={isDeletingPayer}
                  style={{ ...styles.dangerButton, padding: '9px 18px', fontSize: '13px', opacity: isDeletingPayer ? 0.7 : 1 }}>
                  {isDeletingPayer && <FontAwesomeIcon icon={faSpinner} spin />}
                  Remove
                </button>
              </RippleEffect>
            </div>
          </div>
        </div>
      )}

      {/* Toast with Slide Animation */}
      {toast.show && (
        <div className="scale-up" style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? theme.accentLight : toast.type === 'error' ? theme.dangerLight : theme.infoLight,
          border: `1px solid ${toast.type === 'success' ? theme.accent + '50' : toast.type === 'error' ? theme.danger + '50' : theme.info + '50'}`,
          borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', animation: 'slideUpIn 0.2s ease',
          fontSize: '13px', fontWeight: '500', maxWidth: '360px',
          color: toast.type === 'success' ? theme.accent : toast.type === 'error' ? theme.danger : theme.info,
        }}>
          <FontAwesomeIcon icon={toast.type === 'success' ? faCheckCircle : toast.type === 'error' ? faTimesCircle : faInfoCircle} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: '1.4' }}>{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'info' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: '4px', color: 'inherit' }}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '11px' }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentNew;