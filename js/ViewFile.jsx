import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import TreatmentPlanModal from './TreatmentPlanModal';
import CreditInvestigationModal from './CreditInvestigationModal';
import EditFileModal from './EditFileModal';
import InvestigationModal from './InvestigationModal';
import PasswordPromptModal from './PasswordPromptModal';
import BillingInvoiceModal from './BillingInvoiceModal';
import axios from 'axios';
import './viewfile.css';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  // Blue theme - IMPROVED with better contrast and readability
  blue: {
    sidebarBg: '#0a1e4a',        // Dark blue background
    sidebarBorder: '#1e3a8a',     // Royal blue border
    activeNavBg: '#2563eb',        // Bright blue for active items
    activeNavText: '#ffffff',      // White text for active
    inactiveNavText: '#e0e7ff',    // Light blue-gray for inactive
    navHoverBg: '#1e3a8a',         // Royal blue on hover
    sectionHeaderText: '#94a3b8',  // Slate gray for headers
    mainBg: '#f0f4ff',             // Very light blue background for main content
    cardBg: '#ffffff',              // White cards for contrast
    cardBorder: '#d4e0ff',          // Light blue border
    accent: '#16a34a',              // Green accent
    accentLight: '#dcfce7',         // Light green
    danger: '#dc2626',              // Red
    dangerLight: '#fef2f2',         // Light red
    warning: '#d97706',             // Orange
    warningLight: '#fffbeb',         // Light orange
    info: '#2563eb',                 // Blue info
    infoLight: '#e0edff',            // Light blue
    skyBlue: '#38bdf8',              // Sky blue
    skyBlueLight: '#e0f2fe',         // Light sky blue
    textPrimary: '#0a1e4a',          // Dark blue for primary text (was black)
    textSecondary: '#1e3a8a',        // Royal blue for secondary text
    textMuted: '#4b5563',            // Gray for muted text
    tableHeader: '#e8f0fe',          // Light blue table header
    tableBorder: '#cbd5e1',          // Gray border
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
    badgeRed: { bg: '#fee2e2', text: '#991b1b' },
    badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeSky: { bg: '#e0f2fe', text: '#0369a1' },
    badgeGray: { bg: '#f1f5f9', text: '#475569' },
    filterSection: '#0d2257',        // Slightly lighter dark blue
    collapseButtonBg: '#1e3a8a',
    collapseButtonHover: '#2563eb',
    collapseButtonText: '#ffffff',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    iconBright: '#fbbf24',           // Yellow icons
    iconHover: '#f59e0b',             // Darker yellow on hover
    sidebarText: '#ffffff',           // White text in sidebar
    sidebarTextMuted: '#a5b4fc',      // Light purple-blue for muted sidebar text
    // Vitals colors
    vitalNormal: '#16a34a',
    vitalWarning: '#d97706',
    vitalDanger: '#dc2626',
    vitalBg: '#f8fafc',
  },
  // White/Light theme (unchanged)
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
    // Vitals colors
    vitalNormal: '#16a34a',
    vitalWarning: '#d97706',
    vitalDanger: '#dc2626',
    vitalBg: '#f8fafc',
  }
};

