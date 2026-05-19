import React, { useState, useEffect, useCallback, useRef } from 'react';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import GiveFPmodal from './GiveFPmodal';
import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
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
    filterSection: '#071535',
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
    inputBg: 'rgba(255,255,255,0.08)',
    inputBorder: 'rgba(255,255,255,0.2)',
    inputText: '#ffffff',
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
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    inputText: '#0f172a',
  }
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = ({ theme }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.textMuted}55; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}99; }

    .nav-item:hover {
      background: ${theme.navHoverBg} !important;
      color: ${theme.sidebarText} !important;
    }
    .nav-icon { color: ${theme.iconBright}; font-size: 17px; transition: transform 0.2s ease; }
    .nav-item:hover .nav-icon { transform: scale(1.15); color: ${theme.iconHover}; }

    .collapse-btn:hover {
      background: ${theme.collapseButtonHover} !important;
      transform: scale(1.06);
    }

    .patient-card:hover {
      border-color: ${theme.accent} !important;
      box-shadow: 0 4px 16px rgba(22,163,74,0.1);
      transform: translateY(-1px);
    }

    .method-row:hover {
      border-color: ${theme.accent} !important;
      background: ${theme.accentLight};
      transform: translateX(2px);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    }

    /* Filter panel slide-in */
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* History card staggered entrance */
    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .history-card {
      animation: cardEntrance 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* Pulse dot for "live" indicator */
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.35); }
    }
    .live-dot { animation: pulse 2s ease-in-out infinite; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner { animation: spin 0.9s linear infinite; }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .fade-slide-in { animation: fadeSlideIn 0.25s ease both; }

    @keyframes shimmer {
      from { background-position: -200% 0; }
      to   { background-position: 200% 0; }
    }

    /* Filter section slide */
    @keyframes filterReveal {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 800px; }
    }
    .filter-reveal {
      animation: filterReveal 0.3s ease both;
      overflow: hidden;
    }

    /* Checkbox custom */
    .method-check {
      accent-color: ${theme.accent};
      width: 14px;
      height: 14px;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Date inputs */
    input[type="date"]::-webkit-calendar-picker-indicator {
      opacity: 0.5;
      cursor: pointer;
      filter: ${theme.sidebarBg === '#0a1e4a' ? 'invert(1)' : 'none'};
    }

    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: 1fr 1fr !important; }
      .columns-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─── LIVE CLOCK ───────────────────────────────────────────────────────────────
