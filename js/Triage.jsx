import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { useNavigate } from 'react-router-dom';
import { 
    faPhone, faUser, faIdCard, faVenusMars, faPray, 
    faHome, faUserFriends, faCompressAlt, faChevronLeft,
    faChevronRight, faHeart, faTint, faLungs, faWeight,
    faRuler, faThermometerHalf, faExclamationTriangle, faSearch,
    faTimes, faCheck, faArrowRight, faSpinner, faHandPointUp
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import './Triage.css';

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
    suggestionHover: '#2563eb',
    suggestionHoverText: '#ffffff',
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
    suggestionHover: '#2563eb',
    suggestionHoverText: '#ffffff',
  }
};

// Topbar height constant
const TOPBAR_HEIGHT = 60;

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
    
    /* Custom scrollbar with gradient effect */
    ::-webkit-scrollbar { 
      width: 8px; 
      height: 8px; 
    }
    
    ::-webkit-scrollbar-track { 
      background: transparent; 
    }
    
    ::-webkit-scrollbar-thumb { 
      background: linear-gradient(135deg, ${theme.textMuted}40, ${theme.textMuted}80);
      border-radius: 20px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    
    ::-webkit-scrollbar-thumb:hover { 
      background: linear-gradient(135deg, ${theme.textMuted}80, ${theme.textMuted});
    }
    
    ::-webkit-scrollbar-corner {
      background: transparent;
    }
    
    .fade-in { 
      animation: fadeIn 0.3s ease; 
    }
    
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(6px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
    
    .slide-out {
      animation: slideOut 0.3s ease-out forwards;
    }
    
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
    
    .sidebar-transition {
      transition: all 0.3s ease;
    }
    
    .main-content-transition {
      transition: margin-left 0.3s ease;
    }
    
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdropFilter: blur(3px);
      zIndex: 1000;
      display: flex;
      alignItems: center;
      justifyContent: center;
      padding: 20px;
    }
    
    .test-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid ${theme.tableBorder};
      background: ${theme.cardBg};
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .test-row:hover {
      background: ${theme.infoLight};
    }
    
    .test-row.selected {
      background: ${theme.infoLight};
      border-left: 3px solid ${theme.info};
    }
    
    .btn-primary {
      background: ${theme.info};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .btn-primary:hover {
      background: ${theme.info}dd;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
    }
    
    .btn-primary:disabled {
      background: ${theme.textMuted}40;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .btn-secondary {
      background: ${theme.tableHeader};
      border: 1px solid ${theme.cardBorder};
      color: ${theme.textSecondary};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .btn-secondary:hover {
      border-color: ${theme.info};
      background: ${theme.infoLight};
      color: ${theme.info};
    }
    
    .btn-danger {
      background: ${theme.danger};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .btn-danger:hover {
      background: ${theme.danger}dd;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
    }
    
    .vital-card {
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;
    }
    
    .vital-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .suggestions-container {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 300px;
      overflow-y: auto;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 8px;
      margin-top: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    .suggestion-item {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid ${theme.cardBorder};
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .suggestion-item:hover {
      background: ${theme.suggestionHover};
      color: ${theme.suggestionHoverText};
    }
    
    .suggestion-item:hover .suggestion-details {
      color: ${theme.suggestionHoverText} !important;
    }
    
    .suggestion-item:last-child {
      border-bottom: none;
    }
    
    .suggestion-avatar {
      width: 40px;
      height: 40px;
      background: ${theme.infoLight};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: ${theme.info};
      flex-shrink: 0;
    }
    
    .suggestion-item:hover .suggestion-avatar {
      background: ${theme.cardBg};
      color: ${theme.info};
    }
    
    .suggestion-info {
      flex: 1;
    }
    
    .suggestion-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .suggestion-details {
      font-size: 12px;
      color: ${theme.textMuted};
      display: flex;
      gap: 12px;
    }
    
    .phone-verification-modal {
      background: ${theme.cardBg};
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }
    
    .phone-verification-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }
    
    .required-field::after {
      content: '*';
      color: ${theme.danger};
      margin-left: 4px;
    }
    
    .form-section {
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .form-section-title {
      font-size: 16px;
      font-weight: 600;
      color: ${theme.textPrimary};
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .form-field {
      margin-bottom: 16px;
      position: relative;
    }
    
    .form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: ${theme.textSecondary};
      font-size: 13px;
    }
    
    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid ${theme.cardBorder};
      border-radius: 8px;
      font-size: 14px;
      transition: border 0.2s ease;
      background: ${theme.cardBg};
      color: ${theme.textPrimary};
    }
    
    .form-input:focus {
      outline: none;
      border-color: ${theme.info};
      box-shadow: 0 0 0 3px ${theme.infoLight};
    }
    
    .form-input.error {
      border-color: ${theme.danger};
    }
    
    .age-input-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .age-input {
      text-align: center;
    }
    
    .age-input input {
      text-align: center;
    }
    
    .inline-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 100;
    }
    
    /* Loading Spinner */
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }
    
    .spinner {
      animation: spin 1s linear infinite;
      font-size: 3rem;
      color: ${theme.info};
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Pointing Finger Animation */
    .pointing-finger {
      position: absolute;
      top: -30px;
      left: 20px;
      font-size: 2rem;
      color: ${theme.warning};
      animation: pointFinger 1.5s ease-in-out infinite;
      z-index: 100;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }
    
    @keyframes pointFinger {
      0%, 100% {
        transform: translateX(0) rotate(0deg);
      }
      25% {
        transform: translateX(10px) rotate(10deg);
      }
      50% {
        transform: translateX(20px) rotate(20deg);
      }
      75% {
        transform: translateX(10px) rotate(10deg);
      }
    }
    
    .pulse-animation {
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    /* Full width inputs for top section */
    .full-width-inputs {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
      width: 100%;
    }
    
    .full-width-field {
      width: 100%;
    }
    
    /* Remove the grid columns constraint for top inputs */
    .form-grid-top {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
  `}</style>
);

// ─── Loading Spinner Component ─────────────────────────────────────────────
const LoadingSpinner = ({ theme }) => (
  <div className="spinner-container">
    <FontAwesomeIcon icon={faSpinner} className="spinner" spin />
    <p style={{ color: theme.textSecondary, fontSize: '16px', fontWeight: 500 }}>
      Loading patient records...
    </p>
  </div>
);

// ─── Pointing Finger Component ─────────────────────────────────────────────
const PointingFinger = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="pointing-finger">
      <FontAwesomeIcon icon={faHandPointUp} />
    </div>
  );
};

// ─── Patient Sidebar Component ─────────────────────────────────────────────
const PatientSidebar = ({ patient, collapsed, onToggleCollapse, theme, onClose }) => {
    const [nextOfKinExpanded, setNextOfKinExpanded] = useState(false);
    
    const formatAge = (patient) => {
        if (!patient) return 'Not provided';
        
        const years = parseInt(patient.years || patient.age || 0);
        const months = parseInt(patient.months || patient.age_months || 0);
        const weeks = parseInt(patient.weeks || patient.age_weeks || 0);
        
        const parts = [];
        if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
        if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Not provided';
    };

    return (
        <aside style={{
            width: collapsed ? '80px' : '300px',
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
            boxShadow: collapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.05)',
            transition: 'width 0.3s ease',
            zIndex: 900,
            color: theme.sidebarText,
            animation: 'slideIn 0.4s ease-out',
        }}>
            {/* Sidebar content - unchanged */}
            <div style={{
                padding: collapsed ? '20px 10px' : '20px 16px',
                borderBottom: `1px solid ${theme.sidebarBorder}`,
                display: 'flex',
                flexDirection: collapsed ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: theme.filterSection,
                minHeight: collapsed ? '120px' : '80px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    order: collapsed ? 2 : 1,
                    marginTop: collapsed ? '12px' : 0,
                }}>
                    <div style={{
                        width: '45px',
                        height: '45px',
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.info})`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                        👤
                    </div>
                    {!collapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>MEDCORE</div>
                            <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Triage</div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {!collapsed && (
                        <button
                            onClick={onClose}
                            style={{
                                background: theme.danger + '20',
                                border: 'none',
                                color: theme.danger,
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                            }}
                            title="Change Patient"
                        >
                            ✕
                        </button>
                    )}
                    <button
                        className="collapse-btn"
                        onClick={onToggleCollapse}
                        style={{
                            background: theme.collapseButtonBg + '40',
                            border: 'none',
                            color: theme.collapseButtonText,
                            width: collapsed ? '42px' : '36px',
                            height: collapsed ? '42px' : '36px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: collapsed ? '20px' : '16px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            order: collapsed ? 1 : 2,
                        }}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                </div>
            </div>

            {!collapsed && patient && (
                <div style={{ padding: '20px 16px' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.accent}, ${theme.info})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#fff',
                            marginBottom: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}>
                            👤
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: theme.sidebarText, textAlign: 'center' }}>
                            {patient.firstName || patient.first_name} {patient.lastName || patient.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.sidebarTextMuted, marginTop: '4px' }}>
                            ID: {patient.contactId || patient.contact_id}
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em', 
                            color: theme.sidebarTextMuted,
                            marginBottom: '8px',
                        }}>
                            PATIENT DETAILS
                        </div>
                        <div style={{ background: theme.filterSection, borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                                <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Age</span>
                                <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                    {formatAge(patient)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                                <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Sex</span>
                                <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                    {patient.sex || patient.sex || 'Not provided'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                                <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Phone</span>
                                <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                    {patient.phoneNumber || patient.phone_number || 'Not provided'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Religion</span>
                                <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                    {patient.religion || 'Not provided'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            padding: '12px 0',
                            marginBottom: '8px',
                            borderBottom: `1px solid ${theme.sidebarBorder}`,
                        }} onClick={() => setNextOfKinExpanded(!nextOfKinExpanded)}>
                            <h4 style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: theme.sidebarTextMuted, 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em' 
                            }}>
                                NEXT OF KIN
                            </h4>
                            <span style={{ fontSize: '18px', color: theme.sidebarTextMuted }}>
                                {nextOfKinExpanded ? '▼' : '▶'}
                            </span>
                        </div>
                        <div style={{ 
                            overflow: 'hidden',
                            maxHeight: nextOfKinExpanded ? '200px' : '0',
                            opacity: nextOfKinExpanded ? 1 : 0,
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{ background: theme.filterSection, borderRadius: '10px', padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                                    <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Name</span>
                                    <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                        {patient.nextOfKinName || patient.next_of_kin_name || 'Not provided'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                                    <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Relationship</span>
                                    <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                        {patient.nextOfKinRelationship || patient.relationship_with_next_of_kin || 'Not provided'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span style={{ fontSize: '12px', color: theme.sidebarTextMuted, fontWeight: '500' }}>Contact</span>
                                    <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                                        {patient.nextOfKinContact || patient.next_of_kin_contact || 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        marginTop: '16px', 
                        paddingTop: '16px', 
                        borderTop: `1px solid ${theme.sidebarBorder}` 
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: theme.danger + '20',
                                color: theme.danger,
                                border: '1px solid ' + theme.danger + '40',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Change Patient
                        </button>
                    </div>
                </div>
            )}

            {collapsed && (
                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '24px', color: theme.sidebarText }}>👤</div>
                    <div 
                        onClick={onClose}
                        style={{ 
                            fontSize: '20px', 
                            color: theme.danger,
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            background: theme.dangerLight + '20',
                        }}
                        title="Change Patient"
                    >
                        ✕
                    </div>
                </div>
            )}
        </aside>
    );
};

// ─── Main Triage Component ─────────────────────────────────────────────────
function Triage() {
    const [newPatientDetails, setNewPatientDetails] = useState({
        firstName: '',
        lastName: '',
        contactId: '',
        phoneNumber: '',
        years: '',
        months: '',
        weeks: '',
        sex: '',
        religion: '',
        dob: '',
        address: '',
        nextOfKinName: '',
        nextOfKinContact: '',
        nextOfKinRelationship: ''
    });

    const [bloodPressure, setBloodPressure] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [temperature, setTemperature] = useState('');
    const [spo2, setSpo2] = useState('');
    const [bodyWeight, setBodyWeight] = useState('');
    const [labTestsAvailable, setLabTestsAvailable] = useState([]);
    const [selectedLabTests, setSelectedLabTests] = useState([]);
    const [radiologyTestsAvailable, setRadiologyTestsAvailable] = useState([]);
    const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [savePatientClicked, setSavePatientClicked] = useState(false);
    const [showAddPatientPrompt, setShowAddPatientPrompt] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [readOnlyPatientDetails, setReadOnlyPatientDetails] = useState(null);
    const [showLabTestPrompt, setShowLabTestPrompt] = useState(false);
    const [showRadiologyTestPrompt, setShowRadiologyTestPrompt] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signsAndSymptoms, setSignsAndSymptoms] = useState('');
    const [pulseRate, setPulseRate] = useState('');
    const [respiratoryRate, setRespiratoryRate] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState('');
    const [bmiWarning, setBmiWarning] = useState('');
    const [successModal, setSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [patientAction, setPatientAction] = useState('');
    const [consultationFeeRequired, setConsultationFeeRequired] = useState('');
    const [consultationFeeAmount, setConsultationFeeAmount] = useState('');
    const [showConsultationFeeInput, setShowConsultationFeeInput] = useState(false);
    const [clinicInfo, setClinicInfo] = useState(null);
    const [noDobProvided, setNoDobProvided] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('white');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isChangingPatient, setIsChangingPatient] = useState(false);
    const [showPhoneVerification, setShowPhoneVerification] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPointingFinger, setShowPointingFinger] = useState(true);

    const firstNameRef = useRef(null);
    const suggestionsRef = useRef(null);
    const debounceTimer = useRef(null);
    const isMounted = useRef(true);
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlTheme = parseThemeFromSearch(window.location.search);

    // Get the active theme colors
    const theme = colors[currentTheme];

    // Show pointing finger for 3 seconds and then hide
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPointingFinger(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Fetch all contacts on page load
    useEffect(() => {
        const fetchAllContacts = async () => {
            setLoading(true);
            try {
                const response = await fetch(urls.fetchcontacts, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: urlToken }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (isMounted.current) {
                        setAllContacts(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching contacts:', error);
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        };

        if (urlToken) {
            fetchAllContacts();
        } else {
            setLoading(false);
        }
    }, [urlToken]);

    // Filter contacts based on first name input
    useEffect(() => {
        if (newPatientDetails.firstName.trim() === '' || !isTyping) {
            setFilteredContacts([]);
            setShowSuggestions(false);
            return;
        }

        const searchTerm = newPatientDetails.firstName.toLowerCase();
        const filtered = allContacts.filter(contact => {
            const firstName = contact.first_name?.toLowerCase() || '';
            return firstName.startsWith(searchTerm);
        }).slice(0, 8); // Limit to 8 suggestions

        setFilteredContacts(filtered);
        setShowSuggestions(filtered.length > 0);
    }, [newPatientDetails.firstName, allContacts, isTyping]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (firstNameRef.current && !firstNameRef.current.contains(event.target) &&
                suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setIsTyping(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch employee name, clinic info and perform security check
    useEffect(() => {
        const fetchEmployeeName = async () => {
            try {
                const securityResponse = await fetch(urls.security, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: urlToken }),
                });

                if (securityResponse.ok) {
                    const securityData = await securityResponse.json();
                    
                    // Set theme based on security response
                    const themeColor = securityData.colour || '';
                    setCurrentTheme(resolveTheme(urlTheme, themeColor));
                    
                    if (securityData.message === 'Session valid') {
                        if (!isMounted.current) return;
                        setEmployeeName(securityData.employee_name);
                        setClinicInfo(securityData);
                        saveSessionToken(securityData.clinic_session_token);
                        fetchAvailableLabTests();
                        fetchAvailableRadiologyTests();
                        
                        if (securityData.consultation_fee && securityData.consultation_fee > 0) {
                            setConsultationFeeAmount(String(securityData.consultation_fee));
                        }
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

        fetchEmployeeName();
    }, [navigate, urlToken]);

    // Sort tests/exams alphabetically
    const sortTestsAlphabetically = (tests) => {
        return [...tests].sort((a, b) => a.name.localeCompare(b.name));
    };

    // Format price without decimals
    const formatPrice = (price) => {
        return Math.round(Number(price)).toLocaleString();
    };

    // Fetch available lab tests
    const fetchAvailableLabTests = async () => {
        try {
            const response = await fetch(urls.testsavailable, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: urlToken }),
            });

            if (!response.ok) throw new Error('Failed to fetch available lab tests');
            const data = await response.json();
            if (isMounted.current) {
                setLabTestsAvailable(sortTestsAlphabetically(data));
            }
        } catch (error) {
            console.error('Error fetching available lab tests:', error);
        }
    };

    // Fetch available radiology tests
    const fetchAvailableRadiologyTests = async () => {
        try {
            const response = await fetch(urls.radiologytestsavailable, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: urlToken }),
            });

            if (!response.ok) throw new Error('Failed to fetch available radiology exams');
            const data = await response.json();
            if (isMounted.current) {
                setRadiologyTestsAvailable(sortTestsAlphabetically(data));
            }
        } catch (error) {
            console.error('Error fetching available radiology exams:', error);
        }
    };

    // Calculate total price for selected tests
    const calculateTotalPrice = (selectedItems, availableItems) => {
        return selectedItems.reduce((total, selectedName) => {
            const item = availableItems.find(item => item.name === selectedName);
            return total + (item ? Number(item.price) : 0);
        }, 0);
    };

    // Handle contact selection from suggestions
    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        setShowPhoneVerification(true);
        setShowSuggestions(false);
        setIsTyping(false);
    };

    // Verify phone number - FIXED: changed 'contact' to 'selectedContact'
    const handlePhoneVerification = (confirmed) => {
        if (confirmed) {
            // Phone number matches, proceed with this contact
            const patientDetails = {
                firstName: selectedContact.first_name,
                lastName: selectedContact.last_name,
                contactId: selectedContact.contact_id,
                phoneNumber: selectedContact.phone_number,
                years: selectedContact.age || '',
                months: selectedContact.age_months || '',
                weeks: selectedContact.age_weeks || '',
                sex: selectedContact.sex || '',
                religion: selectedContact.religion || '',
                dob: selectedContact.dob || '',
                address: selectedContact.address || '',
                nextOfKinName: selectedContact.next_of_kin_name || '',
                nextOfKinContact: selectedContact.next_of_kin_contact || '',
                nextOfKinRelationship: selectedContact.relationship_with_next_of_kin || ''
            };

            setNewPatientDetails(patientDetails);
            setReadOnlyPatientDetails(patientDetails);
            setShowAddPatientPrompt(false);
            setNoDobProvided(false);
            setShowSidebar(true);
            setShowPhoneVerification(false);
            setSelectedContact(null);
        } else {
            // Phone number doesn't match, clear first name and continue with manual entry
            setNewPatientDetails(prev => ({ ...prev, firstName: '' }));
            setShowPhoneVerification(false);
            setSelectedContact(null);
            toast.info('Please choose another name or insert if client is new.');
        }
    };

    // Handle name suggestions with debounce
    const handleSuggestName = async (name) => {
        const invalidChars = /[^a-zA-Z\s'-]/;
        if (invalidChars.test(name)) {
            toast.error(`Please ${employeeName}, punctuation marks cannot be used in names.`, {
                autoClose: 5000,
            });
            setSuggestions([]);
            return;
        }

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            try {
                const queryString = `?name=${encodeURIComponent(name)}&token=${urlToken}`;
                const response = await fetch(`${urls.suggest}${queryString}`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (!isMounted.current) return;
                    if (data.message && data.message === 'No patient records found for the specified clinic') {
                        setSuggestions([]);
                        setMessage('No patient records found');
                    } else if (data.error === 'Name and token parameters are required') {
                        setSuggestions([]);
                        setMessage('No patient records found');
                    } else {
                        setSuggestions(data);
                        setMessage('');
                    }
                } else {
                    const errorData = await response.json();
                    if (errorData.error !== "Name parameter is required") {
                        throw new Error('Failed to suggest names');
                    }
                }
            } catch (error) {
                console.error('Error suggesting names:', error.message);
                if (isMounted.current) {
                    setSuggestions([]);
                    setMessage('No patient records found');
                }
            }
        }, 300);
    };

    // Add this useEffect
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.target.type === 'number') {
                e.preventDefault();
            }
        };

        document.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            document.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Calculate BMI
    const calculateBMI = (weight, height) => {
        if (weight && height) {
            const heightInMeters = height / 100;
            return (weight / (heightInMeters * heightInMeters)).toFixed(2);
        }
        return '';
    };

    // Get BMI warning
    const getBMIWarning = (bmi) => {
        if (!bmi) return '';
        const bmiValue = parseFloat(bmi);
        if (bmiValue < 18.5) return 'Warning: Underweight';
        if (bmiValue >= 18.5 && bmiValue <= 24.9) return 'Normal: Healthy weight';
        if (bmiValue >= 25 && bmiValue <= 29.9) return 'Warning: Overweight';
        if (bmiValue >= 30) return 'Warning: Obese';
        return '';
    };

    // Update BMI when weight or height changes
    useEffect(() => {
        const calculatedBmi = calculateBMI(bodyWeight, height);
        setBmi(calculatedBmi);
        setBmiWarning(getBMIWarning(calculatedBmi));
    }, [bodyWeight, height]);

    // Classify pulse rate
    const classifyPulseRate = (pulseRate) => {
        const pulse = parseInt(pulseRate, 10);
        if (isNaN(pulse)) return { status: '', level: '' };
        if (pulse < 60) return { status: 'Warning: Low Pulse Rate', level: 'low' };
        if (pulse > 100) return { status: 'Warning: High Pulse Rate', level: 'high' };
        return { status: 'Pulse Rate Normal', level: 'normal' };
    };

    // Classify blood pressure
    const classifyBloodPressure = (bloodPressure) => {
        if (!bloodPressure.includes('/')) return { status: '', level: '' };
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);
        if (isNaN(systolic) || isNaN(diastolic)) return { status: '', level: '' };
        if (systolic < 90 || diastolic < 60) return { status: 'Warning: Low Blood Pressure', level: 'low' };
        if (systolic > 140 || diastolic > 90) return { status: 'Warning: High Blood Pressure', level: 'high' };
        return { status: 'Blood Pressure Normal', level: 'normal' };
    };

    // Classify temperature
    const classifyTemperature = (temperature) => {
        const temp = parseFloat(temperature);
        if (isNaN(temp)) return '';
        if (temp < 35) return 'Warning: Very Low Temperature';
        if (temp >= 35 && temp < 36.5) return 'Warning: Low Temperature';
        if (temp >= 36.5 && temp <= 37.5) return 'Temperature Normal';
        if (temp > 37.5 && temp <= 38.5) return 'Warning: High Temperature';
        return 'Warning: Very High Temperature';
    };

    // Classify respiratory rate
    const classifyRespiratoryRate = (rate) => {
        const respiratoryRate = parseInt(rate, 10);
        if (isNaN(respiratoryRate)) return '';
        if (respiratoryRate < 12) return 'Warning: Low Respiratory Rate';
        if (respiratoryRate > 20) return 'Warning: High Respiratory Rate';
        return 'Respiratory Rate Normal';
    };

    // Classify SPO2
    const classifySPO2 = (spo2) => {
        const spo2Value = parseFloat(spo2);
        if (isNaN(spo2Value)) return '';
        if (spo2Value < 90) return 'Warning: Low SPO2';
        return 'SPO2 Normal';
    };

    // Update classifications when vital signs change
    useEffect(() => {
        setPulseRateStatus(classifyPulseRate(pulseRate));
    }, [pulseRate]);

    useEffect(() => {
        setBloodPressureStatus(classifyBloodPressure(bloodPressure));
    }, [bloodPressure]);

    useEffect(() => {
        setTemperatureStatus(classifyTemperature(temperature));
    }, [temperature]);

    useEffect(() => {
        setRespiratoryRateStatus(classifyRespiratoryRate(respiratoryRate));
    }, [respiratoryRate]);

    useEffect(() => {
        setSpo2Status(classifySPO2(spo2));
    }, [spo2]);

    // Handle consultation fee change
    const handleConsultationFeeChange = (value) => {
        setConsultationFeeRequired(value);
        setShowConsultationFeeInput(value === 'yes');
        if (value === 'no') {
            setConsultationFeeAmount('');
        } else if (value === 'yes' && clinicInfo?.consultation_fee && clinicInfo.consultation_fee > 0) {
            setConsultationFeeAmount(String(clinicInfo.consultation_fee));
        }
    };

    // Handle doctor option toggle
    const handleDoctorToggle = () => {
        const newState = !selectionState.doctor;
        setSelectionState(prev => ({ 
            ...prev, 
            doctor: newState 
        }));
        
        if (newState) {
            if (clinicInfo?.consultation_fee && clinicInfo.consultation_fee > 0) {
                setConsultationFeeRequired('yes');
                setShowConsultationFeeInput(true);
                setConsultationFeeAmount(String(clinicInfo.consultation_fee));
            } else {
                setShowConsultationFeeInput(false);
                setConsultationFeeRequired('');
                setConsultationFeeAmount('');
            }
        } else {
            setShowConsultationFeeInput(false);
            setConsultationFeeRequired('');
            setConsultationFeeAmount('');
        }
    };

    // Handle cancel action
    const handleCancel = () => {
        setNewPatientDetails({
            firstName: '',
            lastName: '',
            contactId: '',
            phoneNumber: '',
            years: '',
            months: '',
            weeks: '',
            sex: '',
            religion: '',
            dob: '',
            address: '',
            nextOfKinName: '',
            nextOfKinContact: '',
            nextOfKinRelationship: ''
        });
        setNoDobProvided(false);
        setShowAddPatientPrompt(false);
        setSuggestions([]);
        setSavePatientClicked(false);
        setShowSuggestions(false);
        setIsTyping(false);
        setValidationErrors({});
    };

    // Reset form completely
    const resetForm = () => {
        setNewPatientDetails({
            firstName: '',
            lastName: '',
            contactId: '',
            phoneNumber: '',
            years: '',
            months: '',
            weeks: '',
            sex: '',
            religion: '',
            dob: '',
            address: '',
            nextOfKinName: '',
            nextOfKinContact: '',
            nextOfKinRelationship: ''
        });
        setReadOnlyPatientDetails(null);
        setBloodPressure('');
        setTemperature('');
        setSpo2('');
        setBodyWeight('');
        setHeight('');
        setRespiratoryRate('');
        setPulseRate('');
        setSelectedLabTests([]);
        setSelectedRadiologyTests([]);
        setSelectionState({
            doctor: false,
            lab: false,
            radiology: false,
            familyPlanning: false,
            antenatalCare: false,
        });
        setAttentionLevel('');
        setPatientNature('');
        setSignsAndSymptoms('');
        setConsultationFeeRequired('');
        setConsultationFeeAmount('');
        setShowConsultationFeeInput(false);
        setSuggestions([]);
        setSavePatientClicked(false);
        setNoDobProvided(false);
        setShowSidebar(false);
        setShowSuggestions(false);
        setIsTyping(false);
        setValidationErrors({});
    };

    // Handle change patient
    const handleChangePatient = () => {
        setIsChangingPatient(true);
        setShowSidebar(false);
        
        setTimeout(() => {
            setReadOnlyPatientDetails(null);
            resetForm();
            setIsChangingPatient(false);
        }, 300);
    };

    // Handle no DOB button click
    const handleNoDobClick = () => {
        setNoDobProvided(true);
        setNewPatientDetails(prev => ({
            ...prev,
            dob: '0001-01-01'
        }));
    };

    // Validate form fields
    const validateForm = () => {
        const errors = {};
        
        if (!newPatientDetails.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!newPatientDetails.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!newPatientDetails.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required';
        }
        if (!newPatientDetails.years && !newPatientDetails.months && !newPatientDetails.weeks) {
            errors.age = 'At least one age value is required';
        }
        if (!newPatientDetails.sex) {
            errors.sex = 'Gender is required';
        }
        if (!newPatientDetails.religion) {
            errors.religion = 'Religion is required';
        }
        if (!newPatientDetails.address.trim()) {
            errors.address = 'Address is required';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Add new contact/patient
    const addContact = async () => {
        if (savePatientClicked) return;
        
        if (!validateForm()) {
            toast.error('Please fill in all required fields.');
            return;
        }
        
        setSavePatientClicked(true);

        try {
            const response = await fetch(urls.addcontact6, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newPatientDetails,
                    token: urlToken,
                    ageDetails: {
                        years: newPatientDetails.years || 0,
                        months: newPatientDetails.months || 0,
                        weeks: newPatientDetails.weeks || 0,
                    },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                updateReadOnlyPatientDetails(data.patientDetails);
                toast.success(data.message);
                setSavePatientClicked(false);
                setShowAddPatientPrompt(false);
                setNoDobProvided(false);
                setShowSidebar(true);
                
                setNewPatientDetails({
                    firstName: '',
                    lastName: '',
                    contactId: '',
                    phoneNumber: '',
                    years: '',
                    months: '',
                    weeks: '',
                    sex: '',
                    religion: '',
                    dob: '',
                    address: '',
                    nextOfKinName: '',
                    nextOfKinContact: '',
                    nextOfKinRelationship: ''
                });
            } else {
                throw new Error(data.message || 'Failed to add new patient');
            }
        } catch (error) {
            console.error('Error adding new patient:', error);
            toast.error(error.message || 'Oops! Something went wrong.');
            setSavePatientClicked(false);
        }
    };

    // Update read-only patient details
    const updateReadOnlyPatientDetails = (newDetails) => {
        setReadOnlyPatientDetails(newDetails);
    };

    // Handle selecting a suggested patient (fallback)
    const handleSelectSuggestedPatient = (patient) => {
        const patientDetails = {
            firstName: patient.first_name,
            lastName: patient.last_name,
            contactId: patient.contact_id,
            phoneNumber: patient.phone_number,
            years: patient.age,
            months: patient.age_months,
            weeks: patient.age_weeks,
            sex: patient.sex,
            religion: patient.religion,
            dob: patient.dob || '',
            address: patient.address || '',
            nextOfKinName: patient.next_of_kin_name || '',
            nextOfKinContact: patient.next_of_kin_contact || '',
            nextOfKinRelationship: patient.relationship_with_next_of_kin || ''
        };

        setNewPatientDetails(patientDetails);
        setReadOnlyPatientDetails(patientDetails);
        setSuggestions([]);
        setShowAddPatientPrompt(false);
        setNoDobProvided(false);
        setShowSidebar(true);
    };

    // Format date
    const formatDate = (date) => {
        return date ? new Date(date).toISOString().split('T')[0] : '';
    };

    // Toggle options
    const handleOptionToggle = (option) => {
        switch (option) {
            case 'doctor':
                handleDoctorToggle();
                break;
            case 'lab':
                setSelectionState(prev => {
                    const wasSelected = prev.lab;
                    if (wasSelected) {
                        setSelectedLabTests([]);
                        setShowLabTestPrompt(false);
                    } else {
                        setShowLabTestPrompt(true);
                    }
                    return { ...prev, lab: !prev.lab };
                });
                break;
            case 'radiology':
                setSelectionState(prev => {
                    const wasSelected = prev.radiology;
                    if (wasSelected) {
                        setSelectedRadiologyTests([]);
                        setShowRadiologyTestPrompt(false);
                    } else {
                        setShowRadiologyTestPrompt(true);
                    }
                    return { ...prev, radiology: !prev.radiology };
                });
                break;
            case 'familyPlanning':
                setSelectionState(prev => ({ ...prev, familyPlanning: !prev.familyPlanning }));
                break;
            case 'antenatalCare':
                setSelectionState(prev => ({ ...prev, antenatalCare: !prev.antenatalCare }));
                break;
            default:
                break;
        }
    };

    // Handle test/exam selection
    const handleTestSelection = (testName, testType) => {
        if (testType === 'lab') {
            setSelectedLabTests(prev => {
                if (prev.includes(testName)) {
                    return prev.filter(name => name !== testName);
                } else {
                    return [...prev, testName];
                }
            });
        } else {
            setSelectedRadiologyTests(prev => {
                if (prev.includes(testName)) {
                    return prev.filter(name => name !== testName);
                } else {
                    return [...prev, testName];
                }
            });
        }
    };

    // Clear selected tests
    const handleClearAllTests = (testType) => {
        if (testType === 'lab') {
            setSelectedLabTests([]);
        } else {
            setSelectedRadiologyTests([]);
        }
    };

    // Toggle attention level
    const toggleAttentionLevel = (level) => {
        setAttentionLevel(level);
    };

    // Auto-close success modal after 5 seconds
    useEffect(() => {
        let timer;
        if (successModal) {
            timer = setTimeout(() => {
                setSuccessModal(false);
                resetForm();
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [successModal]);

    // Submit form
    const submitForm = async () => {
        try {
            setSubmitting(true);
            toast.info('Form is being submitted...');

            if (!selectionState.doctor && !selectionState.lab && !selectionState.radiology && 
                !selectionState.familyPlanning && !selectionState.antenatalCare) {
                toast.error('Please select at least one option (doctor, lab, radiology, family planning, or antenatal care).', {
                    autoClose: false,
                });
                setSubmitting(false);
                return;
            }

            if (!attentionLevel || !patientNature) {
                toast.error('Attention and Visit Classification are required.', {
                    autoClose: false,
                });
                setSubmitting(false);
                return;
            }

            if ((selectionState.doctor || selectionState.antenatalCare) && 
                (selectedLabTests.length > 0 || selectedRadiologyTests.length > 0)) {
                toast.error(
                    "If you're sending this patient to the doctor or antenatal care, do not request lab or radiology tests. The doctor will handle these tests.", 
                    { autoClose: false }
                );
                setSubmitting(false);
                return;
            }

            if (selectionState.doctor && !consultationFeeRequired) {
                toast.error('Please indicate if the patient will pay consultation fee when sending to doctor.', {
                    autoClose: false,
                });
                setSubmitting(false);
                return;
            }

            if (selectionState.doctor && consultationFeeRequired === 'yes' && !consultationFeeAmount) {
                toast.error('Please enter the consultation fee amount.', {
                    autoClose: false,
                });
                setSubmitting(false);
                return;
            }

            const formData = {
                contactId: readOnlyPatientDetails.contactId,
                bloodPressure,
                temperature,
                spo2,
                bodyWeight,
                height,
                respiratory_rate: respiratoryRate,
                pulse_rate: pulseRate,
                labTests: selectionState.lab ? selectedLabTests : [],
                radiologyExams: selectionState.radiology ? selectedRadiologyTests : [],
                token: urlToken,
                action: selectionState.doctor ? 'Going to the doctor' : '',
                familyPlanning: selectionState.familyPlanning,
                antenatalCare: selectionState.antenatalCare,
                attention: attentionLevel,
                visitClassification: patientNature,
                signsAndSymptoms,
                consultationFeeRequired: selectionState.doctor ? consultationFeeRequired : '',
                consultationFeeAmount: selectionState.doctor && consultationFeeRequired === 'yes' ? consultationFeeAmount : ''
            };

            const urlToUse = selectionState.doctor ? urls.gotodoctor : urls.submitwalkinpt2;

            const submitResponse = await fetch(urlToUse, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (submitResponse.ok) {
                const responseData = await submitResponse.json();
                if (responseData.message === 'Data inserted successfully') {
                    toast.success('Patient form submitted successfully');
                    
                    if (selectionState.doctor) {
                        setSuccessMessage('Please send the patient to the doctor');
                        setPatientAction('doctor');
                    } else if (selectionState.lab || selectionState.radiology) {
                        setSuccessMessage('Please send the patient to the cashier');
                        setPatientAction('cashier');
                    } else if (selectionState.familyPlanning) {
                        setSuccessMessage('Please send the patient to the family planning department');
                        setPatientAction('familyPlanning');
                    } else if (selectionState.antenatalCare) {
                        setSuccessMessage('Please send the patient to the Antenatal Care department');
                        setPatientAction('antenatalCare');
                    }
                    
                    setSuccessModal(true);
                }
            } else {
                throw new Error('Error submitting patient data');
            }
        } catch (error) {
            toast.error('Error submitting form! Make sure you have inserted the patient details.', {
                autoClose: false,
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Format age display
    const formatAgeDisplay = (years, months, weeks) => {
        const parts = [];
        if (years && parseInt(years) > 0) parts.push(`${years}y`);
        if (months && parseInt(months) > 0) parts.push(`${months}m`);
        if (weeks && parseInt(weeks) > 0) parts.push(`${weeks}w`);
        return parts.length > 0 ? parts.join(' ') : 'Not specified';
    };

    // Get classification color
    const getClassificationColor = (level) => {
        if (level === 'low' || level === 'high') return theme.danger;
        if (level === 'normal') return theme.accent;
        return theme.textMuted;
    };

    // Check if all required fields are filled
    const isFormValid = () => {
        return (
            newPatientDetails.firstName.trim() !== '' &&
            newPatientDetails.lastName.trim() !== '' &&
            newPatientDetails.phoneNumber.trim() !== '' &&
            (newPatientDetails.years || newPatientDetails.months || newPatientDetails.weeks) &&
            newPatientDetails.sex !== '' &&
            newPatientDetails.religion !== '' &&
            newPatientDetails.address.trim() !== ''
        );
    };

    const [pulseRateStatus, setPulseRateStatus] = useState({ status: '', level: '' });
    const [bloodPressureStatus, setBloodPressureStatus] = useState({ status: '', level: '' });
    const [temperatureStatus, setTemperatureStatus] = useState('');
    const [spo2Status, setSpo2Status] = useState('');
    const [respiratoryRateStatus, setRespiratoryRateStatus] = useState('');

    const [selectionState, setSelectionState] = useState({
        doctor: false,
        lab: false,
        radiology: false,
        familyPlanning: false,
        antenatalCare: false,
    });

    const [attentionLevel, setAttentionLevel] = useState('');
    const [patientNature, setPatientNature] = useState('');

    // Styles
    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: theme.mainBg,
            borderRadius: '12px',
        },
        header: {
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '24px',
            fontWeight: '600',
            borderBottom: `1px solid ${theme.cardBorder}`,
            paddingBottom: '15px'
        },
        section: {
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: theme.cardBg,
            borderRadius: '12px',
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
        sectionHeading: {
            color: theme.textPrimary,
            marginBottom: '15px',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        button: {
            backgroundColor: theme.info,
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
        },
        primaryButton: {
            backgroundColor: theme.info
        },
        dangerButton: {
            backgroundColor: theme.danger
        },
        successButton: {
            backgroundColor: theme.accent
        },
        input: {
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '8px',
            fontSize: '14px',
            transition: 'border 0.3s ease',
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            color: theme.textSecondary,
            fontSize: '13px'
        },
        vitalInput: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '12px',
            flex: '1',
            minWidth: '180px'
        },
        classificationMessage: (level) => ({
            color: getClassificationColor(level),
            fontWeight: '500',
            fontSize: '12px',
            marginTop: '4px',
            fontStyle: 'italic'
        }),
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
        },
        modalContent: {
            backgroundColor: theme.cardBg,
            padding: '25px',
            borderRadius: '12px',
            width: '95%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            border: `1px solid ${theme.cardBorder}`,
        },
        modalHeader: {
            color: theme.textPrimary,
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '600',
            borderBottom: `1px solid ${theme.cardBorder}`,
            paddingBottom: '10px'
        },
        patientGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
        },
        patientField: {
            marginBottom: '12px'
        },
        patientLabel: {
            display: 'block',
            marginBottom: '4px',
            fontWeight: '500',
            color: theme.textMuted,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        patientInput: {
            width: '100%',
            padding: '8px',
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '6px',
            backgroundColor: theme.tableHeader,
            fontSize: '14px',
            color: theme.textPrimary
        },
        radioGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '8px'
        },
        radioOption: {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'background 0.2s',
            ':hover': {
                background: theme.infoLight
            }
        },
        radioInput: {
            marginRight: '12px',
            cursor: 'pointer',
            width: '18px',
            height: '18px',
        },
        radioLabel: {
            fontSize: '14px',
            color: theme.textPrimary,
            cursor: 'pointer',
            flex: 1
        },
        testModalContent: {
            backgroundColor: theme.cardBg,
            borderRadius: '12px',
            width: '95%',
            maxWidth: '700px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
            border: `1px solid ${theme.cardBorder}`,
        },
        testModalHeader: {
            padding: '15px',
            borderBottom: `1px solid ${theme.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: theme.cardBg,
            zIndex: 10
        },
        testModalBody: {
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 120px)'
        },
        testModalFooter: {
            padding: '12px',
            borderTop: `1px solid ${theme.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.tableHeader,
            position: 'sticky',
            bottom: 0,
            zIndex: 10
        },
        totalPriceDisplay: {
            fontWeight: '600',
            color: theme.textPrimary,
            fontSize: '14px'
        },
        selectedTestsContainer: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginTop: "15px"
        },
        selectedTestsBox: {
            backgroundColor: theme.tableHeader,
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${theme.cardBorder}`
        },
        selectedTestsTitle: {
            fontSize: "0.9rem",
            marginBottom: "8px",
            color: theme.info,
            fontWeight: '600'
        },
        selectedTestsList: {
            listStyle: "none",
            padding: 0,
            margin: 0
        },
        selectedTestItem: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
            borderBottom: `1px solid ${theme.cardBorder}`,
            color: theme.textPrimary
        },
        removeButton: {
            backgroundColor: theme.danger + '20',
            color: theme.danger,
            border: '1px solid ' + theme.danger + '40',
            borderRadius: "6px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "0.75rem"
        },
        compactPatientCard: {
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
        },
        compactPatientHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
        },
        compactPatientName: {
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            margin: 0
        },
        compactPatientDetails: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
            fontSize: '13px'
        },
        detailItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        detailIcon: {
            color: theme.textMuted,
            width: '14px'
        },
        detailLabel: {
            fontWeight: '600',
            color: theme.textSecondary
        },
        detailValue: {
            color: theme.textMuted
        },
        expandButton: {
            background: 'none',
            border: 'none',
            color: theme.info,
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        successModal: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(3px)',
        },
        successContent: {
            backgroundColor: theme.cardBg,
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
            border: `1px solid ${theme.cardBorder}`,
        },
        successIcon: {
            fontSize: '40px',
            color: theme.accent,
            marginBottom: '15px'
        },
        successMessage: {
            fontSize: '16px',
            color: theme.textPrimary,
            marginBottom: '20px',
            lineHeight: '1.5'
        },
        vitalGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
        },
        addPatientButton: {
            backgroundColor: theme.info,
            color: 'white',
            padding: '10px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            width: '100%',
            ':hover': {
                backgroundColor: theme.info + 'dd',
                transform: 'translateY(-1px)',
            }
        },
        submitButton: {
            backgroundColor: theme.accent,
            color: 'white',
            padding: '12px 32px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'inline-block',
            ':hover': {
                backgroundColor: theme.accent + 'dd',
                transform: 'translateY(-1px)',
            }
        },
        fieldWithSuggestions: {
            position: 'relative',
        },
        errorText: {
            color: theme.danger,
            fontSize: '12px',
            marginTop: '4px',
        },
        requiredStar: {
            color: theme.danger,
            marginLeft: '4px',
        },
    };

    // Show loading spinner while fetching contacts
    if (loading) {
        return (
            <>
                <GlobalStyles theme={theme} />
                <div style={{ minHeight: '100vh', backgroundColor: theme.mainBg }}>
                    <Topbar token={urlToken} themeColor={currentTheme} />
                    <div style={{ paddingTop: TOPBAR_HEIGHT }}>
                        <LoadingSpinner theme={theme} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <GlobalStyles theme={theme} />
            <div style={{ 
                minHeight: '100vh', 
                backgroundColor: theme.mainBg,
                position: 'relative',
            }}>
                <ToastContainer 
                    position="top-right" 
                    autoClose={5000}
                    theme={currentTheme === 'blue' ? 'dark' : 'light'}
                />
                
                <Topbar token={urlToken} themeColor={currentTheme} />

                {/* Sidebar - only shown when patient is confirmed */}
                {showSidebar && readOnlyPatientDetails && !isChangingPatient && (
                    <PatientSidebar
                        patient={readOnlyPatientDetails}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        onClose={handleChangePatient}
                        theme={theme}
                    />
                )}

                {/* Main Content */}
                <main style={{
                    marginLeft: showSidebar && readOnlyPatientDetails && !isChangingPatient 
                        ? (sidebarCollapsed ? '80px' : '300px') 
                        : '0',
                    paddingTop: `${TOPBAR_HEIGHT}px`,
                    transition: 'margin-left 0.3s ease',
                    minHeight: '100vh',
                    position: 'relative',
                    zIndex: 800,
                }}>
                    <div style={{
                        ...styles.container,
                        animation: isChangingPatient ? 'slideOut 0.3s ease-out forwards' : 'fadeIn 0.4s ease-out',
                    }}>
                        <h1 style={styles.header}>
                            {showSidebar && readOnlyPatientDetails ? (
                                <span>PATIENT TRIAGE — {readOnlyPatientDetails.firstName} {readOnlyPatientDetails.lastName}</span>
                            ) : (
                                'PATIENT TRIAGE'
                            )}
                        </h1>

                        {/* Patient Details Form - Always visible when no patient is selected */}
                        {!showSidebar && (
                            <div className="form-section">
                                <h2 className="form-section-title">
                                    <FontAwesomeIcon icon={faUser} style={{ color: theme.info }} />
                                    Patient Information
                                </h2>
                                
                                {/* Full width top inputs - First Name, Last Name, Phone Number */}
                                <div className="full-width-inputs">
                                    {/* First Name with Suggestions */}
                                    <div className="full-width-field" ref={firstNameRef}>
                                        <label className="form-label required-field">First Name</label>
                                        <div style={styles.fieldWithSuggestions}>
                                            <input
                                                type="text"
                                                placeholder="Enter first name"
                                                value={newPatientDetails.firstName}
                                                onChange={(e) => {
                                                    setNewPatientDetails({ ...newPatientDetails, firstName: e.target.value });
                                                    setIsTyping(true);
                                                    handleSuggestName(e.target.value);
                                                }}
                                                onFocus={() => setIsTyping(true)}
                                                className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                                            />
                                            
                                            {/* Pointing Finger Animation */}
                                            <PointingFinger show={showPointingFinger} />
                                            
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && filteredContacts.length > 0 && (
                                                <div className="suggestions-container" ref={suggestionsRef}>
                                                    {filteredContacts.map((contact) => (
                                                        <div
                                                            key={contact.contact_id}
                                                            className="suggestion-item"
                                                            onClick={() => handleContactSelect(contact)}
                                                        >
                                                            <div className="suggestion-avatar">
                                                                {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                                                            </div>
                                                            <div className="suggestion-info">
                                                                <div className="suggestion-name">
                                                                    {contact.first_name} {contact.last_name}
                                                                </div>
                                                                <div className="suggestion-details">
                                                                    <span>📞 {contact.phone_number}</span>
                                                                    <span>🆔 {contact.contact_id}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {validationErrors.firstName && (
                                            <div style={styles.errorText}>{validationErrors.firstName}</div>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div className="full-width-field">
                                        <label className="form-label required-field">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter last name"
                                            value={newPatientDetails.lastName}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, lastName: e.target.value })}
                                            className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                                        />
                                        {validationErrors.lastName && (
                                            <div style={styles.errorText}>{validationErrors.lastName}</div>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div className="full-width-field">
                                        <label className="form-label required-field">Phone Number</label>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <FontAwesomeIcon icon={faPhone} style={{ marginRight: '8px', color: theme.textMuted }} />
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                value={newPatientDetails.phoneNumber}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, phoneNumber: e.target.value })}
                                                className={`form-input ${validationErrors.phoneNumber ? 'error' : ''}`}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        {validationErrors.phoneNumber && (
                                            <div style={styles.errorText}>{validationErrors.phoneNumber}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Grid for remaining fields */}
                                <div className="form-grid">
                                    {/* Age Section */}
                                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label required-field">Age</label>
                                        <div className="age-input-group">
                                            <div className="age-input">
                                                <input
                                                    type="number"
                                                    placeholder="Years"
                                                    value={newPatientDetails.years}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, years: e.target.value })}
                                                    className={`form-input ${validationErrors.age ? 'error' : ''}`}
                                                    min="0"
                                                />
                                                <small style={{ color: theme.textMuted, fontSize: '11px' }}>Years</small>
                                            </div>
                                            <div className="age-input">
                                                <input
                                                    type="number"
                                                    placeholder="Months"
                                                    value={newPatientDetails.months}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, months: e.target.value })}
                                                    className={`form-input ${validationErrors.age ? 'error' : ''}`}
                                                    min="0"
                                                />
                                                <small style={{ color: theme.textMuted, fontSize: '11px' }}>Months</small>
                                            </div>
                                            <div className="age-input">
                                                <input
                                                    type="number"
                                                    placeholder="Weeks"
                                                    value={newPatientDetails.weeks}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, weeks: e.target.value })}
                                                    className={`form-input ${validationErrors.age ? 'error' : ''}`}
                                                    min="0"
                                                />
                                                <small style={{ color: theme.textMuted, fontSize: '11px' }}>Weeks</small>
                                            </div>
                                        </div>
                                        {validationErrors.age && (
                                            <div style={styles.errorText}>{validationErrors.age}</div>
                                        )}
                                    </div>

                                    {/* Sex */}
                                    <div className="form-field">
                                        <label className="form-label required-field">Gender</label>
                                        <select
                                            value={newPatientDetails.sex}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, sex: e.target.value })}
                                            className={`form-input ${validationErrors.sex ? 'error' : ''}`}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                        {validationErrors.sex && (
                                            <div style={styles.errorText}>{validationErrors.sex}</div>
                                        )}
                                    </div>

                                    {/* Religion */}
                                    <div className="form-field">
                                        <label className="form-label required-field">Religion</label>
                                        <select
                                            value={newPatientDetails.religion}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, religion: e.target.value })}
                                            className={`form-input ${validationErrors.religion ? 'error' : ''}`}
                                        >
                                            <option value="">Select Religion</option>
                                            <option value="Christian">Christian</option>
                                            <option value="Islamic">Islamic</option>
                                        </select>
                                        {validationErrors.religion && (
                                            <div style={styles.errorText}>{validationErrors.religion}</div>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label required-field">Address</label>
                                        <input
                                            type="text"
                                            placeholder="Full address"
                                            value={newPatientDetails.address}
                                            onChange={(e) => setNewPatientDetails({ ...newPatientDetails, address: e.target.value })}
                                            className={`form-input ${validationErrors.address ? 'error' : ''}`}
                                        />
                                        {validationErrors.address && (
                                            <div style={styles.errorText}>{validationErrors.address}</div>
                                        )}
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Date of Birth (Optional)</label>
                                        {!noDobProvided ? (
                                            <>
                                                <input
                                                    type="date"
                                                    value={formatDate(newPatientDetails.dob)}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, dob: e.target.value })}
                                                    className="form-input"
                                                />
                                                <button
                                                    onClick={handleNoDobClick}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        backgroundColor: theme.accent + '20',
                                                        color: theme.accent,
                                                        border: '1px solid ' + theme.accent + '40',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        marginTop: '8px',
                                                    }}
                                                >
                                                    Click if patient refuses to provide date of birth
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: theme.accentLight,
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ color: theme.accent }}>
                                                    Date of birth set to default (01/01/0001)
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setNoDobProvided(false);
                                                        setNewPatientDetails(prev => ({ ...prev, dob: '' }));
                                                    }}
                                                    style={{
                                                        backgroundColor: theme.danger + '20',
                                                        color: theme.danger,
                                                        border: '1px solid ' + theme.danger + '40',
                                                        borderRadius: '6px',
                                                        padding: '5px 10px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Next of Kin Section */}
                                <div style={{
                                    marginTop: '24px',
                                    padding: '20px',
                                    backgroundColor: theme.accentLight,
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.accent}40`,
                                }}>
                                    <h3 style={{
                                        ...styles.sectionHeading,
                                        color: theme.accent,
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                    }}>
                                        <FontAwesomeIcon icon={faUserFriends} style={{ marginRight: '8px' }} />
                                        Next of Kin Information (Optional)
                                    </h3>
                                    
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="form-label">Next of Kin Name</label>
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                value={newPatientDetails.nextOfKinName}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinName: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label className="form-label">Relationship</label>
                                            <select
                                                value={newPatientDetails.nextOfKinRelationship}
                                                onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinRelationship: e.target.value })}
                                                className="form-input"
                                            >
                                                <option value="">Select Relationship</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Child">Child</option>
                                                <option value="Sibling">Sibling</option>
                                                <option value="Relative">Relative</option>
                                                <option value="Friend">Friend</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label className="form-label">Contact Number</label>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <FontAwesomeIcon icon={faPhone} style={{ marginRight: '8px', color: theme.textMuted }} />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone number"
                                                    value={newPatientDetails.nextOfKinContact}
                                                    onChange={(e) => setNewPatientDetails({ ...newPatientDetails, nextOfKinContact: e.target.value })}
                                                    className="form-input"
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                    <button
                                        onClick={addContact}
                                        disabled={!isFormValid() || savePatientClicked}
                                        className="btn-primary"
                                        style={{
                                            ...styles.addPatientButton,
                                            maxWidth: '300px',
                                            margin: '0 auto',
                                            opacity: !isFormValid() || savePatientClicked ? 0.7 : 1,
                                            cursor: !isFormValid() || savePatientClicked ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {savePatientClicked ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: '8px' }} />
                                                Proceed to Triage
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Patient Vitals Section - Only visible when patient is confirmed */}
                        {readOnlyPatientDetails && (
                            <>
                                <div style={styles.section}>
                                    <h2 style={styles.sectionHeading}>
                                        <FontAwesomeIcon icon={faHeart} style={{ color: theme.danger }} />
                                        Patient Vitals
                                    </h2>
                                    <div style={styles.vitalGrid}>
                                        {/* Blood Pressure */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faTint} style={{ marginRight: '6px', color: theme.info }} />
                                                Blood Pressure (mmHg)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="120/80"
                                                value={bloodPressure}
                                                onChange={(e) => setBloodPressure(e.target.value)}
                                                style={styles.input}
                                            />
                                            {bloodPressureStatus.status && (
                                                <span style={styles.classificationMessage(bloodPressureStatus.level)}>
                                                    {bloodPressureStatus.status}
                                                </span>
                                            )}
                                        </div>

                                        {/* Pulse Rate */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faHeart} style={{ marginRight: '6px', color: theme.danger }} />
                                                Pulse Rate (bpm)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="72"
                                                value={pulseRate}
                                                onChange={(e) => setPulseRate(e.target.value)}
                                                style={styles.input}
                                            />
                                            {pulseRateStatus.status && (
                                                <span style={styles.classificationMessage(pulseRateStatus.level)}>
                                                    {pulseRateStatus.status}
                                                </span>
                                            )}
                                        </div>

                                        {/* Temperature */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: '6px', color: theme.warning }} />
                                                Temperature (°C)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="36.5"
                                                value={temperature}
                                                onChange={(e) => setTemperature(e.target.value)}
                                                style={styles.input}
                                            />
                                            {temperatureStatus && (
                                                <span style={styles.classificationMessage(
                                                    temperatureStatus.includes('Very High') ? 'high' : 
                                                    temperatureStatus.includes('High') ? 'high' : 
                                                    temperatureStatus.includes('Low') ? 'low' : 'normal'
                                                )}>
                                                    {temperatureStatus}
                                                </span>
                                            )}
                                        </div>

                                        {/* SPO2 */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>SPO2 (%)</label>
                                            <input
                                                type="text"
                                                placeholder="98"
                                                value={spo2}
                                                onChange={(e) => setSpo2(e.target.value)}
                                                style={styles.input}
                                            />
                                            {spo2Status && (
                                                <span style={styles.classificationMessage(spo2Status.includes('Warning') ? 'low' : 'normal')}>
                                                    {spo2Status}
                                                </span>
                                            )}
                                        </div>

                                        {/* Respiratory Rate */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faLungs} style={{ marginRight: '6px', color: theme.skyBlue }} />
                                                Respiratory Rate
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="16"
                                                value={respiratoryRate}
                                                onChange={(e) => setRespiratoryRate(e.target.value)}
                                                style={styles.input}
                                            />
                                            {respiratoryRateStatus && (
                                                <span style={styles.classificationMessage(respiratoryRateStatus.includes('Warning') ? 'high' : 'normal')}>
                                                    {respiratoryRateStatus}
                                                </span>
                                            )}
                                        </div>

                                        {/* Body Weight */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faWeight} style={{ marginRight: '6px', color: theme.textMuted }} />
                                                Body Weight (kg)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="70"
                                                value={bodyWeight}
                                                onChange={(e) => setBodyWeight(e.target.value)}
                                                style={styles.input}
                                            />
                                        </div>

                                        {/* Height */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>
                                                <FontAwesomeIcon icon={faRuler} style={{ marginRight: '6px', color: theme.textMuted }} />
                                                Height (cm)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="170"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                style={styles.input}
                                            />
                                        </div>

                                        {/* BMI */}
                                        <div style={styles.vitalInput}>
                                            <label style={styles.label}>BMI</label>
                                            <div style={{
                                                padding: '10px',
                                                backgroundColor: theme.tableHeader,
                                                borderRadius: '8px',
                                                minHeight: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                color: theme.textPrimary,
                                                border: `1px solid ${theme.cardBorder}`,
                                            }}>
                                                {bmi || '--'}
                                            </div>
                                            {bmiWarning && (
                                                <span style={styles.classificationMessage(
                                                    bmiWarning.includes('Underweight') || 
                                                    bmiWarning.includes('Overweight') || 
                                                    bmiWarning.includes('Obese') ? 'high' : 'normal'
                                                )}>
                                                    {bmiWarning}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Visit Classification */}
                                <div style={styles.section}>
                                    <h2 style={styles.sectionHeading}>Visit Classification</h2>
                                    <div style={styles.radioGroup}>
                                        {['referral', 'scheduled', 'emergency', 'follow-up', 'routine', 'consultation', 'Walk-in for Specific Services'].map((type) => (
                                            <label key={type} style={styles.radioOption}>
                                                <input
                                                    type="radio"
                                                    id={type}
                                                    name="visitClassification"
                                                    checked={patientNature === type}
                                                    onChange={() => setPatientNature(type)}
                                                    style={styles.radioInput}
                                                />
                                                <span style={styles.radioLabel}>
                                                    {type.replace('-', ' ').charAt(0).toUpperCase() + type.replace('-', ' ').slice(1)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Signs and Symptoms */}
                                <div style={styles.section}>
                                    <label style={styles.label}>Any message to the Doctor</label>
                                    <textarea
                                        placeholder="Enter signs and symptoms, doctor preference, or any relevant information..."
                                        value={signsAndSymptoms}
                                        onChange={(e) => setSignsAndSymptoms(e.target.value)}
                                        style={{
                                            ...styles.input,
                                            minHeight: '100px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Consultation Fee Section */}
                                {selectionState.doctor && (
                                    <div style={styles.section}>
                                        <h2 style={styles.sectionHeading}>Consultation Fee</h2>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={styles.label}>Will the patient pay consultation fee?</label>
                                            <div style={styles.radioGroup}>
                                                <label style={styles.radioOption}>
                                                    <input
                                                        type="radio"
                                                        name="consultationFee"
                                                        value="yes"
                                                        checked={consultationFeeRequired === 'yes'}
                                                        onChange={() => handleConsultationFeeChange('yes')}
                                                        style={styles.radioInput}
                                                    />
                                                    <span style={styles.radioLabel}>Yes</span>
                                                </label>
                                                <label style={styles.radioOption}>
                                                    <input
                                                        type="radio"
                                                        name="consultationFee"
                                                        value="no"
                                                        checked={consultationFeeRequired === 'no'}
                                                        onChange={() => handleConsultationFeeChange('no')}
                                                        style={styles.radioInput}
                                                    />
                                                    <span style={styles.radioLabel}>No</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        {showConsultationFeeInput && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={styles.label}>Consultation Fee Amount</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    value={consultationFeeAmount}
                                                    onChange={(e) => setConsultationFeeAmount(e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    style={styles.input}
                                                    min="0"
                                                />
                                                {clinicInfo?.consultation_fee && clinicInfo.consultation_fee > 0 && (
                                                    <small style={{ color: theme.textMuted, fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                                        Clinic default consultation fee: {formatPrice(clinicInfo.consultation_fee)}
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Patient Routing Section */}
                                <div style={styles.section}>
                                    <h2 style={styles.sectionHeading}>Patient Routing</h2>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                        <div>
                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="doctor"
                                                        name="action"
                                                        value="doctor"
                                                        checked={selectionState.doctor}
                                                        onChange={() => handleOptionToggle('doctor')}
                                                        style={{ marginRight: "8px", width: '18px', height: '18px' }}
                                                    />
                                                    <span style={styles.label}>Send this patient to the doctor</span>
                                                </label>
                                            </div>

                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="familyPlanning"
                                                        name="action"
                                                        value="familyPlanning"
                                                        checked={selectionState.familyPlanning}
                                                        onChange={() => handleOptionToggle('familyPlanning')}
                                                        style={{ marginRight: "8px", width: '18px', height: '18px' }}
                                                    />
                                                    <span style={styles.label}>Send to family planning department</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="lab"
                                                        name="action"
                                                        value="lab"
                                                        checked={selectionState.lab}
                                                        onChange={() => handleOptionToggle('lab')}
                                                        style={{ marginRight: "8px", width: '18px', height: '18px' }}
                                                    />
                                                    <span style={styles.label}>Patient only wants lab tests</span>
                                                </label>
                                            </div>

                                            <div style={{ marginBottom: "12px" }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="radiology"
                                                        name="action"
                                                        value="radiology"
                                                        checked={selectionState.radiology}
                                                        onChange={() => handleOptionToggle('radiology')}
                                                        style={{ marginRight: "8px", width: '18px', height: '18px' }}
                                                    />
                                                    <span style={styles.label}>Patient only needs radiology</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected Tests Display */}
                                    {(selectedLabTests.length > 0 || selectedRadiologyTests.length > 0) && (
                                        <div style={styles.selectedTestsContainer}>
                                            {selectedLabTests.length > 0 && (
                                                <div style={styles.selectedTestsBox}>
                                                    <h3 style={styles.selectedTestsTitle}>Selected Lab Tests</h3>
                                                    <ul style={styles.selectedTestsList}>
                                                        {selectedLabTests.map((test, index) => (
                                                            <li key={index} style={styles.selectedTestItem}>
                                                                <span>{test}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedLabTests(prevTests => prevTests.filter(prevTest => prevTest !== test));
                                                                    }}
                                                                    style={styles.removeButton}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedRadiologyTests.length > 0 && (
                                                <div style={styles.selectedTestsBox}>
                                                    <h3 style={styles.selectedTestsTitle}>Selected Radiology Exams</h3>
                                                    <ul style={styles.selectedTestsList}>
                                                        {selectedRadiologyTests.map((exam, index) => (
                                                            <li key={index} style={styles.selectedTestItem}>
                                                                <span>{exam}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRadiologyTests(prevTests => prevTests.filter(prevTest => prevTest !== exam));
                                                                    }}
                                                                    style={styles.removeButton}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Attention Level */}
                                <div style={styles.section}>
                                    <h2 style={styles.sectionHeading}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: theme.warning }} />
                                        Priority Level
                                    </h2>
                                    <div style={styles.radioGroup}>
                                        {['critical', 'average', 'routine'].map((level) => (
                                            <label key={level} style={styles.radioOption}>
                                                <input
                                                    type="radio"
                                                    id={level}
                                                    name="attention"
                                                    checked={attentionLevel === level}
                                                    onChange={() => toggleAttentionLevel(level)}
                                                    style={styles.radioInput}
                                                />
                                                <span style={styles.radioLabel}>
                                                    {level === 'critical'
                                                        ? 'Critical - Immediate Attention Required'
                                                        : level === 'average'
                                                        ? 'Moderate - Prompt Attention Needed'
                                                        : 'Routine - Standard Priority'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                        
                                {/* Submit Button */}
                                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                    <button
                                        onClick={submitForm}
                                        disabled={submitting}
                                        style={{
                                            ...styles.submitButton,
                                            backgroundColor: submitting ? theme.textMuted : theme.accent,
                                            opacity: submitting ? 0.7 : 1,
                                            cursor: submitting ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {submitting ? 'Processing...' : 'Complete Triage'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* Phone Verification Modal */}
                {showPhoneVerification && selectedContact && (
                    <div style={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPhoneVerification(false);
                            setSelectedContact(null);
                        }
                    }}>
                        <div className="phone-verification-modal">
                            <h3 style={{ color: theme.textPrimary, marginBottom: '15px', fontSize: '20px' }}>Verify Phone Number</h3>
                            <p style={{ color: theme.textSecondary, marginBottom: '20px' }}>
                                Is this the correct phone number for <strong>{selectedContact.first_name} {selectedContact.last_name}</strong>?
                            </p>
                            <div style={{
                                padding: '20px',
                                backgroundColor: theme.infoLight,
                                borderRadius: '12px',
                                marginBottom: '24px',
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.info,
                                border: `2px solid ${theme.info}40`,
                            }}>
                                {selectedContact.phone_number}
                            </div>
                            <div className="phone-verification-actions">
                                <button
                                    onClick={() => handlePhoneVerification(true)}
                                    className="btn-primary"
                                    style={{ padding: '12px 24px', fontSize: '16px' }}
                                >
                                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
                                    Yes, i confirm this is the client
                                </button>
                                <button
                                    onClick={() => handlePhoneVerification(false)}
                                    className="btn-secondary"
                                    style={{ padding: '12px 24px', fontSize: '16px' }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: '8px' }} />
                                    No just same names but different client
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lab Tests Modal */}
                {showLabTestPrompt && (
                    <div style={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowLabTestPrompt(false);
                            if (selectedLabTests.length === 0) {
                                setSelectionState(prev => ({ ...prev, lab: false }));
                            }
                        }
                    }}>
                        <div style={styles.testModalContent}>
                            <div style={styles.testModalHeader}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.3rem',
                                    color: theme.textPrimary
                                }}>Select Laboratory Tests</h2>
                                <button 
                                    onClick={() => {
                                        setShowLabTestPrompt(false);
                                        if (selectedLabTests.length === 0) {
                                            setSelectionState(prev => ({ ...prev, lab: false }));
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: theme.textMuted,
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        ':hover': {
                                            background: theme.dangerLight,
                                            color: theme.danger,
                                        }
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div style={styles.testModalBody}>
                                <div style={{
                                    padding: '10px 15px',
                                    backgroundColor: theme.tableHeader,
                                    borderBottom: `1px solid ${theme.cardBorder}`
                                }}>
                                    <div style={styles.totalPriceDisplay}>
                                        Total: {formatPrice(calculateTotalPrice(selectedLabTests, labTestsAvailable))}
                                    </div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '3px' }}>
                                        {selectedLabTests.length} test(s) selected
                                    </div>
                                </div>
                                
                                {labTestsAvailable.map(test => (
                                    <div 
                                        key={test.name}
                                        onClick={() => handleTestSelection(test.name, 'lab')}
                                        className={`test-row ${selectedLabTests.includes(test.name) ? 'selected' : ''}`}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flex: 1
                                        }}>
                                            <input
                                                type="checkbox"
                                                id={`lab-${test.name}`}
                                                value={test.name}
                                                checked={selectedLabTests.includes(test.name)}
                                                onChange={() => handleTestSelection(test.name, 'lab')}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    marginRight: '10px',
                                                    width: '16px',
                                                    height: '16px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <label 
                                                htmlFor={`lab-${test.name}`}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    cursor: 'pointer',
                                                    flex: 1,
                                                    marginRight: '8px',
                                                    fontSize: '14px',
                                                    color: theme.textPrimary
                                                }}
                                            >
                                                {test.name}
                                            </label>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontWeight: '500',
                                                color: theme.textSecondary,
                                                minWidth: '70px',
                                                textAlign: 'right',
                                                fontSize: '13px'
                                            }}>
                                                {formatPrice(test.price)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={styles.testModalFooter}>
                                <div style={{ fontSize: '14px', color: theme.textPrimary }}>
                                    <strong>Total Selected:</strong> {selectedLabTests.length} tests
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button 
                                        onClick={() => handleClearAllTests('lab')}
                                        className="btn-danger"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowLabTestPrompt(false);
                                            if (selectedLabTests.length === 0) {
                                                setSelectionState(prev => ({ ...prev, lab: false }));
                                            }
                                        }}
                                        className="btn-primary"
                                    >
                                        Confirm Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Radiology Tests Modal */}
                {showRadiologyTestPrompt && (
                    <div style={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowRadiologyTestPrompt(false);
                            if (selectedRadiologyTests.length === 0) {
                                setSelectionState(prev => ({ ...prev, radiology: false }));
                            }
                        }
                    }}>
                        <div style={styles.testModalContent}>
                            <div style={styles.testModalHeader}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.3rem',
                                    color: theme.textPrimary
                                }}>Select Radiology Examinations</h2>
                                <button 
                                    onClick={() => {
                                        setShowRadiologyTestPrompt(false);
                                        if (selectedRadiologyTests.length === 0) {
                                            setSelectionState(prev => ({ ...prev, radiology: false }));
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: theme.textMuted,
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        ':hover': {
                                            background: theme.dangerLight,
                                            color: theme.danger,
                                        }
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div style={styles.testModalBody}>
                                <div style={{
                                    padding: '10px 15px',
                                    backgroundColor: theme.tableHeader,
                                    borderBottom: `1px solid ${theme.cardBorder}`
                                }}>
                                    <div style={styles.totalPriceDisplay}>
                                        Total: {formatPrice(calculateTotalPrice(selectedRadiologyTests, radiologyTestsAvailable))}
                                    </div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '3px' }}>
                                        {selectedRadiologyTests.length} exam(s) selected
                                    </div>
                                </div>
                                
                                {radiologyTestsAvailable.map(test => (
                                    <div 
                                        key={test.name}
                                        onClick={() => handleTestSelection(test.name, 'radiology')}
                                        className={`test-row ${selectedRadiologyTests.includes(test.name) ? 'selected' : ''}`}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flex: 1
                                        }}>
                                            <input
                                                type="checkbox"
                                                id={`rad-${test.name}`}
                                                value={test.name}
                                                checked={selectedRadiologyTests.includes(test.name)}
                                                onChange={() => handleTestSelection(test.name, 'radiology')}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    marginRight: '10px',
                                                    width: '16px',
                                                    height: '16px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <label 
                                                htmlFor={`rad-${test.name}`}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    cursor: 'pointer',
                                                    flex: 1,
                                                    marginRight: '8px',
                                                    fontSize: '14px',
                                                    color: theme.textPrimary
                                                }}
                                            >
                                                {test.name}
                                            </label>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontWeight: '500',
                                                color: theme.textSecondary,
                                                minWidth: '70px',
                                                textAlign: 'right',
                                                fontSize: '13px'
                                            }}>
                                                {formatPrice(test.price)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={styles.testModalFooter}>
                                <div style={{ fontSize: '14px', color: theme.textPrimary }}>
                                    <strong>Total Selected:</strong> {selectedRadiologyTests.length} exams
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button 
                                        onClick={() => handleClearAllTests('radiology')}
                                        className="btn-danger"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowRadiologyTestPrompt(false);
                                            if (selectedRadiologyTests.length === 0) {
                                                setSelectionState(prev => ({ ...prev, radiology: false }));
                                            }
                                        }}
                                        className="btn-primary"
                                    >
                                        Confirm Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {successModal && (
                    <div style={styles.successModal}>
                        <div style={styles.successContent}>
                            <div style={styles.successIcon}>✓</div>
                            <h2 style={{ color: theme.accent, marginBottom: '12px', fontSize: '20px' }}>Triage Complete</h2>
                            <p style={styles.successMessage}>{successMessage}</p>
                            <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '20px' }}>
                                This modal will close automatically in 2 seconds...
                            </p>
                            <button
                                onClick={() => {
                                    setSuccessModal(false);
                                    resetForm();
                                }}
                                className="btn-primary"
                            >
                                Continue Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Triage;