// Topbar height constant
const TOPBAR_HEIGHT = 60;

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
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
    padding: collapsed ? '12px 0' : '10px 14px',
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
    padding: collapsed ? '0' : '0 14px',
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
      padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
      background: c.bg, color: c.text,
    };
  },
  panel: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.tableBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: theme.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.tableBorder}`,
  },
  infoLabel: {
    fontSize: '12px',
    color: theme.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
    color: theme.textPrimary,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(3px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  // Vitals card styles
  vitalsCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  vitalItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  vitalLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: theme.textMuted,
  },
  vitalValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  vitalUnit: {
    fontSize: '11px',
    color: theme.textMuted,
    marginLeft: '2px',
    fontWeight: '400',
  },
  vitalStatus: (value, type) => {
    // Simple validation logic - can be enhanced based on clinical guidelines
    if (!value) return {};
    
    let status = 'normal';
    if (type === 'bp') {
      const [sys, dia] = value.split('/').map(Number);
      if (sys >= 140 || dia >= 90) status = 'danger';
      else if (sys >= 130 || dia >= 80) status = 'warning';
    } else if (type === 'temp') {
      const temp = parseFloat(value);
      if (temp >= 38 || temp <= 35) status = 'danger';
      else if (temp >= 37.5 || temp <= 35.5) status = 'warning';
    } else if (type === 'hr') {
      const hr = parseFloat(value);
      if (hr > 100 || hr < 60) status = 'danger';
      else if (hr > 90 || hr < 65) status = 'warning';
    } else if (type === 'rr') {
      const rr = parseFloat(value);
      if (rr > 20 || rr < 12) status = 'danger';
      else if (rr > 18 || rr < 14) status = 'warning';
    } else if (type === 'spo2') {
      const spo2 = parseFloat(value);
      if (spo2 < 90) status = 'danger';
      else if (spo2 < 95) status = 'warning';
    } else if (type === 'weight') {
      // Weight alone doesn't indicate much without height/BMI
      return { color: theme.textPrimary };
    }
    
    return {
      color: status === 'danger' ? theme.danger : status === 'warning' ? theme.warning : theme.vitalNormal,
    };
  },
});

// ─── Format date helper ─────────────────────────────────────────────────────
const formatDateWithMonthName = (dateString) => {
  if (!dateString) return 'Unknown Date';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
};

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
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    .nav-item:hover { 
      background: ${theme.navHoverBg} !important; 
      color: ${theme.activeNavText} !important; 
    }
    
    .nav-icon { 
      color: ${theme.iconBright}; 
      font-size: 18px; 
      transition: all 0.2s ease; 
    }
    
    .nav-item:hover .nav-icon { 
      color: ${theme.iconHover}; 
      transform: scale(1.1); 
    }
    
    .collapse-btn:hover { 
      background: ${theme.collapseButtonHover} !important; 
      transform: scale(1.05); 
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .action-btn {
      background: ${theme.tableHeader};
      border: 1px solid ${theme.cardBorder};
      color: ${theme.textSecondary};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    
    .action-btn:hover {
      border-color: ${theme.accent};
      background: ${theme.accentLight};
      color: ${theme.accent};
    }
    
    .primary-btn {
      background: ${theme.accent};
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    
    .primary-btn:hover {
      background: ${theme.accent}dd;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(22, 163, 74, 0.2);
    }
    
    .danger-btn {
      background: ${theme.danger};
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .danger-btn:hover {
      background: ${theme.danger}dd;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
    }
    
    .info-card {
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
      animation: slideIn 0.4s ease-out;
    }
    
    .info-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .clickable-textarea {
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .clickable-textarea:hover {
      background: ${theme.tableHeader} !important;
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
        transform: translateX(20px);
      }
    }
    
    .slide-out {
      animation: slideOut 0.3s ease-out forwards;
    }
    
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
    
    .blink {
      animation: blink 2s linear infinite;
    }

    @keyframes blink {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .expandable-content {
      max-height: 150px;
      overflow: hidden;
      position: relative;
      transition: max-height 0.3s ease;
    }
    
    .expandable-content.expanded {
      max-height: none;
    }
    
    .expandable-content::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(transparent, ${theme.cardBg});
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    
    .expandable-content.expanded::after {
      opacity: 0;
    }
    
    .see-more-btn {
      background: none;
      border: none;
      color: ${theme.info};
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      margin-top: 4px;
      text-decoration: underline;
    }
    
    .see-more-btn:hover {
      color: ${theme.accent};
    }

    /* ── Quick-Nav Tab Rail ────────────────────────────────────────────────── */
    .quick-nav-bar {
      position: fixed;
      right: 0;
      top: ${TOPBAR_HEIGHT}px;
      height: calc(100vh - ${TOPBAR_HEIGHT}px);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 4px;
      z-index: 950;
      pointer-events: none;
      padding: 12px 0;
    }

    .quick-nav-btn {
      pointer-events: all;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      background: ${theme.cardBg};
      color: ${theme.textSecondary};
      border: 1px solid ${theme.cardBorder};
      border-right: none;
      border-radius: 10px 10px 0 0;
      padding: 14px 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      white-space: nowrap;
      cursor: pointer;
      outline: none;
      box-shadow: -2px 0 0 0 rgba(148, 163, 184, 0.4), -3px 3px 12px rgba(0, 0, 0, 0.10);
      transition: background 0.2s ease, color 0.2s ease, padding 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      opacity: 0;
      animation: tabSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes tabSlideIn {
      from { opacity: 0; transform: rotate(180deg) translateY(-16px); }
      to   { opacity: 1; transform: rotate(180deg) translateY(0);     }
    }

    .quick-nav-btn:nth-child(1) { animation-delay: 0.06s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(2) { animation-delay: 0.12s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(3) { animation-delay: 0.18s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(4) { animation-delay: 0.24s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(5) { animation-delay: 0.30s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(6) { animation-delay: 0.36s; animation-fill-mode: forwards; }
    .quick-nav-btn:nth-child(7) { animation-delay: 0.42s; animation-fill-mode: forwards; }

    .quick-nav-btn:hover {
      background: ${theme.infoLight};
      color: ${theme.info};
      padding: 18px 8px;
      border-color: ${theme.info};
      box-shadow: -3px 0 0 0 ${theme.info}, -5px 3px 20px rgba(37, 99, 235, 0.20);
    }

    .quick-nav-btn:active {
      background: ${theme.infoLight};
      padding: 14px 8px;
    }

    .quick-nav-btn[data-section="vitals"]         { border-left: 3px solid #ec4899; }
    .quick-nav-btn[data-section="complaints"]     { border-left: 3px solid ${theme.skyBlue}; }
    .quick-nav-btn[data-section="clinicalNotes"]  { border-left: 3px solid ${theme.info}; }
    .quick-nav-btn[data-section="diagnosis"]      { border-left: 3px solid ${theme.warning}; }
    .quick-nav-btn[data-section="treatmentPlan"]  { border-left: 3px solid ${theme.accent}; }
    .quick-nav-btn[data-section="investigations"] { border-left: 3px solid #8b5cf6; }
    .quick-nav-btn[data-section="treatmentChart"] { border-left: 3px solid #e11d48; }

    /* Visit counter pills */
    .visit-pill-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 16px;
    }

    .visit-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 10px;
      border-radius: 30px;
      background: ${theme.cardBg};
      border: 2px solid ${theme.cardBorder};
      color: ${theme.textSecondary};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .visit-pill:hover {
      border-color: ${theme.info};
      background: ${theme.infoLight};
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
    }

    .visit-pill.active {
      background: ${theme.info};
      border-color: ${theme.info};
      color: white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .visit-pill.today {
      position: relative;
    }

    .visit-pill.today::after {
      content: '';
      position: absolute;
      top: -4px;
      right: -4px;
      width: 10px;
      height: 10px;
      background: ${theme.accent};
      border-radius: 50%;
      border: 2px solid ${theme.cardBg};
    }

    /* Investigation panel redesign */
    .investigation-panel {
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      overflow: hidden;
    }

    .investigation-panel-header {
      padding: 14px 18px;
      background: ${theme.tableHeader};
      border-bottom: 2px solid ${theme.cardBorder};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .test-numbered-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .test-numbered-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 9px 14px;
      border-bottom: 1px solid ${theme.tableBorder};
      transition: background 0.15s ease;
    }

    .test-numbered-item:last-child {
      border-bottom: none;
    }

    .test-numbered-item:hover {
      background: ${theme.infoLight};
    }

    .test-number-badge {
      min-width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${theme.info};
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .test-name {
      font-size: 13px;
      color: ${theme.textPrimary};
      line-height: 1.5;
      font-weight: 500;
    }

    .empty-investigation {
      padding: 28px 18px;
      text-align: center;
      color: ${theme.textMuted};
      font-size: 13px;
    }

    .empty-investigation-icon {
      font-size: 28px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .section-anchor {
      scroll-margin-top: ${TOPBAR_HEIGHT + 16}px;
    }

    /* Visit counter chip */
    .visit-chip {
      display: inline-flex;
      align-items: center;
      background: ${theme.infoLight};
      color: ${theme.info};
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid ${theme.info};
    }

    .visit-chip:hover {
      background: ${theme.info};
      color: white;
    }

    .visit-chip i {
      margin-right: 4px;
      font-size: 14px;
    }

    /* Previous visits dropdown */
    .previous-visits-btn {
      background: ${theme.infoLight};
      border: 1px solid ${theme.info};
      color: ${theme.info};
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .previous-visits-btn:hover {
      background: ${theme.info};
      color: white;
    }

    .visits-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 250px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .visit-item {
      padding: 10px 14px;
      border-bottom: 1px solid ${theme.tableBorder};
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .visit-item:last-child {
      border-bottom: none;
    }

    .visit-item:hover {
      background: ${theme.infoLight};
    }

    .visit-date {
      font-size: 13px;
      font-weight: 600;
      color: ${theme.textPrimary};
    }

    .visit-id {
      font-size: 11px;
      color: ${theme.textMuted};
      margin-top: 2px;
    }

    .visit-active {
      background: ${theme.infoLight};
      border-left: 3px solid ${theme.info};
    }

    /* Next of kin collapsible */
    .next-of-kin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 12px 0;
      margin-bottom: 8px;
      border-bottom: 1px solid ${theme.cardBorder};
    }

    .next-of-kin-header h4 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: ${theme.sidebarTextMuted};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .next-of-kin-content {
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .next-of-kin-content.collapsed {
      max-height: 0;
      opacity: 0;
    }

    .next-of-kin-content.expanded {
      max-height: 200px;
      opacity: 1;
    }

    /* Allergy input styling */
    .allergy-section {
      background: ${theme.sidebarBg};
      border: 1px solid ${theme.sidebarBorder};
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
      transition: all 0.3s ease;
    }

    .allergy-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      margin-bottom: 16px;
    }

    .allergy-header h4 {
      font-size: 15px;
      font-weight: 600;
      color: ${theme.sidebarText};
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .allergy-textarea {
      min-height: 120px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      padding: 14px;
      border: 1px solid ${theme.sidebarBorder};
      border-radius: 8px;
      width: 100%;
      resize: vertical;
      background: ${theme.cardBg};
      color: ${theme.textPrimary};
      margin-bottom: 12px;
    }

    .allergy-textarea:focus {
      outline: none;
      border-color: ${theme.info};
      box-shadow: 0 0 0 3px ${theme.infoLight};
    }

    .allergy-save-btn {
      background: ${theme.info};
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
    }

    .allergy-save-btn:hover:not(:disabled) {
      background: ${theme.info}dd;
      transform: translateY(-1px);
    }

    .allergy-save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .allergy-instruction {
      background: ${theme.warningLight};
      color: ${theme.warning};
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
      border-left: 3px solid ${theme.warning};
    }

    .allergy-success {
      background: ${theme.accentLight};
      color: ${theme.accent};
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Sidebar text colors for blue theme */
    .sidebar-text-primary {
      color: ${theme.sidebarText};
    }

    .sidebar-text-secondary {
      color: ${theme.sidebarTextMuted};
    }

    .sidebar-bg {
      background: ${theme.sidebarBg};
    }

    .sidebar-border {
      border-color: ${theme.sidebarBorder};
    }
  `}</style>
);

