import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { resolveTheme } from './themeUtils';
import UpdateStocksModal from './UpdateStocksModal';
import Topbar from './Topbar';

// ─── DESIGN TOKENS (copied from NurseDashboard) ─────────────────────────────
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
    warningLight: '#fffbeb',
    info: '#2563eb',
    infoLight: '#eff6ff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
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
    staffCardBg: 'rgba(255,255,255,0.05)',
    staffCardBorder: '#1e3a8a',
    logoBg: '#2563eb',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    inputText: '#0f172a',
    selectBg: '#ffffff',
    selectText: '#0f172a',
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
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    tableHeader: '#f1f5f9',
    tableBorder: '#e2e8f0',
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
    staffCardBg: '#f8fafc',
    staffCardBorder: '#e2e8f0',
    logoBg: '#2563eb',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    inputText: '#0f172a',
    selectBg: '#ffffff',
    selectText: '#0f172a',
  }
};

// ─── MOBILE DETECTION HOOK ───────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const styles = (theme) => ({
  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: theme.cardBg,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    background: theme.tableHeader,
    color: theme.textSecondary,
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `2px solid ${theme.tableBorder}`,
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.tableBorder}`,
    color: theme.textPrimary,
    fontSize: '13px',
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${theme.inputBorder}`,
    background: theme.inputBg,
    color: theme.inputText,
    fontSize: '13px',
    transition: 'all 0.15s ease',
    outline: 'none',
    '&:focus': {
      borderColor: theme.accent,
      boxShadow: `0 0 0 3px ${theme.accentLight}`,
    },
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${theme.inputBorder}`,
    background: theme.selectBg,
    color: theme.selectText,
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
});

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
    ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; borderRadius: '4px'; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textSecondary}; }
    
    .nav-item:hover { 
      background: ${theme.navHoverBg} !important; 
      color: ${theme.sidebarText} !important; 
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
    
    .active-tab { 
      background: ${theme.activeNavBg} !important; 
    }
    
    .active-tab .nav-icon { 
      color: ${theme.activeNavText} !important; 
    }
    
    .collapse-btn:hover { 
      background: ${theme.collapseButtonHover} !important; 
      transform: scale(1.05); 
    }
    
    .table-row:hover {
      background: ${theme.tableHeader} !important;
    }
    
    .action-btn-edit {
      background: ${theme.infoLight};
      color: ${theme.info};
      border: 1px solid ${theme.info};
    }
    
    .action-btn-edit:hover {
      background: ${theme.info};
      color: #ffffff;
    }
    
    .action-btn-delete {
      background: ${theme.dangerLight};
      color: ${theme.danger};
      border: 1px solid ${theme.danger};
    }
    
    .action-btn-delete:hover {
      background: ${theme.danger};
      color: #ffffff;
    }
    
    .create-mode {
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @media (max-width: 768px) {
      .sidebar {
        width: ${sidebarCollapsed => sidebarCollapsed ? '80px' : '200px'} !important;
      }
      .main-content {
        margin-left: ${sidebarCollapsed => sidebarCollapsed ? '80px' : '200px'} !important;
      }
    }

    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .mobile-only { display: flex !important; }
    }
    @media (min-width: 769px) {
      .mobile-only { display: none !important; }
      .desktop-only { display: flex !important; }
    }
  `}</style>
);

