import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  // Blue theme - Dark sidebar with vibrant accents
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
    profitCard: '#16a34a',
    profitCardLight: '#dcfce7',
  },
  // White theme - Light sidebar with dark text
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
    profitCard: '#16a34a',
    profitCardLight: '#dcfce7',
  }
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
  filterItem: (active, collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? '0' : '12px',
    padding: collapsed ? '12px 0' : '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '600' : '500',
    color: active ? theme.activeNavText : theme.sidebarText,
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
    padding: collapsed ? '0' : '0 16px',
    marginBottom: '8px',
    marginTop: '16px',
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
  tableContainer: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  tableHeader: {
    background: theme.tableHeader,
    color: theme.textPrimary,
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.tableBorder}`,
    whiteSpace: 'nowrap',
  },
  tableCell: {
    padding: '14px 16px',
    fontSize: '13px',
    color: theme.textPrimary,
    borderBottom: `1px solid ${theme.tableBorder}`,
    verticalAlign: 'middle',
  },
  statCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
});

// ─── Global Styles Component ─────────────────────────────────────────────────
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
    
    .filter-item:hover { 
      background: ${theme.navHoverBg} !important; 
      color: ${theme.sidebarText} !important; 
    }
    
    .filter-icon { 
      color: ${theme.iconBright}; 
      font-size: 18px; 
      transition: all 0.2s ease; 
    }
    
    .filter-item:hover .filter-icon { 
      color: ${theme.iconHover}; 
      transform: scale(1.1); 
    }
    
    .active-filter { 
      background: ${theme.activeNavBg} !important; 
      border-radius: 8px !important;
    }
    
    .active-filter .filter-icon { 
      color: ${theme.activeNavText} !important; 
    }
    
    .collapse-btn:hover { 
      background: ${theme.collapseButtonHover} !important; 
      transform: scale(1.05); 
    }
    
    .table-row:hover {
      background: ${theme.tableHeader} !important;
    }
    
    .apply-btn:hover:not(:disabled) {
      background: ${theme.accent} !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
    }
    
    .clear-btn:hover:not(:disabled) {
      background: ${theme.danger} !important;
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

    /* Table column width styles */
    .removal-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .removal-table th,
    .removal-table td {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .removal-table .col-datetime { width: 12%; }
    .removal-table .col-drug { width: 18%; }
    .removal-table .col-packaging { width: 8%; }
    .removal-table .col-qty { width: 5%; }
    .removal-table .col-cost-price { width: 7%; }
    .removal-table .col-sell-price { width: 7%; }
    .removal-table .col-total-cost { width: 7%; }
    .removal-table .col-total-sell { width: 7%; }
    .removal-table .col-profit { width: 7%; }
    .removal-table .col-taken-by { width: 10%; }
    .removal-table .col-reason { width: 12%; }

    .drug-info-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .drug-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .drug-details-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-left: 24px;
    }

    .batch-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-family: 'Courier New', monospace;
      color: ${theme.textMuted};
      background: ${theme.tableHeader};
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .expiry-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .expiry-valid {
      background: ${theme.warningLight};
      color: ${theme.warning};
    }

    .expiry-expired {
      background: ${theme.dangerLight};
      color: ${theme.danger};
    }

    .no-details {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: ${theme.textMuted};
      font-style: italic;
      margin-left: 24px;
    }

    .numeric-cell {
      text-align: right;
      font-family: 'Inter', monospace;
      white-space: nowrap;
    }

    .recent-row {
      background-color: ${theme.warningLight} !important;
    }

    @media (max-width: 1400px) {
      .removal-table .col-datetime { width: 10%; }
      .removal-table .col-drug { width: 16%; }
      .removal-table .col-packaging { width: 7%; }
      .removal-table .col-qty { width: 4%; }
      .removal-table .col-cost-price { width: 6%; }
      .removal-table .col-sell-price { width: 6%; }
      .removal-table .col-total-cost { width: 7%; }
      .removal-table .col-total-sell { width: 7%; }
      .removal-table .col-profit { width: 7%; }
      .removal-table .col-taken-by { width: 10%; }
      .removal-table .col-reason { width: 20%; }
    }
  `}</style>
);

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
        borderTopColor: theme.accent, 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading removals...</div>
    </div>
  );
}

