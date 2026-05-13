import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LabTemplatesPrompt from './LabTemplatesPrompt';

// ─── DESIGN TOKENS (matching ViewFile) ─────────────────────────────────────
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

// Topbar height constant
const TOPBAR_HEIGHT = 60;

function LabDashboard2() {
  const [pendingLabTestsCount, setPendingLabTestsCount] = useState(0);
  const [employeeName, setEmployeeName] = useState('');
  const [stats, setStats] = useState({ year: 0, month: 0, week: 0, today: 0, pending: 0 });
  const [labTestData, setLabTestData] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));  
  const [endDate, setEndDate] = useState(new Date()); 
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(130);
  const [showTemplates, setShowTemplates] = useState(false);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const navigate = useNavigate();
  
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  
  // ── Check theme from security response ────────────────────────────────────
  useEffect(() => {
    const checkTheme = async () => {
      try {
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();

          if (securityData.message === 'Session valid') {
            const themeColor = securityData.colour || '';
            setCurrentTheme(resolveTheme(urlTheme, themeColor));
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

    checkTheme();
  }, [navigate, urlToken, startDate, endDate, minAge, maxAge]);

  // Get the active theme colors
  const theme = colors[currentTheme];

  const fetchLabStats = async (token) => {
    try {
      const response = await fetch(urls.labtestscount, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
  
      if (response.ok) {
        const data = await response.json();
        
        setStats({
          year: data.total_year || 0,     
          month: data.total_month || 0,   
          week: data.total_week || 0,     
          today: data.total_today || 0,   
          pending: data.total_pending || 0 
        });
      } else {
        throw new Error('Failed to fetch lab stats');
      }
    } catch (error) {
      console.error('Error fetching lab stats:', error);
    }
  };
  
  const fetchLabTestsData = async (token, startDate, endDate, minAge, maxAge) => {
    try {
      const response = await fetch(urls.labstat2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          minAge,
          maxAge
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Lab test data:', data);
        
        if (data.test_results) {
          const filteredTests = Object.entries(data.test_results).filter(([key, test]) => test.total_tests > 0);
          setLabTestData(filteredTests);
        }
        
        if (data.employee_stats) {
          setEmployeeStats(data.employee_stats);
        }
      } else {
        throw new Error('Failed to fetch lab test details');
      }
    } catch (error) {
      console.error('Error fetching lab test details:', error);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchLabStats(urlToken);
    await fetchLabTestsData(urlToken, startDate, endDate, minAge, maxAge);
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleRefreshData();
    }, 30000);
  
    return () => clearInterval(intervalId);
  }, []);
  
  const handleNavigateToPendingExams = () => {
    navigate(`/lab?token=${urlToken}`);
  };

  const handleNavigateToRecentTests = () => {
    navigate(`/labTests?token=${urlToken}`);
  };

  const handleCreateTemplates = () => {
    setShowTemplates(true);
  };

  const handleCloseTemplates = () => {
    setShowTemplates(false);
  };
  
  // Styles helper
  const styles = {
    card: {
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    },
    navItem: (active, collapsed) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: collapsed ? '0' : '12px',
      padding: collapsed ? '12px 0' : '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13.5px',
      fontWeight: active ? '600' : '500',
      color: active ? theme.activeNavText : theme.inactiveNavText,
      background: active ? theme.activeNavBg : 'transparent',
      transition: 'all 0.15s ease',
      width: '100%',
      textAlign: collapsed ? 'center' : 'left',
      border: 'none',
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
        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
        background: c.bg, color: c.text,
      };
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
  };

  // Stat card component for sidebar
  const StatCard = ({ icon, label, value, color, collapsed }) => {
    if (collapsed) {
      return (
        <div
          style={{
            fontSize: '24px',
            color: theme.sidebarText,
            cursor: 'pointer',
            position: 'relative',
            padding: '8px 0',
            textAlign: 'center',
          }}
          onMouseEnter={() => setHoveredItem(label)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div style={{ color: color }}>{icon}</div>
          {hoveredItem === label && (
            <div style={styles.tooltip}>
              {label}: {value}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{
        background: theme.filterSection,
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: `1px solid ${theme.sidebarBorder}`,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(37, 99, 235, 0.2)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: 'white',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: theme.sidebarText }}>{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: theme.mainBg,
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
    }}>
      <Topbar token={urlToken} themeColor={currentTheme} />
      
      {/* Collapsible Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? '80px' : '320px',
        background: theme.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: `1px solid ${theme.sidebarBorder}`,
        position: 'fixed',
        paddingTop: `${TOPBAR_HEIGHT}px`,
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        boxShadow: sidebarCollapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.1)',
        transition: 'width 0.3s ease',
        zIndex: 900,
        color: theme.sidebarText,
      }}>
        {/* Sidebar Header with Collapse Button */}
        <div style={{
          padding: sidebarCollapsed ? '20px 10px' : '20px 16px',
          borderBottom: `2px solid ${theme.sidebarBorder}`,
          display: 'flex',
          flexDirection: sidebarCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.filterSection,
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
              background: theme.activeNavBg,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
              color: theme.activeNavText,
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
            }}>
              🔬
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Laboratory</div>
                <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>{employeeName}</div>
              </div>
            )}
          </div>

          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              ...styles.collapseButton,
              background: theme.collapseButtonBg,
              border: '2px solid rgba(0,0,0,0.05)',
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
        {/* Patients Waiting Button - Animated */}
        <div style={{ padding: sidebarCollapsed ? '0 0 20px 0' : '0 20px 20px 20px' }}>
          {sidebarCollapsed ? (
            <div
              style={{
                fontSize: '28px',
                color: theme.sidebarText,
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'center',
                animation: 'pulse 2s infinite',
              }}
              onMouseEnter={() => setHoveredItem('patientsWaiting')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleNavigateToPendingExams}
            >
              ⏳
              {hoveredItem === 'patientsWaiting' && (
                <div style={styles.tooltip}>
                  {stats.pending} Patients Waiting
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleNavigateToPendingExams}
              style={{
                width: '100%',
                padding: '16px',
                background: `linear-gradient(135deg, ${theme.info}, ${theme.skyBlue})`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: `0 4px 15px ${theme.info}40`,
                animation: 'pulse 2s infinite',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 25px ${theme.info}80`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${theme.info}40`;
              }}
            >
              <span style={{ fontSize: '24px' }}>⏳</span>
              <span>{stats.pending} Patients Waiting</span>
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div style={{ padding: sidebarCollapsed ? '0' : '0 20px 20px 20px' }}>
          <div style={styles.sectionHeader(sidebarCollapsed)}>
            {sidebarCollapsed ? '⚡' : 'ACTIONS'}
          </div>
          
          {/* Create Templates Button */}
          {sidebarCollapsed ? (
            <div
              style={{
                fontSize: '24px',
                color: theme.sidebarText,
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'center',
                padding: '8px 0',
              }}
              onMouseEnter={() => setHoveredItem('createTemplates')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleCreateTemplates}
            >
              📋
              {hoveredItem === 'createTemplates' && (
                <div style={styles.tooltip}>
                  Create Templates
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleCreateTemplates}
              style={{
                ...styles.navItem(false, sidebarCollapsed),
                background: 'transparent',
                border: `1px solid ${theme.sidebarBorder}`,
                marginBottom: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.navHoverBg;
                e.currentTarget.style.color = theme.activeNavText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.inactiveNavText;
              }}
            >
              <span style={{ fontSize: '16px', marginRight: sidebarCollapsed ? '0' : '12px' }}>📋</span>
              {!sidebarCollapsed && 'Create Templates'}
            </button>
          )}

          {/* Recent Tests Button */}
          {sidebarCollapsed ? (
            <div
              style={{
                fontSize: '24px',
                color: theme.sidebarText,
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'center',
                padding: '8px 0',
              }}
              onMouseEnter={() => setHoveredItem('recentTests')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleNavigateToRecentTests}
            >
              📊
              {hoveredItem === 'recentTests' && (
                <div style={styles.tooltip}>
                  Recent Tests
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleNavigateToRecentTests}
              style={{
                ...styles.navItem(false, sidebarCollapsed),
                background: 'transparent',
                border: `1px solid ${theme.sidebarBorder}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.navHoverBg;
                e.currentTarget.style.color = theme.activeNavText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.inactiveNavText;
              }}
            >
              <span style={{ fontSize: '16px', marginRight: sidebarCollapsed ? '0' : '12px' }}>📊</span>
              {!sidebarCollapsed && 'Recent Tests'}
            </button>
          )}
        </div>

        {/* Quick Stats Section */}
        <div style={{ padding: sidebarCollapsed ? '20px 0' : '20px' }}>
          <div style={styles.sectionHeader(sidebarCollapsed)}>
            {sidebarCollapsed ? '📊' : 'QUICK STATISTICS'}
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: sidebarCollapsed ? '16px' : '10px',
            alignItems: sidebarCollapsed ? 'center' : 'stretch',
            padding: sidebarCollapsed ? '0' : '0',
          }}>
            <StatCard 
              icon="📅" 
              label="Tests Today" 
              value={stats.today || 0}
              color={theme.info}
              collapsed={sidebarCollapsed}
            />
            <StatCard 
              icon="📊" 
              label="Tests This Week" 
              value={stats.week || 0}
              color={theme.skyBlue}
              collapsed={sidebarCollapsed}
            />
            <StatCard 
              icon="📈" 
              label="Tests This Month" 
              value={stats.month || 0}
              color={theme.accent}
              collapsed={sidebarCollapsed}
            />
            <StatCard 
              icon="🎯" 
              label="Tests This Year" 
              value={stats.year || 0}
              color={theme.warning}
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>

        

        {/* Employee Performance Section */}
        {employeeStats.length > 0 && (
          <div style={{
            padding: sidebarCollapsed ? '0' : '0 20px 20px 20px',
            marginTop: 'auto',
          }}>
            <div style={{
              borderTop: sidebarCollapsed ? 'none' : `1px solid ${theme.sidebarBorder}`,
              paddingTop: sidebarCollapsed ? '0' : '20px'
            }}>
              <div style={styles.sectionHeader(sidebarCollapsed)}>
                {sidebarCollapsed ? '🏆' : 'TOP PERFORMERS'}
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: sidebarCollapsed ? 'center' : 'stretch',
              }}>
                {employeeStats.slice(0, 3).map((employee, index) => {
                  if (sidebarCollapsed) {
                    return (
                      <div
                        key={index}
                        style={{
                          fontSize: '20px',
                          color: theme.sidebarText,
                          cursor: 'pointer',
                          position: 'relative',
                          textAlign: 'center',
                          padding: '4px 0',
                        }}
                        onMouseEnter={() => setHoveredItem(`performer${index}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        👤
                        {hoveredItem === `performer${index}` && (
                          <div style={styles.tooltip}>
                            {employee.employee_name}: {employee.test_count} tests
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        background: theme.filterSection,
                        borderRadius: '8px',
                        padding: '12px',
                        border: `1px solid ${theme.sidebarBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: theme.info,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>
                          {employee.employee_name}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.sidebarTextMuted }}>
                          {employee.test_count} tests
                        </div>
                      </div>
                      <div style={{
                        ...styles.badge('green'),
                        fontSize: '11px',
                        padding: '2px 8px',
                      }}>
                        {Math.round((employee.test_count / (stats.month || 1)) * 100) || 0}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div style={{
          padding: sidebarCollapsed ? '20px 0' : '20px',
          borderTop: `1px solid ${theme.sidebarBorder}`,
          backgroundColor: theme.filterSection,
          textAlign: 'center',
        }}>
          {sidebarCollapsed ? (
            <div
              style={{
                fontSize: '24px',
                color: theme.sidebarText,
                cursor: 'pointer',
                position: 'relative',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
              onMouseEnter={() => setHoveredItem('refresh')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleRefreshData}
            >
              🔄
              {hoveredItem === 'refresh' && (
                <div style={styles.tooltip}>
                  Refresh Data
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleRefreshData}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: theme.sidebarText,
                border: `1px solid ${theme.sidebarBorder}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.navHoverBg;
                e.currentTarget.style.borderColor = theme.info;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = theme.sidebarBorder;
              }}
              disabled={isRefreshing}
            >
              <span style={{
                display: 'inline-block',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}>
                🔄
              </span>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Container */}
      <div style={{
        marginLeft: sidebarCollapsed ? '80px' : '320px',
        flex: 1,
        padding: '30px',
        marginTop: `${TOPBAR_HEIGHT}px`,
        transition: 'margin-left 0.3s ease',
      }}>
        
        {/* Filters Section */}
        <div style={{
          ...styles.card,
          marginBottom: '30px',
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: '700',
            color: theme.textPrimary,
            marginBottom: '8px',
          }}>
            Laboratory Statistics
          </h2>
          <div style={{ 
            fontSize: '14px', 
            color: theme.textMuted, 
            marginBottom: '25px',
          }}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} | Age: {minAge} - {maxAge} years
          </div>

          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                marginRight: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textSecondary,
                minWidth: '80px'
              }}>
                Start Date:
              </label>
              <DatePicker 
                selected={startDate} 
                onChange={(date) => setStartDate(date)}
                className="custom-datepicker"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                marginRight: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textSecondary,
                minWidth: '80px'
              }}>
                End Date:
              </label>
              <DatePicker 
                selected={endDate} 
                onChange={(date) => setEndDate(date)}
                className="custom-datepicker"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ 
                marginRight: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textSecondary
              }}>
                Age Range:
              </label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                style={{
                  width: '60px',
                  padding: '8px 10px',
                  border: `1px solid ${theme.tableBorder}`,
                  borderRadius: '6px',
                  marginRight: '5px',
                  textAlign: 'center',
                  fontSize: '13px',
                  background: theme.cardBg,
                  color: theme.textPrimary,
                }}
              />
              <span style={{ margin: '0 5px', color: theme.textMuted }}>-</span>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                style={{
                  width: '60px',
                  padding: '8px 10px',
                  border: `1px solid ${theme.tableBorder}`,
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '13px',
                  background: theme.cardBg,
                  color: theme.textPrimary,
                }}
              />
            </div>
          </div>
        </div>

        {/* Lab Test Data Table */}
        {labTestData.length > 0 ? (
          <div style={{
            ...styles.card,
            overflow: 'hidden',
            padding: 0,
          }}>
            <div style={{
              overflowX: 'auto',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    background: theme.tableHeader,
                    borderBottom: `2px solid ${theme.info}`,
                  }}>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'left',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Test Name</th>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Total Tests</th>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Positive Cases</th>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Males Positive</th>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Females Positive</th>
                    <th style={{
                      padding: '18px 24px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      color: theme.textPrimary,
                      textTransform: 'uppercase'
                    }}>Most Positive Ages</th>
                  </tr>
                </thead>
                <tbody>
                  {labTestData.map(([testName, test], index) => (
                    <tr 
                      key={index} 
                      style={{
                        background: index % 2 === 0 ? theme.cardBg : theme.tableHeader,
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.infoLight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? theme.cardBg : theme.tableHeader;
                      }}
                    >
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        fontSize: '14px'
                      }}>
                        {testName}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        textAlign: 'center',
                        color: theme.textSecondary,
                        fontSize: '14px'
                      }}>
                        {test.total_tests}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        textAlign: 'center',
                        color: theme.accent,
                        fontWeight: '700',
                        fontSize: '14px'
                      }}>
                        {test.total_positive}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        textAlign: 'center',
                        color: theme.textPrimary,
                        fontSize: '14px'
                      }}>
                        {test.male_count}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        textAlign: 'center',
                        color: theme.textPrimary,
                        fontSize: '14px'
                      }}>
                        {test.female_count}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        textAlign: 'center',
                        color: theme.textPrimary,
                        minWidth: '150px',
                        fontSize: '14px'
                      }}>
                        {test.most_common_age && test.most_common_age.length > 0 ? 
                          test.most_common_age.join(', ') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{
            ...styles.card,
            padding: '50px',
            textAlign: 'center',
            color: theme.textMuted,
            fontSize: '15px'
          }}>
            No test data available for the selected period and filters.
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <LabTemplatesPrompt 
          token={urlToken}
          onClose={handleCloseTemplates}
        />
      )}

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .custom-datepicker {
            padding: 10px 14px;
            border: 1px solid ${theme.tableBorder};
            border-radius: 6px;
            font-size: 13px;
            width: 150px;
            transition: all 0.2s ease;
            background: ${theme.cardBg};
            color: ${theme.textPrimary};
          }
          
          .custom-datepicker:focus {
            outline: none;
            border-color: ${theme.info};
            box-shadow: 0 0 0 3px ${theme.infoLight};
          }

          .custom-datepicker::placeholder {
            color: ${theme.textMuted};
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: ${theme.tableHeader};
          }

          ::-webkit-scrollbar-thumb {
            background: ${theme.tableBorder};
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: ${theme.textMuted};
          }

          .collapse-btn:hover {
            background: ${theme.collapseButtonHover} !important;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
        `}
      </style>
    </div>
  );
}

export default LabDashboard2;