// ─── Loading Spinner ────────────────────────────────────────────────────────
function LoadingSpinner({ theme }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px', 
      gap: '16px' 
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: `3px solid ${theme.tableBorder}`, 
        borderTopColor: theme.accent, 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading drug inventory...</div>
    </div>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, drug, theme }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        style={{
          background: theme.cardBg,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          position: 'relative',
          animation: 'slideIn 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: theme.dangerLight,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '32px',
          color: theme.danger,
        }}>
          ⚠️
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: theme.danger,
          textAlign: 'center',
          marginBottom: '12px',
        }}>
          DANGEROUS ACTION - ADMIN PRIVILEGES REQUIRED
        </h2>

        {/* Drug Details */}
        <div style={{
          background: theme.warningLight,
          border: `1px solid ${theme.warning}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            You are about to delete:
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary }}>
            {drug?.drug_name}
          </div>
          <div style={{ fontSize: '14px', color: theme.textMuted, marginTop: '4px' }}>
            Packaging: {drug?.packaging}
          </div>
        </div>

        {/* Warning Messages */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            color: theme.danger,
            fontSize: '14px',
            fontWeight: '500',
          }}>
            <span>🔴</span> Permanently remove this drug from the system alumni
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            color: theme.warning,
            fontSize: '14px',
            fontWeight: '500',
          }}>
            <span>⚠️</span> Affect any existing stock in pharmacy and store
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            color: theme.warning,
            fontSize: '14px',
            fontWeight: '500',
          }}>
            <span>📊</span> Impact historical records and transactions
          </div>
        </div>

        {/* Admin Notice */}
        <div style={{
          background: theme.infoLight,
          border: `1px solid ${theme.info}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          fontSize: '13px',
          color: theme.textSecondary,
        }}>
          <span style={{ fontWeight: '600', color: theme.info }}>ℹ️ Note:</span> This should only be done with administrator approval.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.cardBorder}`,
              background: 'transparent',
              color: theme.textSecondary,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = theme.tableHeader}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: theme.danger,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = theme.danger}
          >
            I Confirm - Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Bottom Navigation ────────────────────────────────────────────────
function MobileBottomNav({ activeView, onNavigate, itemCount, theme }) {
  const tabs = [
    { id: 'list', icon: '📦', label: 'Items', badge: itemCount },
    { id: 'create', icon: '➕', label: 'Add New' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: theme.cardBg, borderTop: `1px solid ${theme.cardBorder}`,
      display: 'flex', zIndex: 200,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          style={{
            flex: 1, padding: '10px 8px 8px', border: 'none', background: 'transparent',
            borderTop: activeView === tab.id ? `3px solid ${theme.activeNavBg}` : '3px solid transparent',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '20px', position: 'relative' }}>
            {tab.icon}
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-8px', background: theme.accent, color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>{tab.badge}</span>
            )}
          </span>
          <span style={{ fontSize: '11px', fontWeight: activeView === tab.id ? '600' : '400', color: activeView === tab.id ? theme.activeNavBg : theme.textMuted }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
function DrugOrigins() {
  const isMobile = useIsMobile();

  const [newDrug, setNewDrug] = useState({ 
    drugName: '', 
    packaging: '', 
    warningPoint: '', 
    costPrice: '', 
    sellingPrice: '' 
  });
  const [allDrugs, setAllDrugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingDrug, setIsAddingDrug] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugToDelete, setDrugToDelete] = useState(null);
  const [token, setToken] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'create'
  const [loading, setLoading] = useState(true);
  
  // NEW STATE: Store drug expiry and batch number settings from session
  const [useDrugExpiryDate, setUseDrugExpiryDate] = useState('yes');
  const [useDrugBatchNumbers, setUseDrugBatchNumbers] = useState('yes');

  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlTheme = params.get('theme');

  // Get the active theme colors
  const theme = colors[currentTheme];

  // ── Security check with theme detection ─────────────────────────────────
  useEffect(() => {
    if (!urlToken) { 
      navigate('/login'); 
      return; 
    }
    
    const checkSecurity = async () => {
      try {
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken }),
        });

        if (!securityResponse.ok) throw new Error('Security check failed');
        
        const securityData = await securityResponse.json();

        if (securityData.message === 'Session valid') {
          setEmployeeName(securityData.employee_name);
          setClinicName(securityData.clinic);
          
          // Theme detection
          const themeColor = securityData.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          // STORE DRUG EXPIRY AND BATCH NUMBER SETTINGS FROM SESSION
          setUseDrugExpiryDate(securityData.use_drug_expiry_date || 'yes');
          setUseDrugBatchNumbers(securityData.use_drug_batch_numbers || 'yes');
          
          setToken(urlToken);
          await fetchAllDrugs(urlToken);
          setLoading(false);
        } else if (securityData.error === 'Session expired') {
          navigate(`/dashboard?token=${securityData.clinic_session_token}`);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
      }
    };
    
    checkSecurity();
  }, [navigate, urlToken]);

  // ── Fetch drugs with auto-refresh ───────────────────────────────────────
  const fetchAllDrugs = async (tokenToUse) => {
    try {
      const response = await fetch(urls.fetchoriginaldrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToUse }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch drugs');
      
      const payload = await response.json();
      let drugsData = [];

      if (Array.isArray(payload)) {
        drugsData = payload;
      } else if (payload && Array.isArray(payload.data)) {
        drugsData = payload.data;
      } else if (payload && Array.isArray(payload.drugs)) {
        drugsData = payload.drugs;
      } else {
        console.warn('Unexpected fetchoriginaldrugs response payload:', payload);
      }

      const sortedDrugs = drugsData.sort((a, b) => {
        const nameA = (a.drug_name || a.name || '').toString().toLowerCase();
        const nameB = (b.drug_name || b.name || '').toString().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setAllDrugs(sortedDrugs);
    } catch (error) {
      console.error('Error fetching drugs:', error);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => fetchAllDrugs(token), 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // ── Input handlers ──────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDrug(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewDrug({ drugName: '', packaging: '', warningPoint: '', costPrice: '', sellingPrice: '' });
  };

  // ── Create drug handler ─────────────────────────────────────────────────
  const handleCreateDrug = () => {
    if (!newDrug.drugName || !newDrug.packaging || !newDrug.warningPoint || 
        !newDrug.costPrice || !newDrug.sellingPrice) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    const existingDrug = allDrugs.find(drug => 
      drug.drug_name.toLowerCase() === newDrug.drugName.toLowerCase() &&
      drug.packaging.toLowerCase() === newDrug.packaging.toLowerCase()
    );

    if (existingDrug) {
      alert("❌ This drug with the same name and packaging already exists in the system.");
      return;
    }

    setIsAddingDrug(true);

    fetch(urls.adddrug, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDrug, token }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to add drug');
      resetForm();
      fetchAllDrugs(token);
      setActiveView('list'); // Return to list view after creation
      alert("✅ Drug created successfully!");
    })
    .catch(error => {
      console.error('Error adding drug:', error);
      alert("❌ Failed to create drug. Please try again.");
    })
    .finally(() => {
      setIsAddingDrug(false);
    });
  };

  // ── Delete drug handler with modal confirmation ─────────────────────────
  const handleDeleteClick = (drug) => {
    setDrugToDelete(drug);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!drugToDelete) return;

    setIsAddingDrug(true);
    setShowDeleteModal(false);

    fetch(urls.deleteoriginaldrug, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drugName: drugToDelete.drug_name,
        packaging: drugToDelete.packaging,
        drug_id: drugToDelete.drug_id,
        token
      }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete drug');
      fetchAllDrugs(token);
      alert("✅ Drug deleted successfully. This change affects all facility stocks.");
    })
    .catch(error => {
      console.error('Error deleting drug:', error);
      alert("❌ Failed to delete drug. Please check your permissions.");
    })
    .finally(() => {
      setIsAddingDrug(false);
      setDrugToDelete(null);
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDrugToDelete(null);
  };

  // ── Modal handlers - UPDATED to include expiry date and batch number settings ──
  const handleOpenModal = (drug) => {
    setSelectedDrug({
      drug_id: drug.drug_id,
      drug_name: drug.drug_name,
      packaging: drug.packaging,
      warning_point: drug.warning_point,
      cost_price: drug.cost_price,
      selling_price: drug.selling_price,
      average: drug.average,
      status: drug.status,
      Last_sold: drug.Last_sold,
      additional_info: drug.additional_info,
      units: drug.units,
      unit_packaging: drug.unit_packaging,
      theme: currentTheme, // Pass theme color to modal
      // ADD THE NEW FIELDS FROM SESSION
      use_drug_expiry_date: useDrugExpiryDate,
      use_drug_batch_numbers: useDrugBatchNumbers
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDrug(null);
  };

  // ── Navigation items ────────────────────────────────────────────────────
  const navSections = [
    {
      label: 'DRUG MANAGEMENT',
      items: [
        { 
          id: 'system-drugs', 
          icon: '💊', 
          label: 'System Drugs', 
          action: () => setActiveView('list'),
          badge: allDrugs.length 
        },
        { 
          id: 'create-drug', 
          icon: '➕', 
          label: 'Create New Drug', 
          action: () => {
            resetForm();
            setActiveView('create');
          },
        },
      ],
    },
  ];

  // ── Avatar initials ─────────────────────────────────────────────────────
  const initials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  // Filter drugs based on search
  const filteredDrugs = allDrugs.filter(drug => 
    (drug.drug_name || drug.name || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockDrugs = allDrugs.filter(drug => {
    const quantity = Number(drug.quantity || 0);
    const warningPoint = Number(drug.warning_point || drug.warningPoint || 0);
    return warningPoint > 0 && quantity < warningPoint;
  });

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    if (loading) {
      return (
        <>
          <GlobalStyles theme={theme} />
          <div style={{ minHeight: '100vh', background: theme.mainBg }}>
            <Topbar token={urlToken} themeColor={currentTheme} />
            <LoadingSpinner theme={theme} />
          </div>
        </>
      );
    }

    return (
      <>
        <GlobalStyles theme={theme} />
        <div style={{ minHeight: '100vh', background: theme.mainBg, paddingBottom: '80px' }}>
          <Topbar token={urlToken} themeColor={currentTheme} />

          {/* Mobile Header */}
          <div style={{
            background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}`,
            padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary }}>
                {activeView === 'list' ? '📦 System Items' : '➕ Add New Item'}
              </div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>{clinicName}</div>
            </div>
            {activeView === 'list' && (
              <div style={{ fontSize: '12px', background: theme.accentLight, color: theme.accent, padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                {filteredDrugs.length} items
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '12px 14px' }}>
            {activeView === 'list' && (
              <>
                {/* Search */}
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search items..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ ...styles(theme).input, fontSize: '15px', padding: '12px 14px' }}
                  />
                </div>

                {/* Items */}
                {filteredDrugs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: theme.textMuted }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontSize: '14px' }}>
                      {allDrugs.length === 0 ? 'No items yet. Tap ➕ to add your first item.' : 'No items match your search.'}
                    </div>
                  </div>
                ) : (
                  filteredDrugs.map((drug, i) => (
                    <div key={drug.drug_id || i} style={{
                      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
                      borderRadius: '12px', padding: '16px', marginBottom: '10px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: theme.textPrimary, marginBottom: '3px' }}>{drug.drug_name}</div>
                          <div style={{ fontSize: '12px', color: theme.textMuted, background: theme.tableHeader, display: 'inline-block', padding: '2px 8px', borderRadius: '20px' }}>{drug.packaging}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => handleOpenModal(drug)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${theme.info}`, background: theme.infoLight, color: theme.info, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                          <button onClick={() => handleDeleteClick(drug)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${theme.danger}`, background: theme.dangerLight, color: theme.danger, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                        {[
                          ['Warning Pt.', drug.warning_point],
                          ['Cost', `UGX ${Number(drug.cost_price).toLocaleString()}`],
                          ['Selling', `UGX ${Number(drug.selling_price).toLocaleString()}`],
                          ['Stock', `${Number(drug.quantity || 0).toLocaleString()}`],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: theme.tableHeader, borderRadius: '8px', padding: '8px 10px' }}>
                            <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {Number(drug.quantity || 0) < Number(drug.warning_point || 0) && Number(drug.warning_point || 0) > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.danger, fontWeight: '600' }}>
                          <span>⚠️</span>
                          <span>This drug is below warning point and should appear in the purchase list.</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {activeView === 'create' && (
              <div style={{ ...styles(theme).card, animation: 'slideIn 0.25s ease', padding: '16px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: theme.textPrimary, marginBottom: '6px' }}>Add New Item</h2>
                <p style={{ color: theme.textMuted, fontSize: '13px', marginBottom: '20px' }}>This item will be available across all business modules.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Item Name', name: 'drugName', type: 'text', placeholder: 'e.g., Colgate, Soda' },
                    { label: 'Warning Point', name: 'warningPoint', type: 'number', placeholder: 'Minimum stock alert level' },
                    { label: 'Cost Price (UGX)', name: 'costPrice', type: 'number', placeholder: 'Purchase price per unit' },
                    { label: 'Selling Price (UGX)', name: 'sellingPrice', type: 'number', placeholder: 'Selling price' },
                  ].map(field => (
                    <div key={field.name}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        {field.label} <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <input type={field.type} name={field.name} value={newDrug[field.name]} onChange={handleInputChange} placeholder={field.placeholder} style={{ ...styles(theme).input, padding: '12px 14px', fontSize: '15px' }} />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                      Packaging <span style={{ color: theme.danger }}>*</span>
                    </label>
                    <select name="packaging" value={newDrug.packaging} onChange={handleInputChange} style={{ ...styles(theme).select, padding: '12px 14px', fontSize: '15px' }}>
                      <option value="">Select Packaging</option>
                      <option value="Tablets">Tablets</option>
                      <option value="Capsules">Capsules</option>
                      <option value="Syrups">Syrups</option>
                      <option value="Syringes">Syringes</option>
                      <option value="Rolls">Rolls</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Droppler Bottles">Droppler Bottles</option>
                      <option value="Cannulas">Cannulas</option>
                      <option value="Strips">Strips</option>
                      <option value="Packets">Packets</option>
                      <option value="Vials">Vials</option>
                      <option value="Ampules">Ampules</option>
                      <option value="Pieces">Pieces</option>
                      <option value="Sackets">Sackets</option>
                      <option value="Pessaries">Pessaries</option>
                      <option value="Suppostories">Suppostories</option>
                    </select>
                  </div>
                </div>

                {/* Info Banner */}
                <div style={{ background: theme.warningLight, border: `1px solid ${theme.warning}`, borderRadius: '8px', padding: '12px', marginTop: '20px', fontSize: '12px', color: theme.warning, lineHeight: '1.5' }}>
                  <strong>⚠️ Administrator Notice:</strong> Drug name + packaging must be unique. Ensure you have admin privileges.
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => { resetForm(); setActiveView('list'); }} style={{ flex: 1, padding: '13px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.textSecondary, fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleCreateDrug} disabled={isAddingDrug} style={{ flex: 2, padding: '13px', borderRadius: '8px', border: 'none', background: isAddingDrug ? theme.textMuted : theme.accent, color: '#fff', fontSize: '14px', fontWeight: '600', cursor: isAddingDrug ? 'not-allowed' : 'pointer', opacity: isAddingDrug ? 0.7 : 1 }}>
                    {isAddingDrug ? 'Creating...' : '✅ Create Item'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Bottom Nav */}
          <MobileBottomNav activeView={activeView} onNavigate={(v) => { if (v === 'create') resetForm(); setActiveView(v); }} itemCount={allDrugs.length} theme={theme} />
        </div>

        {/* Modals */}
        <DeleteConfirmationModal isOpen={showDeleteModal} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} drug={drugToDelete} theme={theme} />
        {showModal && selectedDrug && (
          <UpdateStocksModal 
            isOpen={showModal} 
            onClose={handleCloseModal} 
            selectedDrug={selectedDrug}
            token={token} 
            refreshDrugs={() => fetchAllDrugs(token)}
            themeColor={currentTheme}
          />
        )}
      </>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg }}>
          <aside style={{
            width: sidebarCollapsed ? '80px' : '260px',
            background: theme.sidebarBg,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            transition: 'width 0.3s ease',
          }}>
            <div style={{ padding: '28px 24px' }}>
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: theme.sidebarText }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, marginRight: '6px' }} />
                MEDCORE
              </h1>
            </div>
          </aside>
          <main style={{ marginLeft: '260px', flex: 1 }}>
            <Topbar token={urlToken} themeColor={currentTheme} />
            <div style={{ padding: '28px' }}>
              <LoadingSpinner theme={theme} />
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles theme={theme} />
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.mainBg, position: 'relative' }}>

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '260px',
          background: theme.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: `1px solid ${theme.sidebarBorder}`,
          position: 'fixed',
          paddingTop: '80px',
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: 'auto',
          boxShadow: currentTheme === 'blue' ? '2px 0 8px rgba(0,0,0,0.1)' : '2px 0 8px rgba(0,0,0,0.05)',
          transition: 'width 0.3s ease',
          zIndex: 900,
        }}>
          {/* Logo with Collapse Button */}
          <div style={{
            padding: sidebarCollapsed ? '20px 10px' : '20px 16px',
            borderBottom: `2px solid ${theme.sidebarBorder}`,
            display: 'flex',
            flexDirection: sidebarCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            minHeight: sidebarCollapsed ? '120px' : '80px',
          }}>
            {/* Logo section */}
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
                background: theme.logoBg,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: currentTheme === 'blue' ? '0 4px 10px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                CP
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: theme.sidebarText, fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>SET DRUGS</div>
                  <div style={{ color: theme.sidebarTextMuted, fontSize: '11px', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap' }}>Drug Management</div>
                </div>
              )}
            </div>

            {/* Collapse Button */}
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                ...styles(theme).collapseButton,
                background: theme.collapseButtonBg,
                border: currentTheme === 'blue' ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.05)',
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
                boxShadow: currentTheme === 'blue' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
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

          {/* Staff Card */}
          {!sidebarCollapsed && employeeName && (
            <div style={{
              margin: '16px 16px 20px',
              background: theme.staffCardBg,
              borderRadius: '10px',
              padding: '14px 16px',
              border: `1px solid ${theme.staffCardBorder}`,
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '10px',
              }}>
                {initials(employeeName)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>{employeeName}</div>
              <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pharmacy Administrator
              </div>
            </div>
          )}

          {/* Navigation - Removed Info Panel from sidebar */}
          <nav style={{ flex: 1, padding: sidebarCollapsed ? '12px 0' : '8px 12px', overflowY: 'auto' }}>
            {navSections.map(section => (
              <div key={section.label} style={{ marginBottom: '16px' }}>
                {!sidebarCollapsed && <div style={styles(theme).sectionHeader(sidebarCollapsed)}>{section.label}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {section.items.map(item => {
                    const isActive = (item.id === 'system-drugs' && activeView === 'list') || 
                                    (item.id === 'create-drug' && activeView === 'create');
                    return (
                      <button
                        key={item.id}
                        className={`nav-item ${isActive ? 'active-tab' : ''}`}
                        onClick={item.action}
                        onMouseEnter={() => setHoveredNavItem(item.id)}
                        onMouseLeave={() => setHoveredNavItem(null)}
                        style={{
                          ...styles(theme).navItem(isActive, sidebarCollapsed),
                          padding: sidebarCollapsed ? '12px 0' : '10px 14px',
                          margin: sidebarCollapsed ? '0' : '0 0 2px 0',
                          position: 'relative',
                        }}
                      >
                        <span className="nav-icon" style={{
                          fontSize: '18px',
                          width: '20px',
                          textAlign: 'center',
                          filter: currentTheme === 'blue' ? 'brightness(1.2)' : 'none',
                          color: isActive ? theme.activeNavText : theme.iconBright,
                        }}>
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span style={{ fontWeight: '500', flex: 1, textAlign: 'left', color: isActive ? theme.activeNavText : theme.sidebarText }}>
                              {item.label}
                            </span>
                            {item.badge > 0 && (
                              <span style={{
                                background: theme.accent,
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                textAlign: 'center',
                              }}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip */}
                        {sidebarCollapsed && hoveredNavItem === item.id && (
                          <div style={styles(theme).tooltip}>
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

          {/* User Footer */}
          <div style={{
            padding: sidebarCollapsed ? '16px 0' : '16px',
            borderTop: `1px solid ${theme.sidebarBorder}`,
            background: currentTheme === 'blue' ? 'rgba(0,0,0,0.2)' : theme.filterSection,
            textAlign: sidebarCollapsed ? 'center' : 'left'
          }}>
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.logoBg})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {initials(employeeName)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: theme.sidebarTextMuted, fontWeight: '500' }}>
                    {clinicName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.sidebarText,
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{employeeName}</div>
                </div>
              </div>
            ) : (
              <div
                style={{ fontSize: '14px', color: theme.sidebarText, fontWeight: '500', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={() => setHoveredNavItem('user')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                👤
                {hoveredNavItem === 'user' && (
                  <div style={{ ...styles(theme).tooltip, left: '100%' }}>
                    {employeeName} - Admin
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '260px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          paddingTop: '80px',
        }}>
          <Topbar token={urlToken} themeColor={currentTheme} />

          {/* Removed Warning Banner */}

          {/* Secondary Topbar */}
          <div style={{
            background: theme.cardBg,
            borderBottom: `1px solid ${theme.cardBorder}`,
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: '60px',
            zIndex: 50,
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textPrimary }}>
              {activeView === 'list' ? 'SYSTEM DRUGS' : 'Create New Drug'}
            </div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>
              {clinicName}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '28px' }}>

            {/* List View */}
            {activeView === 'list' && (
              <div style={styles(theme).card}>
                {/* Search Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search drugs by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      ...styles(theme).input,
                      maxWidth: '400px',
                    }}
                  />
                </div>

                {lowStockDrugs.length > 0 && (
                  <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: theme.warningLight, color: theme.warning, border: `1px solid ${theme.warning}` }}>
                    <strong>⚠️ {lowStockDrugs.length} drug{lowStockDrugs.length === 1 ? '' : 's'} below warning point.</strong> These items are low on stock and should be reviewed in the reorder list.
                  </div>
                )}

                {/* Drugs Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles(theme).table}>
                    <thead>
                      <tr>
                        <th style={styles(theme).th}>Drug Name</th>
                        <th style={styles(theme).th}>Packaging</th>
                        <th style={styles(theme).th}>Warning Point</th>
                        <th style={styles(theme).th}>Cost Price</th>
                        <th style={styles(theme).th}>Selling Price</th>
                        <th style={styles(theme).th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrugs.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ ...styles(theme).td, textAlign: 'center', padding: '40px' }}>
                            <div style={{ color: theme.textMuted }}>
                              {allDrugs.length === 0 
                                ? 'No drugs in the system. Click "Create New Drug" to add your first drug.' 
                                : 'No drugs match your search criteria.'}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredDrugs.map((drug, index) => (
                          <tr key={drug.drug_id || index} className="table-row">
                            <td style={styles(theme).td}>{drug.drug_name}</td>
                            <td style={styles(theme).td}>{drug.packaging}</td>
                            <td style={styles(theme).td}>{drug.warning_point}</td>
                            <td style={styles(theme).td}>UGX {Number(drug.cost_price).toLocaleString()}</td>
                            <td style={styles(theme).td}>UGX {Number(drug.selling_price).toLocaleString()}</td>
                            <td style={styles(theme).td}>
                              {/* FIXED: Buttons now side by side using flexbox container */}
                              <div style={styles(theme).actionButtonsContainer}>
                                <button
                                  onClick={() => handleOpenModal(drug)}
                                  style={{
                                    ...styles(theme).actionButton,
                                    background: theme.infoLight,
                                    color: theme.info,
                                    border: `1px solid ${theme.info}`,
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = theme.info;
                                    e.currentTarget.style.color = '#ffffff';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = theme.infoLight;
                                    e.currentTarget.style.color = theme.info;
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(drug)}
                                  style={{
                                    ...styles(theme).actionButton,
                                    background: theme.dangerLight,
                                    color: theme.danger,
                                    border: `1px solid ${theme.danger}`,
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = theme.danger;
                                    e.currentTarget.style.color = '#ffffff';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = theme.dangerLight;
                                    e.currentTarget.style.color = theme.danger;
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create View - With Explanation Panel on the Right */}
            {activeView === 'create' && (
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Main Form - Left Side */}
                <div className="create-mode" style={{ ...styles(theme).card, flex: 2 }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>
                      Create New Drug
                    </h2>
                    <p style={{ color: theme.textMuted, fontSize: '14px' }}>
                      Fill in the details below to add a new drug to the system alumni. 
                      This drug will be available across all facility modules.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        Drug Name <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="drugName"
                        value={newDrug.drugName}
                        onChange={handleInputChange}
                        placeholder="e.g., Amoxicillin, Paracetamol"
                        style={styles(theme).input}
                        title="This name will appear across all system modules"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        Packaging <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <select
                        name="packaging"
                        value={newDrug.packaging}
                        onChange={handleInputChange}
                        style={styles(theme).select}
                        title="Select the primary packaging unit"
                      >
                        <option value="">Select Packaging</option>
                        <option value="Tablets">Tablets</option>
                        <option value="Capsules">Capsules</option>
                        <option value="Syrups">Syrups</option>
                        <option value="Syringes">Syringes</option>
                        <option value="Rolls">Rolls</option>
                        <option value="Bottles">Bottles</option>
                        <option value="Droppler Bottles">Droppler Bottles</option>
                        <option value="Cannulas">Cannulas</option>
                        <option value="Strips">Strips</option>
                        <option value="Packets">Packets</option>
                        <option value="Vials">Vials</option>
                        <option value="Ampules">Ampules</option>
                        <option value="Pieces">Pieces</option>
                        <option value="Sackets">Sackets</option>
                        <option value="Pessaries">Pessaries</option>
                        <option value="Suppostories">Suppostories</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        Warning Point <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="warningPoint"
                        value={newDrug.warningPoint}
                        onChange={handleInputChange}
                        placeholder="Minimum stock alert level"
                        style={styles(theme).input}
                        title="The minimum quantity before stock alert is triggered"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        Cost Price (UGX) <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="costPrice"
                        value={newDrug.costPrice}
                        onChange={handleInputChange}
                        placeholder="Purchase price per unit"
                        style={styles(theme).input}
                        title="The price at which the facility purchases this drug"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '6px' }}>
                        Selling Price (UGX) <span style={{ color: theme.danger }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="sellingPrice"
                        value={newDrug.sellingPrice}
                        onChange={handleInputChange}
                        placeholder="Patient selling price"
                        style={styles(theme).input}
                        title="The price at which patients will be charged"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setActiveView('list')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.cardBorder}`,
                        background: 'transparent',
                        color: theme.textSecondary,
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.tableHeader}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateDrug}
                      disabled={isAddingDrug}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isAddingDrug ? theme.textMuted : theme.accent,
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: isAddingDrug ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isAddingDrug ? 0.6 : 1,
                      }}
                      onMouseEnter={e => !isAddingDrug && (e.currentTarget.style.background = theme.accentLight)}
                      onMouseLeave={e => !isAddingDrug && (e.currentTarget.style.background = theme.accent)}
                    >
                      {isAddingDrug ? 'Creating...' : 'Create Drug'}
                    </button>
                  </div>
                </div>

                {/* Explanation Panel - Right Side */}
                <div style={{
                  flex: 1,
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  alignSelf: 'flex-start',
                  position: 'sticky',
                  top: '140px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: theme.infoLight,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: theme.info,
                    fontSize: '24px',
                  }}>
                    ℹ️
                  </div>
                  
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: theme.textPrimary, marginBottom: '16px' }}>
                    About Drug Creation
                  </h3>
                  
                  <p style={{ fontSize: '13px', color: theme.textSecondary, lineHeight: '1.6', marginBottom: '16px' }}>
                    Creating a new drug adds it to the system brain. This drug will become available across all modules:
                  </p>
                  
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.textSecondary }}>
                      <span style={{ color: theme.accent, fontSize: '16px' }}>✓</span>
                      Pharmacy dispensing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.textSecondary }}>
                      <span style={{ color: theme.accent, fontSize: '16px' }}>✓</span>
                      Store inventory
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.textSecondary }}>
                      <span style={{ color: theme.accent, fontSize: '16px' }}>✓</span>
                      Prescription writing
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.textSecondary }}>
                      <span style={{ color: theme.accent, fontSize: '16px' }}>✓</span>
                      Stock tracking
                    </li>
                  </ul>
                  
                  <div style={{
                    padding: '16px',
                    background: theme.warningLight,
                    border: `1px solid ${theme.warning}`,
                    borderRadius: '8px',
                    color: theme.warning,
                    fontSize: '12px',
                    lineHeight: '1.6',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600' }}>
                      <span>⚠️</span> Administrator Notice
                    </div>
                    <p style={{ margin: 0 }}>
                      Ensure you have administrator privileges before creating new drugs. 
                      Drug name and packaging combination must be unique in the system.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        drug={drugToDelete}
        theme={theme}
      />

      {/* Update Stocks Modal - Now receives expiry date and batch number settings */}
      {showModal && selectedDrug && (
        <UpdateStocksModal 
          isOpen={showModal} 
          onClose={handleCloseModal} 
          selectedDrug={selectedDrug}
          token={token} 
          refreshDrugs={() => fetchAllDrugs(token)}
          themeColor={currentTheme}
        />
      )}
    </>
  );
}

export default DrugOrigins;
