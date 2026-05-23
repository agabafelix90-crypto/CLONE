import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Store.css';
import { API_URL, urls } from './config.dev';
import { 
  faPlus, 
  faCheck, 
  faStore, 
  faTimes, 
  faFileInvoice, 
  faArrowRight, 
  faBoxes, 
  faHistory, 
  faWarehouse,
  faChartLine,
  faExclamationTriangle,
  faMoneyBillWave,
  faClock,
  faChevronLeft,
  faChevronRight,
  faTachometerAlt,
  faShoppingCart,
  faArrowLeft,
  faSearch,
  faCalendarAlt,
  faFilter,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';

function Store() {
  const navigate = useNavigate();

  // Store Management States
  const [showPrompt, setShowPrompt] = useState('');
  const [newDrugs, setNewDrugs] = useState([
    {
      drug_id: '',
      drug: '',
      quantity: '',
      packaging: '',
      costPrice: '',
      sellingPrice: '',
      sellingPrice2: ''
    }
  ]);

  const [supplier, setSupplier] = useState('');
  const [insertionMessage, setInsertionMessage] = useState('');
  const [stockData, setStockData] = useState([]);
  const [searchQueryMove, setSearchQueryMove] = useState('');
  const [searchQueryStock, setSearchQueryStock] = useState('');
  const [sortedStockData, setSortedStockData] = useState([]);
  const [movedDrugs, setMovedDrugs] = useState({});
  const [originalDrugs, setOriginalDrugs] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [insertingDrugs, setInsertingDrugs] = useState(false);
  const [movingDrugsInProgress, setMovingDrugsInProgress] = useState(false);
  const [stockWorth, setStockWorth] = useState(null);
  const [editableDrugs, setEditableDrugs] = useState(newDrugs.map(() => true));
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // Invoice States
  const [showInvoices, setShowInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [invoiceSuppliers, setInvoiceSuppliers] = useState([]);
  const [loadingInvoiceSuppliers, setLoadingInvoiceSuppliers] = useState(false);
  
  // Refs to prevent event bubbling issues
  const searchInputRef = useRef(null);
  const modalContentRef = useRef(null);

  // ─── DESIGN TOKENS ─────────────────────────────────────────
  const colors = {
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
    accentDark: '#14532d',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    warning: '#d97706',
    warningLight: '#fffbeb',
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
    badgeOrange: { bg: '#ffedd5', text: '#9a3412' },
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeGray: { bg: '#f1f5f9', text: '#475569' },
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBg: '#ffffff',
  };

  // Button icon colors
  const iconColors = {
    insert: '#10b981', // Emerald green
    transfer: '#f59e0b', // Amber
    invoice: '#3b82f6', // Blue
    dashboard: '#8b5cf6', // Purple
    lowStock: '#ef4444', // Red
    warehouse: '#0ea5e9', // Sky blue
  };

  const styles = {
    card: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    },
    tableWrapper: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: colors.textSecondary,
      background: colors.tableHeader,
      borderBottom: `1px solid ${colors.tableBorder}`,
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '13px 16px',
      fontSize: '13.5px',
      color: colors.textPrimary,
      borderBottom: `1px solid ${colors.tableBorder}`,
      verticalAlign: 'middle',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: (type) => {
      const map = {
        green: colors.badgeGreen,
        red: colors.badgeRed,
        orange: colors.badgeOrange,
        blue: colors.badgeBlue,
        gray: colors.badgeGray,
      };
      const c = map[type] || map.gray;
      return {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600',
        background: c.bg, color: c.text,
      };
    },
    sidebarButton: (isActive = false) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: isActive ? colors.activeNavBg : 'transparent',
      color: isActive ? colors.activeNavText : colors.inactiveNavText,
      border: 'none',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '4px',
    }),
    statCard: (accentColor) => ({
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      flex: '1',
      minWidth: '0',
    }),
    filterBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    filterButton: (active) => ({
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      border: `1px solid ${active ? colors.info : colors.cardBorder}`,
      background: active ? colors.infoLight : 'transparent',
      color: active ? colors.info : colors.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }),
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.cardBorder}`,
      fontSize: '13px',
      color: colors.textPrimary,
      background: colors.cardBg,
      minWidth: '200px',
      outline: 'none',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.modalOverlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    },
    modalContent: {
      background: colors.modalBg,
      borderRadius: '16px',
      width: '90%',
      maxWidth: '1400px',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'modalSlideIn 0.3s ease',
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: `1px solid ${colors.cardBorder}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: colors.tableHeader,
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: `1px solid ${colors.cardBorder}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      background: colors.tableHeader,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: colors.textSecondary,
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'all 0.15s ease',
    },
    actionButton: {
      padding: '10px 20px',
      background: colors.accent,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#fff',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.15s ease',
    },
    secondaryButton: {
      padding: '10px 20px',
      background: colors.tableHeader,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: colors.textSecondary,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.15s ease',
    },
    input: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.cardBorder}`,
      fontSize: '13px',
      color: colors.textPrimary,
      background: colors.cardBg,
      width: '100%',
      outline: 'none',
      transition: 'border 0.15s ease',
    },
  };

  // Security and Data Fetching Effects
  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
  
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
  
        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
  
          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            startStockWorthInterval(tokenFromUrl); 
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
  
    const fetchStockWorth = async (token) => {
      try {
        const response = await fetch(urls.stockworth, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: token }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch stock worth');
        }
        const data = await response.json();
        if (typeof data.stockWorth === 'object') {
          const stockWorthValue = data.stockWorth.stockWorth;
          setStockWorth(stockWorthValue);
        } else {
          setStockWorth(data.stockWorth);
        }
      } catch (error) {
        console.error('Error fetching stock worth:', error);
      }
    };
  
    const startStockWorthInterval = (token) => {
      fetchStockWorth(token);
      const intervalId = setInterval(() => {
        fetchStockWorth(token);
      }, 4000);
      return () => clearInterval(intervalId);
    };
  
    fetchTokenAndCheckSecurity();
  }, [navigate]);

  useEffect(() => {
    fetchStockData();
    fetchOriginalDrugs();
    const intervalId = setInterval(fetchStockData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const sortedData = [...stockData].sort((a, b) => a.Drug.localeCompare(b.Drug));
    setSortedStockData(sortedData);
    
    // Calculate low stock count (less than 10 items)
    const lowStock = stockData.filter(item => item.Quantity < 10).length;
    setLowStockCount(lowStock);
  }, [stockData]);

  // Fetch invoice suppliers
  useEffect(() => {
    if (showInvoices) {
      fetchInvoiceSuppliers();
      fetchInvoices();
    }
  }, [showInvoices]);

  // Stock Management Functions
  const fetchStockData = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
  
    const requestBody = {
      token: tokenFromUrl,
    };
  
    fetch(urls.fetchdrugs, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      return response.json();
    })
    .then(data => {
      setStockData(data);
    })
    .catch(error => {
      console.error('Error fetching stock data:', error);
    });
  };
  
  const fetchOriginalDrugs = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
  
    const requestBody = {
      token: tokenFromUrl,
    };
  
    fetch(urls.fetchoriginaldrugs, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch original drugs');
        }
        return response.json();
      })
      .then(data => {
        const mappedDrugs = data.map(drug => ({
          ...drug,
          cost_price: parseFloat(drug.cost_price).toFixed(2),
          selling_price: parseFloat(drug.selling_price).toFixed(2),
          selling_price2: parseFloat(drug.selling_price2).toFixed(2),
        }));
        setOriginalDrugs(mappedDrugs);
      })
      .catch(error => {
        console.error('Error fetching original drugs:', error);
      });
  };
  
  const handleButtonClick = (action) => {
    setShowPrompt(action);
    setSupplier('');
  };

  const handleDrugChange = (index, field, value) => {
    const updatedDrugs = [...newDrugs];

    if (field === 'drug') {
      updatedDrugs[index][field] = value;

      const [selectedDrugName, selectedPackaging] = value.split(' - ');
      
      if (selectedDrugName && selectedPackaging) {
        const found = originalDrugs.find(d => 
          d.drug_name.trim() === selectedDrugName.trim() &&
          d.packaging.trim() === selectedPackaging.trim()
        );

        if (found) {
          updatedDrugs[index] = {
            ...updatedDrugs[index],
            drug_id: found.drug_id,
            drug: found.drug_name,
            packaging: found.packaging,
            costPrice: found.cost_price,
            sellingPrice: found.selling_price || '',
            sellingPrice2: found.selling_price2 || '',
          };
        }
      }
    } else {
      updatedDrugs[index][field] = value;
    }

    setNewDrugs(updatedDrugs);
  };

  const addNewRow = () => {
    if (newDrugs.length < 5) {
      setNewDrugs([...newDrugs, { drug: '', quantity: '', packaging: '', costPrice: '', sellingPrice: '', sellingPrice2: '' }]);
      setEditableDrugs([...editableDrugs, true]);
    } else {
      toast.warning('Maximum 5 rows allowed. Please insert the current data first to avoid data loss.');
    }
  };

  const removeRow = (index) => {
    if (newDrugs.length > 1) {
      const updatedDrugs = [...newDrugs];
      updatedDrugs.splice(index, 1);
      setNewDrugs(updatedDrugs);
    }
  };
  
  const handleInsertDrugs = () => {
    if (!supplier) {
      toast.error('Please enter the supplier name');
      return;
    }

    setInsertingDrugs(true);
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');

    const filteredDrugs = newDrugs.filter(drug => drug.drug && drug.quantity && drug.costPrice && drug.sellingPrice && drug.sellingPrice2);
  
    if (filteredDrugs.length === 0) {
      toast.error('Please fill in all required fields before submitting.');
      setInsertingDrugs(false);
      return;
    }

    const invalidDrugs = filteredDrugs.filter(drug => 
      !originalDrugs.some(originalDrug => 
        originalDrug.drug_name === drug.drug && originalDrug.packaging === drug.packaging
      )
    );
    
    if (invalidDrugs.length > 0) {
      toast.error('Some drugs do not exist in the facilitys scope. Contact an administrator.');
      setInsertingDrugs(false);
      return;
    }
  
    const abnormalCostPriceDrugs = filteredDrugs.filter(drug => {
      const originalDrug = originalDrugs.find(original => 
        original.drug_name === drug.drug && original.packaging === drug.packaging
      );
      if (originalDrug) {
        const originalCostPrice = parseFloat(originalDrug.cost_price);
        const insertedCostPrice = parseFloat(drug.costPrice);
        return (insertedCostPrice - originalCostPrice) > 1000;
      }
      return false;
    });
  
    if (abnormalCostPriceDrugs.length > 0) {
      const detailedMessage = abnormalCostPriceDrugs.map(drug => 
        `Drug Name: ${drug.drug}, Packaging: ${drug.packaging}, New Cost Price: ${drug.costPrice}`
      ).join('\n');
  
      const confirmMessage = `The new cost price of some drugs is abnormally high:\n\n${detailedMessage}\n\nAre you sure you want to proceed?`;
  
      if (!window.confirm(confirmMessage)) {
        setInsertingDrugs(false);
        return;
      }
    }
  
    const requestData = {
      token: tokenFromUrl,
      supplier: supplier,
      drugs: filteredDrugs.map(drug => ({
        drug_id: drug.drug_id,
        drug: drug.drug,
        quantity: drug.quantity,
        quantity_on_hand: Number(drug.quantity || 0),
        quantity_reserved: 0,
        packaging: drug.packaging,
        costPrice: drug.costPrice,
        sellingPrice: drug.sellingPrice,
        sellingPrice2: drug.sellingPrice2,
      }))
    };

    fetch(urls.insertdrugs, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to insert drugs');
      }
      return response.json();
    })
    .then(data => {
      toast.success('Drugs inserted successfully.');
      setShowPrompt('');
      setInsertionMessage('');
      setNewDrugs([{ 
        drug_id: '',
        drug: '', 
        quantity: '', 
        packaging: '', 
        costPrice: '', 
        sellingPrice: '', 
        sellingPrice2: '' 
      }]);
      setSupplier('');
      setEditableDrugs(newDrugs.map(() => true));
      setInsertingDrugs(false);
    })
    .catch(error => {
      toast.error('Drug insertion failed. Please check your network connectivity.');
      console.error('Error inserting drugs:', error);
      setInsertingDrugs(false);
    });
  };

  const handleCancelInsertion = () => {
    setShowPrompt('');
    setInsertionMessage('');
    setSupplier('');
  };

  const handleSearchMove = (e) => {
    e.stopPropagation();
    const value = e.target.value.slice(0, 10);
    setSearchQueryMove(value);
  };

  const handleSearchStock = (e) => {
    e.stopPropagation();
    setSearchQueryStock(e.target.value.slice(0, 10));
  };

  const filteredStockData = sortedStockData.filter(item => 
    item.Drug.toLowerCase().includes(searchQueryStock.toLowerCase())
  );

  const handleMoveDrugs = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');

    const invalidMove = Object.values(movedDrugs).some((drug) => {
      const stockDrug = sortedStockData.find(
        (stockItem) => stockItem.Drug === drug.drug && stockItem.Packaging === drug.packaging
      );
      if (stockDrug) {
        const availableQuantity = parseInt(stockDrug.Quantity, 10);
        const moveQuantity = parseInt(drug.quantity, 10);
        if (moveQuantity > availableQuantity) {
          toast.error(
            `Ooops! Check out this, you are trying to move ${moveQuantity} of ${drug.drug} but only ${availableQuantity} is available in stock.`,
            {
              position: "top-right",
              autoClose: 15000,
            }
          );
          return true;
        }
      } else {
        toast.error(
          `Drug ${drug.drug} with packaging ${drug.packaging} not found in stock data.`,
          {
            position: "top-right",
            autoClose: 10000,
          }
        );
        return true;
      }
      return false;
    });

    if (invalidMove) {
      return;
    }

    setMovingDrugsInProgress(true);

    const requestData = {
      token: tokenFromUrl,
      drugs: Object.values(movedDrugs).map((drug) => ({
        drug_id: drug.drug_id,
        drug: drug.drug,
        packaging: drug.packaging,
        quantity: drug.quantity,
        sellingPrice: drug.sellingPrice,
        sellingPrice2: drug.sellingPrice2,
      })),
    };

    fetch(urls.movedrugs, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to move drugs');
        }
        return response.json();
      })
      .then((data) => {
        setMovingDrugsInProgress(false);
        toast.success(
          <div>
            Drugs transferred to dispensing shelves successfully.
          </div>,
          {
            position: "top-right",
            autoClose: 10000,
          }
        );
        
        setMovedDrugs({});
        setShowPrompt('');
      })
      .catch((error) => {
        setMovingDrugsInProgress(false);
        toast.error('Failed to transfer drugs..', {
          position: "top-right",
          autoClose: 5000,
        });
        console.error('Error moving drugs:', error);
      });
  };

  const handleCancelMove = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPrompt('');
    setMovedDrugs({});
    setInsertionMessage('');
  };
  
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        
        const response = await fetch(urls.fetchSuppliers, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        
        const data = await response.json();
        const filteredSuppliers = data.suppliers
          .filter(supplier => 
            supplier && 
            supplier.trim() !== '' && 
            !supplier.toLowerCase().includes('no supplier provided')
          )
          .map(supplier => supplier.trim());
        setSuppliers(filteredSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    
    fetchSuppliers();
  }, []);

  const handleMoveQuantityChange = (drug, drugKey, e) => {
    e.stopPropagation();
    
    const value = e.target.value;
    const updatedMovedDrugs = { ...movedDrugs };
    
    if (value === "") {
      if (updatedMovedDrugs[drugKey]) {
        updatedMovedDrugs[drugKey] = {
          ...updatedMovedDrugs[drugKey],
          quantity: ""
        };
      }
    } else {
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity)) {
        if (newQuantity === 0) {
          if (updatedMovedDrugs[drugKey]) {
            delete updatedMovedDrugs[drugKey];
          }
        } else {
          if (!updatedMovedDrugs[drugKey]) {
            const originalDrug = originalDrugs.find(orig => 
              orig.drug_name === drug.Drug && orig.packaging === drug.Packaging
            );
            updatedMovedDrugs[drugKey] = {
              drug_id: originalDrug?.drug_id || null,
              drug: drug.Drug,
              packaging: drug.Packaging,
              quantity: newQuantity,
              sellingPrice: drug.Selling_Price,
              sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
            };
          } else {
            updatedMovedDrugs[drugKey] = {
              ...updatedMovedDrugs[drugKey],
              quantity: newQuantity,
            };
          }
        }
      }
    }
    
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleMoveCheckboxChange = (drug, drugKey, e) => {
    e.stopPropagation();
    
    const updatedMovedDrugs = { ...movedDrugs };
    if (e.target.checked) {
      const originalDrug = originalDrugs.find(orig => 
        orig.drug_name === drug.Drug && orig.packaging === drug.Packaging
      );
      
      updatedMovedDrugs[drugKey] = {
        drug_id: originalDrug?.drug_id || null,
        drug: drug.Drug,
        packaging: drug.Packaging,
        quantity: drug.Quantity,
        sellingPrice: drug.Selling_Price,
        sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
      };
    } else {
      delete updatedMovedDrugs[drugKey];
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleSellingPriceChange = (drug, drugKey, e) => {
    e.stopPropagation();
    
    const updatedMovedDrugs = { ...movedDrugs };
    if (updatedMovedDrugs[drugKey]) {
      updatedMovedDrugs[drugKey] = {
        ...updatedMovedDrugs[drugKey],
        sellingPrice: e.target.value,
      };
    }
    setMovedDrugs(updatedMovedDrugs);
  };

  const handleRemoveSelectedItem = (drug, drugKey, e) => {
    e.stopPropagation();
    
    const updatedMovedDrugs = { ...movedDrugs };
    if (drugKey) {
      delete updatedMovedDrugs[drugKey];
      setMovedDrugs(updatedMovedDrugs);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'UGX 0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'UGX 0';
    return `UGX ${Math.round(numValue).toLocaleString('en-UG')}`;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showPrompt === 'insertNewStock') {
        handleCancelInsertion();
      } else if (showPrompt === 'moveToShelves') {
        handleCancelMove(e);
      }
    }
  };

  const handleSidebarNavigation = (action) => {
    if (action === 'insertNewStock') {
      setShowInvoices(false);
      handleButtonClick('insertNewStock');
    } else if (action === 'moveToShelves') {
      setShowInvoices(false);
      handleButtonClick('moveToShelves');
    } else if (action === 'showInvoices') {
      setShowPrompt('');
      setShowInvoices(!showInvoices);
      if (!showInvoices) {
        fetchInvoices();
        fetchInvoiceSuppliers();
      }
    } else if (action === 'dashboard') {
      navigate(`/dashboard?token=${urlToken}`);
    } else if (action === 'lowStock') {
      setShowInvoices(false);
      setSearchQueryStock('');
      toast.info('Showing low stock items (Quantity < 10)');
    }
  };

  // Invoice Functions
  const fetchInvoiceSuppliers = async () => {
    setLoadingInvoiceSuppliers(true);
    try {
      const response = await fetch(urls.fetchSuppliers, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: urlToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      const filteredSuppliers = data.suppliers.filter(
        supplier => supplier && 
        supplier.trim() !== '' && 
        !supplier.toLowerCase().includes('no supplier provided')
      ).map(supplier => supplier.toUpperCase());
      setInvoiceSuppliers(filteredSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers list');
    } finally {
      setLoadingInvoiceSuppliers(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const requestBody = {
        token: urlToken,
        date: filterDate,
        ...(filterSupplier && { supplier: filterSupplier })
      };

      const response = await fetch(urls.fetchInvoices, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.records || []);
      setDisplayDate(data.date || filterDate);
    } catch (error) {
      toast.error('Failed to fetch invoices. Please try again.');
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceSearch = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleResetInvoiceFilters = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setFilterDate(currentDate);
    setFilterSupplier('');
    fetchInvoices();
  };

  const calculateInvoiceTotal = () => {
    return invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_cost || 0), 0).toFixed(2);
  };

  const calculateUnitCost = (totalCost, quantity) => {
    if (!quantity || quantity === 0) return '0.00';
    const unitCost = parseFloat(totalCost) / parseInt(quantity);
    return unitCost.toFixed(2);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.mainBg, 
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        .table-row:hover td { background: ${colors.tableRowHover}; }
        .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .card-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .close-btn:hover { background: ${colors.tableHeader}; }
        .drug-input:focus, input:focus, select:focus { border-color: ${colors.info} !important; outline: none; }
        .sidebar-button:hover { background: ${colors.navHoverBg}; }
        .modal-content input,
        .modal-content button,
        .modal-content select,
        .modal-content textarea {
          position: relative;
          z-index: 1001;
        }
      `}</style>
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Topbar token={urlToken} />

      {/* Main Layout with Sidebar */}
      <div style={{ display: 'flex', flex: 1, marginTop: '60px' }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          transition: 'width 0.3s ease',
          position: 'fixed',
          top: '60px',
          left: 0,
          bottom: 0,
          overflowY: 'auto',
          zIndex: 100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}>
          {/* Sidebar Header with Collapse Button */}
          <div style={{
            padding: '20px 16px',
            borderBottom: `1px solid ${colors.sidebarBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}>
            {!sidebarCollapsed && (
              <div style={{ color: colors.inactiveNavText, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Menu
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.sidebarBorder}`,
                color: colors.inactiveNavText,
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
            >
              <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faChevronLeft} />
            </button>
          </div>

          {/* Navigation Buttons */}
          <nav style={{ padding: '16px 12px' }}>
            {/* Insert New Stock */}
            <button
              onClick={() => handleSidebarNavigation('insertNewStock')}
              style={{
                ...styles.sidebarButton(showPrompt === 'insertNewStock'),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faPlus} style={{ color: iconColors.insert, fontSize: '18px' }} />
              {!sidebarCollapsed && <span>Insert New Stock</span>}
            </button>

            {/* Transfer to Shelves */}
            <button
              onClick={() => handleSidebarNavigation('moveToShelves')}
              style={{
                ...styles.sidebarButton(showPrompt === 'moveToShelves'),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faArrowRight} style={{ color: iconColors.transfer, fontSize: '18px' }} />
              {!sidebarCollapsed && <span>Transfer to Shelves</span>}
            </button>

            {/* Invoice History */}
            <button
              onClick={() => handleSidebarNavigation('showInvoices')}
              style={{
                ...styles.sidebarButton(showInvoices),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faFileInvoice} style={{ color: iconColors.invoice, fontSize: '18px' }} />
              {!sidebarCollapsed && <span>Invoice History</span>}
            </button>

            {/* Dashboard */}
            <button
              onClick={() => handleSidebarNavigation('dashboard')}
              style={{
                ...styles.sidebarButton(false),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faTachometerAlt} style={{ color: iconColors.dashboard, fontSize: '18px' }} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: colors.sidebarBorder,
              margin: '20px 12px',
            }} />

            {/* Quick Actions Section */}
            {!sidebarCollapsed && (
              <div style={{
                color: colors.sectionHeaderText,
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 12px',
                marginBottom: '12px',
              }}>
                QUICK ACTIONS
              </div>
            )}

            {/* Low Stock Alert */}
            <button
              onClick={() => handleSidebarNavigation('lowStock')}
              style={{
                ...styles.sidebarButton(false),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: iconColors.lowStock, fontSize: '18px' }} />
              {!sidebarCollapsed && (
                <>
                  <span>Low Stock Alert</span>
                  {lowStockCount > 0 && (
                    <span style={{
                      background: colors.danger,
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginLeft: 'auto',
                    }}>
                      {lowStockCount}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && lowStockCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  background: colors.danger,
                  borderRadius: '50%',
                }} />
              )}
            </button>

            {/* Warehouse Status */}
            <button
              onClick={() => toast.info('Warehouse status feature coming soon')}
              style={{
                ...styles.sidebarButton(false),
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              className="sidebar-button"
            >
              <FontAwesomeIcon icon={faWarehouse} style={{ color: iconColors.warehouse, fontSize: '18px' }} />
              {!sidebarCollapsed && <span>Warehouse Status</span>}
            </button>
          </nav>

          {/* Stock Worth Summary in Sidebar (when expanded) */}
          {!sidebarCollapsed && stockWorth !== null && (
            <div style={{
              padding: '16px',
              margin: '16px 12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              border: `1px solid ${colors.sidebarBorder}`,
            }}>
              <div style={{ color: colors.sectionHeaderText, fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>
                TOTAL STOCK WORTH
              </div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                {formatCurrency(stockWorth)}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content - with left margin to account for sidebar */}
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          transition: 'margin-left 0.3s ease',
          padding: '24px 32px',
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '28px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '4px'
              }}>
                <FontAwesomeIcon icon={faStore} style={{ color: colors.info }} />
                Store Management
              </h1>
              <p style={{ fontSize: '14px', color: colors.textMuted }}>
                {showInvoices 
                  ? 'View invoice history and transactions' 
                  : 'Manage your store inventory, insert new stock, and transfer drugs to shelves'}
              </p>
            </div>
            {!showInvoices && (
              <div style={{ 
                padding: '12px 20px', 
                background: colors.infoLight, 
                borderRadius: '12px',
                border: `1px solid ${colors.info}20`
              }}>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>Stock Worth</span>
                <div style={{ fontSize: '24px', fontWeight: '700', color: colors.info }}>
                  {formatCurrency(stockWorth)}
                </div>
              </div>
            )}
          </div>

          {/* Conditional Content: Stock Table or Invoices */}
          {!showInvoices ? (
            /* Stock Inventory Section */
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faBoxes} style={{ color: colors.info }} />
                Current Stock Inventory
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search drugs by name..."
                  value={searchQueryStock}
                  onChange={handleSearchStock}
                  style={{
                    ...styles.input,
                    maxWidth: '300px'
                  }}
                />
              </div>

              <div style={styles.tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Drug Name</th>
                      <th style={styles.th}>Quantity</th>
                      <th style={styles.th}>Packaging</th>
                      <th style={styles.th}>Cost Price</th>
                      <th style={styles.th}>Selling Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockData.map((item, index) => (
                      <tr key={index} className="table-row">
                        <td style={{ ...styles.td, fontWeight: '600' }}>{item.Drug}</td>
                        <td style={{ 
                          ...styles.td, 
                          fontWeight: '700',
                          color: item.Quantity < 10 ? colors.danger : colors.textPrimary,
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {item.Quantity}
                        </td>
                        <td style={{ ...styles.td, color: colors.textMuted }}>{item.Packaging}</td>
                        <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(item.Cost_Price)}
                        </td>
                        <td style={{ ...styles.td, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(item.Selling_Price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredStockData.length === 0 && (
                  <div style={{ padding: '48px', textAlign: 'center', color: colors.textMuted }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>No drugs found</div>
                    <div style={{ fontSize: '13px' }}>Try adjusting your search or add new drugs to inventory.</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Invoice History Section */
            <div style={styles.card}>
              <div style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faFileInvoice} style={{ color: colors.info }} />
                Invoice History
              </div>

              {/* Invoice Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                marginBottom: '20px',
                padding: '16px',
                background: colors.tableHeader,
                borderRadius: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '5px' }} /> 
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '600',
                   
                   
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    Filter by Supplier
                  </label>
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Suppliers</option>
                    {loadingInvoiceSuppliers ? (
                      <option value="" disabled>Loading suppliers...</option>
                    ) : (
                      invoiceSuppliers.map((supplier, index) => (
                        <option key={index} value={supplier}>
                          {supplier.length > 30 ? `${supplier.substring(0, 30)}...` : supplier}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                  <button 
                    onClick={handleInvoiceSearch}
                    style={{
                      ...styles.actionButton,
                      background: colors.info,
                      flex: 1
                    }}
                  >
                    <FontAwesomeIcon icon={faSearch} /> Search
                  </button>
                  
                  <button 
                    onClick={handleResetInvoiceFilters}
                    style={{
                      ...styles.secondaryButton,
                      flex: 1
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Invoice Summary */}
              <div style={{
                background: colors.infoLight,
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: colors.textSecondary }}>Showing: </span>
                  <span style={{ color: colors.textPrimary }}>
                    {displayDate}
                    {filterSupplier && ` - Supplier: ${filterSupplier}`}
                  </span>
                </div>
                <div style={{
                  background: colors.accentLight,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  color: colors.accent
                }}>
                  Total: UGX {calculateInvoiceTotal()}
                </div>
              </div>

              {/* Invoice Table */}
              {loadingInvoices ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px'
                }}>
                  <p>Loading invoices...</p>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Drug</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Packaging</th>
                        <th style={styles.th}>Unit Cost</th>
                        <th style={styles.th}>Total Cost</th>
                        <th style={styles.th}>Supplier</th>
                        <th style={styles.th}>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length > 0 ? (
                        invoices.map((invoice, index) => (
                          <tr key={index} className="table-row">
                            <td style={{ ...styles.td, fontWeight: '500' }}>{invoice.drug}</td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>{invoice.quantity}</td>
                            <td style={{ ...styles.td }}>{invoice.packaging}</td>
                            <td style={{ 
                              ...styles.td, 
                              textAlign: 'right',
                              color: colors.textSecondary
                            }}>
                              UGX {calculateUnitCost(invoice.total_cost, invoice.quantity)}
                            </td>
                            <td style={{ 
                              ...styles.td, 
                              textAlign: 'right',
                              color: colors.accent,
                              fontWeight: '600'
                            }}>
                              UGX {parseFloat(invoice.total_cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td style={{ 
                              ...styles.td, 
                              textTransform: 'uppercase',
                              fontSize: '12px'
                            }}>
                              {invoice.supplier || 'NO SUPPLIER PROVIDED'}
                            </td>
                            <td style={{ ...styles.td }}>{invoice.employee_name}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ 
                            padding: '40px',
                            textAlign: 'center',
                            color: colors.textMuted
                          }}>
                            No invoices found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Insert New Stock Modal */}
      {showPrompt === 'insertNewStock' && (
        <div style={styles.modalOverlay} onClick={handleOverlayClick}>
          <div 
            ref={modalContentRef}
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            className="modal-content"
          >
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>➕</span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>
                    Insert New Drugs
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textMuted }}>
                    Add new stock to the store inventory
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelInsertion}
                style={styles.closeButton}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Supplier Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: colors.textSecondary,
                  marginBottom: '8px'
                }}>
                  Supplier Name *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Type or select supplier"
                    list="suppliersList"
                    style={{ ...styles.input, flex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <datalist id="suppliersList">
                    {loadingSuppliers ? (
                      <option value="Loading suppliers..." disabled />
                    ) : suppliers.length > 0 ? (
                      suppliers.map((supplier, index) => (
                        <option key={index} value={supplier} />
                      ))
                    ) : (
                      <option value="No suppliers available" disabled />
                    )}
                  </datalist>
                  {suppliers.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setSupplier(e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        ...styles.select,
                        width: '150px'
                      }}
                    >
                      <option value="">Select</option>
                      {suppliers.map((supplier, index) => (
                        <option key={index} value={supplier}>
                          {supplier.length > 20 ? `${supplier.substring(0, 20)}...` : supplier}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Drugs Table */}
              <div style={styles.tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Drug</th>
                      <th style={styles.th}>Quantity</th>
                      <th style={styles.th}>Packaging</th>
                      <th style={styles.th}>Cost Price</th>
                      <th style={styles.th}>Selling Price</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newDrugs.map((drug, index) => (
                      <tr key={index}>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={drug.drug}
                            onChange={(e) => handleDrugChange(index, 'drug', e.target.value)}
                            list={`originalDrugsList-${index}`}
                            placeholder="Type drug name..."
                            autoComplete="off"
                            style={styles.input}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <datalist id={`originalDrugsList-${index}`}>
                            {originalDrugs.map((d, idx) => (
                              <option key={idx} value={`${d.drug_name} - ${d.packaging}`} />
                            ))}
                          </datalist>
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={drug.quantity}
                            onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                            style={{ ...styles.input, width: '100px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: colors.textMuted }}>{drug.packaging}</span>
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={drug.costPrice}
                            onChange={(e) => handleDrugChange(index, 'costPrice', e.target.value)}
                            style={{ ...styles.input, width: '120px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={drug.sellingPrice}
                            onChange={(e) => handleDrugChange(index, 'sellingPrice', e.target.value)}
                            style={{ ...styles.input, width: '120px' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={styles.td}>
                          {index === newDrugs.length - 1 && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addNewRow();
                                }}
                                style={{
                                  ...styles.actionButton,
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  background: colors.info
                                }}
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRow(index);
                                }}
                                style={{
                                  ...styles.secondaryButton,
                                  padding: '6px 12px',
                                  fontSize: '12px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCancelInsertion}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleInsertDrugs}
                disabled={insertingDrugs || !supplier}
                style={{
                  ...styles.actionButton,
                  opacity: (insertingDrugs || !supplier) ? 0.6 : 1,
                  cursor: (insertingDrugs || !supplier) ? 'not-allowed' : 'pointer'
                }}
              >
                {insertingDrugs ? 'Please wait...' : 'Insert Drugs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer to Shelves Modal */}
      {showPrompt === 'moveToShelves' && (
        <div style={styles.modalOverlay} onClick={handleOverlayClick}>
          <div 
            style={{ ...styles.modalContent, maxWidth: '1600px' }} 
            onClick={(e) => e.stopPropagation()}
            className="modal-content"
          >
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📦</span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>
                    Transfer Drugs to Shelves
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textMuted }}>
                    Select drugs to transfer from store to dispensing shelves
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelMove}
                style={styles.closeButton}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div style={{ ...styles.modalBody, display: 'flex', flexDirection: 'row', gap: '24px' }}>
              {/* Left Side - Selection Area */}
              <div style={{ flex: '2', minWidth: '0' }}>
                {/* Search */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search drugs to transfer..."
                    value={searchQueryMove}
                    onChange={handleSearchMove}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{
                      ...styles.input,
                      maxWidth: '300px'
                    }}
                  />
                </div>

                {/* Drugs Table */}
                <div style={styles.tableWrapper}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th} width="40px">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              e.stopPropagation();
                              const updatedMovedDrugs = e.target.checked
                                ? Object.fromEntries(
                                    sortedStockData
                                      .filter((drug) => drug.Quantity > 0)
                                      .map((drug) => {
                                        const originalDrug = originalDrugs.find(orig => 
                                          orig.drug_name === drug.Drug && orig.packaging === drug.Packaging
                                        );
                                        return [
                                          `${drug.Drug}-${drug.Packaging}`,
                                          {
                                            drug_id: originalDrug?.drug_id || null,
                                            drug: drug.Drug,
                                            packaging: drug.Packaging,
                                            quantity: drug.Quantity,
                                            sellingPrice: drug.Selling_Price,
                                            sellingPrice2: drug.Selling_Price2 || drug.Selling_Price,
                                          }
                                        ];
                                      })
                                  )
                                : {};
                              setMovedDrugs(updatedMovedDrugs);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                        <th style={styles.th}>Drug Name</th>
                        <th style={styles.th}>Packaging</th>
                        <th style={styles.th}>Available</th>
                        <th style={styles.th}>Quantity to Transfer</th>
                        <th style={styles.th}>Selling Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStockData
                        .filter((item) => item.Quantity > 0)
                        .filter(
                          (item) =>
                            searchQueryMove === "" ||
                            item.Drug.toLowerCase().includes(searchQueryMove.toLowerCase())
                        )
                        .map((drug, index) => {
                          const drugKey = `${drug.Drug}-${drug.Packaging}`;
                          const isSelected = !!movedDrugs[drugKey];
                          
                          return (
                            <tr key={index} className="table-row">
                              <td style={styles.td}>
                                <input
                                  type="checkbox"
                                  onChange={(e) => handleMoveCheckboxChange(drug, drugKey, e)}
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td style={{ ...styles.td, fontWeight: '600' }}>{drug.Drug}</td>
                              <td style={{ ...styles.td, color: colors.textMuted }}>{drug.Packaging}</td>
                              <td style={{ 
                                ...styles.td, 
                                fontWeight: '700',
                                color: drug.Quantity < 10 ? colors.danger : colors.textPrimary
                              }}>
                                {drug.Quantity}
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max={drug.Quantity}
                                  value={movedDrugs[drugKey]?.quantity !== undefined ? movedDrugs[drugKey].quantity : ""}
                                  onChange={(e) => handleMoveQuantityChange(drug, drugKey, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  style={{ ...styles.input, width: '100px' }}
                                  disabled={!isSelected}
                                  placeholder="Qty"
                                />
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={movedDrugs[drugKey]?.sellingPrice !== undefined ? movedDrugs[drugKey].sellingPrice : ""}
                                  onChange={(e) => handleSellingPriceChange(drug, drugKey, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  style={{ ...styles.input, width: '120px' }}
                                  disabled={!isSelected}
                                  placeholder="Price"
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side - Selected Drugs Summary */}
              {Object.values(movedDrugs).length > 0 && (
                <div style={{ 
                  flex: '1', 
                  minWidth: '300px',
                  background: colors.infoLight, 
                  borderRadius: '12px', 
                  padding: '20px',
                  border: `1px solid ${colors.info}20`,
                  height: 'fit-content',
                  position: 'sticky',
                  top: '24px'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: colors.textPrimary,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📋</span>
                    Selected Items ({Object.values(movedDrugs).length})
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}>
                    {Object.entries(movedDrugs).map(([drugKey, drug], index) => (
                      <div
                        key={index}
                        style={{
                          background: colors.cardBg,
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.cardBorder}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: '600', color: colors.textPrimary }}>{drug.drug}</div>
                          <button
                            onClick={(e) => handleRemoveSelectedItem(drug, drugKey, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: colors.textMuted,
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0 4px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                          <div>
                            <span style={{ color: colors.textMuted }}>Packaging: </span>
                            <span style={{ fontWeight: '500', color: colors.textSecondary }}>{drug.packaging}</span>
                          </div>
                          <div>
                            <span style={{ color: colors.textMuted }}>Qty: </span>
                            <span style={{ fontWeight: '600', color: colors.info }}>{drug.quantity}</span>
                          </div>
                          <div>
                            <span style={{ color: colors.textMuted }}>Price: </span>
                            <span style={{ fontWeight: '600', color: colors.accent }}>
                              {formatCurrency(drug.sellingPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: colors.cardBg,
                    borderRadius: '10px',
                    border: `1px solid ${colors.cardBorder}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: colors.textMuted }}>Total Items:</span>
                      <span style={{ fontWeight: '600' }}>{Object.values(movedDrugs).length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: colors.textMuted }}>Total Quantity:</span>
                      <span style={{ fontWeight: '600' }}>
                        {Object.values(movedDrugs).reduce((sum, drug) => sum + (parseInt(drug.quantity) || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCancelMove}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleMoveDrugs}
                disabled={movingDrugsInProgress || Object.values(movedDrugs).length === 0}
                style={{
                  ...styles.actionButton,
                  opacity: (movingDrugsInProgress || Object.values(movedDrugs).length === 0) ? 0.6 : 1,
                  cursor: (movingDrugsInProgress || Object.values(movedDrugs).length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {movingDrugsInProgress ? 'Please wait...' : 'Transfer Selected Drugs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginLeft: sidebarCollapsed ? '80px' : '280px',
        transition: 'margin-left 0.3s ease',
        padding: '20px 32px',
        borderTop: `1px solid ${colors.cardBorder}`,
        textAlign: 'center',
        fontSize: '12px',
        color: colors.textMuted
      }}>
        This system was created by MEDCORE Systems. For help or support contact +256752648844
      </footer>
    </div>
  );
}

export default Store;
