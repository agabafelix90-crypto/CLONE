import React, { useState, useEffect, useCallback, useRef } from 'react';
import { urls } from './config.dev';
import { Link, useNavigate } from 'react-router-dom';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import MissingDrugs from './MissingDrugs';
import ReceiptModal from './ReceiptModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faCheck, faTimes, faSearch, faTrashAlt, faEye, faEyeSlash, faPills, faChartLine, faHistory, faShoppingBasket, faExclamationTriangle, faArrowLeft, faPlus, faMinus, faChevronDown, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import 'font-awesome/css/font-awesome.min.css';
import './selldrugs.css';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const colors = {
  blue: {
    mainBg: '#0a1e4a',
    cardBg: '#ffffff',
    cardBorder: '#1e3a8a',
    tableHeader: '#e8f0fe',
    tableBorder: '#cbd5e1',
    textPrimary: '#0a1e4a',
    textSecondary: '#1e3a8a',
    textMuted: '#4b5563',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
    infoLight: '#e0edff',
    skyBlue: '#38bdf8',
    sidebarBg: '#0a1e4a',
    sidebarText: '#ffffff',
    sidebarBorder: '#1e3a8a',
    iconBright: '#fbbf24',
    iconHover: '#f59e0b',
    quickNavBg: '#1e3a8a',
    quickNavHover: '#2563eb',
    quickNavText: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    buttonPrimary: '#2563eb',
    buttonPrimaryHover: '#1d4ed8',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',
    emptyCartIcon: '#e2e8f0',
  },
  white: {
    mainBg: '#f5f7fa',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
    infoLight: '#eff6ff',
    skyBlue: '#38bdf8',
    sidebarBg: '#ffffff',
    sidebarText: '#0f172a',
    sidebarBorder: '#e2e8f0',
    iconBright: '#f59e0b',
    iconHover: '#d97706',
    quickNavBg: '#f1f5f9',
    quickNavHover: '#e2e8f0',
    quickNavText: '#0f172a',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    buttonPrimary: '#2563eb',
    buttonPrimaryHover: '#1d4ed8',
    buttonSuccess: '#16a34a',
    buttonSuccessHover: '#15803d',
    emptyCartIcon: '#e2e8f0',
  }
};

const TOPBAR_HEIGHT = 60;
const REFETCH_INTERVAL_MS = 10 * 60 * 1000;
const MOBILE_BREAKPOINT = 768;

// ─── Helper Functions ────────────────────────────────────────────────────────
const formatAmount = (amount) => Math.floor(parseFloat(amount || 0)).toString();

const isExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
};

const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return expiry < today;
};

