import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Store.css';
import { API_URL, urls } from './config.dev';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import { faObjectGroup } from '@fortawesome/free-solid-svg-icons';
import { 
  faPlus, 
  faCheck, 
  faStore, 
  faTimes, 
  faFileInvoice, 
  faArrowRight, 
  faBoxes, 
  faHistory, 
  faWarehouse,
  faChartLine,
  faExclamationTriangle,
  faMoneyBillWave,
  faClock,
  faChevronLeft,
  faChevronRight,
  faTachometerAlt,
  faShoppingCart,
  faArrowLeft,
  faSearch,
  faCalendarAlt,
  faFilter,
  faEye,
  faEyeSlash,
  faFolderOpen,
  faLayerGroup,
  faRedo,
  faTrophy,
  faCalendarDay,
  faBarcode,
  faList,
  faTable,
  faExchangeAlt,
  faSave,
  faTrashAlt,
  faInfoCircle,
  faBars,
  faHome,
  faTruck,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  blue: {
    sidebarBg: '#0a1e4a',
    sidebarBorder: '#1e3a8a',
    activeNavBg: '#2563eb',
    activeNavText: '#ffffff',
    inactiveNavText: '#e0e7ff',
    navHoverBg: '#1e3a8a',
    sectionHeaderText: '#94a3b8',
    mainBg: '#f0f4ff',
    cardBg: '#ffffff',
    cardBorder: '#d4e0ff',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    accentDark: '#14532d',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#e0edff',
    skyBlue: '#38bdf8',
    skyBlueLight: '#e0f2fe',
    textPrimary: '#0a1e4a',
    textSecondary: '#1e3a8a',
    textMuted: '#4b5563',
    tableHeader: '#e8f0fe',
    tableBorder: '#cbd5e1',
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
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
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBg: '#ffffff',
    headerBg: '#ffffff',
    tableRowHover: '#f8fafc',
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
    accentDark: '#14532d',
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
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBg: '#ffffff',
    headerBg: '#ffffff',
    tableRowHover: '#f8fafc',
  }
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const getStyles = (theme) => ({
  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    marginBottom: '20px',
  },
  tableWrapper: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  th: {
    padding: '10px 12px',
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
    padding: '10px 12px',
    fontSize: '12.5px',
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
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
      background: c.bg, color: c.text,
    };
  },
  sidebarButton: (isActive = false, collapsed = false) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '12px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    padding: collapsed ? '12px 0' : '12px 16px',
    borderRadius: '10px',
    background: isActive ? theme.activeNavBg : 'transparent',
    color: isActive ? theme.activeNavText : theme.inactiveNavText,
    border: 'none',
    width: '100%',
    textAlign: collapsed ? 'center' : 'left',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '4px',
    position: 'relative',
  }),
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`,
    fontSize: '12px',
    color: theme.textPrimary,
    background: theme.cardBg,
    width: '100%',
    outline: 'none',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`,
    fontSize: '12.5px',
    color: theme.textPrimary,
    background: theme.cardBg,
    width: '100%',
    outline: 'none',
    transition: 'border 0.15s ease',
  },
  filterSection: {
    background: theme.filterSection,
    borderRadius: '12px',
    padding: '16px 12px',
    margin: '0 12px 16px',
    border: `1px solid ${theme.sidebarBorder}`,
  },
  actionButton: {
    padding: '10px 20px',
    background: theme.accent,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  secondaryButton: {
    padding: '10px 20px',
    background: theme.tableHeader,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textSecondary,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
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
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  transferGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
    '@media (minWidth: 1024px)': {
      gridTemplateColumns: '2fr 1fr',
    }
  }
});

// ─── MOBILE HOOK ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ─── MOBILE COMPONENTS ──────────────────────────────────────────────────────

function MobileHeader({ activeSection, employeeName, stockWorth, formatCurrency, onMenuOpen, currentTheme }) {
  const sectionMeta = {
    stock: { icon: faBoxes, label: 'Stock', color: '#6366f1' },
    insert: { icon: faPlus, label: 'Insert Stock', color: '#10b981' },
    transfer: { icon: faExchangeAlt, label: 'Transfer', color: '#f59e0b' },
    invoices: { icon: faFileInvoice, label: 'Invoices', color: '#ef4444' },
    summary: { icon: faChartLine, label: 'Summary', color: '#22d3ee' },
  };
  const meta = sectionMeta[activeSection] || sectionMeta.stock;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: currentTheme === 'blue' ? '#0a1e4a' : '#ffffff',
      padding: '0 16px',
      height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderBottom: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuOpen}
          style={{
            background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
            border: 'none', borderRadius: '10px',
            width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: currentTheme === 'blue' ? '#fff' : '#0f172a', cursor: 'pointer', fontSize: '16px',
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, fontSize: '15px' }} />
          </div>
          <span style={{ color: currentTheme === 'blue' ? '#fff' : '#0f172a', fontWeight: '700', fontSize: '16px' }}>{meta.label}</span>
        </div>
      </div>
      {stockWorth !== null && (
        <div style={{
          background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
          borderRadius: '10px', padding: '6px 12px',
          textAlign: 'right',
        }}>
          <div style={{ color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', fontSize: '9px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Stock</div>
          <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>{formatCurrency(stockWorth)}</div>
        </div>
      )}
    </div>
  );
}