// ─── Quick Navigation Bar ──────────────────────────────────────────────────
const QuickNavBar = ({ onScrollTo }) => {
  const navItems = [
    { label: 'Vitals',       section: 'vitals'        },
    { label: 'P/C',          section: 'complaints'    },
    { label: 'Notes', section: 'clinicalNotes' },
    { label: 'Dx',    section: 'diagnosis'     },
    { label: 'Rx',           section: 'treatmentPlan' },
    { label: 'Investigations', section: 'investigations'},
    { label: 'Rx Chart',        section: 'treatmentChart'},
  ];

  return (
    <div className="quick-nav-bar">
      {navItems.map((item) => (
        <button
          key={item.section}
          className="quick-nav-btn"
          data-section={item.section}
          onClick={() => onScrollTo(item.section)}
          title={`Jump to ${item.label}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ─── Visit Pills Component ─────────────────────────────────────────────────
const VisitPills = ({ visits, currentFileId, onSelectVisit, theme }) => {
  if (!visits || visits.length === 0) return null;

  const sortedVisits = [...visits].sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
  
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="visit-pill-container">
      {sortedVisits.map((visit, index) => {
        const visitNumber = visit.visit_number || index + 1;
        const isActive = visit.file_id === currentFileId;
        const isTodayVisit = isToday(visit.date_time);
        
        return (
          <button
            key={visit.file_id}
            className={`visit-pill ${isActive ? 'active' : ''} ${isTodayVisit ? 'today' : ''}`}
            onClick={() => onSelectVisit(visit.file_id)}
            title={`Visit ${visitNumber} - ${formatDateWithMonthName(visit.date_time)}`}
          >
            {visitNumber}
          </button>
        );
      })}
    </div>
  );
};

// ─── Vitals Card Component ─────────────────────────────────────────────────
const VitalsCard = ({ data, theme }) => {
  const styles_ = styles(theme);
  
  const getVitalStatus = (value, type) => {
    if (!value || value === '') return { color: theme.textMuted };
    return styles_.vitalStatus(value, type);
  };

  const formatValue = (value, unit) => {
    if (!value || value === '') return '—';
    return `${value}${unit}`;
  };

  return (
    <div className="info-card" style={{ padding: '20px' }}>
      <div style={{ ...styles_.panelTitle, marginBottom: '16px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', flexShrink: 0 }} />
        Vital Signs
      </div>
      <div style={styles_.vitalsCard}>
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Blood Pressure</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.blood_pressure, 'bp') }}>
            {formatValue(data?.blood_pressure, '')}
            {data?.blood_pressure && <span style={styles_.vitalUnit}>mmHg</span>}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Temperature</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.temperature, 'temp') }}>
            {formatValue(data?.temperature, '°C')}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>SpO₂</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.spo2, 'spo2') }}>
            {formatValue(data?.spo2, '%')}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Heart Rate</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.pulse_rate, 'hr') }}>
            {formatValue(data?.pulse_rate, '')}
            {data?.pulse_rate && <span style={styles_.vitalUnit}>bpm</span>}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Respiratory Rate</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.respiratory_rate, 'rr') }}>
            {formatValue(data?.respiratory_rate, '')}
            {data?.respiratory_rate && <span style={styles_.vitalUnit}>/min</span>}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Weight</span>
          <span style={{ ...styles_.vitalValue, ...getVitalStatus(data?.body_weight, 'weight') }}>
            {formatValue(data?.body_weight, '')}
            {data?.body_weight && <span style={styles_.vitalUnit}>kg</span>}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>Height</span>
          <span style={{ ...styles_.vitalValue, color: data?.height ? theme.textPrimary : theme.textMuted }}>
            {formatValue(data?.height, '')}
            {data?.height && <span style={styles_.vitalUnit}>cm</span>}
          </span>
        </div>
        
        <div style={styles_.vitalItem}>
          <span style={styles_.vitalLabel}>BMI</span>
          <span style={{ ...styles_.vitalValue, color: theme.textMuted }}>
            {data?.height && data?.body_weight 
              ? ((data.body_weight / ((data.height / 100) ** 2)).toFixed(1))
              : '—'}
            {data?.height && data?.body_weight && <span style={styles_.vitalUnit}>kg/m²</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Component ─────────────────────────────────────────────────────
const PatientSidebar = ({ fileData, collapsed, onToggleCollapse, hoveredItem, setHoveredItem, otherFiles = [], onLoadPreviousFile, currentFileId, theme }) => {
  const [nextOfKinExpanded, setNextOfKinExpanded] = useState(false);
  const [showVisitsDropdown, setShowVisitsDropdown] = useState(false);
  const [allergyText, setAllergyText] = useState('');
  const [savingAllergy, setSavingAllergy] = useState(false);
  const [hasAllergyData, setHasAllergyData] = useState(false);
  const [allergyExpanded, setAllergyExpanded] = useState(false);
  const [allergySaved, setAllergySaved] = useState(false);

  const initials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'P';
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase() || 'P';
  };

  const formatAge = (data) => {
    if (!data) return 'Not provided';
    const years = data.age ? parseInt(data.age) : 0;
    const months = data.age_months ? parseInt(data.age_months) : 0;
    const weeks = data.age_weeks ? parseInt(data.age_weeks) : 0;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  // Load allergy data from localStorage on mount
  useEffect(() => {
    if (fileData?.fileData?.contact_id) {
      const savedAllergy = localStorage.getItem(`allergy_${fileData.fileData.contact_id}`);
      if (savedAllergy) {
        setAllergyText(savedAllergy);
        setHasAllergyData(true);
      }
    }
  }, [fileData]);

  const handleSaveAllergy = async () => {
    if (!allergyText.trim()) {
      toast.warning('Please enter allergy information');
      return;
    }

    setSavingAllergy(true);
    setAllergySaved(false);

    try {
      // Get token from URL
      const pathParts = window.location.pathname.split('/');
      const tokenFromUrl = pathParts[2];

      const response = await fetch(urls.submitAllergies, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenFromUrl,
          contact_id: fileData.fileData.contact_id,
          allergies: allergyText.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Feature coming soon');
      }

      const data = await response.json();
      
      // Save to localStorage as backup
      localStorage.setItem(`allergy_${fileData.fileData.contact_id}`, allergyText.trim());
      
      setHasAllergyData(true);
      setAllergySaved(true);
      toast.success('Allergy information saved successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => setAllergySaved(false), 3000);
    } catch (error) {
      console.error('Error saving allergies:', error);
      toast.error('Feature coming soon');
    } finally {
      setSavingAllergy(false);
    }
  };

  const sortedVisits = otherFiles && otherFiles.length > 0 
    ? [...otherFiles].sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
    : [];

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
      boxShadow: collapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.1)',
      transition: 'width 0.3s ease',
      zIndex: 900,
      color: theme.sidebarText,
    }}>
      <div style={{
        padding: collapsed ? '20px 10px' : '20px 16px',
        borderBottom: `2px solid ${theme.sidebarBorder}`,
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
            👤
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>ClinicPro</div>
              <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Patient Records</div>
            </div>
          )}
        </div>

        <button
          className="collapse-btn"
          onClick={onToggleCollapse}
          style={{
            ...styles(theme).collapseButton,
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
            order: collapsed ? 1 : 2,
            marginLeft: collapsed ? 0 : 'auto',
            flexShrink: 0
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && fileData && (
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
              {fileData.fileData?.first_name || ''} {fileData.fileData?.last_name || ''}
            </div>
            <div style={{ fontSize: '12px', color: theme.sidebarTextMuted, marginTop: '4px' }}>
              OPD: {fileData.fileData?.opd_no || 'Not provided'}
            </div>
            
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ ...styles(theme).sectionHeader(false), color: theme.sidebarTextMuted }}>PATIENT DETAILS</div>
            <div style={{ background: theme.filterSection, borderRadius: '10px', padding: '16px' }}>
              <div style={styles(theme).infoRow}>
                <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Age</span>
                <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{formatAge(fileData.fileData)}</span>
              </div>
              <div style={styles(theme).infoRow}>
                <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Sex</span>
                <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.fileData?.sex || 'Not provided'}</span>
              </div>
              <div style={styles(theme).infoRow}>
                <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Phone</span>
                <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.fileData?.phone_number || 'Not provided'}</span>
              </div>
              <div style={styles(theme).infoRow}>
                <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Address</span>
                <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.fileData?.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Next of Kin - Collapsible */}
          <div style={{ marginBottom: '24px' }}>
            <div className="next-of-kin-header" onClick={() => setNextOfKinExpanded(!nextOfKinExpanded)}>
              <h4>NEXT OF KIN</h4>
              <span style={{ fontSize: '18px', color: theme.sidebarTextMuted }}>
                {nextOfKinExpanded ? '▼' : '▶'}
              </span>
            </div>
            <div className={`next-of-kin-content ${nextOfKinExpanded ? 'expanded' : 'collapsed'}`}>
              <div style={{ background: theme.filterSection, borderRadius: '10px', padding: '16px' }}>
                <div style={styles(theme).infoRow}>
                  <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Name</span>
                  <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.nextOfKin?.name || fileData.fileData?.next_of_kin || 'Not provided'}</span>
                </div>
                <div style={styles(theme).infoRow}>
                  <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Contact</span>
                  <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.nextOfKin?.contact || fileData.fileData?.next_of_kin_contact || 'Not provided'}</span>
                </div>
                <div style={styles(theme).infoRow}>
                  <span style={{ ...styles(theme).infoLabel, color: theme.sidebarTextMuted }}>Relationship</span>
                  <span style={{ ...styles(theme).infoValue, color: theme.sidebarText }}>{fileData.nextOfKin?.relationship || fileData.fileData?.relationship_with_next_of_kin || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {otherFiles && otherFiles.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  className="previous-visits-btn"
                  onClick={() => setShowVisitsDropdown(!showVisitsDropdown)}
                  style={{ width: '100%', justifyContent: 'center', background: theme.infoLight, color: theme.info }}
                >
                  📋 Previous Visits ({otherFiles.length})
                  <span style={{ fontSize: '16px' }}>{showVisitsDropdown ? '▲' : '▼'}</span>
                </button>
                {showVisitsDropdown && (
                  <div className="visits-dropdown">
                    {sortedVisits.map((visit) => (
                      <div
                        key={visit.file_id}
                        className={`visit-item ${visit.file_id === currentFileId ? 'visit-active' : ''}`}
                        onClick={() => {
                          onLoadPreviousFile(visit.file_id);
                          setShowVisitsDropdown(false);
                        }}
                      >
                        <div className="visit-date">
                          {formatDateWithMonthName(visit.date_time)}
                        </div>
                        <div className="visit-id">File ID: {visit.file_id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Allergies Section */}
            <div className="allergy-section">
              <div className="allergy-header" onClick={() => setAllergyExpanded(!allergyExpanded)}>
                <h4>
                  <span>⚠️</span>
                  Patient Allergies
                </h4>
                <span style={{ fontSize: '18px', color: theme.sidebarTextMuted }}>
                  {allergyExpanded ? '▼' : '▶'}
                </span>
              </div>
              
              {allergyExpanded && (
                <div>
                  <div className="allergy-instruction">
                    Enter any known allergies, including drug reactions that may affect treatment.
                  </div>
                  
                  {allergySaved && (
                    <div className="allergy-success">
                      <span>✓</span>
                      Allergy information saved successfully
                    </div>
                  )}
                  
                  <textarea
                    className="allergy-textarea"
                    value={allergyText}
                    onChange={(e) => setAllergyText(e.target.value)}
                    placeholder="e.g., Penicillin - severe rash, NSAIDs - stomach upset, Codeine - nausea, etc."
                  />
                  <button
                    className="allergy-save-btn"
                    onClick={handleSaveAllergy}
                    disabled={savingAllergy}
                  >
                    {savingAllergy ? 'Saving...' : hasAllergyData ? 'Update Allergies' : 'Save Allergies'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div
            style={{ fontSize: '24px', color: theme.sidebarText, cursor: 'pointer', position: 'relative' }}
            onMouseEnter={() => setHoveredItem('patient')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            👤
            {hoveredItem === 'patient' && (
              <div style={styles(theme).tooltip}>
                {fileData?.fileData?.first_name || 'Patient'} {fileData?.fileData?.last_name || ''}
              </div>
            )}
          </div>
          {otherFiles && otherFiles.length > 0 && (
            <div
              style={{ fontSize: '24px', color: theme.sidebarText, cursor: 'pointer', position: 'relative' }}
              onMouseEnter={() => setHoveredItem('visits')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => toast.info(`${otherFiles.length} previous visits available. Expand sidebar to view.`)}
            >
              📋
              {hoveredItem === 'visits' && <div style={styles(theme).tooltip}>{otherFiles.length} Previous Visits</div>}
            </div>
          )}
          <div
            style={{ fontSize: '24px', color: theme.sidebarText, cursor: 'pointer', position: 'relative' }}
            onMouseEnter={() => setHoveredItem('allergies')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => toast.info('Expand sidebar to manage allergies')}
          >
            ⚠️
            {hoveredItem === 'allergies' && <div style={styles(theme).tooltip}>Allergies</div>}
          </div>
        </div>
      )}
    </aside>
  );
};

// ─── Investigation Panel Component ─────────────────────────────────────────
const InvestigationPanel = ({
  title,
  icon,
  tests,
  statusMessage,
  onRequest,
  onCancel,
  onCredit,
  accentColor,
  theme,
}) => {
  const hasTests = tests && tests.length > 0;
  const showPaymentActions = statusMessage && statusMessage.includes('making payment');

  return (
    <div className="investigation-panel">
      <div className="investigation-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: theme.textPrimary }}>{title}</span>
          {hasTests && (
            <span style={{
              background: accentColor,
              color: 'white',
              borderRadius: '20px',
              padding: '1px 8px',
              fontSize: '11px',
              fontWeight: '700',
              marginLeft: '4px',
            }}>
              {tests.length}
            </span>
          )}
        </div>
        <button className="action-btn" onClick={onRequest} style={{ fontSize: '12px', padding: '5px 12px' }}>
          + Request
        </button>
      </div>

      {hasTests ? (
        <ul className="test-numbered-list">
          {tests.map((test, index) => (
            <li key={index} className="test-numbered-item">
              <span className="test-number-badge" style={{ background: accentColor }}>
                {index + 1}
              </span>
              <span className="test-name">{test}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-investigation">
          <div className="empty-investigation-icon">{icon}</div>
          <div>No {title.toLowerCase()} ordered yet</div>
        </div>
      )}

      {statusMessage && (
        <div style={{
          margin: '0',
          padding: '12px 18px',
          background: theme.infoLight,
          borderTop: `1px solid ${theme.tableBorder}`,
          borderLeft: `3px solid ${theme.info}`,
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme.textPrimary }}>
            <strong>Status:</strong> {statusMessage}
          </p>
          {showPaymentActions && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="danger-btn"
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={onCredit}
              >
                Approve on Credit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Section Heading component ───────────────────────────────────────────────
const SectionHeading = ({ color, children, theme }) => (
  <div style={styles(theme).panelTitle}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
    {children}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
function ViewFile() {
  const [fileData, setFileData] = useState(null);
  const [editableFields, setEditableFields] = useState({});
  const [labTestsAvailable, setLabTestsAvailable] = useState([]);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [radiologyTestsAvailable, setRadiologyTestsAvailable] = useState([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]);
  const [submittingLabTest, setSubmittingLabTest] = useState(false);
  const [submittingRadiologyTest, setSubmittingRadiologyTest] = useState(false);
  const [diagnosisClicked, setDiagnosisClicked] = useState(false);
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);
  const [treatmentNotesClicked, setTreatmentNotesClicked] = useState(false);
  const [clinicalNotesClicked, setClinicalNotesClicked] = useState(false);
  const [signsAndSymptomsClicked, setSignsAndSymptomsClicked] = useState(false);
  const [urlToken, setUrlToken] = useState('');
  const [showLabTestPrompt, setShowLabTestPrompt] = useState(false);
  const [showRadiologyTestPrompt, setShowRadiologyTestPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [selectedChartEntry, setSelectedChartEntry] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalType, setCreditModalType] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    signsAndSymptoms: false,
    clinicalNotes: false,
    diagnosis: false
  });
  const [selectedTreatmentDate, setSelectedTreatmentDate] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [fileCache, setFileCache] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [currentTheme, setCurrentTheme] = useState('blue'); // default theme
  const [showVisitsDropdown, setShowVisitsDropdown] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(true); // Flag to control polling

  const { token, fileId } = useParams();
  const urlTheme = parseThemeFromSearch(window.location.search);
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  
  // Ref to track if component is mounted
  const isMounted = useRef(true);
  // Ref to store interval ID
  const pollingIntervalRef = useRef(null);

  // ── Section heading refs for scroll-to navigation ────────────────────────
  const vitalsHeadingRef         = useRef(null);
  const complaintsHeadingRef     = useRef(null);
  const clinicalNotesHeadingRef  = useRef(null);
  const diagnosisHeadingRef      = useRef(null);
  const treatmentPlanHeadingRef   = useRef(null);
  const investigationsHeadingRef  = useRef(null);
  const treatmentChartHeadingRef  = useRef(null);

  const scrollPositionRef = useRef(0);

  // ── Check theme from security response ────────────────────────────────────
  useEffect(() => {
    const checkTheme = async () => {
      try {
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          const themeColor = securityData.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          setEmployeeName(securityData.employee_name);
          saveSessionToken(securityData.clinic_session_token);
        } else {
          const errorData = await securityResponse.json();
          if (errorData.error === 'Session expired') {
            navigate(`/dashboard?token=${errorData.clinic_session_token}`);
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
      }
    };

    checkTheme();
  }, [navigate, token]);

  // Get the active theme colors
  const theme = colors[currentTheme];

  // ── Scroll handler: scrolls so the section HEADING is at the top ─────────
  const scrollToSection = (section) => {
    const refMap = {
      vitals:         vitalsHeadingRef,
      complaints:     complaintsHeadingRef,
      clinicalNotes:  clinicalNotesHeadingRef,
      diagnosis:      diagnosisHeadingRef,
      treatmentPlan:  treatmentPlanHeadingRef,
      investigations: investigationsHeadingRef,
      treatmentChart: treatmentChartHeadingRef,
    };
    const ref = refMap[section];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load from cache utility
  const getCachedFile = (fileId) => {
    const cached = fileCache[fileId];
    if (cached) {
      const now = Date.now();
      // Cache expires after 5 minutes
      if (now - cached.timestamp < 300000) {
        return cached.data;
      }
    }
    return null;
  };

  // Save to cache utility
  const cacheFileData = (fileId, data) => {
    setFileCache(prev => ({
      ...prev,
      [fileId]: {
        data,
        timestamp: Date.now()
      }
    }));
  };

  useEffect(() => {
    const extractToken = () => {
      try {
        const url = window.location.href;
        const extractedToken = url.split('/').slice(-2, -1)[0];
        setUrlToken(extractedToken);
      } catch (error) {
        console.error("Error extracting token from URL:", error);
      }
    };
    extractToken();
    
    // Set mounted ref
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      // Clear polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch file data function - now with silent update option
  const fetchFileData = async (fileIdToFetch = null, silent = false) => {
    const targetFileId = fileIdToFetch || currentFileId || fileId;
    
    if (!targetFileId) return;
    
    // Check cache first (skip cache check if it's a periodic silent update)
    if (!silent) {
      const cached = getCachedFile(targetFileId);
      if (cached) {
        if (isMounted.current) {
          processFileData(cached, targetFileId);
        }
        return;
      }
    }

    try {
      const response = await fetch(urls.viewfile2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: targetFileId,
          token: token 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch file data');
      }
      
      const data = await response.json();
      
      // Cache the response
      if (isMounted.current) {
        cacheFileData(targetFileId, data);
        processFileData(data, targetFileId);
        
        // Store other files list if present
        if (data.otherFiles) {
          setOtherFiles(data.otherFiles);
        }
      }
    } catch (error) {
      console.error('Error fetching file data:', error);
      // Only show error toast for non-silent fetches
      if (!silent) {
        toast.error('Failed to load patient data');
      }
    }
  };

  // Separate function for silent periodic updates - ALWAYS uses currentFileId
  const silentRefreshFileData = async () => {
    // Only refresh if we have a current file ID and polling is active
    if (!currentFileId || !isPollingActive || !isMounted.current) return;
    
    try {
      const response = await fetch(urls.viewfile2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: currentFileId, // Always use current active file ID
          token: token 
        }),
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (isMounted.current) {
        // Update cache
        cacheFileData(currentFileId, data);
        
        // Update state silently - no loading indicators, no toast messages
        setFileData(data);
        setEditableFields({
          blood_pressure: data.fileData.blood_pressure,
          temperature: data.fileData.temperature,
          spo2: data.fileData.spo2,
          body_weight: data.fileData.body_weight,
          height: data.fileData.height,
          respiratory_rate: data.fileData.respiratory_rate,
          pulse_rate: data.fileData.pulse_rate,
          signs_and_symptoms: data.fileData.signs_and_symptoms,
          clinical_notes: data.fileData.clinical_notes,
          lab_tests: data.fileData.lab_tests,
          radiology_exams: data.fileData.radiology_exams,
          diagnosis: data.fileData.diagnosis,
          treatment_plan: data.fileData.treatment_plan,
          treatment_notes: data.fileData.treatment_notes || '',
        });
        
        if (data.treatmentChart && data.treatmentChart.length > 0) {
          const dates = [...new Set(data.treatmentChart.map(entry => entry.date))];
          setAvailableDates(dates);
        }
        
        if (data.otherFiles) {
          setOtherFiles(data.otherFiles);
        }
      }
    } catch (error) {
      // Silently log errors but don't show to user for periodic updates
      console.error('Silent refresh failed:', error);
    }
  };

  const processFileData = (data, targetFileId) => {
    setFileData(data);
    setEditableFields({
      blood_pressure: data.fileData.blood_pressure,
      temperature: data.fileData.temperature,
      spo2: data.fileData.spo2,
      body_weight: data.fileData.body_weight,
      height: data.fileData.height,
      respiratory_rate: data.fileData.respiratory_rate,
      pulse_rate: data.fileData.pulse_rate,
      signs_and_symptoms: data.fileData.signs_and_symptoms,
      clinical_notes: data.fileData.clinical_notes,
      lab_tests: data.fileData.lab_tests,
      radiology_exams: data.fileData.radiology_exams,
      diagnosis: data.fileData.diagnosis,
      treatment_plan: data.fileData.treatment_plan,
      treatment_notes: data.fileData.treatment_notes || '',
    });
    if (data.treatmentChart && data.treatmentChart.length > 0) {
      const dates = [...new Set(data.treatmentChart.map(entry => entry.date))];
      setAvailableDates(dates);
    }
    if (data.otherFiles) {
      setOtherFiles(data.otherFiles);
    }
    setCurrentFileId(targetFileId);
    
    // Reactivate polling when file changes
    setIsPollingActive(true);
  };

  const loadPreviousFile = async (newFileId) => {
    if (newFileId === currentFileId) return;
    
    // Temporarily pause polling during transition
    setIsPollingActive(false);
    
    setSlideDirection('left');
    setIsTransitioning(true);
    
    setTimeout(async () => {
      try {
        const cached = getCachedFile(newFileId);
        if (cached) {
          processFileData(cached, newFileId);
        } else {
          await fetchFileData(newFileId);
        }
        
        // Update URL without reload
        const newPath = window.location.pathname.replace(currentFileId, newFileId);
        window.history.pushState({}, '', newPath);
        
        setSlideDirection('right');
        setTimeout(() => {
          setIsTransitioning(false);
          setSlideDirection('');
          // Resume polling after transition completes
          setIsPollingActive(true);
        }, 300);
      } catch (error) {
        console.error('Error loading previous file:', error);
        toast.error('Failed to load previous visit');
        setIsTransitioning(false);
        setSlideDirection('');
        // Resume polling even on error
        setIsPollingActive(true);
      }
    }, 300);
  };

  const fetchAvailableLabTests = async () => {
    try {
      const pathParts = window.location.pathname.split('/');
      const tokenFromUrl = pathParts[2];
      const response = await fetch(urls.testsavailable, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl }),
      });
      if (!response.ok) throw new Error('Failed to fetch available lab tests');
      const data = await response.json();
      if (isMounted.current) {
        setLabTestsAvailable(data);
      }
    } catch (error) {
      console.error('Error fetching available lab tests:', error);
    }
  };

  const fetchAvailableRadiologyTests = async () => {
    try {
      const pathParts = window.location.pathname.split('/');
      const tokenFromUrl = pathParts[2];
      const response = await fetch(urls.radiologytestsavailable, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl }),
      });
      if (!response.ok) throw new Error('Failed to fetch available radiology exams');
      const data = await response.json();
      if (isMounted.current) {
        setRadiologyTestsAvailable(data);
      }
    } catch (error) {
      console.error('Error fetching available radiology exams:', error);
    }
  };

  // Initial data fetch and polling setup
  useEffect(() => {
    setCurrentFileId(fileId);
    const fetchInitialData = async () => {
      setLoading(true);
      await fetchFileData(fileId, false);
      setLoading(false);
    };
    
    fetchInitialData();
    
    // Fetch available tests ONCE when component mounts
    fetchAvailableLabTests();
    fetchAvailableRadiologyTests();
    
    // Clean up previous interval on unmount or when fileId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fileId]); // This runs when URL fileId changes

  // Separate useEffect for polling that depends on currentFileId AND isPollingActive
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Only set up new interval if we have a current file ID and polling is active
    if (currentFileId && isPollingActive) {
      pollingIntervalRef.current = setInterval(() => {
        silentRefreshFileData();
      }, 8000); // 8 seconds
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentFileId, isPollingActive]); // Re-run when currentFileId or isPollingActive changes

  // Function to refresh available tests when needed
  const refreshAvailableTests = async () => {
    await fetchAvailableLabTests();
    await fetchAvailableRadiologyTests();
  };

  const handleLabTestRequest = () => {
    scrollPositionRef.current = window.pageYOffset;
    // Refresh tests before showing modal to ensure latest data
    refreshAvailableTests();
    setShowLabTestPrompt(true);
  };

  const handleRadiologyTestRequest = () => {
    scrollPositionRef.current = window.pageYOffset;
    // Refresh tests before showing modal to ensure latest data
    refreshAvailableTests();
    setShowRadiologyTestPrompt(true);
  };

  const submitLabTests = () => {
    setSubmittingLabTest(true);
    fetch(urls.submitlabtest, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: currentFileId, tests: selectedLabTests }),
    })
      .then(response => response.json())
      .then(() => {
        setShowLabTestPrompt(false);
        setSelectedLabTests([]);
        toast.success("Lab tests ordered successfully");
        fetchFileData(currentFileId, false); // Refresh data with loading
        setTimeout(() => window.scrollTo(0, scrollPositionRef.current), 0);
      })
      .catch(() => toast.error("Failed to order lab tests"))
      .finally(() => setSubmittingLabTest(false));
  };

  const submitRadiologyTest = () => {
    setSubmittingRadiologyTest(true);
    fetch(urls.submitradiologyexam, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: currentFileId, tests: selectedRadiologyTests }),
    })
      .then(response => response.json())
      .then(() => {
        setShowRadiologyTestPrompt(false);
        setSelectedRadiologyTests([]);
        toast.success("Radiology exams ordered successfully");
        fetchFileData(currentFileId, false); // Refresh data with loading
        setTimeout(() => window.scrollTo(0, scrollPositionRef.current), 0);
      })
      .catch(() => toast.error("Failed to order radiology exams"))
      .finally(() => setSubmittingRadiologyTest(false));
  };

  const navigateToDischargeForm = () => {
    if (!fileData) return;
    navigate(`/discharge-form/${token}/${currentFileId}`, { state: { fileData } });
  };

  const navigateToReferralForm = () => {
    if (!fileData) return;
    navigate(`/referral-form/${token}/${currentFileId}`, { state: { fileData } });
  };

  const handlePrint = async () => {
    try {
      const response = await axios.post(urls.printfile, { fileId: currentFileId, token }, { responseType: 'blob' });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl);
      if (newWindow) newWindow.focus();
      else alert('Please allow popups to view the PDF.');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleCancelInvestigation = async (type) => {
    try {
      const response = await fetch(urls.cancelinvestigation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: currentFileId, type }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      toast.success(`Cancelled ${type} request`);
      fetchFileData(currentFileId, false);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleReverseRequest = (entry) => {
    setSelectedChartEntry(entry);
    setShowReverseModal(true);
  };

  const confirmReverseRequest = async (password) => {
    try {
      const pathParts = window.location.pathname.split('/');
      const tokenFromUrl = pathParts[2];
      const response = await fetch(urls.reversechart, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenFromUrl,
          fileId: currentFileId,
          id: selectedChartEntry.id,
          employeeName,
          password
        }),
      });
      const data = await response.json();
      if (data.message === "Request reversed successfully") {
        toast.success("Request reversed successfully");
        fetchFileData(currentFileId, false);
      } else {
        toast.error(data.message || "Failed to reverse request");
      }
    } catch (error) {
      toast.error("Error reversing request");
    } finally {
      setShowReverseModal(false);
    }
  };

  const handleCreditInvestigation = (type) => {
    setCreditModalType(type);
    setShowCreditModal(true);
  };

  const isRecentEntry = (entryDate, entryTime) => {
    const entryDateTime = new Date(`${entryDate}T${entryTime}`);
    const now = new Date();
    const diffInMinutes = (now - entryDateTime) / (1000 * 60);
    return diffInMinutes <= 10;
  };

  const toggleTreatmentNotesView = () => setTreatmentNotesClicked(!treatmentNotesClicked);

  const calculateTextareaHeight = (text) => {
    if (!text) return '60px';
    const lineHeight = 24;
    const lines = text.split('\n').length;
    return `${Math.max(60, lines * lineHeight)}px`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getFilteredTreatmentChart = () => {
    if (!fileData || !fileData.treatmentChart) return [];
    if (selectedTreatmentDate === 'all') return fileData.treatmentChart;
    return fileData.treatmentChart.filter(entry => entry.date === selectedTreatmentDate);
  };

  const textAreaStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    resize: 'none',
    width: '100%',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    padding: '12px',
    boxSizing: 'border-box',
    backgroundColor: theme.cardBg,
    cursor: 'pointer',
    color: theme.textPrimary,
    lineHeight: '1.6',
  };

  const renderExpandableContent = (content, section, onClick) => {
    if (!content) return (
      <textarea
        value=""
        style={{ ...textAreaStyle, height: '100px' }}
        placeholder="Click to add..."
        readOnly
        onClick={onClick}
      />
    );
    const needsExpansion = content.split('\n').length > 5 || content.length > 350;
    const isExpanded = expandedSections[section];

    return (
      <div>
        <div
          className={`expandable-content ${isExpanded ? 'expanded' : ''}`}
          onClick={onClick}
          style={{ cursor: 'pointer' }}
        >
          <textarea
            value={content}
            style={{ ...textAreaStyle, height: isExpanded ? 'auto' : '120px', minHeight: '120px' }}
            placeholder="Click to edit..."
            readOnly
          />
        </div>
        {needsExpansion && (
          <button
            className="see-more-btn"
            onClick={(e) => { e.stopPropagation(); toggleSection(section); }}
          >
            {isExpanded ? 'See less' : 'See more...'}
          </button>
        )}
      </div>
    );
  };

  const renderTreatmentChart = () => {
    const filteredChart = getFilteredTreatmentChart();
    if (!filteredChart || filteredChart.length === 0) {
      return (
        <div style={{
          background: theme.tableHeader,
          padding: '32px',
          borderRadius: '8px',
          textAlign: 'center',
          color: theme.textMuted,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          No treatment chart entries found for selected date
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: theme.tableHeader, borderBottom: `2px solid ${theme.accent}` }}>
              {['Date', 'Time', 'Drug', 'Dose', 'Qty', 'Next Dose', 'Administered By', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', color: theme.textSecondary, fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredChart.map((entry, index) => {
              const isReversible = isRecentEntry(entry.date, entry.time);
              return (
                <tr key={index} style={{
                  borderBottom: `1px solid ${theme.tableBorder}`,
                  background: index % 2 === 0 ? theme.cardBg : theme.tableHeader,
                }}>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>{entry.date}</td>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>{entry.time}</td>
                  <td style={{ padding: '12px', color: theme.textPrimary, fontWeight: '500' }}>{entry.drug_name}</td>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>{entry.dose}</td>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>{entry.quantity || '-'}</td>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>
                    {entry.next_dose_date || entry.next_dose_time
                      ? `${entry.next_dose_date || ''} ${entry.next_dose_time || ''}`.trim()
                      : 'File Closed'}
                  </td>
                  <td style={{ padding: '12px', color: theme.textPrimary }}>{entry.employee_name}</td>
                  <td style={{ padding: '12px' }}>
                    {isReversible ? (
                      <button
                        onClick={() => handleReverseRequest(entry)}
                        style={{
                          background: theme.warning,
                          color: 'white',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        Reverse
                      </button>
                    ) : (
                      <span style={{
                        background: theme.dangerLight,
                        color: theme.danger,
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        border: `1px solid ${theme.danger}`,
                      }}>
                        Locked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTreatmentNotes = () => {
    const notes = editableFields.treatment_notes || 'No treatment notes available';
    return (
      <div style={{
        background: theme.tableHeader,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${theme.cardBorder}`,
        minHeight: '100px'
      }}>
        {notes.split('\n').map((line, index) => {
          if (!line.trim()) return null;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px', lineHeight: '1.6' }}>
              <span style={{ marginRight: '10px', color: theme.accent, fontWeight: 'bold' }}>•</span>
              <span style={{ color: theme.textPrimary, fontSize: '14px', flex: 1 }}>{line.trim()}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>
          <PatientSidebar
            fileData={null}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
            otherFiles={otherFiles}
            onLoadPreviousFile={loadPreviousFile}
            currentFileId={currentFileId}
            theme={theme}
          />
          <main style={{ flex: 1, marginLeft: sidebarCollapsed ? '80px' : '300px', transition: 'margin-left 0.3s ease', paddingTop: `${TOPBAR_HEIGHT}px` }}>
            <Topbar token={urlToken} themeColor={currentTheme} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', padding: '28px' }}>
              <div style={{ width: '40px', height: '40px', border: `3px solid ${theme.tableBorder}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading patient record...</div>
            </div>
          </main>
        </div>
      </>
    );
  }

  const currentVisit = fileData?.visit_info?.current_visit || 0;
  const totalVisits = fileData?.visit_info?.total_visits || 0;

  return (
    <>
      <GlobalStyles theme={theme} />
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg, position: 'relative' }}>
        
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

        <PatientSidebar
          fileData={fileData}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
          otherFiles={otherFiles}
          onLoadPreviousFile={loadPreviousFile}
          currentFileId={currentFileId}
          theme={theme}
        />

        <QuickNavBar onScrollTo={scrollToSection} />

        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '300px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          paddingTop: `${TOPBAR_HEIGHT}px`,
          background: theme.mainBg,
          zIndex: 900,
        }}>
          <Topbar token={urlToken} themeColor={currentTheme} />

          <div 
            ref={mainContentRef}
            style={{ 
              flex: 1, 
              padding: '28px', 
              paddingRight: '64px', 
              overflowY: 'auto',
              animation: isTransitioning 
                ? (slideDirection === 'left' ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.4s ease-out')
                : 'slideIn 0.4s ease-out'
            }}
          >
            {fileData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ── Header card with visit counter and pills ── */}
                <div
                  style={{
                    ...styles(theme).panel,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h1 style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                        Patient Record — {formatDateWithMonthName(fileData.fileData?.date_time)}
                      </h1>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: theme.textMuted }}>
                        <span>OPD: {fileData.fileData?.opd_no || 'N/A'}</span>
                        <span>File ID: {currentFileId}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {fileData.creditBalance && (
                        <div style={{
                          ...styles(theme).badge(parseFloat(fileData.creditBalance) === 0 ? 'green' : parseFloat(fileData.creditBalance) <= 30000 ? 'orange' : 'red'),
                          fontSize: '14px',
                          padding: '6px 16px'
                        }}>
                          {parseFloat(fileData.creditBalance) === 0
                            ? '✓ Balance: 0 UGX'
                            : `⚠️ Balance: ${parseInt(fileData.creditBalance).toLocaleString()} UGX`}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="action-btn" onClick={handlePrint}>🖨️ Print</button>
                        <button className="action-btn" onClick={() => setShowBillingModal(true)}>💳 Invoice</button>
                        <button className="primary-btn" onClick={navigateToDischargeForm}>📄 Discharge</button>
                        <button className="primary-btn" onClick={navigateToReferralForm}>🔄 Refer</button>
                      </div>
                    </div>
                  </div>

                  {/* Visit Pills - Right next to the refer button as requested */}
                  {otherFiles && otherFiles.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <VisitPills
                        visits={otherFiles}
                        currentFileId={currentFileId}
                        onSelectVisit={loadPreviousFile}
                        theme={theme}
                      />
                    </div>
                  )}
                </div>

                {/* ── Vitals Card (Now at the top) ── */}
                <div ref={vitalsHeadingRef} className="section-anchor">
                  <VitalsCard data={fileData.fileData} theme={theme} />
                </div>

                {/* ── Presenting Complaints ── */}
                <div
                  className="info-card clickable-textarea"
                  onClick={() => { setSignsAndSymptomsClicked(true); setIsModalOpen(true); }}
                >
                  <div
                    ref={complaintsHeadingRef}
                    className="section-anchor"
                    style={styles(theme).panelTitle}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.skyBlue, flexShrink: 0 }} />
                    Presenting Complaints
                  </div>
                  {renderExpandableContent(editableFields.signs_and_symptoms, 'signsAndSymptoms', () => {
                    setSignsAndSymptomsClicked(true);
                    setIsModalOpen(true);
                  })}
                </div>

                {/* ── Clinical Notes ── */}
                <div
                  className="info-card clickable-textarea"
                  onClick={() => { setClinicalNotesClicked(true); setIsModalOpen(true); }}
                >
                  <div
                    ref={clinicalNotesHeadingRef}
                    className="section-anchor"
                    style={styles(theme).panelTitle}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.info, flexShrink: 0 }} />
                    Clinical Notes
                  </div>
                  {renderExpandableContent(editableFields.clinical_notes, 'clinicalNotes', () => {
                    setClinicalNotesClicked(true);
                    setIsModalOpen(true);
                  })}
                </div>

                {/* ── Diagnosis ── */}
                <div
                  className="info-card clickable-textarea"
                  onClick={() => { setDiagnosisClicked(true); setIsModalOpen(true); }}
                >
                  <div
                    ref={diagnosisHeadingRef}
                    className="section-anchor"
                    style={styles(theme).panelTitle}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.warning, flexShrink: 0 }} />
                    Diagnosis
                  </div>
                  {renderExpandableContent(editableFields.diagnosis, 'diagnosis', () => {
                    setDiagnosisClicked(true);
                    setIsModalOpen(true);
                  })}
                </div>

                {/* ── Treatment Plan ── */}
                <div
                  className="info-card clickable-textarea"
                  onClick={() => setShowTreatmentPlanModal(true)}
                >
                  <div
                    ref={treatmentPlanHeadingRef}
                    className="section-anchor"
                    style={styles(theme).panelTitle}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, flexShrink: 0 }} />
                    Treatment Plan
                  </div>
                  <textarea
                    value={editableFields.treatment_plan || ''}
                    style={{ ...textAreaStyle, height: calculateTextareaHeight(editableFields.treatment_plan) }}
                    placeholder="Click to prescribe medication..."
                    readOnly
                  />
                </div>

                {/* ── Investigations Grid ── */}
                <div>
                  <div
                    ref={investigationsHeadingRef}
                    className="section-anchor"
                    style={{ ...styles(theme).panelTitle, marginBottom: '12px' }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                    Investigations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <InvestigationPanel
                      title="Laboratory Tests"
                      icon="🧪"
                      tests={fileData.fileData?.lab_tests}
                      statusMessage={fileData.labStatusMessage}
                      onRequest={handleLabTestRequest}
                      onCancel={() => handleCancelInvestigation('lab')}
                      onCredit={() => handleCreditInvestigation('lab')}
                      accentColor={theme.info}
                      theme={theme}
                    />
                    <InvestigationPanel
                      title="Radiology Exams"
                      icon="🩻"
                      tests={fileData.fileData?.radiology_exams}
                      statusMessage={fileData.radiologyStatusMessage}
                      onRequest={handleRadiologyTestRequest}
                      onCancel={() => handleCancelInvestigation('radiology')}
                      onCredit={() => handleCreditInvestigation('radiology')}
                      accentColor={theme.skyBlue}
                      theme={theme}
                    />
                  </div>
                </div>

                {/* ── Treatment Chart / Notes ── */}
                <div className="info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div
                      ref={treatmentChartHeadingRef}
                      className="section-anchor"
                      style={styles(theme).panelTitle}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48', flexShrink: 0 }} />
                      Treatment {treatmentNotesClicked ? 'Notes' : 'Chart'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {!treatmentNotesClicked && availableDates.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: theme.textMuted }}>Filter by Date:</span>
                          <select
                            value={selectedTreatmentDate}
                            onChange={(e) => setSelectedTreatmentDate(e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.cardBorder}`,
                              fontSize: '12px',
                              background: theme.cardBg,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">All Dates</option>
                            {availableDates.map(date => (
                              <option key={date} value={date}>{date}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button className="action-btn" onClick={toggleTreatmentNotesView}>
                        {treatmentNotesClicked ? 'Show Chart' : 'Show Notes'}
                      </button>
                    </div>
                  </div>
                  {treatmentNotesClicked ? renderTreatmentNotes() : renderTreatmentChart()}
                </div>

              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {isModalOpen && (
        <EditFileModal
          fileId={currentFileId}
          token={token}
          employeeName={employeeName}
          clinicalNotes={editableFields.clinical_notes}
          signsAndSymptoms={editableFields.signs_and_symptoms}
          diagnosis={editableFields.diagnosis}
          onClose={() => { setIsModalOpen(false); fetchFileData(currentFileId, false); }}
        />
      )}

      {showTreatmentPlanModal && (
        <div style={styles(theme).modalOverlay} onClick={() => setShowTreatmentPlanModal(false)}>
          <div style={{
            ...styles(theme).modal,
            maxWidth: '2000px',
            width: '110%',
            height: '80vh',
            maxHeight: '800px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <TreatmentPlanModal
              fileId={currentFileId}
              employeeName={employeeName}
              token={token}
              onClose={() => { setShowTreatmentPlanModal(false); fetchFileData(currentFileId, false); }}
            />
          </div>
        </div>
      )}

      {showLabTestPrompt && (
        <InvestigationModal
          title="Select Laboratory Tests"
          tests={labTestsAvailable}
          selectedTests={selectedLabTests}
          setSelectedTests={setSelectedLabTests}
          onSubmit={submitLabTests}
          onClose={() => { setShowLabTestPrompt(false); setSelectedLabTests([]); }}
          submitting={submittingLabTest}
        />
      )}

      {showRadiologyTestPrompt && (
        <InvestigationModal
          title="Select Radiology Tests"
          tests={radiologyTestsAvailable}
          selectedTests={selectedRadiologyTests}
          setSelectedTests={setSelectedRadiologyTests}
          onSubmit={submitRadiologyTest}
          onClose={() => { setShowRadiologyTestPrompt(false); setSelectedRadiologyTests([]); }}
          submitting={submittingRadiologyTest}
        />
      )}

      {showReverseModal && (
        <PasswordPromptModal
          title="Confirm Reverse Request"
          message={`Reverse administration of ${selectedChartEntry?.drug_name} (${selectedChartEntry?.dose})?`}
          onConfirm={confirmReverseRequest}
          onCancel={() => setShowReverseModal(false)}
        />
      )}

      {showBillingModal && (
        <div style={styles(theme).modalOverlay} onClick={() => setShowBillingModal(false)}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <BillingInvoiceModal
              fileId={currentFileId}
              token={token}
              date={fileData?.fileData?.date_time}
              opdNo={fileData?.fileData?.opd_no}
              contactId={fileData?.fileData?.contact_id}
              onClose={() => setShowBillingModal(false)}
            />
          </div>
        </div>
      )}

      {showCreditModal && (
        <div style={styles(theme).modalOverlay} onClick={() => setShowCreditModal(false)}>
          <div style={styles(theme).modal} onClick={e => e.stopPropagation()}>
            <CreditInvestigationModal
              token={token}
              fileId={currentFileId}
              type={creditModalType}
              onClose={() => { setShowCreditModal(false); fetchFileData(currentFileId, false); }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ViewFile;