function LiveClock({ theme }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      fontSize: '12.5px',
      color: theme.textMuted,
      fontFamily: "'JetBrains Mono', monospace",
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.02em',
    }}>
      {time.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' })}
      {' · '}
      {time.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────
function LoadingSpinner({ theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div className="spinner" style={{ width: '38px', height: '38px', border: `3px solid ${theme.tableBorder}`, borderTopColor: theme.accent, borderRadius: '50%' }} />
      <div style={{ color: theme.textMuted, fontSize: '14px', fontWeight: '500' }}>Loading dashboard…</div>
    </div>
  );
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
const Notification = ({ message, type, onDismiss, theme }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div style={{
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderLeft: `4px solid ${type === 'success' ? theme.accent : theme.danger}`,
      borderRadius: '10px',
      padding: '13px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'fadeSlideIn 0.25s ease both',
    }}>
      <span style={{ fontSize: '16px' }}>{type === 'success' ? '✓' : '⚠'}</span>
      <span style={{ fontSize: '13px', color: theme.textPrimary, fontWeight: '500' }}>{message}</span>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon, theme }) => (
  <div className="stat-card" style={{
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '14px',
    padding: '20px',
    transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '52px', opacity: 0.05 }}>{icon}</div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>{label}</div>
    <div style={{ fontSize: '34px', fontWeight: '800', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>{sub}</div>
  </div>
);

// ─── SIDEBAR FILTER PANEL ─────────────────────────────────────────────────────
const FilterPanel = ({
  theme, isBlue,
  searchName, setSearchName,
  startDate, setStartDate,
  endDate, setEndDate,
  selectedMethods, toggleMethodFilter,
  availableMethods,
  filterCount, totalCount,
  clearFilters,
}) => {
  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: `1px solid ${theme.inputBorder}`,
    background: theme.inputBg,
    color: theme.inputText,
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: theme.sidebarTextMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div className="filter-reveal" style={{
      margin: '0 10px 10px',
      padding: '14px',
      background: isBlue ? 'rgba(255,255,255,0.04)' : theme.tableHeader,
      borderRadius: '12px',
      border: `1px solid ${theme.sidebarBorder}`,
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: theme.sidebarText, display: 'flex', alignItems: 'center', gap: '6px' }}>
          🔍 Filters
        </span>
        <button onClick={clearFilters} style={{
          background: 'transparent', border: 'none',
          color: theme.danger, fontSize: '11px',
          cursor: 'pointer', fontWeight: '600', padding: '2px 6px',
          borderRadius: '4px',
        }}>Clear</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Patient Name</label>
        <input
          type="text"
          placeholder="Search by name…"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Date range — stacked for narrow sidebar */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Date Range</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: theme.sidebarTextMuted, minWidth: '24px', fontWeight: '600' }}>From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: theme.sidebarTextMuted, minWidth: '24px', fontWeight: '600' }}>To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Method checkboxes */}
      {availableMethods.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>FP Method</label>
          <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '4px' }}>
            {availableMethods.map(method => (
              <label key={method} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', color: theme.sidebarText,
                cursor: 'pointer', padding: '4px 6px', borderRadius: '6px',
                background: selectedMethods.includes(method)
                  ? (isBlue ? 'rgba(37,99,235,0.25)' : theme.accentLight)
                  : 'transparent',
                transition: 'background 0.15s',
              }}>
                <input
                  type="checkbox"
                  className="method-check"
                  checked={selectedMethods.includes(method)}
                  onChange={() => toggleMethodFilter(method)}
                />
                <span style={{ lineHeight: 1.3, fontSize: '11.5px' }}>{method}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Result count */}
      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: `1px solid ${theme.sidebarBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <span style={{
          fontSize: '13px', fontWeight: '700',
          color: theme.accent,
        }}>{filterCount}</span>
        <span style={{ fontSize: '11px', color: theme.sidebarTextMuted }}>
          of {totalCount} records
        </span>
      </div>
    </div>
  );
};

// ─── HISTORY CARD ─────────────────────────────────────────────────────────────
const HistoryCard = ({ record, idx, theme }) => {
  const name = record.patient_name ||
    `${record.first_name || ''} ${record.last_name || ''}`.trim() ||
    'Unknown Patient';
  const isComplete = (record.status || '').toLowerCase().includes('complet');
  const dateStr = record.date
    ? new Date(record.date).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      className="history-card"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: '12px',
        padding: '18px',
        animationDelay: `${Math.min(idx * 40, 400)}ms`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: name + method badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '700', fontSize: '15px',
            color: theme.textPrimary,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name}</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
            {record.age && (
              <span style={{ fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>👤</span> {record.age} yrs
              </span>
            )}
            {record.sex && (
              <span style={{ fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>⚧</span> {record.sex}
              </span>
            )}
          </div>
        </div>
        {record.method && (
          <span style={{
            flexShrink: 0,
            fontSize: '11px', fontWeight: '600',
            background: theme.skyBlueLight, color: theme.skyBlue,
            padding: '4px 12px', borderRadius: '20px',
            border: `1px solid ${theme.skyBlue}40`,
            whiteSpace: 'nowrap',
            maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{record.method}</span>
        )}
      </div>

      {/* Bottom row: date + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        paddingTop: '10px',
        borderTop: `1px dashed ${theme.cardBorder}`,
      }}>
        {dateStr ? (
          <span style={{ fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
            📅 {dateStr}
          </span>
        ) : <span />}
        {record.status && (
          <span style={{
            fontSize: '11px', fontWeight: '600',
            color: isComplete ? theme.accent : theme.warning,
            background: isComplete ? theme.accentLight : theme.warningLight,
            padding: '3px 10px', borderRadius: '20px',
          }}>
            {isComplete ? '✓' : '⏳'} {record.status}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function NurseDashboard() {
  const [fpPatients, setFpPatients] = useState([]);
  const [familyPlanningMethods, setFamilyPlanningMethods] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clientStatuses, setClientStatuses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [activeSection, setActiveSection] = useState('fp');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('blue');

  const [showFpHistory, setShowFpHistory] = useState(false);
  const [fpHistory, setFpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedMethods, setSelectedMethods] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  const [useDrugExpiryDate, setUseDrugExpiryDate] = useState('yes');
  const [useDrugBatchNumbers, setUseDrugBatchNumbers] = useState('yes');

  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token') || '';
  const theme = colors[currentTheme];
  const isBlue = currentTheme === 'blue';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const initials = (name) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  // ── Security ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!urlToken) { navigate('/login'); return; }
    (async () => {
      try {
        const res = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.message === 'Session valid') {
          setEmployeeName(data.employee_name || '');
          const tc = data.colour || '';
          setCurrentTheme(!tc || tc.toLowerCase() === 'white' || tc.toLowerCase() === 'null' ? 'white' : 'blue');
          setUseDrugExpiryDate(data.use_drug_expiry_date || 'yes');
          setUseDrugBatchNumbers(data.use_drug_batch_numbers || 'yes');
          saveSessionToken(data.clinic_session_token);
        } else if (data.error === 'Session expired') {
          navigate(`/dashboard?token=${data.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } catch { navigate('/login'); }
    })();
  }, [navigate, urlToken]);

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchFPPatients = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.fetchFPwaiting, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) setFpPatients(Array.isArray(data.contacts) ? data.contacts : []);
    } catch { if (isMounted.current) setErrorMessage('Unable to load patient data. Retrying…'); }
  }, [urlToken]);

  const fetchMethods = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.allFamilyPlanningMethods, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) setFamilyPlanningMethods(Array.isArray(data) ? data : []);
    } catch {}
  }, [urlToken]);

  const fetchStatuses = useCallback(async () => {
    if (!urlToken) return;
    try {
      const res = await fetch(urls.fetchFPstatus, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) setClientStatuses(Array.isArray(data.contacts) ? data.contacts : []);
    } catch { if (isMounted.current) setErrorMessage('Unable to load client statuses. Retrying…'); }
  }, [urlToken]);

  const fetchFpHistory = useCallback(async () => {
    if (!urlToken) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(urls.fetchFPhistory, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isMounted.current) {
        const hist = Array.isArray(data) ? data : [];
        setFpHistory(hist);
        const ms = new Set();
        hist.forEach(r => { if (r.method) ms.add(r.method); });
        setAvailableMethods(Array.from(ms).sort());
      }
    } catch {
      if (isMounted.current) { setFpHistory([]); addNotification('Could not load FP history', 'error'); }
    } finally {
      if (isMounted.current) setLoadingHistory(false);
    }
  }, [urlToken, addNotification]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showFpHistory) return;

    let filtered = [...fpHistory];

    if (startDate) {
      // parse YYYY-MM-DD directly to avoid timezone offset issues
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      filtered = filtered.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d >= start;
      });
    }
    if (endDate) {
      const [ey, em, ed] = endDate.split('-').map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      filtered = filtered.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date);
        return d <= end;
      });
    }
    if (selectedMethods.length > 0) {
      filtered = filtered.filter(r => r.method && selectedMethods.includes(r.method));
    }
    if (searchName.trim()) {
      const q = searchName.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const full = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
        const pn = (r.patient_name || '').toLowerCase();
        return full.includes(q) || pn.includes(q);
      });
    }

    setFilteredHistory(filtered);
  }, [showFpHistory, fpHistory, startDate, endDate, selectedMethods, searchName]);

  // Reset filters when closing history
  useEffect(() => {
    if (!showFpHistory) {
      setSelectedMethods([]);
      setStartDate('');
      setEndDate('');
      setSearchName('');
      setFilteredHistory([]);
    }
  }, [showFpHistory]);

  const refreshAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    await Promise.allSettled([fetchFPPatients(), fetchStatuses()]);
    if (showSpinner && isMounted.current) setIsRefreshing(false);
  }, [fetchFPPatients, fetchStatuses]);

  // ── Init + polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    (async () => {
      setLoading(true);
      await Promise.allSettled([fetchFPPatients(), fetchMethods(), fetchStatuses()]);
      if (isMounted.current) setLoading(false);
    })();
    intervalRef.current = setInterval(() => refreshAll(false), 10000);
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchFPPatients, fetchMethods, fetchStatuses, refreshAll]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const submitMethod = async (fpId, methodName) => {
    try {
      const res = await fetch(urls.payfp, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken, fpId, methodName }),
      });
      if (!res.ok) throw new Error();
      addNotification('Submitted! Please send the client to the cashier.', 'success');
      setSelectedPatient(null);
      refreshAll();
    } catch { addNotification('Submission failed. Please try again.', 'error'); }
  };

  const handleMethodSelect = (methodName) => {
    if (!selectedPatient?.fp_id) { addNotification('No patient selected', 'error'); return; }
    const msg = `Confirm "${methodName}" for ${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}?`;
    if (window.confirm(msg)) submitMethod(selectedPatient.fp_id, methodName);
  };

  const handleOpenModal = (client) => {
    if (!client?.contact_id) { addNotification('Invalid client data', 'error'); return; }
    setModalData({ ...client, token: urlToken, use_drug_expiry_date: useDrugExpiryDate, use_drug_batch_numbers: useDrugBatchNumbers });
    setShowModal(true);
  };

  const handleShowFpHistory = () => {
    const next = !showFpHistory;
    setShowFpHistory(next);
    if (next) fetchFpHistory();
  };

  const toggleMethodFilter = (method) => setSelectedMethods(prev =>
    prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
  );

  const clearFilters = () => { setSelectedMethods([]); setStartDate(''); setEndDate(''); setSearchName(''); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const waitingCount = fpPatients.length;
  const giveCount = clientStatuses.filter(c => c?.status?.includes('Give')).length;
  const doneCount = clientStatuses.filter(c => !c?.status?.includes('Give')).length;
  const filterCount = filteredHistory.length;

  // ── Sidebar width ──────────────────────────────────────────────────────────
  const SIDEBAR_W = sidebarCollapsed ? 74 : 256;

  // Navigation items definition - consistent for both dashboard and history views
  const navSections = [
    {
      label: 'FAMILY PLANNING',
      items: [
        { id: 'fp', icon: '🩺', label: 'FP Dashboard', badge: waitingCount, action: () => { setActiveSection('fp'); setShowFpHistory(false); } },
      ],
    },
    {
      label: 'MODULES',
      items: [
        { id: 'maternity', icon: '🤱', label: 'Maternity', action: () => navigate(`/mothers/?token=${urlToken}`) },
        { id: 'files', icon: '📂', label: 'Patient Files', action: () => navigate(`/patientfiles2/?token=${urlToken}`) },
      ],
    },
  ];

  // ── Panel shared styles ────────────────────────────────────────────────────
  const panel = {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
  const panelHeader = {
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.tableBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: theme.tableHeader,
  };

  if (loading) return (
    <>
      <GlobalStyles theme={theme} />
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>
        <aside style={{ width: `${SIDEBAR_W}px`, background: theme.sidebarBg, position: 'fixed', inset: '0 auto 0 0' }} />
        <main style={{ marginLeft: `${SIDEBAR_W}px`, flex: 1 }}>
          <Topbar token={urlToken} themeColor={currentTheme} />
          <div style={{ padding: '28px' }}><LoadingSpinner theme={theme} /></div>
        </main>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles theme={theme} />

      {/* ── Notifications ── */}
      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1100, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', width: '100%' }}>
        {notifications.map(n => (
          <Notification key={n.id} message={n.message} type={n.type} onDismiss={() => removeNotification(n.id)} theme={theme} />
        ))}
      </div>

      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>

        {/* ───── SIDEBAR ───────────────────────────────────────────────── */}
        <aside style={{
          width: `${SIDEBAR_W}px`,
          background: theme.sidebarBg,
          borderRight: `1px solid ${theme.sidebarBorder}`,
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: isBlue ? '2px 0 12px rgba(0,0,0,0.15)' : '2px 0 8px rgba(0,0,0,0.04)',
          transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
          zIndex: 900,
          paddingTop: '60px', // below topbar
        }}>

          {/* Logo row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            padding: sidebarCollapsed ? '16px 0' : '16px 12px',
            borderBottom: `1px solid ${theme.sidebarBorder}`,
            background: isBlue ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            flexShrink: 0,
          }}>
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div style={{ width: '38px', height: '38px', background: theme.logoBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '13px', flexShrink: 0 }}>CP</div>
                <div>
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' }}>MEDCORE</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '10.5px', whiteSpace: 'nowrap' }}>Nurse Workstation</div>
                </div>
              </div>
            )}
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(s => !s)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: theme.collapseButtonBg,
                border: `1px solid ${isBlue ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'}`,
                color: theme.collapseButtonText,
                width: '34px', height: '34px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '16px', fontWeight: '700',
                transition: 'all 0.2s ease', flexShrink: 0,
              }}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Staff card */}
          {!sidebarCollapsed && employeeName && (
            <div style={{
              margin: '12px 10px',
              background: theme.staffCardBg,
              borderRadius: '10px',
              padding: '12px',
              border: `1px solid ${theme.staffCardBorder}`,
              flexShrink: 0,
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{initials(employeeName)}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employeeName}</div>
              <div style={{ fontSize: '10px', color: theme.sidebarTextMuted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Nurse</div>
            </div>
          )}

          {/* Nav sections - always visible regardless of showFpHistory */}
          <nav style={{ flex: 1, padding: sidebarCollapsed ? '8px 0' : '6px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
            {navSections.map(sec => (
              <div key={sec.label} style={{ marginBottom: '14px' }}>
                {!sidebarCollapsed && (
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: '0 6px', marginBottom: '6px', marginTop: '8px' }}>{sec.label}</div>
                )}
                {sec.items.map(item => {
                  // Determine active state: FP Dashboard is active only when NOT showing history AND activeSection is 'fp'
                  const isActive = item.id === 'fp' && activeSection === 'fp' && !showFpHistory;
                  return (
                    <button
                      key={item.id}
                      className={`nav-item${isActive ? ' active-tab' : ''}`}
                      onClick={item.action}
                      onMouseEnter={() => setHoveredNavItem(item.id)}
                      onMouseLeave={() => setHoveredNavItem(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        gap: sidebarCollapsed ? 0 : '10px',
                        padding: sidebarCollapsed ? '11px 0' : '9px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? theme.activeNavText : theme.inactiveNavText,
                        background: isActive ? theme.activeNavBg : 'transparent',
                        transition: 'all 0.15s ease',
                        border: 'none',
                        width: '100%',
                        textAlign: sidebarCollapsed ? 'center' : 'left',
                        marginBottom: '2px',
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      <span className="nav-icon" style={{ width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      {!sidebarCollapsed && (
                        <>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                          {item.badge > 0 && item.id === 'fp' && (
                            <span className="live-dot" style={{ background: theme.danger, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '10px', minWidth: '20px', textAlign: 'center' }}>{item.badge}</span>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && hoveredNavItem === item.id && (
                        <div style={{
                          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                          marginLeft: '10px', padding: '7px 12px',
                          background: theme.tooltipBg, color: theme.tooltipText,
                          fontSize: '12px', fontWeight: '500', borderRadius: '6px',
                          whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        }}>
                          {item.label}{item.badge > 0 && item.id === 'fp' ? ` (${item.badge})` : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* FP History toggle - separate from main nav but still always visible */}
            <div style={{ marginBottom: '14px' }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: '0 6px', marginBottom: '6px', marginTop: '8px' }}>HISTORY</div>
              )}
              <button
                onClick={handleShowFpHistory}
                onMouseEnter={() => setHoveredNavItem('history')}
                onMouseLeave={() => setHoveredNavItem(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: sidebarCollapsed ? 0 : '10px',
                  padding: sidebarCollapsed ? '11px 0' : '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: showFpHistory ? '600' : '500',
                  color: showFpHistory ? theme.activeNavText : theme.inactiveNavText,
                  background: showFpHistory ? theme.activeNavBg : 'transparent',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  width: '100%',
                  textAlign: sidebarCollapsed ? 'center' : 'left',
                  position: 'relative',
                }}
              >
                <span className="nav-icon" style={{ width: '20px', textAlign: 'center', flexShrink: 0 }}>📜</span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>FP History</span>}
                {sidebarCollapsed && hoveredNavItem === 'history' && (
                  <div style={{
                    position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                    marginLeft: '10px', padding: '7px 12px',
                    background: theme.tooltipBg, color: theme.tooltipText,
                    fontSize: '12px', fontWeight: '500', borderRadius: '6px',
                    whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}>FP History</div>
                )}
              </button>
            </div>
          </nav>

          {/* Filter Panel — only when history is active and sidebar is expanded */}
          {showFpHistory && !sidebarCollapsed && (
            <FilterPanel
              theme={theme}
              isBlue={isBlue}
              searchName={searchName} setSearchName={setSearchName}
              startDate={startDate} setStartDate={setStartDate}
              endDate={endDate} setEndDate={setEndDate}
              selectedMethods={selectedMethods} toggleMethodFilter={toggleMethodFilter}
              availableMethods={availableMethods}
              filterCount={filterCount}
              totalCount={fpHistory.length}
              clearFilters={clearFilters}
            />
          )}

          {/* User footer */}
          <div style={{
            padding: sidebarCollapsed ? '14px 0' : '12px 10px',
            borderTop: `1px solid ${theme.sidebarBorder}`,
            background: isBlue ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px',
          }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {employeeName ? initials(employeeName) : 'N'}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', color: theme.sidebarTextMuted }}>Logged in as</div>
                <div style={{ fontSize: '12px', color: theme.sidebarText, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{employeeName}</div>
              </div>
            )}
          </div>
        </aside>

        {/* ───── MAIN ──────────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: `${SIDEBAR_W}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
          paddingTop: '60px',
        }}>
          <Topbar token={urlToken} themeColor={currentTheme} />

          {/* Secondary bar */}
          <div style={{
            background: theme.cardBg,
            borderBottom: `1px solid ${theme.cardBorder}`,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: '60px',
            zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent }} className="live-dot" />
              <span style={{ fontSize: '17px', fontWeight: '700', color: theme.textPrimary }}>
                {showFpHistory
                  ? `Family Planning History`
                  : 'Family Planning Dashboard'}
              </span>
              {showFpHistory && (
                <span style={{ fontSize: '12px', background: theme.tableHeader, color: theme.textMuted, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.cardBorder}`, fontWeight: '600' }}>
                  {filterCount} of {fpHistory.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <LiveClock theme={theme} />
              <button
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
                  fontWeight: '500',
                }}
              >
                <span style={{ fontSize: '14px', display: 'inline-block', animation: isRefreshing ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {!showFpHistory ? (
              <>
                {/* Stats */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <StatCard label="Waiting (FP Triage)" value={waitingCount} sub="Clients pending method" color={theme.accent} icon="🩺" theme={theme} />
                  <StatCard label="Recent Clients" value={clientStatuses.length} sub="Today's FP visits" color={theme.info} icon="📋" theme={theme} />
                  <StatCard label="Action Required" value={giveCount} sub="Need medication dispensed" color={theme.danger} icon="⚠" theme={theme} />
                  <StatCard label="Completed" value={doneCount} sub="Fully processed today" color={theme.warning} icon="✓" theme={theme} />
                </div>

                {errorMessage && (
                  <div style={{ background: theme.dangerLight, border: `1px solid ${theme.danger}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: theme.danger }}>
                    ⚠ {errorMessage}
                  </div>
                )}

                {/* Two columns */}
                <div className="columns-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', flex: 1 }}>

                  {/* FP Waiting */}
                  <div style={panel}>
                    <div style={panelHeader}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.accent }} />
                        FP Clients from Triage
                      </div>
                      <span style={{ fontSize: '11.5px', color: theme.textMuted, background: theme.cardBg, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>
                        {waitingCount} waiting
                      </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', maxHeight: '520px' }}>
                      {fpPatients.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: theme.textMuted, gap: '10px' }}>
                          <div style={{ fontSize: '36px', opacity: 0.3 }}>🩺</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>No patients in the queue</div>
                        </div>
                      ) : fpPatients.map(p => (
                        <div key={p?.fp_id || Math.random()} className="patient-card" style={{
                          background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
                          borderRadius: '10px', padding: '14px', marginBottom: '10px',
                          transition: 'all 0.2s ease',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: theme.textPrimary, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p?.first_name || '—'} {p?.last_name || ''}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {p?.age && <span style={{ fontSize: '12px', color: theme.textMuted }}>👤 {p.age} yrs</span>}
                                {p?.sex && <span style={{ fontSize: '12px', color: theme.textMuted }}>⚧ {p.sex}</span>}
                                {p?.phone_number && <span style={{ fontSize: '12px', color: theme.textMuted }}>📞 {p.phone_number}</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedPatient(p)}
                              style={{
                                padding: '6px 14px', borderRadius: '20px',
                                border: `1px solid ${theme.accent}`, background: 'transparent',
                                color: theme.accent, fontSize: '12px', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; }}
                            >
                              Select Method
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Clients */}
                  <div style={panel}>
                    <div style={panelHeader}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.info }} />
                        Recent FP Clients
                      </div>
                      <span style={{ fontSize: '11.5px', color: theme.textMuted, background: theme.cardBg, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>
                        {clientStatuses.length} total
                      </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', maxHeight: '520px' }}>
                      {clientStatuses.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: theme.textMuted, gap: '10px' }}>
                          <div style={{ fontSize: '36px', opacity: 0.3 }}>📋</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>No recent clients</div>
                        </div>
                      ) : clientStatuses.map(c => (
                        <div key={c?.contact_id || Math.random()} style={{
                          background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
                          borderRadius: '10px', padding: '14px', marginBottom: '10px',
                          transition: 'all 0.15s ease',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: theme.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c?.first_name || '—'} {c?.last_name || ''}
                            </div>
                            {c?.method && (
                              <span style={{ fontSize: '11px', fontWeight: '600', background: theme.infoLight, color: theme.info, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${theme.info}44`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {c.method}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                            {c?.age && <span style={{ fontSize: '12px', color: theme.textMuted }}>👤 {c.age} yrs</span>}
                            {c?.sex && <span style={{ fontSize: '12px', color: theme.textMuted }}>⚧ {c.sex}</span>}
                          </div>
                          {c?.status?.includes('Give') ? (
                            <span
                              onClick={() => handleOpenModal(c)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '11px', fontWeight: '600', color: theme.danger,
                                background: theme.dangerLight, padding: '4px 10px', borderRadius: '12px',
                                border: `1px solid ${theme.danger}44`, cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = theme.danger + '22'}
                              onMouseLeave={e => e.currentTarget.style.background = theme.dangerLight}
                            >
                              ⚠ {c.status}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: theme.accent, background: theme.accentLight, padding: '4px 10px', borderRadius: '12px', border: `1px solid ${theme.accent}44` }}>
                              ✓ {c?.status || 'Complete'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ── FP History ─────────────────────────────────────────── */
              <div style={{ ...panel, flex: 1 }}>
                <div style={panelHeader}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.skyBlue }} />
                    Family Planning History
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {(startDate || endDate || selectedMethods.length > 0 || searchName) && (
                      <button onClick={clearFilters} style={{ background: 'transparent', border: `1px solid ${theme.danger}`, color: theme.danger, fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer' }}>
                        Clear filters
                      </button>
                    )}
                    <span style={{ fontSize: '11.5px', color: theme.textMuted, background: theme.cardBg, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>
                      {filterCount} of {fpHistory.length} records
                    </span>
                  </div>
                </div>

                {/* Active filter chips */}
                {(startDate || endDate || selectedMethods.length > 0 || searchName) && (
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: theme.tableHeader }}>
                    <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Active filters:</span>
                    {searchName && (
                      <span style={{ fontSize: '11px', background: theme.infoLight, color: theme.info, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.info}44` }}>
                        🔍 "{searchName}"
                      </span>
                    )}
                    {startDate && (
                      <span style={{ fontSize: '11px', background: theme.skyBlueLight, color: theme.skyBlue, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.skyBlue}44` }}>
                        From: {new Date(startDate + 'T00:00:00').toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {endDate && (
                      <span style={{ fontSize: '11px', background: theme.skyBlueLight, color: theme.skyBlue, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.skyBlue}44` }}>
                        To: {new Date(endDate + 'T00:00:00').toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {selectedMethods.map(m => (
                      <span key={m} style={{ fontSize: '11px', background: theme.accentLight, color: theme.accent, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.accent}44` }}>
                        💊 {m}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxHeight: 'calc(100vh - 260px)' }}>
                  {loadingHistory ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '14px', color: theme.textMuted }}>
                      <div className="spinner" style={{ width: '36px', height: '36px', border: `3px solid ${theme.tableBorder}`, borderTopColor: theme.accent, borderRadius: '50%' }} />
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>Loading history…</div>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: theme.textMuted, gap: '12px' }}>
                      <div style={{ fontSize: '52px', opacity: 0.25 }}>📜</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textSecondary }}>No records found</div>
                      <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.6' }}>
                        {fpHistory.length > 0 ? 'Try adjusting your filters.' : 'No FP history records available yet.'}
                      </div>
                      {(startDate || endDate || selectedMethods.length > 0 || searchName) && (
                        <button onClick={clearFilters} style={{ marginTop: '8px', background: theme.accent, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                      {filteredHistory.map((record, idx) => (
                        <HistoryCard key={record.id || idx} record={record} idx={idx} theme={theme} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Method Selection Modal ─────────────────────────────────────── */}
      {selectedPatient && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setSelectedPatient(null)}
        >
          <div
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 16px 48px rgba(0,0,0,0.14)', overflow: 'hidden', animation: 'cardEntrance 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', background: theme.tableHeader }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary }}>Select FP Method</div>
                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '3px' }}>
                  {selectedPatient?.first_name || ''} {selectedPatient?.last_name || ''}
                  {selectedPatient?.age ? ` · ${selectedPatient.age} yrs` : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, color: theme.textSecondary, width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
            <div style={{ padding: '16px 22px 22px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '10px' }}>Available Methods</div>
              {familyPlanningMethods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted }}>
                  <div style={{ fontSize: '32px', opacity: 0.3, marginBottom: '10px' }}>💊</div>
                  <div>No methods loaded</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {familyPlanningMethods.map((m, i) => (
                    <div
                      key={i}
                      className="method-row"
                      onClick={() => handleMethodSelect(m?.name)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', border: `1px solid ${theme.cardBorder}`, borderRadius: '10px',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary }}>{m?.name || 'Unknown'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: theme.accent }}>UGX {((m?.price) || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Give FP Modal ──────────────────────────────────────────────── */}
      {showModal && modalData && (
        <GiveFPmodal
          clientDetails={modalData}
          onClose={() => { setShowModal(false); setModalData(null); refreshAll(); }}
        />
      )}
    </>
  );
}

export default NurseDashboard;
