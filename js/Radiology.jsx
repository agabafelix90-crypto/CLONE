import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import RadiologyResultModal from './RadiologyResultModal';
import { useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  blue: {
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    headerText: '#0f172a',
    subtitleText: '#475569',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    accent: '#16a34a',
    warning: '#d97706',
    examNumberColor: '#2563eb',
    badgeBg: '#f1f5f9',
    badgeText: '#475569',
    totalBg: '#f8fafc',
    totalBorder: '#e2e8f0',
    totalBadgeBg: '#2563eb',
    totalBadgeText: '#ffffff',
    borderBottom: '#e2e8f0',
  },
  white: {
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    headerText: '#0f172a',
    subtitleText: '#475569',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
    info: '#1976d2',
    infoLight: '#e3f2fd',
    skyBlue: '#42a5f5',
    danger: '#f44336',
    dangerLight: '#ffebee',
    accent: '#388e3c',
    warning: '#f57c00',
    examNumberColor: '#1976d2',
    badgeBg: '#f5f5f5',
    badgeText: '#757575',
    totalBg: '#f8f9fa',
    totalBorder: '#e9ecef',
    totalBadgeBg: '#1976d2',
    totalBadgeText: '#ffffff',
    borderBottom: '#f5f5f5',
  }
};

// ─── Global Styles ────────────────────────────────────────────────────────────
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

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Radiology Empty State Animations ──────────────────────────── */

    @keyframes xrayGlow {
      0%, 100% { filter: drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 8px #38bdf8); opacity: 0.85; }
      50%       { filter: drop-shadow(0 0 10px #38bdf8) drop-shadow(0 0 20px #38bdf8); opacity: 1; }
    }

    @keyframes xrayFloat {
      0%, 100% { transform: translateY(0px) rotate(-1deg); }
      50%       { transform: translateY(-10px) rotate(1deg); }
    }

    @keyframes scanLine {
      0%   { transform: translateY(0px);   opacity: 0.9; }
      100% { transform: translateY(120px); opacity: 0; }
    }

    @keyframes radioPulse {
      0%, 100% { r: 6;  opacity: 0.3; }
      50%       { r: 14; opacity: 0.0; }
    }

    @keyframes radioPulse2 {
      0%, 100% { r: 3;  opacity: 0.5; }
      50%       { r: 9; opacity: 0.0; }
    }

    @keyframes boneShimmer {
      0%, 100% { opacity: 0.7; }
      50%       { opacity: 1.0; }
    }

    @keyframes cornerBlink {
      0%, 90%, 100% { opacity: 1; }
      95%            { opacity: 0.3; }
    }

    @keyframes emptyPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.6; }
    }

    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
      50%       { opacity: 1; transform: scale(1) rotate(180deg); }
    }

    .rad-xray-panel  { animation: xrayFloat  4s ease-in-out infinite; }
    .rad-xray-glow   { animation: xrayGlow   2.5s ease-in-out infinite; }
    .rad-scan-line   { animation: scanLine   2.8s ease-in-out infinite; }
    .rad-bone-shimmer { animation: boneShimmer 2s ease-in-out infinite; }
    .rad-corner-blink { animation: cornerBlink 3s ease-in-out infinite; }
    .rad-empty-text  { animation: emptyPulse  3s ease-in-out infinite; }

    .rad-pulse-ring-1 { animation: radioPulse  2.4s ease-out infinite 0s; }
    .rad-pulse-ring-2 { animation: radioPulse  2.4s ease-out infinite 0.8s; }
    .rad-pulse-ring-3 { animation: radioPulse2 2.4s ease-out infinite 1.6s; }

    .rad-sparkle-1 { animation: sparkle 2s ease-in-out infinite 0.0s; }
    .rad-sparkle-2 { animation: sparkle 2s ease-in-out infinite 0.7s; }
    .rad-sparkle-3 { animation: sparkle 2s ease-in-out infinite 1.4s; }

    @media (max-width: 768px) {
      .rad-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─── Animated Empty State ─────────────────────────────────────────────────────
const RadiologyEmptyState = ({ theme, employeeName }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '60px',
    padding: '48px 40px',
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    maxWidth: '440px',
    width: '100%',
    margin: '60px auto 0',
  }}>
    <svg
      viewBox="0 0 280 180"
      width="280"
      height="180"
      style={{ display: 'block', marginBottom: '24px', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="xrayBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="boneGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <clipPath id="xrayPanelClip">
          <rect x="60" y="14" width="120" height="150" rx="4" />
        </clipPath>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── X-Ray Panel ── */}
      <g className="rad-xray-panel" style={{ transformOrigin: '120px 89px' }}>
        {/* Panel background */}
        <rect x="60" y="14" width="120" height="150" rx="6"
          fill="url(#xrayBg)"
          stroke="#38bdf8"
          strokeWidth="1.5"
          className="rad-xray-glow"
        />

        {/* Corner markers (like real X-ray film) */}
        <rect x="63" y="17" width="8" height="2" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="63" y="17" width="2" height="8" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="169" y="17" width="8" height="2" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="175" y="17" width="2" height="8" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="63" y="157" width="8" height="2" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="63" y="151" width="2" height="8" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="169" y="157" width="8" height="2" fill="#38bdf8" className="rad-corner-blink" />
        <rect x="175" y="151" width="2" height="8" fill="#38bdf8" className="rad-corner-blink" />

        {/* ── Chest / Ribcage silhouette ── */}
        <g clipPath="url(#xrayPanelClip)" className="rad-bone-shimmer">
          {/* Spine */}
          <rect x="117" y="30" width="6" height="120" rx="3" fill="#c0e9ff" fillOpacity="0.5" />
          {/* Vertebrae */}
          {[38, 50, 62, 74, 86, 98, 110, 122].map((y, i) => (
            <rect key={i} x="113" y={y} width="14" height="8" rx="2" fill="#b0d8f0" fillOpacity="0.7" />
          ))}

          {/* Left ribs */}
          {[40, 56, 72, 88, 104].map((y, i) => (
            <path key={`lr${i}`}
              d={`M116 ${y} Q95 ${y + 2} 82 ${y + 8 + i * 2} Q72 ${y + 14 + i * 2} 75 ${y + 22 + i * 2}`}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          ))}
          {/* Right ribs */}
          {[40, 56, 72, 88, 104].map((y, i) => (
            <path key={`rr${i}`}
              d={`M124 ${y} Q145 ${y + 2} 158 ${y + 8 + i * 2} Q168 ${y + 14 + i * 2} 165 ${y + 22 + i * 2}`}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          ))}

          {/* Clavicles */}
          <path d="M116 34 Q98 28 80 32" fill="none" stroke="#a5d8f0" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          <path d="M124 34 Q142 28 160 32" fill="none" stroke="#a5d8f0" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

          {/* Sternum */}
          <rect x="116" y="34" width="8" height="70" rx="2" fill="#90c7e8" fillOpacity="0.6" />

          {/* Lung outlines */}
          <ellipse cx="98" cy="90" rx="18" ry="40" fill="#1e4d7b" fillOpacity="0.4" />
          <ellipse cx="142" cy="90" rx="18" ry="40" fill="#1e4d7b" fillOpacity="0.4" />

          {/* Heart shadow */}
          <ellipse cx="116" cy="105" rx="12" ry="14" fill="#1a3a5c" fillOpacity="0.6" />
        </g>

        {/* Scan line sweep */}
        <g clipPath="url(#xrayPanelClip)">
          <rect
            className="rad-scan-line"
            x="60" y="14" width="120" height="6"
            fill="url(#scanGrad)"
            opacity="0.35"
          />
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </g>

        {/* Label at bottom of film */}
        <text x="120" y="156" textAnchor="middle" fontSize="7" fill="#38bdf8" fontFamily="monospace" opacity="0.7">
          NO PENDING EXAMS
        </text>
      </g>

      {/* ── Pulse rings (right side) ── */}
      <g style={{ transformOrigin: '230px 80px' }}>
        <circle cx="230" cy="80" r="6"  fill="#38bdf8" fillOpacity="0.35" className="rad-pulse-ring-1" />
        <circle cx="230" cy="80" r="6"  fill="#38bdf8" fillOpacity="0.5"  className="rad-pulse-ring-2" />
        <circle cx="230" cy="80" r="3"  fill="#38bdf8" fillOpacity="0.8"  className="rad-pulse-ring-3" />
        <circle cx="230" cy="80" r="3"  fill="#38bdf8" />
        {/* Small ECG line */}
        <polyline
          points="210,85 215,85 218,72 221,95 224,78 227,85 230,85 250,85"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </g>

      {/* ── Sparkles ── */}
      <g className="rad-sparkle-1" style={{ transformOrigin: '50px 50px' }}>
        <line x1="50" y1="46" x2="50" y2="54" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="50" x2="54" y2="50" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1="47.2" y1="47.2" x2="52.8" y2="52.8" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52.8" y1="47.2" x2="47.2" y2="52.8" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="rad-sparkle-2" style={{ transformOrigin: '248px 130px' }}>
        <line x1="248" y1="126" x2="248" y2="134" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        <line x1="244" y1="130" x2="252" y2="130" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="rad-sparkle-3" style={{ transformOrigin: '38px 120px' }}>
        <line x1="38" y1="116" x2="38" y2="124" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="120" x2="42" y2="120" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
        <line x1="35.2" y1="117.2" x2="40.8" y2="122.8" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="40.8" y1="117.2" x2="35.2" y2="122.8" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Shadow under panel */}
      <ellipse cx="120" cy="170" rx="56" ry="7" fill={theme.tableBorder} fillOpacity="0.5" />
    </svg>

    <p
      className="rad-empty-text"
      style={{ color: theme.textMuted, fontSize: '17px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}
    >
      All clear — no exams pending!
    </p>
    <p style={{ color: theme.textMuted, fontSize: '13px', opacity: 0.7, textAlign: 'center' }}>
      Patients will appear here once registered for radiology
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
function Radiology() {
  const [pendingRadiologyExams, setPendingRadiologyExams] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clinicDetails, setClinicDetails] = useState({});
  const [token, setToken] = useState('');
  const [totalRadiologyExams, setTotalRadiologyExams] = useState(0);
  const [employeeName, setEmployeeName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('blue');

  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlTheme = parseThemeFromSearch(window.location.search);

  const theme = colors[currentTheme];

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
      } else {
        throw new Error('Failed to fetch clinic details');
      }
    } catch (error) {
      console.error('Error fetching clinic details:', error);
    }
  };

  const parseRadiologyExams = (examString) => {
    if (!examString || examString.trim() === '') return [];
    return examString
      .split(',')
      .map(exam => exam.trim())
      .filter(exam => exam.length > 0 && exam !== '');
  };

  const fetchPendingRadiologyExams = async (token) => {
    try {
      const response = await fetch(urls.pendingradiologyexams, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json();
        const processedData = data.map(patient => {
          const exams = parseRadiologyExams(patient.radiology_exam);
          return {
            ...patient,
            examsList: exams,
            totalRadiologyExams: exams.length,
          };
        });
        setPendingRadiologyExams(processedData);
      } else {
        throw new Error('Failed to fetch pending radiology exams data');
      }
    } catch (error) {
      console.error('Error fetching pending radiology exams data:', error);
    }
  };

  useEffect(() => {
    let intervalId = null;

    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        setToken(tokenFromUrl);

        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            const themeColor = securityData.colour || '';
            setCurrentTheme(resolveTheme(urlTheme, themeColor));

            await fetchPendingRadiologyExams(tokenFromUrl);
            intervalId = window.setInterval(() => fetchPendingRadiologyExams(tokenFromUrl), 30000);
            return;
          }

          if (securityData.error === 'Session expired') {
            navigate(`/dashboard?token=${securityData.clinic_session_token}`);
            return;
          }

          navigate('/login');
          return;
        }

        throw new Error('Failed to perform security check');
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
      }
    };

    fetchTokenAndCheckSecurity();
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [navigate]);

  const handleSubmitResults = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    setTotalRadiologyExams(patient.totalRadiologyExams);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
    setTotalRadiologyExams(0);
  };

  const handleSaveResults = async (contactId, results, event) => {
    event.preventDefault();
    try {
      console.log('Submitting and saving results for patient ID:', contactId);
      console.log('Results:', results);
      await fetchPendingRadiologyExams(token);
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const handleDeleteExam = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExam = async () => {
    if (!patientToDelete) return;
    try {
      const response = await fetch(urls.deleteExamRequest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          file_id: patientToDelete.file_id
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Delete successful');
          await fetchPendingRadiologyExams(token);
        } else {
          alert('Delete failed: ' + (result.message || 'Unknown error'));
        }
      } else {
        throw new Error('Failed to delete exam request');
      }
    } catch (error) {
      console.error('Error deleting exam request:', error);
      alert('Error deleting exam request: ' + error.message);
    } finally {
      setShowDeleteConfirm(false);
      setPatientToDelete(null);
    }
  };

  const cancelDeleteExam = () => {
    setShowDeleteConfirm(false);
    setPatientToDelete(null);
  };

  // ── Theme-aware styles ──────────────────────────────────────────────────────
  const styles = {
    container: {
      backgroundColor: theme.mainBg,
      minHeight: '100vh',
      paddingTop: '75px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    headerContainer: {
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '0 20px 20px',
    },
    header: {
      fontSize: '28px',
      fontWeight: '600',
      color: theme.headerText,
      marginBottom: '10px',
      paddingBottom: '15px',
      borderBottom: `1px solid ${theme.borderBottom}`,
    },
    subtitle: {
      fontSize: '16px',
      color: theme.subtitleText,
      marginBottom: '25px',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '25px',
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '0 20px',
    },
    patientCard: {
      backgroundColor: theme.cardBg,
      borderRadius: '8px',
      padding: '25px',
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '280px',
      position: 'relative',
      overflow: 'hidden',
    },
    patientHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: `1px solid ${theme.borderBottom}`,
    },
    patientName: {
      fontSize: '18px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '200px',
    },
    patientBadge: {
      fontSize: '12px',
      color: theme.badgeText,
      backgroundColor: theme.badgeBg,
      padding: '4px 10px',
      borderRadius: '12px',
      fontWeight: '500',
    },
    patientDetails: {
      marginBottom: '20px',
      flex: 1,
    },
    detailRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      fontSize: '14px',
    },
    detailIcon: {
      display: 'inline-block',
      width: '20px',
      color: theme.textMuted,
      marginRight: '8px',
    },
    detailValue: {
      color: theme.textSecondary,
    },
    examSection: {
      marginBottom: '20px',
    },
    examTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
    },
    examItem: {
      marginBottom: '8px',
      fontSize: '13px',
      color: theme.textSecondary,
      lineHeight: '1.6',
      wordBreak: 'break-word',
      display: 'flex',
      alignItems: 'flex-start',
    },
    examNumber: {
      fontWeight: '600',
      color: theme.examNumberColor,
      marginRight: '10px',
      minWidth: '25px',
      flexShrink: 0,
    },
    examText: {
      flex: 1,
    },
    totalExams: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '12px',
      backgroundColor: theme.totalBg,
      borderRadius: '6px',
      border: `1px solid ${theme.totalBorder}`,
    },
    totalLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: theme.textSecondary,
    },
    totalBadge: {
      backgroundColor: theme.totalBadgeBg,
      color: theme.totalBadgeText,
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '600',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      gap: '10px',
    },
    submitButton: {
      backgroundColor: theme.info,
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      display: 'inline-block',
      whiteSpace: 'nowrap',
      flex: 1,
    },
    deleteButton: {
      backgroundColor: 'transparent',
      color: theme.danger,
      border: `1px solid ${theme.danger}`,
      padding: '12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
    },
    deleteConfirmModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    deleteConfirmContent: {
      backgroundColor: theme.cardBg,
      padding: '30px',
      borderRadius: '8px',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    },
    deleteConfirmTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: '15px',
    },
    deleteConfirmText: {
      fontSize: '16px',
      color: theme.textSecondary,
      marginBottom: '25px',
      lineHeight: '1.5',
    },
    deleteConfirmButtons: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
    },
    confirmButton: {
      backgroundColor: theme.danger,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    },
    cancelButton: {
      backgroundColor: theme.textMuted,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <>
      <GlobalStyles theme={theme} />
      <div style={styles.container}>
        {/* ── themeColor passed to Topbar ── */}
        <Topbar token={urlToken} themeColor={currentTheme} />

        <div style={styles.headerContainer}>
          <h1 style={styles.header}>Pending Radiology Exams</h1>
          <div style={styles.subtitle}>
            {pendingRadiologyExams.length === 0
              ? `Hello ${employeeName}, there are no patients waiting for radiology services.`
              : `Hello ${employeeName}, you have ${pendingRadiologyExams.length} patient${pendingRadiologyExams.length > 1 ? 's' : ''} waiting for radiology services.`
            }
          </div>
        </div>

        {pendingRadiologyExams.length === 0 ? (
          <RadiologyEmptyState theme={theme} employeeName={employeeName} />
        ) : (
          <div style={styles.gridContainer} className="rad-grid">
            {pendingRadiologyExams.map((patient) => (
              <div
                key={patient.contact_id}
                style={styles.patientCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
              >
                <div style={styles.patientHeader}>
                  <h3 style={styles.patientName}>
                    {`${patient.first_name} ${patient.last_name}`}
                  </h3>
                  <span style={styles.patientBadge}>
                    {patient.age} {patient.sex}
                  </span>
                </div>

                <div style={styles.patientDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailIcon}>🆔</span>
                    <span style={styles.detailValue}>ID: {patient.contact_id}</span>
                  </div>

                  <div style={styles.examSection}>
                    <div style={styles.examTitle}>
                      <span style={styles.detailIcon}>🩺</span>
                      Exams to be done:
                    </div>
                    {patient.examsList.map((exam, index) => (
                      <div key={index} style={styles.examItem}>
                        <span style={styles.examNumber}>{index + 1}.</span>
                        <span style={styles.examText}>{exam}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.totalExams}>
                  <span style={styles.totalLabel}>Total Exams</span>
                  <span style={styles.totalBadge}>{patient.totalRadiologyExams}</span>
                </div>

                <div style={styles.buttonContainer}>
                  <button
                    style={styles.submitButton}
                    onClick={() => handleSubmitResults(patient)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.skyBlue; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.info; }}
                  >
                    Enter Results
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteExam(patient)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.danger;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.danger;
                    }}
                    title="Delete Exam Request"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedPatient && (
          <RadiologyResultModal
            patient={selectedPatient}
            clinicDetails={clinicDetails}
            token={token}
            totalRadiologyExams={totalRadiologyExams}
            examsToBeDone={selectedPatient.examsList}
            onClose={handleCloseModal}
            onSubmit={handleSaveResults}
          />
        )}

        {showDeleteConfirm && patientToDelete && (
          <div style={styles.deleteConfirmModal}>
            <div style={styles.deleteConfirmContent}>
              <h3 style={styles.deleteConfirmTitle}>Confirm Deletion</h3>
              <p style={styles.deleteConfirmText}>
                You are about to delete the exam request for {patientToDelete.first_name} {patientToDelete.last_name}.
                This action cannot be undone.
              </p>
              <div style={styles.deleteConfirmButtons}>
                <button
                  style={styles.cancelButton}
                  onClick={cancelDeleteExam}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#616161'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.textMuted; }}
                >
                  Cancel
                </button>
                <button
                  style={styles.confirmButton}
                  onClick={confirmDeleteExam}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Radiology;