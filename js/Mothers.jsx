import React, { useState, useEffect, useCallback, useRef } from 'react';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import AntenatalPrompt from './AntenatalPrompt';
import LabourOutcomePrompt from './LabourOutcomePrompt';
import MotherPrompt from './MotherPrompt';
import Topbar from './Topbar';
import { useNavigate } from 'react-router-dom';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const colors = {
  blue: {
    sidebarBg: '#0a1e4a',
    sidebarBorder: '#1e3a8a',
    activeNavBg: 'transparent',
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
    activeNavBg: 'transparent',
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

    .nav-item {
      background: transparent !important;
    }
    .nav-item:hover {
      background: ${theme.navHoverBg} !important;
      color: ${theme.sidebarText} !important;
    }
    .nav-icon { color: ${theme.iconBright}; font-size: 17px; transition: transform 0.2s ease; }
    .nav-item:hover .nav-icon { transform: scale(1.15); color: ${theme.iconHover}; }

    .balance-card {
      transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    }
    .balance-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.35); }
    }
    .live-dot { animation: pulse 2s ease-in-out infinite; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner { animation: spin 0.9s linear infinite; }

    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .mother-card {
      animation: cardEntrance 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .fade-slide-in { animation: fadeSlideIn 0.25s ease both; }

    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: 1fr 1fr !important; }
      .mothers-grid { grid-template-columns: 1fr !important; }
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
      <div style={{ color: theme.textMuted, fontSize: '14px', fontWeight: '500' }}>Loading mothers data…</div>
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

// ─── BALANCE CARD ─────────────────────────────────────────────────────────────
const BalanceCard = ({ label, value, sub, color, icon, theme, isAlert = false }) => (
  <div className="balance-card" style={{
    background: isAlert ? theme.dangerLight : theme.cardBg,
    border: `1px solid ${isAlert ? theme.danger : theme.cardBorder}`,
    borderRadius: '14px',
    padding: '16px 20px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '48px', opacity: 0.08 }}>{icon}</div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '30px', fontWeight: '800', color: isAlert ? theme.danger : color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>{sub}</div>}
  </div>
);

// ─── MOTHER CARD ──────────────────────────────────────────────────────────────
const MotherCard = ({ mother, onAntenatalClick, onLabourOutcomeClick, theme, idx, isDueSoon }) => {
  const statusColors = {
    'Antenatal': { bg: theme.infoLight, color: theme.info },
    'Labour': { bg: theme.warningLight, color: theme.warning },
    'Postnatal': { bg: theme.accentLight, color: theme.accent },
  };
  const statusStyle = statusColors[mother.status] || { bg: theme.tableHeader, color: theme.textMuted };

  return (
    <div
      className="mother-card"
      style={{
        background: theme.cardBg,
        border: `1px solid ${isDueSoon ? theme.danger : theme.cardBorder}`,
        borderRadius: '16px',
        padding: '20px',
        animationDelay: `${Math.min(idx * 40, 400)}ms`,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
      }}
    >
      {isDueSoon && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '10px',
          background: theme.danger,
          color: '#fff',
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 10px',
          borderRadius: '20px',
          letterSpacing: '0.05em',
        }}>
          DUE SOON
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: theme.textPrimary,
            marginBottom: '4px',
            letterSpacing: '-0.2px',
          }}>
            {`${mother.first_name || ''} ${mother.last_name || ''}`.trim().toUpperCase() || 'Unknown Mother'}
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            {mother.age && (
              <span style={{ fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>👤</span> {mother.age} yrs
              </span>
            )}
            {mother.phone_number && (
              <span style={{ fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📞</span> {mother.phone_number}
              </span>
            )}
          </div>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          background: statusStyle.bg,
          color: statusStyle.color,
          padding: '4px 12px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
        }}>
          {mother.status || 'Unknown'}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        padding: '10px 0',
        borderTop: `1px solid ${theme.cardBorder}`,
        borderBottom: `1px solid ${theme.cardBorder}`,
      }}>
        {mother.EDD && (
          <div>
            <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>EDD</div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: theme.textPrimary }}>
              {new Date(mother.EDD).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}
        {mother.address && (
          <div>
            <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Address</div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: theme.textPrimary }}>{mother.address}</div>
          </div>
        )}
        {mother.maternity_id && (
          <div>
            <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Maternity ID</div>
            <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: theme.textSecondary }}>{mother.maternity_id}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <button
          onClick={() => onAntenatalClick(mother)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: `1px solid ${theme.info}44`,
            background: theme.infoLight,
            color: theme.info,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.info + '22'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.infoLight; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{ fontSize: '16px' }}>🍼</span>
          Antenatal Care
        </button>
        <button
          onClick={() => onLabourOutcomeClick(mother)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: `1px solid ${theme.accent}44`,
            background: theme.accentLight,
            color: theme.accent,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.accent + '22'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.accentLight; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{ fontSize: '16px' }}>🤰</span>
          Labour Outcomes
        </button>
      </div>
    </div>
  );
};