function MobileDrawer({ open, onClose, activeSection, onSectionChange, currentTheme }) {
  const navItems = [
    { id: 'stock', icon: faBoxes, label: 'Stock Inventory', color: '#6366f1' },
    { id: 'insert', icon: faPlus, label: 'Insert New Stock', color: '#10b981' },
    { id: 'transfer', icon: faExchangeAlt, label: 'Transfer to Shelves', color: '#f59e0b' },
    { id: 'invoices', icon: faFileInvoice, label: 'Invoice History', color: '#ef4444' },
    { id: 'summary', icon: faChartLine, label: 'Invoice Summary', color: '#22d3ee' },
  ];

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', zIndex: 400,
        background: currentTheme === 'blue' ? '#0a1e4a' : '#ffffff',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: currentTheme === 'blue' ? '#fff' : '#0f172a', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>StoreManager</div>
            <div style={{ color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', fontSize: '11px', marginTop: '2px' }}>Inventory System</div>
          </div>
          <button onClick={onClose} style={{
            background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
            border: 'none', borderRadius: '8px',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: currentTheme === 'blue' ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '14px',
          }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onSectionChange(item.id); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                width: '100%', padding: '13px 14px', marginBottom: '4px',
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: activeSection === item.id ? (currentTheme === 'blue' ? '#2563eb' : '#f1f5f9') : 'transparent',
                borderLeft: activeSection === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: item.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={item.icon} style={{ color: item.color, fontSize: '15px' }} />
              </div>
              <span style={{
                color: activeSection === item.id ? (currentTheme === 'blue' ? '#fff' : '#0f172a') : (currentTheme === 'blue' ? '#e0e7ff' : '#475569'),
                fontWeight: activeSection === item.id ? '700' : '500',
                fontSize: '14px',
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}` }}>
          <div style={{ color: currentTheme === 'blue' ? '#64748b' : '#94a3b8', fontSize: '10px', textAlign: 'center' }}>
            DeepMind E-Systems · +256786747733
          </div>
        </div>
      </div>
    </>
  );
}

function MobileStockCard({ item, styles, useBatchNumbers, useExpiryDate, formatCurrency, formatExpiryDate, isExpired, daysUntilExpiry, currentTheme }) {
  const [expanded, setExpanded] = useState(false);
  const expDays = useExpiryDate ? daysUntilExpiry(item.expiry_date) : null;
  const expired = useExpiryDate ? isExpired(item.expiry_date) : false;

  return (
    <div style={{
      background: expired ? '#fef2f2' : (currentTheme === 'blue' ? '#ffffff' : '#ffffff'),
      border: `1px solid ${expired ? '#fca5a5' : (currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0')}`,
      borderRadius: '14px',
      marginBottom: '10px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: item.Quantity < 10 ? '#fef2f2' : '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FontAwesomeIcon icon={faBoxes} style={{ color: item.Quantity < 10 ? '#ef4444' : '#2563eb', fontSize: '16px' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.Drug}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
              {item.Packaging}
            </span>
            {useExpiryDate && expired && (
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '20px' }}>EXPIRED</span>
            )}
            {useExpiryDate && !expired && expDays !== null && expDays <= 30 && (
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '20px' }}>{expDays}d left</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: '800', fontSize: '20px', color: item.Quantity < 10 ? '#ef4444' : '#16a34a' }}>{item.Quantity}</div>
          <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>in stock</div>
        </div>
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} style={{ color: currentTheme === 'blue' ? '#4b5563' : '#64748b', fontSize: '12px', flexShrink: 0 }} />
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div style={{ background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', marginBottom: '3px' }}>COST PRICE</div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>{formatCurrency(item.Cost_Price)}</div>
            </div>
            <div style={{ background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', marginBottom: '3px' }}>SELLING PRICE</div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#16a34a' }}>{formatCurrency(item.Selling_Price)}</div>
            </div>
            {useBatchNumbers && (
              <div style={{ background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', marginBottom: '3px' }}>BATCH</div>
                <div style={{ fontWeight: '600', fontSize: '12px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>{item.batch_number && item.batch_number !== 'null' ? item.batch_number : '—'}</div>
              </div>
            )}
            {useExpiryDate && (
              <div style={{ background: expired ? '#fef2f2' : expDays !== null && expDays <= 30 ? '#fef3c7' : (currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9'), borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', marginBottom: '3px' }}>EXPIRY</div>
                <div style={{ fontWeight: '600', fontSize: '12px', color: expired ? '#dc2626' : expDays !== null && expDays <= 30 ? '#d97706' : (currentTheme === 'blue' ? '#0a1e4a' : '#0f172a') }}>
                  {formatExpiryDate(item.expiry_date)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTransferCard({ drug, isSelected, movedDrugs, onToggle, onQtyChange, onPriceChange, useBatchNumbers, useExpiryDate, formatCurrency, formatExpiryDate, isExpired, daysUntilExpiry, getDrugKey, currentTheme }) {
  const drugKey = getDrugKey(drug);
  const expired = isExpired(drug.expiry_date);
  const expDays = daysUntilExpiry(drug.expiry_date);

  return (
    <div style={{
      background: expired ? '#fef2f2' : isSelected ? '#f0fdf4' : (currentTheme === 'blue' ? '#ffffff' : '#ffffff'),
      border: `2px solid ${expired ? '#fca5a5' : isSelected ? '#16a34a' : (currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0')}`,
      borderRadius: '14px',
      marginBottom: '10px',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? '0 2px 12px rgba(22,163,74,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div
        onClick={() => !expired && onToggle(drug)}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: expired ? 'not-allowed' : 'pointer' }}
      >
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px',
          border: `2px solid ${expired ? '#fca5a5' : isSelected ? '#16a34a' : (currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0')}`,
          background: isSelected ? '#16a34a' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isSelected && <FontAwesomeIcon icon={faCheck} style={{ color: '#fff', fontSize: '11px' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drug.Drug}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>{drug.Packaging}</span>
            {useBatchNumbers && drug.batch_number && drug.batch_number !== 'null' && (
              <span style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>#{drug.batch_number}</span>
            )}
            {useExpiryDate && expired && <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '20px' }}>EXPIRED</span>}
            {useExpiryDate && !expired && expDays !== null && expDays <= 30 && (
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '20px' }}>{expDays}d left</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: drug.Quantity < 10 ? '#ef4444' : '#16a34a' }}>{drug.Quantity}</div>
          <div style={{ fontSize: '10px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>avail</div>
        </div>
      </div>
      {isSelected && !expired && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`, background: 'rgba(22,163,74,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px' }}>QTY TO TRANSFER</label>
              <input
                type="number" min="1" max={drug.Quantity}
                value={movedDrugs[drugKey]?.quantity || ''}
                onChange={(e) => { e.stopPropagation(); onQtyChange(drug, e); }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter qty"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #16a34a', fontSize: '14px', fontWeight: '600',
                  outline: 'none', background: '#fff', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px' }}>SELLING PRICE</label>
              <input
                type="number" min="0" step="0.01"
                value={movedDrugs[drugKey]?.sellingPrice !== undefined ? movedDrugs[drugKey].sellingPrice : drug.Selling_Price}
                onChange={(e) => { e.stopPropagation(); onPriceChange(drug, e); }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1.5px solid #16a34a', fontSize: '14px', fontWeight: '600',
                  outline: 'none', background: '#fff', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileInsertForm({ newDrugs, supplier, suppliers, originalDrugs, useBatchNumbers, useExpiryDate, insertingDrugs, styles, onDrugChange, addNewRow, removeRow, setSupplier, handleInsertDrugs, setNewDrugs, currentTheme }) {
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supplier *</label>
        <input
          type="text" value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Type or select supplier"
          list="suppliersList-mobile"
          style={{ ...styles.input, fontSize: '15px', padding: '12px 14px', borderRadius: '10px' }}
        />
        <datalist id="suppliersList-mobile">
          {suppliers.map((s, i) => <option key={i} value={s} />)}
        </datalist>
        {suppliers.length > 0 && (
          <select onChange={(e) => { if (e.target.value) setSupplier(e.target.value); }} style={{ ...styles.select, marginTop: '8px', fontSize: '14px', padding: '11px 14px', borderRadius: '10px' }}>
            <option value="">Quick select supplier...</option>
            {suppliers.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {newDrugs.map((drug, index) => (
        <div key={index} style={{
          background: currentTheme === 'blue' ? '#ffffff' : '#ffffff', border: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`,
          borderRadius: '14px', padding: '16px', marginBottom: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569' }}>Item {index + 1}</span>
            {newDrugs.length > 1 && (
              <button onClick={() => removeRow(index)} style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
                padding: '5px 10px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: '600',
              }}>Remove</button>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Item Name *</label>
            <input
              type="text" value={drug.drug}
              onChange={(e) => onDrugChange(index, 'drug', e.target.value)}
              list={`originalDrugsList-mobile-${index}`}
              placeholder="Type item name..."
              autoComplete="off"
              style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }}
            />
            <datalist id={`originalDrugsList-mobile-${index}`}>
              {originalDrugs.map((d, idx) => <option key={idx} value={`${d.drug_name} - ${d.packaging}`} />)}
            </datalist>
          </div>
          {drug.packaging && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Packaging</label>
              <div style={{ padding: '10px 14px', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderRadius: '10px', fontSize: '14px', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569', fontWeight: '500' }}>{drug.packaging}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Quantity *</label>
              <input type="number" value={drug.quantity} onChange={(e) => onDrugChange(index, 'quantity', e.target.value)} placeholder="0" style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Cost Price *</label>
              <input type="number" value={drug.costPrice} onChange={(e) => onDrugChange(index, 'costPrice', e.target.value)} placeholder="0.00" style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Selling Price *</label>
              <input type="number" value={drug.sellingPrice} onChange={(e) => onDrugChange(index, 'sellingPrice', e.target.value)} placeholder="0.00" style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }} />
            </div>
          </div>
          {useBatchNumbers && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Batch Number</label>
              <input type="text" value={drug.batch_number || ''} onChange={(e) => onDrugChange(index, 'batch_number', e.target.value)} placeholder="e.g. BN-2024-001" style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }} />
            </div>
          )}
          {useExpiryDate && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Expiry Date</label>
              <input type="date" value={drug.expiry_date || ''} onChange={(e) => onDrugChange(index, 'expiry_date', e.target.value)} style={{ ...styles.input, fontSize: '15px', padding: '11px 14px', borderRadius: '10px' }} />
            </div>
          )}
        </div>
      ))}
      <button onClick={addNewRow} style={{
        width: '100%', padding: '13px', borderRadius: '12px', border: `2px dashed ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`,
        background: 'transparent', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569', fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <FontAwesomeIcon icon={faPlus} />
        Add Another Item
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={() => { setNewDrugs([{ drug_id: '', drug: '', quantity: '', packaging: '', costPrice: '', sellingPrice: '', sellingPrice2: '', batch_number: '', expiry_date: '' }]); setSupplier(''); }}
          style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`, background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
        >
          Clear
        </button>
        <button
          onClick={handleInsertDrugs}
          disabled={insertingDrugs || !supplier}
          style={{
            padding: '14px', borderRadius: '12px', border: 'none',
            background: insertingDrugs || !supplier ? '#9ca3af' : 'linear-gradient(135deg, #059669, #16a34a)',
            color: '#fff', fontSize: '14px', fontWeight: '700', cursor: insertingDrugs || !supplier ? 'not-allowed' : 'pointer',
            boxShadow: insertingDrugs || !supplier ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
          }}
        >
          {insertingDrugs ? 'Saving...' : 'Insert Items'}
        </button>
      </div>
    </div>
  );
}

function MobileInvoiceView({ groupedInvoices, loadingInvoices, styles, useBatchNumbers, useExpiryDate, formatCurrency, formatExpiryDate, isExpired, daysUntilExpiry, currentTheme }) {
  const [expandedGroup, setExpandedGroup] = useState(null);

  if (loadingInvoices) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontWeight: '600' }}>Loading invoices...</div>
      </div>
    );
  }

  if (groupedInvoices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No invoices found</div>
        <div style={{ fontSize: '13px' }}>No invoice history available</div>
      </div>
    );
  }

  return (
    <div>
      {groupedInvoices.map((group, groupIndex) => (
        <div key={groupIndex} style={{
          background: currentTheme === 'blue' ? '#ffffff' : '#ffffff', border: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`,
          borderRadius: '14px', marginBottom: '12px', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div onClick={() => setExpandedGroup(expandedGroup === groupIndex ? null : groupIndex)}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FontAwesomeIcon icon={faFileInvoice} style={{ color: '#2563eb', fontSize: '18px' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a', marginBottom: '3px' }}>
                {new Date(group.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '12px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.supplier} · {group.items.length} item{group.items.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#16a34a' }}>{formatCurrency(group.total)}</div>
              <FontAwesomeIcon icon={expandedGroup === groupIndex ? faChevronUp : faChevronDown} style={{ color: currentTheme === 'blue' ? '#4b5563' : '#64748b', fontSize: '11px', marginTop: '3px' }} />
            </div>
          </div>
          {expandedGroup === groupIndex && (
            <div style={{ borderTop: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` }}>
              {group.items.map((invoice, itemIndex) => (
                <div key={itemIndex} style={{
                  padding: '12px 16px', borderBottom: itemIndex < group.items.length - 1 ? `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` : 'none',
                  background: itemIndex % 2 === 0 ? 'transparent' : (currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9') + '50',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a', flex: 1 }}>{invoice.drug}</div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#16a34a', flexShrink: 0, marginLeft: '8px' }}>{formatCurrency(invoice.total_cost)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
                    <span>Qty: <strong style={{ color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>{invoice.quantity}</strong></span>
                    <span>Pack: {invoice.packaging}</span>
                    {useBatchNumbers && invoice.batch_number && <span>Batch: {invoice.batch_number}</span>}
                    {useExpiryDate && invoice.expiry_date && <span>Exp: {formatExpiryDate(invoice.expiry_date)}</span>}
                    {invoice.employee_name && <span>By: {invoice.employee_name}</span>}
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px 16px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: currentTheme === 'blue' ? '#1e3a8a' : '#475569' }}>Group Total</span>
                <span style={{ fontWeight: '800', fontSize: '15px', color: '#16a34a' }}>{formatCurrency(group.total)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MobileSummaryView({ invoiceSummary, supplierAnalysis, loadingSummary, formatCurrency, getRankBadge, currentTheme }) {
  if (loadingSummary) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
        <div style={{ fontWeight: '600' }}>Loading summary...</div>
      </div>
    );
  }

  const rankColors = ['#fbbf24', '#94a3b8', '#b45309'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '14px', padding: '18px',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total Value</div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>{formatCurrency(invoiceSummary.totalInvoices)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '14px', padding: '18px',
          boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Invoices</div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>{invoiceSummary.totalInvoicesCount}</div>
        </div>
      </div>

      {invoiceSummary.monthlySummary.length > 0 && (
        <div style={{ background: currentTheme === 'blue' ? '#ffffff' : '#ffffff', border: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`, borderRadius: '14px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderBottom: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>Monthly Summary</span>
          </div>
          {invoiceSummary.monthlySummary.map((month, index) => (
            <div key={index} style={{
              padding: '13px 16px', borderBottom: index < invoiceSummary.monthlySummary.length - 1 ? `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>{month.monthName} {month.year}</div>
                <div style={{ fontSize: '11px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>{month.count} invoice{month.count !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#2563eb' }}>{formatCurrency(month.total)}</div>
            </div>
          ))}
        </div>
      )}

      {supplierAnalysis.length > 0 && (
        <div style={{ background: currentTheme === 'blue' ? '#ffffff' : '#ffffff', border: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderBottom: `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a' }}>Supplier Rankings</span>
          </div>
          {supplierAnalysis.map((supplier, index) => {
            const maxVal = supplierAnalysis[0].totalValue;
            const pct = (supplier.totalValue / maxVal) * 100;
            return (
              <div key={index} style={{
                padding: '14px 16px',
                borderBottom: index < supplierAnalysis.length - 1 ? `1px solid ${currentTheme === 'blue' ? '#d4e0ff' : '#e2e8f0'}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {index < 3 ? (
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: rankColors[index] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesomeIcon icon={faTrophy} style={{ color: rankColors[index], fontSize: '12px' }} />
                    </div>
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
                      {index + 1}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: currentTheme === 'blue' ? '#0a1e4a' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplier.supplier}</div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#16a34a', flexShrink: 0 }}>{formatCurrency(supplier.totalValue)}</div>
                </div>
                <div style={{ height: '4px', background: currentTheme === 'blue' ? '#e8f0fe' : '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: index < 3 ? rankColors[index] : '#2563eb', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: currentTheme === 'blue' ? '#4b5563' : '#64748b' }}>
                  <span>{supplier.count} invoices</span>
                  <span>Avg: {formatCurrency(supplier.averageValue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileTransferCartBar({ movedDrugs, onTransfer, onClear, movingDrugsInProgress, formatCurrency, currentTheme }) {
  const [expanded, setExpanded] = useState(false);
  const count = Object.values(movedDrugs).length;
  const totalQty = Object.values(movedDrugs).reduce((s, d) => s + (parseInt(d.quantity) || 0), 0);
  const totalVal = Object.values(movedDrugs).reduce((s, d) => s + (parseInt(d.quantity) || 0) * (parseFloat(d.sellingPrice) || 0), 0);

  if (count === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
      background: currentTheme === 'blue' ? '#0a1e4a' : '#fff',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      borderTop: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`,
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdf4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#16a34a', fontSize: '16px' }} />
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#dc2626', color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '10px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{count}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: currentTheme === 'blue' ? '#fff' : '#0f172a' }}>{count} item{count !== 1 ? 's' : ''} selected</div>
          <div style={{ fontSize: '12px', color: currentTheme === 'blue' ? '#94a3b8' : '#64748b' }}>Qty: {totalQty} · Value: {formatCurrency(totalVal)}</div>
        </div>
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronUp} style={{ color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', fontSize: '14px' }} />
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px', maxHeight: '280px', overflowY: 'auto' }}>
          {Object.entries(movedDrugs).map(([key, drug], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#f1f5f9'}`, fontSize: '13px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: currentTheme === 'blue' ? '#fff' : '#0f172a' }}>{drug.drug}</div>
                <div style={{ color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', fontSize: '11px' }}>{drug.packaging} · Qty: {drug.quantity}</div>
              </div>
              <div style={{ fontWeight: '600', color: '#16a34a' }}>{formatCurrency((parseInt(drug.quantity) || 0) * (parseFloat(drug.sellingPrice) || 0))}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
        <button onClick={onClear} style={{
          padding: '13px', borderRadius: '12px', border: `1.5px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`,
          background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f8fafc',
          color: currentTheme === 'blue' ? '#fff' : '#475569', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        }}>Clear</button>
        <button onClick={onTransfer} disabled={movingDrugsInProgress} style={{
          padding: '13px', borderRadius: '12px', border: 'none',
          background: movingDrugsInProgress ? '#9ca3af' : 'linear-gradient(135deg, #059669, #16a34a)',
          color: '#fff', fontSize: '14px', fontWeight: '700', cursor: movingDrugsInProgress ? 'not-allowed' : 'pointer',
          boxShadow: movingDrugsInProgress ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
        }}>
          {movingDrugsInProgress ? 'Transferring...' : `Transfer ${count} Item${count !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

function MobileFilterSheet({ open, onClose, filterSupplier, setFilterSupplier, selectedInvoiceDate, setSelectedInvoiceDate, availableInvoiceDates, invoiceSuppliers, loadingInvoiceSuppliers, fetchInvoices, handleResetInvoiceFilters, currentTheme }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, backdropFilter: 'blur(2px)' }} />}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        background: currentTheme === 'blue' ? '#0a1e4a' : '#fff', borderRadius: '20px 20px 0 0',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#f1f5f9'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: '800', fontSize: '16px', color: currentTheme === 'blue' ? '#fff' : '#0f172a' }}>Filter Invoices</div>
          <button onClick={onClose} style={{ background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: currentTheme === 'blue' ? '#fff' : '#64748b' }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Date</label>
            <select value={selectedInvoiceDate} onChange={(e) => setSelectedInvoiceDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`, fontSize: '14px', color: currentTheme === 'blue' ? '#fff' : '#0f172a', background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#fff', outline: 'none', appearance: 'none' }}>
              <option value="">All Dates</option>
              {availableInvoiceDates.map((date, i) => (
                <option key={i} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: currentTheme === 'blue' ? '#94a3b8' : '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Supplier</label>
            <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`, fontSize: '14px', color: currentTheme === 'blue' ? '#fff' : '#0f172a', background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#fff', outline: 'none', appearance: 'none' }}>
              <option value="">All Suppliers</option>
              {loadingInvoiceSuppliers ? <option disabled>Loading...</option> : invoiceSuppliers.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={() => { handleResetInvoiceFilters(); onClose(); }} style={{ padding: '13px', borderRadius: '12px', border: `1.5px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`, background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : '#f8fafc', color: currentTheme === 'blue' ? '#fff' : '#475569', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Reset</button>
            <button onClick={() => { fetchInvoices(); onClose(); }} style={{ padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Apply</button>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileBottomNav({ activeSection, onSectionChange, currentTheme }) {
  const navItems = [
    { id: 'stock', icon: faBoxes, label: 'Stock', color: '#6366f1' },
    { id: 'insert', icon: faPlus, label: 'Insert', color: '#10b981' },
    { id: 'transfer', icon: faExchangeAlt, label: 'Transfer', color: '#f59e0b' },
    { id: 'invoices', icon: faFileInvoice, label: 'Invoices', color: '#ef4444' },
    { id: 'summary', icon: faChartLine, label: 'Summary', color: '#22d3ee' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: currentTheme === 'blue' ? '#0a1e4a' : '#ffffff',
      borderTop: `1px solid ${currentTheme === 'blue' ? '#1e3a8a' : '#e2e8f0'}`,
      display: 'flex',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {navItems.map(item => (
        <button key={item.id} onClick={() => onSectionChange(item.id)} style={{
          flex: 1, padding: '10px 4px 8px', border: 'none', background: 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          cursor: 'pointer', transition: 'all 0.2s ease',
          borderTop: activeSection === item.id ? `2px solid ${item.color}` : '2px solid transparent',
        }}>
          <FontAwesomeIcon icon={item.icon} style={{ fontSize: '18px', color: activeSection === item.id ? item.color : (currentTheme === 'blue' ? '#64748b' : '#94a3b8'), transition: 'color 0.2s ease' }} />
          <span style={{ fontSize: '9px', fontWeight: '600', color: activeSection === item.id ? item.color : (currentTheme === 'blue' ? '#64748b' : '#94a3b8'), letterSpacing: '0.3px' }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function Store() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlTheme = parseThemeFromSearch(window.location.search);

  // ── Theme and Feature Flags state ─────────────────────────────────────────
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [useExpiryDate, setUseExpiryDate] = useState(false);
  const [useBatchNumbers, setUseBatchNumbers] = useState(false);
  const theme = colors[currentTheme];
  const styles = getStyles(theme);

  // Store Management States
  const [activeSection, setActiveSection] = useState('stock');
  const [newDrugs, setNewDrugs] = useState([
    {
      drug_id: '',
      drug: '',
      quantity: '',
      packaging: '',
      costPrice: '',
      sellingPrice: '',
      sellingPrice2: '',
      batch_number: '',
      expiry_date: ''
    }
  ]);

  const [supplier, setSupplier] = useState('');
  const [insertionMessage, setInsertionMessage] = useState('');
  const [stockData, setStockData] = useState([]);
  const [mergedStockData, setMergedStockData] = useState([]);
  const [searchQueryMove, setSearchQueryMove] = useState('');
  const [searchQueryStock, setSearchQueryStock] = useState('');
  const [sortedStockData, setSortedStockData] = useState([]);
  const [movedDrugs, setMovedDrugs] = useState({});
  const [originalDrugs, setOriginalDrugs] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [insertingDrugs, setInsertingDrugs] = useState(false);
  const [movingDrugsInProgress, setMovingDrugsInProgress] = useState(false);
  const [stockWorth, setStockWorth] = useState(null);
  const [editableDrugs, setEditableDrugs] = useState(newDrugs.map(() => true));
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mergeEnabled, setMergeEnabled] = useState(true);
  const [transferViewMode, setTransferViewMode] = useState('cards');
  
  // Mobile-specific state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Invoice States
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [invoiceSuppliers, setInvoiceSuppliers] = useState([]);
  const [loadingInvoiceSuppliers, setLoadingInvoiceSuppliers] = useState(false);
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState('');
  const [availableInvoiceDates, setAvailableInvoiceDates] = useState([]);
  
  // Invoice Summary States
  const [invoiceSummary, setInvoiceSummary] = useState({
    totalInvoices: 0,
    totalInvoicesCount: 0,
    averageInvoiceValue: 0,
    monthlySummary: []
  });
  const [supplierAnalysis, setSupplierAnalysis] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);

  const iconColors = {
    insert: '#10b981',
    transfer: '#f59e0b',
    invoice: '#f13636',
    invoices: '#22de9f',
    dashboard: '#8b5cf6',
    warehouse: '#0ea5e9',
  };

  // Helper function to format expiry date for display
  const formatExpiryDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === null || dateString === 'No expiry') return 'No expiry';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'No expiry';
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'No expiry';
    }
  };

  // Helper function to check if drug is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate || expiryDate === 'null' || expiryDate === null || expiryDate === 'No expiry') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDate);
      return expiry < today;
    } catch {
      return false;
    }
  };

  // Helper function to get days until expiry
  const daysUntilExpiry = (expiryDate) => {
    if (!expiryDate || expiryDate === 'null' || expiryDate === null || expiryDate === 'No expiry') return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Merge drugs with same name and packaging when batch/expiry are null
  const mergeDrugs = (drugs) => {
    if (!mergeEnabled) return drugs;
    
    const mergeMap = new Map();
    const nonMergeableDrugs = [];

    drugs.forEach(drug => {
      const hasBatch = drug.batch_number && drug.batch_number !== 'null' && drug.batch_number !== null;
      const hasExpiry = drug.expiry_date && drug.expiry_date !== 'null' && drug.expiry_date !== null;
      
      if (hasBatch || hasExpiry) {
        nonMergeableDrugs.push(drug);
      } else {
        const key = `${drug.Drug}-${drug.Packaging}`;
        if (mergeMap.has(key)) {
          const existing = mergeMap.get(key);
          existing.Quantity += parseInt(drug.Quantity) || 0;
          existing.Cost_Price = Math.min(parseFloat(existing.Cost_Price), parseFloat(drug.Cost_Price));
        } else {
          mergeMap.set(key, { ...drug, Quantity: parseInt(drug.Quantity) || 0 });
        }
      }
    });

    const mergedDrugs = Array.from(mergeMap.values());
    return [...mergedDrugs, ...nonMergeableDrugs];
  };

  // Sort drugs by expiry date (nearest first) for transfer section
  const sortByExpiryDate = (drugs) => {
    return [...drugs].sort((a, b) => {
      const daysA = daysUntilExpiry(a.expiry_date);
      const daysB = daysUntilExpiry(b.expiry_date);
      
      if (daysA === null && daysB === null) return 0;
      if (daysA !== null && daysB === null) return -1;
      if (daysA === null && daysB !== null) return 1;
      return daysA - daysB;
    });
  };

  // ── Check theme and feature flags from security response ─────────────────
  useEffect(() => {
    const checkThemeAndSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
  
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
  
        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          
          const themeColor = securityData.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          // Set feature flags based on security response
          const expiryFlag = securityData.use_drug_expiry_date;
          const batchFlag = securityData.use_drug_batch_numbers;
          
          setUseExpiryDate(expiryFlag === 'yes' || expiryFlag === true);
          setUseBatchNumbers(batchFlag === 'yes' || batchFlag === true);
          
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            startStockWorthInterval(tokenFromUrl); 
          } else if (securityData.error === 'Session expired') {
            navigate(`/dashboard?token=${securityData.clinic_session_token}`);
          } else {
            navigate('/login');
          }
        } else {
          throw new Error('Failed to perform security check');
        }
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
      }
    };
  
    const fetchStockWorth = async (token) => {
      try {
        const response = await fetch(urls.stockworth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error('Failed to fetch stock worth');
        const data = await response.json();
        if (typeof data.stockWorth === 'object') {
          setStockWorth(data.stockWorth.stockWorth);
        } else {
          setStockWorth(data.stockWorth);
        }
      } catch (error) {
        console.error('Error fetching stock worth:', error);
      }
    };
  
    const startStockWorthInterval = (token) => {
      fetchStockWorth(token);
      const intervalId = setInterval(() => fetchStockWorth(token), 100000);
      return () => clearInterval(intervalId);
    };
  
    checkThemeAndSecurity();
  }, [navigate]);

  useEffect(() => {
    fetchStockData();
    fetchOriginalDrugs();
    const intervalId = setInterval(fetchStockData, 500000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const merged = mergeDrugs(stockData);
    setMergedStockData(merged);
    const sortedData = [...merged].sort((a, b) => a.Drug.localeCompare(b.Drug));
    setSortedStockData(sortedData);
  }, [stockData, mergeEnabled]);

  useEffect(() => {
    if (activeSection === 'invoices') {
      fetchInvoiceSuppliers();
      fetchInvoices();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'summary') {
      fetchInvoiceSummary();
    }
  }, [activeSection]);

  // Stock Management Functions
  const fetchStockData = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    const payload = {
      token: tokenFromUrl,
      use_expiry_date: useExpiryDate,
      use_batch_numbers: useBatchNumbers
    };
    
    fetch(urls.fetchdrugs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch stock data');
      return response.json();
    })
    .then(data => {
      const stockDataWithDetails = data.map(item => ({
        ...item,
        drug_id: item.drug_id || null,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null
      }));
      setStockData(stockDataWithDetails);
    })
    .catch(error => console.error('Error fetching stock data:', error));
  };
  
  const fetchOriginalDrugs = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    fetch(urls.fetchoriginaldrugs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenFromUrl }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch original drugs');
      return response.json();
    })
    .then(data => {
      const mappedDrugs = data.map(drug => ({
        ...drug,
        cost_price: parseFloat(drug.cost_price).toFixed(2),
        selling_price: parseFloat(drug.selling_price).toFixed(2),
        selling_price2: parseFloat(drug.selling_price2).toFixed(2),
      }));
      setOriginalDrugs(mappedDrugs);
    })
    .catch(error => console.error('Error fetching original drugs:', error));
  };
  
  // Invoice Functions
  const fetchInvoiceSuppliers = async () => {
    setLoadingInvoiceSuppliers(true);
    try {
      const response = await fetch(urls.fetchSuppliers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      const filteredSuppliers = data.suppliers
        .filter(supplier => supplier && supplier.trim() !== '' && !supplier.toLowerCase().includes('no supplier provided'))
        .map(supplier => supplier.toUpperCase());
      setInvoiceSuppliers(filteredSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers list');
    } finally {
      setLoadingInvoiceSuppliers(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch(urls.fetchInvoices, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      
      // Update clinic settings from response
      if (data.clinic_settings) {
        setUseExpiryDate(data.clinic_settings.use_drug_expiry_date === 'yes');
        setUseBatchNumbers(data.clinic_settings.use_drug_batch_numbers === 'yes');
      }
      
      const invoiceRecords = data.records || [];
      setInvoices(invoiceRecords);
      
      const uniqueDates = [...new Set(
        invoiceRecords
          .map(invoice => invoice.date || '')
          .filter(date => date !== '')
      )].sort().reverse();
      setAvailableInvoiceDates(uniqueDates);
      
      calculateInvoiceSummary(invoiceRecords);
    } catch (error) {
      toast.error('Failed to fetch invoices. Please try again.');
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const calculateInvoiceSummary = (invoiceData) => {
    const totalValue = invoiceData.reduce((sum, invoice) => 
      sum + parseFloat(invoice.total_cost || 0), 0
    );
    
    const monthlyMap = new Map();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    for (let i = 0; i <= currentMonth; i++) {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, {
        month: i + 1,
        year: currentYear,
        monthName: new Date(currentYear, i, 1).toLocaleString('default', { month: 'long' }),
        total: 0,
        count: 0
      });
    }
    
    const years = [...new Set(invoiceData.map(inv => {
      if (!inv.date) return null;
      return new Date(inv.date).getFullYear();
    }).filter(y => y !== null))];
    
    years.forEach(year => {
      if (year < currentYear) {
        for (let i = 0; i < 12; i++) {
          const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
          monthlyMap.set(monthKey, {
            month: i + 1,
            year: year,
            monthName: new Date(year, i, 1).toLocaleString('default', { month: 'long' }),
            total: 0,
            count: 0
          });
        }
      }
    });
    
    invoiceData.forEach(invoice => {
      if (invoice.date) {
        const date = new Date(invoice.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey);
          monthData.total += parseFloat(invoice.total_cost || 0);
          monthData.count += 1;
        }
      }
    });
    
    const monthlySummary = Array.from(monthlyMap.values())
      .filter(m => m.total > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    setInvoiceSummary({ totalInvoices: totalValue, monthlySummary });
  };

  const fetchInvoiceSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch(urls.fetchInvoices, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken }),
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      const invoiceRecords = data.records || [];
      
      const totalValue = invoiceRecords.reduce((sum, invoice) => 
        sum + parseFloat(invoice.total_cost || 0), 0
      );
      const totalCount = invoiceRecords.length;
      const averageValue = totalCount > 0 ? totalValue / totalCount : 0;

      const monthlyMap = new Map();
      invoiceRecords.forEach(invoice => {
        if (invoice.date) {
          const date = new Date(invoice.date);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const monthKey = `${year}-${String(month).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month,
              year,
              monthName: date.toLocaleString('default', { month: 'long' }),
              total: 0,
              count: 0
            });
          }
          const monthData = monthlyMap.get(monthKey);
          monthData.total += parseFloat(invoice.total_cost || 0);
          monthData.count += 1;
        }
      });

      const supplierMap = new Map();
      invoiceRecords.forEach(invoice => {
        const supplierName = (invoice.supplier || 'NO SUPPLIER PROVIDED').toUpperCase();
        if (!supplierMap.has(supplierName)) {
          supplierMap.set(supplierName, {
            supplier: supplierName,
            totalValue: 0,
            count: 0,
            averageValue: 0
          });
        }
        const supplierData = supplierMap.get(supplierName);
        supplierData.totalValue += parseFloat(invoice.total_cost || 0);
        supplierData.count += 1;
      });

      const supplierAnalysisData = Array.from(supplierMap.values())
        .map(supplier => ({
          ...supplier,
          averageValue: supplier.totalValue / supplier.count
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      setInvoiceSummary({
        totalInvoices: totalValue,
        totalInvoicesCount: totalCount,
        averageInvoiceValue: averageValue,
        monthlySummary: Array.from(monthlyMap.values())
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })
      });

      setSupplierAnalysis(supplierAnalysisData);
    } catch (error) {
      toast.error('Failed to fetch invoice summary');
      console.error('Error fetching invoice summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return { icon: faTrophy, color: '#fbbf24' };
    if (index === 1) return { icon: faTrophy, color: '#94a3b8' };
    if (index === 2) return { icon: faTrophy, color: '#b45309' };
    return null;
  };

  const getGroupedInvoices = () => {
    let filtered = invoices;

    if (selectedInvoiceDate) {
      filtered = filtered.filter(inv => inv.date === selectedInvoiceDate);
    }

    if (filterSupplier) {
      filtered = filtered.filter(inv => 
        (inv.supplier || '').toUpperCase() === filterSupplier.toUpperCase()
      );
    }
    
    const groups = {};
    filtered.forEach(invoice => {
      if (invoice.date) {
        const dateKey = invoice.date;
        const supplierKey = (invoice.supplier || 'NO SUPPLIER PROVIDED').toUpperCase();
        const groupKey = `${dateKey}-${supplierKey}`;
        if (!groups[groupKey]) {
          groups[groupKey] = { date: dateKey, supplier: supplierKey, items: [], total: 0 };
        }
        groups[groupKey].items.push(invoice);
        groups[groupKey].total += parseFloat(invoice.total_cost || 0);
      }
    });
    
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleResetInvoiceFilters = () => {
    setFilterSupplier('');
    setSelectedInvoiceDate('');
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleDrugChange = (index, field, value) => {
    const updatedDrugs = [...newDrugs];
    if (field === 'drug') {
      updatedDrugs[index][field] = value;
      const [selectedDrugName, selectedPackaging] = value.split(' - ');
      if (selectedDrugName && selectedPackaging) {
        const found = originalDrugs.find(d => 
          d.drug_name.trim() === selectedDrugName.trim() &&
          d.packaging.trim() === selectedPackaging.trim()
        );
        if (found) {
          updatedDrugs[index] = {
            ...updatedDrugs[index],
            drug_id: found.drug_id,
            drug: found.drug_name,
            packaging: found.packaging,
            costPrice: found.cost_price,
            sellingPrice: found.selling_price || '',
            sellingPrice2: found.selling_price2 || '',
          };
        }
      }
    } else {
      updatedDrugs[index][field] = value;
    }
    setNewDrugs(updatedDrugs);
  };

  const addNewRow = () => {
    if (newDrugs.length < 5) {
      setNewDrugs([...newDrugs, { 
        drug_id: '', 
        drug: '', 
        quantity: '', 
        packaging: '', 
        costPrice: '', 
        sellingPrice: '', 
        sellingPrice2: '',
        batch_number: '',
        expiry_date: ''
      }]);
      setEditableDrugs([...editableDrugs, true]);
    } else {
      toast.warning('Maximum 5 rows allowed. Please insert the current data first to avoid data loss.');
    }
  };

  const removeRow = (index) => {
    if (newDrugs.length > 1) {
      const updatedDrugs = [...newDrugs];
      updatedDrugs.splice(index, 1);
      setNewDrugs(updatedDrugs);
    }
  };
  
  const handleInsertDrugs = () => {
    if (!supplier) {
      toast.error('Please enter the supplier name');
      return;
    }
    setInsertingDrugs(true);
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const filteredDrugs = newDrugs.filter(drug => drug.drug && drug.quantity && drug.costPrice && drug.sellingPrice && drug.sellingPrice2);
    if (filteredDrugs.length === 0) {
      toast.error('Please fill in all required fields before submitting.');
      setInsertingDrugs(false);
      return;
    }
    const invalidDrugs = filteredDrugs.filter(drug => 
      !originalDrugs.some(originalDrug => 
        originalDrug.drug_name === drug.drug && originalDrug.packaging === drug.packaging
      )
    );
    if (invalidDrugs.length > 0) {
      toast.error('Some drugs do not exist in the facilitys scope. Contact an administrator.');
      setInsertingDrugs(false);
      return;
    }
    const abnormalCostPriceDrugs = filteredDrugs.filter(drug => {
      const originalDrug = originalDrugs.find(original => 
        original.drug_name === drug.drug && original.packaging === drug.packaging
      );
      if (originalDrug) {
        const originalCostPrice = parseFloat(originalDrug.cost_price);
        const insertedCostPrice = parseFloat(drug.costPrice);
        return (insertedCostPrice - originalCostPrice) > 1000;
      }
      return false;
    });
    if (abnormalCostPriceDrugs.length > 0) {
      const detailedMessage = abnormalCostPriceDrugs.map(drug => 
        `Drug Name: ${drug.drug}, Packaging: ${drug.packaging}, New Cost Price: ${drug.costPrice}`
      ).join('\n');
      const confirmMessage = `The new cost price of some drugs is abnormally high:\n\n${detailedMessage}\n\nAre you sure you want to proceed?`;
      if (!window.confirm(confirmMessage)) {
        setInsertingDrugs(false);
        return;
      }
    }
    
    const requestData = {
      token: tokenFromUrl,
      supplier: supplier,
      drugs: filteredDrugs.map(drug => ({
        drug_id: drug.drug_id,
        drug: drug.drug,
        quantity: drug.quantity,
        packaging: drug.packaging,
        costPrice: drug.costPrice,
        sellingPrice: drug.sellingPrice,
        sellingPrice2: drug.sellingPrice2,
        batch_number: useBatchNumbers ? (drug.batch_number || '') : null,
        expiry_date: useExpiryDate ? (drug.expiry_date || '') : null,
      })),
      use_expiry_date: useExpiryDate,
      use_batch_numbers: useBatchNumbers
    };
    
    fetch(urls.insertdrugs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to insert drugs');
      return response.json();
    })
    .then(data => {
      toast.success('Drugs inserted successfully.');
      setNewDrugs([{ 
        drug_id: '', 
        drug: '', 
        quantity: '', 
        packaging: '', 
        costPrice: '', 
        sellingPrice: '', 
        sellingPrice2: '',
        batch_number: '',
        expiry_date: ''
      }]);
      setSupplier('');
      setEditableDrugs(newDrugs.map(() => true));
      setInsertingDrugs(false);
      fetchStockData();
    })
    .catch(error => {
      toast.error('Drug insertion failed. Please check your network connectivity.');
      console.error('Error inserting drugs:', error);
      setInsertingDrugs(false);
    });
  };

  const handleSearchMove = (e) => {
    e.stopPropagation();
    setSearchQueryMove(e.target.value.slice(0, 10));
  };

  const handleSearchStock = (e) => {
    e.stopPropagation();
    setSearchQueryStock(e.target.value.slice(0, 10));
  };

  const filteredStockData = sortedStockData.filter(item => 
    item.Drug.toLowerCase().includes(searchQueryStock.toLowerCase())
  );

  const getSortedTransferDrugs = () => {
    const drugsWithQuantity = stockData.filter(item => item.Quantity > 0);
    const filtered = searchQueryMove === "" 
      ? drugsWithQuantity 
      : drugsWithQuantity.filter(item => item.Drug.toLowerCase().includes(searchQueryMove.toLowerCase()));
    
    if (useExpiryDate) {
      return sortByExpiryDate(filtered);
    }
    return filtered.sort((a, b) => a.Drug.localeCompare(b.Drug));
  };

  const getDrugKey = (drug) => {
    return `${drug.drug_id || drug.Drug}-${drug.Packaging}-${drug.batch_number || 'nobatch'}-${drug.expiry_date || 'noexpiry'}`;
  };

  const handleMoveQuantityChange = (drug, e) => {
    e.stopPropagation();
    const value = e.target.value;
    const drugKey = getDrugKey(drug);
    const updatedMovedDrugs = { ...movedDrugs };
    
    if (value === "") {
      if (updatedMovedDrugs[drugKey]) {
        updatedMovedDrugs[drugKey] = { ...updatedMovedDrugs[drugKey], quantity: "" };
      }
    } else {
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity)) {
        if (newQuantity === 0) {
          if (updatedMovedDrugs[drugKey]) delete updatedMovedDrugs[drugKey];
        } else {
          if (!updatedMovedDrugs[drugKey]) {
            updatedMovedDrugs[drugKey] = {
              drug_id: drug.drug_id,
              drug: drug.Drug,
              packaging: drug.Packaging,
              quantity: newQuantity,
              sellingPrice: drug.Selling_Price,
              sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
              batch_number: drug.batch_number,
              expiry_date: drug.expiry_date,
            };
          } else {
            updatedMovedDrugs[drugKey] = { ...updatedMovedDrugs[drugKey], quantity: newQuantity };
          }
        }
      }
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleMoveCheckboxChange = (drug, e) => {
    e.stopPropagation();
    const drugKey = getDrugKey(drug);
    const updatedMovedDrugs = { ...movedDrugs };
    
    if (e.target.checked) {
      updatedMovedDrugs[drugKey] = {
        drug_id: drug.drug_id,
        drug: drug.Drug,
        packaging: drug.Packaging,
        quantity: drug.Quantity,
        sellingPrice: drug.Selling_Price,
        sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
        batch_number: drug.batch_number,
        expiry_date: drug.expiry_date,
      };
    } else {
      delete updatedMovedDrugs[drugKey];
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleSellingPriceChange = (drug, e) => {
    e.stopPropagation();
    const drugKey = getDrugKey(drug);
    const updatedMovedDrugs = { ...movedDrugs };
    if (updatedMovedDrugs[drugKey]) {
      updatedMovedDrugs[drugKey] = { ...updatedMovedDrugs[drugKey], sellingPrice: e.target.value };
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleRemoveSelectedItem = (drugKey, e) => {
    e.stopPropagation();
    const updatedMovedDrugs = { ...movedDrugs };
    if (drugKey) {
      delete updatedMovedDrugs[drugKey];
      setMovedDrugs(updatedMovedDrugs);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'UGX 0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'UGX 0';
    return `UGX ${Math.round(numValue).toLocaleString('en-UG')}`;
  };

  const handleMoveDrugs = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    const drugsWithoutId = Object.values(movedDrugs).filter(drug => !drug.drug_id);
    if (drugsWithoutId.length > 0) {
      toast.error(`Cannot transfer: ${drugsWithoutId.length} drug(s) missing drug_id. Please refresh and try again.`, { 
        position: "top-right", 
        autoClose: 10000 
      });
      return;
    }
    
    const invalidMove = Object.values(movedDrugs).some((drug) => {
      const stockDrug = stockData.find(
        (stockItem) => stockItem.drug_id === drug.drug_id && 
                      stockItem.batch_number === drug.batch_number &&
                      stockItem.expiry_date === drug.expiry_date
      );
      if (stockDrug) {
        const availableQuantity = parseInt(stockDrug.Quantity, 10);
        const moveQuantity = parseInt(drug.quantity, 10);
        if (moveQuantity > availableQuantity) {
          toast.error(`Ooops! You are trying to move ${moveQuantity} of ${drug.drug} but only ${availableQuantity} is available in stock.`, { position: "top-right", autoClose: 15000 });
          return true;
        }
      } else {
        toast.error(`Drug ${drug.drug} with packaging ${drug.packaging} not found in stock data.`, { position: "top-right", autoClose: 10000 });
        return true;
      }
      return false;
    });
    
    if (invalidMove) return;
    
    setMovingDrugsInProgress(true);
    const requestData = {
      token: tokenFromUrl,
      drugs: Object.values(movedDrugs).map((drug) => ({
        drug_id: drug.drug_id,
        drug: drug.drug,
        packaging: drug.packaging,
        quantity: drug.quantity,
        sellingPrice: drug.sellingPrice,
        sellingPrice2: drug.sellingPrice2,
        batch_number: useBatchNumbers ? (drug.batch_number || null) : null,
        expiry_date: useExpiryDate ? (drug.expiry_date || null) : null,
      })),
      use_expiry_date: useExpiryDate,
      use_batch_numbers: useBatchNumbers
    };
    
    fetch(urls.movedrugs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
    .then((response) => {
      if (!response.ok) throw new Error('Failed to move drugs');
      return response.json();
    })
    .then((data) => {
      setMovingDrugsInProgress(false);
      toast.success(<div>Drugs transferred to dispensing shelves successfully.</div>, { position: "top-right", autoClose: 10000 });
      setMovedDrugs({});
      fetchStockData();
    })
    .catch((error) => {
      setMovingDrugsInProgress(false);
      toast.error('Failed to transfer drugs.', { position: "top-right", autoClose: 5000 });
      console.error('Error moving drugs:', error);
    });
  };

  const handleCancelMove = () => {
    setMovedDrugs({});
    setInsertionMessage('');
    setSearchQueryMove('');
  };
  
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        const response = await fetch(urls.fetchSuppliers, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (!response.ok) throw new Error('Failed to fetch suppliers');
        const data = await response.json();
        const filteredSuppliers = data.suppliers
          .filter(supplier => supplier && supplier.trim() !== '' && !supplier.toLowerCase().includes('no supplier provided'))
          .map(supplier => supplier.trim());
        setSuppliers(filteredSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const groupedInvoices = getGroupedInvoices();
  const sortedTransferDrugs = getSortedTransferDrugs();

  const selectedItemsSummary = {
    count: Object.values(movedDrugs).length,
    totalQuantity: Object.values(movedDrugs).reduce((sum, drug) => sum + (parseInt(drug.quantity) || 0), 0),
    totalValue: Object.values(movedDrugs).reduce((sum, drug) => sum + (parseInt(drug.quantity) || 0) * (parseFloat(drug.sellingPrice) || 0), 0)
  };

  // Mobile toggle handler
  const handleMobileToggle = (drug) => {
    const drugKey = getDrugKey(drug);
    const updatedMovedDrugs = { ...movedDrugs };
    if (updatedMovedDrugs[drugKey]) {
      delete updatedMovedDrugs[drugKey];
    } else {
      updatedMovedDrugs[drugKey] = {
        drug_id: drug.drug_id,
        drug: drug.Drug,
        packaging: drug.Packaging,
        quantity: drug.Quantity,
        sellingPrice: drug.Selling_Price,
        sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
        batch_number: drug.batch_number,
        expiry_date: drug.expiry_date,
      };
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  // Mobile render
  if (isMobile) {
    const hasCartItems = Object.values(movedDrugs).length > 0;
    const isTransfer = activeSection === 'transfer';
    const bottomPad = (isTransfer && hasCartItems) ? '160px' : '70px';

    return (
      <div style={{ minHeight: '100vh', background: theme.mainBg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { -webkit-tap-highlight-color: transparent; }
          input, select, textarea { font-size: 16px !important; }
          ::-webkit-scrollbar { display: none; }
        `}</style>
        <ToastContainer position="top-center" autoClose={4000} hideProgressBar theme="light" style={{ top: '70px' }} />

        <MobileHeader
          activeSection={activeSection}
          employeeName={employeeName}
          stockWorth={stockWorth}
          formatCurrency={formatCurrency}
          onMenuOpen={() => setMobileDrawerOpen(true)}
          currentTheme={currentTheme}
        />

        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          currentTheme={currentTheme}
        />

        <div style={{ paddingTop: '60px', paddingBottom: bottomPad, minHeight: '100vh' }}>
          <div style={{ padding: '16px' }}>

            {activeSection === 'stock' && (
              <div>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: '15px' }} />
                  <input
                    type="text" placeholder="Search stock..." value={searchQueryStock}
                    onChange={handleSearchStock}
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: '12px',
                      border: `1.5px solid ${theme.cardBorder}`, fontSize: '15px',
                      color: theme.textPrimary, background: theme.cardBg, outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '500' }}>
                    {filteredStockData.length} item{filteredStockData.length !== 1 ? 's' : ''} found
                  </span>
                  <button
                    onClick={() => setMergeEnabled(!mergeEnabled)}
                    style={{
                      padding: '5px 12px', fontSize: '11px', borderRadius: '20px',
                      border: 'none', background: mergeEnabled ? '#dcfce7' : '#fee2e2',
                      color: mergeEnabled ? '#166534' : '#991b1b', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    {mergeEnabled ? 'Merged View' : 'All Batches'}
                  </button>
                </div>
                {filteredStockData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>No items found</div>
                    <div style={{ fontSize: '13px' }}>Try adjusting your search</div>
                  </div>
                ) : (
                  filteredStockData.map((item, i) => (
                    <MobileStockCard
                      key={i} item={item} styles={styles}
                      useBatchNumbers={useBatchNumbers} useExpiryDate={useExpiryDate}
                      formatCurrency={formatCurrency} formatExpiryDate={formatExpiryDate}
                      isExpired={isExpired} daysUntilExpiry={daysUntilExpiry}
                      currentTheme={currentTheme}
                    />
                  ))
                )}
              </div>
            )}

            {activeSection === 'insert' && (
              <MobileInsertForm
                newDrugs={newDrugs} supplier={supplier} suppliers={suppliers}
                originalDrugs={originalDrugs} useBatchNumbers={useBatchNumbers} useExpiryDate={useExpiryDate}
                insertingDrugs={insertingDrugs} styles={styles}
                onDrugChange={handleDrugChange} addNewRow={addNewRow} removeRow={removeRow}
                setSupplier={setSupplier} handleInsertDrugs={handleInsertDrugs} setNewDrugs={setNewDrugs}
                currentTheme={currentTheme}
              />
            )}

            {activeSection === 'transfer' && (
              <div>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: '15px' }} />
                  <input
                    ref={searchInputRef} type="text" placeholder="Search to transfer..."
                    value={searchQueryMove} onChange={handleSearchMove}
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: '12px',
                      border: `1.5px solid ${theme.cardBorder}`, fontSize: '15px',
                      color: theme.textPrimary, background: theme.cardBg, outline: 'none',
                    }}
                  />
                </div>
                {useExpiryDate && (
                  <div style={{
                    background: theme.infoLight, borderRadius: '10px', padding: '10px 14px',
                    marginBottom: '14px', fontSize: '12px', color: '#2563eb', display: 'flex', gap: '8px', alignItems: 'center',
                  }}>
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>Sorted by nearest expiry date first</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>{sortedTransferDrugs.length} item{sortedTransferDrugs.length !== 1 ? 's' : ''} available</span>
                  {Object.values(movedDrugs).length > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>{Object.values(movedDrugs).length} selected</span>
                  )}
                </div>
                {sortedTransferDrugs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>No items available</div>
                    <div style={{ fontSize: '13px' }}>All items transferred or no stock</div>
                  </div>
                ) : (
                  sortedTransferDrugs.map((drug) => {
                    const drugKey = getDrugKey(drug);
                    return (
                      <MobileTransferCard
                        key={drugKey} drug={drug}
                        isSelected={!!movedDrugs[drugKey]}
                        movedDrugs={movedDrugs}
                        onToggle={handleMobileToggle}
                        onQtyChange={handleMoveQuantityChange}
                        onPriceChange={handleSellingPriceChange}
                        useBatchNumbers={useBatchNumbers} useExpiryDate={useExpiryDate}
                        formatCurrency={formatCurrency} formatExpiryDate={formatExpiryDate}
                        isExpired={isExpired} daysUntilExpiry={daysUntilExpiry}
                        getDrugKey={getDrugKey}
                        currentTheme={currentTheme}
                      />
                    );
                  })
                )}
              </div>
            )}

            {activeSection === 'invoices' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    {groupedInvoices.length} group{groupedInvoices.length !== 1 ? 's' : ''}
                    {(filterSupplier || selectedInvoiceDate) && <span style={{ color: '#2563eb', fontWeight: '600' }}> · Filtered</span>}
                  </span>
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    style={{
                      padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${(filterSupplier || selectedInvoiceDate) ? '#2563eb' : theme.cardBorder}`,
                      background: (filterSupplier || selectedInvoiceDate) ? '#eff6ff' : theme.cardBg,
                      color: (filterSupplier || selectedInvoiceDate) ? '#2563eb' : theme.textSecondary,
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <FontAwesomeIcon icon={faFilter} style={{ fontSize: '12px' }} />
                    Filter
                  </button>
                </div>
                <MobileInvoiceView
                  groupedInvoices={groupedInvoices} loadingInvoices={loadingInvoices}
                  styles={styles} useBatchNumbers={useBatchNumbers} useExpiryDate={useExpiryDate}
                  formatCurrency={formatCurrency} formatExpiryDate={formatExpiryDate}
                  isExpired={isExpired} daysUntilExpiry={daysUntilExpiry}
                  currentTheme={currentTheme}
                />
                <MobileFilterSheet
                  open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
                  filterSupplier={filterSupplier} setFilterSupplier={setFilterSupplier}
                  selectedInvoiceDate={selectedInvoiceDate} setSelectedInvoiceDate={setSelectedInvoiceDate}
                  availableInvoiceDates={availableInvoiceDates} invoiceSuppliers={invoiceSuppliers}
                  loadingInvoiceSuppliers={loadingInvoiceSuppliers} fetchInvoices={fetchInvoices}
                  handleResetInvoiceFilters={handleResetInvoiceFilters}
                  currentTheme={currentTheme}
                />
              </div>
            )}

            {activeSection === 'summary' && (
              <MobileSummaryView
                invoiceSummary={invoiceSummary} supplierAnalysis={supplierAnalysis}
                loadingSummary={loadingSummary}
                formatCurrency={formatCurrency} getRankBadge={getRankBadge}
                currentTheme={currentTheme}
              />
            )}
          </div>
        </div>

        {activeSection === 'transfer' && (
          <MobileTransferCartBar
            movedDrugs={movedDrugs} onTransfer={handleMoveDrugs}
            onClear={handleCancelMove} movingDrugsInProgress={movingDrugsInProgress}
            formatCurrency={formatCurrency} currentTheme={currentTheme}
          />
        )}

        {(!hasCartItems || !isTransfer) && (
          <MobileBottomNav activeSection={activeSection} onSectionChange={handleSectionChange} currentTheme={currentTheme} />
        )}
        {(hasCartItems && isTransfer) && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150 }}>
            <MobileBottomNav activeSection={activeSection} onSectionChange={handleSectionChange} currentTheme={currentTheme} />
          </div>
        )}
      </div>
    );
  }

  // ──────── DESKTOP RENDER (Original code) ────────
  const sidebarTextStyles = {
    color: theme.sidebarText,
    mutedColor: theme.sidebarTextMuted,
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.mainBg, 
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${theme.mainBg};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${theme.textMuted}80;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.textMuted};
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: ${theme.textMuted}80 ${theme.mainBg};
        }
        
        .table-row:hover td { background: ${theme.tableRowHover}; }
        .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .card-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .drug-input:focus, input:focus, select:focus { border-color: ${theme.info} !important; outline: none; }
        .sidebar-button:hover { background: ${theme.navHoverBg}; }
        .sidebar-button:hover .nav-icon { color: ${theme.iconHover}; transform: scale(1.1); }
        
        .transfer-drug-card {
          background: ${theme.cardBg};
          border: 1px solid ${theme.cardBorder};
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .transfer-drug-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .transfer-drug-card.selected {
          border-color: ${theme.accent};
          background: ${theme.accentLight};
        }
        .transfer-drug-card.expired {
          background: ${theme.dangerLight};
          border-color: ${theme.danger};
          opacity: 0.7;
        }
        
        .transfer-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        
        @media (max-width: 768px) {
          .transfer-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .responsive-table {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .responsive-table table {
          min-width: 600px;
        }
        
        .selected-items-panel {
          position: sticky;
          top: 20px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }
        
        .transfer-two-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        @media (min-width: 1024px) {
          .transfer-two-column {
            flex-direction: row;
            align-items: flex-start;
          }
          .transfer-drugs-list {
            flex: 2;
            min-width: 0;
          }
          .transfer-selected-panel {
            flex: 1;
            min-width: 320px;
          }
        }
        
        .invoice-group {
          border: 1px solid ${theme.cardBorder};
          border-radius: 12px;
          margin-bottom: 24px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .invoice-group-header {
          background: ${theme.tableHeader};
          padding: 16px 20px;
          border-bottom: 1px solid ${theme.cardBorder};
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .monthly-summary-item {
          padding: 10px 14px;
          border-bottom: 1px solid ${currentTheme === 'blue' ? 'rgba(255,255,255,0.06)' : theme.cardBorder};
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .monthly-summary-item:hover { background: ${currentTheme === 'blue' ? 'rgba(255,255,255,0.05)' : theme.tableRowHover}; }
        .monthly-summary-item:last-child { border-bottom: none; }
        .sidebar-filter-select {
          width: 100%;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1px solid ${currentTheme === 'blue' ? 'rgba(255,255,255,0.15)' : theme.cardBorder};
          font-size: 12px;
          color: ${currentTheme === 'blue' ? '#e0e7ff' : theme.textPrimary};
          background: ${currentTheme === 'blue' ? 'rgba(255,255,255,0.12)' : theme.cardBg};
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
        .sidebar-filter-select:focus { border-color: ${theme.info}; }
        .sidebar-filter-select option { 
          background: ${currentTheme === 'blue' ? '#0f2356' : theme.cardBg}; 
          color: ${currentTheme === 'blue' ? '#e0e7ff' : theme.textPrimary}; 
        }
        
        .drug-name-cell {
          max-width: 250px;
          word-wrap: break-word;
          white-space: normal;
          line-height: 1.4;
        }
        .quantity-cell {
          min-width: 70px;
          text-align: center;
        }
        .supplier-bar {
          transition: width 0.3s ease;
        }
        
        .collapse-btn:hover { 
          background: ${theme.collapseButtonHover} !important; 
          transform: scale(1.05); 
        }
        
        .nav-icon { 
          color: ${theme.iconBright}; 
          font-size: 18px; 
          transition: all 0.2s ease; 
        }
        
        .sidebar-button:hover .nav-icon { 
          color: ${theme.iconHover}; 
        }
        
        .expiry-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .expiry-soon { background: #fef3c7; color: #d97706; }
        .expired { background: #fee2e2; color: #dc2626; }
        .expiry-ok { background: #dcfce7; color: #166534; }
        
        .view-toggle {
          display: flex;
          gap: 8px;
          background: ${theme.tableHeader};
          padding: 4px;
          border-radius: 10px;
        }
        .view-toggle-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .view-toggle-btn.active {
          background: ${theme.info};
          color: white;
        }
        .view-toggle-btn:not(.active) {
          background: transparent;
          color: ${theme.textSecondary};
        }

        .drug-name-input {
          min-width: 200px;
          width: 100%;
        }

        .insert-table-container {
          overflow-x: auto;
          width: 100%;
        }

        .insert-table {
          min-width: 800px;
          width: 100%;
        }
      `}</style>
      
      <ToastContainer 
        position="top-right" autoClose={5000} hideProgressBar={false}
        newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light"
      />

      <Topbar token={urlToken} themeColor={currentTheme} />

      <div style={{ display: 'flex', flex: 1, marginTop: '60px' }}>
        {/* ──────── SIDEBAR ──────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: theme.sidebarBg,
          borderRight: `1px solid ${theme.sidebarBorder}`,
          transition: 'width 0.3s ease',
          position: 'fixed',
          top: '60px',
          left: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          color: theme.sidebarText,
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '20px 16px',
            borderBottom: `1px solid ${theme.sidebarBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}>
            {!sidebarCollapsed && (
              <div style={{ color: theme.sidebarTextMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Menu
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="collapse-btn"
              style={{
                ...styles.collapseButton,
                background: theme.collapseButtonBg,
                color: theme.collapseButtonText,
                width: '32px', height: '32px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faChevronLeft} />
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '16px 12px' }}>
            <button 
              onClick={() => handleSectionChange('stock')}
              style={styles.sidebarButton(activeSection === 'stock', sidebarCollapsed)}
              className="sidebar-button"
              onMouseEnter={() => setHoveredItem('stock')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FontAwesomeIcon icon={faBoxes} className="nav-icon" style={{ color: iconColors.dashboard }} />
              {!sidebarCollapsed && <span>Stock Inventory</span>}
              {sidebarCollapsed && hoveredItem === 'stock' && (
                <div style={styles.tooltip}>Stock Inventory</div>
              )}
            </button>

            <button 
              onClick={() => handleSectionChange('insert')}
              style={styles.sidebarButton(activeSection === 'insert', sidebarCollapsed)}
              className="sidebar-button"
              onMouseEnter={() => setHoveredItem('insert')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FontAwesomeIcon icon={faPlus} className="nav-icon" style={{ color: iconColors.insert }} />
              {!sidebarCollapsed && <span>Insert New Stock</span>}
              {sidebarCollapsed && hoveredItem === 'insert' && (
                <div style={styles.tooltip}>Insert New Stock</div>
              )}
            </button>

            <button 
              onClick={() => handleSectionChange('transfer')}
              style={styles.sidebarButton(activeSection === 'transfer', sidebarCollapsed)}
              className="sidebar-button"
              onMouseEnter={() => setHoveredItem('transfer')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="nav-icon" style={{ color: iconColors.transfer }} />
              {!sidebarCollapsed && <span>Transfer to Shelves</span>}
              {sidebarCollapsed && hoveredItem === 'transfer' && (
                <div style={styles.tooltip}>Transfer to Shelves</div>
              )}
            </button>

            <button 
              onClick={() => handleSectionChange('invoices')}
              style={styles.sidebarButton(activeSection === 'invoices', sidebarCollapsed)}
              className="sidebar-button"
              onMouseEnter={() => setHoveredItem('invoices')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FontAwesomeIcon icon={faFileInvoice} className="nav-icon" style={{ color: iconColors.invoice }} />
              {!sidebarCollapsed && <span>Invoice History</span>}
              {sidebarCollapsed && hoveredItem === 'invoices' && (
                <div style={styles.tooltip}>Invoice History</div>
              )}
            </button>

            <button 
              onClick={() => handleSectionChange('summary')}
              style={styles.sidebarButton(activeSection === 'summary', sidebarCollapsed)}
              className="sidebar-button"
              onMouseEnter={() => setHoveredItem('summary')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FontAwesomeIcon icon={faChartLine} className="nav-icon" style={{ color: iconColors.invoices }} />
              {!sidebarCollapsed && <span>Invoice Summary</span>}
              {sidebarCollapsed && hoveredItem === 'summary' && (
                <div style={styles.tooltip}>Invoice Summary</div>
              )}
            </button>
          </nav>

          {/* Merge toggle for stock view */}
          {!sidebarCollapsed && activeSection === 'stock' && (
            <div style={{ ...styles.filterSection, marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: currentTheme === 'blue' ? theme.sectionHeaderText : theme.textSecondary, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <FontAwesomeIcon icon={faObjectGroup} style={{ marginRight: '6px' }} />
                  Drug Display
                </div>
                <button
                  onClick={() => setMergeEnabled(!mergeEnabled)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.cardBorder}`,
                    background: mergeEnabled ? theme.accent : theme.danger,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {mergeEnabled ? 'Merge ON' : 'Merge OFF'}
                </button>
              </div>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '8px' }}>
                {mergeEnabled ? 'Similar drugs without batch/expiry are merged' : 'All batches shown separately'}
              </div>
            </div>
          )}

          {/* ── INVOICE FILTERS in sidebar (only when invoice tab active & not collapsed) ── */}
          {!sidebarCollapsed && activeSection === 'invoices' && (
            <div style={styles.filterSection}>
              <div style={{ color: currentTheme === 'blue' ? theme.sectionHeaderText : theme.textSecondary, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                <FontAwesomeIcon icon={faFilter} style={{ marginRight: '6px' }} />
                Invoice Filters
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: currentTheme === 'blue' ? '#94a3b8' : theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '5px' }} />
                  Filter by Date
                </label>
                <select
                  className="sidebar-filter-select"
                  value={selectedInvoiceDate}
                  onChange={(e) => setSelectedInvoiceDate(e.target.value)}
                >
                  <option value="">All Dates</option>
                  {availableInvoiceDates.map((date, index) => (
                    <option key={index} value={date}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: currentTheme === 'blue' ? '#94a3b8' : theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                  <FontAwesomeIcon icon={faFilter} style={{ marginRight: '5px' }} />
                  Filter by Supplier
                </label>
                <select
                  className="sidebar-filter-select"
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  size={5}
                  style={{ height: '180px', borderRadius: '8px', overflowY: 'auto', display: 'block' }}
                >
                  <option value="">All Suppliers</option>
                  {loadingInvoiceSuppliers ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    invoiceSuppliers.map((sup, index) => (
                      <option key={index} value={sup}>
                        {sup.length > 25 ? `${sup.substring(0, 25)}...` : sup}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={fetchInvoices}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: theme.info, color: '#fff', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <FontAwesomeIcon icon={faRedo} />
                  Refresh
                </button>
                <button
                  onClick={handleResetInvoiceFilters}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    border: currentTheme === 'blue' ? `1px solid rgba(255,255,255,0.15)` : `1px solid ${theme.cardBorder}`,
                    background: currentTheme === 'blue' ? 'rgba(255,255,255,0.07)' : theme.tableHeader,
                    color: currentTheme === 'blue' ? '#94a3b8' : theme.textSecondary,
                    fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  Reset
                </button>
              </div>

              <div style={{ height: '1px', background: theme.sidebarBorder, margin: '16px 0' }} />

              <div style={{ 
                background: currentTheme === 'blue' ? 'rgba(37,99,235,0.12)' : theme.tableHeader, 
                borderRadius: '10px', 
                border: `1px solid ${currentTheme === 'blue' ? 'rgba(37,99,235,0.25)' : theme.cardBorder}`, 
                overflow: 'hidden' 
              }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${currentTheme === 'blue' ? 'rgba(37,99,235,0.2)' : theme.cardBorder}` }}>
                  <div style={{ color: currentTheme === 'blue' ? '#94a3b8' : theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                    <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '6px' }} />
                    TOTAL INVOICES
                  </div>
                  <div style={{ color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontSize: '19px', fontWeight: '700' }}>
                    {formatCurrency(invoiceSummary.totalInvoices)}
                  </div>
                </div>
                <div style={{ height: '180px', overflowY: 'auto' }}>
                  {invoiceSummary.monthlySummary.length > 0 ? (
                    invoiceSummary.monthlySummary.map((month, index) => (
                      <div key={index} className="monthly-summary-item">
                        <div>
                          <div style={{ color: currentTheme === 'blue' ? theme.inactiveNavText : theme.textPrimary, fontSize: '12px', fontWeight: '500' }}>
                            {month.monthName} {month.year}
                          </div>
                          <div style={{ color: currentTheme === 'blue' ? theme.sectionHeaderText : theme.textMuted, fontSize: '10px' }}>
                            {month.count} invoice{month.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontSize: '13px', fontWeight: '600' }}>
                          {formatCurrency(month.total)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '14px', textAlign: 'center', color: currentTheme === 'blue' ? theme.sectionHeaderText : theme.textMuted, fontSize: '12px' }}>
                      No invoice data
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stock Worth */}
          {!sidebarCollapsed && stockWorth !== null && (
            <div style={{ 
              padding: '16px', 
              margin: '16px 12px', 
              background: currentTheme === 'blue' ? 'rgba(255,255,255,0.05)' : theme.tableHeader, 
              borderRadius: '10px', 
              border: `1px solid ${theme.sidebarBorder}` 
            }}>
              <div style={{ color: currentTheme === 'blue' ? theme.sectionHeaderText : theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>
                TOTAL STOCK WORTH
              </div>
              <div style={{ color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontSize: '18px', fontWeight: '700' }}>
                {formatCurrency(stockWorth)}
              </div>
            </div>
          )}
        </aside>

        {/* ──────── MAIN CONTENT ──────── */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          transition: 'margin-left 0.3s ease',
          padding: '20px 24px',
          maxWidth: 'calc(100% - 80px)',
          overflowX: 'auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px' }}>
                {activeSection === 'stock' && '📦 Stock Inventory'}
                {activeSection === 'insert' && '➕ Insert New Stock'}
                {activeSection === 'transfer' && '🔄 Transfer to Shelves'}
                {activeSection === 'invoices' && '📄 Invoice History'}
                {activeSection === 'summary' && '📊 Invoice Summary'}
              </h2>
              <p style={{ fontSize: '13px', color: theme.textMuted }}>
                {activeSection === 'stock' && 'View and manage your current store inventory'}
                {activeSection === 'insert' && 'Add new drugs to the store inventory'}
                {activeSection === 'transfer' && 'Transfer drugs from store to dispensing shelves (drugs with nearest expiry shown first)'}
                {activeSection === 'invoices' && 'View invoice history grouped by date and supplier'}
                {activeSection === 'summary' && 'Comprehensive invoice analysis and supplier insights'}
              </p>
            </div>
            
            {/* Feature flags indicator */}
            {(useExpiryDate || useBatchNumbers) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {useBatchNumbers && (
                  <span style={styles.badge('blue')}>
                    <FontAwesomeIcon icon={faBarcode} style={{ marginRight: '4px' }} />
                    Batch Numbers
                  </span>
                )}
                {useExpiryDate && (
                  <span style={styles.badge('orange')}>
                    <FontAwesomeIcon icon={faCalendarDay} style={{ marginRight: '4px' }} />
                    Expiry Tracking
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Conditional Content ── */}
          {activeSection === 'stock' && (
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faBoxes} style={{ color: theme.info }} />
                Current Stock Inventory
                {mergeEnabled && (
                  <span style={{ ...styles.badge('blue'), marginLeft: '8px', fontSize: '10px' }}>
                    <FontAwesomeIcon icon={faObjectGroup} style={{ marginRight: '4px' }} />
                    Similar drugs merged
                  </span>
                )}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', maxWidth: '320px' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: '14px' }} />
                  <input
                    type="text"
                    placeholder="Search drugs by name..."
                    value={searchQueryStock}
                    onChange={handleSearchStock}
                    style={{ ...styles.input, paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className="responsive-table" style={styles.tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Drug Name</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Packaging</th>
                      <th style={styles.th}>Cost Price</th>
                      <th style={styles.th}>Selling Price</th>
                      {useBatchNumbers && <th style={styles.th}>Batch</th>}
                      {useExpiryDate && <th style={styles.th}>Expiry Date</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockData.length > 0 ? (
                      filteredStockData.map((item, index) => (
                        <tr key={index} className="table-row">
                          <td style={{ ...styles.td, fontWeight: '500', wordWrap: 'break-word', whiteSpace: 'normal' }} className="drug-name-cell">
                            {item.Drug}
                          </td>
                          <td style={{ ...styles.td, fontWeight: '700', color: item.Quantity < 10 ? theme.danger : theme.textPrimary, textAlign: 'center' }} className="quantity-cell">
                            {item.Quantity}
                          </td>
                          <td style={{ ...styles.td, color: theme.textMuted }}>{item.Packaging}</td>
                          <td style={{ ...styles.td }}>{formatCurrency(item.Cost_Price)}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{formatCurrency(item.Selling_Price)}</td>
                          {useBatchNumbers && (
                            <td style={{ ...styles.td, color: theme.textMuted, fontSize: '11px' }}>
                              {item.batch_number && item.batch_number !== 'null' ? item.batch_number : '—'}
                            </td>
                          )}
                          {useExpiryDate && (
                            <td style={styles.td}>
                              {item.expiry_date && item.expiry_date !== 'null' ? (
                                <span className={`expiry-badge ${isExpired(item.expiry_date) ? 'expired' : daysUntilExpiry(item.expiry_date) <= 30 ? 'expiry-soon' : 'expiry-ok'}`}>
                                  {formatExpiryDate(item.expiry_date)}
                                  {!isExpired(item.expiry_date) && daysUntilExpiry(item.expiry_date) <= 30 && daysUntilExpiry(item.expiry_date) > 0 && (
                                    <span style={{ marginLeft: '4px' }}>({daysUntilExpiry(item.expiry_date)}d left)</span>
                                  )}
                                </span>
                              ) : 'No expiry'}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={useExpiryDate && useBatchNumbers ? 7 : (useExpiryDate || useBatchNumbers ? 6 : 5)} style={{ padding: '48px', textAlign: 'center', color: theme.textMuted }}>
                          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>No drugs found</div>
                          <div style={{ fontSize: '13px' }}>Try adjusting your search or add new drugs to inventory.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'insert' && (
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faPlus} style={{ color: iconColors.insert }} />
                Insert New Drugs
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '8px' }}>
                  Supplier Name *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Type or select supplier"
                    list="suppliersList"
                    style={{ ...styles.input, flex: 1, minWidth: '200px' }}
                  />
                  <datalist id="suppliersList">
                    {suppliers.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                  {suppliers.length > 0 && (
                    <select
                      onChange={(e) => { if (e.target.value) setSupplier(e.target.value); }}
                      style={{ ...styles.select, width: '160px' }}
                    >
                      <option value="">Quick Select</option>
                      {suppliers.map((s, i) => (
                        <option key={i} value={s}>{s.length > 20 ? `${s.substring(0, 20)}...` : s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="insert-table-container" style={styles.tableWrapper}>
                <table className="insert-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, minWidth: '200px' }}>Drug</th>
                      <th style={{ ...styles.th, width: '80px' }}>Qty</th>
                      <th style={{ ...styles.th, width: '100px' }}>Packaging</th>
                      <th style={{ ...styles.th, width: '110px' }}>Cost Price</th>
                      <th style={{ ...styles.th, width: '110px' }}>Selling Price</th>
                      {useBatchNumbers && <th style={{ ...styles.th, width: '120px' }}>Batch Number</th>}
                      {useExpiryDate && <th style={{ ...styles.th, width: '130px' }}>Expiry Date</th>}
                      <th style={{ ...styles.th, width: '70px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newDrugs.map((drug, index) => (
                      <tr key={index}>
                        <td style={styles.td}>
                          <input
                            type="text" 
                            value={drug.drug}
                            onChange={(e) => handleDrugChange(index, 'drug', e.target.value)}
                            list={`originalDrugsList-${index}`}
                            placeholder="Type drug name..."
                            autoComplete="off"
                            style={{ ...styles.input, width: '100%', minWidth: '180px' }}
                            className="drug-name-input"
                          />
                          <datalist id={`originalDrugsList-${index}`}>
                            {originalDrugs.map((d, idx) => <option key={idx} value={`${d.drug_name} - ${d.packaging}`} />)}
                          </datalist>
                        </td>
                        <td style={styles.td}>
                          <input type="number" value={drug.quantity} onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)} style={{ ...styles.input, width: '100%' }} />
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: theme.textMuted, fontSize: '12px' }}>{drug.packaging || '—'}</span>
                        </td>
                        <td style={styles.td}>
                          <input type="number" value={drug.costPrice} onChange={(e) => handleDrugChange(index, 'costPrice', e.target.value)} style={{ ...styles.input, width: '100%' }} />
                        </td>
                        <td style={styles.td}>
                          <input type="number" value={drug.sellingPrice} onChange={(e) => handleDrugChange(index, 'sellingPrice', e.target.value)} style={{ ...styles.input, width: '100%' }} />
                        </td>
                        {useBatchNumbers && (
                          <td style={styles.td}>
                            <input
                              type="text"
                              value={drug.batch_number || ''}
                              onChange={(e) => handleDrugChange(index, 'batch_number', e.target.value)}
                              placeholder="Batch #"
                              style={{ ...styles.input, width: '100%' }}
                            />
                          </td>
                        )}
                        {useExpiryDate && (
                          <td style={styles.td}>
                            <input
                              type="date"
                              value={drug.expiry_date || ''}
                              onChange={(e) => handleDrugChange(index, 'expiry_date', e.target.value)}
                              style={{ ...styles.input, width: '100%' }}
                            />
                          </td>
                        )}
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {index === newDrugs.length - 1 && (
                              <button onClick={addNewRow} style={{ padding: '4px 10px', fontSize: '12px', background: theme.info, border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>+</button>
                            )}
                            {newDrugs.length > 1 && (
                              <button onClick={() => removeRow(index)} style={{ padding: '4px 10px', fontSize: '12px', background: theme.tableHeader, border: `1px solid ${theme.cardBorder}`, borderRadius: '6px', color: theme.textSecondary, cursor: 'pointer' }}>✕</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setNewDrugs([{ 
                      drug_id: '', 
                      drug: '', 
                      quantity: '', 
                      packaging: '', 
                      costPrice: '', 
                      sellingPrice: '', 
                      sellingPrice2: '',
                      batch_number: '',
                      expiry_date: ''
                    }]);
                    setSupplier('');
                  }}
                  style={styles.secondaryButton}
                >
                  Clear All
                </button>
                <button
                  onClick={handleInsertDrugs}
                  disabled={insertingDrugs || !supplier}
                  style={{ ...styles.actionButton, opacity: (insertingDrugs || !supplier) ? 0.6 : 1, cursor: (insertingDrugs || !supplier) ? 'not-allowed' : 'pointer' }}
                >
                  {insertingDrugs ? 'Please wait...' : 'Insert Drugs'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'transfer' && (
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <span><FontAwesomeIcon icon={faExchangeAlt} style={{ color: iconColors.transfer }} /> Transfer Drugs to Shelves</span>
                
                <div className="view-toggle" style={{ marginLeft: 'auto' }}>
                  <button
                    className={`view-toggle-btn ${transferViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setTransferViewMode('list')}
                  >
                    <FontAwesomeIcon icon={faTable} style={{ marginRight: '4px' }} />
                    List View
                  </button>
                  <button
                    className={`view-toggle-btn ${transferViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setTransferViewMode('cards')}
                  >
                    <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: '4px' }} />
                    Card View
                  </button>
                </div>
              </div>

              {useExpiryDate && (
                <div style={{ 
                  background: theme.infoLight, 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  fontSize: '12px',
                  color: theme.textSecondary
                }}>
                  <FontAwesomeIcon icon={faInfoCircle} style={{ color: theme.info }} />
                  <span>Drugs are sorted by nearest expiry date first to help you transfer expiring stock promptly.</span>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', maxWidth: '320px' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: '14px' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search drugs to transfer..."
                    value={searchQueryMove}
                    onChange={handleSearchMove}
                    style={{ ...styles.input, paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div className="transfer-two-column">
                <div className="transfer-drugs-list">
                  {sortedTransferDrugs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: theme.textMuted, background: theme.tableHeader, borderRadius: '12px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>No drugs available</div>
                      <div style={{ fontSize: '13px' }}>All drugs have been transferred or no drugs in stock.</div>
                    </div>
                  ) : transferViewMode === 'cards' ? (
                    <div className="transfer-cards-grid">
                      {sortedTransferDrugs.map((drug) => {
                        const drugKey = getDrugKey(drug);
                        const isSelected = !!movedDrugs[drugKey];
                        const expiryDays = daysUntilExpiry(drug.expiry_date);
                        const isDrugExpired = isExpired(drug.expiry_date);
                        const selectedQty = movedDrugs[drugKey]?.quantity || '';
                        
                        return (
                          <div 
                            key={drugKey}
                            className={`transfer-drug-card ${isSelected ? 'selected' : ''} ${isDrugExpired ? 'expired' : ''}`}
                            onClick={() => {
                              if (!isDrugExpired) {
                                const updatedMovedDrugs = { ...movedDrugs };
                                if (isSelected) {
                                  delete updatedMovedDrugs[drugKey];
                                } else {
                                  updatedMovedDrugs[drugKey] = {
                                    drug_id: drug.drug_id,
                                    drug: drug.Drug,
                                    packaging: drug.Packaging,
                                    quantity: drug.Quantity,
                                    sellingPrice: drug.Selling_Price,
                                    sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
                                    batch_number: drug.batch_number,
                                    expiry_date: drug.expiry_date,
                                  };
                                }
                                setMovedDrugs(updatedMovedDrugs);
                              }
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary, flex: 1 }}>
                                {drug.Drug}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDrugExpired}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleMoveCheckboxChange(drug, e);
                                }}
                                style={{ width: '18px', height: '18px', cursor: isDrugExpired ? 'not-allowed' : 'pointer' }}
                              />
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px', fontSize: '12px' }}>
                              <span style={{ background: theme.tableHeader, padding: '2px 8px', borderRadius: '16px' }}>
                                {drug.Packaging}
                              </span>
                              <span style={{ fontWeight: '600', color: theme.textPrimary }}>
                                Available: {drug.Quantity}
                              </span>
                              {useBatchNumbers && drug.batch_number && drug.batch_number !== 'null' && (
                                <span style={{ color: theme.textMuted }}>Batch: {drug.batch_number}</span>
                              )}
                            </div>
                            
                            {useExpiryDate && drug.expiry_date && drug.expiry_date !== 'null' && (
                              <div style={{ marginBottom: '12px' }}>
                                <span className={`expiry-badge ${isDrugExpired ? 'expired' : expiryDays <= 30 ? 'expiry-soon' : 'expiry-ok'}`}>
                                  {formatExpiryDate(drug.expiry_date)}
                                  {!isDrugExpired && expiryDays !== null && expiryDays <= 30 && ` (${expiryDays}d left)`}
                                </span>
                              </div>
                            )}
                            
                            {isSelected && (
                              <div style={{ marginTop: '12px', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '12px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '2px' }}>Quantity</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={drug.Quantity}
                                      value={selectedQty}
                                      onChange={(e) => handleMoveQuantityChange(drug, e)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '12px' }}
                                      placeholder="Qty"
                                    />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '2px' }}>Selling Price</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={movedDrugs[drugKey]?.sellingPrice !== undefined ? movedDrugs[drugKey].sellingPrice : drug.Selling_Price}
                                      onChange={(e) => handleSellingPriceChange(drug, e)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '12px' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {isDrugExpired && (
                              <div style={{ marginTop: '8px', color: theme.danger, fontSize: '11px', fontWeight: '500' }}>
                                ⚠️ Expired - Cannot transfer
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="responsive-table" style={styles.tableWrapper}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
                        <thead>
                          <tr>
                            <th style={{ ...styles.th, width: '40px' }}>
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  const updatedMovedDrugs = e.target.checked
                                    ? Object.fromEntries(
                                        sortedTransferDrugs
                                          .filter(d => !isExpired(d.expiry_date))
                                          .map((drug) => {
                                            const drugKey = getDrugKey(drug);
                                            return [drugKey, {
                                              drug_id: drug.drug_id,
                                              drug: drug.Drug,
                                              packaging: drug.Packaging,
                                              quantity: drug.Quantity,
                                              sellingPrice: drug.Selling_Price,
                                              sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
                                              batch_number: drug.batch_number,
                                              expiry_date: drug.expiry_date,
                                            }];
                                          })
                                      )
                                    : {};
                                  setMovedDrugs(updatedMovedDrugs);
                                }}
                                checked={sortedTransferDrugs.filter(d => !isExpired(d.expiry_date)).length > 0 && Object.keys(movedDrugs).length === sortedTransferDrugs.filter(d => !isExpired(d.expiry_date)).length}
                              />
                            </th>
                            <th style={styles.th}>Drug Name</th>
                            <th style={styles.th}>Packaging</th>
                            {useBatchNumbers && <th style={styles.th}>Batch</th>}
                            {useExpiryDate && <th style={styles.th}>Expiry</th>}
                            <th style={styles.th}>Available</th>
                            <th style={styles.th}>Qty to Transfer</th>
                            <th style={styles.th}>Selling Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedTransferDrugs.map((drug) => {
                            const drugKey = getDrugKey(drug);
                            const isSelected = !!movedDrugs[drugKey];
                            const expiryDays = daysUntilExpiry(drug.expiry_date);
                            const isDrugExpired = isExpired(drug.expiry_date);
                            
                            return (
                              <tr key={drugKey} className="table-row" style={{ background: isDrugExpired ? theme.dangerLight : 'transparent' }}>
                                <td style={styles.td}>
                                  <input 
                                    type="checkbox" 
                                    onChange={(e) => handleMoveCheckboxChange(drug, e)} 
                                    checked={isSelected}
                                    disabled={isDrugExpired}
                                  />
                                </td>
                                <td style={{ ...styles.td, fontWeight: '500', wordWrap: 'break-word', whiteSpace: 'normal' }} className="drug-name-cell">
                                  {drug.Drug}
                                  {isDrugExpired && (
                                    <span style={{ ...styles.badge('red'), marginLeft: '8px', fontSize: '9px' }}>EXPIRED</span>
                                  )}
                                </td>
                                <td style={{ ...styles.td, color: theme.textMuted }}>{drug.Packaging}</td>
                                {useBatchNumbers && (
                                  <td style={{ ...styles.td, fontSize: '11px', color: theme.textMuted }}>
                                    {drug.batch_number && drug.batch_number !== 'null' ? drug.batch_number : '—'}
                                  </td>
                                )}
                                {useExpiryDate && (
                                  <td style={styles.td}>
                                    <span className={`expiry-badge ${isDrugExpired ? 'expired' : expiryDays <= 30 ? 'expiry-soon' : 'expiry-ok'}`}>
                                      {formatExpiryDate(drug.expiry_date)}
                                      {!isDrugExpired && expiryDays !== null && expiryDays <= 30 && ` (${expiryDays}d)`}
                                    </span>
                                  </td>
                                )}
                                <td style={{ ...styles.td, fontWeight: '700', color: drug.Quantity < 10 ? theme.danger : theme.textPrimary, textAlign: 'center' }}>
                                  {drug.Quantity}
                                </td>
                                <td style={styles.td}>
                                  <input
                                    type="number" min="0" max={drug.Quantity}
                                    value={movedDrugs[drugKey]?.quantity !== undefined ? movedDrugs[drugKey].quantity : ""}
                                    onChange={(e) => handleMoveQuantityChange(drug, e)}
                                    style={{ ...styles.input, width: '90px' }}
                                    disabled={!isSelected || isDrugExpired}
                                    placeholder="Qty"
                                  />
                                </td>
                                <td style={styles.td}>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={movedDrugs[drugKey]?.sellingPrice !== undefined ? movedDrugs[drugKey].sellingPrice : drug.Selling_Price}
                                    onChange={(e) => handleSellingPriceChange(drug, e)}
                                    style={{ ...styles.input, width: '110px' }}
                                    disabled={!isSelected || isDrugExpired}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {Object.values(movedDrugs).length > 0 && (
                  <div className="transfer-selected-panel selected-items-panel">
                    <div style={{
                      background: theme.cardBg,
                      borderRadius: '12px',
                      border: `1px solid ${theme.info}30`,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ 
                        background: theme.info, 
                        color: '#fff', 
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FontAwesomeIcon icon={faShoppingCart} />
                        <span style={{ fontWeight: '600' }}>Selected Drugs</span>
                        <span style={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          borderRadius: '20px', 
                          padding: '2px 10px', 
                          fontSize: '12px',
                          marginLeft: 'auto'
                        }}>
                          {selectedItemsSummary.count}
                        </span>
                      </div>
                      
                      <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
                        {Object.entries(movedDrugs).map(([drugKey, drug], index) => (
                          <div key={index} style={{ 
                            background: theme.tableHeader, 
                            padding: '12px', 
                            borderRadius: '10px', 
                            marginBottom: '10px',
                            border: `1px solid ${theme.cardBorder}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', color: theme.textPrimary, fontSize: '13px', flex: 1 }}>
                                {drug.drug}
                              </div>
                              <button 
                                onClick={(e) => handleRemoveSelectedItem(drugKey, e)} 
                                style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                              >
                                ✕
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px' }}>
                              <span><span style={{ color: theme.textMuted }}>Pack:</span> {drug.packaging}</span>
                              {useBatchNumbers && drug.batch_number && drug.batch_number !== 'null' && (
                                <span><span style={{ color: theme.textMuted }}>Batch:</span> {drug.batch_number}</span>
                              )}
                              <span><span style={{ color: theme.textMuted }}>Qty:</span> <strong>{drug.quantity}</strong></span>
                              <span><span style={{ color: theme.textMuted }}>Price:</span> {formatCurrency(drug.sellingPrice)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ padding: '16px', borderTop: `1px solid ${theme.cardBorder}`, background: theme.accentLight }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: theme.textMuted }}>Total Items:</span>
                          <span style={{ fontWeight: '600' }}>{selectedItemsSummary.count}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: theme.textMuted }}>Total Quantity:</span>
                          <span style={{ fontWeight: '600' }}>{selectedItemsSummary.totalQuantity}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ fontWeight: '600', color: theme.textPrimary }}>Total Value:</span>
                          <span style={{ fontWeight: '700', color: theme.accent }}>{formatCurrency(selectedItemsSummary.totalValue)}</span>
                        </div>
                      </div>
                      
                      <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={handleCancelMove} 
                          style={{ ...styles.secondaryButton, flex: 1, justifyContent: 'center', padding: '10px' }}
                        >
                          Clear All
                        </button>
                        <button
                          onClick={handleMoveDrugs}
                          disabled={movingDrugsInProgress}
                          style={{ ...styles.actionButton, flex: 1, justifyContent: 'center', padding: '10px', opacity: movingDrugsInProgress ? 0.6 : 1 }}
                        >
                          {movingDrugsInProgress ? 'Please wait...' : 'Transfer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'invoices' && (
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faFileInvoice} style={{ color: theme.info }} />
                Invoice History
                {(selectedInvoiceDate || filterSupplier) && (
                  <span style={{ ...styles.badge('blue'), marginLeft: '8px' }}>
                    Filtered
                  </span>
                )}
              </div>

              {/* Feature flags indicator for invoices */}
              {(useExpiryDate || useBatchNumbers) && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {useBatchNumbers && (
                    <span style={styles.badge('blue')}>
                      <FontAwesomeIcon icon={faBarcode} style={{ marginRight: '4px' }} />
                      Batch Numbers Enabled
                    </span>
                  )}
                  {useExpiryDate && (
                    <span style={styles.badge('orange')}>
                      <FontAwesomeIcon icon={faCalendarDay} style={{ marginRight: '4px' }} />
                      Expiry Tracking Enabled
                    </span>
                  )}
                </div>
              )}

              {(selectedInvoiceDate || filterSupplier) && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {selectedInvoiceDate && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: theme.infoLight, color: theme.info, border: `1px solid ${theme.info}30`
                    }}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {new Date(selectedInvoiceDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <button onClick={() => setSelectedInvoiceDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.info, padding: '0', fontSize: '12px', lineHeight: 1 }}>✕</button>
                    </span>
                  )}
                  {filterSupplier && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: theme.accentLight, color: theme.accent, border: `1px solid ${theme.accent}30`
                    }}>
                      <FontAwesomeIcon icon={faFilter} />
                      {filterSupplier}
                      <button onClick={() => setFilterSupplier('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent, padding: '0', fontSize: '12px', lineHeight: 1 }}>✕</button>
                    </span>
                  )}
                </div>
              )}

              {loadingInvoices ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <p style={{ color: theme.textMuted }}>Loading invoices...</p>
                </div>
              ) : (
                <div>
                  {groupedInvoices.length > 0 ? (
                    groupedInvoices.map((group, groupIndex) => (
                      <div key={groupIndex} className="invoice-group">
                        <div className="invoice-group-header">
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>🏆</span>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textPrimary }}>
                                {new Date(group.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </div>
                              <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                                Supplier: <span style={{ fontWeight: '600', color: theme.info }}>{group.supplier}</span>
                                <span style={{ marginLeft: '12px', color: theme.textMuted, fontSize: '12px' }}>
                                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ background: theme.accentLight, padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '15px', color: theme.accent }}>
                            {formatCurrency(group.total)}
                          </div>
                        </div>

                        <div className="responsive-table" style={styles.tableWrapper}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Drug</th>
                                {useBatchNumbers && <th style={styles.th}>Batch Number</th>}
                                {useExpiryDate && <th style={styles.th}>Expiry Date</th>}
                                <th style={styles.th}>Qty</th>
                                <th style={styles.th}>Packaging</th>
                                <th style={styles.th}>Unit Cost</th>
                                <th style={styles.th}>Total</th>
                                <th style={styles.th}>Employee</th>
                                <th style={styles.th}>Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((invoice, itemIndex) => (
                                <tr key={itemIndex} className="table-row">
                                  <td style={{ ...styles.td, fontWeight: '500' }}>{invoice.drug}</td>
                                  {useBatchNumbers && (
                                    <td style={{ ...styles.td, fontSize: '11px', color: theme.textMuted }}>
                                      {invoice.batch_number || 'No batch'}
                                    </td>
                                  )}
                                  {useExpiryDate && (
                                    <td style={styles.td}>
                                      <span className={`expiry-badge ${invoice.expiry_date && invoice.expiry_date !== 'No expiry' && invoice.expiry_date !== null && isExpired(invoice.expiry_date) ? 'expired' : invoice.expiry_date && invoice.expiry_date !== 'No expiry' && invoice.expiry_date !== null && daysUntilExpiry(invoice.expiry_date) <= 30 ? 'expiry-soon' : 'expiry-ok'}`}>
                                        {formatExpiryDate(invoice.expiry_date)}
                                      </span>
                                    </td>
                                  )}
                                  <td style={{ ...styles.td, textAlign: 'center' }}>{invoice.quantity}</td>
                                  <td style={{ ...styles.td }}>{invoice.packaging}</td>
                                  <td style={{ ...styles.td, textAlign: 'right', color: theme.textSecondary }}>
                                    {formatCurrency(parseFloat(invoice.total_cost) / parseInt(invoice.quantity))}
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'right', color: theme.accent, fontWeight: '600' }}>
                                    {formatCurrency(invoice.total_cost)}
                                  </td>
                                  <td style={{ ...styles.td }}>{invoice.employee_name}</td>
                                  <td style={{ ...styles.td, color: theme.textMuted, fontSize: '11px' }}>
                                    {invoice.time || '—'}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: theme.tableHeader }}>
                                <td colSpan={useExpiryDate && useBatchNumbers ? 5 : (useExpiryDate || useBatchNumbers ? 4 : 3)} style={{ ...styles.td, textAlign: 'right', fontWeight: '700' }}>
                                  Group Total:
                                </td>
                                <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: theme.accent, fontSize: '14px' }}>
                                  {formatCurrency(group.total)}
                                </td>
                                <td colSpan="2" style={{ ...styles.td }} />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: theme.textMuted, background: theme.tableHeader, borderRadius: '12px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>No invoices found</div>
                      <div style={{ fontSize: '14px' }}>
                        {selectedInvoiceDate || filterSupplier 
                          ? 'Try adjusting your filters in the sidebar to see more results' 
                          : 'Invoice history will appear here when purchases are made'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'summary' && (
            <div style={styles.gridContainer}>
              <div style={styles.card}>
                <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: iconColors.invoice }} />
                  Overall Summary
                </div>
                
                {loadingSummary ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                    Loading summary...
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ background: theme.infoLight, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Total Invoice Value</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: theme.info }}>{formatCurrency(invoiceSummary.totalInvoices)}</div>
                      </div>
                      <div style={{ background: theme.accentLight, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Total Invoices</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: theme.accent }}>{invoiceSummary.totalInvoicesCount}</div>
                      </div>
                    </div>
                    
                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', background: theme.tableHeader, borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <span style={{ fontWeight: '600', color: theme.textPrimary }}>Monthly Summary</span>
                      </div>
                      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {invoiceSummary.monthlySummary.length > 0 ? (
                          invoiceSummary.monthlySummary.map((month, index) => (
                            <div key={index} style={{ padding: '12px 16px', borderBottom: index < invoiceSummary.monthlySummary.length - 1 ? `1px solid ${theme.cardBorder}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: theme.textPrimary }}>{month.monthName} {month.year}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{month.count} invoice{month.count !== 1 ? 's' : ''}</div>
                              </div>
                              <div style={{ fontWeight: '700', color: theme.info }}>{formatCurrency(month.total)}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '32px', textAlign: 'center', color: theme.textMuted }}>
                            No invoice data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.card}>
                <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ color: iconColors.invoice }} />
                  Supplier Analysis
                </div>

                {loadingSummary ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                    Loading supplier data...
                  </div>
                ) : (
                  <div>
                    {supplierAnalysis.length > 0 && (
                      <div style={{ background: `linear-gradient(135deg, ${theme.skyBlue} 0%, ${theme.info} 100%)`, padding: '20px', borderRadius: '12px', marginBottom: '20px', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '22px', color: '#fbbf24' }} />
                          <div style={{ fontSize: '16px', fontWeight: '600' }}>Top Supplier</div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', wordBreak: 'break-word' }}>{supplierAnalysis[0].supplier}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                          <div>
                            <div style={{ fontSize: '11px', opacity: '0.9' }}>Total Purchases</div>
                            <div style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(supplierAnalysis[0].totalValue)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', opacity: '0.9' }}>Transactions</div>
                            <div style={{ fontSize: '16px', fontWeight: '600' }}>{supplierAnalysis[0].count}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', background: theme.tableHeader, borderBottom: `1px solid ${theme.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: theme.textPrimary }}>All Suppliers</span>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>Ranked by purchase value</span>
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {supplierAnalysis.length > 0 ? (
                          supplierAnalysis.map((supplier, index) => {
                            const rankBadge = getRankBadge(index);
                            const maxValue = supplierAnalysis[0].totalValue;
                            const percentage = (supplier.totalValue / maxValue) * 100;
                            
                            return (
                              <div key={index} style={{ padding: '14px 16px', borderBottom: index < supplierAnalysis.length - 1 ? `1px solid ${theme.cardBorder}` : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                  {rankBadge && (
                                    <FontAwesomeIcon icon={rankBadge.icon} style={{ color: rankBadge.color, fontSize: '16px' }} />
                                  )}
                                  {!rankBadge && (
                                    <span style={{ width: '24px', height: '24px', background: theme.tableHeader, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: theme.textSecondary }}>
                                      {index + 1}
                                    </span>
                                  )}
                                  <div style={{ flex: 1, fontWeight: '600', color: theme.textPrimary, fontSize: '13px', wordBreak: 'break-word' }}>{supplier.supplier}</div>
                                </div>
                                
                                <div style={{ marginBottom: '10px' }}>
                                  <div style={{ height: '6px', background: theme.tableHeader, borderRadius: '4px', overflow: 'hidden' }}>
                                    <div className="supplier-bar" style={{ height: '100%', width: `${percentage}%`, background: rankBadge ? (index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#b45309') : theme.info, borderRadius: '4px' }} />
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                  <div>
                                    <span style={{ color: theme.textMuted }}>Total: </span>
                                    <span style={{ fontWeight: '600', color: theme.textPrimary }}>{formatCurrency(supplier.totalValue)}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: theme.textMuted }}>Invoices: </span>
                                    <span style={{ fontWeight: '600', color: theme.textPrimary }}>{supplier.count}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: theme.textMuted }}>Avg: </span>
                                    <span style={{ fontWeight: '600', color: theme.textSecondary }}>{formatCurrency(supplier.averageValue)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: '32px', textAlign: 'center', color: theme.textMuted }}>
                            No supplier data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer style={{
        marginLeft: sidebarCollapsed ? '80px' : '280px',
        transition: 'margin-left 0.3s ease',
        padding: '16px 24px',
        borderTop: `1px solid ${theme.cardBorder}`,
        textAlign: 'center',
        fontSize: '11px',
        color: theme.textMuted
      }}>
        This system was created by DeepMind E-Systems. For help or support contact +256786747733
      </footer>
    </div>
  );
}

export default Store;