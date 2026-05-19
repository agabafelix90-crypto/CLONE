import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import RadiologyResultsModal5 from './RadiologyResultsModal5';
import RadiologyTemplatesPrompt from './RadiologyTemplatesPrompt';
import './RadiographerDashboard.css';

const RadiographerDashboard = () => {
  const [pendingExamsCount, setPendingExamsCount] = useState(0);
  const [recentExams, setRecentExams] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicDetails, setClinicDetails] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRadiologyResultsModalOpen, setIsRadiologyResultsModalOpen] = useState(false);
  const [isTemplatesPromptOpen, setIsTemplatesPromptOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [uniqueEmployees, setUniqueEmployees] = useState([]);
  const [employeeFilterOpen, setEmployeeFilterOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [stats, setStats] = useState({
    today: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, total: 0, pending: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlToken = useRef(params.get('token'));
  const urlTheme = parseThemeFromSearch(window.location.search);

  // ─── DESIGN TOKENS ─────────────────────────────────────
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

  // Get active theme
  const theme = colors[currentTheme];

  // Button colors based on theme
  const buttonColor = theme.info;
  const buttonHoverColor = theme.activeNavBg;

  // ─── SHARED STYLES ─────────────────────────────────────────────────────────
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
      padding: collapsed ? '12px 0' : '10px 16px',
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
      padding: collapsed ? '0' : '0 16px',
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
        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px',
        fontWeight: '600', background: c.bg, color: c.text,
      };
    },
    actionButton: {
      padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
      fontWeight: '600', border: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: '4px', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
    },
    input: {
      padding: '8px 12px', borderRadius: '8px',
      border: `1px solid ${theme.cardBorder}`,
      fontSize: '13px', color: theme.textPrimary,
      background: theme.cardBg, width: '100%', outline: 'none',
    },
  });

  // Get current styles based on theme
  const currentStyles = styles(theme);

  // ── Check theme from security response ──────────────────
  useEffect(() => {
    const checkTheme = async () => {
      try {
        const tokenFromUrl = urlToken.current;
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          const themeColor = securityData.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            await Promise.all([
              fetchRecentExams(tokenFromUrl),
              fetchClinicDetails(tokenFromUrl),
              fetchRadiologyStats(tokenFromUrl),
            ]);
          } else if (securityData.error === 'Session expired') {
            navigate(`/dashboard?token=${securityData.clinic_session_token}`);
          } else {
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Security check error:', error);
        navigate('/login');
      }
    };
    checkTheme();
  }, [navigate]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: ${theme.tableHeader}; }
      ::-webkit-scrollbar-thumb { background: ${theme.tableBorder}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}; }
      .nav-item-hover:hover { background: ${theme.navHoverBg} !important; color: ${theme.activeNavText} !important; }
      .exam-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .exam-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
      }
      .filter-item:hover {
        background: ${theme.infoLight} !important;
      }
      .fade-in { animation: fadeIn 0.3s ease; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes urgent-blink {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
        50% { box-shadow: 0 0 20px 5px rgba(220, 38, 38, 0.3); }
      }
      .pending-alert {
        animation: urgent-blink 2s infinite, pulse-glow 2s infinite;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .pending-alert:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4) !important;
      }
      .employee-filter-body {
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
      }
      .employee-filter-body.open {
        max-height: 400px;
        opacity: 1;
      }
      .employee-filter-body.closed {
        max-height: 0;
        opacity: 0;
      }
      .filter-toggle-chevron {
        transition: transform 0.3s ease;
        display: inline-block;
      }
      .filter-toggle-chevron.open {
        transform: rotate(180deg);
      }
      .nav-icon { color: ${theme.iconBright}; font-size: 18px; transition: all 0.2s ease; }
      .nav-item:hover .nav-icon { color: ${theme.iconHover}; transform: scale(1.1); }
      .active-tab { 
        background: ${theme.activeNavBg} !important; 
        border-radius: 8px !important;
      }
      .active-tab .nav-icon { color: ${theme.activeNavText} !important; }
      .collapse-btn:hover { 
        background: ${theme.collapseButtonHover} !important; 
        transform: scale(1.05); 
        box-shadow: 0 4px 12px ${theme.infoLight}40;
      }
      @media (max-width: 768px) {
        .exams-grid {
          grid-template-columns: 1fr !important;
        }
        .header-actions {
          flex-direction: column !important;
          align-items: stretch !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [theme]);

  const formatDateToDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
  };

  const isWithinDateRange = (patientDateString, start, end) => {
    if (!start && !end) return true;
    const patientDate = new Date(patientDateString);
    patientDate.setHours(0, 0, 0, 0);
    if (start && end) {
      const s = new Date(start); s.setHours(0, 0, 0, 0);
      const e = new Date(end); e.setHours(23, 59, 59, 999);
      return patientDate >= s && patientDate <= e;
    } else if (start) {
      const s = new Date(start); s.setHours(0, 0, 0, 0);
      return patientDate >= s;
    } else {
      const e = new Date(end); e.setHours(23, 59, 59, 999);
      return patientDate <= e;
    }
  };

  const getDisplayHeaderText = () => {
    let text = 'Radiology Exams';
    if (selectedEmployee) text += ` by ${selectedEmployee}`;
    if (startDate || endDate) {
      if (startDate && endDate) text += ` from ${formatDateToDDMMYYYY(startDate)} to ${formatDateToDDMMYYYY(endDate)}`;
      else if (startDate) text += ` from ${formatDateToDDMMYYYY(startDate)} onwards`;
      else text += ` up to ${formatDateToDDMMYYYY(endDate)}`;
    } else if (!selectedEmployee) {
      text += ' - All Reports';
    }
    return text;
  };

  useEffect(() => {
    const fetchPendingExamsCount = async (token) => {
      try {
        const response = await fetch(urls.pendingexamscount, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error('Failed to fetch pending count');
        const data = await response.json();
        setPendingExamsCount(data.count);
        setStats(prev => ({ ...prev, pending: data.count }));
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };
    const tokenFromUrl = urlToken.current;
    if (tokenFromUrl) {
      fetchPendingExamsCount(tokenFromUrl);
      const interval = setInterval(() => fetchPendingExamsCount(tokenFromUrl), 70000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchRadiologyStats = async (token) => {
    try {
      const response = await fetch(urls.fetchRadiologyStat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          today: data.today || 0, thisWeek: data.thisWeek || 0,
          thisMonth: data.thisMonth || 0, thisYear: data.thisYear || 0,
          total: data.total || 0, pending: prev.pending,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentExams = async (token) => {
    try {
      const response = await fetch(urls.allradiology, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json();
        const exams = data.patients || [];
        setRecentExams(exams);
        const employees = [...new Set(exams.map(e => e.employee_name || 'Unknown'))].sort();
        setUniqueEmployees(employees);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchClinicDetails = async (token) => {
    try {
      const response = await fetch(urls.fetchclinicdetails, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json();
        setClinicDetails(data);
      }
    } catch (error) {
      console.error('Error fetching clinic details:', error);
    }
  };

  const handleShowRadiologyResults = (patient) => {
    setSelectedPatient({ ...patient, clinicDetails });
    setIsRadiologyResultsModalOpen(true);
  };

  const handleGoToPendingExams = () => navigate(`/radiology?token=${urlToken.current}`);
  const handleOpenTemplates = () => setIsTemplatesPromptOpen(true);
  const handleCloseTemplatesPrompt = () => setIsTemplatesPromptOpen(false);
  const handleCloseModal = () => setIsRadiologyResultsModalOpen(false);

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee === selectedEmployee ? null : employee);
  };

  const handleClearFilters = () => {
    setSelectedEmployee(null);
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const filteredExams = recentExams.filter(patient => {
    const matchesName = `${patient.first_name} ${patient.last_name}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(patient.date_time, startDate, endDate);
    const employeeDisplay = patient.employee_name || 'Unknown';
    const matchesEmployee = selectedEmployee ? employeeDisplay === selectedEmployee : true;
    return matchesName && matchesDate && matchesEmployee;
  });

  const hasActiveFilters = selectedEmployee || startDate || endDate || searchTerm;

  // Navigation sections for sidebar
  const navSections = [
    {
      label: 'DASHBOARD',
      items: [
        { id: 'dashboard', icon: '📊', label: 'Overview', action: () => {} },
        { id: 'pending', icon: '⏳', label: 'Pending Exams', action: handleGoToPendingExams, badge: pendingExamsCount },
        { id: 'templates', icon: '📋', label: 'Templates', action: handleOpenTemplates },
      ],
    },
    {
      label: 'REPORTS',
      items: [
        { id: 'all', icon: '📁', label: 'All Reports', action: () => handleClearFilters() },
        { id: 'today', icon: '🌅', label: "Today's Reports", action: () => {
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          setEndDate(today);
        }},
        { id: 'week', icon: '📅', label: 'This Week', action: () => {
          const today = new Date();
          const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
          const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          setStartDate(firstDay.toISOString().split('T')[0]);
          setEndDate(lastDay.toISOString().split('T')[0]);
        }},
      ],
    },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: theme.mainBg, 
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Topbar - Fixed at top with high z-index */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1100,
        height: '60px',
      }}>
        <Topbar token={urlToken.current} themeColor={currentTheme} />
      </div>

      {/* Body - Main container with flex */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        marginTop: '60px', 
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}>

        {/* ── SIDEBAR (COLLAPSIBLE) ───────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: theme.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: `1px solid ${theme.sidebarBorder}`,
          height: 'calc(100vh - 60px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
          zIndex: 1000,
          position: 'fixed',
          top: '60px',
          left: 0,
        }}>
          {/* Logo with Collapse Button - Now properly aligned */}
          <div style={{ 
            padding: sidebarCollapsed ? '20px 10px' : '20px 20px',
            borderBottom: `2px solid ${theme.sidebarBorder}`,
            display: 'flex',
            flexDirection: sidebarCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            minHeight: sidebarCollapsed ? '120px' : '80px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {/* Logo section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              flex: 1,
              order: sidebarCollapsed ? 2 : 1,
              marginTop: sidebarCollapsed ? '12px' : 0,
              minWidth: 0,
            }}>
              <div style={{
                width: '45px',
                height: '45px',
                background: theme.activeNavBg,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                color: theme.activeNavText,
                fontWeight: 'bold',
                boxShadow: currentTheme === 'blue' 
                  ? '0 4px 10px rgba(37, 99, 235, 0.3)'
                  : '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                CP
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ 
                    color: theme.sidebarText, 
                    fontWeight: '700', 
                    fontSize: '16px', 
                    letterSpacing: '-0.01em', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    MEDCORE
                  </div>
                  <div style={{ 
                    color: theme.sidebarTextMuted, 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    marginTop: '2px', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    Radiology
                  </div>
                </div>
              )}
            </div>

            {/* Collapse Button */}
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                ...currentStyles.collapseButton,
                background: theme.collapseButtonBg,
                border: currentTheme === 'blue' 
                  ? '2px solid rgba(255,255,255,0.2)'
                  : '2px solid rgba(0,0,0,0.05)',
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
                boxShadow: currentTheme === 'blue'
                  ? '0 4px 12px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                order: sidebarCollapsed ? 1 : 2,
                marginLeft: sidebarCollapsed ? 0 : '12px',
                flexShrink: 0
              }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Scrollable sidebar content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            padding: sidebarCollapsed ? '12px 0' : '20px 16px',
            width: '100%',
            boxSizing: 'border-box',
          }}>

            {/* Navigation */}
            <nav style={{ 
              padding: sidebarCollapsed ? '0' : '0 4px',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              {navSections.map(section => (
                <div key={section.label} style={{ marginBottom: '16px', width: '100%' }}>
                  {!sidebarCollapsed && <div style={currentStyles.sectionHeader(sidebarCollapsed)}>{section.label}</div>}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1px',
                    width: '100%',
                  }}>
                    {section.items.map(item => {
                      return (
                        <button
                          key={item.id}
                          className="nav-item"
                          onClick={() => item.action()}
                          onMouseEnter={() => setHoveredNavItem(item.id)}
                          onMouseLeave={() => setHoveredNavItem(null)}
                          style={{
                            ...currentStyles.navItem(false, sidebarCollapsed),
                            padding: sidebarCollapsed ? '12px 0' : '10px 16px',
                            margin: sidebarCollapsed ? '0' : '0 0 2px 0',
                            position: 'relative',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span className="nav-icon" style={{ 
                            fontSize: '18px', 
                            width: '20px', 
                            textAlign: 'center',
                            filter: currentTheme === 'blue' ? 'brightness(1.2)' : 'none',
                            textShadow: currentTheme === 'blue' ? '0 0 5px rgba(251, 191, 36, 0.3)' : 'none',
                            flexShrink: 0,
                          }}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <>
                              <span style={{ 
                                fontWeight: '500', 
                                flex: 1, 
                                textAlign: 'left', 
                                color: theme.sidebarText,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
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
                                  flexShrink: 0,
                                }}>
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          
                          {/* Tooltip for collapsed mode */}
                          {sidebarCollapsed && hoveredNavItem === item.id && (
                            <div style={currentStyles.tooltip}>
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

            {/* Templates Button - Only when not collapsed */}
            {!sidebarCollapsed && (
              <div style={{ padding: '0 12px 16px 12px', width: '100%', boxSizing: 'border-box' }}>
                <button
                  onClick={handleOpenTemplates}
                  className="nav-item-hover"
                  style={{
                    padding: '10px 16px', 
                    borderRadius: '8px',
                    background: theme.activeNavBg, 
                    border: 'none', 
                    cursor: 'pointer',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: theme.activeNavText,
                    transition: 'all 0.15s ease', 
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>📋</span>
                  Create Templates
                </button>
              </div>
            )}

            {/* Employee Filter - Collapsible */}
            {!sidebarCollapsed && (
              <div style={{
                margin: '0 12px 16px',
                borderRadius: '10px',
                background: theme.filterSection,
                border: currentTheme === 'blue' 
                  ? '1px solid rgba(255,255,255,0.07)'
                  : '1px solid rgba(0,0,0,0.05)',
                overflow: 'hidden',
                width: 'calc(100% - 24px)',
                boxSizing: 'border-box',
              }}>
                {/* Header (always visible) */}
                <button
                  onClick={() => setEmployeeFilterOpen(v => !v)}
                  style={{
                    width: '100%', 
                    padding: '12px 16px', 
                    background: 'transparent',
                    border: 'none', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: theme.sidebarText, flexShrink: 0 }}>👤</span>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      color: theme.sidebarTextMuted, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.06em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      Filter by Employee
                    </span>
                    {selectedEmployee && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '10px',
                        background: theme.activeNavBg, color: theme.activeNavText,
                        fontSize: '10px', fontWeight: '700',
                        flexShrink: 0,
                      }}>1</span>
                    )}
                  </div>
                  <span
                    className={`filter-toggle-chevron ${employeeFilterOpen ? 'open' : ''}`}
                    style={{ fontSize: '11px', color: theme.sidebarTextMuted, flexShrink: 0 }}
                  >▼</span>
                </button>

                {/* Body (collapsible) */}
                <div className={`employee-filter-body ${employeeFilterOpen ? 'open' : 'closed'}`}>
                  <div style={{ padding: '0 12px 12px', width: '100%', boxSizing: 'border-box' }}>

                    {/* All Employees */}
                    <div
                      className="filter-item"
                      onClick={() => handleEmployeeClick(null)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                        background: !selectedEmployee ? theme.infoLight : 'transparent',
                        marginBottom: '3px', transition: 'all 0.15s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ 
                        fontSize: '12px', 
                        color: theme.sidebarText, 
                        fontWeight: !selectedEmployee ? '700' : '400',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        All Employees
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        padding: '2px 7px', borderRadius: '8px',
                        background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: theme.sidebarTextMuted,
                        flexShrink: 0,
                      }}>{recentExams.length}</span>
                    </div>

                    {uniqueEmployees.map((employee) => (
                      <div
                        key={employee}
                        className="filter-item"
                        onClick={() => handleEmployeeClick(employee)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                          background: selectedEmployee === employee ? theme.infoLight : 'transparent',
                          marginBottom: '3px', transition: 'all 0.15s ease',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span style={{
                          fontSize: '12px', color: theme.sidebarText,
                          fontWeight: selectedEmployee === employee ? '700' : '400',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {employee}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700',
                          padding: '2px 7px', borderRadius: '8px',
                          background: currentTheme === 'blue' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          color: theme.sidebarTextMuted,
                          flexShrink: 0,
                        }}>
                          {recentExams.filter(e => (e.employee_name || 'Unknown') === employee).length}
                        </span>
                      </div>
                    ))}

                    {selectedEmployee && (
                      <div style={{
                        marginTop: '8px', padding: '5px 10px', borderRadius: '6px',
                        background: theme.infoLight, 
                        borderLeft: `2px solid ${theme.info}`,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}>
                        <span style={{ fontSize: '10px', color: theme.textPrimary }}>
                          ✓ Filtered: <strong>{selectedEmployee}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics - Only when not collapsed */}
            {!sidebarCollapsed && (
              <div style={{
                margin: '0 12px 16px',
                borderRadius: '10px',
                background: theme.filterSection,
                border: currentTheme === 'blue' 
                  ? '1px solid rgba(255,255,255,0.07)'
                  : '1px solid rgba(0,0,0,0.05)',
                padding: '16px',
                width: 'calc(100% - 24px)',
                boxSizing: 'border-box',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700', 
                  color: theme.sidebarTextMuted,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>📊</span> Statistics
                </div>
                {[
                  { label: 'Today', value: stats.today, icon: '🌅' },
                  { label: 'This Week', value: stats.thisWeek, icon: '📅' },
                  { label: 'This Month', value: stats.thisMonth, icon: '🗓️' },
                  { label: 'This Year', value: stats.thisYear, icon: '📆' },
                  { label: 'All Time', value: stats.total, icon: '📁' },
                  { label: 'Pending', value: stats.pending, icon: '⏳', highlight: stats.pending > 0 },
                ].map(({ label, value, icon, highlight }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: '7px', marginBottom: '4px',
                    background: highlight 
                      ? (currentTheme === 'blue' ? 'rgba(220,38,38,0.15)' : theme.dangerLight)
                      : (currentTheme === 'blue' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                    width: '100%',
                    boxSizing: 'border-box',
                  }}>
                    <span style={{ 
                      fontSize: '12px', 
                      color: theme.sidebarText, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    </span>
                    <span style={{
                      fontSize: '13px', fontWeight: '700',
                      color: highlight ? (currentTheme === 'blue' ? '#fca5a5' : theme.danger) : theme.sidebarText,
                      flexShrink: 0,
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clear Filters - Only when not collapsed */}
            {!sidebarCollapsed && hasActiveFilters && (
              <div style={{ padding: '0 12px 16px', width: '100%', boxSizing: 'border-box' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    width: '100%', padding: '9px', borderRadius: '8px',
                    background: currentTheme === 'blue' 
                      ? 'rgba(220,38,38,0.18)' 
                      : theme.dangerLight,
                    border: currentTheme === 'blue'
                      ? '1px solid rgba(220,38,38,0.3)'
                      : `1px solid ${theme.danger}`,
                    color: currentTheme === 'blue' ? '#fca5a5' : theme.danger,
                    fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => {
                    if (currentTheme === 'blue') {
                      e.currentTarget.style.background = 'rgba(220,38,38,0.28)';
                    } else {
                      e.currentTarget.style.background = theme.danger;
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (currentTheme === 'blue') {
                      e.currentTarget.style.background = 'rgba(220,38,38,0.18)';
                    } else {
                      e.currentTarget.style.background = theme.dangerLight;
                      e.currentTarget.style.color = theme.danger;
                    }
                  }}
                >
                  🗑️ Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* User Footer */}
          <div style={{
            padding: sidebarCollapsed ? '16px 0' : '16px 20px',
            borderTop: currentTheme === 'blue'
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(0,0,0,0.06)',
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            flexShrink: 0,
            textAlign: sidebarCollapsed ? 'center' : 'left',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.info}, ${theme.skyBlue})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0,
                }}>
                  {employeeName ? employeeName.charAt(0).toUpperCase() : 'R'}
                </div>
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: theme.sidebarTextMuted, 
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {clinicDetails?.clinic_name || 'Clinic'}
                  </div>
                  <div style={{
                    fontSize: '12px', color: theme.sidebarText, fontWeight: '600',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{employeeName}</div>
                  <div style={{ 
                    fontSize: '10px', 
                    color: theme.sidebarTextMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>Radiologist</div>
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  fontSize: '12px', 
                  color: theme.sidebarText, 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  position: 'relative',
                  textAlign: 'center',
                }}
                onMouseEnter={() => setHoveredNavItem('user')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                👤
                {hoveredNavItem === 'user' && (
                  <div style={{...currentStyles.tooltip, left: '100%'}}>
                    {employeeName} - {clinicDetails?.clinic_name || 'Clinic'}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <div style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: theme.mainBg,
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          position: 'relative',
          zIndex: 900,
        }}>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px',
            height: '100%',
            boxSizing: 'border-box',
          }}>

            {/* Page Header with Pending Alert */}
            <div style={{
              ...currentStyles.card,
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Header with Title and Pending Alert */}
              <div className="header-actions" style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '16px' 
              }}>
                {/* Left side - Title */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    PATIENT REPORTS
                  </div>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, margin: 0, lineHeight: 1.3 }}>
                    {getDisplayHeaderText()}
                  </h1>
                  <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>
                    {filteredExams.length} report{filteredExams.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                {/* Right side - Pending Alert */}
                {pendingExamsCount > 0 && (
                  <div
                    className="pending-alert"
                    onClick={handleGoToPendingExams}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      borderRadius: '16px',
                      padding: '14px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '280px',
                      position: 'relative',
                      zIndex: 950,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 20px 30px -5px rgba(220, 38, 38, 0.7)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(220, 38, 38, 0.5)';
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      animation: 'urgent-blink 1.5s infinite',
                      filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
                    }}>
                      ⚠️
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}>
                        Patients Waiting
                      </div>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#ffffff',
                        lineHeight: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}>
                        {pendingExamsCount}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '20px',
                      color: '#ffffff',
                      opacity: 0.9,
                    }}>
                      →
                    </div>
                  </div>
                )}

                {pendingExamsCount === 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minWidth: '200px',
                    zIndex: 950,
                  }}>
                    <span style={{ fontSize: '24px' }}>✅</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        All Clear
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                        No patients waiting
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none', color: theme.textMuted }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search patient name…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...currentStyles.input, paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                {/* Start Date */}
                <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '140px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', pointerEvents: 'none', color: theme.textMuted }}>📅</span>
                  <input
                    type="date"
                    placeholder="From date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ ...currentStyles.input, paddingLeft: '32px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                {/* End Date */}
                <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '140px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', pointerEvents: 'none', color: theme.textMuted }}>📅</span>
                  <input
                    type="date"
                    placeholder="To date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ ...currentStyles.input, paddingLeft: '32px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Exams Grid */}
            {filteredExams.length === 0 ? (
              <div style={{
                ...currentStyles.card,
                textAlign: 'center', padding: '60px 24px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, marginBottom: '8px' }}>
                  {recentExams.length === 0 ? 'No radiology exams available.' : 'No matching exams found.'}
                </div>
                <div style={{ fontSize: '13px', color: theme.textMuted }}>
                  Try adjusting your filters or search criteria.
                </div>
              </div>
            ) : (
              <div
                className="exams-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  paddingBottom: '24px',
                }}
              >
                {filteredExams.map((patient) => (
                  <div
                    key={patient.id || `${patient.first_name}-${patient.date_time}`}
                    className="exam-card fade-in"
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: '14px',
                      padding: '18px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Patient Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '15px', fontWeight: '700', color: theme.textPrimary,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>
                          {patient.age}y {patient.sex === 'Female' ? '♀' : '♂'}
                        </div>
                      </div>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.info}, ${theme.skyBlue})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: '800', color: '#fff',
                        flexShrink: 0,
                      }}>
                        {patient.first_name?.charAt(0)?.toUpperCase()}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: theme.cardBorder }} />

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: theme.textSecondary }}>
                        <span>🩺</span>
                        <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {patient.radiology_exam}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: theme.textMuted }}>
                        <span>🕒</span>
                        <span>{formatDateTime(patient.date_time)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: theme.textMuted }}>
                        <span>👤</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {patient.employee_name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleShowRadiologyResults(patient)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '9px', border: 'none',
                        background: buttonColor, 
                        color: '#fff',
                        fontSize: '13px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginTop: 'auto', alignSelf: 'flex-start',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = buttonHoverColor}
                      onMouseLeave={e => e.currentTarget.style.background = buttonColor}
                    >
                      🔍 View / Edit Results
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isRadiologyResultsModalOpen && (
        <RadiologyResultsModal5
          patient={selectedPatient}
          clinicDetails={clinicDetails}
          onClose={handleCloseModal}
          token={urlToken.current}
        />
      )}
      {isTemplatesPromptOpen && (
        <RadiologyTemplatesPrompt
          onClose={handleCloseTemplatesPrompt}
          token={urlToken.current}
        />
      )}

      
    </div>
  );
};

export default RadiographerDashboard;