// ─── ADD MOTHER FORM (Full page) ──────────────────────────────────────────────
function AddMotherForm({ onSuccess, onCancel, clinicName, employeeName, token, theme }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    phone_number: '',
    address: '',
    EDD: '',
    gravida: '',
    para: '',
    medical_history: '',
    emergency_contact: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(urls.addMother, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token }),
      });
      if (!response.ok) throw new Error('Failed to add mother');
      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.message || 'Failed to add mother');
      }
    } catch (error) {
      console.error('Error adding mother:', error);
      alert('Error adding mother. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', background: theme.cardBg, borderRadius: '20px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary }}>Register New Mother</h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>✕</button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleChange} required style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="EDD" type="date" placeholder="Expected Delivery Date" value={formData.EDD} onChange={handleChange} required style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="gravida" placeholder="Gravida (number of pregnancies)" value={formData.gravida} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
          <input name="para" placeholder="Para (number of deliveries)" value={formData.para} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
        </div>
        <textarea name="medical_history" placeholder="Medical History" value={formData.medical_history} onChange={handleChange} rows="3" style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
        <input name="emergency_contact" placeholder="Emergency Contact" value={formData.emergency_contact} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.inputText }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: 'transparent', cursor: 'pointer', color: theme.textSecondary }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{ padding: '10px 24px', borderRadius: '8px', background: theme.accent, border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Registering...' : 'Register Mother'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function Mothers() {
  const [mothersData, setMothersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMother, setSelectedMother] = useState(null);
  const [openPrompt, setOpenPrompt] = useState(null); // 'antenatal', 'labourOutcome', or 'addMother'
  const [clinicName, setClinicName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [ownersContact, setOwnersContact] = useState('');
  const [town, setTown] = useState('');
  const [district, setDistrict] = useState('');
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const theme = colors[currentTheme];
  const isBlue = currentTheme === 'blue';

  const SIDEBAR_W = sidebarCollapsed ? 74 : 256;

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

  // Security & Theme
  useEffect(() => {
    if (!tokenFromUrl) { navigate('/login'); return; }
    (async () => {
      try {
        const res = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.message === 'Session valid') {
          setEmployeeName(data.employee_name || '');
          setClinicName(data.clinic || '');
          setOwnersContact(data.owners_contact || '');
          setTown(data.town || '');
          setDistrict(data.district || '');
          const tc = data.colour || '';
          setCurrentTheme(!tc || tc.toLowerCase() === 'white' || tc.toLowerCase() === 'null' ? 'white' : 'blue');
          saveSessionToken(data.clinic_session_token);
        } else if (data.error === 'Session expired') {
          navigate(`/dashboard?token=${data.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } catch { navigate('/login'); }
    })();
  }, [navigate, tokenFromUrl]);

  // Fetch Mothers
  const fetchMothers = useCallback(async () => {
    if (!tokenFromUrl) return;
    setLoading(true);
    try {
      const response = await fetch(urls.fetchMothers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl }),
      });
      if (!response.ok) throw new Error('Failed to fetch mothers data');
      const data = await response.json();
      setMothersData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching mothers data:', error);
      addNotification('Failed to load mothers data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tokenFromUrl, addNotification]);

  useEffect(() => {
    fetchMothers();
  }, [fetchMothers]);

  // Calculate mothers delivering within 30 days from EDD
  const getDueSoonMothers = useCallback(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return mothersData.filter(mother => {
      if (!mother.EDD || mother.status !== 'Antenatal') return false;
      const eddDate = new Date(mother.EDD);
      return eddDate >= today && eddDate <= thirtyDaysFromNow;
    });
  }, [mothersData]);

  const dueSoonCount = getDueSoonMothers().length;

  // Filtered Mothers
  const filteredMothers = mothersData.filter(mother => {
    const fullName = `${mother.first_name || ''} ${mother.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      (mother.phone_number || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || mother.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const antenatalCount = mothersData.filter(m => m.status === 'Antenatal').length;
  const labourCount = mothersData.filter(m => m.status === 'Labour').length;
  const postnatalCount = mothersData.filter(m => m.status === 'Postnatal').length;

  // Handlers
  const handleAntenatalClick = (mother) => {
    setSelectedMother(mother);
    setOpenPrompt('antenatal');
  };

  const handleLabourOutcomeClick = (mother) => {
    setSelectedMother(mother);
    setOpenPrompt('labourOutcome');
  };

  const handleAddMotherClick = () => {
    setSelectedMother(null);
    setShowAddForm(true);
    setOpenPrompt(null);
  };

  const handleClosePrompt = () => {
    setSelectedMother(null);
    setOpenPrompt(null);
    setShowAddForm(false);
    fetchMothers();
  };

  const handleAddMotherSuccess = () => {
    addNotification('Mother registered successfully!', 'success');
    handleClosePrompt();
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchMothers();
    setIsRefreshing(false);
    addNotification('Mothers data refreshed', 'success');
  };

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    setShowAddForm(false);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', action: () => { setShowAddForm(false); navigate(`/nurse-dashboard/?token=${tokenFromUrl}`); } },
    { id: 'maternity', icon: '🤱', label: 'Maternity', action: () => { setShowAddForm(false); navigate(`/maternity-dashboard/?token=${tokenFromUrl}`); } },
    { id: 'files', icon: '📂', label: 'Patient Files', action: () => { setShowAddForm(false); navigate(`/patientfiles2/?token=${tokenFromUrl}`); } },
    { id: 'addMother', icon: '➕', label: 'Add New Mother', action: handleAddMotherClick },
  ];

  const filterItems = [
    { id: 'all', label: 'All Mothers', icon: '👩', count: mothersData.length },
    { id: 'Antenatal', label: 'Antenatal', icon: '🍼', count: antenatalCount },
    { id: 'Labour', label: 'In Labour', icon: '🤰', count: labourCount },
    { id: 'Postnatal', label: 'Postnatal', icon: '👶', count: postnatalCount },
  ];

  if (loading && mothersData.length === 0) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>
          <aside style={{ width: `${SIDEBAR_W}px`, background: theme.sidebarBg, position: 'fixed', inset: '0 auto 0 0' }} />
          <main style={{ marginLeft: `${SIDEBAR_W}px`, flex: 1 }}>
            <Topbar token={tokenFromUrl} themeColor={currentTheme} />
            <div style={{ padding: '28px' }}><LoadingSpinner theme={theme} /></div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles theme={theme} />

      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1100, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', width: '100%' }}>
        {notifications.map(n => (
          <Notification key={n.id} message={n.message} type={n.type} onDismiss={() => removeNotification(n.id)} theme={theme} />
        ))}
      </div>

      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>

        {/* SIDEBAR */}
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
          paddingTop: '60px',
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
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' }}>ClinicPro</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '10.5px', whiteSpace: 'nowrap' }}>Mothers Registry</div>
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
              <div style={{ fontSize: '10px', color: theme.sidebarTextMuted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Midwife</div>
            </div>
          )}

          {/* Navigation Items */}
          <nav style={{ flex: '0 0 auto', padding: sidebarCollapsed ? '8px 0' : '6px 8px', overflowX: 'hidden' }}>
            {!sidebarCollapsed && (
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: '0 6px', marginBottom: '6px', marginTop: '8px' }}>MENU</div>
            )}
            {navItems.map(item => (
              <button
                key={item.id}
                className="nav-item"
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
                  fontWeight: '500',
                  color: theme.inactiveNavText,
                  transition: 'all 0.15s ease',
                  border: 'none',
                  width: '100%',
                  textAlign: sidebarCollapsed ? 'center' : 'left',
                  marginBottom: '2px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  background: 'transparent',
                }}
              >
                <span className="nav-icon" style={{ width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {sidebarCollapsed && hoveredNavItem === item.id && (
                  <div style={{
                    position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                    marginLeft: '10px', padding: '7px 12px',
                    background: theme.tooltipBg, color: theme.tooltipText,
                    fontSize: '12px', fontWeight: '500', borderRadius: '6px',
                    whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}>
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Filter Section */}
          <div style={{
            padding: sidebarCollapsed ? '8px 0' : '12px 10px',
            borderTop: `1px solid ${theme.sidebarBorder}`,
            borderBottom: `1px solid ${theme.sidebarBorder}`,
            marginTop: '8px',
            background: isBlue ? 'rgba(0,0,0,0.15)' : 'transparent',
          }}>
            {!sidebarCollapsed && (
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: '0 6px', marginBottom: '10px' }}>FILTER BY STATUS</div>
            )}
            {filterItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleStatusFilterClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                  gap: sidebarCollapsed ? 0 : '10px',
                  padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: statusFilter === item.id ? '600' : '500',
                  color: statusFilter === item.id ? (isBlue ? '#fff' : theme.accent) : theme.inactiveNavText,
                  transition: 'all 0.15s ease',
                  border: 'none',
                  width: '100%',
                  background: statusFilter === item.id ? (isBlue ? theme.activeNavBg : theme.navHoverBg) : 'transparent',
                  marginBottom: '4px',
                  position: 'relative',
                }}
              >
                {!sidebarCollapsed ? (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span style={{ fontSize: '11px', background: isBlue ? 'rgba(255,255,255,0.2)' : theme.tableHeader, padding: '2px 6px', borderRadius: '12px' }}>{item.count}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                )}
              </button>
            ))}
          </div>

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
            marginTop: 'auto',
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

        {/* MAIN CONTENT */}
        <main style={{
          flex: 1,
          marginLeft: `${SIDEBAR_W}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
          paddingTop: '60px',
        }}>
          <Topbar token={tokenFromUrl} themeColor={currentTheme} />

          {showAddForm ? (
            <div style={{ flex: 1, padding: '32px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <AddMotherForm
                onSuccess={handleAddMotherSuccess}
                onCancel={handleClosePrompt}
                clinicName={clinicName}
                employeeName={employeeName}
                token={tokenFromUrl}
                theme={theme}
              />
            </div>
          ) : (
            <>
              {/* Header Bar */}
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
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent }} className="live-dot" />
                  <span style={{ fontSize: '17px', fontWeight: '700', color: theme.textPrimary }}>
                    Mothers Registry
                  </span>
                  <span style={{ fontSize: '12px', background: theme.tableHeader, color: theme.textMuted, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${theme.cardBorder}`, fontWeight: '600' }}>
                    {filteredMothers.length} of {mothersData.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <LiveClock theme={theme} />
                  <button
                    onClick={refreshData}
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

              <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Balance Row */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <BalanceCard label="Total Mothers" value={mothersData.length} sub="Registered in system" color={theme.info} icon="👩" theme={theme} />
                  <BalanceCard label="Antenatal" value={antenatalCount} sub="Under ANC care" color={theme.skyBlue} icon="🍼" theme={theme} />
                  <BalanceCard label="Labour" value={labourCount} sub="Currently in labour" color={theme.warning} icon="🤰" theme={theme} />
                  <BalanceCard label="Postnatal" value={postnatalCount} sub="Post-delivery care" color={theme.accent} icon="👶" theme={theme} />
                </div>

                {/* Due Soon Alert Card */}
                {dueSoonCount > 0 && (
                  <div style={{
                    background: theme.dangerLight,
                    border: `1px solid ${theme.danger}`,
                    borderRadius: '12px',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>⚠️</span>
                      <div>
                        <div style={{ fontWeight: '700', color: theme.danger, fontSize: '14px' }}>Upcoming Deliveries</div>
                        <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                          {dueSoonCount} mother{dueSoonCount !== 1 ? 's' : ''} expected to deliver within the next 30 days.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setStatusFilter('Antenatal')}
                      style={{
                        background: theme.danger,
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      View All
                    </button>
                  </div>
                )}

                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '14px' }}>🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.cardBorder}`,
                        background: theme.inputBg,
                        color: theme.inputText,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.cardBorder}`,
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: theme.textMuted,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Mothers Grid */}
                {filteredMothers.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 24px',
                    color: theme.textMuted,
                    gap: '12px',
                    background: theme.cardBg,
                    borderRadius: '16px',
                    border: `1px solid ${theme.cardBorder}`,
                  }}>
                    <div style={{ fontSize: '52px', opacity: 0.25 }}>👩</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textSecondary }}>No mothers found</div>
                    <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.6' }}>
                      {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Click "Add New Mother" to register a mother.'}
                    </div>
                  </div>
                ) : (
                  <div className="mothers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
                    {filteredMothers.map((mother, idx) => {
                      const isDueSoon = mother.status === 'Antenatal' && mother.EDD && (() => {
                        const today = new Date();
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(today.getDate() + 30);
                        const eddDate = new Date(mother.EDD);
                        return eddDate >= today && eddDate <= thirtyDaysFromNow;
                      })();
                      return (
                        <MotherCard
                          key={mother.maternity_id || idx}
                          mother={mother}
                          onAntenatalClick={handleAntenatalClick}
                          onLabourOutcomeClick={handleLabourOutcomeClick}
                          theme={theme}
                          idx={idx}
                          isDueSoon={isDueSoon}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals with all clinic info passed */}
      {openPrompt === 'antenatal' && selectedMother && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleClosePrompt}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              width: '95vw',
              maxWidth: '1400px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <AntenatalPrompt
              {...selectedMother}
              clinicName={clinicName}
              employeeName={employeeName}
              tokenFromUrl={tokenFromUrl}
              onClose={handleClosePrompt}
              ownersContact={ownersContact}
              town={town}
              district={district}
            />
          </div>
        </div>
      )}

      {openPrompt === 'labourOutcome' && selectedMother && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleClosePrompt}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: theme.cardBg,
              borderRadius: '16px',
              width: '90%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <LabourOutcomePrompt
              {...selectedMother}
              clinicName={clinicName}
              employeeName={employeeName}
              tokenFromUrl={tokenFromUrl}
              onClose={handleClosePrompt}
              ownersContact={ownersContact}
              town={town}
              district={district}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Mothers;