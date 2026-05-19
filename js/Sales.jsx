import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, urls } from './config.dev';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Topbar from './Topbar';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MOBILE_BREAKPOINT = 768;

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= MOBILE_BREAKPOINT ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

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
    info: '#2563eb',
    infoLight: '#eff6ff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    headerBg: '#ffffff',
    tableHeader: '#f1f5f9',
    tableRowHover: '#f8fafc',
    tableBorder: '#e2e8f0',
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeGray: { bg: '#f1f5f9', text: '#475569' },
    modalOverlay: 'rgba(0,0,0,0.5)',
    modalBg: '#ffffff',
    iconBright: '#fbbf24',
    collapseButtonBg: '#1e3a8a',
    collapseButtonHover: '#2563eb',
    collapseButtonText: '#ffffff',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    filterSection: '#0d2257',
  },
  white: {
    sidebarBg: '#ffffff',
    sidebarBorder: '#e2e8f0',
    activeNavBg: '#f1f5f9',
    activeNavText: '#0f172a',
    inactiveNavText: '#334155',
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
    info: '#2563eb',
    infoLight: '#eff6ff',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    headerBg: '#ffffff',
    tableHeader: '#f8fafc',
    tableRowHover: '#f1f5f9',
    tableBorder: '#e2e8f0',
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeGray: { bg: '#f1f5f9', text: '#334155' },
    modalOverlay: 'rgba(0,0,0,0.3)',
    modalBg: '#ffffff',
    iconBright: '#f59e0b',
    collapseButtonBg: '#f1f5f9',
    collapseButtonHover: '#e2e8f0',
    collapseButtonText: '#0f172a',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    filterSection: '#f8fafc',
  },
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = ({ theme, isMobile, currentTheme }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${isMobile ? "'DM Sans'" : "'Inter'"}, -apple-system, BlinkMacSystemFont, sans-serif;
      ${isMobile ? 'background: #ffffff !important;' : ''}
    }

    ${isMobile ? `
      html, body { background: #ffffff !important; }
      #root, #root > div { padding-top: 0 !important; margin-top: 0 !important; }
    ` : ''}

    ::-webkit-scrollbar { width: ${isMobile ? '3px' : '6px'}; height: ${isMobile ? '3px' : '6px'}; }
    ::-webkit-scrollbar-track { background: ${currentTheme === 'blue' ? '#1e293b' : '#f1f5f9'}; }
    ::-webkit-scrollbar-thumb { background: ${currentTheme === 'blue' ? '#475569' : '#cbd5e1'}; border-radius: 4px; }

    /* ── Desktop-only ── */
    ${!isMobile ? `
      .nav-item:hover { background: ${theme.navHoverBg} !important; }
      .table-row:hover td { background: ${theme.tableRowHover}; }
      .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .collapse-btn:hover { background: ${theme.collapseButtonHover} !important; transform: scale(1.05); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeIn 0.3s ease; }
      table { border-collapse: collapse; width: 100%; }
      th:last-child, td:last-child { border-right: none; }
    ` : ''}

    /* ── Mobile-only ── */
    ${isMobile ? `
      @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0% { box-shadow: 0 4px 12px rgba(220,38,38,0.4); } 50% { box-shadow: 0 4px 24px rgba(220,38,38,0.65); } 100% { box-shadow: 0 4px 12px rgba(220,38,38,0.4); } }

      /* Mobile nav drawer */
      .mob-nav-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); z-index:1000; animation: overlayFadeIn 0.2s ease; }
      .mob-nav-drawer { position: fixed; top:0; right:0; bottom:0; width:280px; background:#fff; box-shadow:-4px 0 20px rgba(0,0,0,0.15); display:flex; flex-direction:column; animation: slideInRight 0.25s cubic-bezier(0.2,0.9,0.4,1.1); z-index:1001; }
      .mob-nav-drawer.closing { animation: slideOutRight 0.2s ease forwards; }
      .mob-nav-item { display:flex; align-items:center; gap:14px; padding:14px 20px; color:#0f172a; text-decoration:none; font-size:16px; font-weight:500; transition:background 0.15s; border-left:3px solid transparent; cursor:pointer; background:none; border-top:none; border-right:none; border-bottom:none; width:100%; text-align:left; }
      .mob-nav-item:active { background:#f1f5f9; }
      .mob-nav-item.active { border-left-color:#2563eb; background:#eff6ff; color:#2563eb; }

      /* Mobile cards / list items */
      .mob-sale-item { background:#fff; margin:6px 12px; padding:14px; border-radius:14px; border:1.5px solid #f1f5f9; box-shadow:0 1px 4px rgba(0,0,0,0.04); animation: fadeInUp 0.25s ease both; }
      .mob-sale-item:active { transform:scale(0.985); }

      /* Bottom sheet / tab bar */
      .mob-tab-bar { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid #f1f5f9; display:flex; z-index:200; box-shadow:0 -2px 12px rgba(0,0,0,0.08); }
      .mob-tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px 4px 12px; font-size:10px; font-weight:600; color:#94a3b8; cursor:pointer; background:none; border:none; gap:4px; transition:color 0.15s; }
      .mob-tab.active { color:#2563eb; }
      .mob-tab-icon { font-size:20px; }

      /* Add-entry sheet */
      .mob-add-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.5); backdrop-filter:blur(4px); display:flex; align-items:flex-end; z-index:600; animation: overlayFadeIn 0.2s ease; }
      .mob-add-sheet { background:#fff; border-radius:24px 24px 0 0; padding:22px 20px 36px; width:100%; max-height:85vh; overflow-y:auto; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      .mob-add-handle { width:36px; height:4px; background:#e2e8f0; border-radius:2px; margin:0 auto 18px; }

      /* Stats strip */
      .mob-stats-strip { display:flex; gap:8px; padding:10px 12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
      .mob-stats-strip::-webkit-scrollbar { display:none; }
      .mob-stat-card { background:#fff; border:1.5px solid #f1f5f9; border-radius:14px; padding:12px 16px; min-width:110px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.04); }

      /* Close shift FAB */
      .mob-close-fab { position:fixed; bottom:70px; left:16px; background:#dc2626; color:#fff; border:none; border-radius:16px; padding:12px 18px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px; cursor:pointer; z-index:150; animation: pulse 2.5s infinite; box-shadow:0 4px 16px rgba(220,38,38,0.4); }

      /* Modal mobile */
      .mob-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; animation: overlayFadeIn 0.2s ease; }
      .mob-modal-card { background:#fff; border-radius:22px; padding:24px 20px; width:100%; max-width:400px; animation: slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1); max-height:85vh; overflow-y:auto; }

      /* Input fields mobile */
      .mob-input { width:100%; padding:13px 14px; border-radius:12px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:15px; color:#0f172a; outline:none; transition:border-color 0.15s, background 0.15s; }
      .mob-input:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
      .mob-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; margin-bottom:6px; display:block; }
      .mob-select { width:100%; padding:13px 14px; border-radius:12px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:15px; color:#0f172a; outline:none; -webkit-appearance:none; }
      .mob-btn-primary { width:100%; padding:15px; border-radius:14px; background:#2563eb; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; transition:background 0.15s, transform 0.1s; }
      .mob-btn-primary:active { transform:scale(0.98); background:#1d4ed8; }
      .mob-btn-danger { background:#dc2626; }
      .mob-btn-danger:active { background:#b91c1c; }
      .mob-btn-secondary { background:#f1f5f9; color:#0f172a; }
      .mob-btn-secondary:active { background:#e2e8f0; }
    ` : ''}
  `}</style>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const Sales = () => {
  const navigate = useNavigate();

  // ── Core state ──
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('blue');

  // ── User / shift ──
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [employee, setEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftDate, setShiftDate] = useState(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [hasSalesHistoryAccess, setHasSalesHistoryAccess] = useState(false);

  // ── Data ──
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [cashAtHand, setCashAtHand] = useState(0);

  // ── Forms ──
  const [newSale, setNewSale] = useState({ amount: 0, reason: '', category: '' });
  const [newExpense, setNewExpense] = useState({ amount: 0, details: '', takenBy: '', category: '' });
  const [comments, setComments] = useState('');
  const [fetchedSalesCategories, setFetchedSalesCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // ── Actions ──
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  // ── Desktop UI ──
  const [activeView, setActiveView] = useState('sales');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [showCloseShiftPrompt, setShowCloseShiftPrompt] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // ── Mobile UI ──
  const [mobileTab, setMobileTab] = useState('sales'); // 'sales' | 'expenses' | 'summary'
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [closingMenu, setClosingMenu] = useState(false);
  const [showAddSaleSheet, setShowAddSaleSheet] = useState(false);
  const [showAddExpenseSheet, setShowAddExpenseSheet] = useState(false);
  const [showMobileCloseConfirm, setShowMobileCloseConfirm] = useState(false);
  const [showMobileCommentsModal, setShowMobileCommentsModal] = useState(false);

  // ── Filters ──
  const [filterType, setFilterType] = useState('servedBy');
  const [selectedServedByFilters, setSelectedServedByFilters] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [availableServedBy, setAvailableServedBy] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [expenseFilterType, setExpenseFilterType] = useState('takenBy');
  const [selectedExpenseTakenByFilters, setSelectedExpenseTakenByFilters] = useState([]);
  const [selectedExpenseCategoryFilters, setSelectedExpenseCategoryFilters] = useState([]);
  const [availableExpenseTakenBy, setAvailableExpenseTakenBy] = useState([]);
  const [availableExpenseCategories, setAvailableExpenseCategories] = useState([]);

  // ── Shift close animation ──
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [whatsappError, setWhatsappError] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');

  const messages = [
    "Calculating employee performances...",
    "Awarding employee points...",
    "Setting patient appointments...",
    "Sending feedback requests to patients...",
    "Writing SMS for Upcoming Birthdays...",
    "Setting family planning return dates...",
    "Collecting sales data...",
    "Calculating total expenses...",
    "Collecting shift comments...",
    "SMSing the shift report to Administrator...",
    "Thank you, goodbye...",
  ];

  const hardcodedSalesCategories = [
    'treatment', 'maternity', 'radiology', 'lab',
    'Pharmacy Sales', 'Consultation', 'major surgery',
    'minor surgery', 'dental', 'non-categorized',
  ];

  // ── Mobile detection ──
  useEffect(() => {
    const check = () => setIsMobile(isMobileDevice());
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Meta theme-color for mobile ──
  useEffect(() => {
    if (!isMobile) return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = '#ffffff';
  }, [isMobile]);

  // ── WhatsApp message cycling ──
  useEffect(() => {
    if (!isSendingWhatsApp) return;
    const id = setInterval(() => {
      setMessageIndex(i => (i < messages.length - 1 ? i + 1 : i));
    }, 4000);
    return () => clearInterval(id);
  }, [isSendingWhatsApp]);

  // ── Initialization ──
  useEffect(() => {
    const init = async () => {
      if (!tokenFromUrl) { navigate('/login'); return; }
      try {
        const secRes = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (!secRes.ok) { navigate('/login'); return; }
        const secData = await secRes.json();
        if (secData.message !== 'Session valid') {
          if (secData.error === 'Session expired') navigate(`/dashboard?token=${secData.clinic_session_token}`);
          else navigate('/login');
          return;
        }

        setEmployeeName(secData.employee_name);
        setClinicName(secData.clinic);
        setEmployee(secData.employee_name);

        const tc = secData.colour || '';
        setCurrentTheme(!tc || tc.toLowerCase() === 'white' || tc.toLowerCase() === 'null' ? 'white' : 'blue');

        // Shift
        const shiftRes = await fetch(urls.checkshift, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (shiftRes.ok) {
          const sd = await shiftRes.json();
          if (sd.shiftType) { setSelectedShift(sd.shiftType); setShiftDate(sd.shiftDate); }
        }

        // Permissions
        const permRes = await fetch(urls.fetchpermissions, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (permRes.ok) {
          const pd = await permRes.json();
          setUserPermissions(pd.permissions || []);
          setHasSalesHistoryAccess((pd.permissions || []).includes('access-sales-details'));
        }

        // Categories
        const catRes = await fetch(urls.fetchcategories, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        if (catRes.ok) {
          const cd = await catRes.json();
          if (cd.success) {
            setFetchedSalesCategories(cd.categories.filter(c => c.type === 'sales').map(c => c.category_name));
            setExpenseCategories([...cd.categories.filter(c => c.type === 'expense').map(c => c.category_name), 'non-categorized']);
          }
        }
      } catch (e) {
        console.error(e);
        navigate('/login');
      } finally {
        setIsValidating(false);
        setIsLoading(false);
      }
    };
    init();
  }, [tokenFromUrl, navigate]);

  // ── Fetch loop ──
  useEffect(() => {
    if (!selectedShift || !shiftDate) return;
    fetchSalesData();
    fetchExpensesData();
    const id = setInterval(() => { fetchSalesData(); fetchExpensesData(); }, 15000);
    return () => clearInterval(id);
  }, [selectedShift, shiftDate]);

  // ── Totals ──
  useEffect(() => {
    const fs = getFilteredSales();
    const st = fs.reduce((s, x) => s + Math.round(parseFloat(x.amount)), 0);
    setTotalSales(st);
    const fe = getFilteredExpenses();
    const et = fe.reduce((s, x) => s + Math.round(parseFloat(x.amount)), 0);
    setTotalExpenses(et);
    setCashAtHand(st - et);
  }, [salesData, expensesData, selectedServedByFilters, selectedCategoryFilters, filterType, selectedExpenseTakenByFilters, selectedExpenseCategoryFilters, expenseFilterType]);

  // ── Filter options ──
  useEffect(() => {
    setAvailableServedBy([...new Set(salesData.map(s => s.servedBy))].filter(Boolean));
    setAvailableCategories([...new Set(salesData.map(s => s.category || 'non-categorized'))].filter(Boolean));
  }, [salesData]);

  useEffect(() => {
    setAvailableExpenseTakenBy([...new Set(expensesData.map(e => e.takenBy))].filter(Boolean));
    setAvailableExpenseCategories([...new Set(expensesData.map(e => e.category || 'non-categorized'))].filter(Boolean));
  }, [expensesData]);

  // ── Formatted date ──
  useEffect(() => {
    if (!shiftDate) return;
    setFormattedDate(new Intl.DateTimeFormat('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Kampala' }).format(new Date(shiftDate)));
  }, [shiftDate]);

  // ── Data fetchers ──
  const fetchSalesData = async () => {
    try {
      const res = await fetch(`${API_URL}/fetchsales.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: shiftDate, shift: selectedShift, token: tokenFromUrl }),
      });
      if (res.ok) {
        const d = await res.json();
        setSalesData(d.map(s => ({ amount: Math.round(parseFloat(s.Amount)), reason: s.Reason, servedBy: s.ServedBy, category: s.Category || 'non-categorized', id: s.SaleID })));
      }
    } catch (e) { toast.error('Failed to fetch sales data'); }
  };

  const fetchExpensesData = async () => {
    try {
      const res = await fetch(`${API_URL}/fetchexpenses.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: shiftDate, shift: selectedShift, token: tokenFromUrl }),
      });
      if (res.ok) {
        const d = await res.json();
        setExpensesData(d.map(e => ({ amount: Math.round(parseFloat(e.Amount)), details: e.Details, takenBy: e.TakenBy, servedBy: e.ServedBy, category: e.category || 'non-categorized', id: e.ExpenseID })));
      }
    } catch (e) { toast.error('Failed to fetch expenses data'); }
  };

  // ── Filters ──
  const getFilteredSales = () => {
    let f = salesData;
    if (filterType === 'servedBy' && selectedServedByFilters.length > 0) f = f.filter(s => selectedServedByFilters.includes(s.servedBy));
    if (filterType === 'category' && selectedCategoryFilters.length > 0) f = f.filter(s => selectedCategoryFilters.includes(s.category || 'non-categorized'));
    return f;
  };
  const getFilteredExpenses = () => {
    let f = expensesData;
    if (expenseFilterType === 'takenBy' && selectedExpenseTakenByFilters.length > 0) f = f.filter(e => selectedExpenseTakenByFilters.includes(e.takenBy));
    if (expenseFilterType === 'category' && selectedExpenseCategoryFilters.length > 0) f = f.filter(e => selectedExpenseCategoryFilters.includes(e.category || 'non-categorized'));
    return f;
  };

  // ── Action handlers ──
  const handleAddSale = async () => {
    setIsAddingSale(true);
    try {
      if (!newSale.amount || !newSale.reason || !newSale.category) { toast.error('All fields must be filled out'); return; }
      const res = await fetch(urls.sales, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parseFloat(newSale.amount)), reason: newSale.reason, category: newSale.category, servedBy: employee, shift: selectedShift, date: new Date().toISOString().split('T')[0], token: tokenFromUrl }),
      });
      if (res.ok) {
        setNewSale({ amount: 0, reason: '', category: '' });
        await fetchSalesData();
        toast.success('Sale added successfully!');
        setShowAddSaleSheet(false);
      } else toast.error('Failed to add sale');
    } catch (e) { toast.error(`Error: ${e.message}`); }
    finally { setIsAddingSale(false); }
  };

  const handleAddExpense = async () => {
    setIsAddingExpense(true);
    try {
      if (!newExpense.amount || !newExpense.details || !newExpense.takenBy || !newExpense.category) { toast.error('All fields must be filled out'); return; }
      const res = await fetch(urls.expenses, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parseFloat(newExpense.amount)), details: newExpense.details, takenBy: newExpense.takenBy, servedBy: employee, category: newExpense.category, shift: selectedShift, date: new Date().toISOString().split('T')[0], token: tokenFromUrl }),
      });
      if (res.ok) {
        setNewExpense({ amount: 0, details: '', takenBy: '', category: '' });
        await fetchExpensesData();
        toast.success('Expense added successfully!');
        setShowAddExpenseSheet(false);
      } else toast.error('Failed to add expense');
    } catch (e) { toast.error(`Error: ${e.message}`); }
    finally { setIsAddingExpense(false); }
  };

  const handleDeleteSale = async (id) => {
    setDeletingSaleId(id);
    const item = salesData.find(s => s.id === id);
    if (!item) { setDeletingSaleId(null); return; }
    try {
      const res = await fetch(urls.deletesale, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: item.amount, reason: item.reason, category: item.category, servedBy: item.servedBy, shift: selectedShift, date: new Date().toISOString().split('T')[0], token: tokenFromUrl }),
      });
      if (res.ok) { setSalesData(p => p.filter(s => s.id !== id)); toast.success('Sale deleted'); }
      else {
        const err = await res.json();
        if (err.error?.includes('not authorized')) toast.error(`Not authorized. ${err.error.split('Please contact:')[1]?.trim() || ''}`, { autoClose: 60000 });
        else toast.error('Failed to delete sale');
      }
    } catch (e) { toast.error(`Error: ${e.message}`); }
    finally { setDeletingSaleId(null); }
  };

  const handleDeleteExpense = async (id) => {
    setDeletingExpenseId(id);
    const item = expensesData.find(e => e.id === id);
    if (!item) { setDeletingExpenseId(null); return; }
    try {
      const res = await fetch(urls.deleteexpense, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: item.amount, details: item.details, takenBy: item.takenBy, servedBy: item.servedBy, category: item.category, shift: selectedShift, date: new Date().toISOString().split('T')[0], token: tokenFromUrl }),
      });
      if (res.ok) { setExpensesData(p => p.filter(e => e.id !== id)); toast.success('Expense deleted'); }
      else toast.error('Failed to delete expense');
    } catch (e) { toast.error(`Error: ${e.message}`); }
    finally { setDeletingExpenseId(null); }
  };

  const handleSalesHistoryClick = () => {
    if (hasSalesHistoryAccess) navigate(`/access-sales-details/?token=${tokenFromUrl}`);
    else toast.error('Unauthorized. Please talk to the administrator.');
  };

  const handleCloseShiftConfirm = () => {
    if (isMobile) { setShowMobileCloseConfirm(false); setShowMobileCommentsModal(true); }
    else { setShowCloseShiftPrompt(false); setShowCommentsModal(true); }
  };

  const handleCommentsSubmit = async () => {
    if (!comments.trim()) { toast.error('Please enter comments before closing the shift.'); return; }
    setShowCommentsModal(false);
    setShowMobileCommentsModal(false);
    await performCloseShift();
  };

  const performCloseShift = async () => {
    setIsClosingShift(true);
    setWhatsappError(null);
    setAnimationProgress(0);
    setCompletedSteps([]);
    setShowSuccessAnimation(false);

    try {
      const salesByCategory = {};
      getFilteredSales().forEach(s => { const c = s.category || 'non-categorized'; salesByCategory[c] = (salesByCategory[c] || 0) + s.amount; });
      const expensesByCategory = {};
      getFilteredExpenses().forEach(e => { const c = e.category || 'non-categorized'; expensesByCategory[c] = (expensesByCategory[c] || 0) + e.amount; });

      const payload = { comments, shift: selectedShift, shiftDate, employee, token: tokenFromUrl, totalSales, totalExpenses, salesByCategory, expensesByCategory, cashAtHand };

      const pInterval = setInterval(() => setAnimationProgress(p => p >= 100 ? (clearInterval(pInterval), 100) : p + 1), 150);

      const closeRes = await fetch(urls.closeshift, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!closeRes.ok) throw new Error('Shift close failed');
      setCompletedSteps(p => [...p, 'shift_closed']);

      setIsSendingWhatsApp(true);
      setMessageIndex(0);

      const adminRes = await fetch(urls.whatsappAdmin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!adminRes.ok) setWhatsappError('WhatsApp message not sent to Admin.');
      else {
        setCompletedSteps(p => [...p, 'admin_notified']);
        const adminData = await adminRes.json();
        const beemRes = await fetch(urls.whatsappBeem, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, adminResponse: adminData }) });
        if (beemRes.ok) {
          const bd = await beemRes.json();
          if (bd.success) { setCompletedSteps(p => [...p, 'beem_notified']); toast.success('Shift report forwarded to administrators.'); }
          else { setWhatsappError('Admin has not received the SMS. Please contact support.'); toast.error('Admin has not received the SMS. Please contact support.'); }
        }
      }

      clearInterval(pInterval);
      setAnimationProgress(100);
      setShowSuccessAnimation(true);
      setTimeout(() => { setIsClosingShift(false); setIsSendingWhatsApp(false); navigate('/'); }, 3000);
    } catch (e) {
      console.error(e);
      toast.error('Failed to close shift');
      setIsClosingShift(false);
    }
  };

  const formatCurrency = (v) => `UGX ${Math.round(parseFloat(v) || 0).toLocaleString('en-UG')}`;
  const formatNumber = (v) => Math.round(parseFloat(v) || 0).toLocaleString('en-UG');
  const allSalesCategories = [...new Set([...hardcodedSalesCategories, ...fetchedSalesCategories])];
  const theme = colors[currentTheme];

  // ── Mobile nav helpers ──
  const openMobileMenu = () => { setShowMobileMenu(true); setClosingMenu(false); };
  const closeMobileMenu = () => { setClosingMenu(true); setTimeout(() => { setShowMobileMenu(false); setClosingMenu(false); }, 200); };

  // ─────────────────────────────────────────────────────────────────────────────
  // SHARED: Shift-close animation overlay
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCloseAnimation = () => (
    <div style={{ position: 'fixed', inset: 0, background: currentTheme === 'blue' ? 'rgba(10,30,74,0.96)' : 'rgba(255,255,255,0.96)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(6px)', gap: '24px' }}>
      {/* Progress bar */}
      <div style={{ width: '80%', maxWidth: 480, height: 8, background: currentTheme === 'blue' ? '#1e293b' : '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${animationProgress}%`, height: '100%', background: '#34b7f1', borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      {/* Icon */}
      <div style={{ position: 'relative', width: 100, height: 100, background: '#34b7f1', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700 }}>
        SMS
        {showSuccessAnimation && (
          <div style={{ position: 'absolute', top: -10, right: -10, background: '#25D366', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</div>
        )}
      </div>
      {/* Message */}
      <p style={{ fontSize: 16, fontWeight: 700, color: '#34b7f1', textAlign: 'center', maxWidth: 320, padding: '0 16px' }}>{messages[messageIndex]}</p>
      {/* Steps */}
      <div style={{ display: 'flex', gap: 24 }}>
        {[['shift_closed', 'Shift Closed'], ['admin_notified', 'Admin SMS'], ['beem_notified', 'SMS Sent']].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: completedSteps.includes(key) ? '#34b7f1' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {completedSteps.includes(key) ? '✓' : ''}
            </div>
            <span style={{ fontSize: 11, color: currentTheme === 'blue' ? '#94a3b8' : '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>
      {!showSuccessAnimation && (
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#34b7f1', animation: `bounce 1s infinite alternate ${d}s` }} />
          ))}
        </div>
      )}
      {showSuccessAnimation && (
        <div style={{ padding: '12px 28px', background: '#34b7f1', color: '#fff', borderRadius: 25, fontWeight: 700, fontSize: 16 }}>Shift Closed Successfully!</div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMobile = () => {
    const filteredSales = getFilteredSales();
    const filteredExpenses = getFilteredExpenses();

    return (
      <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

        {/* ── MOBILE HEADER ── */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 100, padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
              {mobileTab === 'sales' ? '💰 Sales' : mobileTab === 'expenses' ? '📤 Expenses' : '📊 Summary'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{selectedShift} Shift · {formattedDate}</div>
          </div>
          <button onClick={openMobileMenu} style={{ background: 'none', border: 'none', fontSize: 22, color: '#475569', cursor: 'pointer', padding: 8 }}>☰</button>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="mob-stats-strip" style={{ paddingTop: 10 }}>
          {[
            { label: 'Total Sales', value: formatNumber(totalSales), color: '#2563eb' },
            { label: 'Expenses', value: formatNumber(totalExpenses), color: '#dc2626' },
            { label: 'Cash at Hand', value: formatNumber(cashAtHand), color: cashAtHand >= 0 ? '#16a34a' : '#dc2626' },
            { label: 'Entries', value: filteredSales.length + filteredExpenses.length, color: '#475569' },
          ].map((s, i) => (
            <div key={i} className="mob-stat-card">
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ paddingTop: 6 }}>

          {/* SALES TAB */}
          {mobileTab === 'sales' && (
            <>
              {filteredSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '52px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No sales recorded yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to add a sale</div>
                </div>
              ) : filteredSales.map((sale, i) => (
                <div key={sale.id || i} className="mob-sale-item" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{formatCurrency(sale.amount)}</div>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{sale.category}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{sale.reason}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>By: {sale.servedBy}</span>
                    {i !== 0 && (
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={deletingSaleId === sale.id}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {deletingSaleId === sale.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add sale FAB */}
              <button
                onClick={() => setShowAddSaleSheet(true)}
                style={{ position: 'fixed', bottom: 76, right: 16, width: 52, height: 52, borderRadius: 26, background: '#2563eb', color: '#fff', border: 'none', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 4px 16px rgba(37,99,235,0.4)', cursor: 'pointer' }}
              >+</button>
            </>
          )}

          {/* EXPENSES TAB */}
          {mobileTab === 'expenses' && (
            <>
              {filteredExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '52px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No expenses recorded yet</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to add an expense</div>
                </div>
              ) : filteredExpenses.map((exp, i) => (
                <div key={exp.id || i} className="mob-sale-item" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>{formatCurrency(exp.amount)}</div>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{exp.category}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{exp.details}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Taken by: {exp.takenBy} · Served by: {exp.servedBy}
                    </div>
                    {i !== 0 && (
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        disabled={deletingExpenseId === exp.id}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {deletingExpenseId === exp.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add expense FAB */}
              <button
                onClick={() => setShowAddExpenseSheet(true)}
                style={{ position: 'fixed', bottom: 76, right: 16, width: 52, height: 52, borderRadius: 26, background: '#dc2626', color: '#fff', border: 'none', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, boxShadow: '0 4px 16px rgba(220,38,38,0.4)', cursor: 'pointer' }}
              >+</button>
            </>
          )}

          {/* SUMMARY TAB */}
          {mobileTab === 'summary' && renderMobileSummary()}
        </div>

        {/* ── BOTTOM TAB BAR ── */}
        <div className="mob-tab-bar">
          {[
            { id: 'sales', icon: '💰', label: 'Sales' },
            { id: 'expenses', icon: '📤', label: 'Expenses' },
            { id: 'summary', icon: '📊', label: 'Summary' },
          ].map(t => (
            <button key={t.id} className={`mob-tab ${mobileTab === t.id ? 'active' : ''}`} onClick={() => setMobileTab(t.id)}>
              <span className="mob-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CLOSE SHIFT FAB ── */}
        <button className="mob-close-fab" onClick={() => setShowMobileCloseConfirm(true)} disabled={isClosingShift}>
          🔒 {isClosingShift ? 'Closing...' : 'Close Shift'}
        </button>

        {/* ── NAV DRAWER ── */}
        {showMobileMenu && (
          <>
            <div className="mob-nav-overlay" onClick={closeMobileMenu} />
            <div className={`mob-nav-drawer ${closingMenu ? 'closing' : ''}`}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{clinicName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{employeeName} · {selectedShift} Shift</div>
                </div>
                <button onClick={closeMobileMenu} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✕</button>
              </div>
              <div style={{ flex: 1, padding: '12px 0' }}>
                <button className={`mob-nav-item ${mobileTab === 'sales' ? 'active' : ''}`} onClick={() => { setMobileTab('sales'); closeMobileMenu(); }}>💰 <span>Sales Entry</span></button>
                <button className={`mob-nav-item ${mobileTab === 'expenses' ? 'active' : ''}`} onClick={() => { setMobileTab('expenses'); closeMobileMenu(); }}>📤 <span>Expenses Entry</span></button>
                <button className={`mob-nav-item ${mobileTab === 'summary' ? 'active' : ''}`} onClick={() => { setMobileTab('summary'); closeMobileMenu(); }}>📊 <span>Shift Summary</span></button>
                <div style={{ height: 1, background: '#f1f5f9', margin: '8px 16px' }} />
                <button className="mob-nav-item" onClick={() => { handleSalesHistoryClick(); closeMobileMenu(); }}>📈 <span>Sales History</span></button>
              </div>
            </div>
          </>
        )}

        {/* ── ADD SALE SHEET ── */}
        {showAddSaleSheet && (
          <div className="mob-add-overlay" onClick={() => setShowAddSaleSheet(false)}>
            <div className="mob-add-sheet" onClick={e => e.stopPropagation()}>
              <div className="mob-add-handle" />
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Add Sale</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label className="mob-label">Amount (UGX)</label><input className="mob-input" type="number" inputMode="numeric" placeholder="0" value={newSale.amount || ''} onChange={e => setNewSale(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><label className="mob-label">Reason</label><input className="mob-input" type="text" placeholder="Reason for sale" value={newSale.reason} onChange={e => setNewSale(p => ({ ...p, reason: e.target.value }))} /></div>
                <div><label className="mob-label">Category</label>
                  <select className="mob-select" value={newSale.category} onChange={e => setNewSale(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {allSalesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#64748b' }}>Served by: <strong style={{ color: '#0f172a' }}>{employee}</strong></div>
                <button className="mob-btn-primary" onClick={handleAddSale} disabled={isAddingSale} style={{ opacity: isAddingSale ? 0.7 : 1 }}>
                  {isAddingSale ? 'Adding...' : '✓ Add Sale'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD EXPENSE SHEET ── */}
        {showAddExpenseSheet && (
          <div className="mob-add-overlay" onClick={() => setShowAddExpenseSheet(false)}>
            <div className="mob-add-sheet" onClick={e => e.stopPropagation()}>
              <div className="mob-add-handle" />
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Add Expense</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label className="mob-label">Amount (UGX)</label><input className="mob-input" type="number" inputMode="numeric" placeholder="0" value={newExpense.amount || ''} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><label className="mob-label">Details</label><input className="mob-input" type="text" placeholder="What was this expense for?" value={newExpense.details} onChange={e => setNewExpense(p => ({ ...p, details: e.target.value }))} /></div>
                <div><label className="mob-label">Taken By</label><input className="mob-input" type="text" placeholder="Person who took the money" value={newExpense.takenBy} onChange={e => setNewExpense(p => ({ ...p, takenBy: e.target.value }))} /></div>
                <div><label className="mob-label">Category</label>
                  <select className="mob-select" value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#64748b' }}>Served by: <strong style={{ color: '#0f172a' }}>{employee}</strong></div>
                <button className="mob-btn-primary mob-btn-danger" onClick={handleAddExpense} disabled={isAddingExpense} style={{ opacity: isAddingExpense ? 0.7 : 1 }}>
                  {isAddingExpense ? 'Adding...' : '✓ Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CLOSE SHIFT CONFIRM ── */}
        {showMobileCloseConfirm && (
          <div className="mob-modal-overlay">
            <div className="mob-modal-card">
              <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 12 }}>Close Shift?</div>
              <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                <strong>This action is irreversible.</strong><br />Make sure you have collected all money for your shift.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="mob-btn-primary mob-btn-danger" onClick={handleCloseShiftConfirm}>Yes, Proceed</button>
                <button className="mob-btn-primary mob-btn-secondary" onClick={() => setShowMobileCloseConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── COMMENTS MODAL ── */}
        {showMobileCommentsModal && (
          <div className="mob-modal-overlay">
            <div className="mob-modal-card">
              <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Shift Comments</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Please enter your shift comments before closing:</div>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Enter shift comments here..."
                autoFocus
                style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 14, color: '#0f172a', outline: 'none', resize: 'vertical', minHeight: 120, marginBottom: 16 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="mob-btn-primary" onClick={handleCommentsSubmit} disabled={!comments.trim()} style={{ opacity: !comments.trim() ? 0.5 : 1, background: '#2563eb' }}>Close Shift</button>
                <button className="mob-btn-primary mob-btn-secondary" onClick={() => { setShowMobileCommentsModal(false); setComments(''); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileSummary = () => {
    const filteredSales = getFilteredSales();
    const filteredExpenses = getFilteredExpenses();
    const salesByCategory = {};
    filteredSales.forEach(s => { const c = s.category || 'non-categorized'; salesByCategory[c] = (salesByCategory[c] || 0) + s.amount; });
    const expensesByCategory = {};
    filteredExpenses.forEach(e => { const c = e.category || 'non-categorized'; expensesByCategory[c] = (expensesByCategory[c] || 0) + e.amount; });

    return (
      <div style={{ padding: '0 12px 20px' }}>
        {/* Totals card */}
        <div style={{ background: 'linear-gradient(135deg, #0a1e4a, #2563eb)', borderRadius: 20, padding: 20, marginBottom: 16, color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{formattedDate} · {selectedShift} Shift</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total Sales', value: formatCurrency(totalSales) },
              { label: 'Expenses', value: formatCurrency(totalExpenses) },
              { label: 'Cash at Hand', value: formatCurrency(cashAtHand) },
              { label: 'Total Entries', value: filteredSales.length + filteredExpenses.length },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by category */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1.5px solid #f1f5f9' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>💰 Sales by Category</div>
          {Object.entries(salesByCategory).length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>No sales recorded</div>
            : Object.entries(salesByCategory).map(([c, a]) => (
              <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 13, color: '#475569' }}>{c}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(a)}</span>
              </div>
            ))
          }
        </div>

        {/* Expenses by category */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1.5px solid #f1f5f9' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>📤 Expenses by Category</div>
          {Object.entries(expensesByCategory).length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>No expenses recorded</div>
            : Object.entries(expensesByCategory).map(([c, a]) => (
              <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 13, color: '#475569' }}>{c}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(a)}</span>
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const desktopStyles = {
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textSecondary, background: theme.tableHeader, borderBottom: `1px solid ${theme.tableBorder}`, borderRight: `1px solid ${theme.tableBorder}`, whiteSpace: 'nowrap' },
    td: { padding: '13px 16px', fontSize: '13.5px', color: theme.textPrimary, borderBottom: `1px solid ${theme.tableBorder}`, borderRight: `1px solid ${theme.tableBorder}`, verticalAlign: 'middle' },
    badge: (type) => {
      const map = { green: theme.badgeGreen, red: theme.badgeRed, blue: theme.badgeBlue, gray: theme.badgeGray };
      const c = map[type] || map.gray;
      return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '11.5px', fontWeight: '600', background: c.bg, color: c.text };
    },
    input: { padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`, fontSize: 13, color: theme.textPrimary, background: theme.cardBg, width: '100%', outline: 'none' },
    actionBtn: { padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 28, transition: 'all 0.15s ease' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: theme.modalBg, borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'modalSlideIn 0.3s ease' },
  };

  const renderDesktopSidebar = () => {
    const navSections = [
      { label: 'SALES', items: [{ id: 'sales', icon: '💰', label: 'Sales Entry' }, { id: 'expenses', icon: '📤', label: 'Expenses Entry' }] },
      { label: 'REPORTS', items: [{ id: 'history', icon: '📊', label: 'Financial History' }, { id: 'summary', icon: '📈', label: 'Shift Summary' }] },
    ];

    return (
      <aside style={{ width: sidebarCollapsed ? 80 : 280, background: theme.sidebarBg, display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: `1px solid ${theme.sidebarBorder}`, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', transition: 'width 0.3s ease', boxShadow: currentTheme === 'blue' ? '2px 0 8px rgba(0,0,0,0.1)' : '2px 0 8px rgba(0,0,0,0.05)' }}>
        {/* Logo + collapse */}
        <div style={{ padding: sidebarCollapsed ? '20px 10px' : '20px 16px', borderBottom: `2px solid ${theme.sidebarBorder}`, display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection, minHeight: sidebarCollapsed ? 120 : 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, order: sidebarCollapsed ? 2 : 1, marginTop: sidebarCollapsed ? 12 : 0 }}>
            <div style={{ width: 45, height: 45, background: theme.activeNavBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontWeight: 700 }}>CP</div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontWeight: 700, fontSize: 16 }}>MEDCORE</div>
                <div style={{ color: theme.sectionHeaderText, fontSize: 11, marginTop: 2 }}>Sales Management</div>
              </div>
            )}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: theme.collapseButtonBg, border: `2px solid ${currentTheme === 'blue' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'}`, color: theme.collapseButtonText, width: 42, height: 42, borderRadius: 10, cursor: 'pointer', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', order: sidebarCollapsed ? 1 : 2, flexShrink: 0 }}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: sidebarCollapsed ? '16px 0' : '16px 12px', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              {!sidebarCollapsed && <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.sectionHeaderText, padding: '0 14px', marginBottom: 8, marginTop: 12 }}>{section.label}</div>}
              {section.items.map(item => (
                <button key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active-tab' : ''}`}
                  onClick={() => item.id === 'history' ? handleSalesHistoryClick() : setActiveView(item.id)}
                  onMouseEnter={() => setHoveredNavItem(item.id)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: sidebarCollapsed ? 0 : 12, padding: sidebarCollapsed ? '12px 0' : '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: activeView === item.id ? 600 : 500, color: activeView === item.id ? theme.activeNavText : (currentTheme === 'blue' ? theme.inactiveNavText : theme.textSecondary), background: activeView === item.id ? theme.activeNavBg : 'transparent', border: 'none', width: '100%', textAlign: sidebarCollapsed ? 'center' : 'left', marginBottom: 2, position: 'relative', transition: 'all 0.15s ease' }}>
                  <span style={{ fontSize: 18, width: 20, textAlign: 'center', color: activeView === item.id ? (currentTheme === 'blue' ? '#fff' : theme.textPrimary) : theme.iconBright }}>{item.icon}</span>
                  {!sidebarCollapsed && <span style={{ fontWeight: 600 }}>{item.label}</span>}
                  {sidebarCollapsed && hoveredNavItem === item.id && (
                    <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 12, padding: '8px 12px', background: theme.tooltipBg, color: theme.tooltipText, fontSize: 12, fontWeight: 500, borderRadius: 6, whiteSpace: 'nowrap', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>{item.label}</div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Filters */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!sidebarCollapsed && (activeView === 'sales' || activeView === 'expenses') && renderDesktopFilters()}
        </div>

        {/* Footer */}
        <div style={{ padding: sidebarCollapsed ? '16px 0' : '16px 16px 20px', borderTop: `1px solid ${theme.sidebarBorder}`, background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection, textAlign: sidebarCollapsed ? 'center' : 'left' }}>
          {!sidebarCollapsed ? (
            <>
              <div style={{ fontSize: 11, color: theme.sectionHeaderText, marginBottom: 4, fontWeight: 600 }}>{clinicName}</div>
              <div style={{ fontSize: 12, color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, fontWeight: 500 }}>{employeeName}</div>
              <div style={{ fontSize: 10, color: theme.sectionHeaderText, marginTop: 4 }}>{selectedShift} Shift</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, cursor: 'pointer', position: 'relative' }} onMouseEnter={() => setHoveredNavItem('user')} onMouseLeave={() => setHoveredNavItem(null)}>
              👤
              {hoveredNavItem === 'user' && <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 12, padding: '8px 12px', background: theme.tooltipBg, color: theme.tooltipText, fontSize: 12, borderRadius: 6, whiteSpace: 'nowrap', zIndex: 1000 }}>{employeeName} - {clinicName} ({selectedShift})</div>}
            </div>
          )}
        </div>
      </aside>
    );
  };

  const renderDesktopFilters = () => {
    const isSales = activeView === 'sales';
    const ft = isSales ? filterType : expenseFilterType;
    const setFt = isSales ? setFilterType : setExpenseFilterType;
    const options = isSales ? (filterType === 'servedBy' ? availableServedBy : availableCategories) : (expenseFilterType === 'takenBy' ? availableExpenseTakenBy : availableExpenseCategories);
    const selected = isSales ? (filterType === 'servedBy' ? selectedServedByFilters : selectedCategoryFilters) : (expenseFilterType === 'takenBy' ? selectedExpenseTakenByFilters : selectedExpenseCategoryFilters);
    const toggle = isSales
      ? (filterType === 'servedBy' ? (v, c) => setSelectedServedByFilters(p => c ? [...p, v] : p.filter(x => x !== v)) : (v, c) => setSelectedCategoryFilters(p => c ? [...p, v] : p.filter(x => x !== v)))
      : (expenseFilterType === 'takenBy' ? (v, c) => setSelectedExpenseTakenByFilters(p => c ? [...p, v] : p.filter(x => x !== v)) : (v, c) => setSelectedExpenseCategoryFilters(p => c ? [...p, v] : p.filter(x => x !== v)));
    const selectAll = () => isSales ? (filterType === 'servedBy' ? setSelectedServedByFilters([...availableServedBy]) : setSelectedCategoryFilters([...availableCategories])) : (expenseFilterType === 'takenBy' ? setSelectedExpenseTakenByFilters([...availableExpenseTakenBy]) : setSelectedExpenseCategoryFilters([...availableExpenseCategories]));
    const clearAll = () => isSales ? (filterType === 'servedBy' ? setSelectedServedByFilters([]) : setSelectedCategoryFilters([])) : (expenseFilterType === 'takenBy' ? setSelectedExpenseTakenByFilters([]) : setSelectedExpenseCategoryFilters([]));

    return (
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: currentTheme === 'blue' ? theme.inactiveNavText : theme.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔍 Filter {isSales ? 'Sales' : 'Expenses'}</div>
        <div style={{ marginBottom: 12 }}>
          {(isSales ? [['servedBy', 'By Names'], ['category', 'By Category']] : [['takenBy', 'By Taken By'], ['category', 'By Category']]).map(([val, label]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: currentTheme === 'blue' ? theme.inactiveNavText : theme.textSecondary, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" value={val} checked={ft === val} onChange={() => setFt(val)} />
              {label}
            </label>
          ))}
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
          {options.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 12, color: currentTheme === 'blue' ? theme.inactiveNavText : theme.textSecondary, cursor: 'pointer', borderRadius: 4 }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={e => toggle(opt, e.target.checked)} />
              <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={selectAll} style={{ padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', background: theme.activeNavBg, color: currentTheme === 'blue' ? '#fff' : theme.textPrimary, cursor: 'pointer' }}>All</button>
          <button onClick={clearAll} style={{ padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', background: theme.danger, color: '#fff', cursor: 'pointer' }}>Clear</button>
        </div>
        <div style={{ fontSize: 10, color: currentTheme === 'blue' ? theme.inactiveNavText : theme.textMuted, marginTop: 8 }}>Selected: {selected.length} / {options.length}</div>
      </div>
    );
  };

  const renderDesktopSummary = () => {
    const fs = getFilteredSales();
    const fe = getFilteredExpenses();
    const sbc = {};
    fs.forEach(s => { const c = s.category || 'non-categorized'; sbc[c] = (sbc[c] || 0) + s.amount; });
    const ebc = {};
    fe.forEach(e => { const c = e.category || 'non-categorized'; ebc[c] = (ebc[c] || 0) + e.amount; });

    return (
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 24, marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>📊 Shift Summary — {formattedDate} ({selectedShift} Shift)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
          {[{ label: 'Total Sales', value: formatCurrency(totalSales), color: theme.info }, { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: theme.danger }, { label: 'Cash at Hand', value: formatCurrency(cashAtHand), color: cashAtHand >= 0 ? theme.accent : theme.danger }, { label: 'Net Entries', value: fs.length + fe.length, color: theme.textPrimary }].map((s, i) => (
            <div key={i} style={{ background: theme.mainBg, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[['💰 Sales by Category', sbc], ['📤 Expenses by Category', ebc]].map(([title, data]) => (
            <div key={title}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{title}</div>
              {Object.entries(data).length === 0 ? <div style={{ fontSize: 13, color: theme.textMuted }}>None recorded</div>
                : Object.entries(data).map(([c, a]) => (
                  <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: theme.mainBg, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: theme.textSecondary }}>{c}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(a)}</span>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={() => setShowCloseShiftPrompt(true)} disabled={isClosingShift} style={{ padding: '14px 32px', background: isClosingShift ? theme.textMuted : theme.danger, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: isClosingShift ? 'not-allowed' : 'pointer', boxShadow: `0 4px 12px ${theme.danger}40` }}>
            {isClosingShift ? 'Closing...' : '🔒 Close Shift'}
          </button>
        </div>
      </div>
    );
  };

  const renderDesktop = () => (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: theme.cardBg }}>
      <style>{`
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        table { border-collapse: collapse; width: 100%; }
        th:last-child, td:last-child { border-right: none !important; }
        .table-row:hover td { background: ${theme.tableRowHover}; }
        .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .collapse-btn:hover { background: ${theme.collapseButtonHover} !important; transform: scale(1.05); }
        .nav-item:hover { background: ${theme.navHoverBg} !important; }
      `}</style>

      <Topbar token={tokenFromUrl} themeColor={currentTheme} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, marginTop: 64 }}>
        {renderDesktopSidebar()}

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: theme.mainBg, borderRadius: '24px 0 0 0', margin: '16px 16px 16px 0', boxShadow: currentTheme === 'blue' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)' }}>

          {/* Sticky header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.headerBg, padding: '16px 28px', borderBottom: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>
              <span>📅</span>
              <span>{formattedDate} · {selectedShift} Shift</span>
              <span style={desktopStyles.badge('blue')}>{getFilteredSales().length + getFilteredExpenses().length} entries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {[{ label: 'Total Sales', value: formatNumber(totalSales), color: theme.info }, { label: 'Expenses', value: formatNumber(totalExpenses), color: theme.danger }, { label: 'Cash at Hand', value: formatNumber(cashAtHand), color: cashAtHand >= 0 ? theme.accent : theme.danger }].map(s => (
                <div key={s.label} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, padding: '12px 20px', minWidth: 140, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
              <button onClick={() => setShowCloseShiftPrompt(true)} disabled={isClosingShift} style={{ background: isClosingShift ? theme.textMuted : theme.danger, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: isClosingShift ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: 40, whiteSpace: 'nowrap' }}>
                🔒 {isClosingShift ? 'Closing...' : 'Close Shift'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }} className="fade-in">
            {activeView === 'summary' ? renderDesktopSummary() : (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: 16 }}>
                <table>
                  <thead>
                    <tr>
                      {activeView === 'sales'
                        ? ['Amount (UGX)', 'Reason', 'Category', 'Served By', 'Actions'].map(h => <th key={h} style={desktopStyles.th}>{h}</th>)
                        : ['Amount (UGX)', 'Details', 'Category', 'Taken By', 'Served By', 'Actions'].map(h => <th key={h} style={desktopStyles.th}>{h}</th>)
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {(activeView === 'sales' ? getFilteredSales() : getFilteredExpenses()).map((item, i) => (
                      <tr key={item.id || i} className="table-row">
                        {activeView === 'sales' ? (
                          <>
                            <td style={{ ...desktopStyles.td, fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                            <td style={desktopStyles.td}>{item.reason}</td>
                            <td style={desktopStyles.td}><span style={desktopStyles.badge('gray')}>{item.category}</span></td>
                            <td style={desktopStyles.td}>{item.servedBy}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ ...desktopStyles.td, fontWeight: 700, color: theme.danger }}>{formatCurrency(item.amount)}</td>
                            <td style={desktopStyles.td}>{item.details}</td>
                            <td style={desktopStyles.td}><span style={desktopStyles.badge('gray')}>{item.category}</span></td>
                            <td style={desktopStyles.td}>{item.takenBy}</td>
                            <td style={desktopStyles.td}>{item.servedBy}</td>
                          </>
                        )}
                        <td style={{ ...desktopStyles.td, textAlign: 'center', padding: '13px 8px' }}>
                          {i !== 0 ? (
                            <button className="action-btn" onClick={() => activeView === 'sales' ? handleDeleteSale(item.id) : handleDeleteExpense(item.id)} disabled={(activeView === 'sales' ? deletingSaleId : deletingExpenseId) === item.id} style={{ ...desktopStyles.actionBtn, background: theme.danger, color: '#fff', opacity: (activeView === 'sales' ? deletingSaleId : deletingExpenseId) === item.id ? 0.6 : 1, margin: '0 auto' }}>
                              {(activeView === 'sales' ? deletingSaleId : deletingExpenseId) === item.id ? '...' : 'Delete'}
                            </button>
                          ) : (
                            <button disabled style={{ ...desktopStyles.actionBtn, background: theme.textMuted, color: theme.cardBg, opacity: 0.8, cursor: 'not-allowed', margin: '0 auto' }}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Add row */}
                    <tr style={{ background: theme.tableHeader }}>
                      {activeView === 'sales' ? (
                        <>
                          <td style={desktopStyles.td}><input type="text" style={{ ...desktopStyles.input, width: 100 }} value={newSale.amount} onChange={e => setNewSale(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" /></td>
                          <td style={desktopStyles.td}><input type="text" style={{ ...desktopStyles.input, width: 150 }} value={newSale.reason} onChange={e => setNewSale(p => ({ ...p, reason: e.target.value }))} placeholder="Reason" /></td>
                          <td style={desktopStyles.td}>
                            <select style={{ ...desktopStyles.input, width: 130 }} value={newSale.category} onChange={e => setNewSale(p => ({ ...p, category: e.target.value }))}>
                              <option value="">Select...</option>
                              {allSalesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={desktopStyles.td}><span style={{ fontWeight: 600, color: theme.textSecondary }}>{employee}</span></td>
                        </>
                      ) : (
                        <>
                          <td style={desktopStyles.td}><input type="text" style={{ ...desktopStyles.input, width: 100 }} value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" /></td>
                          <td style={desktopStyles.td}><input type="text" style={{ ...desktopStyles.input, width: 150 }} value={newExpense.details} onChange={e => setNewExpense(p => ({ ...p, details: e.target.value }))} placeholder="Details" /></td>
                          <td style={desktopStyles.td}>
                            <select style={{ ...desktopStyles.input, width: 130 }} value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}>
                              <option value="">Select...</option>
                              {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={desktopStyles.td}><input type="text" style={{ ...desktopStyles.input, width: 100 }} value={newExpense.takenBy} onChange={e => setNewExpense(p => ({ ...p, takenBy: e.target.value }))} placeholder="Taken By" /></td>
                          <td style={desktopStyles.td}><span style={{ fontWeight: 600, color: theme.textSecondary }}>{employee}</span></td>
                        </>
                      )}
                      <td style={{ ...desktopStyles.td, textAlign: 'center', padding: '13px 8px' }}>
                        <button className="action-btn" onClick={activeView === 'sales' ? handleAddSale : handleAddExpense} disabled={activeView === 'sales' ? isAddingSale : isAddingExpense} style={{ ...desktopStyles.actionBtn, background: theme.accent, color: '#fff', width: 60, cursor: (activeView === 'sales' ? isAddingSale : isAddingExpense) ? 'not-allowed' : 'pointer', opacity: (activeView === 'sales' ? isAddingSale : isAddingExpense) ? 0.6 : 1, margin: '0 auto' }}>
                          {(activeView === 'sales' ? isAddingSale : isAddingExpense) ? '...' : 'Add'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Desktop Modals */}
      {showCloseShiftPrompt && (
        <div style={desktopStyles.modalOverlay}>
          <div style={desktopStyles.modalContent}>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>⚠️ Close Shift Confirmation</div>
            <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
              <p><strong>This action is irreversible!</strong></p>
              <p>Make sure you have collected all money for your shift.</p>
              <p style={{ marginTop: 16, color: theme.danger }}>Are you sure you want to proceed?</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCloseShiftPrompt(false)} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.tableHeader, color: theme.textPrimary }}>Cancel</button>
              <button onClick={handleCloseShiftConfirm} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.danger, color: '#fff' }}>Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}

      {showCommentsModal && (
        <div style={desktopStyles.modalOverlay}>
          <div style={desktopStyles.modalContent}>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>📝 Shift Comments</div>
            <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 16 }}>Please enter your shift comments before closing:</div>
            <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Enter shift comments here..." autoFocus style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.cardBorder}`, fontSize: 14, color: theme.textPrimary, background: theme.cardBg, marginBottom: 20, resize: 'vertical', minHeight: 100, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCommentsModal(false); setComments(''); }} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.tableHeader, color: theme.textPrimary }}>Cancel</button>
              <button onClick={handleCommentsSubmit} disabled={!comments.trim()} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: theme.info, color: '#fff', opacity: !comments.trim() ? 0.5 : 1 }}>Close Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────────────────────────────────────────
  if (isValidating || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.sidebarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${theme.sidebarBorder}`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: theme.inactiveNavText, fontSize: 14 }}>Loading Sales Dashboard...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!selectedShift) {
    return (
      <div style={{ minHeight: '100vh', background: theme.mainBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>No Active Shift</div>
          <div style={{ fontSize: 14, color: theme.textSecondary }}>There is no active shift for this time period.</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles theme={theme} isMobile={isMobile} currentTheme={currentTheme} />

      {/* Shift close animation (shared) */}
      {isSendingWhatsApp && renderCloseAnimation()}

      {isMobile ? renderMobile() : renderDesktop()}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={currentTheme === 'blue' ? 'dark' : 'light'}
      />
    </>
  );
};

export default Sales;
