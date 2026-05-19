import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import { toast } from 'react-toastify';
import GraphComponent from './GraphComponent';
import { urls } from './config.dev';
import jsPDF from 'jspdf';

function SalesDetails() {
  const { employee } = useParams();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [creditsData, setCreditsData] = useState(null);
  const [totalDrugsUsed, setTotalDrugsUsed] = useState(0);
  const [totalDrugsBought, setTotalDrugsBought] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [shiftType, setShiftType] = useState('Day');
  const [selectedSalesCategory, setSelectedSalesCategory] = useState('All');
  const [selectedExpensesCategory, setSelectedExpensesCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedMonthOnly, setSelectedMonthOnly] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYearForMonth, setSelectedYearForMonth] = useState(String(new Date().getFullYear()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [dateFilterType, setDateFilterType] = useState('single');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [urlToken, setUrlToken] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [viewType, setViewType] = useState('detailed');
  const [showGraphs, setShowGraphs] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [isPrinting, setIsPrinting] = useState(false);

  // ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
  const colors = {
    blue: {
      sidebarBg: '#0a1e4a', sidebarBorder: '#1e3a8a',
      activeNavBg: '#2563eb', activeNavText: '#ffffff',
      inactiveNavText: '#e0e7ff', navHoverBg: '#1e3a8a',
      sectionHeaderText: '#94a3b8', mainBg: '#f0f4ff',
      cardBg: '#ffffff', cardBorder: '#d4e0ff',
      accent: '#16a34a', accentLight: '#dcfce7',
      danger: '#dc2626', dangerLight: '#fef2f2',
      warning: '#d97706', warningLight: '#fffbeb',
      info: '#2563eb', infoLight: '#e0edff',
      skyBlue: '#38bdf8', skyBlueLight: '#e0f2fe',
      textPrimary: '#0a1e4a', textSecondary: '#1e3a8a', textMuted: '#4b5563',
      tableHeader: '#e8f0fe', tableBorder: '#cbd5e1', tableRowHover: '#f0f7ff',
      badgeGreen: { bg: '#dcfce7', text: '#166534' },
      badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
      badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
      badgeGray: { bg: '#f1f5f9', text: '#475569' },
      badgePurple: { bg: '#ede9fe', text: '#5b21b6' },
      filterSection: '#0d2257',
      collapseButtonBg: '#1e3a8a', collapseButtonHover: '#2563eb', collapseButtonText: '#ffffff',
      tooltipBg: '#1e293b', tooltipText: '#ffffff',
      iconBright: '#fbbf24', iconHover: '#f59e0b',
      sidebarText: '#ffffff', sidebarTextMuted: '#a5b4fc', pureWhite: '#ffffff',
    },
    white: {
      sidebarBg: '#ffffff', sidebarBorder: '#e2e8f0',
      activeNavBg: '#f1f5f9', activeNavText: '#0f172a',
      inactiveNavText: '#475569', navHoverBg: '#f8fafc',
      sectionHeaderText: '#64748b', mainBg: '#f8fafc',
      cardBg: '#ffffff', cardBorder: '#e2e8f0',
      accent: '#16a34a', accentLight: '#dcfce7',
      danger: '#dc2626', dangerLight: '#fef2f2',
      warning: '#d97706', warningLight: '#fffbeb',
      info: '#2563eb', infoLight: '#eff6ff',
      skyBlue: '#38bdf8', skyBlueLight: '#e0f2fe',
      textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
      tableHeader: '#f1f5f9', tableBorder: '#e2e8f0', tableRowHover: '#f8fafc',
      badgeGreen: { bg: '#dcfce7', text: '#166534' },
      badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
      badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
      badgeGray: { bg: '#f1f5f9', text: '#475569' },
      badgePurple: { bg: '#ede9fe', text: '#5b21b6' },
      filterSection: '#f8fafc',
      collapseButtonBg: '#e2e8f0', collapseButtonHover: '#cbd5e1', collapseButtonText: '#0f172a',
      tooltipBg: '#1e293b', tooltipText: '#ffffff',
      iconBright: '#f59e0b', iconHover: '#d97706',
      sidebarText: '#0f172a', sidebarTextMuted: '#64748b', pureWhite: '#ffffff',
    },
  };

  const theme = colors[currentTheme];

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  // ─── SAFE STRING HELPER (eliminates undefined/null in output) ─────────────────
  const safeStr = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    const s = String(val).trim();
    return s === 'undefined' || s === 'null' || s === '' ? fallback : s;
  };

  const formatDateDisplay = () => {
    try {
      switch (dateFilterType) {
        case 'single':    return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        case 'range':     return `${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${new Date(selectedEndDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        case 'month':     return new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        case 'monthyear': return `${MONTH_NAMES[parseInt(selectedMonthOnly, 10) - 1]} ${selectedYearForMonth}`;
        case 'thisyear':  return `Year ${currentYear}`;
        case 'year':      return `Year ${selectedYear}`;
        default:          return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch { return 'N/A'; }
  };

  // ─── COMPACT METRIC CARD ──────────────────────────────────────────────────────
  const CompactMetricCard = ({ icon, label, value, color, bgColor, tooltip, subValue }) => (
    <div
      style={{ background: theme.cardBg, borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px', transition: 'all 0.2s ease', border: `1px solid ${theme.cardBorder}` }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
      title={tooltip}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: bgColor || `${color}15`, color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>{value}</div>
        {subValue && <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{subValue}</div>}
      </div>
    </div>
  );

  // ─── SHARED STYLES ────────────────────────────────────────────────────────────
  const styles = {
    card: { background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    navItem: (active, collapsed) => ({
      display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
      gap: collapsed ? '0' : '12px', padding: collapsed ? '12px 0' : '8px 14px',
      borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
      fontWeight: active ? '600' : '500',
      color: active ? theme.activeNavText : theme.inactiveNavText,
      background: active ? theme.activeNavBg : 'transparent',
      transition: 'all 0.15s ease', textDecoration: 'none',
      border: 'none', width: '100%', textAlign: collapsed ? 'center' : 'left',
      marginBottom: '2px', position: 'relative',
    }),
    sectionHeader: (collapsed) => ({ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: collapsed ? '0' : '0 14px', marginBottom: '6px', marginTop: '10px', textAlign: collapsed ? 'center' : 'left' }),
    tooltip: { position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '12px', padding: '6px 10px', background: theme.tooltipBg, color: theme.tooltipText, fontSize: '11px', fontWeight: '500', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: `1px solid ${theme.sidebarBorder}` },
    collapseButton: { background: theme.collapseButtonBg, border: 'none', color: theme.collapseButtonText, fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', minWidth: '36px', height: '36px' },
    badge: (type) => {
      const map = { green: theme.badgeGreen, red: theme.badgeRed, orange: theme.badgeOrange, blue: theme.badgeBlue, sky: theme.badgeSky, gray: theme.badgeGray, purple: theme.badgePurple };
      const c = map[type] || map.gray;
      return { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: c.bg, color: c.text };
    },
    inputStyle: { padding: '5px', border: `1px solid ${theme.sidebarBorder}`, borderRadius: '6px', width: '100%', fontSize: '11px', background: theme.cardBg, color: theme.textPrimary, outline: 'none' },
    selectStyle: { padding: '5px', border: `1px solid ${theme.sidebarBorder}`, borderRadius: '6px', width: '100%', fontSize: '11px', background: theme.cardBg, color: theme.textPrimary, outline: 'none', cursor: 'pointer' },
    label: { display: 'block', marginBottom: '4px', color: theme.sidebarTextMuted, fontSize: '10px' },
    inlineInputPanel: { background: theme.filterSection, border: `1px solid ${theme.sidebarBorder}`, borderRadius: '8px', padding: '10px 12px', marginTop: '4px', marginBottom: '4px' },
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { verifyTokenAndFetchData(); }, [selectedDate, selectedEndDate, selectedMonth, selectedMonthOnly, selectedYearForMonth, selectedYear, dateFilterType]);

  const verifyTokenAndFetchData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      const urlTheme = parseThemeFromSearch(window.location.search);
      if (!tokenFromUrl) { toast.error('No token provided, redirecting to login...'); navigate('/login'); return; }
      setUrlToken(tokenFromUrl);
      const securityResponse = await fetch(urls.security, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenFromUrl }) });
      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        const themeColor = securityData.colour || '';
        setCurrentTheme(resolveTheme(urlTheme, themeColor));
        if (securityData.message === 'Session valid') {
          setIsTokenVerified(true);
          setEmployeeName(securityData.employee_name);
          setClinicName(securityData.clinic);
          fetchData(tokenFromUrl);
        } else if (securityData.error === 'Session expired') {
          toast.warning('Session expired, redirecting to the dashboard...');
          navigate(`/dashboard?token=${securityData.clinic_session_token}`);
        } else { toast.error('Session invalid, redirecting to login...'); navigate('/login'); }
      } else { throw new Error('Failed to perform security check'); }
    } catch (error) { console.error('Error performing security check:', error); toast.error('Error performing security check, redirecting to login...'); navigate('/login'); }
  };

  const buildDatePayload = () => {
    switch (dateFilterType) {
      case 'single':    return { date: selectedDate };
      case 'range':     return { startDate: selectedDate, endDate: selectedEndDate };
      case 'month':     return { month: selectedMonth };
      case 'monthyear': return { month: `${selectedYearForMonth}-${selectedMonthOnly}` };
      case 'thisyear':  return { year: String(currentYear) };
      case 'year':      return { year: selectedYear };
      default:          return { date: selectedDate };
    }
  };

  const fetchData = (token) => {
    setIsLoading(true);
    const datePayload = buildDatePayload();
    const payload = { token, ...datePayload };

    fetch(urls.fetchsales3, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(res => res.json()).then(data => { setSalesData(Array.isArray(data) ? data : []); if (data && Array.isArray(data) && data.length > 0 && data[0].Clinic) setClinicName(data[0].Clinic); })
      .catch(() => setSalesData([]));

    fetch(urls.fetchexpenses3, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(res => res.json()).then(data => {
        if (data && typeof data === 'object') {
          if (Array.isArray(data.expenses)) { setExpensesData(data.expenses); setTotalDrugsUsed(parseFloat(data.total_drugs_cop || 0)); setTotalDrugsBought(parseFloat(data.total_drugs_bought_cop || 0)); setTotalPatients(parseFloat(data.total_patients || 0)); }
          else if (Array.isArray(data)) { setExpensesData(data); setTotalDrugsUsed(0); setTotalDrugsBought(0); setTotalPatients(0); }
          else { setExpensesData([]); setTotalDrugsUsed(0); setTotalDrugsBought(0); setTotalPatients(0); }
        } else { setExpensesData([]); setTotalDrugsUsed(0); setTotalDrugsBought(0); setTotalPatients(0); }
      })
      .catch(() => { setExpensesData([]); setTotalDrugsUsed(0); setTotalDrugsBought(0); setTotalPatients(0); })
      .finally(() => setIsLoading(false));

    fetch(urls.fetchcredits3, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(res => res.json()).then(data => { setCreditsData(data && data.summary ? data : null); })
      .catch(() => setCreditsData(null));
  };

  const getPatientName = (p) => {
    if (p.details) {
      const first = safeStr(p.details.first_name);
      const last  = safeStr(p.details.last_name);
      if (first || last) return `${first} ${last}`.trim().toUpperCase();
    }
    const raw = safeStr(p.patient_name || p.PatientName || p.name);
    return raw ? raw.toUpperCase() : `PATIENT #${safeStr(p.contact_id, 'UNKNOWN')}`;
  };

  const getDeptAmounts = (p) => {
    const dt = p.department_totals || {};
    return {
      lab:            typeof dt.lab === 'object'           ? (dt.lab.amount            || 0) : (dt.lab            || 0),
      radiology:      typeof dt.radiology === 'object'     ? (dt.radiology.amount      || 0) : (dt.radiology      || 0),
      consultation:   typeof dt.consultation === 'object'  ? (dt.consultation.total    || 0) : (dt.consultation   || 0),
      family_planning:typeof dt.family_planning === 'object'? (dt.family_planning.total|| 0) : (dt.family_planning|| 0),
      services:       typeof dt.services === 'object'      ? (dt.services.balance      || 0) : (dt.services       || 0),
      rx_treatments:  typeof dt.rx_treatments === 'object' ? (dt.rx_treatments.balance || 0) : (dt.rx_treatments  || 0),
      credits:        dt.credits || 0,
    };
  };

  const isAutomaticEntry = (reason) => reason && (
    reason.includes('Day shift opened automatically by MEDCORE') ||
    reason.includes('Night shift was closed') ||
    reason.includes('Shift closed automatically by MEDCORE') ||
    reason.includes('Starting Night shift') ||
    reason.includes('Starting Day shift') ||
    reason.includes('Day shift opened by MEDCORE') ||
    reason.includes('Night shift opened by MEDCORE')
  );

  const normalizeCategory = (category) => {
    if (!category) return 'Non-Categorized';
    const lc = category.toLowerCase().trim();
    if (lc === 'lab' || lc === 'laboratory') return 'Laboratory';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const safeSalesData    = Array.isArray(salesData)    ? salesData    : [];
  const safeExpensesData = Array.isArray(expensesData) ? expensesData : [];
  const normalizedSalesData    = safeSalesData.map(s => ({ ...s, Category: normalizeCategory(s.Category) }));
  const normalizedExpensesData = safeExpensesData.map(e => ({ ...e, category: normalizeCategory(e.category) }));

  const daySales      = normalizedSalesData.filter(s => s.ShiftType === 'Day'   && !isAutomaticEntry(s.Reason));
  const nightSales    = normalizedSalesData.filter(s => s.ShiftType === 'Night' && !isAutomaticEntry(s.Reason));
  const dayExpenses   = normalizedExpensesData.filter(e => e.ShiftType === 'Day'   && !isAutomaticEntry(e.Details));
  const nightExpenses = normalizedExpensesData.filter(e => e.ShiftType === 'Night' && !isAutomaticEntry(e.Details));

  const totalDaySales       = daySales.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);
  const totalNightSales     = nightSales.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);
  const totalDayExpenses    = dayExpenses.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);
  const totalNightExpenses  = nightExpenses.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);
  const totalSalesCombined  = totalDaySales + totalNightSales;
  const totalExpensesCombined = totalDayExpenses + totalNightExpenses;
  // Standard P&L: Net Profit = Sales - COGS (Drugs Used) - Operating Expenses
  const grossProfit        = totalSalesCombined - totalDrugsUsed;
  const netProfitCombined  = grossProfit - totalExpensesCombined;
  const stockChange        = totalDrugsBought - totalDrugsUsed;
  const stockStatus        = stockChange >= 0 ? 'Net Addition' : 'Net Reduction';

  const openingStockEntry = safeSalesData.find(s => s.OpeningStock != null);
  const closingStockEntry = safeSalesData.find(s => s.ClosingStock != null);
  const openingStock = openingStockEntry ? parseFloat(openingStockEntry.OpeningStock) : null;
  const closingStock = closingStockEntry ? parseFloat(closingStockEntry.ClosingStock) : null;

  const filteredSales    = normalizedSalesData.filter(s => s.ShiftType === shiftType && (selectedSalesCategory === 'All' || s.Category === selectedSalesCategory) && !isAutomaticEntry(s.Reason));
  const filteredExpenses = normalizedExpensesData.filter(e => e.ShiftType === shiftType && (selectedExpensesCategory === 'All' || e.category === selectedExpensesCategory) && !isAutomaticEntry(e.Details));

  const totalSales    = filteredSales.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, r) => s + parseFloat(r.Amount || 0), 0);

  const salesCategories    = [...new Set(normalizedSalesData.map(s => s.Category))];
  const expensesCategories = [...new Set(normalizedExpensesData.map(e => e.category))];

  const salesCategoryTotals = salesCategories.map(cat => ({
    cat,
    salesTotal: normalizedSalesData.filter(s => s.ShiftType === shiftType && s.Category === cat && !isAutomaticEntry(s.Reason)).reduce((s, r) => s + parseFloat(r.Amount || 0), 0),
  })).sort((a, b) => b.salesTotal - a.salesTotal);

  const expensesCategoryTotals = expensesCategories.map(cat => ({
    cat,
    expensesTotal: normalizedExpensesData.filter(e => e.ShiftType === shiftType && e.category === cat && !isAutomaticEntry(e.Details)).reduce((s, r) => s + parseFloat(r.Amount || 0), 0),
  })).sort((a, b) => b.expensesTotal - a.expensesTotal);

  const totalUnpaidBalance = creditsData?.summary?.total_unpaid_balance || 0;
  const netUnpaidBalance   = creditsData?.summary?.net_unpaid_balance   || 0;
  const summaryDeptTotals  = creditsData?.summary?.department_totals    || {};

  const summaryLabAmt          = typeof summaryDeptTotals.lab === 'object'            ? (summaryDeptTotals.lab.amount             || 0) : (summaryDeptTotals.lab             || 0);
  const summaryRadiologyAmt    = typeof summaryDeptTotals.radiology === 'object'      ? (summaryDeptTotals.radiology.amount       || 0) : (summaryDeptTotals.radiology       || 0);
  const summaryConsultationAmt = typeof summaryDeptTotals.consultation === 'object'   ? (summaryDeptTotals.consultation.total     || 0) : (summaryDeptTotals.consultation    || 0);
  const summaryFamilyPlanAmt   = typeof summaryDeptTotals.family_planning === 'object'? (summaryDeptTotals.family_planning.total  || 0) : (summaryDeptTotals.family_planning || 0);
  const summaryServicesAmt     = typeof summaryDeptTotals.services === 'object'       ? (summaryDeptTotals.services.balance       || 0) : (summaryDeptTotals.services        || 0);
  const summaryRxAmt           = typeof summaryDeptTotals.rx_treatments === 'object'  ? (summaryDeptTotals.rx_treatments.balance  || 0) : (summaryDeptTotals.rx_treatments   || 0);
  const summaryCreditsAmt      = summaryDeptTotals.credits || 0;

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'UGX 0';
    return `UGX ${Math.round(amount).toLocaleString('en-US')}`;
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    return number.toLocaleString('en-US');
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch { return { date: 'N/A', time: 'N/A' }; }
  };

  // ─── PDF GENERATION ───────────────────────────────────────────────────────────
  // All text is passed through safeStr() to prevent "undefined" appearing in output.
  // Report follows standard accounting structure:
  //   Revenue -> COGS -> Gross Profit -> Operating Expenses -> Net Profit
  // "COP" (Cost of Purchase) is labelled as "Cost of Goods Sold (COGS)" with a legend.
  const handlePrintReport = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    toast.info('Generating PDF report, please wait...', { autoClose: 2000 });

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const mg = 12;
      let y = mg;

      // ── Validated strings (never "undefined" in output) ──────────────────────
      const safeClinic   = safeStr(clinicName,   'Clinic Name Not Available');
      const safeEmployee = safeStr(employee,     'Employee Not Available');
      const safeDateStr  = safeStr(formatDateDisplay(), 'Date Not Available');
      const safeGenDate  = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

      // ── Helper: draw a section divider ──────────────────────────────────────
      const sectionBar = (label, yPos, r, g, b) => {
        pdf.setFillColor(r, g, b);
        pdf.rect(mg, yPos, pw - mg * 2, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label.toUpperCase(), mg + 3, yPos + 5);
        return yPos + 9;
      };

      const hRule = (yPos) => {
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.1);
        pdf.line(mg, yPos, pw - mg, yPos);
      };

      const checkPage = (needed = 8) => {
        if (y + needed > ph - 16) { pdf.addPage(); y = mg + 4; }
      };

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 1 — INCOME STATEMENT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // Cover header band
      pdf.setFillColor(10, 30, 74);
      pdf.rect(0, 0, pw, 32, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INCOME STATEMENT', mg, 12);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(safeClinic, mg, 19);
     
      pdf.text(`Period: ${safeDateStr}`, mg, 29);
      pdf.setTextColor(180, 200, 255);
      pdf.setFontSize(7);
      pdf.text(`Generated: ${safeGenDate}`, pw - mg, 29, { align: 'right' });
      y = 38;

      // ── Legend / Glossary ─────────────────────────────────────────────────
      pdf.setFillColor(241, 245, 249);
      pdf.rect(mg, y, pw - mg * 2, 10, 'F');
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.2);
      pdf.rect(mg, y, pw - mg * 2, 10, 'S');
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GLOSSARY:', mg + 2, y + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.text('COGS = Cost of Goods Sold (drugs/treatments dispensed at purchase cost)  |  Gross Profit = Revenue minus COGS  |  Net Profit = Gross Profit minus Operating Expenses', mg + 22, y + 4);
      pdf.text('UGX = Uganda Shilling  |  All figures rounded to nearest shilling', mg + 2, y + 8.5);
      y += 14;

      // ── KPI Summary Row ───────────────────────────────────────────────────
      const kpiData = [
        { label: 'Total Revenue',    value: formatCurrency(totalSalesCombined),   color: [22, 163, 74]  },
        { label: 'Total COGS',       value: formatCurrency(totalDrugsUsed),       color: [220, 38, 38]  },
        { label: 'Gross Profit',     value: formatCurrency(grossProfit),          color: grossProfit >= 0 ? [22, 163, 74] : [220, 38, 38] },
        { label: 'Oper. Expenses',   value: formatCurrency(totalExpensesCombined),color: [220, 38, 38]  },
        { label: 'Net Profit',       value: formatCurrency(netProfitCombined),    color: netProfitCombined >= 0 ? [22, 163, 74] : [220, 38, 38] },
        { label: 'Total Patients',   value: formatNumber(totalPatients),          color: [37, 99, 235]  },
      ];
      const kpiW = (pw - mg * 2 - 5 * 2) / 6;
      kpiData.forEach((k, i) => {
        const x = mg + i * (kpiW + 2);
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(...k.color);
        pdf.setLineWidth(0.6);
        pdf.roundedRect(x, y, kpiW, 17, 2, 2, 'FD');
        // Top colour accent
        pdf.setFillColor(...k.color);
        pdf.rect(x, y, kpiW, 3.5, 'F');
        pdf.setTextColor(...k.color);
        pdf.setFontSize(5.8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(k.label, x + kpiW / 2, y + 8, { align: 'center' });
        pdf.setFontSize(6.5);
        pdf.text(k.value, x + kpiW / 2, y + 14, { align: 'center' });
      });
      y += 22;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 1: REVENUE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      y = sectionBar('1. Revenue (Sales)', y, 22, 101, 52);

      const col1 = pw - mg * 2 - 50;
      const col2 = 50;

      // Table header
      pdf.setFillColor(220, 252, 231);
      pdf.rect(mg, y, pw - mg * 2, 6, 'F');
      pdf.setTextColor(22, 101, 52);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Revenue Source', mg + 3, y + 4.2);
      pdf.text('Amount (UGX)', pw - mg - 3, y + 4.2, { align: 'right' });
      y += 7;

      const revenueRows = [
        { label: 'Day Shift Sales', value: totalDaySales },
        { label: 'Night Shift Sales', value: totalNightSales },
      ];

      revenueRows.forEach((row) => {
        checkPage();
        hRule(y);
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row.label, mg + 6, y + 4.2);
        pdf.setTextColor(22, 101, 52);
        pdf.text(`UGX ${Math.round(row.value).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
        y += 5.5;
      });

      // Total Revenue
      checkPage(8);
      pdf.setFillColor(220, 252, 231);
      pdf.rect(mg, y, pw - mg * 2, 7, 'F');
      pdf.setTextColor(22, 101, 52);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL REVENUE', mg + 3, y + 5);
      pdf.text(`UGX ${Math.round(totalSalesCombined).toLocaleString('en-US')}`, pw - mg - 3, y + 5, { align: 'right' });
      y += 11;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 2: COST OF GOODS SOLD (COGS)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(30);
      y = sectionBar('2. Cost of Goods Sold (COGS)', y, 185, 28, 28);

      pdf.setFillColor(254, 226, 226);
      pdf.rect(mg, y, pw - mg * 2, 6, 'F');
      pdf.setTextColor(153, 27, 27);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cost Item', mg + 3, y + 4.2);
      pdf.text('Amount (UGX)', pw - mg - 3, y + 4.2, { align: 'right' });
      y += 7;

      checkPage();
      hRule(y);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Drugs & Treatments Dispensed — at Purchase Cost (COGS)', mg + 6, y + 4.2);
      pdf.setTextColor(220, 38, 38);
      pdf.text(`UGX ${Math.round(totalDrugsUsed).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
      y += 5.5;

      checkPage(8);
      pdf.setFillColor(254, 226, 226);
      pdf.rect(mg, y, pw - mg * 2, 7, 'F');
      pdf.setTextColor(153, 27, 27);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL COGS', mg + 3, y + 5);
      pdf.text(`UGX ${Math.round(totalDrugsUsed).toLocaleString('en-US')}`, pw - mg - 3, y + 5, { align: 'right' });
      y += 11;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 3: GROSS PROFIT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(14);
      const gpColor = grossProfit >= 0 ? [22, 101, 52] : [153, 27, 27];
      const gpBg    = grossProfit >= 0 ? [220, 252, 231] : [254, 226, 226];
      pdf.setFillColor(...gpBg);
      pdf.rect(mg, y, pw - mg * 2, 9, 'F');
      pdf.setDrawColor(...gpColor);
      pdf.setLineWidth(0.8);
      pdf.rect(mg, y, pw - mg * 2, 9, 'S');
      pdf.setTextColor(...gpColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GROSS PROFIT  (Revenue minus COGS)', mg + 3, y + 6);
      const gpSign = grossProfit < 0 ? '-' : '';
      pdf.text(`${gpSign}UGX ${Math.abs(Math.round(grossProfit)).toLocaleString('en-US')}`, pw - mg - 3, y + 6, { align: 'right' });
      y += 14;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 4: OPERATING EXPENSES
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(30);
      y = sectionBar('3. Operating Expenses', y, 217, 119, 6);

      pdf.setFillColor(255, 237, 213);
      pdf.rect(mg, y, pw - mg * 2, 6, 'F');
      pdf.setTextColor(154, 52, 18);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expense Item', mg + 3, y + 4.2);
      pdf.text('Amount (UGX)', pw - mg - 3, y + 4.2, { align: 'right' });
      y += 7;

      const expenseRows = [
        { label: 'Day Shift Operating Expenses',   value: totalDayExpenses   },
        { label: 'Night Shift Operating Expenses', value: totalNightExpenses },
      ];

      expenseRows.forEach((row) => {
        checkPage();
        hRule(y);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row.label, mg + 6, y + 4.2);
        pdf.setTextColor(217, 119, 6);
        pdf.text(`UGX ${Math.round(row.value).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
        y += 5.5;
      });

      checkPage(8);
      pdf.setFillColor(255, 237, 213);
      pdf.rect(mg, y, pw - mg * 2, 7, 'F');
      pdf.setTextColor(154, 52, 18);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL OPERATING EXPENSES', mg + 3, y + 5);
      pdf.text(`UGX ${Math.round(totalExpensesCombined).toLocaleString('en-US')}`, pw - mg - 3, y + 5, { align: 'right' });
      y += 11;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 5: NET PROFIT (bottom line)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(16);
      const npColor = netProfitCombined >= 0 ? [22, 101, 52] : [153, 27, 27];
      const npBg    = netProfitCombined >= 0 ? [220, 252, 231] : [254, 226, 226];
      pdf.setFillColor(...npBg);
      pdf.setDrawColor(...npColor);
      pdf.setLineWidth(1.2);
      pdf.rect(mg, y, pw - mg * 2, 11, 'FD');
      pdf.setTextColor(...npColor);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NET PROFIT  (Gross Profit minus Operating Expenses)', mg + 3, y + 7.5);
      const npSign = netProfitCombined < 0 ? '-' : '';
      pdf.text(`${npSign}UGX ${Math.abs(Math.round(netProfitCombined)).toLocaleString('en-US')}`, pw - mg - 3, y + 7.5, { align: 'right' });
      y += 16;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 6: INVENTORY / STOCK MOVEMENT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(50);
      y = sectionBar('4. Inventory & Stock Movement', y, 37, 99, 235);

      pdf.setFillColor(219, 234, 254);
      pdf.rect(mg, y, pw - mg * 2, 6, 'F');
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Stock Item', mg + 3, y + 4.2);
      pdf.text('Amount (UGX)', pw - mg - 3, y + 4.2, { align: 'right' });
      y += 7;

      const stockRows = [
        { label: 'Opening Stock Value',                value: openingStock, note: openingStock == null ? '(not yet recorded)' : null },
        { label: 'Closing Stock Value',                value: closingStock, note: closingStock == null ? '(not yet recorded)' : null },
        { label: 'Inventory Purchases (at cost)',      value: totalDrugsBought },
        { label: 'Drugs & Treatments Dispensed (COGS)',value: totalDrugsUsed },
        { label: `Net Stock Movement (${stockStatus})`,value: stockChange, signed: true, color: stockChange >= 0 ? [22, 101, 52] : [220, 38, 38] },
      ];

      stockRows.forEach((row) => {
        checkPage();
        hRule(y);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row.label, mg + 6, y + 4.2);
        if (row.note) {
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'italic');
          pdf.text(row.note, pw - mg - 3, y + 4.2, { align: 'right' });
        } else {
          const c = row.color || [30, 58, 138];
          pdf.setTextColor(...c);
          const prefix = row.signed ? (row.value >= 0 ? '+' : '-') : (row.value < 0 ? '-' : '');
          pdf.text(`${prefix}UGX ${Math.abs(Math.round(row.value)).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
        }
        y += 5.5;
      });
      y += 4;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 7: OUTSTANDING PATIENT BALANCES (if data present)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (creditsData) {
        checkPage(60);
        y = sectionBar('5. Outstanding Patient Balances (Accounts Receivable)', y, 109, 40, 217);

        // Dept summary sub-table
        pdf.setFillColor(237, 233, 254);
        pdf.rect(mg, y, pw - mg * 2, 6, 'F');
        pdf.setTextColor(91, 33, 182);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Department', mg + 3, y + 4.2);
        pdf.text('Outstanding Amount (UGX)', pw - mg - 3, y + 4.2, { align: 'right' });
        y += 7;

        const arRows = [
          { label: 'Laboratory',             value: summaryLabAmt },
          { label: 'Radiology / Imaging',    value: summaryRadiologyAmt },
          { label: 'Consultation / OPD',     value: summaryConsultationAmt },
          { label: 'Family Planning',        value: summaryFamilyPlanAmt },
          { label: 'Services',               value: summaryServicesAmt },
          { label: 'Pharmacy / Treatments',  value: summaryRxAmt },
        ].filter(r => r.value > 0);

        arRows.forEach((row) => {
          checkPage();
          hRule(y);
          pdf.setTextColor(30, 58, 138);
          pdf.setFont('helvetica', 'normal');
          pdf.text(row.label, mg + 6, y + 4.2);
          pdf.setTextColor(217, 119, 6);
          pdf.text(`UGX ${Math.round(row.value).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
          y += 5.5;
        });

        if (summaryCreditsAmt > 0) {
          checkPage();
          hRule(y);
          pdf.setTextColor(30, 58, 138);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Less: Credits Applied to Patient Accounts', mg + 6, y + 4.2);
          pdf.setTextColor(22, 101, 52);
          pdf.text(`-UGX ${Math.round(summaryCreditsAmt).toLocaleString('en-US')}`, pw - mg - 3, y + 4.2, { align: 'right' });
          y += 5.5;
        }

        checkPage(8);
        pdf.setFillColor(255, 251, 235);
        pdf.rect(mg, y, pw - mg * 2, 7, 'F');
        pdf.setTextColor(154, 52, 18);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL OUTSTANDING BALANCE (Gross)', mg + 3, y + 5);
        pdf.text(`UGX ${Math.round(totalUnpaidBalance).toLocaleString('en-US')}`, pw - mg - 3, y + 5, { align: 'right' });
        y += 8;

        checkPage(8);
        pdf.setFillColor(255, 237, 213);
        pdf.rect(mg, y, pw - mg * 2, 7, 'F');
        pdf.setTextColor(154, 52, 18);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('NET OUTSTANDING BALANCE (after Credits)', mg + 3, y + 5);
        pdf.text(`UGX ${Math.round(netUnpaidBalance).toLocaleString('en-US')}`, pw - mg - 3, y + 5, { align: 'right' });
        y += 12;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SECTION 8: PERFORMANCE INDICATORS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      checkPage(50);
      y = sectionBar('6. Key Performance Indicators', y, 37, 99, 235);

      const kpiRows = [
        { label: 'Gross Profit Margin',      value: totalSalesCombined > 0 ? `${((grossProfit / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Net Profit Margin',        value: totalSalesCombined > 0 ? `${((netProfitCombined / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'COGS as % of Revenue',     value: totalSalesCombined > 0 ? `${((totalDrugsUsed / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Operating Expense Ratio',  value: totalSalesCombined > 0 ? `${((totalExpensesCombined / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Revenue per Patient',      value: totalPatients > 0 ? formatCurrency(totalSalesCombined / totalPatients) : 'N/A' },
        { label: 'Day Shift Revenue Share',  value: totalSalesCombined > 0 ? `${((totalDaySales / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Night Shift Revenue Share',value: totalSalesCombined > 0 ? `${((totalNightSales / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Inventory Turnover (Use/Purchase)', value: totalDrugsBought > 0 ? `${((totalDrugsUsed / totalDrugsBought) * 100).toFixed(1)}%` : 'N/A' },
      ];

      kpiRows.forEach((row, i) => {
        checkPage();
        if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(mg, y, pw - mg * 2, 5.5, 'F'); }
        hRule(y);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.text(row.label, mg + 6, y + 3.8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(row.value, pw - mg - 3, y + 3.8, { align: 'right' });
        y += 5.5;
      });
      y += 6;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 2+ — UNPAID PATIENT BILLS (Accounts Receivable Detail)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const patients = creditsData?.patient_balances;
      if (Array.isArray(patients) && patients.length > 0) {
        pdf.addPage();
        y = mg;

        pdf.setFillColor(10, 30, 74);
        pdf.rect(0, 0, pw, 26, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ACCOUNTS RECEIVABLE — UNPAID PATIENT BILLS', mg, 11);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${safeClinic}  |  Period: ${safeDateStr}  |  ${patients.length} patient record(s)`, mg, 18);
        pdf.text(`NOTE: All patient names in UPPERCASE for standardisation`, mg, 23);
        y = 32;

        const cols = [
          { label: 'PATIENT NAME',     w: 36, align: 'left'  },
          { label: 'OPD NO.',          w: 15, align: 'left'  },
          { label: 'AGE',              w: 10, align: 'right' },
          { label: 'LABORATORY',       w: 19, align: 'right' },
          { label: 'RADIOLOGY',        w: 18, align: 'right' },
          { label: 'CONSULTATION',     w: 19, align: 'right' },
          { label: 'FAM. PLANNING',    w: 18, align: 'right' },
          { label: 'SERVICES',         w: 16, align: 'right' },
          { label: 'PHARMACY/RX',      w: 18, align: 'right' },
          { label: 'CREDITS',          w: 14, align: 'right' },
          { label: 'BALANCE DUE',      w: 20, align: 'right' },
        ];

        // Table header
        pdf.setFillColor(219, 234, 254);
        pdf.rect(mg, y, pw - mg * 2, 7, 'F');
        pdf.setDrawColor(147, 197, 253);
        pdf.setLineWidth(0.3);
        pdf.rect(mg, y, pw - mg * 2, 7, 'S');
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(5.8);
        pdf.setFont('helvetica', 'bold');
        let cx = mg;
        cols.forEach(col => {
          pdf.text(col.label, col.align === 'right' ? cx + col.w - 1 : cx + 1, y + 4.8, { align: col.align });
          cx += col.w;
        });
        y += 8;

        patients.forEach((p, idx) => {
          checkPage(7);
          const name    = getPatientName(p);   // always UPPERCASE
          const dept    = getDeptAmounts(p);
          const opd     = safeStr(p.details?.opd_no, '—');
          const ageYrs  = p.details?.age;
          const ageMths = p.details?.age_months;
          const ageWks  = p.details?.age_weeks;
          const ageStr  = ageYrs > 0 ? `${ageYrs}y` : ageMths > 0 ? `${ageMths}mo` : ageWks > 0 ? `${ageWks}wk` : '—';
          const netBal  = p.net_balance || 0;

          if (idx % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(mg, y, pw - mg * 2, 6, 'F'); }

          pdf.setFontSize(5.8);
          pdf.setFont('helvetica', 'normal');
          const rowData = [
            { v: name.substring(0, 20),  align: 'left'  },
            { v: opd,                    align: 'left'  },
            { v: ageStr,                 align: 'right' },
            { v: dept.lab            > 0 ? Math.round(dept.lab).toLocaleString()            : '—', align: 'right', color: dept.lab            > 0 ? [217,119,6] : [100,116,139] },
            { v: dept.radiology      > 0 ? Math.round(dept.radiology).toLocaleString()      : '—', align: 'right', color: dept.radiology      > 0 ? [217,119,6] : [100,116,139] },
            { v: dept.consultation   > 0 ? Math.round(dept.consultation).toLocaleString()   : '—', align: 'right', color: dept.consultation   > 0 ? [217,119,6] : [100,116,139] },
            { v: dept.family_planning> 0 ? Math.round(dept.family_planning).toLocaleString(): '—', align: 'right', color: dept.family_planning> 0 ? [217,119,6] : [100,116,139] },
            { v: dept.services       > 0 ? Math.round(dept.services).toLocaleString()       : '—', align: 'right', color: dept.services       > 0 ? [217,119,6] : [100,116,139] },
            { v: dept.rx_treatments  > 0 ? Math.round(dept.rx_treatments).toLocaleString()  : '—', align: 'right', color: dept.rx_treatments  > 0 ? [217,119,6] : [100,116,139] },
            { v: dept.credits        > 0 ? Math.round(dept.credits).toLocaleString()        : '—', align: 'right', color: dept.credits        > 0 ? [22,101,52]  : [100,116,139] },
          ];

          let colX = mg;
          rowData.forEach((cell, ci) => {
            const c = cell.color || [30, 58, 138];
            pdf.setTextColor(...c);
            pdf.text(cell.v, cell.align === 'right' ? colX + cols[ci].w - 1 : colX + 1, y + 4.2, { align: cell.align });
            colX += cols[ci].w;
          });

          // Balance due (last col) — red if positive (owes money), green if zero/overpaid
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...(netBal > 0 ? [220, 38, 38] : [22, 101, 52]));
          pdf.text(Math.round(netBal).toLocaleString(), colX - 1, y + 4.2, { align: 'right' });

          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.1);
          pdf.line(mg, y + 6, pw - mg, y + 6);
          y += 6;
        });

        // Totals row
        checkPage(9);
        pdf.setFillColor(255, 237, 213);
        pdf.setDrawColor(217, 119, 6);
        pdf.setLineWidth(0.4);
        pdf.rect(mg, y, pw - mg * 2, 8, 'FD');
        pdf.setTextColor(10, 30, 74);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`TOTALS — ${patients.length} PATIENT(S)`, mg + 2, y + 5.5);

        const totOffsets = [0, 15, 25]; // skip patient / opd / age cols
        let totX = mg;
        cols.slice(0, 3).forEach(c => { totX += c.w; });
        const totVals = [summaryLabAmt, summaryRadiologyAmt, summaryConsultationAmt, summaryFamilyPlanAmt, summaryServicesAmt, summaryRxAmt, summaryCreditsAmt];
        totVals.forEach((v, i) => {
          const c = i === 6 ? [22, 101, 52] : [217, 119, 6];
          pdf.setTextColor(...c);
          pdf.text(v > 0 ? Math.round(v).toLocaleString() : '—', totX + cols[i + 3].w - 1, y + 5.5, { align: 'right' });
          totX += cols[i + 3].w;
        });
        pdf.setTextColor(220, 38, 38);
        pdf.text(`UGX ${Math.round(netUnpaidBalance).toLocaleString('en-US')}`, totX + cols[10].w - 1, y + 5.5, { align: 'right' });
        y += 12;
      }

      // ── Footer on every page ───────────────────────────────────────────────
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(0, ph - 11, pw, 11, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.2);
        pdf.line(0, ph - 11, pw, ph - 11);
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${safeClinic} — CONFIDENTIAL FINANCIAL REPORT — ${safeDateStr}`, mg, ph - 4);
     
      }

      const safeFileName = safeClinic.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filePeriod   = (selectedDate || selectedMonth || selectedYear || 'period').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const fileName = `Income_Statement_${safeFileName}_${filePeriod}.pdf`;
      pdf.save(fileName);
      toast.success('PDF Income Statement downloaded successfully!');

    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  // ─── INLINE DATE INPUT RENDERER ──────────────────────────────────────────────
  const renderInlineDateInput = (filterId) => {
    if (dateFilterType !== filterId) return null;
    switch (filterId) {
      case 'single': return (
        <div style={styles.inlineInputPanel}>
          <label style={styles.label}>Select Date:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={styles.inputStyle} />
        </div>
      );
      case 'range': return (
        <div style={styles.inlineInputPanel}>
          <label style={styles.label}>From:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={selectedEndDate} style={{ ...styles.inputStyle, marginBottom: '6px' }} />
          <label style={styles.label}>To:</label>
          <input type="date" value={selectedEndDate} onChange={e => setSelectedEndDate(e.target.value)} min={selectedDate} max={new Date().toISOString().split('T')[0]} style={styles.inputStyle} />
        </div>
      );
      case 'month': return (
        <div style={styles.inlineInputPanel}>
          <label style={styles.label}>Select Month:</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} max={new Date().toISOString().slice(0, 7)} style={styles.inputStyle} />
        </div>
      );
      case 'monthyear': return (
        <div style={styles.inlineInputPanel}>
          <label style={styles.label}>Month:</label>
          <select value={selectedMonthOnly} onChange={e => setSelectedMonthOnly(e.target.value)} style={{ ...styles.selectStyle, marginBottom: '6px' }}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
          </select>
          <label style={styles.label}>Year:</label>
          <select value={selectedYearForMonth} onChange={e => setSelectedYearForMonth(e.target.value)} style={styles.selectStyle}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      );
      case 'thisyear': return (
        <div style={{ ...styles.inlineInputPanel, color: theme.sidebarText, fontSize: '11px', fontWeight: '500' }}>
          Showing data for <strong>{currentYear}</strong>
        </div>
      );
      case 'year': return (
        <div style={styles.inlineInputPanel}>
          <label style={styles.label}>Select Year:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={styles.selectStyle}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      );
      default: return null;
    }
  };

  // ─── NAV SECTIONS ─────────────────────────────────────────────────────────────
  const filterItems = [
    { id: 'single',    icon: '📅', label: 'Single Date' },
    { id: 'range',     icon: '📆', label: 'Date Range' },
    { id: 'month',     icon: '🗓️', label: 'Month Picker' },
    { id: 'monthyear', icon: '📋', label: 'Month & Year' },
    { id: 'thisyear',  icon: '🌟', label: 'This Year' },
    { id: 'year',      icon: '📊', label: 'Select Year' },
  ];

  const navSections = [
    { label: 'FILTERS', items: filterItems, isFilter: true },
    { label: 'SHIFT', items: [
      { id: 'Day',   icon: '☀️', label: 'Day Shift',   action: () => setShiftType('Day') },
      { id: 'Night', icon: '🌙', label: 'Night Shift', action: () => setShiftType('Night') },
    ]},
    { label: 'VIEW', items: [
      { id: 'table', icon: '📊', label: 'Table View', action: () => setShowGraphs(false) },
      { id: 'graph', icon: '📈', label: 'Graph View', action: () => setShowGraphs(true) },
    ]},
    { label: 'ANALYTICS', items: [
      { id: 'diseaseStats', icon: '🦠', label: 'Disease Statistics', action: () => navigate(`/malariaBarGraph/?token=${urlToken}`) },
    ]},
  ];

  const isNavActive = (item) => {
    if (filterItems.find(f => f.id === item.id)) return item.id === dateFilterType;
    if (item.id === 'Day'   && shiftType === 'Day')   return true;
    if (item.id === 'Night' && shiftType === 'Night') return true;
    if (item.id === 'table' && !showGraphs) return true;
    if (item.id === 'graph' &&  showGraphs) return true;
    return false;
  };

  if (!isTokenVerified) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: theme.sidebarBg }}>
        <div style={{ textAlign: 'center', color: theme.sidebarText }}>
          <div style={{ fontSize: '16px', marginBottom: '15px', fontWeight: '500' }}>Verifying Permission...</div>
          <div style={{ width: '35px', height: '35px', border: `3px solid ${theme.sidebarBorder}`, borderTop: `3px solid ${theme.sidebarText}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  // ─── FINANCIAL REPORT TABLE (on-screen) ──────────────────────────────────────
  // Reorganised to match PDF structure: Revenue -> COGS -> Gross Profit -> Expenses -> Net Profit
  const FinancialReportTable = () => {
    const rows = [
      { label: '1. REVENUE', type: 'sectionHeader' },
      { label: 'Day Shift Sales',            value: totalDaySales,   type: 'income' },
      { label: 'Night Shift Sales',          value: totalNightSales, type: 'income' },
      { label: 'TOTAL REVENUE',              value: totalSalesCombined, type: 'totalIncome', bold: true },

      { label: '2. COST OF GOODS SOLD (COGS)', type: 'sectionHeader', note: 'COGS = purchase cost of drugs & treatments dispensed to patients' },
      { label: 'Drugs & Treatments Dispensed (at Purchase Cost)', value: totalDrugsUsed, type: 'cost' },
      { label: 'TOTAL COGS',                 value: totalDrugsUsed, type: 'totalCost', bold: true },

      { label: '3. GROSS PROFIT', type: 'sectionHeader' },
      { label: 'Gross Profit  (Total Revenue minus Total COGS)', value: grossProfit, type: grossProfit >= 0 ? 'totalIncome' : 'totalCost', bold: true },

      { label: '4. OPERATING EXPENSES', type: 'sectionHeader' },
      { label: 'Day Shift Operating Expenses',   value: totalDayExpenses,   type: 'cost' },
      { label: 'Night Shift Operating Expenses', value: totalNightExpenses, type: 'cost' },
      { label: 'TOTAL OPERATING EXPENSES',       value: totalExpensesCombined, type: 'totalCost', bold: true },

      { label: '5. NET PROFIT', type: 'sectionHeader' },
      { label: 'NET PROFIT  (Gross Profit minus Operating Expenses)', value: netProfitCombined, type: netProfitCombined >= 0 ? 'totalIncome' : 'totalCost', bold: true },

      { label: '6. INVENTORY & STOCK', type: 'sectionHeader' },
      { label: 'Opening Stock Value',             value: openingStock,   type: 'neutral', note: openingStock  == null ? 'Not yet recorded' : null },
      { label: 'Closing Stock Value',             value: closingStock,   type: 'neutral', note: closingStock  == null ? 'Not yet recorded' : null },
      { label: 'Inventory Purchases (at Cost)',   value: totalDrugsBought, type: 'neutral' },
      { label: 'Drugs Dispensed / COGS',          value: totalDrugsUsed,   type: 'cost'    },
      { label: `Net Stock Movement (${stockStatus})`, value: stockChange, type: stockChange >= 0 ? 'income' : 'cost' },

      ...(creditsData ? [
        { label: '7. OUTSTANDING PATIENT BALANCES (Accounts Receivable)', type: 'sectionHeader' },
        { label: 'Laboratory (outstanding)',        value: summaryLabAmt,          type: 'debt' },
        { label: 'Radiology / Imaging (outstanding)',value: summaryRadiologyAmt,   type: 'debt' },
        { label: 'Consultation / OPD (outstanding)',value: summaryConsultationAmt, type: 'debt' },
        { label: 'Family Planning (outstanding)',   value: summaryFamilyPlanAmt,   type: 'debt' },
        { label: 'Services (outstanding)',          value: summaryServicesAmt,     type: 'debt' },
        { label: 'Pharmacy / Treatments (outstanding)', value: summaryRxAmt,       type: 'debt' },
        { label: 'Less: Credits Applied',           value: summaryCreditsAmt,      type: 'income' },
        { label: 'TOTAL OUTSTANDING (Gross)',       value: totalUnpaidBalance,     type: 'totalDebt', bold: true },
        { label: 'NET OUTSTANDING (after Credits)', value: netUnpaidBalance,       type: 'totalDebt', bold: true },
      ] : []),
    ];

    const typeStyle = (type) => {
      switch (type) {
        case 'sectionHeader': return { background: theme.tableHeader, color: theme.textSecondary, fontWeight: '600', fontSize: '10px', letterSpacing: '0.04em' };
        case 'income':        return { color: theme.accent };
        case 'totalIncome':   return { color: theme.accent,  background: theme.accentLight,  fontWeight: '700', fontSize: '13px' };
        case 'cost':          return { color: theme.danger };
        case 'totalCost':     return { color: theme.danger,  background: theme.dangerLight,  fontWeight: '700', fontSize: '13px' };
        case 'debt':          return { color: theme.warning };
        case 'totalDebt':     return { color: theme.warning, background: theme.warningLight, fontWeight: '700', fontSize: '13px' };
        case 'neutral':       return { color: theme.info };
        default:              return {};
      }
    };

    return (
      <div style={{ ...styles.card, padding: '0', overflow: 'hidden', marginTop: '16px' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', gap: '8px', background: theme.tableHeader }}>
          <span style={{ fontSize: '18px' }}>🏦</span>
          <h3 style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: '700', margin: 0 }}>
            Income Statement — {formatDateDisplay()}
          </h3>
          <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: 'auto' }}>{safeStr(clinicName, 'Clinic')}</span>
        </div>
        {/* Glossary bar */}
        <div style={{ padding: '6px 16px', background: '#eff6ff', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: '#3730a3' }}>
          <strong>Glossary:</strong> COGS = Cost of Goods Sold (purchase cost of drugs/treatments dispensed) &nbsp;|&nbsp; Gross Profit = Revenue - COGS &nbsp;|&nbsp; Net Profit = Gross Profit - Operating Expenses &nbsp;|&nbsp; UGX = Uganda Shilling
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: theme.tableHeader }}>
              <tr>
                <th style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary, textAlign: 'left' }}>Line Item</th>
                <th style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary, textAlign: 'right' }}>Amount (UGX)</th>
                <th style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary, textAlign: 'left' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const ts = typeStyle(row.type);
                if (row.type === 'sectionHeader') {
                  return (
                    <tr key={i}>
                      <td colSpan="3" style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.tableBorder}`, ...ts }}>
                        {row.label}
                        {row.note && <span style={{ fontWeight: '400', fontSize: '9px', marginLeft: '8px', color: theme.textMuted, fontStyle: 'italic' }}>{row.note}</span>}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={i} className="table-row">
                    <td style={{ padding: '7px 16px 7px 28px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textSecondary, fontWeight: row.bold ? '700' : '500', background: ts.background }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '7px 16px', borderBottom: `1px solid ${theme.tableBorder}`, textAlign: 'right', fontWeight: row.bold ? '700' : '600', ...ts, background: ts.background }}>
                      {row.note && row.value == null
                        ? <em style={{ color: theme.textMuted, fontStyle: 'italic', fontWeight: '400', fontSize: '11px' }}>{row.note}</em>
                        : row.value == null ? '—'
                        : `${row.value < 0 ? '-' : ''}UGX ${Math.abs(Math.round(row.value)).toLocaleString('en-US')}`
                      }
                    </td>
                    <td style={{ padding: '7px 16px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMuted, fontSize: '10px', background: ts.background }}>
                      {(row.note && row.value != null) ? row.note : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── UNPAID PATIENT BILLS TABLE ───────────────────────────────────────────────
  const UnpaidBillsTable = () => {
    const patients = creditsData?.patient_balances;
    if (!Array.isArray(patients) || patients.length === 0) return null;

    return (
      <div style={{ marginTop: '16px', ...styles.card, padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.tableBorder}`, background: theme.warningLight, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <h3 style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: '700', margin: 0 }}>
            Accounts Receivable — Unpaid Patient Bills
          </h3>
          <span style={styles.badge('orange')}>{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '8px' }}>All names displayed in UPPERCASE</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ background: theme.tableHeader }}>
              <tr>
                {['PATIENT NAME','OPD NO.','AGE','PHONE','LABORATORY','RADIOLOGY','CONSULTATION','FAMILY PLANNING','SERVICES','PHARMACY / RX','CREDITS APPLIED','TOTAL BILLED','BALANCE DUE'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary, whiteSpace: 'nowrap', textAlign: ['PATIENT NAME','OPD NO.','PHONE'].includes(h) ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => {
                const name      = getPatientName(p);   // UPPERCASE enforced in helper
                const dept      = getDeptAmounts(p);
                const opd       = safeStr(p.details?.opd_no, '—');
                const phone     = safeStr(p.details?.phone_number, '—');
                const ageYrs    = p.details?.age;
                const ageMths   = p.details?.age_months;
                const ageWks    = p.details?.age_weeks;
                const age       = ageYrs > 0 ? `${ageYrs}y` : ageMths > 0 ? `${ageMths}mo` : ageWks > 0 ? `${ageWks}wk` : '—';
                const totalBill = p.total_bill  || 0;
                const netBal    = p.net_balance || 0;

                return (
                  <tr key={p.contact_id ?? i} className="table-row">
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textPrimary, whiteSpace: 'nowrap' }}>{name}</td>
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMuted, fontSize: '10px' }}>{opd}</td>
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMuted, fontSize: '10px', textAlign: 'right' }}>{age}</td>
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMuted, fontSize: '10px' }}>{phone}</td>
                    {[dept.lab, dept.radiology, dept.consultation, dept.family_planning, dept.services, dept.rx_treatments].map((v, ci) => (
                      <td key={ci} style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: v > 0 ? theme.warning : theme.textMuted, textAlign: 'right', fontWeight: v > 0 ? '600' : '400' }}>{v > 0 ? formatCurrency(v) : '—'}</td>
                    ))}
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: dept.credits > 0 ? theme.accent : theme.textMuted, textAlign: 'right', fontWeight: dept.credits > 0 ? '600' : '400' }}>{dept.credits > 0 ? formatCurrency(dept.credits) : '—'}</td>
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textSecondary, textAlign: 'right', fontWeight: '600' }}>{formatCurrency(totalBill)}</td>
                    <td style={{ padding: '7px 10px', borderBottom: `1px solid ${theme.tableBorder}`, color: netBal > 0 ? theme.danger : theme.accent, textAlign: 'right', fontWeight: '700' }}>{formatCurrency(netBal)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: theme.warningLight }}>
                <td colSpan="4" style={{ padding: '8px 10px', borderTop: `2px solid ${theme.tableBorder}`, fontWeight: '700', color: theme.textPrimary }}>TOTALS ({patients.length} patient{patients.length !== 1 ? 's' : ''})</td>
                {[summaryLabAmt, summaryRadiologyAmt, summaryConsultationAmt, summaryFamilyPlanAmt, summaryServicesAmt, summaryRxAmt].map((v, i) => (
                  <td key={i} style={{ padding: '8px 10px', borderTop: `2px solid ${theme.tableBorder}`, color: theme.warning, fontWeight: '700', textAlign: 'right' }}>{formatCurrency(v)}</td>
                ))}
                <td style={{ padding: '8px 10px', borderTop: `2px solid ${theme.tableBorder}`, color: theme.accent,  fontWeight: '700', textAlign: 'right' }}>{formatCurrency(summaryCreditsAmt)}</td>
                <td style={{ padding: '8px 10px', borderTop: `2px solid ${theme.tableBorder}`, color: theme.textPrimary, fontWeight: '700', textAlign: 'right' }}>{formatCurrency(patients.reduce((s, p) => s + (p.total_bill || 0), 0))}</td>
                <td style={{ padding: '8px 10px', borderTop: `2px solid ${theme.tableBorder}`, color: theme.danger, fontWeight: '700', textAlign: 'right' }}>{formatCurrency(netUnpaidBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: theme.pureWhite, minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${theme.tableHeader}; }
        ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.textSecondary}; }
        .nav-item:hover { background: ${theme.navHoverBg} !important; color: ${theme.activeNavText} !important; }
        .nav-item:hover .nav-icon { color: ${theme.iconHover} !important; transform: scale(1.1); }
        .table-row:hover td { background: ${theme.tableRowHover}; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        table { border-collapse: collapse; width: 100%; }
        .collapse-btn:hover { background: ${theme.collapseButtonHover} !important; transform: scale(1.05); }
        .nav-icon { color: ${theme.iconBright}; font-size: 18px; transition: all 0.2s ease; }
        .active-tab { background: ${theme.activeNavBg} !important; border-radius: 8px !important; }
        .active-tab .nav-icon { color: ${currentTheme === 'blue' ? '#ffffff' : theme.iconBright} !important; }
        .category-select { width: 140px !important; padding: 6px 8px !important; font-size: 11px !important; }
        .print-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.35) !important; }
        .print-btn:active { transform: translateY(0); }
        .disease-btn:hover { background: #7c3aed !important; }
        @media (max-width: 768px) { .category-select { width: 100px !important; } }
      `}</style>

      <Topbar token={urlToken} themeColor={currentTheme} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', marginTop: '60px' }}>
        {/* ── SIDEBAR ── */}
        <aside style={{ width: sidebarCollapsed ? '80px' : '250px', background: theme.sidebarBg, display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: `1px solid ${theme.sidebarBorder}`, position: 'fixed', top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto', boxShadow: '2px 0 8px rgba(0,0,0,0.1)', transition: 'width 0.3s ease', zIndex: 900 }}>
          <div style={{ padding: sidebarCollapsed ? '16px 8px' : '16px', borderBottom: `2px solid ${theme.sidebarBorder}`, display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', background: theme.filterSection, minHeight: sidebarCollapsed ? '100px' : '70px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, order: sidebarCollapsed ? 2 : 1, marginTop: sidebarCollapsed ? '8px' : 0 }}>
              <div style={{ width: '40px', height: '40px', background: theme.activeNavBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, color: theme.activeNavText, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}>CP</div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '15px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>MEDCORE</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '10px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Sales History</div>
                </div>
              )}
            </div>
            <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ ...styles.collapseButton, background: theme.collapseButtonBg, border: currentTheme === 'blue' ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)', color: theme.collapseButtonText, width: '38px', height: '38px', borderRadius: '8px', fontSize: '18px', order: sidebarCollapsed ? 1 : 2, marginLeft: sidebarCollapsed ? 0 : 'auto', flexShrink: 0 }} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav style={{ padding: sidebarCollapsed ? '12px 0' : '12px 10px', flex: 1 }}>
            {navSections.map(section => (
              <div key={section.label} style={{ marginBottom: '12px' }}>
                {!sidebarCollapsed && <div style={styles.sectionHeader(sidebarCollapsed)}>{section.label}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {section.items.map(item => {
                    const active = isNavActive(item);
                    const isFilterItem = !!filterItems.find(f => f.id === item.id);
                    const isDiseaseBtn = item.id === 'diseaseStats';
                    return (
                      <div key={item.id}>
                        <button
                          className={`nav-item ${active ? 'active-tab' : ''} ${isDiseaseBtn ? 'disease-btn' : ''}`}
                          onClick={() => { if (isFilterItem) { setDateFilterType(item.id); } else { item.action && item.action(); } }}
                          onMouseEnter={() => setHoveredNavItem(item.id)}
                          onMouseLeave={() => setHoveredNavItem(null)}
                          style={{ ...styles.navItem(active, sidebarCollapsed), background: isDiseaseBtn ? '#6d28d9' : active ? theme.activeNavBg : 'transparent', padding: sidebarCollapsed ? '10px 0' : '8px 12px', margin: sidebarCollapsed ? '0' : '0 0 2px 0', color: isDiseaseBtn ? '#ffffff' : active ? theme.activeNavText : theme.inactiveNavText, transition: 'all 0.2s ease' }}>
                          <span className="nav-icon" style={{ fontSize: '16px', width: '18px', textAlign: 'center', color: isDiseaseBtn ? '#ffffff' : active ? (currentTheme === 'blue' ? '#ffffff' : theme.iconBright) : theme.iconBright }}>{item.icon}</span>
                          {!sidebarCollapsed && <span style={{ fontWeight: '600', color: isDiseaseBtn ? '#ffffff' : active ? theme.activeNavText : theme.inactiveNavText }}>{item.label}</span>}
                          {sidebarCollapsed && hoveredNavItem === item.id && <div style={styles.tooltip}>{item.label}</div>}
                        </button>
                        {!sidebarCollapsed && isFilterItem && renderInlineDateInput(item.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div style={{ padding: sidebarCollapsed ? '12px 0' : '12px 16px', borderTop: `1px solid ${theme.sidebarBorder}`, background: theme.filterSection, textAlign: sidebarCollapsed ? 'center' : 'left' }}>
            {!sidebarCollapsed ? (
              <>
                <div style={{ fontSize: '10px', color: theme.sidebarTextMuted, marginBottom: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>{safeStr(clinicName, '—')}</div>
                
                <div style={{ fontSize: '9px', color: theme.sidebarTextMuted, marginTop: '4px' }}>{shiftType} Shift</div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: theme.sidebarText, fontWeight: '500', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setHoveredNavItem('user')}
                onMouseLeave={() => setHoveredNavItem(null)}>
                👤
                {hoveredNavItem === 'user' && <div style={{ ...styles.tooltip, left: '100%' }}>{safeStr(employeeName || employee, '—')} - {safeStr(clinicName, '—')} ({shiftType})</div>}
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, marginLeft: sidebarCollapsed ? '80px' : '250px', padding: '16px', background: theme.mainBg, minHeight: 'calc(100vh - 60px)', transition: 'margin-left 0.3s ease', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER BAR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 16px', background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ minWidth: '160px' }}>
              
              <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>{formatDateDisplay()}</div>
              <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={styles.badge(shiftType === 'Day' ? 'sky' : 'blue')}>{shiftType} Shift</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flex: 2, flexWrap: 'wrap' }}>
              <CompactMetricCard icon="📦" label="Opening Stock" value={openingStock != null ? formatCurrency(openingStock) : 'Not recorded'} color={theme.info} bgColor={theme.infoLight} tooltip="Stock value at start of shift" />
              <CompactMetricCard icon="🏁" label="Closing Stock" value={closingStock != null ? formatCurrency(closingStock) : 'Not yet recorded'} color={closingStock != null ? theme.accent : theme.textMuted} bgColor={closingStock != null ? theme.accentLight : theme.tableHeader} tooltip="Stock value at end of shift" />
              <CompactMetricCard icon="💰" label="Total Revenue" value={formatCurrency(totalSalesCombined)} color={theme.accent} bgColor={theme.accentLight} tooltip="Total revenue from sales" />
              <CompactMetricCard icon="📊" label="Gross Profit" value={formatCurrency(grossProfit)} color={grossProfit >= 0 ? theme.accent : theme.danger} bgColor={grossProfit >= 0 ? theme.accentLight : theme.dangerLight} tooltip="Revenue minus Cost of Goods Sold (COGS)" />
              <CompactMetricCard icon="📤" label="Operating Expenses" value={formatCurrency(totalExpensesCombined)} color={theme.danger} bgColor={theme.dangerLight} tooltip="Total operating expenses (excludes COGS)" />
              <CompactMetricCard icon="💊" label="COGS" value={formatCurrency(totalDrugsUsed)} color={theme.warning} bgColor={theme.warningLight} subValue={`Purchased: ${formatCurrency(totalDrugsBought)}`} tooltip="Cost of Goods Sold — drugs/treatments at purchase cost" />
              <CompactMetricCard icon="👥" label="Total Patients" value={formatNumber(totalPatients)} color={theme.info} bgColor={theme.infoLight} tooltip="Unique patients treated" />
              {creditsData && totalUnpaidBalance > 0 && (
                <CompactMetricCard icon="⚠️" label="Outstanding (A/R)" value={formatCurrency(totalUnpaidBalance)} color={theme.warning} bgColor={theme.warningLight} tooltip="Total outstanding patient balances (Accounts Receivable)" />
              )}
            </div>

            <div style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px', fontWeight: '500' }}>VIEW:</div>
                <div style={{ display: 'inline-flex', background: theme.tableHeader, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
                  <button onClick={() => setViewType('detailed')} style={{ padding: '6px 12px', background: viewType === 'detailed' ? theme.activeNavBg : 'transparent', color: viewType === 'detailed' ? (currentTheme === 'blue' ? '#fff' : theme.activeNavText) : theme.textPrimary, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: viewType === 'detailed' ? '600' : '500' }}>Detailed</button>
                  <button onClick={() => setViewType('category')} style={{ padding: '6px 12px', background: viewType === 'category' ? theme.activeNavBg : 'transparent', color: viewType === 'category' ? (currentTheme === 'blue' ? '#fff' : theme.activeNavText) : theme.textPrimary, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: viewType === 'category' ? '600' : '500' }}>Category</button>
                </div>
              </div>

              <button className="print-btn" onClick={handlePrintReport} disabled={isPrinting || isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: isPrinting ? 'wait' : 'pointer', background: isPrinting ? theme.textMuted : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', fontSize: '12px', fontWeight: '600', boxShadow: '0 3px 10px rgba(37,99,235,0.3)', transition: 'all 0.2s ease', opacity: isLoading ? 0.6 : 1, animation: isPrinting ? 'pulse 1.2s ease infinite' : 'none' }}
                title="Download PDF Income Statement">
                <span style={{ fontSize: '14px' }}>{isPrinting ? '⏳' : '🖨️'}</span>
                {isPrinting ? 'Generating...' : 'Print Report'}
              </button>
            </div>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
              <div style={{ width: '36px', height: '36px', border: `3px solid ${theme.tableBorder}`, borderTop: `3px solid ${theme.activeNavBg}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }}></div>
              <p style={{ fontSize: '13px' }}>Loading data...</p>
            </div>
          )}

          {showGraphs && !isLoading && (
            <div style={{ marginTop: '0', flex: 1, minHeight: 0 }}>
              <GraphComponent salesData={salesData} expensesData={expensesData} token={urlToken} showAllMonths={true} includeCurrentMonth={true} />
            </div>
          )}

          {!showGraphs && !isLoading && (
            <>
              {viewType === 'detailed' && (
                <div style={{ display: 'flex', gap: '16px', height: '450px', minHeight: 0 }}>
                  {/* Sales Table */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><span>💰</span> REVENUE / SALES</h3>
                      <select value={selectedSalesCategory} onChange={e => setSelectedSalesCategory(e.target.value)} className="category-select"
                        style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${theme.cardBorder}`, fontSize: '10px', color: theme.textPrimary, background: theme.cardBg, outline: 'none', cursor: 'pointer', width: '130px' }}>
                        <option value="All">All Categories</option>
                        {salesCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead style={{ background: theme.tableHeader, position: 'sticky', top: 0, zIndex: 10 }}>
                          <tr>{['Date','Time','Amount (UGX)','Description','Category','Recorded By'].map(h => (
                            <th key={h} style={{ padding: '8px 6px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {filteredSales.filter(s => s.Amount > 0).map((s, i) => {
                            const { date, time } = formatDateTime(s.CreatedAt);
                            return (
                              <tr key={i} className="table-row">
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{date}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{time}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.accent, fontSize: '10px', fontWeight: '600' }}>{formatCurrency(s.Amount)}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{safeStr(s.Reason, '—').substring(0, 25)}{(s.Reason || '').length > 25 ? '...' : ''}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}><span style={styles.badge('gray')}>{s.Category}</span></td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{safeStr(s.ServedBy, 'N/A')}</td>
                              </tr>
                            );
                          })}
                          {filteredSales.filter(s => s.Amount > 0).length === 0 && (
                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: theme.textMuted }}>No sales data for this period</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expenses Table */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.tableBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📤</span> OPERATING EXPENSES</h3>
                      <select value={selectedExpensesCategory} onChange={e => setSelectedExpensesCategory(e.target.value)} className="category-select"
                        style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${theme.cardBorder}`, fontSize: '10px', color: theme.textPrimary, background: theme.cardBg, outline: 'none', cursor: 'pointer', width: '130px' }}>
                        <option value="All">All Categories</option>
                        {expensesCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead style={{ background: theme.tableHeader, position: 'sticky', top: 0, zIndex: 10 }}>
                          <tr>{['Date','Time','Amount (UGX)','Description','Category','Recorded By'].map(h => (
                            <th key={h} style={{ padding: '8px 6px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.filter(e => e.Amount > 0).map((e, i) => {
                            const { date, time } = formatDateTime(e.created_at);
                            return (
                              <tr key={i} className="table-row">
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{date}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{time}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.danger, fontSize: '10px', fontWeight: '600' }}>{formatCurrency(e.Amount)}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{safeStr(e.Details, '—').substring(0, 25)}{(e.Details || '').length > 25 ? '...' : ''}</td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}><span style={styles.badge('gray')}>{e.category}</span></td>
                                <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{safeStr(e.ServedBy, 'N/A')}</td>
                              </tr>
                            );
                          })}
                          {filteredExpenses.filter(e => e.Amount > 0).length === 0 && (
                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: theme.textMuted }}>No expenses data for this period</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {viewType === 'category' && (
                <div style={{ height: '450px', minHeight: 0 }}>
                  <div style={{ ...styles.card, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ color: theme.textPrimary, marginBottom: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
                      CATEGORY SUMMARY — {shiftType} Shift · {formatDateDisplay()}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ color: theme.textPrimary, marginBottom: '8px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>💰</span> REVENUE BY CATEGORY</h4>
                        <div style={{ flex: 1, overflow: 'auto', background: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead style={{ background: theme.tableHeader, position: 'sticky', top: 0 }}>
                              <tr>
                                <th style={{ padding: '8px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>Category</th>
                                <th style={{ padding: '8px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>Amount (UGX)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesCategoryTotals.filter(c => c.salesTotal > 0).map((c, i) => (
                                <tr key={i} className="table-row">
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{c.cat}</td>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.accent, fontSize: '10px', fontWeight: '600' }}>{formatCurrency(c.salesTotal)}</td>
                                </tr>
                              ))}
                              {totalSales > 0 && (
                                <tr style={{ background: theme.tableHeader }}>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', fontWeight: '700', color: theme.textPrimary }}>TOTAL REVENUE</td>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.accent, fontSize: '10px', fontWeight: '700' }}>{formatCurrency(totalSales)}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ color: theme.textPrimary, marginBottom: '8px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📤</span> OPERATING EXPENSES BY CATEGORY</h4>
                        <div style={{ flex: 1, overflow: 'auto', background: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead style={{ background: theme.tableHeader, position: 'sticky', top: 0 }}>
                              <tr>
                                <th style={{ padding: '8px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>Category</th>
                                <th style={{ padding: '8px', borderBottom: `1px solid ${theme.tableBorder}`, fontWeight: '600', color: theme.textSecondary }}>Amount (UGX)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expensesCategoryTotals.filter(c => c.expensesTotal > 0).map((c, i) => (
                                <tr key={i} className="table-row">
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', color: theme.textSecondary }}>{c.cat}</td>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.danger, fontSize: '10px', fontWeight: '600' }}>{formatCurrency(c.expensesTotal)}</td>
                                </tr>
                              ))}
                              {totalExpenses > 0 && (
                                <tr style={{ background: theme.tableHeader }}>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, fontSize: '10px', fontWeight: '700', color: theme.textPrimary }}>TOTAL EXPENSES</td>
                                  <td style={{ padding: '6px', borderBottom: `1px solid ${theme.tableBorder}`, color: theme.danger, fontSize: '10px', fontWeight: '700' }}>{formatCurrency(totalExpenses)}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── COMBINED SUMMARY ── */}
              <div style={{ marginTop: '16px', ...styles.card, padding: '16px' }}>
                <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', color: theme.textPrimary, fontSize: '16px', fontWeight: '600' }}>COMBINED SUMMARY — BOTH SHIFTS</h3>

                {(openingStock != null || closingStock != null) && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px', padding: '10px', background: theme.infoLight, borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>📦 Opening Stock</div>
                      <div style={{ fontSize: '13px', color: theme.info, fontWeight: '600' }}>{openingStock != null ? formatCurrency(openingStock) : <em style={{ fontSize: '11px', color: theme.textMuted }}>Not recorded</em>}</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>🏁 Closing Stock</div>
                      <div style={{ fontSize: '13px', color: closingStock != null ? theme.accent : theme.textMuted, fontWeight: '600' }}>{closingStock != null ? formatCurrency(closingStock) : <em style={{ fontSize: '11px', color: theme.textMuted }}>Not yet recorded</em>}</div>
                    </div>
                    {openingStock != null && closingStock != null && (
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>📊 Physical Stock Movement</div>
                        <div style={{ fontSize: '13px', color: (closingStock - openingStock) >= 0 ? theme.accent : theme.danger, fontWeight: '600' }}>{closingStock - openingStock >= 0 ? '+' : ''}{formatCurrency(closingStock - openingStock)}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Day Revenue</div><div style={{ fontSize: '13px', color: theme.accent, fontWeight: '600' }}>{formatCurrency(totalDaySales)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Night Revenue</div><div style={{ fontSize: '13px', color: theme.accent, fontWeight: '600' }}>{formatCurrency(totalNightSales)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Day Expenses</div><div style={{ fontSize: '13px', color: theme.danger, fontWeight: '600' }}>{formatCurrency(totalDayExpenses)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Night Expenses</div><div style={{ fontSize: '13px', color: theme.danger, fontWeight: '600' }}>{formatCurrency(totalNightExpenses)}</div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: `1px solid ${theme.tableBorder}` }}>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Total Revenue</div><div style={{ fontSize: '15px', color: theme.accent, fontWeight: '700' }}>{formatCurrency(totalSalesCombined)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>COGS</div><div style={{ fontSize: '15px', color: theme.warning, fontWeight: '700' }}>{formatCurrency(totalDrugsUsed)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Gross Profit</div><div style={{ fontSize: '15px', color: grossProfit >= 0 ? theme.accent : theme.danger, fontWeight: '700' }}>{formatCurrency(grossProfit)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Oper. Expenses</div><div style={{ fontSize: '15px', color: theme.danger, fontWeight: '700' }}>{formatCurrency(totalExpensesCombined)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Net Profit</div><div style={{ fontSize: '15px', color: netProfitCombined >= 0 ? theme.accent : theme.danger, fontWeight: '700' }}>{formatCurrency(netProfitCombined)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Total Patients</div><div style={{ fontSize: '15px', color: theme.info, fontWeight: '700' }}>{formatNumber(totalPatients)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Inventory Purchased</div><div style={{ fontSize: '15px', color: theme.info, fontWeight: '700' }}>{formatCurrency(totalDrugsBought)}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Stock Movement</div><div style={{ fontSize: '15px', color: stockChange >= 0 ? theme.accent : theme.danger, fontWeight: '700' }}>{stockChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stockChange))}</div></div>
                  {creditsData && (
                    <div style={{ textAlign: 'center' }}><div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: '500' }}>Outstanding (A/R)</div><div style={{ fontSize: '15px', color: theme.warning, fontWeight: '700' }}>{formatCurrency(totalUnpaidBalance)}</div></div>
                  )}
                </div>

                <div style={{ marginTop: '12px', padding: '12px', background: theme.infoLight, borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, fontSize: '11px' }}>
                  <h4 style={{ color: theme.textPrimary, fontWeight: '600', marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📊</span> Performance Indicators</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
                    <div style={{ color: theme.textSecondary }}>• Gross Profit Margin: {totalSalesCombined > 0 ? `${((grossProfit / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Net Profit Margin: {totalSalesCombined > 0 ? `${((netProfitCombined / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• COGS as % of Revenue: {totalSalesCombined > 0 ? `${((totalDrugsUsed / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Operating Expense Ratio: {totalSalesCombined > 0 ? `${((totalExpensesCombined / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Revenue per Patient: {totalPatients > 0 ? formatCurrency(totalSalesCombined / totalPatients) : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Day Revenue Share: {totalSalesCombined > 0 ? `${((totalDaySales / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Night Revenue Share: {totalSalesCombined > 0 ? `${((totalNightSales / totalSalesCombined) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div style={{ color: theme.textSecondary }}>• Inventory Turnover Rate: {totalDrugsBought > 0 ? `${((totalDrugsUsed / totalDrugsBought) * 100).toFixed(1)}%` : 'N/A'}</div>
                    {creditsData && totalUnpaidBalance > 0 && (
                      <div style={{ color: theme.warning }}>• Outstanding (Gross / Net): {formatCurrency(totalUnpaidBalance)} / {formatCurrency(netUnpaidBalance)}</div>
                    )}
                    {openingStock != null && closingStock != null && (
                      <div style={{ color: theme.info }}>• Physical Stock Movement: {closingStock >= openingStock ? '+' : ''}{formatCurrency(closingStock - openingStock)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── INCOME STATEMENT TABLE ── */}
              <FinancialReportTable />

              {/* ── UNPAID PATIENT BILLS TABLE ── */}
              <UnpaidBillsTable />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default SalesDetails;
