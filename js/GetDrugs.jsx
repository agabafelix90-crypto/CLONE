import React, { useState, useEffect, useCallback, useRef } from 'react';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCartPlus, 
  faCheck, 
  faTimes, 
  faSearch, 
  faTrashAlt, 
  faEye, 
  faEyeSlash,
  faBoxes,
  faClipboardList,
  faExclamationTriangle,
  faSpinner,
  faCheckCircle,
  faPills,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import { handleInvalidSession } from './authUtils';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import MissingDrugs from './MissingDrugs';
import './getdrugs.css';

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
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
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
    buttonDanger: '#dc2626',
    buttonDangerHover: '#b91c1c',
    emptyCartIcon: '#e2e8f0',
  }
};

const TOPBAR_HEIGHT = 60;
const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

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
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    
    .empty-cart-icon {
      animation: float 3s ease-in-out infinite;
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }
    
    .empty-cart-icon:hover {
      opacity: 0.8;
    }
    
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
    
    .table-row:hover {
      background: ${theme.infoLight};
    }
    
    .table-row.selected {
      background: ${theme.infoLight};
      border-left: 3px solid ${theme.info};
    }
    
    .table-row.expired {
      opacity: 0.6;
      background: ${theme.danger}10;
      cursor: not-allowed;
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
    
    .take-table-container {
      background: ${theme.cardBg};
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      padding: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .take-title {
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
    
    .take-title i {
      color: ${theme.iconBright};
    }
    
    .empty-take-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      color: ${theme.textMuted};
    }
    
    .empty-take-message {
      margin-top: 16px;
      font-size: 14px;
      font-weight: 500;
      color: ${theme.textMuted};
      letter-spacing: 0.5px;
    }
    
    .empty-take-submessage {
      margin-top: 8px;
      font-size: 12px;
      color: ${theme.textMuted};
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
    
    .take-btn {
      background: ${theme.buttonPrimary};
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
    
    .take-btn:hover:not(:disabled) {
      background: ${theme.buttonPrimaryHover};
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }
    
    .take-btn:disabled {
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
      width: 100%;
      padding: 8px 8px 8px 36px;
      margin-left: 40px;
      border-radius: 6px;
      border: 1px solid ${theme.inputBorder};
      background: ${theme.inputBg};
      color: ${theme.textPrimary};
      font-size: 14px;
    }
    
    .search-input:focus {
      outline: none;
      border-color: ${theme.info};
      box-shadow: 0 0 0 2px ${theme.infoLight};
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
    
    .modal-textarea {
      width: 100%;
      height: 120px;
      padding: 12px;
      margin-bottom: 24px;
      border: 2px solid ${theme.inputBorder};
      border-radius: 8px;
      resize: vertical;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      background: ${theme.inputBg};
      color: ${theme.textPrimary};
      outline: none;
      transition: border-color 0.2s;
    }
    
    .modal-textarea:focus {
      border-color: ${theme.info};
      box-shadow: 0 0 0 2px ${theme.infoLight};
    }
    
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .modal-cancel-btn {
      padding: 8px 16px;
      background: ${theme.danger};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    
    .modal-cancel-btn:hover:not(:disabled) {
      background: ${theme.buttonDangerHover};
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }
    
    .modal-cancel-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .modal-submit-btn {
      padding: 8px 16px;
      background: ${theme.buttonSuccess};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      min-width: 100px;
      justify-content: center;
    }
    
    .modal-submit-btn:hover:not(:disabled) {
      background: ${theme.buttonSuccessHover};
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
    }
    
    .modal-submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .spinner {
      animation: spin 1s linear infinite;
    }
    
    .low-stock {
      color: ${theme.danger};
      font-weight: 600;
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

    .pending-item-section {
      margin-top: 12px;
      border-top: 2px dashed ${theme.info};
      padding-top: 12px;
    }

    .pending-item-title {
      color: ${theme.textSecondary};
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pending-item-row {
      background: ${theme.infoLight};
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .take-items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: ${theme.cardBg};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid ${theme.buttonSuccess};
      animation: slideInRight 0.3s ease;
      min-width: 300px;
    }

    .toast.success {
      border-left-color: ${theme.buttonSuccess};
    }

    .toast-icon {
      color: ${theme.buttonSuccess};
      font-size: 20px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      color: ${theme.textPrimary};
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .toast-message {
      color: ${theme.textSecondary};
      font-size: 13px;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: ${theme.buttonSuccess};
      animation: progress 3s linear;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
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

    .last-updated {
      font-size: 10px;
      color: ${theme.textMuted};
      text-align: right;
      padding: 4px 8px;
      border-top: 1px solid ${theme.tableBorder};
      margin-top: 8px;
    }
  `}</style>
);

function GetDrugs() {
  // State management
  const [stockData, setStockData] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [quantityToTake, setQuantityToTake] = useState(1);
  const [takenItems, setTakenItems] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [confirmClicked, setConfirmClicked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTakeButtonActive, setIsTakeButtonActive] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [useBatchAndExpiry, setUseBatchAndExpiry] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  const urlTheme = parseThemeFromSearch(window.location.search);
  const intervalRef = useRef(null);

  // Process stock data based on batch/expiry settings
  const processStockData = useCallback((rawData, useBatchMode) => {
    if (!useBatchMode) {
      // Aggregate by drug_id (sum quantities)
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
      // Return all batches separately, sort by expiry date (FEFO)
      return [...rawData].sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });
    }
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const performSecurityCheck = async (token) => {
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
        
        // Check if we should use batch and expiry
        const useBatch = securityData.use_drug_batch_numbers === 'yes';
        const useExpiry = securityData.use_drug_expiry_date === 'yes';
        setUseBatchAndExpiry(useBatch && useExpiry);
        
        setEmployeeName(securityData.employee_name);
        setClinicName(securityData.clinic);
        return true;
      } else {
        const errorData = await securityResponse.json();
        if (errorData.error === 'Session expired') {
          handleInvalidSession(navigate, window.location.pathname + window.location.search);
          return false;
        } else {
          handleInvalidSession(navigate, window.location.pathname + window.location.search);
          return false;
        }
      }
    } catch (error) {
      console.error('Error performing security check:', error);
      navigate('/login');
      return false;
    }
  };

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
      console.error('Error fetching dispensary stock:', error);
    }
  }, [processStockData, useBatchAndExpiry]);

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
  }, [tokenFromUrl, fetchDispensaryStock, navigate]);

  const theme = colors[currentTheme];

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

  const handleDrugSelect = (drug) => {
    // Don't allow selecting expired drugs when batch mode is on
    if (useBatchAndExpiry && isExpired(drug.expiry_date)) return;
    setSelectedDrug(drug);
    setQuantityToTake(1);
    setSearchQuery('');
    setConfirmClicked(false);
  };

  const handleTakeButtonClick = () => {
    if (!selectedDrug) {
      alert('Please select a drug.');
      return;
    }
    
    const newTakenItem = { 
      drug: selectedDrug.Drug, 
      packaging: selectedDrug.Packaging, 
      quantity: quantityToTake, 
      served_by: employeeName,
      drug_id: selectedDrug.drug_id !== undefined ? selectedDrug.drug_id : null,
      // Include batch and expiry data when enabled
      batch_number: useBatchAndExpiry ? (selectedDrug.batch_number || null) : null,
      expiry_date: useBatchAndExpiry ? (selectedDrug.expiry_date || null) : null,
    };
    
    setTakenItems([...takenItems, newTakenItem]);
    setSelectedDrug(null);
    setQuantityToTake(1);
    setIsTakeButtonActive(false);
    setConfirmClicked(true);
  };

  const handleRemoveTakenItem = (index) => {
    const updatedTakenItems = takenItems.filter((_, idx) => idx !== index);
    setTakenItems(updatedTakenItems);
  };

  const confirmTake = async () => {
    if (takenItems.length === 0) {
      alert('No items to take.');
      return;
    }
    setShowReasonModal(true);
  };

  const submitWithReason = async () => {
    if (!reason.trim()) {
      alert('Please enter a reason for taking these drugs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const takenItemsWithDetails = takenItems.map(item => ({
        ...item,
        drug_id: item.drug_id !== undefined ? item.drug_id : null,
        // Ensure batch and expiry are included when enabled
        batch_number: useBatchAndExpiry ? (item.batch_number || null) : null,
        expiry_date: useBatchAndExpiry ? (item.expiry_date || null) : null,
      }));

      const payload = {
        token: tokenFromUrl,
        takenItems: takenItemsWithDetails,
        reason: reason,
        useBatchAndExpiry: useBatchAndExpiry, // Include flag in payload
      };

      const response = await fetch(urls.takedrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        setToast({
          title: 'Success!',
          message: data.message || 'Items successfully taken'
        });

        try {
          const assignResponse = await fetch(urls.assignAverage4, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const assignData = await assignResponse.json();

          if (assignResponse.ok) {
            console.log('Assignment successful:', assignData);
          } else {
            console.error('Error in assignAverage4:', assignData.error);
          }
        } catch (assignError) {
          console.error('Error sending data to assignAverage4:', assignError);
        }

        // Refresh stock data after successful take
        await fetchDispensaryStock(tokenFromUrl);
        
        setTakenItems([]);
        setSelectedDrug(null);
        setQuantityToTake(1);
        setSearchQuery('');
        setIsTakeButtonActive(false);
        setConfirmClicked(false);
        setReason('');
        setShowReasonModal(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error taking drugs:', error);
      alert('An error occurred while taking drugs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStockData = stockData.filter(item =>
    item.Drug && item.Drug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setIsTakeButtonActive(!!selectedDrug);
  }, [selectedDrug]);

  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };

  const containerStyle = {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: theme.mainBg,
    minHeight: '100vh',
    paddingTop: fullscreenMode ? '0' : `${TOPBAR_HEIGHT}px`,
    paddingBottom: '0',
    margin: 0,
    width: '100%',
    transition: 'padding-top 0.3s ease'
  };

  const contentStyle = {
    padding: fullscreenMode ? '10px' : '10px',
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    boxSizing: 'border-box',
    height: fullscreenMode ? '100vh' : `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    overflow: 'hidden'
  };

  const mainLayoutStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '2px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box'
  };

  return (
    <>
      <GlobalStyles theme={theme} />
      
      <div style={containerStyle}>
        {!fullscreenMode && <Topbar token={tokenFromUrl} themeColor={currentTheme} />}
        
        <MissingDrugs token={tokenFromUrl} />
        
        <div style={contentStyle}>
          <div style={mainLayoutStyle}>
            {/* Take Items Section */}
            <div className="take-table-container" style={{ flex: '0 0 35%', minWidth: '400px' }}>
              <div className="take-title">
                <FontAwesomeIcon icon={faClipboardList} style={{ color: theme.iconBright }} />
                ITEMS TO TAKE
              </div>

              <div style={{ flex: 1, overflowY: 'auto', margin: 0 }}>
                {takenItems.length === 0 && !selectedDrug ? (
                  <div className="empty-take-container">
                    <FontAwesomeIcon 
                      icon={faBoxes} 
                      size="6x" 
                      className="empty-cart-icon"
                      style={{ color: theme.emptyCartIcon }}
                    />
                    <div className="empty-take-message">
                      No items selected
                    </div>
                    <div className="empty-take-submessage">
                      Click on a drug from the stock list to start adding items
                    </div>
                  </div>
                ) : (
                  <>
                    <table className="take-items-table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-cell">Drug/Equipment</th>
                          <th className="table-cell">Qty</th>
                          <th className="table-cell">Served By</th>
                          <th className="table-cell">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {takenItems.map((item, index) => (
                          <tr key={`taken-${index}`} className="table-row">
                            <td className="table-cell">
                              {item.drug} {item.packaging}
                              {useBatchAndExpiry && (
                                <span className="batch-info muted">
                                  {item.batch_number && `Batch: ${formatBatchNumber(item.batch_number)} | `}
                                  {item.expiry_date && `Exp: ${formatExpiryDate(item.expiry_date)}`}
                                  {!item.batch_number && !item.expiry_date && 'No batch/expiry'}
                                </span>
                              )}
                            </td>
                            <td className="table-cell">{item.quantity}</td>
                            <td className="table-cell">{item.served_by}</td>
                            <td className="table-cell">
                              <button 
                                onClick={() => handleRemoveTakenItem(index)} 
                                className="remove-btn"
                                title="Remove item"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pending Item Section */}
                    {selectedDrug && (
                      <div className="pending-item-section">
                        <div className="pending-item-title">
                          <FontAwesomeIcon icon={faCartPlus} style={{ marginRight: '4px' }} />
                          PENDING ITEM - Click Take to add
                        </div>
                        <table className="take-items-table">
                          <tbody>
                            <tr className="pending-item-row">
                              <td className="table-cell" style={{ width: '40%' }}>
                                <strong>{selectedDrug.Drug}</strong>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                                  {selectedDrug.Packaging}
                                </div>
                                {useBatchAndExpiry && (
                                  <div className="batch-info muted">
                                    {getBatchInfoText(selectedDrug)}
                                  </div>
                                )}
                              </td>
                              <td className="table-cell" style={{ width: '15%' }}>
                                <input
                                  type="number"
                                  value={quantityToTake}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setQuantityToTake(value === '' ? '' : Math.max(1, Number(value)));
                                  }}
                                  className="input-field"
                                  min="1"
                                  onWheel={(e) => e.preventDefault()}
                                />
                              </td>
                              <td className="table-cell" style={{ width: '25%' }}>
                                {employeeName}
                              </td>
                              <td className="table-cell" style={{ width: '20%' }}>
                                <button 
                                  onClick={handleTakeButtonClick} 
                                  className="take-btn"
                                  disabled={!selectedDrug || (useBatchAndExpiry && isExpired(selectedDrug.expiry_date))}
                                  title="Add to take list"
                                >
                                  <FontAwesomeIcon icon={faCartPlus} /> Take
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              {takenItems.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${theme.tableBorder}`
                }}>
                  <button
                    onClick={confirmTake}
                    className="confirm-btn"
                  >
                    <FontAwesomeIcon icon={faCheck} /> Confirm Take ({takenItems.length} items)
                  </button>
                </div>
              )}
            </div>

            {/* Stock Section */}
            <div className="table-container" style={{ flex: 1 }}>
              <div style={{ padding: '10px 10px 0 10px' }}>
                <div className="search-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search drugs/equipment... Click to select"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {useBatchAndExpiry && (
                  <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '5px', paddingLeft: '10px' }}>
                    <span style={{ color: theme.warning }}>🟡 Warning:</span> Expiring within 90 days &nbsp;&nbsp;
                    <span style={{ color: theme.danger }}>🔴 Danger:</span> Expired (cannot take) &nbsp;&nbsp;
                    <span style={{ color: theme.textMuted }}>⚪ Muted:</span> No expiry date or batch number
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px 10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead className="table-header">
                    <tr>
                      <th className="table-cell">Drug/Equipment</th>
                      <th className="table-cell">Avail</th>
                      <th className="table-cell">Pack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockData
                      .filter(item => !useBatchAndExpiry || !isExpired(item.expiry_date))
                      .map((item, index) => (
                        <tr 
                          key={`stock-${item.Drug}-${item.batch_number || index}`} 
                          onClick={() => !(useBatchAndExpiry && isExpired(item.expiry_date)) && handleDrugSelect(item)}
                          className={`table-row ${getRowClass(item)} ${selectedDrug?.drug_id === item.drug_id && selectedDrug?.batch_number === item.batch_number ? 'selected' : ''}`}
                          style={{ cursor: (useBatchAndExpiry && isExpired(item.expiry_date)) ? 'not-allowed' : 'pointer' }}
                        >
                          <td className="table-cell">
                            {item.Drug}
                            {useBatchAndExpiry && (
                              <>
                                <span className="batch-info muted">
                                  {getBatchInfoText(item)}
                                  {item.expiry_date && item.expiry_date !== 'null' && item.expiry_date !== null && (
                                    <span className={`expiry-badge ${getExpiryBadgeClass(item.expiry_date)}`}>
                                      {getExpiryBadgeText(item.expiry_date)}
                                    </span>
                                  )}
                                  {(!item.expiry_date || item.expiry_date === 'null' || item.expiry_date === null) && (
                                    <span className="expiry-badge muted">
                                      No expiry
                                    </span>
                                  )}
                                </span>
                              </>
                            )}
                            {!useBatchAndExpiry && item.Packaging && (
                              <span className="batch-info muted">
                                Pack: {item.Packaging}
                              </span>
                            )}
                          </td>
                          <td className="table-cell">
                            <span className={item.Quantity < 10 ? 'low-stock' : ''}>
                              {item.Quantity}
                              {item.Quantity < 10 && (
                                <FontAwesomeIcon 
                                  icon={faExclamationTriangle} 
                                  style={{ marginLeft: '4px', color: theme.warning, fontSize: '10px' }}
                                  title="Low stock"
                                />
                              )}
                            </span>
                          </td>
                          <td className="table-cell">{item.Packaging}</td>
                        </tr>
                      ))}
                    {filteredStockData.filter(item => !useBatchAndExpiry || !isExpired(item.expiry_date)).length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ 
                          padding: '40px 12px', 
                          textAlign: 'center', 
                          color: theme.textMuted,
                          fontSize: '14px'
                        }}>
                          No matching items found
                        </td>
                      </tr>
                    )}
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
        </div>

        {/* Quick Navigation Tabs */}
        <div className={`quick-nav-container ${fullscreenMode ? 'hidden' : ''}`}>
          <Link to={`/sell-drugs/?token=${tokenFromUrl}`} className="quick-nav-tab">
            <FontAwesomeIcon icon={faPills} /> SELL DRUGS
          </Link>
          <Link to={`/dispensed-and-sold/?token=${tokenFromUrl}`} className="quick-nav-tab">
            <FontAwesomeIcon icon={faHistory} /> SOLD DRUGS
          </Link>
          <Link to={`/removed-drugs-equipment/?token=${tokenFromUrl}`} className="quick-nav-tab">
            <FontAwesomeIcon icon={faHistory} /> REMOVED DRUGS
          </Link>
        </div>

        <button 
          className="fullscreen-toggle"
          onClick={toggleFullscreen}
          title={fullscreenMode ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <FontAwesomeIcon icon={fullscreenMode ? faEyeSlash : faEye} />
        </button>

        {showReasonModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Reason for Taking Items</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: theme.textPrimary, fontSize: '14px' }}>Items to take:</h4>
                {takenItems.map((item, index) => (
                  <div key={index} style={{ 
                    marginBottom: '4px', 
                    color: theme.textSecondary,
                    fontSize: '13px'
                  }}>
                    • {item.quantity} {item.packaging} of {item.drug}
                    {useBatchAndExpiry && item.batch_number && ` (Batch: ${formatBatchNumber(item.batch_number)})`}
                    {useBatchAndExpiry && item.expiry_date && ` - Exp: ${formatExpiryDate(item.expiry_date)}`}
                  </div>
                ))}
              </div>
              
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for taking these items..."
                className="modal-textarea"
                disabled={isSubmitting}
              />
              
              <div className="modal-buttons">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="modal-cancel-btn"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
                <button
                  onClick={submitWithReason}
                  className="modal-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="toast-container">
            <div className="toast success">
              <FontAwesomeIcon icon={faCheckCircle} className="toast-icon" />
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-message">{toast.message}</div>
              </div>
              <div className="toast-progress" style={{ animation: 'progress 3s linear' }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GetDrugs;