// ─── Drug Information Component ─────────────────────────────────────────────
const DrugInformation = ({ drugName, batchNumber, expiryDate }) => {
  // Check if batch number exists and is not null/empty
  const hasBatch = batchNumber && batchNumber !== 'null' && batchNumber.trim() !== '';
  
  // Check if expiry date exists and is not null/empty
  const hasExpiry = expiryDate && expiryDate !== 'null' && expiryDate.trim() !== '';
  
  // Check if expiry date is expired
  const isExpired = (date) => {
    if (!date) return false;
    try {
      const expiry = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry < today;
    } catch {
      return false;
    }
  };
  
  // Format expiry date for better display
  const formatExpiryDate = (date) => {
    if (!date) return '';
    try {
      const expiry = new Date(date);
      if (isNaN(expiry.getTime())) return date;
      return expiry.toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  };

  const formattedExpiry = formatExpiryDate(expiryDate);
  const expired = isExpired(expiryDate);

  return (
    <div className="drug-info-container">
      <div className="drug-name-row">
        <span style={{ color: colors.white.iconBright, flexShrink: 0, fontSize: '14px' }}>💊</span>
        <span style={{ wordBreak: 'break-word', fontWeight: '500' }}>{drugName}</span>
      </div>
      
      {/* Show batch number if available */}
      {hasBatch && (
        <div className="drug-details-row">
          <div className="batch-info">
            <span>📦</span>
            <span>Batch: {batchNumber}</span>
          </div>
        </div>
      )}
      
      {/* Show expiry date if available */}
      {hasExpiry && (
        <div className="drug-details-row">
          <div className={`expiry-info ${expired ? 'expiry-expired' : 'expiry-valid'}`}>
            <span>⏰</span>
            <span>Expiry: {formattedExpiry}</span>
            {expired && <span style={{ fontWeight: 'bold' }}>(EXPIRED)</span>}
          </div>
        </div>
      )}
      
      {/* Show message when both batch and expiry are missing */}
      {!hasBatch && !hasExpiry && (
        <div className="no-details">
          <span>ℹ️</span>
          <span>No batch number • No expiry date</span>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
function TakenFromShelf() {
  const [dispensedSoldData, setDispensedSoldData] = useState({
    removedDrugs: [],
    employeeStats: { uniqueEmployees: [], employeeCounts: {}, totalRemovals: 0 }
  });
  const [allEmployees, setAllEmployees] = useState([]);
  const [message, setMessage] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeName, setEmployeeName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFilterItem, setHoveredFilterItem] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('white');

  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  const urlTheme = parseThemeFromSearch(window.location.search);

  // Get the active theme colors
  const theme = colors[currentTheme];

  // Calculate totals
  const calculateTotals = (data) => {
    let totalCost = 0;
    let totalSelling = 0;
    let totalProfit = 0;

    data.forEach(item => {
      const cost = parseFloat(item.COP || '0') * parseInt(item.Quantity || '0');
      const selling = parseFloat(item.SellingPrice || '0') * parseInt(item.Quantity || '0');
      totalCost += cost;
      totalSelling += selling;
      totalProfit += (selling - cost);
    });

    return {
      totalCost: totalCost.toFixed(2),
      totalSelling: totalSelling.toFixed(2),
      totalProfit: totalProfit.toFixed(2)
    };
  };

  const totals = calculateTotals(dispensedSoldData.removedDrugs);

  // Check if date is within 5 minutes
  const isRecent = (dateTime) => {
    const now = new Date();
    const itemDate = new Date(dateTime);
    const diffInMinutes = (now - itemDate) / (1000 * 60);
    return diffInMinutes <= 5;
  };

  // Avatar initials
  const initials = (name) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  useEffect(() => {
    const performSecurityCheck = async (token) => {
      try {
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name || '');
            const themeColor = securityData.colour || '';
            setCurrentTheme(resolveTheme(urlTheme, themeColor));
            return true;
          }

          if (securityData.error === 'Session expired') {
            navigate(`/dashboard?token=${securityData.clinic_session_token}`);
            return false;
          }

          navigate('/login');
          return false;
        }

        throw new Error('Failed to perform security check');
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
        return false;
      }
    };
    
    const fetchDispensedSoldData = async (token) => {
      setIsLoading(true);
      try {
        let url = `${urls.takenfromshelf}`;
        const payload = { token: token || tokenFromUrl };
        
        if (searchDate) {
          payload.date = searchDate;
        }
        
        if (isFilterApplied && selectedEmployee) {
          payload.employee = selectedEmployee;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.error) {
          setMessage(data.error.includes('Incorrect DATE value') 
            ? 'Please insert the correct date format.' 
            : data.error);
        } else if (data.message) {
          setMessage(data.message);
          setDispensedSoldData(prev => ({
            ...prev,
            removedDrugs: [],
            employeeStats: {
              ...prev.employeeStats,
              totalRemovals: 0
            }
          }));
        } else {
          setAllEmployees(prev => {
            const newEmployees = data.employeeStats.uniqueEmployees || [];
            const combined = [...prev];
            newEmployees.forEach(emp => {
              if (!combined.includes(emp)) {
                combined.push(emp);
              }
            });
            return combined.sort();
          });

          setDispensedSoldData(data);
          setMessage('');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = tokenFromUrl || localStorage.getItem('token');
    performSecurityCheck(token).then((securityPassed) => {
      if (securityPassed) fetchDispensedSoldData(token);
    });
  }, [searchDate, isFilterApplied, selectedEmployee, navigate, tokenFromUrl]);

  const handleDateChange = (event) => {
    setSearchDate(event.target.value);
    setIsFilterApplied(false);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setIsFilterApplied(false);
  };

  const applyFilters = () => setIsFilterApplied(true);
  
  const clearFilters = () => {
    setSelectedEmployee('');
    setIsFilterApplied(false);
  };

  return (
    <>
      <GlobalStyles theme={theme} />
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: theme.mainBg,
        position: 'relative',
        fontFamily: "'Inter', sans-serif"
      }}>

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '280px',
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
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Shelf Removals</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Taken from shelf</div>
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

          {/* Staff Card - Only when not collapsed */}
          {!sidebarCollapsed && employeeName && (
            <div style={{
              margin: '16px 16px 20px',
              background: theme.staffCardBg,
              borderRadius: '10px',
              padding: '14px 16px',
              border: `1px solid ${theme.staffCardBorder}`,
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`,
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
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>{employeeName}</div>
              
            </div>
          )}

          {/* Filter Navigation */}
          <nav style={{ flex: 1, padding: sidebarCollapsed ? '12px 0' : '8px 12px', overflowY: 'auto' }}>
            {/* Date Filter Section */}
            <div style={{ marginBottom: '16px' }}>
              {!sidebarCollapsed && <div style={styles(theme).sectionHeader(sidebarCollapsed)}>DATE FILTER</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {!sidebarCollapsed ? (
                  <div style={{ padding: '0 16px', marginBottom: '12px' }}>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={handleDateChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.cardBg,
                        border: `1px solid ${theme.cardBorder}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: theme.textPrimary,
                        outline: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <button
                    className="filter-item"
                    onMouseEnter={() => setHoveredFilterItem('date')}
                    onMouseLeave={() => setHoveredFilterItem(null)}
                    style={{
                      ...styles(theme).filterItem(false, true),
                      padding: '12px 0',
                    }}
                  >
                    <span className="filter-icon" style={{
                      fontSize: '18px',
                      color: theme.iconBright,
                    }}>
                      📅
                    </span>
                    {hoveredFilterItem === 'date' && (
                      <div style={styles(theme).tooltip}>
                        Select Date: {searchDate}
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Employees Section */}
            <div style={{ marginBottom: '16px' }}>
              {!sidebarCollapsed && <div style={styles(theme).sectionHeader(sidebarCollapsed)}>EMPLOYEES</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {allEmployees.map((employee) => {
                  const isActive = selectedEmployee === employee;
                  return (
                    <button
                      key={employee}
                      className={`filter-item ${isActive ? 'active-filter' : ''}`}
                      onClick={() => handleEmployeeSelect(employee)}
                      onMouseEnter={() => setHoveredFilterItem(employee)}
                      onMouseLeave={() => setHoveredFilterItem(null)}
                      style={{
                        ...styles(theme).filterItem(isActive, sidebarCollapsed),
                        padding: sidebarCollapsed ? '12px 0' : '12px 16px',
                        position: 'relative',
                      }}
                    >
                      <span className="filter-icon" style={{
                        fontSize: '18px',
                        width: '20px',
                        textAlign: 'center',
                        filter: currentTheme === 'blue' ? 'brightness(1.2)' : 'none',
                        textShadow: currentTheme === 'blue' ? '0 0 5px rgba(251, 191, 36, 0.3)' : 'none',
                        color: isActive ? theme.activeNavText : theme.iconBright,
                      }}>
                        👤
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span style={{ 
                            fontWeight: '500', 
                            flex: 1, 
                            textAlign: 'left', 
                            color: isActive ? theme.activeNavText : theme.sidebarText,
                            fontSize: '13px',
                          }}>
                            {employee}
                          </span>
                          <span style={{
                            background: isActive ? theme.activeNavText : theme.filterSection,
                            color: isActive ? theme.activeNavBg : theme.sidebarTextMuted,
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            minWidth: '20px',
                            textAlign: 'center',
                          }}>
                            {dispensedSoldData.employeeStats.employeeCounts[employee] || 0}
                          </span>
                        </>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {sidebarCollapsed && hoveredFilterItem === employee && (
                        <div style={styles(theme).tooltip}>
                          {employee} ({dispensedSoldData.employeeStats.employeeCounts[employee] || 0})
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons - Only when not collapsed */}
            {!sidebarCollapsed && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="apply-btn"
                  onClick={applyFilters}
                  disabled={!selectedEmployee || isFilterApplied}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: !selectedEmployee || isFilterApplied ? theme.textMuted : theme.accent,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: !selectedEmployee || isFilterApplied ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: !selectedEmployee || isFilterApplied ? 0.5 : 1,
                  }}
                >
                  ✓ Apply Filters
                </button>
                
                <button
                  className="clear-btn"
                  onClick={clearFilters}
                  disabled={!selectedEmployee && !isFilterApplied}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: theme.danger,
                    border: `1px solid ${theme.danger}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: (!selectedEmployee && !isFilterApplied) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: (!selectedEmployee && !isFilterApplied) ? 0.5 : 1,
                  }}
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
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
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {employeeName ? initials(employeeName) : 'N'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, fontWeight: '500' }}>
                    Pharmacy
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.sidebarText,
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{employeeName}</div>
                </div>
              </div>
            ) : (
              <div
                style={{ fontSize: '14px', color: theme.sidebarText, fontWeight: '500', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setHoveredFilterItem('user')}
                onMouseLeave={() => setHoveredFilterItem(null)}
              >
                👤
                {hoveredFilterItem === 'user' && (
                  <div style={{ ...styles(theme).tooltip, left: '100%' }}>
                    {employeeName} - Pharmacist
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          paddingTop: '80px',
        }}>
          
          {/* Topbar with theme */}
          <Topbar token={tokenFromUrl} themeColor={currentTheme} />

          {/* Secondary Header */}
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
            <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: theme.iconBright }}>📦</span>
              Shelf Removals {searchDate && (
                <span style={{ fontSize: '14px', fontWeight: '500', color: theme.textMuted }}>
                  on {new Date(searchDate).toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {isFilterApplied && selectedEmployee && (
                <span style={{
                  background: theme.accentLight,
                  color: theme.accent,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginLeft: '8px',
                  whiteSpace: 'nowrap',
                }}>
                  by {selectedEmployee}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', color: theme.textMuted, whiteSpace: 'nowrap' }}>
                {dispensedSoldData.removedDrugs.length} removals
              </span>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: theme.tableHeader,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.textSecondary,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '14px' }}>{sidebarCollapsed ? '🔍' : '←'}</span>
                {sidebarCollapsed ? 'Show Filters' : 'Hide Filters'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}>
              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: theme.iconBright }}>📦</span> Total Removals
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: theme.textPrimary, lineHeight: 1 }}>
                  {dispensedSoldData.removedDrugs.length}
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: theme.iconBright }}>💰</span> Total Cost
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: theme.textPrimary, lineHeight: 1 }}>
                  UGX {Number(totals.totalCost).toLocaleString()}
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: theme.iconBright }}>💵</span> Total Selling
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: theme.textPrimary, lineHeight: 1 }}>
                  UGX {Number(totals.totalSelling).toLocaleString()}
                </div>
              </div>

              <div className="stat-card" style={styles(theme).statCard}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: theme.iconBright }}>📈</span> Total Profit
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: Number(totals.totalProfit) >= 0 ? theme.accent : theme.danger, lineHeight: 1 }}>
                  UGX {Number(totals.totalProfit).toLocaleString()}
                </div>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner theme={theme} />
            ) : message ? (
              <div style={{
                background: theme.dangerLight,
                border: `1px solid ${theme.danger}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                color: theme.danger,
                fontSize: '14px',
              }}>
                ⚠️ {message}
              </div>
            ) : (
              <>
                {/* Table with fixed column widths */}
                <div style={styles(theme).tableContainer}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="removal-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ background: theme.tableHeader }}>
                          <th className="col-datetime" style={{ ...styles(theme).tableHeader, textAlign: 'left' }}>Date & Time</th>
                          <th className="col-drug" style={{ ...styles(theme).tableHeader, textAlign: 'left' }}>Drug Information</th>
                          <th className="col-packaging" style={{ ...styles(theme).tableHeader, textAlign: 'left' }}>Packaging</th>
                          <th className="col-qty" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Qty</th>
                          <th className="col-cost-price" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Cost Price</th>
                          <th className="col-sell-price" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Sell Price</th>
                          <th className="col-total-cost" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Total Cost</th>
                          <th className="col-total-sell" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Total Sell</th>
                          <th className="col-profit" style={{ ...styles(theme).tableHeader, textAlign: 'right' }}>Profit</th>
                          <th className="col-taken-by" style={{ ...styles(theme).tableHeader, textAlign: 'left' }}>Taken By</th>
                          <th className="col-reason" style={{ ...styles(theme).tableHeader, textAlign: 'left' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispensedSoldData.removedDrugs.map((item, index) => {
                          const cost = parseFloat(item.COP || '0');
                          const selling = parseFloat(item.SellingPrice || '0');
                          const quantity = parseInt(item.Quantity || '0');
                          const totalCost = (cost * quantity).toFixed(2);
                          const totalSelling = (selling * quantity).toFixed(2);
                          const profit = (totalSelling - totalCost).toFixed(2);
                          
                          return (
                            <tr 
                              key={index} 
                              className={`table-row ${isRecent(item.date_time) ? 'recent-row' : ''}`} 
                              style={{ borderBottom: `1px solid ${theme.tableBorder}` }}
                            >
                              <td style={styles(theme).tableCell} title={item.date_time}>
                                {item.date_time}
                              </td>
                              <td style={styles(theme).tableCell}>
                                <DrugInformation 
                                  drugName={item.Drug}
                                  batchNumber={item.batch || item.batch_number}
                                  expiryDate={item.expiry_date}
                                />
                              </td>
                              <td style={styles(theme).tableCell}>
                                <span style={{
                                  background: theme.infoLight,
                                  color: theme.info,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {item.Packaging}
                                </span>
                              </td>
                              <td style={{ ...styles(theme).tableCell, textAlign: 'right', fontWeight: '600' }} className="numeric-cell">
                                {quantity}
                              </td>
                              <td style={{ ...styles(theme).tableCell, textAlign: 'right' }} className="numeric-cell">
                                UGX {parseFloat(cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ ...styles(theme).tableCell, textAlign: 'right' }} className="numeric-cell">
                                UGX {parseFloat(selling).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ ...styles(theme).tableCell, textAlign: 'right' }} className="numeric-cell">
                                UGX {parseFloat(totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ ...styles(theme).tableCell, textAlign: 'right' }} className="numeric-cell">
                                UGX {parseFloat(totalSelling).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ 
                                ...styles(theme).tableCell, 
                                textAlign: 'right',
                                color: profit >= 0 ? theme.accent : theme.danger,
                                fontWeight: '600',
                              }} className="numeric-cell">
                                {profit >= 0 ? '▲' : '▼'} UGX {Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={styles(theme).tableCell}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: theme.iconBright, flexShrink: 0 }}>👤</span>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.RemovedBy}>
                                    {item.RemovedBy}
                                  </span>
                                </div>
                              </td>
                              <td style={styles(theme).tableCell} title={item.reason}>
                                <span style={{ wordBreak: 'break-word' }}>{item.reason}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: theme.tableHeader, borderTop: `2px solid ${theme.cardBorder}` }}>
                          <td colSpan="4" style={{ ...styles(theme).tableCell, fontWeight: '700' }}>
                            TOTALS
                          </td>
                          <td style={styles(theme).tableCell}></td>
                          <td style={styles(theme).tableCell}></td>
                          <td style={{ ...styles(theme).tableCell, textAlign: 'right', fontWeight: '700' }} className="numeric-cell">
                            UGX {parseFloat(totals.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ ...styles(theme).tableCell, textAlign: 'right', fontWeight: '700' }} className="numeric-cell">
                            UGX {parseFloat(totals.totalSelling).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ 
                            ...styles(theme).tableCell, 
                            textAlign: 'right', 
                            fontWeight: '700',
                            color: Number(totals.totalProfit) >= 0 ? theme.accent : theme.danger,
                          }} className="numeric-cell">
                            {Number(totals.totalProfit) >= 0 ? '▲' : '▼'} UGX {Math.abs(Number(totals.totalProfit)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2" style={styles(theme).tableCell}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Summary Card */}
                <div style={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`,
                  borderRadius: '16px',
                  padding: '28px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>📊</span>
                      Total Financial Impact for {new Date(searchDate).toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1 }}>
                      UGX {Number(totals.totalProfit).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                      Cost: UGX {Number(totals.totalCost).toLocaleString()} | Selling: UGX {Number(totals.totalSelling).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    flexShrink: 0,
                  }}>
                    💰
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default TakenFromShelf;