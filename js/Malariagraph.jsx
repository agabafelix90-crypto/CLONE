import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { faSpinner, faPrint, faEye, faTimes, faMars, faVenus, faFilter, faCalendarAlt, faVirus, faUndoAlt, faUsers, faChartBar, faTable, faChevronDown, faChevronUp, faStethoscope, faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import { getAuthConfig, getVerifiedToken } from './authUtils';
import html2pdf from 'html2pdf.js';
import Topbar from './Topbar';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
};

const getCurrentYearRange = () => {
  const y = new Date().getFullYear();
  return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
};

function Malariagraph() {
  const [dataAvailable, setDataAvailable]           = useState(true);
  const [selectedSex, setSelectedSex]               = useState('Both');
  const [selectedYear, setSelectedYear]             = useState(new Date().getFullYear());
  const [selectedDiseaseId, setSelectedDiseaseId]   = useState('');
  const [selectedDiseaseName, setSelectedDiseaseName] = useState('Malaria');
  const [barChartData, setBarChartData]             = useState([]);
  const [loading, setLoading]                       = useState(false);
  const [viewMode, setViewMode]                     = useState('statistics');
  const [diseaseStats, setDiseaseStats]             = useState([]);
  const [totalCases, setTotalCases]                 = useState(0);
  const [dateRange, setDateRange]                   = useState({ start: '', end: '' });
  const [showPatientModal, setShowPatientModal]     = useState(false);
  const [selectedPatients, setSelectedPatients]     = useState([]);
  const [selectedModalDiseaseName, setSelectedModalDiseaseName] = useState('');
  const [patientDetails, setPatientDetails]         = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false);
  const [hoveredNavItem, setHoveredNavItem]         = useState(null);
  const [currentTheme, setCurrentTheme]             = useState('blue');
  const [employeeName, setEmployeeName]             = useState('');
  const [clinicName, setClinicName]                 = useState('');
  const [isValidating, setIsValidating]             = useState(true);
  const [allDiseases, setAllDiseases]               = useState([]);
  const [diseaseCounts, setDiseaseCounts]           = useState([]);
  const [filterSectionOpen, setFilterSectionOpen]   = useState(true);
  const [animatedRows, setAnimatedRows]             = useState([]);

  // ── Separate date states per view ─────────────────────────────────────────
  const monthRange = getCurrentMonthRange();
  const yearRange  = getCurrentYearRange();

  // Statistics: default = current month
  const [statsStartDate, setStatsStartDate] = useState(monthRange.startDate);
  const [statsEndDate,   setStatsEndDate]   = useState(monthRange.endDate);
  const [statsAgeRange,  setStatsAgeRange]  = useState({ min: 0, max: 120 });

  // Bar graph: default = full current year
  const [graphStartDate, setGraphStartDate] = useState(yearRange.startDate);
  const [graphEndDate,   setGraphEndDate]   = useState(yearRange.endDate);
  const [graphAgeRange,  setGraphAgeRange]  = useState({ min: 0, max: 120 });

  // Debounce timer refs for age inputs
  const statsAgeTimerRef = useRef(null);
  const graphAgeTimerRef = useRef(null);

  // Local display state for age inputs (shows immediately, debounces fetch)
  const [statsAgeDisplay, setStatsAgeDisplay] = useState({ min: 0, max: 120 });
  const [graphAgeDisplay, setGraphAgeDisplay] = useState({ min: 0, max: 120 });

  const navigate = useNavigate();
  const token = getVerifiedToken();
  const urlTheme = parseThemeFromSearch(window.location.search);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const colors = {
    blue: {
      sidebarBg: '#0a1e4a', sidebarBorder: '#1e3a8a', activeNavBg: '#2563eb',
      activeNavText: '#ffffff', inactiveNavText: '#e0e7ff', navHoverBg: '#1e3a8a',
      sectionHeaderText: '#94a3b8', mainBg: '#f8fafc', cardBg: '#ffffff',
      cardBorder: '#e2e8f0', accent: '#16a34a', accentLight: '#dcfce7',
      danger: '#dc2626', warning: '#d97706', info: '#2563eb', skyBlue: '#38bdf8',
      textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#64748b',
      headerBg: '#ffffff', tableHeader: '#f1f5f9', tableRowHover: '#eff6ff',
      tableBorder: '#e2e8f0',
      badgeGreen: { bg: '#dcfce7', text: '#166534' }, badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' }, badgeGray: { bg: '#f1f5f9', text: '#475569' },
      modalOverlay: 'rgba(0,0,0,0.5)', modalBg: '#ffffff', pureWhite: '#ffffff',
      iconBright: '#fbbf24', filterSection: '#0d2257',
      filterInputBg: 'rgba(255,255,255,0.08)', filterInputBorder: 'rgba(255,255,255,0.15)',
      filterInputText: '#e0e7ff', filterLabelColor: '#94a3b8',
    },
    white: {
      sidebarBg: '#ffffff', sidebarBorder: '#e2e8f0', activeNavBg: '#2563eb',
      activeNavText: '#ffffff', inactiveNavText: '#334155', navHoverBg: '#f1f5f9',
      sectionHeaderText: '#64748b', mainBg: '#f8fafc', cardBg: '#ffffff',
      cardBorder: '#e2e8f0', accent: '#16a34a', accentLight: '#dcfce7',
      danger: '#dc2626', warning: '#d97706', info: '#2563eb', skyBlue: '#38bdf8',
      textPrimary: '#0f172a', textSecondary: '#334155', textMuted: '#64748b',
      headerBg: '#ffffff', tableHeader: '#f8fafc', tableRowHover: '#f1f5f9',
      tableBorder: '#e2e8f0',
      badgeGreen: { bg: '#dcfce7', text: '#166534' }, badgeRed: { bg: '#fee2e2', text: '#991b1b' },
      badgeBlue: { bg: '#dbeafe', text: '#1e40af' }, badgeGray: { bg: '#f1f5f9', text: '#334155' },
      modalOverlay: 'rgba(0,0,0,0.3)', modalBg: '#ffffff', pureWhite: '#ffffff',
      iconBright: '#f59e0b', filterSection: '#f8fafc',
      filterInputBg: '#ffffff', filterInputBorder: '#e2e8f0',
      filterInputText: '#0f172a', filterLabelColor: '#64748b',
    },
  };
  const theme = colors[currentTheme];

  const styles = {
    card: { background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    badge: (type) => {
      const map = { green: theme.badgeGreen, red: theme.badgeRed, blue: theme.badgeBlue, gray: theme.badgeGray };
      const c = map[type] || map.gray;
      return { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: c.bg, color: c.text };
    },
    th: (width = 'auto') => ({ 
      padding: '12px 16px', 
      textAlign: 'left', 
      fontSize: '11px', 
      fontWeight: '700', 
      textTransform: 'uppercase', 
      letterSpacing: '0.06em', 
      color: theme.textSecondary, 
      background: theme.tableHeader, 
      borderBottom: `1px solid ${theme.tableBorder}`, 
      whiteSpace: 'nowrap',
      width: width
    }),
    td: { padding: '13px 16px', fontSize: '13.5px', color: theme.textPrimary, borderBottom: `1px solid ${theme.tableBorder}`, verticalAlign: 'middle', transition: 'background 0.2s ease' },
    filterLabel: { fontSize: '11px', fontWeight: '700', color: theme.filterLabelColor, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    filterInput: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${theme.filterInputBorder}`, background: theme.filterInputBg, color: theme.filterInputText, fontSize: '12px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' },
    select: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${theme.filterInputBorder}`, background: theme.filterInputBg, color: theme.filterInputText, fontSize: '12px', outline: 'none', cursor: 'pointer' },
    buttonPrimary: { background: theme.activeNavBg, color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px' },
    stickyHeader: { position: 'sticky', top: 0, zIndex: 10, background: theme.headerBg, padding: '14px 28px', borderBottom: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: theme.modalBg, borderRadius: '16px', padding: '32px', maxWidth: '1000px', width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'modalSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' },
    tableWrapper: { background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  };

  // ── Security check (runs once) ─────────────────────────────────────────────
  useEffect(() => {
    performSecurityCheck(token);
  }, [token]);

  // Theme fetch (runs once)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(urls.security, getAuthConfig({
          method: 'POST',
          body: JSON.stringify({ token }),
        }));
        if (res.ok) {
          const data = await res.json();
          const themeColor = data.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          setEmployeeName(data.employee_name || '');
          setClinicName(data.clinic || '');
        }
      } catch (e) { console.error(e); }
    })();
  }, [token, urlTheme]);

  // ── Re-fetch when filters change (NO full page refresh) ───────────────────
  useEffect(() => {
    if (viewMode === 'statistics') fetchAllDiseasesStatistics(token);
  }, [viewMode, statsStartDate, statsEndDate, statsAgeRange, selectedDiseaseId, token]);

  useEffect(() => {
    if (viewMode === 'bargraph') fetchBarGraphData(token);
  }, [viewMode, graphStartDate, graphEndDate, graphAgeRange, selectedSex, selectedDiseaseId, token]);

  // Animate rows when disease stats update
  useEffect(() => {
    if (diseaseStats.length > 0) {
      setAnimatedRows([]);
      diseaseStats.forEach((_, i) => setTimeout(() => setAnimatedRows(prev => [...prev, i]), i * 40));
    }
  }, [diseaseStats]);

  // ── Security / initial fetch ───────────────────────────────────────────────
  const performSecurityCheck = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(urls.security, getAuthConfig({
        method: 'POST',
        body: JSON.stringify({ token }),
      }));
      if (res.ok) {
        const data = await res.json();
        if (data.message === 'Session valid') {
          setIsValidating(false);
          fetchAllDiseasesStatistics(token);
        } else if (data.error === 'Session expired') {
          navigate(`/dashboard?token=${data.clinic_session_token}`);
        } else { navigate('/login'); }
      } else throw new Error('Security check failed');
    } catch (e) { console.error(e); navigate('/login'); }
    finally { setLoading(false); }
  };

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchAllDiseasesStatistics = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(urls.fetchalldiseasestatitics, getAuthConfig({
        method: 'POST',
        body: JSON.stringify({ token, startDate: statsStartDate, endDate: statsEndDate, ageRange: statsAgeRange, diseaseId: selectedDiseaseId || undefined }),
      }));
      const data = await res.json();
      if (data.error) { setDataAvailable(false); return; }
      setPatientDetails(data.patient_details || []);
      setAllDiseases(data.all_diseases || []);
      setDiseaseCounts(data.disease_counts || []);
      setDiseaseStats(processDiseaseStats(data));
      setTotalCases(data.summary?.total_disease_cases || 0);
      setDateRange({ start: data.date_range?.start || statsStartDate, end: data.date_range?.end || statsEndDate });
      setDataAvailable(true);
    } catch (e) { console.error(e); setDataAvailable(false); }
    finally { setLoading(false); }
  };

  const fetchBarGraphData = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(urls.diseasebargraph, getAuthConfig({
        method: 'POST',
        body: JSON.stringify({ token, ageRange: graphAgeRange, sex: selectedSex, startDate: graphStartDate, endDate: graphEndDate, diseaseId: selectedDiseaseId || 1 }),
      }));
      const data = await res.json();
      if (data.error) { setDataAvailable(false); return; }
      const counts = new Array(12).fill(0);
      data.data.forEach(item => { counts[item.month - 1] = item.count; });
      setBarChartData(counts);
      setDataAvailable(true);
    } catch (e) { console.error(e); setDataAvailable(false); }
    finally { setLoading(false); }
  };

  // ── Data processors ────────────────────────────────────────────────────────
  const processDiseaseStats = (data) => {
    const allDiseasesList   = data.all_diseases || [];
    const diseaseCountsList = data.disease_counts || [];
    const patientDetailsList= data.patient_details || [];
    const countMap = new Map();
    diseaseCountsList.forEach(dc => countMap.set(dc.disease_id, { total: dc.count, male: 0, female: 0 }));
    patientDetailsList.forEach(p => {
      if (countMap.has(p.disease_id)) {
        if (p.sex === 'Male') countMap.get(p.disease_id).male++;
        else if (p.sex === 'Female') countMap.get(p.disease_id).female++;
      }
    });
    return allDiseasesList.map(disease => ({
      id: disease.id, name: disease.disease,
      total: countMap.get(disease.id)?.total  || 0,
      male:  countMap.get(disease.id)?.male   || 0,
      female:countMap.get(disease.id)?.female || 0,
    })).sort((a, b) => b.total - a.total);
  };

  const getSortedDiseasesForDropdown = () =>
    [...(allDiseases || [])].sort((a, b) => a.disease.localeCompare(b.disease));

  const activeDiseases   = diseaseStats.filter(d => d.total > 0);
  const inactiveDiseases = diseaseStats.filter(d => d.total === 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  // Stats age — debounced 500 ms
  const handleStatsAgeChange = (e) => {
    const { name, value } = e.target;
    setStatsAgeDisplay(prev => ({ ...prev, [name]: value }));
    clearTimeout(statsAgeTimerRef.current);
    statsAgeTimerRef.current = setTimeout(() => {
      setStatsAgeRange(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    }, 500);
  };

  // Graph age — debounced 500 ms
  const handleGraphAgeChange = (e) => {
    const { name, value } = e.target;
    setGraphAgeDisplay(prev => ({ ...prev, [name]: value }));
    clearTimeout(graphAgeTimerRef.current);
    graphAgeTimerRef.current = setTimeout(() => {
      setGraphAgeRange(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    }, 500);
  };

  const handleSexChange     = (e) => setSelectedSex(e.target.value);
  const handleDiseaseChange = (e) => {
    const id = e.target.value;
    setSelectedDiseaseId(id);
    const d = allDiseases.find(x => x.id === parseInt(id));
    if (d) setSelectedDiseaseName(d.disease);
  };

  const handleResetStatsFilters = () => {
    setStatsStartDate(monthRange.startDate);
    setStatsEndDate(monthRange.endDate);
    setStatsAgeRange({ min: 0, max: 120 });
    setStatsAgeDisplay({ min: 0, max: 120 });
    setSelectedDiseaseId('');
  };

  const handleResetGraphFilters = () => {
    setGraphStartDate(yearRange.startDate);
    setGraphEndDate(yearRange.endDate);
    setGraphAgeRange({ min: 0, max: 120 });
    setGraphAgeDisplay({ min: 0, max: 120 });
    setSelectedSex('Both');
    setSelectedDiseaseId('');
    setSelectedYear(new Date().getFullYear());
  };

  // When switching to bar graph, reset graph dates to full year (if they haven't been touched)
  const handleViewChange = (newView) => {
    setViewMode(newView);
    if (newView === 'bargraph') {
      // Always restore year-range defaults when entering bar graph view
      setGraphStartDate(`${selectedYear}-01-01`);
      setGraphEndDate(`${selectedYear}-12-31`);
    }
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setSelectedYear(y);
    setGraphStartDate(`${y}-01-01`);
    setGraphEndDate(`${y}-12-31`);
  };

  const handleViewPatients = (diseaseName, diseaseId) => {
    // Filter patients and include exact_diagnosis from the response
    const filteredPatients = patientDetails.filter(p => p.disease_name === diseaseName || p.disease_id === diseaseId);
    setSelectedPatients(filteredPatients);
    setSelectedModalDiseaseName(diseaseName);
    setShowPatientModal(true);
  };

  const closeModal = () => { setShowPatientModal(false); setSelectedPatients([]); setSelectedModalDiseaseName(''); };

  const handlePrint = () => {
    const element = document.getElementById('bar-chart-container');
    html2pdf().set({ margin: 5, filename: `BarGraph_${selectedDiseaseName}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 1.5, useCORS: true }, jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a3', compressPDF: true } }).from(element).save();
  };

  // ── Chart config ───────────────────────────────────────────────────────────
  const barChartDataConfig = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [{
      label: `${selectedDiseaseName} cases — ${selectedSex} — Age ${graphAgeRange.min}-${graphAgeRange.max}`,
      backgroundColor: currentTheme === 'blue' ? 'rgba(59,130,246,0.8)' : 'rgba(37,99,235,0.8)',
      borderColor: currentTheme === 'blue' ? '#1d4ed8' : '#1e40af',
      borderWidth: 1, hoverBackgroundColor: '#60a5fa', borderRadius: 6,
      data: barChartData,
    }],
  };

  const barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      title: { display: true, text: `${selectedDiseaseName} — Monthly Cases (${selectedYear})`, font: { weight: 'bold', size: 16 }, color: theme.textPrimary },
      tooltip: { enabled: true, backgroundColor: theme.sidebarBg, titleColor: '#fff', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8 },
      legend: { labels: { color: theme.textPrimary, font: { size: 12 } } },
    },
    scales: {
      x: { title: { display: true, text: 'Month', font: { weight: 'bold', size: 13 }, color: theme.textSecondary }, ticks: { color: theme.textSecondary }, grid: { color: theme.tableBorder } },
      y: { title: { display: true, text: 'Number of Cases', font: { weight: 'bold', size: 13 }, color: theme.textSecondary }, ticks: { color: theme.textSecondary }, grid: { color: theme.tableBorder }, beginAtZero: true },
    },
  };

  const navSections = [{ label: 'VIEWS', items: [{ id: 'statistics', icon: '📊', label: 'Disease Statistics' }, { id: 'bargraph', icon: '📈', label: 'Bar Graph Analysis' }] }];

  // ── SIDEBAR FILTERS ────────────────────────────────────────────────────────
  const renderSidebarFilters = () => {
    const isDark = currentTheme === 'blue';
    const inputStyle = { ...styles.filterInput, marginBottom: '0' };
    const labelStyle = styles.filterLabel;

    return (
      <div style={{ padding: 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
        {!sidebarCollapsed && (
          <div>
            <button
              onClick={() => setFilterSectionOpen(!filterSectionOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', borderBottom: `1px solid ${theme.sidebarBorder}`, color: isDark ? '#e0e7ff' : theme.textPrimary, cursor: 'pointer', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faFilter} style={{ color: isDark ? '#60a5fa' : theme.info }} />
                Filters {viewMode === 'statistics' ? '— Statistics' : '— Bar Graph'}
              </span>
              <FontAwesomeIcon icon={filterSectionOpen ? faChevronUp : faChevronDown} style={{ fontSize: '10px', opacity: 0.7 }} />
            </button>

            {filterSectionOpen && (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'filterSlideDown 0.25s ease' }}>

                {/* ── STATISTICS-specific filters ── */}
                {viewMode === 'statistics' && (
                  <>
                    {/* Date Range */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faCalendarAlt} /> Date Range</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input type="date" value={statsStartDate} onChange={e => setStatsStartDate(e.target.value)} style={inputStyle} />
                        <div style={{ fontSize: '10px', color: theme.filterLabelColor, textAlign: 'center', opacity: 0.7 }}>to</div>
                        <input type="date" value={statsEndDate} onChange={e => setStatsEndDate(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Age Range */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faUsers} /> Age Range (years)</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="number" name="min" value={statsAgeDisplay.min} onChange={handleStatsAgeChange} placeholder="Min" style={{ ...inputStyle, width: '50%' }} />
                        <span style={{ color: theme.filterLabelColor, fontSize: '11px' }}>–</span>
                        <input type="number" name="max" value={statsAgeDisplay.max} onChange={handleStatsAgeChange} placeholder="Max" style={{ ...inputStyle, width: '50%' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: theme.filterLabelColor, marginTop: '4px', opacity: 0.7 }}>Applies after 0.5s pause in typing</div>
                    </div>

                    {/* Disease Filter */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faVirus} /> Filter by Disease</div>
                      <select value={selectedDiseaseId} onChange={handleDiseaseChange} style={styles.select}>
                        <option value="">All Diseases</option>
                        {getSortedDiseasesForDropdown().map(d => <option key={d.id} value={d.id}>{d.disease}</option>)}
                      </select>
                    </div>

                    {/* Reset */}
                    <button onClick={handleResetStatsFilters} style={{ ...styles.buttonPrimary, background: isDark ? 'rgba(217,119,6,0.85)' : '#d97706', width: '100%', justifyContent: 'center', padding: '9px 12px', borderRadius: '8px', fontSize: '11.5px' }}>
                      <FontAwesomeIcon icon={faUndoAlt} /> Reset Filters
                    </button>
                  </>
                )}

                {/* ── BAR GRAPH-specific filters ── */}
                {viewMode === 'bargraph' && (
                  <>
                    {/* Year selector */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faCalendarAlt} /> Year</div>
                      <select value={selectedYear} onChange={handleYearChange} style={styles.select}>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom date range (overrides year picker) */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faCalendarAlt} /> Custom Date Range</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input type="date" value={graphStartDate} onChange={e => setGraphStartDate(e.target.value)} style={inputStyle} />
                        <div style={{ fontSize: '10px', color: theme.filterLabelColor, textAlign: 'center', opacity: 0.7 }}>to</div>
                        <input type="date" value={graphEndDate} onChange={e => setGraphEndDate(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Age Range */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faUsers} /> Age Range (years)</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="number" name="min" value={graphAgeDisplay.min} onChange={handleGraphAgeChange} placeholder="Min" style={{ ...inputStyle, width: '50%' }} />
                        <span style={{ color: theme.filterLabelColor, fontSize: '11px' }}>–</span>
                        <input type="number" name="max" value={graphAgeDisplay.max} onChange={handleGraphAgeChange} placeholder="Max" style={{ ...inputStyle, width: '50%' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: theme.filterLabelColor, marginTop: '4px', opacity: 0.7 }}>Applies after 0.5s pause in typing</div>
                    </div>

                    {/* Sex */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faUsers} /> Sex</div>
                      <select value={selectedSex} onChange={handleSexChange} style={styles.select}>
                        <option value="Both">Both</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {/* Disease selector (required for bar graph) */}
                    <div>
                      <div style={labelStyle}><FontAwesomeIcon icon={faVirus} /> Disease</div>
                      <select value={selectedDiseaseId} onChange={handleDiseaseChange} style={styles.select}>
                        {getSortedDiseasesForDropdown().map(d => <option key={d.id} value={d.id}>{d.disease}</option>)}
                      </select>
                    </div>

                    {/* Reset */}
                    <button onClick={handleResetGraphFilters} style={{ ...styles.buttonPrimary, background: isDark ? 'rgba(217,119,6,0.85)' : '#d97706', width: '100%', justifyContent: 'center', padding: '9px 12px', borderRadius: '8px', fontSize: '11.5px' }}>
                      <FontAwesomeIcon icon={faUndoAlt} /> Reset Filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {sidebarCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
            <div title="Expand sidebar to access filters" style={{ color: isDark ? '#60a5fa' : theme.info, fontSize: '16px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faFilter} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Statistics view ────────────────────────────────────────────────────────
  const renderStatisticsView = () => (
    <div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '16px' }}>
          <div style={{ position: 'relative', width: '60px', height: '60px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.info}`, animation: 'spin 0.8s linear infinite', position: 'absolute' }} />
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `3px solid transparent`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 1.2s linear infinite reverse', position: 'absolute', top: '8px', left: '8px' }} />
          </div>
          <div style={{ color: theme.textMuted, fontSize: '13px', fontWeight: '500', animation: 'pulse 1.5s ease-in-out infinite' }}>Loading disease data...</div>
        </div>
      ) : dataAvailable ? (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
          {/* Summary Banner */}
          <div style={{ background: currentTheme === 'blue' ? 'linear-gradient(135deg,#0a1e4a 0%,#1e3a8a 50%,#2563eb 100%)' : 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', padding: '20px 24px', borderRadius: '14px', marginBottom: '24px', color: currentTheme === 'blue' ? '#ffffff' : theme.textPrimary, boxShadow: currentTheme === 'blue' ? '0 4px 20px rgba(37,99,235,0.3)' : '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '36px', animation: 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>📊</div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500', marginBottom: '2px' }}>Total Disease Cases</div>
              <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1 }}>{totalCases.toLocaleString()}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>Period</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{new Date(dateRange.start).toLocaleDateString()} → {new Date(dateRange.end).toLocaleDateString()}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>Age {statsAgeRange.min}–{statsAgeRange.max} yrs</div>
            </div>
          </div>

          {/* Active diseases */}
          {activeDiseases.length > 0 && (
            <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.5s ease 0.1s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>🦠</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>Diseases with Reported Cases</h3>
                <span style={{ ...styles.badge('green'), animation: 'pulse 2s ease infinite' }}>{activeDiseases.length} active</span>
              </div>
              <div style={styles.tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th('40px')}>#</th>
                      <th style={styles.th()}>Disease</th>
                      <th style={styles.th('100px')}><FontAwesomeIcon icon={faMars} style={{ color: '#2563eb' }} /> Male</th>
                      <th style={styles.th('100px')}><FontAwesomeIcon icon={faVenus} style={{ color: '#c2185b' }} /> Female</th>
                      <th style={styles.th('120px')}>Total Cases</th>
                      <th style={styles.th('140px')}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDiseases.map((disease, index) => (
                      <tr key={disease.id} className="table-row" style={{ opacity: animatedRows.includes(index) ? 1 : 0, transform: animatedRows.includes(index) ? 'translateX(0)' : 'translateX(-12px)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
                        <td style={{ ...styles.td, width: '40px', textAlign: 'center', fontWeight: '600', color: theme.textMuted }}>{index + 1}</td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s ease infinite', flexShrink: 0 }} />
                            {disease.name}
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: '#2563eb', fontWeight: '600' }}>{disease.male}</td>
                        <td style={{ ...styles.td, color: '#c2185b', fontWeight: '600' }}>{disease.female}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: disease.total > 50 ? '#dc2626' : disease.total > 20 ? '#d97706' : theme.accent }}>{disease.total}</span>
                            <div style={{ height: '6px', width: `${Math.min(80, (disease.total / (activeDiseases[0]?.total || 1)) * 80)}px`, borderRadius: '3px', background: disease.total > 50 ? '#dc2626' : disease.total > 20 ? '#d97706' : '#16a34a', transition: 'width 0.6s ease', flexShrink: 0 }} />
                          </div>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => handleViewPatients(disease.name, disease.id)} className="view-btn" style={{ ...styles.buttonPrimary, padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}>
                            <FontAwesomeIcon icon={faEye} /> View Patients
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inactive diseases */}
          {inactiveDiseases.length > 0 && (
            <div style={{ animation: 'fadeInUp 0.5s ease 0.2s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>Diseases with No Reported Cases</h3>
                <span style={styles.badge('gray')}>{inactiveDiseases.length} diseases</span>
                <span style={{ fontSize: '12px', color: theme.textMuted, marginLeft: '4px' }}>— No cases in selected period</span>
              </div>
              <div style={{ ...styles.tableWrapper, opacity: 0.8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th('40px'), background: '#f8fafc' }}>#</th>
                      <th style={{ ...styles.th(), background: '#f8fafc' }}>Disease</th>
                      <th style={{ ...styles.th('100px'), background: '#f8fafc' }}>Male</th>
                      <th style={{ ...styles.th('100px'), background: '#f8fafc' }}>Female</th>
                      <th style={{ ...styles.th('120px'), background: '#f8fafc' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveDiseases.map((disease, index) => (
                      <tr key={disease.id} className="table-row">
                        <td style={{ ...styles.td, width: '40px', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>{index + 1}</td>
                        <td style={{ ...styles.td, color: theme.textMuted, fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.cardBorder, flexShrink: 0 }} />
                            {disease.name}
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>0</td>
                        <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>0</td>
                        <td style={{ ...styles.td, color: theme.textMuted, fontWeight: '600', fontSize: '12px' }}>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeDiseases.length === 0 && (
            <div style={{ ...styles.card, textAlign: 'center', padding: '48px', animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>No Disease Cases Found</div>
              <div style={{ fontSize: '14px', color: theme.textMuted }}>No cases were recorded for the selected filters and date range.</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px', animation: 'fadeInUp 0.4s ease' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: theme.textMuted, fontSize: '14px' }}>No data found for the selected filters</p>
        </div>
      )}
    </div>
  );

  // ── Bar Graph view ─────────────────────────────────────────────────────────
  const renderBarGraphView = () => (
    <div>
      <div style={{ ...styles.card, animation: 'fadeInUp 0.4s ease' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '16px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `3px solid ${theme.cardBorder}`, borderTop: `3px solid ${theme.info}`, animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: theme.textMuted, fontSize: '13px', animation: 'pulse 1.5s ease infinite' }}>Loading chart data...</div>
          </div>
        ) : dataAvailable ? (
          <div id="bar-chart-container" style={{ width: '100%', height: '420px' }}>
            <Bar data={barChartDataConfig} options={barChartOptions} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📉</div>
            <p style={{ fontSize: '14px' }}>No data found for the selected filters</p>
          </div>
        )}
      </div>
      {dataAvailable && !loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', animation: 'fadeInUp 0.4s ease 0.2s both' }}>
          <button onClick={handlePrint} style={{ ...styles.buttonPrimary, padding: '10px 20px', fontSize: '13px' }}>
            <FontAwesomeIcon icon={faPrint} /> Export as PDF
          </button>
        </div>
      )}
    </div>
  );

  // ── Patient modal (updated to include exact_diagnosis) ─────────────────────
  const PatientModal = () => {
    if (!showPatientModal) return null;
    return (
      <div style={styles.modalOverlay} onClick={closeModal}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '28px' }}>👥</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>{selectedModalDiseaseName} Patients</h2>
              <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{selectedPatients.length} patient{selectedPatients.length !== 1 ? 's' : ''} found</p>
            </div>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: theme.textMuted, marginLeft: 'auto', padding: '4px 8px', borderRadius: '6px' }}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th('40px')}>#</th>
                  <th style={styles.th()}>Patient Name</th>
                  <th style={styles.th('80px')}>Sex</th>
                  <th style={styles.th('70px')}>Age</th>
                  <th style={styles.th('120px')}>Phone</th>
                  <th style={styles.th()}>Saved Diagnosis</th>
                  <th style={styles.th('120px')}>Date</th>
                </tr>
              </thead>
              <tbody>
                {selectedPatients.length === 0 ? (
                  <tr><td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: theme.textMuted }}>No patients found</td></tr>
                ) : (
                  selectedPatients.map((patient, index) => (
                    <tr key={index} className="table-row" style={{ animation: `fadeInUp 0.3s ease ${index * 0.03}s both` }}>
                      <td style={{ ...styles.td, width: '40px', textAlign: 'center', fontWeight: '600', color: theme.textMuted }}>{index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{patient.patient_name}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(patient.sex === 'Male' ? 'blue' : 'red')}>
                          {patient.sex === 'Male' ? <FontAwesomeIcon icon={faMars} /> : <FontAwesomeIcon icon={faVenus} />}
                          {patient.sex}
                        </span>
                      </td>
                      <td style={styles.td}>{patient.age}</td>
                      <td style={{ ...styles.td, color: theme.textMuted }}>{patient.phone_number || 'N/A'}</td>
                      <td style={{ ...styles.td, maxWidth: '250px', wordWrap: 'break-word' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <FontAwesomeIcon icon={faNotesMedical} style={{ color: theme.info, fontSize: '12px' }} />
                          <span style={{ fontWeight: '500', color: theme.textPrimary }}>
                            {patient.exact_diagnosis || 'No diagnosis recorded'}
                          </span>
                        </div>
                        {patient.disease_categorization && patient.disease_categorization !== 'Not categorized' && (
                          <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', marginLeft: '20px' }}>
                            Category: {patient.disease_categorization}
                          </div>
                        )}
                      </td>
                      <td style={{ ...styles.td, color: theme.textMuted, fontSize: '12px' }}>
                        {new Date(patient.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ ...styles.buttonPrimary, background: theme.textMuted }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', background: theme.sidebarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `3px solid rgba(255,255,255,0.1)`, borderTop: `3px solid ${theme.accent}`, animation: 'spin 0.8s linear infinite', position: 'absolute' }} />
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `3px solid transparent`, borderTop: `3px solid #60a5fa`, animation: 'spin 1.2s linear infinite reverse', position: 'absolute', top: '8px', left: '8px' }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', letterSpacing: '0.05em', animation: 'pulse 1.5s ease infinite' }}>Loading Disease Dashboard...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif", background: theme.pureWhite }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${currentTheme==='blue'?'#1e293b':'#f1f5f9'}}
        ::-webkit-scrollbar-thumb{background:${currentTheme==='blue'?'#475569':'#cbd5e1'};border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounceIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
        @keyframes modalSlideIn{from{opacity:0;transform:scale(.92) translateY(-20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes filterSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .table-row:hover td{background:${theme.tableRowHover}!important;transition:background .15s ease}
        .nav-item:hover{background:${theme.navHoverBg}!important;color:${currentTheme==='blue'?'#ffffff':theme.textPrimary}!important}
        .view-btn:hover{background:#1d4ed8!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.3)}
        .collapse-btn:hover{background:${theme.navHoverBg}!important;transform:scale(1.05)}
        input[type="date"]:focus,input[type="number"]:focus,select:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,.2)!important}
      `}</style>

      <div style={{ width: '100%' }}><Topbar token={token} themeColor={currentTheme} /></div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, marginTop: '64px' }}>

        {/* Sidebar */}
        <aside style={{ width: sidebarCollapsed ? '72px' : '260px', background: theme.sidebarBg, display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: `1px solid ${theme.sidebarBorder}`, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden', boxShadow: currentTheme==='blue'?'2px 0 8px rgba(0,0,0,.15)':'2px 0 8px rgba(0,0,0,.05)', transition: 'width .3s cubic-bezier(.4,0,.2,1)' }}>

          {/* Logo */}
          <div style={{ padding: sidebarCollapsed?'16px 12px':'18px 16px', borderBottom:`1px solid ${theme.sidebarBorder}`, display:'flex', alignItems:'center', justifyContent:sidebarCollapsed?'center':'space-between', background:currentTheme==='blue'?'rgba(0,0,0,0.2)':theme.tableHeader, minHeight:'72px', flexShrink:0 }}>
            {!sidebarCollapsed && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', animation:'fadeInUp .3s ease' }}>
                <div style={{ width:'40px', height:'40px', background:theme.activeNavBg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:'#fff', fontWeight:'800', boxShadow:'0 4px 12px rgba(37,99,235,.3)', flexShrink:0 }}>CP</div>
                <div>
                  <div style={{ color:currentTheme==='blue'?'#fff':theme.textPrimary, fontWeight:'700', fontSize:'14px' }}>ClinicPro</div>
                  <div style={{ color:theme.sectionHeaderText, fontSize:'10px', fontWeight:'500' }}>Disease Analytics</div>
                </div>
              </div>
            )}
            <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background:'rgba(255,255,255,0.08)', border:`1px solid ${theme.sidebarBorder}`, color:currentTheme==='blue'?'#e0e7ff':theme.textSecondary, width:'34px', height:'34px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold', transition:'all .2s ease', flexShrink:0 }} title={sidebarCollapsed?'Expand sidebar':'Collapse sidebar'}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Nav */}
          <nav style={{ padding:sidebarCollapsed?'12px 8px':'12px', borderBottom:`1px solid ${theme.sidebarBorder}`, flexShrink:0 }}>
            {!sidebarCollapsed && <div style={{ fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:theme.sectionHeaderText, padding:'0 6px', marginBottom:'6px' }}>Views</div>}
            {navSections[0].items.map(item => (
              <button key={item.id} className="nav-item"
                onClick={() => handleViewChange(item.id)}
                onMouseEnter={() => setHoveredNavItem(item.id)}
                onMouseLeave={() => setHoveredNavItem(null)}
                style={{ display:'flex', alignItems:'center', justifyContent:sidebarCollapsed?'center':'flex-start', gap:'10px', padding:sidebarCollapsed?'10px':'9px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:viewMode===item.id?'700':'500', color:viewMode===item.id?(currentTheme==='blue'?'#fff':theme.textPrimary):(currentTheme==='blue'?theme.inactiveNavText:theme.textSecondary), background:viewMode===item.id?theme.activeNavBg:'transparent', border:'none', width:'100%', marginBottom:'2px', transition:'all .15s ease', position:'relative', boxShadow:viewMode===item.id?'0 2px 8px rgba(37,99,235,.2)':'none' }}
              >
                <span style={{ fontSize:'16px' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
                {sidebarCollapsed && hoveredNavItem === item.id && (
                  <div style={{ position:'absolute', left:'100%', top:'50%', transform:'translateY(-50%)', marginLeft:'10px', padding:'6px 12px', background:'#1e293b', color:'#fff', fontSize:'12px', fontWeight:'500', borderRadius:'6px', whiteSpace:'nowrap', zIndex:1000, boxShadow:'0 4px 12px rgba(0,0,0,.3)', animation:'fadeInUp .15s ease' }}>{item.label}</div>
                )}
              </button>
            ))}
          </nav>

          {/* Filters */}
          <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>{renderSidebarFilters()}</div>

          {/* User footer */}
          <div style={{ padding:sidebarCollapsed?'14px 8px':'14px 16px', borderTop:`1px solid ${theme.sidebarBorder}`, background:currentTheme==='blue'?'rgba(0,0,0,0.2)':theme.tableHeader, flexShrink:0 }}>
            {!sidebarCollapsed ? (
              <div style={{ animation:'fadeInUp .3s ease' }}>
                <div style={{ fontSize:'10px', color:theme.sectionHeaderText, fontWeight:'700', letterSpacing:'0.05em', marginBottom:'3px', textTransform:'uppercase' }}>{clinicName}</div>
                <div style={{ fontSize:'12px', color:currentTheme==='blue'?'#fff':theme.textPrimary, fontWeight:'600' }}>👤 {employeeName}</div>
              </div>
            ) : (
              <div style={{ textAlign:'center', position:'relative', cursor:'pointer' }} onMouseEnter={() => setHoveredNavItem('user')} onMouseLeave={() => setHoveredNavItem(null)}>
                <span style={{ fontSize:'18px' }}>👤</span>
                {hoveredNavItem === 'user' && (
                  <div style={{ position:'absolute', left:'100%', bottom:0, marginLeft:'10px', padding:'8px 12px', background:'#1e293b', color:'#fff', fontSize:'12px', borderRadius:'8px', whiteSpace:'nowrap', zIndex:1000, boxShadow:'0 4px 12px rgba(0,0,0,.3)', animation:'fadeInUp .15s ease' }}>
                    <div style={{ fontWeight:'600' }}>{employeeName}</div>
                    <div style={{ opacity:0.7, fontSize:'11px' }}>{clinicName}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden', background:theme.mainBg, borderRadius:'20px 0 0 0', margin:'12px 12px 12px 0', boxShadow:'0 4px 16px rgba(0,0,0,.06)', transition:'all .3s ease' }}>

          {/* Page header */}
          <div style={styles.stickyHeader}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'22px' }}>{viewMode === 'statistics' ? '📊' : '📈'}</span>
              <div>
                <h1 style={{ fontSize:'16px', fontWeight:'800', color:theme.textPrimary, letterSpacing:'-0.01em' }}>
                  {viewMode === 'statistics' ? 'Disease Statistics Dashboard' : 'Bar Graph Analysis'}
                </h1>
                <p style={{ fontSize:'12px', color:theme.textMuted, marginTop:'1px' }}>
                  {viewMode === 'statistics'
                    ? `${new Date(statsStartDate).toLocaleDateString()} → ${new Date(statsEndDate).toLocaleDateString()} · Age ${statsAgeRange.min}–${statsAgeRange.max} yrs`
                    : `${new Date(graphStartDate).toLocaleDateString()} → ${new Date(graphEndDate).toLocaleDateString()} · Age ${graphAgeRange.min}–${graphAgeRange.max} yrs`}
                </p>
              </div>
            </div>

            {viewMode === 'statistics' && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:currentTheme==='blue'?theme.accentLight:'#f0fdf4', borderRadius:'10px', border:`1px solid ${theme.accent}20` }}>
                <span style={{ fontSize:'16px' }}>🦠</span>
                <div>
                  <div style={{ fontSize:'11px', color:theme.textMuted }}>Total Cases</div>
                  <div style={{ fontSize:'20px', fontWeight:'800', color:theme.accent, lineHeight:1 }}>{totalCases.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Content area */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 28px' }}>
            {viewMode === 'statistics' ? renderStatisticsView() : renderBarGraphView()}
          </div>
        </main>
      </div>

      <PatientModal />
    </div>
  );
}

export default Malariagraph;