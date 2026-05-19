import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import Topbar from './Topbar';

// ─── MOBILE DETECTION HOOK ───────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
};

const StockTracking = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [stockData, setStockData] = useState(null);
  const [allStockData, setAllStockData] = useState(null);
  const [fetchingAllStock, setFetchingAllStock] = useState(false);
  const [fetchingDrugsInOut, setFetchingDrugsInOut] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [error, setError] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState({ visible: false, feature: '' });
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [physicalInputs, setPhysicalInputs] = useState({});
  const [discrepancyResults, setDiscrepancyResults] = useState(null);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [selectedDrugFilter, setSelectedDrugFilter] = useState('all');
  const [drugOptions, setDrugOptions] = useState([]);
  const [stockLevelFilter, setStockLevelFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [urlToken, setUrlToken] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Stock Movements filters ──
  const [movementDrugSearch, setMovementDrugSearch] = useState('');
  const [movementDrugFilter, setMovementDrugFilter] = useState('all');
  const [movementDrugSuggestions, setMovementDrugSuggestions] = useState([]);
  const [showMovementDrugSuggestions, setShowMovementDrugSuggestions] = useState(false);
  const [movementDateMode, setMovementDateMode] = useState('all');
  const [movementSingleDate, setMovementSingleDate] = useState('');
  const [movementStartDate, setMovementStartDate] = useState('');
  const [movementEndDate, setMovementEndDate] = useState('');
  const [movementFiltersApplied, setMovementFiltersApplied] = useState({ drugFilter: 'all', dateMode: 'all', singleDate: '', startDate: '', endDate: '' });
  const [availableDates, setAvailableDates] = useState([]);

  // ── Drugs In/Out filters ──
  const [drugsInOutData, setDrugsInOutData] = useState(null);
  const [inOutDrugSearch, setInOutDrugSearch] = useState('');
  const [inOutDrugId, setInOutDrugId] = useState('all');
  const [inOutDrugSuggestions, setInOutDrugSuggestions] = useState([]);
  const [showInOutDrugSuggestions, setShowInOutDrugSuggestions] = useState(false);
  const [inOutDateMode, setInOutDateMode] = useState('all');
  const [inOutSingleDate, setInOutSingleDate] = useState('');
  const [inOutStartDate, setInOutStartDate] = useState('');
  const [inOutEndDate, setInOutEndDate] = useState('');
  const [inOutDateError, setInOutDateError] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ drugId: 'all', startDate: '', endDate: '' });
  const [inOutOpeningStock, setInOutOpeningStock] = useState(null);
  const [inOutExpanded, setInOutExpanded] = useState({});
  const [inOutSummary, setInOutSummary] = useState(null);

  // ── Drugs to Buy ──
  const [drugsToBuyPeriod, setDrugsToBuyPeriod] = useState('critical');
  const [ignoreWarningPoints, setIgnoreWarningPoints] = useState(false);
  const [fetchingIgnoreMode, setFetchingIgnoreMode] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');

  // ─── SET MOBILE BROWSER BAR WHITE ────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', '#ffffff');

      let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatusBar) {
        metaStatusBar = document.createElement('meta');
        metaStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaStatusBar);
      }
      metaStatusBar.setAttribute('content', 'default');
    }
  }, [isMobile]);

  // ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
  const colors = {
    blue: {
      sidebarBg: '#0a1e4a', sidebarBorder: '#1e3a8a',
      activeNavBg: '#2563eb', activeNavText: '#ffffff',
      inactiveNavText: '#e0e7ff', navHoverBg: '#1e3a8a',
      sectionHeaderText: '#94a3b8', mainBg: '#f8fafc',
      cardBg: '#ffffff', cardBorder: '#e2e8f0',
      accent: '#16a34a', accentLight: '#dcfce7', accentDark: '#14532d',
      danger: '#dc2626', dangerLight: '#fef2f2',
      warning: '#d97706', warningLight: '#fffbeb',
      info: '#2563eb', infoLight: '#eff6ff',
      textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
      headerBg: '#ffffff', tableHeader: '#f1f5f9',
      tableRowHover: '#f8fafc', tableBorder: '#e2e8f0',
      badgeGreen: { bg: '#dcfce7', text: '#166534' },
      badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
      badgeGray: { bg: '#f1f5f9', text: '#475569' },
      modalOverlay: 'rgba(0,0,0,0.5)', modalBg: '#ffffff',
      sidebarText: '#ffffff', sidebarTextMuted: '#a5b4fc',
      filterSection: '#0d2257',
      collapseButtonBg: '#1e3a8a', collapseButtonHover: '#2563eb', collapseButtonText: '#ffffff',
      tooltipBg: '#1e293b', tooltipText: '#ffffff',
      iconBright: '#fbbf24', iconHover: '#f59e0b',
    },
    white: {
      sidebarBg: '#ffffff', sidebarBorder: '#e2e8f0',
      activeNavBg: '#f1f5f9', activeNavText: '#0f172a',
      inactiveNavText: '#475569', navHoverBg: '#f8fafc',
      sectionHeaderText: '#64748b', mainBg: '#f8fafc',
      cardBg: '#ffffff', cardBorder: '#e2e8f0',
      accent: '#16a34a', accentLight: '#dcfce7', accentDark: '#14532d',
      danger: '#dc2626', dangerLight: '#fef2f2',
      warning: '#d97706', warningLight: '#fffbeb',
      info: '#2563eb', infoLight: '#eff6ff',
      textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
      headerBg: '#ffffff', tableHeader: '#f1f5f9',
      tableRowHover: '#f8fafc', tableBorder: '#e2e8f0',
      badgeGreen: { bg: '#dcfce7', text: '#166534' },
      badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
      badgeGray: { bg: '#f1f5f9', text: '#475569' },
      modalOverlay: 'rgba(0,0,0,0.5)', modalBg: '#ffffff',
      sidebarText: '#0f172a', sidebarTextMuted: '#64748b',
      filterSection: '#f8fafc',
      collapseButtonBg: '#e2e8f0', collapseButtonHover: '#cbd5e1', collapseButtonText: '#0f172a',
      tooltipBg: '#1e293b', tooltipText: '#ffffff',
      iconBright: '#f59e0b', iconHover: '#d97706',
    }
  };

  // On mobile, always use white theme
  const effectiveTheme = isMobile ? 'white' : currentTheme;
  const theme = colors[effectiveTheme];

  // ─── SHARED STYLES ──────────────────────────────────────────────────────────
  const styles = {
    card: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px', padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    mobileCard: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px', padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    tableWrapper: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    th: {
      padding: '12px 16px', textAlign: 'left', fontSize: '11px',
      fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em',
      color: theme.textSecondary, background: theme.tableHeader,
      borderBottom: `1px solid ${theme.tableBorder}`, whiteSpace: 'nowrap',
    },
    td: {
      padding: '13px 16px', fontSize: '13.5px', color: theme.textPrimary,
      borderBottom: `1px solid ${theme.tableBorder}`, verticalAlign: 'middle',
    },
    sectionTitle: {
      fontSize: '15px', fontWeight: '700', color: theme.textPrimary,
      marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    badge: (type) => {
      const map = { green: theme.badgeGreen, red: theme.badgeRed, orange: theme.badgeOrange, blue: theme.badgeBlue, gray: theme.badgeGray };
      const c = map[type] || map.gray;
      return { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', background: c.bg, color: c.text };
    },
    statCard: () => ({
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px', padding: '20px 24px', display: 'flex',
      flexDirection: 'column', gap: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: '1', minWidth: '0',
    }),
    navItem: (active, collapsed) => ({
      display: 'flex', alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: collapsed ? '0' : '12px', padding: collapsed ? '12px 0' : '10px 14px',
      borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px',
      fontWeight: active ? '600' : '500',
      color: active ? theme.activeNavText : theme.inactiveNavText,
      background: active ? theme.activeNavBg : 'transparent',
      transition: 'all 0.15s ease', textDecoration: 'none', border: 'none',
      width: '100%', textAlign: collapsed ? 'center' : 'left', marginBottom: '2px',
    }),
    sectionHeader: (collapsed) => ({
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: '0.08em', color: theme.sectionHeaderText,
      padding: collapsed ? '0' : '0 14px', marginBottom: '8px', marginTop: '12px',
      textAlign: collapsed ? 'center' : 'left',
    }),
    filterButton: (active) => ({
      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      border: `1px solid ${active ? theme.info : theme.cardBorder}`,
      background: active ? theme.infoLight : 'transparent',
      color: active ? theme.info : theme.textSecondary,
      cursor: 'pointer', transition: 'all 0.15s ease',
    }),
    select: {
      padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`,
      fontSize: '13px', color: theme.textPrimary, background: theme.cardBg,
      outline: 'none', cursor: 'pointer',
    },
    inputBase: {
      padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`,
      fontSize: '13px', color: theme.textPrimary, background: theme.cardBg, outline: 'none',
    },
    suggestionsContainer: {
      position: 'absolute', top: '100%', left: 0, right: 0,
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '8px', maxHeight: '220px', overflowY: 'auto',
      zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '4px',
    },
    suggestionItem: {
      padding: '10px 12px', cursor: 'pointer', fontSize: '13px',
      borderBottom: `1px solid ${theme.tableBorder}`,
    },
    modalOverlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: theme.modalOverlay, display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    },
    modalContent: {
      background: theme.modalBg, borderRadius: '16px', width: '90%',
      maxWidth: '1200px', maxHeight: '90vh', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
    },
    modalHeader: {
      padding: '20px 24px', borderBottom: `1px solid ${theme.cardBorder}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: theme.tableHeader,
    },
    modalBody: { padding: '24px', overflowY: 'auto', flex: 1 },
    modalFooter: {
      padding: '16px 24px', borderTop: `1px solid ${theme.cardBorder}`,
      display: 'flex', justifyContent: 'flex-end', gap: '12px',
      background: theme.tableHeader,
    },
    closeButton: {
      background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
      color: theme.textSecondary, width: '36px', height: '36px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
    },
    collapseButton: {
      background: theme.collapseButtonBg, border: 'none', color: theme.collapseButtonText,
      fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', padding: '10px 14px',
      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease', minWidth: '40px', height: '40px',
    },
    tooltip: {
      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
      marginLeft: '12px', padding: '8px 12px', background: theme.tooltipBg,
      color: theme.tooltipText, fontSize: '12px', fontWeight: '500', borderRadius: '6px',
      whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: `1px solid ${theme.sidebarBorder}`,
    },
    applyButton: {
      padding: '9px 22px', background: theme.accent, border: 'none', borderRadius: '8px',
      color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
      transition: 'all 0.15s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
    },
    filterPanel: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
      display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap',
    },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '160px' },
    filterLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textSecondary },
    dateRow: {
      display: 'flex', gap: '8px', alignItems: 'center', flexDirection: 'row',
    },
    periodSelector: {
      display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 16px',
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
      borderRadius: '40px', marginBottom: '20px', flexWrap: 'wrap',
    },
    periodButton: (active) => ({
      padding: '8px 20px', borderRadius: '30px', fontSize: '13px', fontWeight: '600',
      border: 'none', background: active ? theme.info : 'transparent',
      color: active ? '#fff' : theme.textSecondary, cursor: 'pointer', transition: 'all 0.2s ease',
    }),
    dateRangeInput: {
      padding: '8px 8px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`,
      fontSize: '12px', color: theme.textPrimary, background: theme.cardBg, outline: 'none',
      width: '130px', flexShrink: 0,
    },
    filterSummaryBar: {
      padding: '10px 16px', background: theme.infoLight,
      border: `1px solid ${effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight}`,
      borderRadius: '8px', fontSize: '12px', color: theme.info, marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: '8px',
    },
    emptyState: {
      padding: '48px', textAlign: 'center', color: theme.textMuted,
    },
    sufficiencyCard: {
      padding: '40px 24px', textAlign: 'center', background: theme.accentLight,
      border: `1px solid ${effectiveTheme === 'blue' ? '#bbf7d0' : theme.accentLight}`,
      borderRadius: '12px',
    },
  };

  // ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────
  const formatCurrency = (value) => {
    if (value == null) return 'UGX 0';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return 'UGX 0';
    return `UGX ${Math.round(n).toLocaleString('en-UG')}`;
  };
  const formatNumber = (value) => {
    if (value == null) return '0';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '0';
    return Math.round(n).toLocaleString('en-UG');
  };
  const formatDecimal = (value) => {
    if (value == null) return '0.00';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };
  const formatAverage = formatDecimal;
  const formatDateTime = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleString('en-UG', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleDateString('en-UG', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // ─── EXPIRY / BATCH HELPERS ──────────────────────────────────────────────────
  const NO_EXPIRY_STRINGS = ['no expiry date', 'no expiry', ''];
  const NO_BATCH_STRINGS  = ['no batch number', 'no batch no', 'no batch', ''];

  const isNoExpiry = (val) => !val || NO_EXPIRY_STRINGS.includes(val.toLowerCase().trim());
  const isNoBatch  = (val) => !val || NO_BATCH_STRINGS.includes(val.toLowerCase().trim());

  const isExpired = (val) => {
    if (isNoExpiry(val)) return false;
    try { return new Date(val) < new Date(); } catch { return false; }
  };

  const renderExpiry = (val) => {
    if (isNoExpiry(val)) return <span style={{ color: theme.textMuted, fontStyle: 'italic', fontSize: '12px' }}>No Expiry Date</span>;
    const expired = isExpired(val);
    return <span style={{ fontSize: '12px', fontWeight: expired ? '700' : '500', color: expired ? theme.danger : theme.textPrimary }}>{expired ? '⚠ ' : ''}{val}</span>;
  };

  const renderBatch = (val) => {
    if (isNoBatch(val)) return <span style={{ color: theme.textMuted, fontStyle: 'italic', fontSize: '12px' }}>No Batch No</span>;
    return <span style={{ fontSize: '12px', color: theme.textPrimary }}>{val}</span>;
  };

  const getActionStyle = (actionText) => {
    const text = (actionText || '').toLowerCase();
    if (text.includes('drug taken') || text.includes('sold') || text.includes('dispensed'))
      return { icon: '💊', color: '#ef4444', bg: '#fef2f2' };
    if (text.includes('moved from store'))
      return { icon: '📦', color: '#3b82f6', bg: '#eff6ff' };
    if (text.includes('insertion') || text.includes('added'))
      return { icon: '➕', color: '#10b981', bg: '#ecfdf5' };
    if (text.includes('family planning'))
      return { icon: '👶', color: '#8b5cf6', bg: '#f5f3ff' };
    if (text.includes('return'))
      return { icon: '↩️', color: '#f59e0b', bg: '#fffbeb' };
    return { icon: '📋', color: '#6b7280', bg: '#f9fafb' };
  };

  // ─── API CALLS ──────────────────────────────────────────────────────────────
  const performSecurityCheck = async (token) => {
    try {
      const res = await fetch(urls.security, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const data = await res.json();
        const tc = data.colour || '';
        setCurrentTheme((!tc || tc.toLowerCase() === 'white' || tc.toLowerCase() === 'null') ? 'white' : 'blue');
        setEmployeeName(data.employee_name);
        setClinicName(data.clinic);
        if (data.message === 'Session valid') return true;
        if (data.error === 'Session expired') { navigate(`/dashboard?token=${data.clinic_session_token}`); return false; }
        navigate('/login'); return false;
      }
      throw new Error('Security check failed');
    } catch {
      navigate('/login'); return false;
    }
  };

  const fetchStockData = async (token) => {
    try {
      const res = await fetch(urls.fetchstocktrackingsummary, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
        if (data.realtime_movements) {
          const dates = [...new Set(data.realtime_movements.map(m => m.activity_time?.split(' ')[0]).filter(Boolean))].sort().reverse();
          setAvailableDates(dates);
          const uniqueDrugs = [...new Map(data.realtime_movements.map(item => [item.drug_id, { drug_id: item.drug_id, drug_name: item.drug_name, packaging: item.packaging }])).values()].sort((a, b) => (a.drug_name || '').localeCompare(b.drug_name || ''));
          setDrugOptions(uniqueDrugs);
          setInOutDrugSuggestions(uniqueDrugs);
        }
      } else throw new Error('Failed');
    } catch {
      setError('Unable to load stock tracking information.');
    } finally {
      setIsLoading(false); setIsValidating(false);
    }
  };

  const fetchAllStock = async (token) => {
    try {
      const res = await fetch(urls.allstock, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data.data;
      }
      return null;
    } catch {
      setError('Unable to load all stock information.'); return null;
    }
  };

  const fetchDrugsInOut = async (token, filters) => {
    setFetchingDrugsInOut(true);
    try {
      const payload = { token };
      if (filters.drugId && filters.drugId !== 'all') payload.drug_id = filters.drugId;
      if (filters.startDate && filters.endDate) { payload.start_date = filters.startDate; payload.end_date = filters.endDate; }
      const res = await fetch(urls.drugsinvsdrugsout, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setDrugsInOutData(data);
        setInOutOpeningStock(data.opening_stock);
        setInOutSummary(data.summary);
        if (data.drugs?.length > 0) {
          const sorted = [...data.drugs].sort((a, b) => (a.drug_name || '').localeCompare(b.drug_name || ''));
          setInOutDrugSuggestions(sorted);
        }
        setAppliedFilters({ drugId: filters.drugId || 'all', startDate: filters.startDate || '', endDate: filters.endDate || '' });
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed');
      }
    } catch (e) {
      setError('Unable to load drugs in/out analysis: ' + e.message);
    } finally {
      setFetchingDrugsInOut(false);
    }
  };

  const fetchStockDataIgnoreWarningPoints = async () => {
    setFetchingIgnoreMode(true);
    try {
      const res = await fetch(urls.fetchstocktrackingsummary, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl, mode: 'ignore warning points' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
        setIgnoreWarningPoints(true);
        if (data.realtime_movements) {
          const dates = [...new Set(data.realtime_movements.map(m => m.activity_time?.split(' ')[0]).filter(Boolean))].sort().reverse();
          setAvailableDates(dates);
        }
      }
    } catch (e) {
      console.error('Error fetching ignore mode data:', e);
    } finally {
      setFetchingIgnoreMode(false);
    }
  };

  const restoreWarningPointsMode = async () => {
    setFetchingIgnoreMode(true);
    try {
      const res = await fetch(urls.fetchstocktrackingsummary, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
        setIgnoreWarningPoints(false);
      }
    } catch (e) {
      console.error('Error restoring warning points mode:', e);
    } finally {
      setFetchingIgnoreMode(false);
    }
  };

  // ─── EFFECTS ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!tokenFromUrl) { navigate('/login'); return; }
      const valid = await performSecurityCheck(tokenFromUrl);
      if (valid) await fetchStockData(tokenFromUrl);
      else { setIsValidating(false); setIsLoading(false); }
    };
    init();
  }, [tokenFromUrl]);

  useEffect(() => {
    if (['allstock', 'discrepancies'].includes(activeView) && !allStockData && !fetchingAllStock) {
      setFetchingAllStock(true);
      fetchAllStock(tokenFromUrl).then(data => {
        if (data) setAllStockData(data);
        setFetchingAllStock(false);
      });
    }
  }, [activeView, allStockData, fetchingAllStock, tokenFromUrl]);

  useEffect(() => {
    if (activeView === 'drugsinout' && tokenFromUrl && !drugsInOutData && !fetchingDrugsInOut) {
      fetchDrugsInOut(tokenFromUrl, {});
    }
  }, [activeView, tokenFromUrl]);

  useEffect(() => {
    if (activeView === 'discrepancies' && allStockData && selectedDrugs.length === 0) {
      const uniqueIds = [...new Set(allStockData.map(i => i.drug_id))];
      const shuffled = uniqueIds.sort(() => 0.5 - Math.random()).slice(0, 10);
      const selected = shuffled.map(id => {
        const drug = allStockData.find(i => i.drug_id === id);
        return { drug_id: id, drug_name: drug.Drug, packaging: drug.Packaging };
      });
      setSelectedDrugs(selected);
      const inputs = {};
      selected.forEach(d => { inputs[d.drug_id] = { store: '', shelves: '' }; });
      setPhysicalInputs(inputs);
    }
  }, [activeView, allStockData]);

  // ─── STOCK MOVEMENT FILTER HELPERS ─────────────────────────────────────────
  const handleMovementDrugSearchChange = (e) => {
    const val = e.target.value;
    setMovementDrugSearch(val);
    setMovementDrugFilter('all');
    if (val.length > 0) {
      const sug = drugOptions.filter(d => (d.drug_name || '').toLowerCase().includes(val.toLowerCase()));
      setMovementDrugSuggestions(sug);
      setShowMovementDrugSuggestions(true);
    } else {
      setMovementDrugSuggestions(drugOptions);
      setShowMovementDrugSuggestions(true);
    }
  };

  const handleMovementDrugSuggestionClick = (drug) => {
    setMovementDrugFilter(drug.drug_id.toString());
    setMovementDrugSearch(drug.drug_name);
    setShowMovementDrugSuggestions(false);
  };

  const handleMovementDrugInputFocus = () => {
    if (movementDrugSearch.length === 0) {
      setMovementDrugSuggestions(drugOptions);
      setShowMovementDrugSuggestions(true);
    }
  };

  const handleApplyMovementFilters = () => {
    setMovementFiltersApplied({
      drugFilter: movementDrugFilter,
      dateMode: movementDateMode,
      singleDate: movementSingleDate,
      startDate: movementStartDate,
      endDate: movementEndDate,
    });
  };

  const handleClearMovementFilters = () => {
    setMovementDrugSearch('');
    setMovementDrugFilter('all');
    setMovementDateMode('all');
    setMovementSingleDate('');
    setMovementStartDate('');
    setMovementEndDate('');
    setMovementFiltersApplied({ drugFilter: 'all', dateMode: 'all', singleDate: '', startDate: '', endDate: '' });
    setMovementDrugSuggestions(drugOptions);
    setShowMovementDrugSuggestions(false);
  };

  const getFilteredMovements = () => {
    if (!stockData?.realtime_movements) return [];
    let filtered = [...stockData.realtime_movements];
    const { drugFilter, dateMode, singleDate, startDate, endDate } = movementFiltersApplied;
    if (drugFilter !== 'all') filtered = filtered.filter(m => m.drug_id.toString() === drugFilter);
    if (dateMode === 'single' && singleDate) {
      filtered = filtered.filter(m => m.activity_time?.startsWith(singleDate));
    } else if (dateMode === 'range' && startDate && endDate) {
      filtered = filtered.filter(m => {
        const d = m.activity_time?.split(' ')[0];
        return d && d >= startDate && d <= endDate;
      });
    }
    return filtered;
  };

  // ─── DRUGS IN/OUT FILTER HELPERS ────────────────────────────────────────────
  const handleInOutDrugSearchChange = (e) => {
    const val = e.target.value;
    setInOutDrugSearch(val);
    setInOutDrugId('all');
    if (val.length > 0) {
      const sug = inOutDrugSuggestions.filter(d => (d.drug_name || '').toLowerCase().includes(val.toLowerCase()));
      setInOutDrugSuggestions(sug);
      setShowInOutDrugSuggestions(true);
    } else {
      const completeList = drugOptions.length > 0 ? drugOptions : inOutDrugSuggestions;
      setInOutDrugSuggestions(completeList);
      setShowInOutDrugSuggestions(true);
    }
  };

  const handleInOutDrugSuggestionClick = (drug) => {
    setInOutDrugId(drug.drug_id.toString());
    setInOutDrugSearch(drug.drug_name);
    setShowInOutDrugSuggestions(false);
  };

  const handleInOutDrugInputFocus = () => {
    if (inOutDrugSearch.length === 0) {
      const completeList = drugOptions.length > 0 ? drugOptions : inOutDrugSuggestions;
      setInOutDrugSuggestions(completeList);
      setShowInOutDrugSuggestions(true);
    }
  };

  const handleApplyInOutFilters = () => {
    if (inOutDateMode === 'range') {
      if (!inOutStartDate || !inOutEndDate) { setInOutDateError('Please select both start and end dates'); return; }
      if (new Date(inOutStartDate) > new Date(inOutEndDate)) { setInOutDateError('Start date cannot be after end date'); return; }
    }
    setInOutDateError('');
    const filters = {};
    if (inOutDrugId && inOutDrugId !== 'all') filters.drugId = inOutDrugId;
    if (inOutDateMode === 'single' && inOutSingleDate) { filters.startDate = inOutSingleDate; filters.endDate = inOutSingleDate; }
    else if (inOutDateMode === 'range' && inOutStartDate && inOutEndDate) { filters.startDate = inOutStartDate; filters.endDate = inOutEndDate; }
    fetchDrugsInOut(tokenFromUrl, filters);
  };

  const handleClearInOutFilters = () => {
    setInOutDrugSearch('');
    setInOutDrugId('all');
    setInOutDateMode('all');
    setInOutSingleDate('');
    setInOutStartDate('');
    setInOutEndDate('');
    setInOutDateError('');
    const completeList = drugOptions.length > 0 ? drugOptions : inOutDrugSuggestions;
    setInOutDrugSuggestions(completeList);
    setShowInOutDrugSuggestions(false);
    fetchDrugsInOut(tokenFromUrl, {});
  };

  const getAppliedInOutFiltersText = () => {
    const parts = [];
    if (appliedFilters.drugId !== 'all') {
      const drug = (drugOptions.length > 0 ? drugOptions : inOutDrugSuggestions).find(d => d.drug_id?.toString() === appliedFilters.drugId);
      parts.push(`Drug: ${drug?.drug_name || appliedFilters.drugId}`);
    } else parts.push('All Drugs');
    if (appliedFilters.startDate && appliedFilters.endDate) {
      parts.push(appliedFilters.startDate === appliedFilters.endDate ? `Date: ${appliedFilters.startDate}` : `Range: ${appliedFilters.startDate} → ${appliedFilters.endDate}`);
    } else parts.push('All Dates');
    return parts.join(' · ');
  };

  // ─── STOCK DATA HELPERS ──────────────────────────────────────────────────────
  const toggleExpand = (key) => setInOutExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const getGroupedAllStock = () => {
    if (!allStockData) return [];
    const grouped = {};
    allStockData.forEach(item => {
      if (!grouped[item.drug_id]) {
        grouped[item.drug_id] = {
          drug_id: item.drug_id, drug_name: item.Drug, packaging: item.Packaging,
          store_quantity: 0, shelves_quantity: 0, cost_price: item.cost_price || 0,
          batch_number: item.batch_number, expiry_date: item.expiry_date,
        };
      }
      if (item.location === 'store') {
        grouped[item.drug_id].store_quantity = item.Quantity || 0;
        grouped[item.drug_id].batch_number = item.batch_number;
        grouped[item.drug_id].expiry_date = item.expiry_date;
      } else if (item.location === 'shelves') {
        grouped[item.drug_id].shelves_quantity = item.Quantity || 0;
        if (!grouped[item.drug_id].batch_number) grouped[item.drug_id].batch_number = item.batch_number;
        if (!grouped[item.drug_id].expiry_date) grouped[item.drug_id].expiry_date = item.expiry_date;
      }
    });
    return Object.values(grouped);
  };

  const getStockTotals = () => {
    if (!allStockData) return { total_store_quantity: 0, total_shelves_quantity: 0, total_combined_quantity: 0, total_store_value: 0, total_shelves_value: 0, total_combined_value: 0, unique_drugs_in_store: 0, unique_drugs_on_shelves: 0 };
    let tsq = 0, tshq = 0, tsv = 0, tshv = 0;
    const ds = new Set(), dsh = new Set();
    allStockData.forEach(item => {
      const v = (item.Quantity || 0) * (item.cost_price || 0);
      if (item.location === 'store') { tsq += item.Quantity || 0; tsv += v; ds.add(item.drug_id); }
      else if (item.location === 'shelves') { tshq += item.Quantity || 0; tshv += v; dsh.add(item.drug_id); }
    });
    return { total_store_quantity: tsq, total_shelves_quantity: tshq, total_combined_quantity: tsq + tshq, total_store_value: tsv, total_shelves_value: tshv, total_combined_value: tsv + tshv, unique_drugs_in_store: ds.size, unique_drugs_on_shelves: dsh.size };
  };

  const getDrugsToBuyData = () => {
    if (!stockData?.drugs_to_buy) return { items: [], total_cost: 0, total_items: 0, description: '' };
    switch (drugsToBuyPeriod) {
      case 'critical': return stockData.drugs_to_buy.critical_3days || { items: [], total_cost: 0, total_items: 0, description: 'Drugs needed immediately (3 days supply)' };
      case '7days': return stockData.drugs_to_buy.one_week_7days || { items: [], total_cost: 0, total_items: 0, description: 'Drugs needed for 1 week supply' };
      case '14days': return stockData.drugs_to_buy.two_weeks_14days || { items: [], total_cost: 0, total_items: 0, description: 'Drugs needed for 2 weeks supply' };
      case '30days': return stockData.drugs_to_buy.one_month_30days || { items: [], total_cost: 0, total_items: 0, description: 'Drugs needed for 1 month supply' };
      default: return { items: [], total_cost: 0, total_items: 0, description: '' };
    }
  };

  const getPeriodLabel = () => {
    switch (drugsToBuyPeriod) {
      case 'critical': return '3 days'; case '7days': return '7 days';
      case '14days': return '14 days'; case '30days': return '30 days';
      default: return 'this period';
    }
  };

  const getFilteredDrugsToBuy = () => {
    const data = getDrugsToBuyData();
    let items = data.items || [];
    if (stockLevelFilter === 'high') items = items.filter(i => (i.deficit_3days || i.deficit_7days || i.deficit_14days || i.deficit_30days || 0) >= 100);
    else if (stockLevelFilter === 'medium') items = items.filter(i => { const d = i.deficit_3days || i.deficit_7days || i.deficit_14days || i.deficit_30days || 0; return d >= 50 && d < 100; });
    else if (stockLevelFilter === 'low') items = items.filter(i => { const d = i.deficit_3days || i.deficit_7days || i.deficit_14days || i.deficit_30days || 0; return d > 0 && d < 50; });
    return items;
  };

  const getFilteredOverstockedItems = () => {
    if (!stockData?.stock_analysis?.overstocked_items) return [];
    let filtered = [...stockData.stock_analysis.overstocked_items];
    if (stockLevelFilter === 'severe') filtered = filtered.filter(i => i.overstock_level?.toLowerCase() === 'severe');
    else if (stockLevelFilter === 'moderate') filtered = filtered.filter(i => i.overstock_level?.toLowerCase() === 'moderate');
    else if (stockLevelFilter === 'mild') filtered = filtered.filter(i => i.overstock_level?.toLowerCase() === 'mild');
    return filtered;
  };

  const handleCheckDiscrepancies = () => {
    const results = selectedDrugs.map(drug => {
      const system = allStockData.filter(i => i.drug_id === drug.drug_id);
      const systemStore = system.find(i => i.location === 'store')?.Quantity || 0;
      const systemShelves = system.find(i => i.location === 'shelves')?.Quantity || 0;
      const physicalStore = parseFloat(physicalInputs[drug.drug_id]?.store) || 0;
      const physicalShelves = parseFloat(physicalInputs[drug.drug_id]?.shelves) || 0;
      const diffStore = Math.abs(physicalStore - systemStore);
      const diffShelves = Math.abs(physicalShelves - systemShelves);
      const totalDiff = diffStore + diffShelves;
      return { ...drug, systemStore, systemShelves, physicalStore, physicalShelves, diffStore, diffShelves, status: totalDiff > 0 ? 'Discrepancy' : 'Match', level: totalDiff === 0 ? 'Accurate' : totalDiff <= 5 ? 'Minor' : 'Major', storeVariance: physicalStore - systemStore, shelvesVariance: physicalShelves - systemShelves };
    });
    const matches = results.filter(r => r.status === 'Match').length;
    setDiscrepancyResults({ results, accuracy: (matches / results.length) * 100 });
    setShowDiscrepancyModal(true);
  };

  // ─── CONSTANTS ───────────────────────────────────────────────────────────────
  const TOPBAR_HEIGHT = 60;

  const navSections = [
    { label: 'ANALYTICS', items: [{ id: 'dashboard', icon: '📊', label: 'Dashboard' }, { id: 'fast', icon: '⚡', label: 'Fast Moving' }, { id: 'slow', icon: '🐢', label: 'Slow Moving' }] },
    { label: 'STOCK LEVELS', items: [{ id: 'drugstobuy', icon: '🛒', label: 'Drugs to Buy' }, { id: 'overstocked', icon: '🟢', label: 'Overstocked' }] },
    { label: 'INVENTORY', items: [{ id: 'movements', icon: '🔄', label: 'Stock Movements' }, { id: 'drugsinout', icon: '📦', label: 'Drugs In vs Out' }, { id: 'allstock', icon: '📋', label: 'All Stock' }, { id: 'discrepancies', icon: '🔍', label: 'Discrepancies' }] },
  ];

  const pageTitles = { dashboard: 'Stock Analysis Dashboard', fast: 'Fast-Moving Items', slow: 'Slow-Moving Items', drugstobuy: 'Drugs to Buy', overstocked: 'Overstocked Items', movements: 'Stock Movements', drugsinout: 'Drugs In vs Out Analysis', allstock: 'All Stock Inventory', discrepancies: 'Discrepancy Check' };

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (isValidating || isLoading) {
    const loadBg = isMobile ? '#ffffff' : (effectiveTheme === 'blue' ? colors.blue.sidebarBg : colors.white.sidebarBg);
    const loadColor = isMobile ? '#0f172a' : (effectiveTheme === 'blue' ? colors.blue.inactiveNavText : colors.white.inactiveNavText);
    const spinBorder = isMobile ? '#e2e8f0' : (effectiveTheme === 'blue' ? colors.blue.sidebarBorder : colors.white.sidebarBorder);
    const spinTop = isMobile ? '#16a34a' : (effectiveTheme === 'blue' ? colors.blue.accent : colors.white.accent);
    return (
      <div style={{ minHeight: '100vh', background: loadBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: `3px solid ${spinBorder}`, borderTop: `3px solid ${spinTop}`, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: loadColor, fontSize: '14px' }}>Analyzing Stock…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div style={{ minHeight: '100vh', background: theme.mainBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ ...styles.card, maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>Unable to Load Data</div>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '24px' }}>{error || 'An unexpected error occurred.'}</div>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 28px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  const { employee, drug_statistics, stock_analysis, summary, recommendations, inventory_value, realtime_movements, drugs_to_buy, clinic_settings } = stockData;

  const showExpiry = clinic_settings?.use_drug_expiry_date === true || clinic_settings?.use_drug_expiry_date === 'yes';
  const showBatch  = clinic_settings?.use_drug_batch_numbers === true || clinic_settings?.use_drug_batch_numbers === 'yes';

  const healthScore = summary?.inventory_health_score || 50;
  const healthColor = healthScore > 70 ? theme.accent : healthScore > 40 ? theme.warning : theme.danger;

  const inventoryTotals = {
    store_value: inventory_value?.store_value?.total || 0,
    shelves_value: inventory_value?.shelves_value?.total || 0,
    total_value: inventory_value?.combined?.total_inventory_value || 0,
    store_items: inventory_value?.store_value?.item_count || 0,
    shelves_items: inventory_value?.shelves_value?.item_count || 0,
    unique_drugs_store: inventory_value?.store_value?.unique_drugs || 0,
    unique_drugs_shelves: inventory_value?.shelves_value?.unique_drugs || 0,
  };

  const currentDrugsToBuy = getDrugsToBuyData();
  const filteredDrugsToBuy = getFilteredDrugsToBuy();

  // ─── MOBILE BOTTOM NAV ITEMS ─────────────────────────────────────────────────
  const allNavItems = navSections.flatMap(s => s.items);

  // ══════════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const mTheme = colors.white;

    const mCard = {
      background: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '12px', padding: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '12px',
    };

    const mStatRow = {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px',
    };

    const mStatCard = (bg, color) => ({
      background: bg, borderRadius: '10px', padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    });

    const mBadge = (type) => {
      const map = { green: mTheme.badgeGreen, red: mTheme.badgeRed, orange: mTheme.badgeOrange, blue: mTheme.badgeBlue, gray: mTheme.badgeGray };
      const c = map[type] || map.gray;
      return { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: c.bg, color: c.text };
    };

    const mSectionTitle = { fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' };

    const renderMobileMovementCard = (m, i) => {
      const as = getActionStyle(m.action_text);
      return (
        <div key={i} style={{ ...mCard, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ flex: 1, marginRight: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{m.drug_name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{m.packaging}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{formatNumber(m.quantity)}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>qty</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ background: as.bg, color: as.color, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{as.icon}</span>
            <span style={{ fontSize: '12px', color: '#475569', flex: 1 }}>{m.action_text}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(m.activity_time)}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{m.employee_full_name || m.employee_name}</span>
          </div>
        </div>
      );
    };

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '80px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #f1f5f9; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .m-fade { animation: fadeUp 0.25s ease; }
          .m-tab:active { opacity: 0.7; }
        `}</style>

        {/* ── MOBILE TOP BAR ── */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
          background: '#ffffff', borderBottom: '1px solid #e2e8f0',
          padding: '0 16px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: '700' }}>CP</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>MEDCORE</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{clinicName || employee?.clinic}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: healthColor, background: healthScore > 70 ? '#dcfce7' : healthScore > 40 ? '#fffbeb' : '#fef2f2', padding: '4px 10px', borderRadius: '20px' }}>{healthScore}% Health</div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' }}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* ── MOBILE FULL MENU OVERLAY ── */}
        {mobileMenuOpen && (
          <div style={{ position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0, zIndex: 800, background: '#ffffff', overflowY: 'auto', animation: 'slideDown 0.2s ease' }}>
            <div style={{ padding: '16px' }}>
              {navSections.map(section => (
                <div key={section.label} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '8px', padding: '0 4px' }}>{section.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {section.items.map(item => (
                      <button key={item.id} onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); setStockLevelFilter('all'); setShowDiscrepancyModal(false); if (item.id === 'drugstobuy') setDrugsToBuyPeriod('critical'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', border: 'none', background: activeView === item.id ? '#eff6ff' : '#f8fafc', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: activeView === item.id ? '600' : '500', color: activeView === item.id ? '#2563eb' : '#0f172a' }}>{item.label}</span>
                        {activeView === item.id && <span style={{ marginLeft: 'auto', color: '#2563eb', fontSize: '12px' }}>●</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MOBILE CONTENT ── */}
        <div style={{ paddingTop: '68px', padding: '68px 14px 16px' }} className="m-fade">

          {/* Page Title */}
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{pageTitles[activeView]}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date().toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}</div>
          </div>

          {/* ── MOBILE DASHBOARD ── */}
          {activeView === 'dashboard' && (
            <>
              {/* Summary stats */}
              <div style={mStatRow}>
                {[
                  { label: 'Total Drugs', val: formatNumber(summary?.total_drugs_tracked || 0), bg: '#eff6ff', color: '#2563eb' },
                  { label: 'Critical', val: formatNumber(summary?.total_critical_to_buy || 0), bg: '#fef2f2', color: '#dc2626' },
                  { label: 'Overstocked', val: formatNumber(summary?.total_overstocked || 0), bg: '#fffbeb', color: '#d97706' },
                  { label: 'Total Value', val: formatCurrency(inventoryTotals.total_value).replace('UGX ', 'UGX '), bg: '#dcfce7', color: '#16a34a' },
                ].map(s => (
                  <div key={s.label} style={mStatCard(s.bg, s.color)}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Inventory value cards */}
              <div style={{ marginBottom: '12px' }}>
                {[
                  { label: 'Store (Back Storage)', icon: '📦', qty: inventoryTotals.store_items, val: inventoryTotals.store_value, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Shelves (Front Display)', icon: '🏪', qty: inventoryTotals.shelves_items, val: inventoryTotals.shelves_value, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                  { label: 'Combined Total', icon: '💰', qty: inventoryTotals.store_items + inventoryTotals.shelves_items, val: inventoryTotals.total_value, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
                ].map(c => (
                  <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{c.icon}</span>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: c.color }}>{c.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div><div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>QUANTITY</div><div style={{ fontSize: '20px', fontWeight: '800', color: c.color }}>{formatNumber(c.qty)}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>VALUE</div><div style={{ fontSize: '14px', fontWeight: '700', color: c.color }}>{formatCurrency(c.val)}</div></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Health */}
              <div style={mCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>📊 Inventory Health</span>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: healthColor }}>{healthScore}%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${healthScore}%`, background: healthColor, borderRadius: '99px' }} />
                </div>
                {[['Critical to Buy', summary?.total_critical_to_buy || 0, '#dc2626'], ['1 Week Supply', summary?.total_one_week_to_buy || 0, '#d97706'], ['Overstocked', summary?.total_overstocked || 0, '#2563eb'], ['Dead Stock', summary?.total_dead_stock_items || 0, '#94a3b8']].map(([lbl, val, color]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '13px', color: '#475569' }}>{lbl}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color }}>{formatNumber(val)}</span>
                  </div>
                ))}
              </div>

              {/* Critical Buy */}
              <div style={mCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={mSectionTitle}>🛒 Critical Buy</span>
                  <button onClick={() => { setActiveView('drugstobuy'); setDrugsToBuyPeriod('critical'); }} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
                </div>
                {drugs_to_buy?.critical_3days?.items?.slice(0, 5).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.drug_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.packaging}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>Deficit: {formatNumber(item.deficit_3days)}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{formatCurrency(item.cost_for_critical)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fast & Slow movers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {[{ id: 'fast', icon: '⚡', title: 'Fast', items: drug_statistics?.fastest_moving?.slice(0, 3), color: '#d97706' }, { id: 'slow', icon: '🐢', title: 'Slow', items: drug_statistics?.slowest_moving?.slice(0, 3), color: '#94a3b8' }].map(({ id, icon, title, items, color }) => (
                  <div key={id} style={{ ...mCard, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{icon} {title}</span>
                      <button onClick={() => setActiveView(id)} style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>All →</button>
                    </div>
                    {items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{item.drug_name}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color, flexShrink: 0 }}>{formatAverage(item.average)}/d</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Recent Movements */}
              <div style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>🔄 Recent Movements</span>
                  <button onClick={() => setActiveView('movements')} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
                </div>
                {realtime_movements?.slice(0, 5).map((m, i) => renderMobileMovementCard(m, i))}
              </div>
            </>
          )}

          {/* ── MOBILE FAST MOVING ── */}
          {activeView === 'fast' && (
            <>
              <div style={{ ...mCard, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>⚡ {drug_statistics?.fastest_moving?.length || 0} Fast-Moving Drugs</div>
              </div>
              {drug_statistics?.fastest_moving?.map((item, i) => {
                const cost = parseFloat(item.cost_price) || 0;
                const selling = parseFloat(item.selling_price) || 0;
                const margin = cost > 0 ? ((selling - cost) / cost * 100).toFixed(0) : '0';
                return (
                  <div key={i} style={mCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.drug_name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{item.packaging}</div></div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>{formatAverage(item.average)}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>per day</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Cost: {formatCurrency(item.cost_price)}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Sell: {formatCurrency(item.selling_price)}</span>
                      <span style={mBadge(parseInt(margin) > 30 ? 'green' : parseInt(margin) > 10 ? 'orange' : 'gray')}>{margin}% margin</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── MOBILE SLOW MOVING ── */}
          {activeView === 'slow' && (
            <>
              <div style={{ ...mCard, background: '#f1f5f9', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>🐢 {drug_statistics?.slow_drugs_analysis?.length || 0} Slow-Moving Drugs</div>
              </div>
              {drug_statistics?.slow_drugs_analysis?.map((item, i) => (
                <div key={i} style={mCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.drug_name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{item.packaging}</div></div>
                    <span style={mBadge('gray')}>{item.status || 'No Sales'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Avg: {formatAverage(item.average)}/d</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Cost: {formatCurrency(item.cost_price)}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Last sold: {item.last_sold_at || 'Never'}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── MOBILE DRUGS TO BUY ── */}
          {activeView === 'drugstobuy' && (
            <>
              {/* Period selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[{ key: 'critical', label: '🔴 3 Days' }, { key: '7days', label: '🟡 7 Days' }, { key: '14days', label: '🟢 14 Days' }, { key: '30days', label: '🔵 30 Days' }].map(({ key, label }) => (
                  <button key={key} onClick={() => { setDrugsToBuyPeriod(key); setStockLevelFilter('all'); }}
                    style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: 'none', background: drugsToBuyPeriod === key ? '#2563eb' : '#f1f5f9', color: drugsToBuyPeriod === key ? '#fff' : '#64748b', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div style={{ ...mCard, background: drugsToBuyPeriod === 'critical' ? '#fef2f2' : drugsToBuyPeriod === '7days' ? '#fffbeb' : drugsToBuyPeriod === '14days' ? '#dcfce7' : '#eff6ff', border: 'none', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{currentDrugsToBuy.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{formatNumber(currentDrugsToBuy.total_items)} items</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Cost</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>{formatCurrency(currentDrugsToBuy.total_cost)}</div>
                  </div>
                </div>
              </div>

              {filteredDrugsToBuy.length === 0 ? (
                <div style={{ ...mCard, textAlign: 'center', padding: '32px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', marginBottom: '6px' }}>All Sufficient</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>No purchases needed for the next {getPeriodLabel()}.</div>
                </div>
              ) : filteredDrugsToBuy.map((item, i) => {
                let deficit, required, costField;
                if (drugsToBuyPeriod === 'critical') { deficit = item.deficit_3days; required = item.required_quantity_3days; costField = item.cost_for_critical; }
                else if (drugsToBuyPeriod === '7days') { deficit = item.deficit_7days; required = item.required_quantity_7days; costField = item.cost_for_one_week; }
                else if (drugsToBuyPeriod === '14days') { deficit = item.deficit_14days; required = item.required_quantity_14days; costField = item.cost_for_two_weeks; }
                else { deficit = item.deficit_30days; required = item.required_quantity_30days; costField = item.cost_for_one_month; }
                return (
                  <div key={i} style={mCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.drug_name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{item.packaging}</div></div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>{formatNumber(deficit)}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>deficit</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Current</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{formatNumber(item.total_available)}</div></div>
                      <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Need</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{formatNumber(required)}</div></div>
                      <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Cost</div><div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>{formatCurrency(costField)}</div></div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── MOBILE OVERSTOCKED ── */}
          {activeView === 'overstocked' && (
            <>
              <div style={{ ...mCard, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>Total Overstock Value</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>{formatCurrency(stock_analysis?.total_overstock_value || 0)}</span>
                </div>
              </div>
              {getFilteredOverstockedItems().length === 0 ? (
                <div style={{ ...mCard, textAlign: 'center', padding: '32px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>No Overstocked Items</div>
                </div>
              ) : getFilteredOverstockedItems().map((item, i) => (
                <div key={i} style={mCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.drug_name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{item.packaging}</div></div>
                    <span style={mBadge(item.overstock_level?.toLowerCase() === 'severe' ? 'red' : 'orange')}>{item.overstock_level}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Qty</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{formatNumber(item.total_available)}</div></div>
                    <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Days Supply</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#d97706' }}>{formatNumber(item.days_of_supply)}d</div></div>
                    <div><div style={{ fontSize: '10px', color: '#94a3b8' }}>Excess Value</div><div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>{formatCurrency(item.excess_value)}</div></div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── MOBILE STOCK MOVEMENTS ── */}
          {activeView === 'movements' && (
            <>
              <div style={mCard}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Search Drug</div>
                  <div style={{ position: 'relative' }}>
                    <input type="text" placeholder="Type drug name..." value={movementDrugSearch} onChange={handleMovementDrugSearchChange} onFocus={handleMovementDrugInputFocus} onBlur={() => setTimeout(() => setShowMovementDrugSuggestions(false), 200)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', background: '#f8fafc' }} />
                    {showMovementDrugSuggestions && movementDrugSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', marginTop: '4px' }}>
                        <div style={{ padding: '10px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }} onMouseDown={() => { setMovementDrugFilter('all'); setMovementDrugSearch(''); setShowMovementDrugSuggestions(false); }}>All Drugs</div>
                        {movementDrugSuggestions.map(drug => (
                          <div key={drug.drug_id} style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onMouseDown={() => handleMovementDrugSuggestionClick(drug)}>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{drug.drug_name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{drug.packaging}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={movementDateMode} onChange={e => { setMovementDateMode(e.target.value); setMovementSingleDate(''); setMovementStartDate(''); setMovementEndDate(''); }}
                    style={{ flex: 1, padding: '9px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', background: '#f8fafc', outline: 'none' }}>
                    <option value="all">All Dates</option>
                    <option value="single">Single Date</option>
                    <option value="range">Date Range</option>
                  </select>
                  <button onClick={handleApplyMovementFilters} style={{ padding: '9px 16px', background: '#16a34a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
                </div>
                {movementDateMode === 'single' && <input type="date" value={movementSingleDate} onChange={e => setMovementSingleDate(e.target.value)} style={{ width: '100%', marginTop: '8px', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none' }} />}
                {movementDateMode === 'range' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <input type="date" value={movementStartDate} onChange={e => setMovementStartDate(e.target.value)} style={{ flex: 1, padding: '9px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', outline: 'none' }} />
                    <span style={{ color: '#94a3b8' }}>–</span>
                    <input type="date" value={movementEndDate} onChange={e => setMovementEndDate(e.target.value)} style={{ flex: 1, padding: '9px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', outline: 'none' }} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', padding: '0 4px' }}>{getFilteredMovements().length} transactions</div>
              {getFilteredMovements().length === 0 ? (
                <div style={{ ...mCard, textAlign: 'center', padding: '32px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
                  <div style={{ fontWeight: '600', color: '#64748b' }}>No movements found</div>
                </div>
              ) : getFilteredMovements().map((m, i) => renderMobileMovementCard(m, i))}
            </>
          )}

          {/* ── MOBILE DRUGS IN/OUT ── */}
          {activeView === 'drugsinout' && (
            fetchingDrugsInOut ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '14px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #16a34a', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#64748b', fontSize: '14px' }}>Loading...</span>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                {inOutSummary && (
                  <div style={mStatRow}>
                    {[
                      { label: 'Total IN', val: formatNumber(inOutSummary.total_quantity_in || 0), sub: formatCurrency(inOutSummary.total_value_in || 0), bg: '#dcfce7', color: '#16a34a' },
                      { label: 'Total OUT', val: formatNumber(inOutSummary.total_quantity_out || 0), sub: formatCurrency(inOutSummary.total_value_out || 0), bg: '#fef2f2', color: '#dc2626' },
                      { label: 'Balance', val: formatNumber(inOutSummary.current_quantity_balance || 0), sub: formatCurrency(inOutSummary.current_value_balance || 0), bg: '#fffbeb', color: '#d97706' },
                    ].map(s => (
                      <div key={s.label} style={{ ...mStatCard(s.bg, s.color), gridColumn: s.label === 'Balance' ? 'span 2' : 'auto' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: s.color, fontWeight: '600' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                )}
                {drugsInOutData?.drugs?.map(drug => {
                  const key = `${drug.drug_id}-${drug.drug_name}`;
                  return (
                    <div key={key} style={mCard}>
                      <div onClick={() => toggleExpand(key)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div><div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{drug.drug_name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{drug.packaging}</div></div>
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>{inOutExpanded[key] ? '▼' : '▶'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          {[['IN', drug.in_quantity, '#16a34a'], ['OUT', drug.out_quantity, '#dc2626'], ['NET', drug.balance_quantity, drug.balance_quantity >= 0 ? '#16a34a' : '#dc2626']].map(([lbl, qty, color]) => (
                            <div key={lbl} style={{ textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{lbl}</div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color }}>{formatNumber(qty)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {inOutExpanded[key] && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                          {drug.transactions?.slice(0, 5).map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
                              <span style={{ color: '#94a3b8' }}>{formatDateTime(t.time)}</span>
                              <span style={{ fontWeight: '600', color: t.type === 'OUT' ? '#dc2626' : '#16a34a' }}>{t.type === 'OUT' ? '-' : '+'}{formatNumber(t.quantity)}</span>
                              <span style={{ color: '#64748b' }}>{t.employee}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )
          )}

          {/* ── MOBILE ALL STOCK ── */}
          {activeView === 'allstock' && (
            fetchingAllStock ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '14px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #16a34a', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#64748b', fontSize: '14px' }}>Loading inventory...</span>
              </div>
            ) : allStockData ? (
              <>
                <div style={mStatRow}>
                  {[
                    { label: 'Store', val: formatNumber(getStockTotals().total_store_quantity), sub: formatCurrency(getStockTotals().total_store_value), bg: '#eff6ff', color: '#2563eb' },
                    { label: 'Shelves', val: formatNumber(getStockTotals().total_shelves_quantity), sub: formatCurrency(getStockTotals().total_shelves_value), bg: '#fffbeb', color: '#d97706' },
                  ].map(s => (
                    <div key={s.label} style={mStatCard(s.bg, s.color)}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: s.color }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {getGroupedAllStock().map((item, i) => (
                  <div key={i} style={mCard}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>{item.drug_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{item.packaging}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Store</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>{formatNumber(item.store_quantity)}</div>
                      </div>
                      <div style={{ background: '#fffbeb', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Shelves</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#d97706' }}>{formatNumber(item.shelves_quantity)}</div>
                      </div>
                      <div style={{ background: '#dcfce7', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a' }}>{formatNumber((item.store_quantity || 0) + (item.shelves_quantity || 0))}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ ...mCard, textAlign: 'center', padding: '32px', color: '#64748b' }}>Unable to load stock data.</div>
            )
          )}

          {/* ── MOBILE DISCREPANCIES ── */}
          {activeView === 'discrepancies' && !showDiscrepancyModal && (
            fetchingAllStock ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '14px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #16a34a', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#64748b' }}>Loading...</span>
              </div>
            ) : selectedDrugs.length > 0 ? (
              <>
                <div style={{ ...mCard, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '14px' }}>
                  <div style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '14px', marginBottom: '4px' }}>🔍 Physical Count Audit</div>
                  <div style={{ fontSize: '12px', color: '#3b82f6' }}>Enter physical counts below, then tap Check Discrepancies.</div>
                </div>
                {selectedDrugs.map(drug => {
                  const system = allStockData.filter(i => i.drug_id === drug.drug_id);
                  const systemStore = system.find(i => i.location === 'store')?.Quantity || 0;
                  const systemShelves = system.find(i => i.location === 'shelves')?.Quantity || 0;
                  return (
                    <div key={drug.drug_id} style={mCard}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>{drug.drug_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>{drug.packaging}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>STORE — System: {formatNumber(systemStore)}</div>
                          <input type="number" value={physicalInputs[drug.drug_id]?.store || ''} onChange={e => setPhysicalInputs({ ...physicalInputs, [drug.drug_id]: { ...physicalInputs[drug.drug_id], store: e.target.value } })} placeholder="Physical count" style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #fde68a', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontWeight: '600', background: '#fffbeb', outline: 'none' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>SHELVES — System: {formatNumber(systemShelves)}</div>
                          <input type="number" value={physicalInputs[drug.drug_id]?.shelves || ''} onChange={e => setPhysicalInputs({ ...physicalInputs, [drug.drug_id]: { ...physicalInputs[drug.drug_id], shelves: e.target.value } })} placeholder="Physical count" style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #fde68a', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontWeight: '600', background: '#fffbeb', outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button onClick={handleCheckDiscrepancies} style={{ width: '100%', padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>🔍 Check Discrepancies</button>
              </>
            ) : (
              <div style={{ ...mCard, textAlign: 'center', padding: '32px', color: '#64748b' }}>Unable to load data.</div>
            )
          )}
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
          background: '#ffffff', borderTop: '1px solid #e2e8f0',
          display: 'flex', padding: '8px 4px 12px',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'drugstobuy', icon: '🛒', label: 'Buy' },
            { id: 'movements', icon: '🔄', label: 'Movements' },
            { id: 'allstock', icon: '📋', label: 'Stock' },
            { id: 'more', icon: '☰', label: 'More', action: () => setMobileMenuOpen(true) },
          ].map(item => (
            <button key={item.id} className="m-tab"
              onClick={item.action || (() => { setActiveView(item.id); setMobileMenuOpen(false); })}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <span style={{ fontSize: '20px', filter: (activeView === item.id && !item.action) ? 'none' : 'grayscale(0.5)' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: (activeView === item.id && !item.action) ? '#2563eb' : '#94a3b8' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── MOBILE DISCREPANCY MODAL ── */}
        {showDiscrepancyModal && discrepancyResults && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>🔍 Discrepancy Results</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Physical vs System comparison</div>
                </div>
                <button onClick={() => setShowDiscrepancyModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '34px', height: '34px', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Accuracy', val: `${discrepancyResults.accuracy.toFixed(1)}%`, bg: discrepancyResults.accuracy === 100 ? '#dcfce7' : '#fffbeb', color: discrepancyResults.accuracy === 100 ? '#16a34a' : '#d97706' },
                    { label: 'Matches', val: `${discrepancyResults.results.filter(r => r.status === 'Match').length}/${discrepancyResults.results.length}`, bg: '#f1f5f9', color: '#16a34a' },
                    { label: 'Issues', val: discrepancyResults.results.filter(r => r.status === 'Discrepancy').length, bg: '#fef2f2', color: '#dc2626' },
                  ].map(({ label, val, bg, color }) => (
                    <div key={label} style={{ background: bg, borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color, marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color }}>{val}</div>
                    </div>
                  ))}
                </div>
                {discrepancyResults.results.map((result, i) => (
                  <div key={i} style={mCard}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '8px' }}>{result.drug_name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[{ loc: 'Store', sys: result.systemStore, phys: result.physicalStore, variance: result.storeVariance }, { loc: 'Shelves', sys: result.systemShelves, phys: result.physicalShelves, variance: result.shelvesVariance }].map(({ loc, sys, phys, variance }) => (
                        <div key={loc} style={{ background: variance === 0 ? '#dcfce7' : '#fef2f2', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>{loc.toUpperCase()}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>System: {formatNumber(sys)}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Physical: {formatNumber(phys)}</div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: variance === 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>{variance === 0 ? '✓ Match' : `Δ ${variance > 0 ? '+' : ''}${variance}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowDiscrepancyModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>Close</button>
                <button onClick={() => { setActiveView('discrepancies'); setShowDiscrepancyModal(false); setSelectedDrugs([]); setPhysicalInputs({}); }} style={{ flex: 1, padding: '12px', background: '#16a34a', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>New Count</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT (original)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", background: theme.mainBg, position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${effectiveTheme === 'blue' ? '#1e293b' : '#f1f5f9'}; }
        ::-webkit-scrollbar-thumb { background: ${effectiveTheme === 'blue' ? '#475569' : '#cbd5e1'}; border-radius: 4px; }
        .nav-item:hover { background: ${theme.navHoverBg} !important; color: ${effectiveTheme === 'blue' ? '#ffffff' : theme.activeNavText} !important; }
        .nav-icon { color: ${theme.iconBright}; font-size: 18px; transition: all 0.2s ease; }
        .nav-item:hover .nav-icon { color: ${theme.iconHover}; transform: scale(1.1); }
        .table-row:hover td { background: ${theme.tableRowHover}; }
        .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .card-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .collapse-btn:hover { background: ${theme.collapseButtonHover} !important; transform: scale(1.05); }
        .suggestion-item:hover { background: ${theme.tableRowHover}; }
        .apply-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .period-btn:hover { background: ${theme.tableRowHover} !important; }
        .close-btn:hover { background: ${theme.tableHeader} !important; }
        .mode-toggle-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      {/* ── TOAST ── */}
      {showComingSoon.visible && (
        <div style={{ position: 'fixed', top: '84px', right: '24px', zIndex: 9999, background: effectiveTheme === 'blue' ? '#1e293b' : '#ffffff', color: effectiveTheme === 'blue' ? '#e2e8f0' : '#0f172a', padding: '14px 20px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', border: `1px solid ${effectiveTheme === 'blue' ? '#334155' : theme.cardBorder}` }}>
          <span style={{ fontSize: '20px' }}>🚧</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>{showComingSoon.feature}</div>
            <div style={{ fontSize: '12px', color: effectiveTheme === 'blue' ? '#94a3b8' : theme.textMuted, marginTop: '2px' }}>Coming soon!</div>
          </div>
          <button onClick={() => setShowComingSoon({ visible: false, feature: '' })} style={{ background: 'transparent', border: 'none', color: effectiveTheme === 'blue' ? '#64748b' : theme.textMuted, cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{ width: sidebarCollapsed ? '80px' : '260px', minHeight: '100vh', background: theme.sidebarBg, display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: `1px solid ${theme.sidebarBorder}`, position: 'fixed', paddingTop: `${TOPBAR_HEIGHT}px`, top: 0, left: 0, bottom: 0, overflowY: 'auto', boxShadow: sidebarCollapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.1)', transition: 'width 0.3s ease', zIndex: 900, color: theme.sidebarText }}>
        <div style={{ padding: sidebarCollapsed ? '20px 10px' : '20px 16px', borderBottom: `2px solid ${theme.sidebarBorder}`, display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', background: theme.filterSection, minHeight: sidebarCollapsed ? '120px' : '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, order: sidebarCollapsed ? 2 : 1, marginTop: sidebarCollapsed ? '12px' : 0 }}>
            <div style={{ width: '45px', height: '45px', background: theme.activeNavBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, color: theme.activeNavText, fontWeight: 'bold', boxShadow: effectiveTheme === 'blue' ? '0 4px 10px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.1)' }}>CP</div>
            {!sidebarCollapsed && <div style={{ overflow: 'hidden' }}><div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', whiteSpace: 'nowrap' }}>MEDCORE</div><div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Stock Management</div></div>}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ ...styles.collapseButton, width: '42px', height: '42px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', order: sidebarCollapsed ? 1 : 2, marginLeft: sidebarCollapsed ? 0 : 'auto', flexShrink: 0 }} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>{sidebarCollapsed ? '→' : '←'}</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarCollapsed ? '16px 0' : '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: '4px' }}>
              <div style={styles.sectionHeader(sidebarCollapsed)}>{!sidebarCollapsed && section.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {section.items.map(item => (
                  <button key={item.id} className="nav-item" onClick={() => { setActiveView(item.id); setStockLevelFilter('all'); setShowDiscrepancyModal(false); if (item.id === 'drugstobuy') setDrugsToBuyPeriod('critical'); }} style={styles.navItem(activeView === item.id, sidebarCollapsed)} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
                    <span className="nav-icon" style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                    {!sidebarCollapsed && <><span style={{ fontWeight: activeView === item.id ? '600' : '500' }}>{item.label}</span>{activeView === item.id && <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.8 }}>●</span>}</>}
                    {sidebarCollapsed && hoveredItem === item.id && <div style={styles.tooltip}>{item.label}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div style={{ padding: '16px 16px 20px', borderTop: `1px solid ${theme.sidebarBorder}`, background: effectiveTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.tableHeader }}>
            <div style={{ fontSize: '11px', color: theme.sectionHeaderText, marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>INVENTORY HEALTH</div>
            <div style={{ height: '6px', background: effectiveTheme === 'blue' ? '#1e293b' : theme.cardBorder, borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${healthScore}%`, background: healthColor, borderRadius: '99px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.sectionHeaderText, fontSize: '11px', fontWeight: '500' }}>Health Score</span>
              <span style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '14px' }}>{healthScore}%</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {[{ icon: '📊', key: 'health', tip: `Health: ${healthScore}%` }, { icon: '🔴', key: 'crit', tip: `Critical: ${summary?.total_critical_to_buy || 0}` }, { icon: '💰', key: 'val', tip: `Value: ${formatCurrency(inventoryTotals.total_value)}` }].map(({ icon, key, tip }) => (
              <div key={key} style={{ fontSize: '24px', cursor: 'pointer', position: 'relative' }} onMouseEnter={() => setHoveredItem(key)} onMouseLeave={() => setHoveredItem(null)}>{icon}{hoveredItem === key && <div style={styles.tooltip}>{tip}</div>}</div>
            ))}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT (DESKTOP) ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', marginLeft: sidebarCollapsed ? '80px' : '260px', transition: 'margin-left 0.3s ease' }}>
        <Topbar token={tokenFromUrl} themeColor={effectiveTheme} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', position: 'relative', marginTop: `${TOPBAR_HEIGHT}px` }} className="fade-in">

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary }}>{pageTitles[activeView]}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>{clinicName || employee?.clinic} · {new Date().toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ label: 'Total Drugs', value: formatNumber(summary?.total_drugs_tracked || 0), color: theme.info }, { label: 'Critical', value: formatNumber(summary?.total_critical_to_buy || 0), color: theme.danger }, { label: 'Health', value: `${healthScore}%`, color: healthColor }].map(stat => (
                <div key={stat.label} style={{ padding: '8px 20px', background: theme.cardBg, borderRadius: '10px', textAlign: 'center', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── DASHBOARD (DESKTOP) ── */}
          {activeView === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'STORE (BACK STORAGE)', icon: '📦', color: effectiveTheme === 'blue' ? '#1e40af' : theme.info, bg: effectiveTheme === 'blue' ? '#eff6ff' : theme.infoLight, border: effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight, qty: inventoryTotals.store_items, val: inventoryTotals.store_value, drugs: inventoryTotals.unique_drugs_store },
                  { label: 'SHELVES (FRONT DISPLAY)', icon: '🏪', color: effectiveTheme === 'blue' ? '#92400e' : theme.warning, bg: effectiveTheme === 'blue' ? '#fef3c7' : theme.warningLight, border: effectiveTheme === 'blue' ? '#fde68a' : theme.warningLight, qty: inventoryTotals.shelves_items, val: inventoryTotals.shelves_value, drugs: inventoryTotals.unique_drugs_shelves },
                  { label: 'COMBINED TOTAL', icon: '💰', color: effectiveTheme === 'blue' ? '#166534' : theme.accent, bg: effectiveTheme === 'blue' ? '#dcfce7' : theme.accentLight, border: effectiveTheme === 'blue' ? '#bbf7d0' : theme.accentLight, qty: inventoryTotals.store_items + inventoryTotals.shelves_items, val: inventoryTotals.total_value, drugs: summary?.total_drugs_tracked || 0 },
                ].map(c => (
                  <div key={c.label} style={{ ...styles.card, background: c.bg, border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><span style={{ fontSize: '24px' }}>{c.icon}</span><span style={{ fontWeight: '700', fontSize: '14px', color: c.color }}>{c.label}</span></div>
                    {[['Total Quantity', `${formatNumber(c.qty)} units`], ['Total Value', formatCurrency(c.val)], ['Unique Drugs', c.drugs]].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: theme.textSecondary }}>{lbl}:</span>
                        <span style={{ fontSize: lbl === 'Unique Drugs' ? '16px' : '20px', fontWeight: '800', color: c.color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[{ title: 'Critical Buy Cost', value: formatCurrency(drugs_to_buy?.critical_3days?.total_cost || 0), icon: '🛒', color: theme.danger }, { title: 'Total Inventory Value', value: formatCurrency(inventoryTotals.total_value), icon: '💰', color: theme.accent }, { title: 'Fastest Mover (Avg/day)', value: formatAverage(drug_statistics?.fastest_moving?.[0]?.average), icon: '⚡', color: theme.warning }, { title: 'To Buy / Overstocked', value: `${summary?.total_critical_to_buy || 0} / ${summary?.total_overstocked || 0}`, icon: '📊', color: theme.info }].map(kpi => (
                  <div key={kpi.title} style={styles.statCard()} className="card-hover">
                    <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.title}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary }}>{kpi.value}</div>
                    <div style={{ fontSize: '22px', marginTop: '4px' }}>{kpi.icon}</div>
                  </div>
                ))}
              </div>

              {/* Dashboard Recent Movements */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={styles.sectionTitle}>🔄 Recent Stock Movements</div>
                  <button onClick={() => setActiveView('movements')} style={{ fontSize: '13px', color: theme.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date & Time</th>
                        <th style={styles.th}>Drug / Details</th>
                        <th style={{ ...styles.th, minWidth: '250px' }}>Action</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realtime_movements?.slice(0, 6).map((m, i) => {
                        const as = getActionStyle(m.action_text);
                        return (
                          <tr key={i} className="table-row">
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(m.activity_time)}</td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{m.drug_name}</div>
                              <div style={{ fontSize: '11px', color: theme.textMuted }}>{m.packaging}</div>
                              {showBatch && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Batch: {renderBatch(m.batch_number)}</div>}
                              {showExpiry && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Expiry: {renderExpiry(m.expiry_date)}</div>}
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '280px' }}>
                                <span style={{ ...styles.badge('gray'), background: as.bg, color: as.color, flexShrink: 0 }}>{as.icon}</span>
                                <span style={{ fontSize: '13px', color: theme.textPrimary, wordBreak: 'break-word' }}>{m.action_text}</span>
                              </div>
                            </td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(m.quantity)}</td>
                            <td style={{ ...styles.td, fontSize: '13px', color: theme.textSecondary }}>{m.employee_full_name || m.employee_name}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{m.shelves_balance != null ? `Shelves: ${formatNumber(m.shelves_balance)}` : m.store_balance != null ? `Store: ${formatNumber(m.store_balance)}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {[{ id: 'fast', icon: '⚡', title: 'Fast Moving', items: drug_statistics?.fastest_moving?.slice(0, 5), getVal: i => `${formatAverage(i.average)}/d`, getValColor: () => theme.warning, getSub: i => formatCurrency(i.selling_price) }, { id: 'slow', icon: '🐢', title: 'Slow Moving', items: drug_statistics?.slowest_moving?.slice(0, 5), getVal: i => `${formatAverage(i.average)}/d`, getValColor: () => theme.textSecondary, getSub: i => formatCurrency(i.cost_price) }].map(({ id, icon, title, items, getVal, getValColor, getSub }) => (
                  <div key={id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={styles.sectionTitle}>{icon} {title}</div>
                      <button onClick={() => setActiveView(id)} style={{ fontSize: '12px', color: theme.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.tableBorder}` }}>
                          <div><div style={{ fontSize: '13px', fontWeight: '600', color: theme.textPrimary }}>{item.drug_name}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{item.packaging}</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '13px', fontWeight: '700', color: getValColor(item) }}>{getVal(item)}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{getSub(item)}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={styles.sectionTitle}>🛒 Critical Buy — 3 Days Urgency</div>
                  <button onClick={() => { setActiveView('drugstobuy'); setDrugsToBuyPeriod('critical'); }} style={{ fontSize: '13px', color: theme.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all →</button>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Drug', 'Packaging', 'Daily Use', 'Current Stock', '3-Day Need', 'Deficit', 'Buy Cost'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {drugs_to_buy?.critical_3days?.items?.slice(0, 5).map((item, i) => (
                        <tr key={i} className="table-row">
                          <td style={{ ...styles.td, fontWeight: '600' }}>{item.drug_name}</td>
                          <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                          <td style={styles.td}>{formatAverage(item.average_daily_usage)}</td>
                          <td style={{ ...styles.td, fontWeight: '600', color: item.total_available < 5 ? theme.danger : theme.textPrimary }}>{formatNumber(item.total_available)}</td>
                          <td style={styles.td}>{formatNumber(item.required_quantity_3days)}</td>
                          <td style={{ ...styles.td, fontWeight: '700', color: theme.danger }}>{formatNumber(item.deficit_3days)}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{formatCurrency(item.cost_for_critical)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>📋 Recommendations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recommendations?.overstock_management?.general_tips?.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', background: theme.accentLight, borderRadius: '8px' }}>
                        <span style={{ color: theme.accent, fontWeight: '700', flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: '13px', color: effectiveTheme === 'blue' ? '#14532d' : theme.accentDark, lineHeight: '1.5' }}>{tip}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: '12px', color: theme.textMuted, padding: '8px 12px', background: theme.tableHeader, borderRadius: '8px' }}>💡 Cost saving: {recommendations?.overstock_management?.cost_saving_opportunities?.[0] || 'UGX 0'}</div>
                  </div>
                </div>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>📊 Inventory Health</div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: theme.textSecondary }}>Health Score</span>
                      <span style={{ fontSize: '22px', fontWeight: '800', color: healthColor }}>{healthScore}%</span>
                    </div>
                    <div style={{ height: '8px', background: theme.tableHeader, borderRadius: '99px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${healthScore}%`, background: healthColor, borderRadius: '99px' }} /></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[['Critical to Buy', summary?.total_critical_to_buy || 0, theme.danger], ['1 Week to Buy', summary?.total_one_week_to_buy || 0, theme.warning], ['Overstocked', summary?.total_overstocked || 0, theme.info], ['Dead Stock', summary?.total_dead_stock_items || 0, theme.textMuted]].map(([lbl, val, color]) => (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${theme.tableBorder}` }}>
                        <span style={{ fontSize: '13px', color: theme.textSecondary }}>{lbl}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{formatNumber(val)} items</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
                      <span style={{ fontSize: '13px', color: theme.textSecondary }}>Total Critical Buy Cost</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: theme.danger }}>{formatCurrency(drugs_to_buy?.critical_3days?.total_cost || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── FAST MOVING (DESKTOP) ── */}
          {activeView === 'fast' && (
            <div style={styles.tableWrapper}>
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span><span style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary }}>All Fast-Moving Drugs</span>
                <span style={{ ...styles.badge('orange'), marginLeft: '4px' }}>{drug_statistics?.fastest_moving?.length || 0} items</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Drug Name', 'Packaging', 'Daily Avg', 'Cost Price', 'Selling Price', 'Margin'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {drug_statistics?.fastest_moving?.map((item, i) => {
                    const cost = parseFloat(item.cost_price) || 0;
                    const selling = parseFloat(item.selling_price) || 0;
                    const margin = cost > 0 ? ((selling - cost) / cost * 100).toFixed(0) : '0';
                    return (
                      <tr key={i} className="table-row">
                        <td style={{ ...styles.td, fontWeight: '600' }}>{item.drug_name}</td>
                        <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: theme.warning }}>{formatAverage(item.average)}</td>
                        <td style={styles.td}>{formatCurrency(item.cost_price)}</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{formatCurrency(item.selling_price)}</td>
                        <td style={styles.td}><span style={styles.badge(parseInt(margin) > 30 ? 'green' : parseInt(margin) > 10 ? 'orange' : 'gray')}>{margin}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SLOW MOVING (DESKTOP) ── */}
          {activeView === 'slow' && (
            <div style={styles.tableWrapper}>
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🐢</span><span style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary }}>Slow-Moving & No-Sale Drugs</span>
                <span style={{ ...styles.badge('gray'), marginLeft: '4px' }}>{drug_statistics?.slow_drugs_analysis?.length || 0} items</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Drug Name', 'Packaging', 'Daily Avg', 'Cost Price', 'Last Sold', 'Status'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {drug_statistics?.slow_drugs_analysis?.map((item, i) => (
                    <tr key={i} className="table-row">
                      <td style={{ ...styles.td, fontWeight: '600' }}>{item.drug_name}</td>
                      <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                      <td style={styles.td}>{formatAverage(item.average)}</td>
                      <td style={styles.td}>{formatCurrency(item.cost_price)}</td>
                      <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.last_sold_at || 'Never'}</td>
                      <td style={styles.td}><span style={styles.badge('gray')}>{item.status || 'No Sales'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DRUGS TO BUY (DESKTOP) ── */}
          {activeView === 'drugstobuy' && (
            <>
              <div style={styles.periodSelector}>
                {[
                  { key: 'critical', label: '🔴 Critical (3 Days)' },
                  { key: '7days',    label: '🟡 7 Days' },
                  { key: '14days',   label: '🟢 14 Days' },
                  { key: '30days',   label: '🔵 30 Days' },
                ].map(({ key, label }) => (
                  <button key={key} className="period-btn" style={styles.periodButton(drugsToBuyPeriod === key)} onClick={() => { setDrugsToBuyPeriod(key); setStockLevelFilter('all'); }}>{label}</button>
                ))}
              </div>

              <div style={{
                marginBottom: '16px', padding: '14px 18px', borderRadius: '12px',
                border: `1px solid ${ignoreWarningPoints ? (effectiveTheme === 'blue' ? '#bbf7d0' : theme.accentLight) : (effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight)}`,
                background: ignoreWarningPoints ? theme.accentLight : theme.infoLight,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                  <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{ignoreWarningPoints ? '📈' : '⚖️'}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', color: ignoreWarningPoints ? (effectiveTheme === 'blue' ? '#166534' : theme.accent) : (effectiveTheme === 'blue' ? '#1d4ed8' : theme.info) }}>
                      {ignoreWarningPoints ? 'Calculation Mode: Average Consumption Only' : 'Calculation Mode: Average Consumption + Warning Points'}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: '1.5' }}>
                      {ignoreWarningPoints
                        ? 'This list is generated purely from drug consumption rates. Warning points are not considered — drugs will only appear here if their stock is projected to run out based on usage alone.'
                        : 'This list is generated using both the average consumption rate and the warning points set for each drug. A drug appears here if its stock is below its warning point or projected to run low based on usage.'}
                    </div>
                  </div>
                </div>
                <button className="mode-toggle-btn" onClick={ignoreWarningPoints ? restoreWarningPointsMode : fetchStockDataIgnoreWarningPoints} disabled={fetchingIgnoreMode}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: fetchingIgnoreMode ? 'not-allowed' : 'pointer', background: ignoreWarningPoints ? theme.info : theme.accent, color: '#fff', opacity: fetchingIgnoreMode ? 0.7 : 1, transition: 'all 0.2s ease', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {fetchingIgnoreMode ? (
                    <><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', animation: 'spin 0.6s linear infinite' }} /> Loading...</>
                  ) : ignoreWarningPoints ? '⚖️ Switch to Consumption + Warning Points' : '📈 Switch to Consumption Only'}
                </button>
              </div>

              <div style={{ ...styles.card, marginBottom: '16px', background: drugsToBuyPeriod === 'critical' ? theme.dangerLight : drugsToBuyPeriod === '7days' ? theme.warningLight : drugsToBuyPeriod === '14days' ? theme.accentLight : theme.infoLight, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary, marginBottom: '4px' }}>{currentDrugsToBuy.description}</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary }}>{formatNumber(currentDrugsToBuy.total_items)} Items to Buy</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary, marginBottom: '4px' }}>Total Cost</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: theme.danger }}>{formatCurrency(currentDrugsToBuy.total_cost)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[['all', `All (${currentDrugsToBuy.total_items})`], ['high', 'High (100+)'], ['medium', 'Medium (50-99)'], ['low', 'Low (1-49)']].map(([val, label]) => (
                  <button key={val} onClick={() => setStockLevelFilter(val)} style={styles.filterButton(stockLevelFilter === val)}>{label}</button>
                ))}
              </div>

              <div style={styles.tableWrapper}>
                {filteredDrugsToBuy.length === 0 ? (
                  <div style={styles.sufficiencyCard}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: effectiveTheme === 'blue' ? '#166534' : theme.accent, marginBottom: '8px' }}>Drugs Available Are Sufficient</div>
                    <div style={{ fontSize: '14px', color: theme.textSecondary }}>All tracked drugs have sufficient stock for the next <strong>{getPeriodLabel()}</strong>. No purchases needed for this period.</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Drug Name', 'Packaging', 'Daily Usage', 'Current Stock', 'Required Qty', 'Deficit', 'Cost Price', 'Total Cost', 'Warning Point'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrugsToBuy.map((item, i) => {
                        let deficit, required, costField;
                        if (drugsToBuyPeriod === 'critical') { deficit = item.deficit_3days; required = item.required_quantity_3days; costField = item.cost_for_critical; }
                        else if (drugsToBuyPeriod === '7days') { deficit = item.deficit_7days; required = item.required_quantity_7days; costField = item.cost_for_one_week; }
                        else if (drugsToBuyPeriod === '14days') { deficit = item.deficit_14days; required = item.required_quantity_14days; costField = item.cost_for_two_weeks; }
                        else { deficit = item.deficit_30days; required = item.required_quantity_30days; costField = item.cost_for_one_month; }
                        return (
                          <tr key={i} className="table-row">
                            <td style={{ ...styles.td, fontWeight: '600' }}>{item.drug_name}</td>
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                            <td style={styles.td}>{formatAverage(item.average_daily_usage)}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(item.total_available)}</td>
                            <td style={styles.td}>{formatNumber(required)}</td>
                            <td style={{ ...styles.td, fontWeight: '700', color: theme.danger }}>{formatNumber(deficit)}</td>
                            <td style={styles.td}>{formatCurrency(item.cost_price)}</td>
                            <td style={{ ...styles.td, fontWeight: '700' }}>{formatCurrency(costField)}</td>
                            <td style={styles.td}><span style={styles.badge('orange')}>{formatNumber(item.warning_point)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── OVERSTOCKED (DESKTOP) ── */}
          {activeView === 'overstocked' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[['all', `All (${stock_analysis?.overstocked_items?.length || 0})`], ['severe', `Severe (${stock_analysis?.overstock_summary?.severe_overstock_count || 0})`], ['moderate', `Moderate (${stock_analysis?.overstock_summary?.moderate_overstock_count || 0})`]].map(([val, label]) => (
                  <button key={val} onClick={() => setStockLevelFilter(val)} style={styles.filterButton(stockLevelFilter === val)}>{label}</button>
                ))}
              </div>
              <div style={{ ...styles.card, marginBottom: '20px', background: theme.infoLight, border: `1px solid ${effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight}` }}>
                <div style={{ padding: '12px', background: theme.cardBg, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: theme.textPrimary }}>Total Overstock Value:</span>
                  <span style={{ fontWeight: '800', color: theme.danger, fontSize: '16px' }}>{formatCurrency(stock_analysis?.total_overstock_value || 0)}</span>
                </div>
              </div>
              {getFilteredOverstockedItems().length === 0 ? (
                <div style={styles.sufficiencyCard}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: effectiveTheme === 'blue' ? '#166534' : theme.accent, marginBottom: '8px' }}>No Overstocked Items</div>
                  <div style={{ fontSize: '14px', color: theme.textSecondary }}>No items match the selected overstock level filter.</div>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Drug Name', 'Packaging', 'Daily Usage', 'Store Qty', 'Shelves Qty', 'Total', 'Days Supply', 'Excess Qty', 'Excess Value', 'Level'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredOverstockedItems().map((item, i) => (
                        <tr key={i} className="table-row">
                          <td style={{ ...styles.td, fontWeight: '600' }}>{item.drug_name}</td>
                          <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                          <td style={styles.td}>{formatAverage(item.average_daily_usage)}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(item.store_quantity || 0)}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(item.shelves_quantity || 0)}</td>
                          <td style={{ ...styles.td, fontWeight: '700' }}>{formatNumber(item.total_available)}</td>
                          <td style={{ ...styles.td, fontWeight: '700', color: item.days_of_supply > 180 ? theme.danger : theme.warning }}>{formatNumber(item.days_of_supply)} days</td>
                          <td style={{ ...styles.td, fontWeight: '600', color: theme.danger }}>{formatNumber(item.excess_quantity)}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{formatCurrency(item.excess_value)}</td>
                          <td style={styles.td}><span style={styles.badge(item.overstock_level?.toLowerCase() === 'severe' ? 'red' : 'orange')}>{item.overstock_level}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── STOCK MOVEMENTS (DESKTOP) ── */}
          {activeView === 'movements' && (
            <>
              <div style={styles.filterPanel}>
                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel}>Filter by Drug</div>
                  <div style={{ position: 'relative' }}>
                    <input type="text" placeholder="Type to search or select a drug..." value={movementDrugSearch} onChange={handleMovementDrugSearchChange} onFocus={handleMovementDrugInputFocus} onBlur={() => setTimeout(() => setShowMovementDrugSuggestions(false), 200)} style={{ ...styles.inputBase, width: '100%' }} />
                    {showMovementDrugSuggestions && movementDrugSuggestions.length > 0 && (
                      <div style={styles.suggestionsContainer}>
                        <div className="suggestion-item" style={{ ...styles.suggestionItem, fontStyle: 'italic', color: theme.textMuted }} onMouseDown={() => { setMovementDrugFilter('all'); setMovementDrugSearch(''); setMovementDrugSuggestions(drugOptions); setShowMovementDrugSuggestions(false); }}>All Drugs</div>
                        {movementDrugSuggestions.map(drug => (
                          <div key={drug.drug_id} className="suggestion-item" style={styles.suggestionItem} onMouseDown={() => handleMovementDrugSuggestionClick(drug)}>
                            <div style={{ fontWeight: '600' }}>{drug.drug_name}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted }}>{drug.packaging}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ ...styles.filterGroup, flex: 'none' }}>
                  <div style={styles.filterLabel}>Filter by Date</div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <select value={movementDateMode} onChange={e => { setMovementDateMode(e.target.value); setMovementSingleDate(''); setMovementStartDate(''); setMovementEndDate(''); }} style={{ ...styles.select, width: '120px', flexShrink: 0, fontSize: '12px', padding: '8px 6px' }}>
                      <option value="all">All Dates</option>
                      <option value="single">Single Date</option>
                      <option value="range">Date Range</option>
                    </select>
                    {movementDateMode === 'single' && <input type="date" value={movementSingleDate} onChange={e => setMovementSingleDate(e.target.value)} style={{ ...styles.dateRangeInput }} />}
                    {movementDateMode === 'range' && (
                      <>
                        <input type="date" value={movementStartDate} onChange={e => setMovementStartDate(e.target.value)} style={{ ...styles.dateRangeInput }} />
                        <span style={{ color: theme.textMuted, fontSize: '12px', flexShrink: 0 }}>–</span>
                        <input type="date" value={movementEndDate} onChange={e => setMovementEndDate(e.target.value)} style={{ ...styles.dateRangeInput }} />
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                  <button className="apply-btn" onClick={handleApplyMovementFilters} style={styles.applyButton}>Apply</button>
                  {(movementFiltersApplied.drugFilter !== 'all' || movementFiltersApplied.dateMode !== 'all') && (
                    <button onClick={handleClearMovementFilters} style={{ padding: '9px 16px', background: 'none', border: `1px solid ${theme.danger}`, borderRadius: '8px', color: theme.danger, fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.filterSummaryBar}>
                  <span style={{ fontSize: '14px' }}>🔍</span>
                  <strong>Showing:</strong>
                  {movementFiltersApplied.drugFilter !== 'all' ? ` ${movementDrugSearch}` : ' All Drugs'}
                  {movementFiltersApplied.dateMode === 'single' && movementFiltersApplied.singleDate ? ` · Date: ${movementFiltersApplied.singleDate}` : movementFiltersApplied.dateMode === 'range' && movementFiltersApplied.startDate && movementFiltersApplied.endDate ? ` · ${movementFiltersApplied.startDate} → ${movementFiltersApplied.endDate}` : ' · All Dates'}
                </div>
                <div style={{ padding: '8px 14px', borderRadius: '8px', background: theme.tableHeader, border: `1px solid ${theme.cardBorder}`, fontSize: '12px', color: theme.textSecondary }}>{getFilteredMovements().length} transactions</div>
              </div>

              <div style={styles.tableWrapper}>
                {getFilteredMovements().length === 0 ? (
                  <div style={styles.emptyState}><div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div><div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>No movements found</div><div style={{ fontSize: '13px' }}>Try adjusting your filters or click Apply.</div></div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: '130px' }}>Date & Time</th>
                        <th style={styles.th}>Drug / Details</th>
                        <th style={{ ...styles.th, minWidth: '260px' }}>Action</th>
                        <th style={{ ...styles.th, width: '70px' }}>Qty</th>
                        <th style={{ ...styles.th, width: '90px' }}>Cost</th>
                        <th style={{ ...styles.th, width: '90px' }}>Selling</th>
                        <th style={{ ...styles.th, width: '120px' }}>Employee</th>
                        <th style={{ ...styles.th, width: '90px' }}>Store Bal</th>
                        <th style={{ ...styles.th, width: '90px' }}>Shelves Bal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredMovements().map((m, i) => {
                        const as = getActionStyle(m.action_text);
                        return (
                          <tr key={i} className="table-row">
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(m.activity_time)}</td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{m.drug_name}</div>
                              <div style={{ fontSize: '11px', color: theme.textMuted }}>{m.packaging || '—'}</div>
                              {showBatch && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Batch: {renderBatch(m.batch_number)}</div>}
                              {showExpiry && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Expiry: {renderExpiry(m.expiry_date)}</div>}
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ ...styles.badge('gray'), background: as.bg, color: as.color, padding: '4px 8px', flexShrink: 0, marginTop: '2px' }}>{as.icon}</span>
                                <div style={{ fontSize: '13px', color: theme.textPrimary, lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'normal' }}>{m.action_text}</div>
                              </div>
                            </td>
                            <td style={{ ...styles.td, fontWeight: '700', textAlign: 'right' }}>{formatNumber(m.quantity)}</td>
                            <td style={{ ...styles.td, fontWeight: '600', color: theme.textSecondary, textAlign: 'right' }}>{m.cost_price ? formatCurrency(m.cost_price) : '—'}</td>
                            <td style={{ ...styles.td, fontWeight: '600', color: theme.accent, textAlign: 'right' }}>{m.selling_price ? formatCurrency(m.selling_price) : '—'}</td>
                            <td style={{ ...styles.td, fontSize: '13px' }}>{m.employee_full_name || m.employee_name}</td>
                            <td style={{ ...styles.td, fontWeight: '600', textAlign: 'right' }}>{m.store_balance != null ? formatNumber(m.store_balance) : '—'}</td>
                            <td style={{ ...styles.td, fontWeight: '600', textAlign: 'right' }}>{m.shelves_balance != null ? formatNumber(m.shelves_balance) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── DRUGS IN VS OUT (DESKTOP) ── */}
          {activeView === 'drugsinout' && (
            fetchingDrugsInOut ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Calculating stock flows...</span>
              </div>
            ) : (
              <>
                <div style={styles.filterPanel}>
                  <div style={styles.filterGroup}>
                    <div style={styles.filterLabel}>Filter by Drug</div>
                    <div style={{ position: 'relative' }}>
                      <input type="text" placeholder="Type to search or select a drug..." value={inOutDrugSearch} onChange={handleInOutDrugSearchChange} onFocus={handleInOutDrugInputFocus} onBlur={() => setTimeout(() => setShowInOutDrugSuggestions(false), 200)} style={{ ...styles.inputBase, width: '100%' }} />
                      {showInOutDrugSuggestions && inOutDrugSuggestions.length > 0 && (
                        <div style={styles.suggestionsContainer}>
                          <div className="suggestion-item" style={{ ...styles.suggestionItem, fontStyle: 'italic', color: theme.textMuted }} onMouseDown={() => { setInOutDrugId('all'); setInOutDrugSearch(''); const completeList = drugOptions.length > 0 ? drugOptions : inOutDrugSuggestions; setInOutDrugSuggestions(completeList); setShowInOutDrugSuggestions(false); }}>All Drugs</div>
                          {inOutDrugSuggestions.map(drug => (
                            <div key={drug.drug_id} className="suggestion-item" style={styles.suggestionItem} onMouseDown={() => handleInOutDrugSuggestionClick(drug)}>
                              <div style={{ fontWeight: '600' }}>{drug.drug_name}</div>
                              <div style={{ fontSize: '11px', color: theme.textMuted }}>{drug.packaging}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.filterGroup, flex: 'none' }}>
                    <div style={styles.filterLabel}>Filter by Date</div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
                      <select value={inOutDateMode} onChange={e => { setInOutDateMode(e.target.value); setInOutSingleDate(''); setInOutStartDate(''); setInOutEndDate(''); setInOutDateError(''); }} style={{ ...styles.select, width: '120px', flexShrink: 0, fontSize: '12px', padding: '8px 6px' }}>
                        <option value="all">All Dates</option>
                        <option value="single">Single Date</option>
                        <option value="range">Date Range</option>
                      </select>
                      {inOutDateMode === 'single' && <input type="date" value={inOutSingleDate} onChange={e => setInOutSingleDate(e.target.value)} style={{ ...styles.dateRangeInput }} />}
                      {inOutDateMode === 'range' && (
                        <>
                          <input type="date" value={inOutStartDate} onChange={e => setInOutStartDate(e.target.value)} style={{ ...styles.dateRangeInput }} />
                          <span style={{ color: theme.textMuted, fontSize: '12px', flexShrink: 0 }}>–</span>
                          <input type="date" value={inOutEndDate} onChange={e => setInOutEndDate(e.target.value)} style={{ ...styles.dateRangeInput }} />
                        </>
                      )}
                    </div>
                    {inOutDateError && <div style={{ color: theme.danger, fontSize: '12px', marginTop: '4px' }}>⚠ {inOutDateError}</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <button className="apply-btn" onClick={handleApplyInOutFilters} style={styles.applyButton}>Apply</button>
                    {(inOutDrugId !== 'all' || inOutDrugSearch || inOutDateMode !== 'all') && (
                      <button onClick={handleClearInOutFilters} style={{ padding: '9px 16px', background: 'none', border: `1px solid ${theme.danger}`, borderRadius: '8px', color: theme.danger, fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</button>
                    )}
                  </div>
                </div>

                <div style={{ ...styles.filterSummaryBar, marginBottom: '20px' }}>
                  <span style={{ fontSize: '14px' }}>📊</span>
                  <strong>Current View:</strong> {getAppliedInOutFiltersText()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {inOutOpeningStock && inOutOpeningStock.total_quantity > 0 && (
                    <div style={{ ...styles.card, background: theme.infoLight }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ fontSize: '18px' }}>📦</span><span style={{ fontWeight: '600', fontSize: '12px', color: theme.info, textTransform: 'uppercase' }}>Opening Stock</span></div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px' }}>{formatNumber(inOutOpeningStock.total_quantity)} units</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: theme.info }}>{formatCurrency(inOutOpeningStock.total_value)}</div>
                      <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Store: {formatNumber(inOutOpeningStock.store_quantity)} | Shelves: {formatNumber(inOutOpeningStock.shelves_quantity)}</div>
                    </div>
                  )}
                  {inOutSummary && (
                    <>
                      {[
                        { label: 'Total IN', icon: '➕', color: theme.accent, bg: theme.accentLight, qty: inOutSummary.total_quantity_in || 0, val: inOutSummary.total_value_in || 0 },
                        { label: 'Total OUT', icon: '➖', color: theme.danger, bg: theme.dangerLight, qty: inOutSummary.total_quantity_out || 0, val: inOutSummary.total_value_out || 0 },
                        { label: 'Current Balance', icon: '⚖️', color: theme.warning, bg: theme.warningLight, qty: inOutSummary.current_quantity_balance || 0, val: inOutSummary.current_value_balance || 0 },
                      ].map(({ label, icon, color, bg, qty, val }) => (
                        <div key={label} style={{ ...styles.card, background: bg }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ fontSize: '18px' }}>{icon}</span><span style={{ fontWeight: '600', fontSize: '12px', color, textTransform: 'uppercase' }}>{label}</span></div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px' }}>{formatNumber(qty)} units</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color }}>{formatCurrency(val)}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {drugsInOutData?.drugs?.length > 0 ? (
                  <div style={styles.tableWrapper}>
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>📊 Drug-wise Analysis</span>
                      <span style={{ ...styles.badge('blue'), marginLeft: '4px' }}>{drugsInOutData.drugs.length} drugs</span>
                    </div>
                    {drugsInOutData.drugs.map(drug => {
                      const key = `${drug.drug_id}-${drug.drug_name}`;
                      return (
                        <div key={key} style={{ borderBottom: `1px solid ${theme.tableBorder}` }}>
                          <div style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => toggleExpand(key)} onMouseEnter={e => e.currentTarget.style.background = theme.tableRowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 2 }}><div style={{ fontWeight: '700', fontSize: '14px', color: theme.textPrimary }}>{drug.drug_name}</div><div style={{ fontSize: '12px', color: theme.textMuted }}>{drug.packaging}</div></div>
                              {[['IN', formatNumber(drug.in_quantity), formatCurrency(drug.in_value), theme.accent], ['OUT', formatNumber(drug.out_quantity), formatCurrency(drug.out_value), theme.danger], ['NET', formatNumber(drug.balance_quantity), formatCurrency(drug.balance_value), drug.balance_quantity >= 0 ? theme.accent : theme.danger]].map(([lbl, qty, val, color]) => (
                                <div key={lbl} style={{ flex: 1, textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>{lbl}</div>
                                  <div style={{ fontWeight: '700', color }}>{qty}</div>
                                  <div style={{ fontSize: '11px', color }}>{val}</div>
                                </div>
                              ))}
                              <div style={{ marginLeft: '16px', fontSize: '18px', color: theme.textMuted }}>{inOutExpanded[key] ? '▼' : '▶'}</div>
                            </div>
                          </div>
                          {inOutExpanded[key] && (
                            <div style={{ padding: '0 20px 16px', background: theme.tableRowHover }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
                                {[{ title: 'IN Movements', type: ['IN', 'TRANSFER'], color: theme.accent, sign: '+' }, { title: 'OUT Movements', type: ['OUT'], color: theme.danger, sign: '-' }].map(({ title, type, color, sign }) => (
                                  <div key={title}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color, marginBottom: '8px' }}>{title}:</div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                      {drug.transactions?.filter(t => type.includes(t.type)).slice(0, 5).map((t, idx, arr) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < arr.length - 1 ? `1px solid ${theme.tableBorder}` : 'none', fontSize: '12px' }}>
                                          <span style={{ color: theme.textMuted }}>{formatDateTime(t.time)}</span>
                                          <span style={{ fontWeight: '600', color }}>{sign}{formatNumber(t.quantity)}</span>
                                          <span style={{ color: theme.textSecondary }}>{t.employee}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {drug.transactions_preview?.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '8px' }}>Recent Actions:</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {drug.transactions_preview.slice(0, 3).map((preview, idx) => {
                                      const as = getActionStyle(preview.action);
                                      return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: theme.cardBg, borderRadius: '6px', fontSize: '12px' }}>
                                          <span style={{ ...styles.badge('gray'), background: as.bg, color: as.color, padding: '2px 6px' }}>{as.icon}</span>
                                          <span style={{ flex: 1, color: theme.textSecondary }}>{preview.action}</span>
                                          <span style={{ color: theme.textMuted, fontSize: '11px' }}>{formatDateTime(preview.time)}</span>
                                          <span style={{ color: theme.textPrimary }}>{preview.employee}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div style={{ marginTop: '12px', fontSize: '11px', color: theme.textMuted, textAlign: 'right' }}>Total transactions: {drug.total_transactions}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, marginBottom: '4px' }}>No data available</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>Click Apply to load data, or adjust your filter criteria.</div>
                  </div>
                )}
              </>
            )
          )}

          {/* ── ALL STOCK (DESKTOP) ── */}
          {activeView === 'allstock' && (
            fetchingAllStock ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Loading inventory...</span>
              </div>
            ) : allStockData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'STORE TOTAL', icon: '📦', color: effectiveTheme === 'blue' ? '#1e40af' : theme.info, bg: effectiveTheme === 'blue' ? '#eff6ff' : theme.infoLight, border: effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight, qty: getStockTotals().total_store_quantity, val: getStockTotals().total_store_value },
                    { label: 'SHELVES TOTAL', icon: '🏪', color: effectiveTheme === 'blue' ? '#92400e' : theme.warning, bg: effectiveTheme === 'blue' ? '#fef3c7' : theme.warningLight, border: effectiveTheme === 'blue' ? '#fde68a' : theme.warningLight, qty: getStockTotals().total_shelves_quantity, val: getStockTotals().total_shelves_value },
                    { label: 'COMBINED TOTAL', icon: '💰', color: effectiveTheme === 'blue' ? '#166534' : theme.accent, bg: effectiveTheme === 'blue' ? '#dcfce7' : theme.accentLight, border: effectiveTheme === 'blue' ? '#bbf7d0' : theme.accentLight, qty: getStockTotals().total_combined_quantity, val: getStockTotals().total_combined_value },
                  ].map(c => (
                    <div key={c.label} style={{ ...styles.card, background: c.bg, border: `1px solid ${c.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}><span style={{ fontSize: '24px' }}>{c.icon}</span><span style={{ fontWeight: '700', fontSize: '14px', color: c.color }}>{c.label}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px', color: theme.textSecondary }}>Total Items:</span><span style={{ fontSize: '18px', fontWeight: '800', color: c.color }}>{formatNumber(c.qty)} units</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: theme.textSecondary }}>Total Value:</span><span style={{ fontSize: '18px', fontWeight: '800', color: c.color }}>{formatCurrency(c.val)}</span></div>
                    </div>
                  ))}
                </div>
                <div style={styles.tableWrapper}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>📋 Detailed Stock Breakdown</span>
                    <span style={{ ...styles.badge('green'), marginLeft: '4px' }}>{getGroupedAllStock().length} products</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Drug Name / Details</th>
                        <th style={styles.th}>Packaging</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#eff6ff' : theme.infoLight, color: effectiveTheme === 'blue' ? '#1e40af' : theme.info }}>Store Qty</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#fef3c7' : theme.warningLight, color: effectiveTheme === 'blue' ? '#92400e' : theme.warning }}>Shelves Qty</th>
                        <th style={styles.th}>Total Qty</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#eff6ff' : theme.infoLight, color: effectiveTheme === 'blue' ? '#1e40af' : theme.info }}>Store Value</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#fef3c7' : theme.warningLight, color: effectiveTheme === 'blue' ? '#92400e' : theme.warning }}>Shelves Value</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#dcfce7' : theme.accentLight, color: effectiveTheme === 'blue' ? '#166534' : theme.accent }}>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getGroupedAllStock().map((item, i) => {
                        const sv  = (item.store_quantity  || 0) * (item.cost_price || 0);
                        const shv = (item.shelves_quantity || 0) * (item.cost_price || 0);
                        return (
                          <tr key={i} className="table-row">
                            <td style={styles.td}>
                              <div style={{ fontWeight: '600' }}>{item.drug_name}</div>
                              {showBatch && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Batch: {renderBatch(item.batch_number)}</div>}
                              {showExpiry && <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Expiry: {renderExpiry(item.expiry_date)}</div>}
                            </td>
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{item.packaging}</td>
                            <td style={{ ...styles.td, fontWeight: '600', background: effectiveTheme === 'blue' ? '#f0f9ff' : theme.infoLight }}>{formatNumber(item.store_quantity)}</td>
                            <td style={{ ...styles.td, fontWeight: '600', background: effectiveTheme === 'blue' ? '#fefce8' : theme.warningLight }}>{formatNumber(item.shelves_quantity)}</td>
                            <td style={{ ...styles.td, fontWeight: '700' }}>{formatNumber((item.store_quantity || 0) + (item.shelves_quantity || 0))}</td>
                            <td style={{ ...styles.td, fontWeight: '600', color: effectiveTheme === 'blue' ? '#1e40af' : theme.info, background: effectiveTheme === 'blue' ? '#f0f9ff' : theme.infoLight }}>{formatCurrency(sv)}</td>
                            <td style={{ ...styles.td, fontWeight: '600', color: effectiveTheme === 'blue' ? '#92400e' : theme.warning, background: effectiveTheme === 'blue' ? '#fefce8' : theme.warningLight }}>{formatCurrency(shv)}</td>
                            <td style={{ ...styles.td, fontWeight: '700', color: effectiveTheme === 'blue' ? '#166534' : theme.accent, background: effectiveTheme === 'blue' ? '#dcfce7' : theme.accentLight }}>{formatCurrency(sv + shv)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ ...styles.card, textAlign: 'center', padding: '48px', color: theme.textMuted }}>Unable to load stock data.</div>
            )
          )}

          {/* ── DISCREPANCIES (DESKTOP) ── */}
          {activeView === 'discrepancies' && !showDiscrepancyModal && (
            fetchingAllStock ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: theme.textSecondary }}>Loading stock for discrepancy check…</span>
              </div>
            ) : selectedDrugs.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', padding: '14px 18px', background: theme.infoLight, border: `1px solid ${effectiveTheme === 'blue' ? '#bfdbfe' : theme.infoLight}`, borderRadius: '10px' }}>
                  <div style={{ fontWeight: '700', color: effectiveTheme === 'blue' ? '#1d4ed8' : theme.info, fontSize: '14px', marginBottom: '4px' }}>🔍 Physical Count Audit — 10 Random Drugs</div>
                  <div style={{ fontSize: '13px', color: effectiveTheme === 'blue' ? '#3b82f6' : theme.textSecondary }}>Enter the physical counts from your store and shelves, then click "Check Discrepancies".</div>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Drug Name</th>
                        <th style={styles.th}>Packaging</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#ecfdf5' : theme.accentLight, color: effectiveTheme === 'blue' ? '#166634' : theme.accent }}>System Store</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#ecfdf5' : theme.accentLight, color: effectiveTheme === 'blue' ? '#166634' : theme.accent }}>System Shelves</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#fffbeb' : theme.warningLight, color: effectiveTheme === 'blue' ? '#92400e' : theme.warning }}>Physical Store</th>
                        <th style={{ ...styles.th, background: effectiveTheme === 'blue' ? '#fffbeb' : theme.warningLight, color: effectiveTheme === 'blue' ? '#92400e' : theme.warning }}>Physical Shelves</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDrugs.map(drug => {
                        const system = allStockData.filter(i => i.drug_id === drug.drug_id);
                        const systemStore = system.find(i => i.location === 'store')?.Quantity || 0;
                        const systemShelves = system.find(i => i.location === 'shelves')?.Quantity || 0;
                        return (
                          <tr key={drug.drug_id} className="table-row">
                            <td style={{ ...styles.td, fontWeight: '600' }}>{drug.drug_name}</td>
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>{drug.packaging}</td>
                            <td style={{ ...styles.td, fontWeight: '700', background: effectiveTheme === 'blue' ? '#f0fdf4' : theme.accentLight }}>{formatNumber(systemStore)}</td>
                            <td style={{ ...styles.td, fontWeight: '700', background: effectiveTheme === 'blue' ? '#f0fdf4' : theme.accentLight }}>{formatNumber(systemShelves)}</td>
                            <td style={{ ...styles.td, background: effectiveTheme === 'blue' ? '#fefce8' : theme.warningLight }}>
                              <input type="number" value={physicalInputs[drug.drug_id]?.store || ''} onChange={e => setPhysicalInputs({ ...physicalInputs, [drug.drug_id]: { ...physicalInputs[drug.drug_id], store: e.target.value } })} placeholder="0" style={{ width: '90px', padding: '7px 10px', border: `1.5px solid ${effectiveTheme === 'blue' ? '#fde68a' : theme.warningLight}`, borderRadius: '7px', fontSize: '13px', textAlign: 'center', fontWeight: '600', background: effectiveTheme === 'blue' ? '#fffbeb' : theme.warningLight, outline: 'none' }} />
                            </td>
                            <td style={{ ...styles.td, background: effectiveTheme === 'blue' ? '#fefce8' : theme.warningLight }}>
                              <input type="number" value={physicalInputs[drug.drug_id]?.shelves || ''} onChange={e => setPhysicalInputs({ ...physicalInputs, [drug.drug_id]: { ...physicalInputs[drug.drug_id], shelves: e.target.value } })} placeholder="0" style={{ width: '90px', padding: '7px 10px', border: `1.5px solid ${effectiveTheme === 'blue' ? '#fde68a' : theme.warningLight}`, borderRadius: '7px', fontSize: '13px', textAlign: 'center', fontWeight: '600', background: effectiveTheme === 'blue' ? '#fffbeb' : theme.warningLight, outline: 'none' }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleCheckDiscrepancies} className="action-btn" style={{ padding: '11px 28px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>🔍 Check Discrepancies</button>
                </div>
              </>
            ) : (
              <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}><div style={{ fontSize: '13px', color: theme.textMuted }}>Unable to load data for discrepancy check.</div></div>
            )
          )}
        </div>
      </main>

      {/* ── DISCREPANCY MODAL (DESKTOP) ── */}
      {showDiscrepancyModal && discrepancyResults && (
        <div style={styles.modalOverlay} onClick={() => setShowDiscrepancyModal(false)}>
          <div style={{ ...styles.modalContent, animation: 'modalSlideIn 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔍</span>
                <div><div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>Discrepancy Results</div><div style={{ fontSize: '13px', color: theme.textMuted }}>Physical count vs System comparison</div></div>
              </div>
              <button onClick={() => setShowDiscrepancyModal(false)} className="close-btn" style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                  { label: 'Accuracy', value: `${discrepancyResults.accuracy.toFixed(1)}%`, bg: discrepancyResults.accuracy === 100 ? theme.accentLight : theme.warningLight, color: discrepancyResults.accuracy === 100 ? theme.accent : theme.warning },
                  { label: 'Matches', value: `${discrepancyResults.results.filter(r => r.status === 'Match').length}/${discrepancyResults.results.length}`, bg: theme.tableHeader, color: theme.accent },
                  { label: 'Discrepancies', value: discrepancyResults.results.filter(r => r.status === 'Discrepancy').length, bg: theme.dangerLight, color: theme.danger },
                ].map(({ label, value, bg, color }) => (
                  <div key={label} style={{ padding: '20px', background: bg, borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color, marginBottom: '8px' }}>{label}</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={styles.tableWrapper}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.tableBorder}`, background: theme.tableHeader }}><div style={{ fontWeight: '700', fontSize: '14px', color: theme.textPrimary }}>Detailed Comparison</div></div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Drug', 'Location', 'System', 'Physical', 'Variance', 'Status'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {discrepancyResults.results.map((result, i) => (
                      <React.Fragment key={i}>
                        {[{ loc: 'Store', sys: result.systemStore, phys: result.physicalStore, variance: result.storeVariance, badge: 'blue' }, { loc: 'Shelves', sys: result.systemShelves, phys: result.physicalShelves, variance: result.shelvesVariance, badge: 'orange' }].map(({ loc, sys, phys, variance, badge }) => (
                          <tr key={loc} className="table-row">
                            <td style={{ ...styles.td, fontWeight: '600' }}>{loc === 'Store' ? result.drug_name : ''}</td>
                            <td style={styles.td}><span style={styles.badge(badge)}>{loc}</span></td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(sys)}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>{formatNumber(phys)}</td>
                            <td style={{ ...styles.td, fontWeight: '700', color: variance === 0 ? theme.accent : variance > 0 ? theme.warning : theme.danger }}>{variance === 0 ? '✓' : variance > 0 ? `+${variance}` : variance}</td>
                            <td style={styles.td}><span style={styles.badge(variance === 0 ? 'green' : 'red')}>{variance === 0 ? 'Match' : 'Variance'}</span></td>
                          </tr>
                        ))}
                        {(result.diffStore > 0 || result.diffShelves > 0) && (
                          <tr><td colSpan="6" style={{ padding: '4px 16px 12px', background: theme.dangerLight, borderBottom: `1px solid ${theme.tableBorder}` }}><span style={{ fontSize: '12px', color: theme.danger }}>⚠ Total discrepancy: {formatNumber(result.diffStore + result.diffShelves)} units</span></td></tr>
                        )}
                        <tr><td colSpan="6" style={{ padding: '4px' }} /></tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowDiscrepancyModal(false)} style={{ padding: '10px 20px', background: theme.tableHeader, border: `1px solid ${theme.cardBorder}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: theme.textSecondary, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { setActiveView('discrepancies'); setShowDiscrepancyModal(false); setSelectedDrugs([]); setPhysicalInputs({}); }} style={{ padding: '10px 20px', background: theme.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>New Count</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTracking;