const formatExpiryDate = (expiryDate) => {
  if (!expiryDate || expiryDate === 'null' || expiryDate === null) return 'No expiry';
  const date = new Date(expiryDate);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatBatchNumber = (batchNumber) => {
  if (!batchNumber || batchNumber === 'null' || batchNumber === null) return 'No batch';
  return batchNumber;
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ─── Global Styles with Mobile Support ──────────────────────────────────────────
const GlobalStyles = ({ theme, isMobile }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
      font-family: ${isMobile ? "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
    }

    /* Make the entire browser chrome white on mobile */
    ${isMobile ? `
      html, body {
        background-color: #ffffff !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      
      #root, #root > div {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }
      
      @media (display-mode: browser) {
        body {
          padding-top: env(safe-area-inset-top, 0px);
          background: #ffffff;
        }
      }
      
      body {
        background-color: #ffffff;
      }
    ` : `
      html, body {
        background: #ffffff;
      }
    `}
    
    ::-webkit-scrollbar { width: ${isMobile ? '3px' : '6px'}; height: ${isMobile ? '3px' : '6px'}; }
    ::-webkit-scrollbar-track { background: ${theme.tableHeader}; }
    ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textSecondary}; }
    
    .fade-in { animation: fadeIn 0.3s ease; }
    
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(6px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }
    
    .empty-cart-icon {
      animation: float 3s ease-in-out infinite;
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }
    
    .empty-cart-icon:hover { opacity: 0.8; }
    
    ${!isMobile ? `
      .quick-nav-container {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 1000;
        transition: right 0.3s ease;
      }
      
      .quick-nav-container.hidden { right: -60px; }
      
      .quick-nav-tab {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        transform: rotate(180deg);
        background: ${theme.quickNavBg};
        color: ${theme.quickNavText};
        border: 1px solid ${theme.cardBorder};
        border-right: none;
        border-radius: 10px 10px 0 0;
        padding: 16px 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        white-space: nowrap;
        cursor: pointer;
        outline: none;
        box-shadow: -2px 0 0 0 ${theme.cardBorder}, -3px 3px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 44px;
        text-decoration: none;
      }
      
      .quick-nav-tab:hover {
        background: ${theme.quickNavHover};
        padding: 20px 8px;
        border-color: ${theme.info};
        box-shadow: -3px 0 0 0 ${theme.info}, -5px 3px 20px rgba(37, 99, 235, 0.2);
      }
      
      .fullscreen-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: ${theme.buttonPrimary};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        z-index: 1100;
        transition: all 0.3s ease;
      }
      
      .fullscreen-toggle:hover {
        transform: scale(1.1);
        background: ${theme.buttonPrimaryHover};
      }
      
      .fullscreen-toggle.hidden { right: 20px; }
      
      .table-container {
        background: ${theme.cardBg};
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .table-header {
        background: ${theme.tableHeader};
        color: ${theme.textPrimary};
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
      }
      
      .table-row {
        transition: background 0.2s ease;
        cursor: pointer;
      }
      
      .table-row:hover { background: ${theme.infoLight}; }
      
      .table-row.selected {
        background: ${theme.infoLight};
        border-left: 3px solid ${theme.info};
      }
      
      .table-row.expired {
        opacity: 0.6;
        background: ${theme.danger}10;
      }
      
      .table-row.expiring-soon {
        background: ${theme.warning}10;
      }
      
      .table-cell {
        padding: 10px 8px;
        border-bottom: 1px solid ${theme.tableBorder};
        color: ${theme.textPrimary};
        font-size: 13px;
      }
      
      .cart-container {
        background: ${theme.cardBg};
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        padding: 12px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .cart-title {
        color: ${theme.textPrimary};
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 12px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .empty-cart-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;
        color: ${theme.textMuted};
      }
      
      .empty-cart-message {
        margin-top: 16px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .empty-cart-submessage {
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.7;
      }
      
      .input-field {
        width: 65px;
        padding: 6px;
        border-radius: 4px;
        border: 1px solid ${theme.inputBorder};
        background: ${theme.inputBg};
        color: ${theme.textPrimary};
        font-size: 13px;
        text-align: center;
      }
      
      .input-field:focus {
        outline: none;
        border-color: ${theme.info};
        box-shadow: 0 0 0 2px ${theme.infoLight};
      }
      
      .remove-btn {
        background: transparent;
        color: ${theme.danger};
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .remove-btn:hover {
        background: ${theme.danger}20;
        transform: scale(1.1);
      }
      
      .add-btn {
        background: ${theme.buttonSuccess};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s ease;
      }
      
      .add-btn:hover:not(:disabled) {
        background: ${theme.buttonSuccessHover};
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
      }
      
      .add-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .confirm-btn {
        background: ${theme.buttonSuccess};
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      
      .confirm-btn:hover:not(:disabled) {
        background: ${theme.buttonSuccessHover};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
      }
      
      .confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .total-amount {
        font-weight: 700;
        font-size: 16px;
        color: ${theme.textPrimary};
        background: ${theme.accentLight};
        padding: 8px 16px;
        border-radius: 6px;
      }
      
      .search-wrapper {
        position: relative;
        margin-bottom: 8px;
      }
      
      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: ${theme.textMuted};
        font-size: 14px;
      }
      
      .search-input {
        margin-left: 40px;
        border-radius: 6px;
        border: 1px solid ${theme.inputBorder};
        background: ${theme.inputBg};
        color: ${theme.textPrimary};
        font-size: 14px;
        padding: 8px;
        width: calc(100% - 40px);
      }
      
      .search-input:focus {
        outline: none;
        border-color: ${theme.info};
        box-shadow: 0 0 0 2px ${theme.infoLight};
      }
      
      .batch-info {
        font-size: 11px;
        display: block;
        margin-top: 2px;
      }
      
      .batch-info.warning { color: ${theme.warning}; }
      .batch-info.danger { color: ${theme.danger}; }
      .batch-info.success { color: ${theme.accent}; }
      .batch-info.muted { color: ${theme.textMuted}; }
      
      .expiry-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        margin-left: 6px;
      }
      
      .expiry-badge.warning {
        background: ${theme.warning}20;
        color: ${theme.warning};
      }
      
      .expiry-badge.danger {
        background: ${theme.danger}20;
        color: ${theme.danger};
      }
      
      .expiry-badge.muted {
        background: ${theme.textMuted}20;
        color: ${theme.textMuted};
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(3px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      
      .modal-content {
        background: ${theme.cardBg};
        border-radius: 10px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        animation: slideIn 0.3s ease;
      }
      
      .modal-title {
        color: ${theme.textPrimary};
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .transaction-buttons {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
      
      .cancel-btn {
        flex: 1;
        background: ${theme.tableHeader};
        color: ${theme.textPrimary};
        border: 1px solid ${theme.tableBorder};
        border-radius: 6px;
        padding: 10px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .cancel-btn:hover {
        background: ${theme.tableBorder};
      }
      
      .success-message {
        color: ${theme.accent};
        margin: 8px 0;
        font-size: 14px;
      }
      
      .error-message {
        color: ${theme.danger};
        margin: 8px 0;
        font-size: 14px;
      }
      
      .last-updated {
        font-size: 10px;
        color: ${theme.textMuted};
        text-align: right;
        padding: 4px 8px;
        border-top: 1px solid ${theme.tableBorder};
        margin-top: 8px;
      }
    ` : `
      /* ── MOBILE STYLES ── */
      
      /* Top Instruction Bar */
      .mobile-header {
        position: sticky;
        top: 0;
        background: #ffffff;
        padding: 14px 16px 0 16px;
        z-index: 100;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mobile-header-instruction {
        font-size: 14px;
        font-weight: 500;
        color: ${theme.textMuted};
        letter-spacing: 0.01em;
      }
      
      /* Burger Menu Button */
      .burger-menu-btn {
        background: none;
        border: none;
        font-size: 22px;
        color: ${theme.textSecondary};
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      
      .burger-menu-btn:active {
        color: ${theme.info};
      }
      
      /* Mobile Navigation Drawer */
      .mobile-nav-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        animation: overlayFadeIn 0.2s ease;
      }
      
      .mobile-nav-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 280px;
        background: #ffffff;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        animation: slideInRight 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        z-index: 1001;
      }
      
      .mobile-nav-drawer.closing {
        animation: slideOutRight 0.2s ease forwards;
      }
      
      .mobile-nav-header {
        padding: 20px 20px 16px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mobile-nav-header h3 {
        font-size: 18px;
        font-weight: 700;
        color: ${theme.textPrimary};
        margin: 0;
      }
      
      .mobile-nav-close {
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: ${theme.textMuted};
        font-size: 14px;
      }
      
      .mobile-nav-items {
        flex: 1;
        padding: 12px 0;
      }
      
      .mobile-nav-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        color: ${theme.textPrimary};
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.15s;
        border-left: 3px solid transparent;
      }
      
      .mobile-nav-item:active {
        background: #f1f5f9;
      }
      
      .mobile-nav-item svg {
        width: 20px;
        color: ${theme.textMuted};
      }
      
      .mobile-nav-item span {
        flex: 1;
      }
      
      .mobile-nav-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 8px 16px;
      }
      
      /* Search Bar */
      .mobile-search-bar {
        padding: 10px 16px 10px 16px;
        background: #ffffff;
        position: sticky;
        top: 48px;
        z-index: 99;
      }
      
      .mobile-search-inner {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      .mobile-search-inner input {
        width: 100%;
        padding: 11px 16px 11px 42px;
        border-radius: 14px;
        border: 1.5px solid #e2e8f0;
        background: #f8fafc;
        color: ${theme.textPrimary};
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s, background 0.2s;
      }
      
      .mobile-search-inner input:focus {
        border-color: ${theme.info};
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
      }
      
      .mobile-search-icon {
        position: absolute;
        left: 14px;
        color: #94a3b8;
        font-size: 14px;
        pointer-events: none;
        z-index: 1;
      }
      
      .cart-badge {
        background: ${theme.accent};
        color: white;
        border-radius: 20px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
      }
      
      /* Drug List Items */
      .mobile-drug-item {
        background: #ffffff;
        margin: 6px 12px;
        padding: 14px;
        border-radius: 14px;
        border: 1.5px solid #f1f5f9;
        transition: all 0.15s ease;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      }
      
      .mobile-drug-item:active {
        transform: scale(0.985);
        border-color: ${theme.info};
        background: #eff6ff;
      }
      
      .mobile-drug-item.selected {
        border-color: ${theme.info};
        background: #eff6ff;
      }
      
      .mobile-drug-item.expired {
        opacity: 0.55;
        background: #fff5f5;
        border-color: #fecaca;
      }
      
      .mobile-drug-item.expiring-soon {
        background: #fffbeb;
        border-color: #fde68a;
      }
      
      .mobile-drug-name {
        font-weight: 600;
        font-size: 15px;
        color: ${theme.textPrimary};
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
        line-height: 1.3;
      }
      
      .mobile-drug-details {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: ${theme.textMuted};
        align-items: center;
      }
      
      .mobile-drug-quantity {
        background: #f1f5f9;
        padding: 2px 9px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 12px;
        color: ${theme.textSecondary};
      }
      
      .mobile-drug-price {
        font-weight: 700;
        color: ${theme.accent};
        font-size: 13px;
      }
      
      /* Quick-Add Overlay */
      .mobile-quickadd-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 600;
        padding: 20px;
        animation: overlayFadeIn 0.2s ease;
      }
      
      .mobile-quickadd-card {
        background: #ffffff;
        border-radius: 24px;
        padding: 22px 20px;
        width: 100%;
        max-width: 380px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.22);
        animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
      }
      
      .mobile-quickadd-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 18px;
      }
      
      .mobile-quickadd-drug-name {
        font-weight: 700;
        font-size: 17px;
        color: ${theme.textPrimary};
        line-height: 1.3;
        flex: 1;
        padding-right: 12px;
      }
      
      .mobile-quickadd-packaging {
        font-size: 12px;
        color: ${theme.textMuted};
        margin-top: 3px;
        font-weight: 400;
      }
      
      .mobile-quickadd-close {
        background: #f1f5f9;
        border: none;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        color: ${theme.textMuted};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      
      .mobile-quickadd-close:active { background: #e2e8f0; }
      
      .mobile-quickadd-fields {
        display: flex;
        gap: 10px;
        margin-bottom: 14px;
      }
      
      .mobile-quickadd-field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .mobile-quickadd-label {
        font-size: 11px;
        font-weight: 600;
        color: ${theme.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      
      .mobile-quickadd-input {
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
        font-size: 20px;
        font-weight: 700;
        text-align: center;
        color: ${theme.textPrimary};
        background: #f8fafc;
        outline: none;
        transition: border-color 0.15s, background 0.15s;
      }
      
      .mobile-quickadd-input:focus {
        border-color: ${theme.info};
        background: #ffffff;
      }
      
      .mobile-quickadd-subtotal {
        background: ${theme.accentLight};
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mobile-quickadd-subtotal-label {
        font-size: 13px;
        color: #15803d;
        font-weight: 500;
      }
      
      .mobile-quickadd-subtotal-amount {
        font-weight: 800;
        font-size: 20px;
        color: #15803d;
        letter-spacing: -0.02em;
      }
      
      .mobile-quickadd-btn {
        width: 100%;
        background: ${theme.buttonSuccess};
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
        letter-spacing: 0.01em;
      }
      
      .mobile-quickadd-btn:active {
        background: ${theme.buttonSuccessHover};
        transform: scale(0.98);
      }
      
      /* Cart Panel */
      .mobile-cart-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        border-radius: 22px 22px 0 0;
        box-shadow: 0 -4px 30px rgba(0,0,0,0.12);
        z-index: 200;
        transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
        max-height: 72vh;
        display: flex;
        flex-direction: column;
      }
      
      .mobile-cart-panel.collapsed {
        transform: translateY(calc(100% - 62px));
      }
      
      .mobile-cart-handle {
        width: 36px;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        margin: 10px auto 0 auto;
      }
      
      .mobile-cart-header {
        padding: 10px 16px 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      }
      
      .mobile-cart-title {
        font-weight: 700;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: ${theme.textPrimary};
      }
      
      .mobile-cart-chevron {
        transition: transform 0.3s ease;
        color: ${theme.textMuted};
        font-size: 13px;
      }
      
      .mobile-cart-chevron.open { transform: rotate(180deg); }
      
      .mobile-cart-items {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px 8px 12px;
      }
      
      .mobile-cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 0;
        border-bottom: 1px solid #f1f5f9;
        gap: 8px;
      }
      
      .mobile-cart-item-info { flex: 2; min-width: 0; }
      
      .mobile-cart-item-name {
        font-weight: 600;
        font-size: 14px;
        color: ${theme.textPrimary};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .mobile-cart-item-meta {
        font-size: 11px;
        color: ${theme.textMuted};
        margin-top: 3px;
      }
      
      .mobile-cart-item-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      
      .mobile-quantity-btn {
        background: #f1f5f9;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: ${theme.textPrimary};
        font-size: 12px;
        transition: background 0.15s;
      }
      
      .mobile-quantity-btn:active { background: #e2e8f0; }
      
      .mobile-qty-display {
        min-width: 28px;
        text-align: center;
        font-weight: 700;
        font-size: 14px;
        color: ${theme.textPrimary};
      }
      
      .mobile-cart-footer {
        padding: 10px 16px 16px 16px;
        border-top: 1px solid #f1f5f9;
        background: #ffffff;
      }
      
      .mobile-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .mobile-total-label {
        font-size: 13px;
        color: ${theme.textMuted};
        font-weight: 500;
      }
      
      .mobile-total-amount {
        font-weight: 800;
        font-size: 22px;
        color: ${theme.textPrimary};
        letter-spacing: -0.02em;
      }
      
      .mobile-checkout-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: ${theme.buttonSuccess};
        color: white;
        border: none;
        padding: 13px 28px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        width: 100%;
        transition: background 0.15s, transform 0.1s;
        letter-spacing: 0.01em;
      }
      
      .mobile-checkout-btn:active {
        background: ${theme.buttonSuccessHover};
        transform: scale(0.985);
      }
      
      .mobile-checkout-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .mobile-empty-cart {
        text-align: center;
        padding: 28px 20px;
        color: ${theme.textMuted};
      }
      
      /* FAB */
      .mobile-fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 54px;
        height: 54px;
        border-radius: 27px;
        background: ${theme.accent};
        color: white;
        border: none;
        box-shadow: 0 4px 16px rgba(22,163,74,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        z-index: 150;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 4px 12px rgba(22,163,74,0.4); }
        50% { box-shadow: 0 4px 24px rgba(22,163,74,0.65); }
        100% { box-shadow: 0 4px 12px rgba(22,163,74,0.4); }
      }
      
      .mobile-fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: ${theme.danger};
        color: white;
        border-radius: 10px;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 700;
        border: 2px solid #ffffff;
      }
      
      /* Modal Mobile */
      .modal-content-mobile {
        background: #ffffff;
        border-radius: 22px;
        padding: 22px 18px;
        width: 92%;
        max-width: 400px;
        animation: slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
        max-height: 85vh;
        overflow-y: auto;
      }
    `}
  `}</style>
);

function Selldrugs() {
  // State management
  const [stockData, setStockData] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [sellItems, setSellItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showTransactionPrompt, setShowTransactionPrompt] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isSellButtonActive, setIsSellButtonActive] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [confirmClicked, setConfirmClicked] = useState(false);
  const [confirmButtonText, setConfirmButtonText] = useState('Confirm Transaction');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [useBatchAndExpiry, setUseBatchAndExpiry] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [closingMenu, setClosingMenu] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState({
    clinicName: '',
    district: '',
    town: '',
    ownersContact: '',
    drugsSold: [],
    totalAmount: 0,
    employeeName: '',
    date: '',
    time: '',
  });

  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  const urlTheme = parseThemeFromSearch(window.location.search);
  const intervalRef = useRef(null);

  // Set theme color for browser on mobile
  useEffect(() => {
    if (isMobile) {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', '#ffffff');
      
      let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatusBar) {
        metaStatusBar = document.createElement('meta');
        metaStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaStatusBar);
      }
      metaStatusBar.setAttribute('content', 'black-translucent');
    }
  }, [isMobile]);

  // Resize handler for mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process stock data based on batch/expiry settings
  const processStockData = useCallback((rawData, useBatchMode) => {
    if (!useBatchMode) {
      const aggregatedMap = new Map();
      
      rawData.forEach(item => {
        const key = item.drug_id;
        if (aggregatedMap.has(key)) {
          const existing = aggregatedMap.get(key);
          existing.Quantity = (parseFloat(existing.Quantity) + parseFloat(item.Quantity)).toString();
        } else {
          aggregatedMap.set(key, { ...item });
        }
      });
      
      return Array.from(aggregatedMap.values());
    } else {
      return [...rawData].sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });
    }
  }, []);

  // Security check function
  const performSecurityCheck = useCallback(async (token) => {
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
        
        const useBatch = securityData.use_drug_batch_numbers === 'yes';
        const useExpiry = securityData.use_drug_expiry_date === 'yes';
        setUseBatchAndExpiry(useBatch && useExpiry);
        
        setEmployeeName(securityData.employee_name);
        setClinicName(securityData.clinic);
        return true;
      } else {
        const errorData = await securityResponse.json();
        if (errorData.error === 'Session expired') {
          navigate(`/dashboard?token=${errorData.clinic_session_token}`);
        } else {
          navigate('/login');
        }
        return false;
      }
    } catch (error) {
      console.error('Error performing security check:', error);
      navigate('/login');
      return false;
    }
  }, [navigate]);

  // Fetch dispensary stock
  const fetchDispensaryStock = useCallback(async (token) => {
    try {
      const response = await fetch(urls.fetchdispensary, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const rawData = await response.json();
      const processedData = processStockData(rawData, useBatchAndExpiry);
      setStockData(processedData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching shelves stock:', error);
    }
  }, [processStockData, useBatchAndExpiry]);

  // Initial fetch and setup interval
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!tokenFromUrl) throw new Error('Token not found in URL');
        const securityPassed = await performSecurityCheck(tokenFromUrl);
        if (securityPassed) {
          await fetchDispensaryStock(tokenFromUrl);
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          intervalRef.current = setInterval(() => {
            fetchDispensaryStock(tokenFromUrl);
          }, REFETCH_INTERVAL_MS);
        }
      } catch (error) {
        console.error('Error:', error);
        navigate('/login');
      }
    };

    initialize();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tokenFromUrl, performSecurityCheck, fetchDispensaryStock, navigate]);

  const theme = colors[currentTheme];

  // Drug selection handler
  const handleDrugSelect = (drug) => {
    if (useBatchAndExpiry && isExpired(drug.expiry_date)) return;
    setSelectedDrug(drug);
    setQuantityToSell(1);
    setSearchQuery('');
    setIsSellButtonActive(false);
  };

  const handleRemoveSellItem = (index) => {
    const updatedSellItems = [...sellItems];
    const removedItem = updatedSellItems.splice(index, 1)[0];
    setSellItems(updatedSellItems);
    setTotalAmount(totalAmount - removedItem.amount);
    setIsSellButtonActive(updatedSellItems.length > 0);
  };

  const handleConfirmTransaction = () => setShowTransactionPrompt(true);
  const handleCancelTransaction = () => setShowTransactionPrompt(false);

  const handleConfirmSale = async () => {
    setConfirmClicked(true);
    setConfirmButtonText('Processing...');

    const currentDate = new Date().toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' });
    const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Kampala' });

    const saleData = {
      sales: sellItems.map(item => ({
        drug: item.drug,
        packaging: item.packaging,
        quantitySold: item.quantity,
        amount: item.amount,
        sellingPrice: item.amount / item.quantity,
        drug_id: item.drug_id || null,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
      })),
      totalAmount: totalAmount,
      employeeName: employeeName,
      currentDate: currentDate,
      currentTime: currentTime,
      token: tokenFromUrl,
      useBatchAndExpiry: useBatchAndExpiry,
    };

    try {
      const response = await fetch(urls.selldrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.message === "Drugs sold successfully!") {
          const clinicResponse = await fetch(urls.fetchclinicdetails, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenFromUrl })
          });

          if (clinicResponse.ok) {
            const clinicDetails = await clinicResponse.json();
            setReceiptDetails({
              clinicName: clinicDetails.clinic_name,
              district: clinicDetails.district,
              town: clinicDetails.sub_county,
              ownersContact: clinicDetails.owners_contact,
              drugsSold: sellItems.map(item => ({
                drug: item.drug,
                quantity: item.quantity,
                packaging: item.packaging,
                unitPrice: item.amount / item.quantity,
                amount: item.amount,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date,
              })),
              totalAmount: totalAmount,
              employeeName: employeeName,
              date: currentDate,
              time: currentTime,
            });
            setShowTransactionPrompt(false);
            setTimeout(() => setShowReceiptModal(true), 300);

            await fetch(urls.assignAverage, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saleData)
            });

            await fetchDispensaryStock(tokenFromUrl);
          }
        } else {
          setResponseMessage({
            type: "error-message",
            text: `Transaction failed. Please check stock availability and network connection.`
          });
        }
        setSellItems([]);
        setTotalAmount(0);
        if (isMobile) setMobileCartExpanded(false);
      } else {
        setResponseMessage({
          type: "error-message",
          text: `Transaction failed. Please check stock availability and network connection.`
        });
      }
    } finally {
      setConfirmClicked(false);
      setConfirmButtonText('Confirm Transaction');
      setTimeout(() => setResponseMessage(null), 7000);
    }
  };

  const handleUnitPriceChange = (index, value) => {
    const updatedItems = [...sellItems];
    const newPrice = parseFloat(value) || 0;
    updatedItems[index].unitPrice = newPrice;
    updatedItems[index].amount = newPrice * updatedItems[index].quantity;
    setSellItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedItems = [...sellItems];
    const quantity = newQuantity === '' ? '' : Math.max(1, Number(newQuantity));
    updatedItems[index].quantity = quantity;
    updatedItems[index].amount = (quantity === '' ? 0 : quantity) * updatedItems[index].unitPrice;
    setSellItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const handleMobileQuantityChange = (index, delta) => {
    const updatedItems = [...sellItems];
    const newQuantity = Math.max(1, updatedItems[index].quantity + delta);
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].amount = newQuantity * updatedItems[index].unitPrice;
    setSellItems(updatedItems);
    calculateTotalAmount(updatedItems);
  };

  const handleSellButtonClick = () => {
    if (selectedDrug) {
      const quantity = quantityToSell === '' ? 1 : quantityToSell;
      const newItem = {
        drug: selectedDrug.Drug,
        packaging: selectedDrug.Packaging,
        quantity: quantity,
        unitPrice: parseFloat(selectedDrug.Selling_Price),
        amount: quantity * parseFloat(selectedDrug.Selling_Price),
        drug_id: selectedDrug.drug_id,
        batch_number: selectedDrug.batch_number || null,
        expiry_date: selectedDrug.expiry_date || null,
      };
      setSellItems([...sellItems, newItem]);
      calculateTotalAmount([...sellItems, newItem]);
      setSelectedDrug(null);
      setQuantityToSell(1);
      setIsSellButtonActive(true);
      if (isMobile) setMobileCartExpanded(true);
    }
  };

  const calculateTotalAmount = (items) => {
    setTotalAmount(items.reduce((sum, item) => sum + item.amount, 0));
  };

  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };

  const openMobileMenu = () => {
    setShowMobileMenu(true);
    setClosingMenu(false);
  };

  const closeMobileMenu = () => {
    setClosingMenu(true);
    setTimeout(() => {
      setShowMobileMenu(false);
      setClosingMenu(false);
    }, 200);
  };

  const containerStyle = {
    fontFamily: isMobile ? "'DM Sans', sans-serif" : "'Inter', sans-serif",
    backgroundColor: isMobile ? '#ffffff' : theme.mainBg,
    minHeight: '100vh',
    paddingTop: (!fullscreenMode && !isMobile) ? `${TOPBAR_HEIGHT}px` : '0',
    paddingBottom: isMobile ? '80px' : '0',
    margin: 0,
    width: '100%',
    transition: 'padding-top 0.3s ease'
  };

  const contentStyle = {
    padding: isMobile ? '0' : '10px',
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    boxSizing: 'border-box',
    height: fullscreenMode ? '100vh' : (isMobile ? 'auto' : `calc(100vh - ${TOPBAR_HEIGHT}px)`),
    overflow: isMobile ? 'auto' : 'hidden'
  };

  const mainLayoutStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '2px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box'
  };

  // Get row class for expiry status
  const getRowClass = (drug) => {
    if (!useBatchAndExpiry) return '';
    if (isExpired(drug.expiry_date)) return 'expired';
    if (isExpiringSoon(drug.expiry_date)) return 'expiring-soon';
    return '';
  };

  // Get batch info display text
  const getBatchInfoText = (drug) => {
    if (!useBatchAndExpiry) return null;
    const batchText = formatBatchNumber(drug.batch_number);
    const expiryText = formatExpiryDate(drug.expiry_date);
    
    if (batchText === 'No batch' && expiryText === 'No expiry') {
      return 'No batch number, No expiry date';
    } else if (batchText === 'No batch') {
      return `No batch number | Exp: ${expiryText}`;
    } else if (expiryText === 'No expiry') {
      return `Batch: ${batchText} | No expiry date`;
    } else {
      return `Batch: ${batchText} | Exp: ${expiryText}`;
    }
  };

  // Get expiry badge class
  const getExpiryBadgeClass = (expiryDate) => {
    if (!expiryDate || expiryDate === 'null' || expiryDate === null) return 'muted';
    if (isExpired(expiryDate)) return 'danger';
    if (isExpiringSoon(expiryDate)) return 'warning';
    return '';
  };

  // Get expiry badge text
  const getExpiryBadgeText = (expiryDate) => {
    if (!expiryDate || expiryDate === 'null' || expiryDate === null) return 'No expiry';
    if (isExpired(expiryDate)) return 'EXPIRED';
    if (isExpiringSoon(expiryDate)) return 'Expiring soon ⚠️';
    return '';
  };

  // Mobile Navigation Drawer
  const renderMobileNavDrawer = () => {
    if (!showMobileMenu) return null;
    
    return (
      <>
        <div className="mobile-nav-overlay" onClick={closeMobileMenu} />
        <div className={`mobile-nav-drawer ${closingMenu ? 'closing' : ''}`}>
          <div className="mobile-nav-header">
            <h3>Menu</h3>
            <button className="mobile-nav-close" onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <div className="mobile-nav-items">
            <Link 
              to={`/dispensed-and-sold/?token=${tokenFromUrl}`} 
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              <FontAwesomeIcon icon={faChartLine} />
              <span>Sold Items</span>
            </Link>
            <Link 
              to={`/removed-drugs-equipment/?token=${tokenFromUrl}`} 
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              <FontAwesomeIcon icon={faHistory} />
              <span>Removed Items</span>
            </Link>
            <div className="mobile-nav-divider" />
            <Link 
              to={`/remove-drugs/?token=${tokenFromUrl}`} 
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
              <span>Remove Items</span>
            </Link>
          </div>
        </div>
      </>
    );
  };

  // Mobile Drug List Renderer
  const renderMobileDrugList = () => {
    const filteredDrugs = stockData.filter(
      drug => drug.Drug && drug.Drug.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(drug => !useBatchAndExpiry || !isExpired(drug.expiry_date));

    return (
      <div style={{ paddingBottom: sellItems.length > 0 ? '130px' : '20px', background: '#ffffff', minHeight: '100vh' }}>
        <div className="mobile-header">
          <span className="mobile-header-instruction">
            👆 Tap an item you want to sell
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sellItems.length > 0 && (
              <span className="cart-badge">{sellItems.length}</span>
            )}
            <button className="burger-menu-btn" onClick={openMobileMenu}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>

        <div className="mobile-search-bar">
          <div className="mobile-search-inner">
            <FontAwesomeIcon icon={faSearch} className="mobile-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {useBatchAndExpiry && (
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '7px', display: 'flex', gap: '12px', paddingLeft: '2px' }}>
              <span>🟡 Expiring soon</span>
              <span>🔴 Expired</span>
            </div>
          )}
        </div>

        <div style={{ paddingTop: '4px' }}>
          {filteredDrugs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>No items found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Try a different search term</div>
            </div>
          ) : (
            filteredDrugs.map((drug, index) => {
              const isDrugExpired = useBatchAndExpiry && isExpired(drug.expiry_date);
              const isSelected = selectedDrug?.drug_id === drug.drug_id &&
                selectedDrug?.batch_number === drug.batch_number;
              return (
                <div
                  key={`${drug.drug_id}_${drug.batch_number || 'nobatch'}_${index}`}
                  className={`mobile-drug-item ${getRowClass(drug)} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDrugSelect(drug)}
                  style={{ cursor: isDrugExpired ? 'not-allowed' : 'pointer' }}
                >
                  <div className="mobile-drug-name">
                    <span style={{ textDecoration: isDrugExpired ? 'line-through' : 'none' }}>
                      {drug.Drug}
                    </span>
                    {isDrugExpired ? (
                      <span style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}>
                        EXPIRED
                      </span>
                    ) : (
                      <span style={{
                        fontWeight: 800,
                        fontSize: '15px',
                        color: '#16a34a',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}>
                        {formatAmount(drug.Selling_Price)}
                      </span>
                    )}
                  </div>

                  <div className="mobile-drug-details">
                    <span className="mobile-drug-quantity">Qty: {drug.Quantity}</span>
                    <span style={{ color: '#94a3b8' }}>{drug.Packaging}</span>
                    {useBatchAndExpiry && isExpiringSoon(drug.expiry_date) && !isDrugExpired && (
                      <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600 }}>⚠️ Expiring soon</span>
                    )}
                  </div>

                  {useBatchAndExpiry && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      {getBatchInfoText(drug)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selectedDrug && (
          <div className="mobile-quickadd-overlay" onClick={() => setSelectedDrug(null)}>
            <div className="mobile-quickadd-card" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-quickadd-header">
                <div>
                  <div className="mobile-quickadd-drug-name">{selectedDrug.Drug}</div>
                  <div className="mobile-quickadd-packaging">{selectedDrug.Packaging}</div>
                </div>
                <button className="mobile-quickadd-close" onClick={() => setSelectedDrug(null)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="mobile-quickadd-fields">
                <div className="mobile-quickadd-field">
                  <label className="mobile-quickadd-label">Quantity</label>
                  <input
                    className="mobile-quickadd-input"
                    type="number"
                    value={quantityToSell}
                    onChange={(e) =>
                      setQuantityToSell(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))
                    }
                    min="1"
                    inputMode="numeric"
                  />
                </div>
                <div className="mobile-quickadd-field">
                  <label className="mobile-quickadd-label">Price (UGX)</label>
                  <input
                    className="mobile-quickadd-input"
                    type="number"
                    value={selectedDrug.Selling_Price || ''}
                    onChange={(e) =>
                      setSelectedDrug({ ...selectedDrug, Selling_Price: Math.max(0, Number(e.target.value)) })
                    }
                    min="0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="mobile-quickadd-subtotal">
                <span className="mobile-quickadd-subtotal-label">Subtotal</span>
                <span className="mobile-quickadd-subtotal-amount">
                  UGX {formatAmount((quantityToSell || 0) * (selectedDrug.Selling_Price || 0))}
                </span>
              </div>

              <button className="mobile-quickadd-btn" onClick={handleSellButtonClick}>
                <FontAwesomeIcon icon={faShoppingCart} />
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Mobile Cart Renderer
  const renderMobileCart = () => (
    <div className={`mobile-cart-panel ${!mobileCartExpanded ? 'collapsed' : ''}`}>
      <div className="mobile-cart-handle" />
      <div className="mobile-cart-header" onClick={() => setMobileCartExpanded(!mobileCartExpanded)}>
        <div className="mobile-cart-title">
          <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#f59e0b', fontSize: '15px' }} />
          Cart
          {sellItems.length > 0 && (
            <span style={{
              background: '#16a34a',
              color: 'white',
              borderRadius: '20px',
              padding: '1px 8px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {sellItems.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sellItems.length > 0 && (
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
              UGX {formatAmount(totalAmount)}
            </span>
          )}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`mobile-cart-chevron ${mobileCartExpanded ? 'open' : ''}`}
          />
        </div>
      </div>

      <div className="mobile-cart-items">
        {sellItems.length === 0 ? (
          <div className="mobile-empty-cart">
            <FontAwesomeIcon
              icon={faShoppingBasket}
              size="3x"
              className="empty-cart-icon"
              style={{ color: '#e2e8f0', marginBottom: '10px' }}
            />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Cart is empty</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#94a3b8' }}>Tap items above to add them</div>
          </div>
        ) : (
          sellItems.map((item, index) => (
            <div key={index} className="mobile-cart-item">
              <div className="mobile-cart-item-info">
                <div className="mobile-cart-item-name">{item.drug}</div>
                <div className="mobile-cart-item-meta">
                  {item.packaging}
                  {useBatchAndExpiry && item.batch_number && ` • Batch: ${item.batch_number}`}
                </div>
                <div className="mobile-cart-item-meta" style={{ fontWeight: 600, color: '#475569', marginTop: '2px' }}>
                  UGX {formatAmount(item.unitPrice)} × {item.quantity} ={' '}
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>UGX {formatAmount(item.amount)}</span>
                </div>
              </div>
              <div className="mobile-cart-item-controls">
                <button
                  className="mobile-quantity-btn"
                  onClick={() => handleMobileQuantityChange(index, -1)}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="mobile-qty-display">{item.quantity}</span>
                <button
                  className="mobile-quantity-btn"
                  onClick={() => handleMobileQuantityChange(index, 1)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  onClick={() => handleRemoveSellItem(index)}
                  className="mobile-quantity-btn"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {sellItems.length > 0 && (
        <div className="mobile-cart-footer">
          <div className="mobile-total-row">
            <span className="mobile-total-label">Total Amount</span>
            <span className="mobile-total-amount">UGX {formatAmount(totalAmount)}</span>
          </div>
          <button className="mobile-checkout-btn" onClick={handleConfirmTransaction}>
            <FontAwesomeIcon icon={faCheck} />
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );

  // Desktop Layout Renderer
  const renderDesktopLayout = () => (
    <div style={mainLayoutStyle}>
      {/* Cart Section */}
      <div className="cart-container" style={{ flex: 1, minWidth: '400px' }}>
        <div className="cart-title">
          <FontAwesomeIcon icon={faShoppingCart} style={{ color: theme.iconBright }} />
          SELECTED DRUGS
        </div>

        <div style={{ flex: 1, overflowY: 'auto', margin: 0 }}>
          {sellItems.length === 0 && !selectedDrug ? (
            <div className="empty-cart-container">
              <FontAwesomeIcon 
                icon={faShoppingBasket} 
                size="6x" 
                className="empty-cart-icon"
                style={{ color: theme.emptyCartIcon }}
              />
              <div className="empty-cart-message">Your cart is empty</div>
              <div className="empty-cart-submessage">Click on a drug from the list to start adding items</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Drug</th>
                  <th className="table-cell">Qty</th>
                  <th className="table-cell">Price</th>
                  <th className="table-cell">Amount</th>
                  <th className="table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {sellItems.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">
                      {item.drug} {item.packaging}
                      {useBatchAndExpiry && (
                        <span className="batch-info muted">
                          {getBatchInfoText(item)}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="input-field"
                        min="1"
                        onWheel={(e) => e.preventDefault()}
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                        className="input-field"
                        min="0"
                        step="100"
                        onWheel={(e) => e.preventDefault()}
                      />
                    </td>
                    <td className="table-cell">{formatAmount(item.amount)}</td>
                    <td className="table-cell">
                      <button onClick={() => handleRemoveSellItem(index)} className="remove-btn" title="Remove item">
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </td>
                  </tr>
                ))}
                {selectedDrug && (
                  <tr className="table-row selected">
                    <td className="table-cell">
                      {selectedDrug.Drug} {selectedDrug.Packaging}
                      {useBatchAndExpiry && (
                        <span className="batch-info muted">
                          {getBatchInfoText(selectedDrug)}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        value={quantityToSell}
                        onChange={(e) => setQuantityToSell(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                        className="input-field"
                        min="1"
                        onWheel={(e) => e.preventDefault()}
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        value={selectedDrug.Selling_Price || ''}
                        onChange={(e) => setSelectedDrug({
                          ...selectedDrug,
                          Selling_Price: Math.max(0, Number(e.target.value))
                        })}
                        className="input-field"
                        min="0"
                        step="100"
                        onWheel={(e) => e.preventDefault()}
                      />
                    </td>
                    <td className="table-cell">
                      UGX {formatAmount(quantityToSell * (selectedDrug.Selling_Price || 0))}
                    </td>
                    <td className="table-cell">
                      <button onClick={handleSellButtonClick} className="add-btn" disabled={!selectedDrug} title="Add to cart">
                        <FontAwesomeIcon icon={faShoppingCart} /> Add
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.tableBorder}` }}>
          <div className="total-amount">Total: UGX {formatAmount(totalAmount)}</div>
          <button onClick={handleConfirmTransaction} disabled={!isSellButtonActive || confirmClicked} className="confirm-btn" style={{ opacity: isSellButtonActive ? 1 : 0.6 }}>
            <FontAwesomeIcon icon={faCheck} /> {confirmButtonText}
          </button>
        </div>
      </div>

      {/* Drug List Section */}
      <div className="table-container" style={{ flex: 2 }}>
        <div style={{ padding: '10px 10px 0 10px' }}>
          <div className="search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search drugs... Click to select"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {useBatchAndExpiry && (
            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '5px', paddingLeft: '10px' }}>
              <span style={{ color: theme.warning }}>🟡 Warning:</span> Expiring within 90 days &nbsp;&nbsp;
              <span style={{ color: theme.danger }}>🔴 Danger:</span> Expired (cannot sell) &nbsp;&nbsp;
              <span style={{ color: theme.textMuted }}>⚪ Muted:</span> No expiry date or batch number
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px 10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="table-header">
              <tr>
                <th className="table-cell">Drug</th>
                <th className="table-cell">Avail</th>
                <th className="table-cell">Pack</th>
                <th className="table-cell">Price</th>
              </tr>
            </thead>
            <tbody>
              {stockData
                .filter(drug => drug.Drug && drug.Drug.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(drug => !useBatchAndExpiry || !isExpired(drug.expiry_date))
                .map((drug, index) => (
                  <tr 
                    key={index} 
                    onClick={() => !(useBatchAndExpiry && isExpired(drug.expiry_date)) && handleDrugSelect(drug)}
                    className={`table-row ${getRowClass(drug)} ${selectedDrug?.drug_id === drug.drug_id && selectedDrug?.batch_number === drug.batch_number ? 'selected' : ''}`}
                    style={{ cursor: (useBatchAndExpiry && isExpired(drug.expiry_date)) ? 'not-allowed' : 'pointer' }}
                  >
                    <td className="table-cell">
                      {drug.Drug}
                      {useBatchAndExpiry && (
                        <>
                          <span className="batch-info muted">
                            {getBatchInfoText(drug)}
                            {drug.expiry_date && drug.expiry_date !== 'null' && drug.expiry_date !== null && (
                              <span className={`expiry-badge ${getExpiryBadgeClass(drug.expiry_date)}`}>
                                {getExpiryBadgeText(drug.expiry_date)}
                              </span>
                            )}
                            {(!drug.expiry_date || drug.expiry_date === 'null' || drug.expiry_date === null) && (
                              <span className="expiry-badge muted">
                                No expiry
                              </span>
                            )}
                          </span>
                        </>
                      )}
                      {!useBatchAndExpiry && drug.Packaging && (
                        <span className="batch-info muted">
                          Pack: {drug.Packaging}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">{drug.Quantity}</td>
                    <td className="table-cell">{drug.Packaging}</td>
                    <td className="table-cell">{formatAmount(drug.Selling_Price)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated} (Auto-refreshes every 10 minutes)
          </div>
        )}
      </div>
    </div>
  );

  // Transaction Modal Renderer
  const renderTransactionModal = () => (
    <div className="modal-overlay" style={{ zIndex: 800 }}>
      <div className={isMobile ? 'modal-content-mobile' : 'modal-content'}>
        <h2 className="modal-title" style={{ fontSize: isMobile ? '17px' : '20px' }}>
          Confirm Transaction
        </h2>
        
        <div style={{ marginBottom: '14px', maxHeight: isMobile ? '180px' : 'auto', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '8px', color: theme.textPrimary, fontSize: isMobile ? '13px' : '15px', fontWeight: 600 }}>
            Items to sell:
          </h3>
          {sellItems.map((item, index) => (
            <div key={index} style={{ marginBottom: '5px', color: theme.textSecondary, fontSize: isMobile ? '12px' : '14px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span>
                {item.quantity}× {item.drug} ({item.packaging})
                {useBatchAndExpiry && item.batch_number && ` · Batch: ${formatBatchNumber(item.batch_number)}`}
              </span>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>UGX {formatAmount(item.amount)}</span>
            </div>
          ))}
        </div>
        
        <div style={{
          fontWeight: 700,
          fontSize: isMobile ? '17px' : '19px',
          margin: '12px 0',
          padding: '12px 16px',
          backgroundColor: theme.accentLight,
          color: theme.textPrimary,
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Total</span>
          <span>UGX {formatAmount(totalAmount)}</span>
        </div>
        
        <div style={{ marginBottom: '10px', color: theme.textSecondary, fontSize: isMobile ? '12px' : '13px' }}>
          Served by: <strong>{employeeName}</strong>
        </div>
        
        {responseMessage && (
          <div className={responseMessage.type === "success-message" ? "success-message" : "error-message"}>
            {responseMessage.text}
          </div>
        )}
        
        <div className="transaction-buttons" style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '12px' }}>
          <button onClick={handleCancelTransaction} className="cancel-btn">
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
          <button onClick={handleConfirmSale} disabled={confirmClicked} className="confirm-btn" style={{ opacity: confirmClicked ? 0.7 : 1 }}>
            <FontAwesomeIcon icon={faCheck} /> {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <GlobalStyles theme={theme} isMobile={isMobile} />
      
      <div style={containerStyle}>
        {!fullscreenMode && !isMobile && <Topbar token={tokenFromUrl} themeColor={currentTheme} />}
        
        <MissingDrugs token={tokenFromUrl} />
        
        <div style={contentStyle}>
          <div style={mainLayoutStyle}>
            {isMobile ? (
              <>
                {renderMobileDrugList()}
                {renderMobileCart()}
                {renderMobileNavDrawer()}
                
                {sellItems.length > 0 && !mobileCartExpanded && (
                  <button
                    className="mobile-fab"
                    onClick={() => setMobileCartExpanded(true)}
                    aria-label="Open cart"
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <span className="mobile-fab-badge">{sellItems.length}</span>
                  </button>
                )}
              </>
            ) : (
              renderDesktopLayout()
            )}
          </div>
        </div>

        {/* Desktop Quick Navigation Tabs */}
        {!isMobile && (
          <div className={`quick-nav-container ${fullscreenMode ? 'hidden' : ''}`}>
            <Link to={`/remove-drugs/?token=${tokenFromUrl}`} className="quick-nav-tab">
              <FontAwesomeIcon icon={faTrashAlt} /> REMOVE DRUGS
            </Link>
            <Link to={`/dispensed-and-sold/?token=${tokenFromUrl}`} className="quick-nav-tab">
              <FontAwesomeIcon icon={faChartLine} /> SOLD DRUGS
            </Link>
            <Link to={`/removed-drugs-equipment/?token=${tokenFromUrl}`} className="quick-nav-tab">
              <FontAwesomeIcon icon={faHistory} /> REMOVED DRUGS
            </Link>
          </div>
        )}

        {/* Fullscreen Toggle Button (Desktop only) */}
        {!isMobile && (
          <button className={`fullscreen-toggle ${fullscreenMode ? 'hidden' : ''}`} onClick={toggleFullscreen} title={fullscreenMode ? "Exit fullscreen" : "Enter fullscreen"}>
            <FontAwesomeIcon icon={fullscreenMode ? faEyeSlash : faEye} />
          </button>
        )}

        {/* Transaction Prompt Modal */}
        {showTransactionPrompt && renderTransactionModal()}

        {/* Receipt Modal */}
        {showReceiptModal && (
          <ReceiptModal
            receiptDetails={receiptDetails}
            onClose={() => setShowReceiptModal(false)}
            formatAmount={formatAmount}
          />
        )}
      </div>
    </>
  );
}

export default Selldrugs;