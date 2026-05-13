import React, { useState, useEffect, useRef } from 'react';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faInfoCircle, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme color definitions
const themes = {
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#3b82f6',
    primaryBg: '#eff6ff',
    success: '#10b981',
    successHover: '#059669',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    background: '#ffffff',
    cardBg: '#f9fafb',
    infoBg: '#f0f9ff',
    infoBorder: '#0ea5e9',
    infoText: '#0c4a6e',
    overlay: 'rgba(0, 0, 0, 0.6)',
    closeIcon: '#6b7280',
    closeIconHover: '#ef4444',
    tabInactive: '#6b7280',
    tabActive: '#2563eb',
    tabActiveBorder: '#3b82f6',
    tabHoverBg: '#f3f4f6',
    tabHoverText: '#4b5563',
    inputBorder: '#d1d5db',
    inputFocus: '#2563eb',
    disabled: '#9ca3af',
    unitCardBg: '#f9fafb',
    unitCardBorder: '#e5e7eb',
    addButtonBg: '#10b981',
    addButtonHover: '#059669',
  },
  white: {
    primary: '#1e293b',
    primaryHover: '#0f172a',
    primaryLight: '#334155',
    primaryBg: '#f8fafc',
    success: '#16a34a',
    successHover: '#15803d',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    warning: '#d97706',
    warningLight: '#fffbeb',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#475569',
    border: '#e2e8f0',
    background: '#ffffff',
    cardBg: '#f1f5f9',
    infoBg: '#f8fafc',
    infoBorder: '#cbd5e1',
    infoText: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.5)',
    closeIcon: '#64748b',
    closeIconHover: '#dc2626',
    tabInactive: '#475569',
    tabActive: '#0f172a',
    tabActiveBorder: '#0f172a',
    tabHoverBg: '#f1f5f9',
    tabHoverText: '#0f172a',
    inputBorder: '#cbd5e1',
    inputFocus: '#0f172a',
    disabled: '#94a3b8',
    unitCardBg: '#ffffff',
    unitCardBorder: '#e2e8f0',
    addButtonBg: '#16a34a',
    addButtonHover: '#15803d',
  }
};

// Stock item structure for a single batch
const createEmptyStockItem = () => ({
  quantity: 0,
  batchNumber: '',
  expiryDate: ''
});

// Helper to format date for display (YYYY-MM-DD for date input)
const formatDateForInput = (dateString) => {
  if (!dateString || dateString === '001/001/0001' || dateString === '01/01/0001') return '';
  // If it's already YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  // Try to parse other formats (e.g., DD/MM/YYYY)
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // Assume DD/MM/YYYY or YYYY/MM/DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    } else {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return '';
};

// Helper to format date for payload (DD/MM/YYYY or keep as is)
const formatDateForPayload = (dateString) => {
  if (!dateString) return '001/001/0001';
  // If it's YYYY-MM-DD, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

function UpdateStocksModal({ isOpen, onClose, selectedDrug, drugDetails, token, refreshDrugs, themeColor = 'blue' }) {
  // Normalize theme color (case insensitive)
  const normalizedTheme = (themeColor?.toLowerCase() === 'white' || themeColor?.toLowerCase() === 'null') ? 'white' : 'blue';
  const theme = themes[normalizedTheme];
  
  // Get batch number and expiry date settings from selectedDrug
  const useDrugBatchNumbers = selectedDrug?.use_drug_batch_numbers === 'yes';
  const useDrugExpiryDate = selectedDrug?.use_drug_expiry_date === 'yes';
  
  // Determine if batch/expiry features are active (for display logic)
  const isBatchOrExpiryActive = useDrugBatchNumbers || useDrugExpiryDate;
  
  // Use refs to track if initial data has been loaded
  const hasLoadedInitialData = useRef(false);
  const drugIdRef = useRef(null);
  
  // Log only when modal opens with new drug
  useEffect(() => {
    if (isOpen) {
      const drugData = selectedDrug || drugDetails;
      if (drugData?.drug_id && drugData.drug_id !== drugIdRef.current) {
        console.log('🔄 Modal opened with new drug:', drugData.drug_id);
        // Reset loaded flag when drug changes
        hasLoadedInitialData.current = false;
        drugIdRef.current = drugData.drug_id;
      }
    }
  }, [isOpen, selectedDrug, drugDetails]);

  const [activeTab, setActiveTab] = useState('details');
  
  // Store original drug details separately to track changes
  const [originalDrugDetails, setOriginalDrugDetails] = useState(null);
  
  const [drugDetailsState, setDrugDetailsState] = useState({
    drugId: '',
    drugName: '',
    packaging: '',
    warningPoint: '',
    costPrice: '',
    sellingPrice: '',
    additionalInfo: '',
  });
  
  // Stock items with batch numbers and expiry dates (for active mode)
  const [dispensaryStockItems, setDispensaryStockItems] = useState([createEmptyStockItem()]);
  const [storeStockItems, setStoreStockItems] = useState([createEmptyStockItem()]);
  const [originalDispensaryStockItems, setOriginalDispensaryStockItems] = useState([]);
  const [originalStoreStockItems, setOriginalStoreStockItems] = useState([]);
  
  // Simple total stock for display (when batch/expiry features are inactive)
  const [simpleDispensaryStock, setSimpleDispensaryStock] = useState(0);
  const [simpleStoreStock, setSimpleStoreStock] = useState(0);
  const [originalSimpleDispensaryStock, setOriginalSimpleDispensaryStock] = useState(0);
  const [originalSimpleStoreStock, setOriginalSimpleStoreStock] = useState(0);
  
  const [prescriptionUnits, setPrescriptionUnits] = useState([]);
  const [originalPrescriptionUnits, setOriginalPrescriptionUnits] = useState([]);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isUpdatingPrescription, setIsUpdatingPrescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  // Define available units for prescription
  const availableUnits = [
    "mg", "g", "ml", "L", "mcg", "IU", "tablet(s)", "capsule(s)", 
    "ampule(s)", "vial(s)", "drop(s)", "patch(es)", "inhalation(s)",
    "suppository(ies)", "pessar(y/ies)", "sachet(s)", "strip(s)", 
    "piece(s)", "roll(s)", "bottle(s)", "syringe(s)", "unit(s)"
  ];

  // Calculate total stock from items
  const getTotalDispensaryStock = () => {
    if (isBatchOrExpiryActive) {
      return dispensaryStockItems.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
    }
    return simpleDispensaryStock;
  };

  const getTotalStoreStock = () => {
    if (isBatchOrExpiryActive) {
      return storeStockItems.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
    }
    return simpleStoreStock;
  };

  // Add new stock item row
  const addDispensaryStockItem = () => {
    setDispensaryStockItems([...dispensaryStockItems, createEmptyStockItem()]);
  };

  const addStoreStockItem = () => {
    setStoreStockItems([...storeStockItems, createEmptyStockItem()]);
  };

  // Remove stock item row
  const removeDispensaryStockItem = (index) => {
    if (dispensaryStockItems.length <= 1) {
      toast.warning('At least one stock entry is required');
      return;
    }
    const updated = [...dispensaryStockItems];
    updated.splice(index, 1);
    setDispensaryStockItems(updated);
  };

  const removeStoreStockItem = (index) => {
    if (storeStockItems.length <= 1) {
      toast.warning('At least one stock entry is required');
      return;
    }
    const updated = [...storeStockItems];
    updated.splice(index, 1);
    setStoreStockItems(updated);
  };

  // Update stock item
  const updateDispensaryStockItem = (index, field, value) => {
    const updated = [...dispensaryStockItems];
    updated[index][field] = value;
    setDispensaryStockItems(updated);
  };

  const updateStoreStockItem = (index, field, value) => {
    const updated = [...storeStockItems];
    updated[index][field] = value;
    setStoreStockItems(updated);
  };

  // Load initial data only once when modal opens with a new drug
  useEffect(() => {
    const drugData = selectedDrug || drugDetails;
    
    // Only load if modal is open, we have drug data, and we haven't loaded initial data for this drug
    if (isOpen && drugData && !hasLoadedInitialData.current) {
      console.log('📦 Loading initial data for drug:', drugData.drug_id);
      
      // Set drug details from props
      const newDrugDetails = {
        drugId: drugData.drug_id || drugData.drugId || '',
        drugName: drugData.drug_name || drugData.drugName || '',
        packaging: drugData.packaging || '',
        warningPoint: drugData.warning_point || drugData.warningPoint || '',
        costPrice: drugData.cost_price || drugData.costPrice || '',
        sellingPrice: drugData.selling_price || drugData.sellingPrice || '0',
        additionalInfo: drugData.additional_info || drugData.additionalInfo || '',
      };
      
      setDrugDetailsState(newDrugDetails);
      setOriginalDrugDetails(newDrugDetails);
      
      // Fetch drug quantities
      fetchDrugQuantities(drugData);
      
      // Fetch prescription details
      fetchPrescriptionDetails(drugData);
      
      // Mark as loaded
      hasLoadedInitialData.current = true;
    }
    
    // Reset loaded flag when modal closes
    if (!isOpen) {
      hasLoadedInitialData.current = false;
      drugIdRef.current = null;
      setOriginalDrugDetails(null);
      setDispensaryStockItems([createEmptyStockItem()]);
      setStoreStockItems([createEmptyStockItem()]);
      setSimpleDispensaryStock(0);
      setSimpleStoreStock(0);
      setOriginalDispensaryStockItems([]);
      setOriginalStoreStockItems([]);
    }
  }, [isOpen, selectedDrug, drugDetails]);

  const fetchDrugQuantities = (drugData) => {
    setIsLoading(true);
    
    console.log('🔍 Fetching drug quantities for drug_id:', drugData.drug_id);
    
    // Include the state of expiry date and batch numbers in the payload
    const payload = {
      drugId: drugData.drug_id,
      drugName: drugData.drug_name || drugData.drugName,
      packaging: drugData.packaging,
      token,
      useBatchNumbers: useDrugBatchNumbers,
      useExpiryDate: useDrugExpiryDate,
      batchNumbersEnabled: useDrugBatchNumbers,
      expiryDateEnabled: useDrugExpiryDate
    };
    
    console.log('📤 Fetching quantities with payload:', payload);
    
    fetch(urls.fetchdrugquantity, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('✅ Drug quantities received:', data);
        
        // Check if the response indicates batch/expiry mode (has dispensaryStock array)
        const hasBatchStock = data.dispensaryStock && Array.isArray(data.dispensaryStock);
        
        if (hasBatchStock) {
          // Mode: Batch/Expiry active - response has arrays
          console.log('📦 Batch/Expiry mode detected - processing stock arrays');
          
          // Process dispensary stock
          if (data.dispensaryStock && data.dispensaryStock.length > 0) {
            const formattedItems = data.dispensaryStock.map(item => ({
              quantity: item.quantity || 0,
              batchNumber: item.batch_number || '',
              expiryDate: item.expiry_date || ''
            }));
            setDispensaryStockItems(formattedItems);
            setOriginalDispensaryStockItems(JSON.parse(JSON.stringify(formattedItems)));
          } else {
            setDispensaryStockItems([createEmptyStockItem()]);
            setOriginalDispensaryStockItems([createEmptyStockItem()]);
          }
          
          // Process store stock
          if (data.storeStock && Array.isArray(data.storeStock) && data.storeStock.length > 0) {
            const formattedItems = data.storeStock.map(item => ({
              quantity: item.quantity || 0,
              batchNumber: item.batch_number || '',
              expiryDate: item.expiry_date || ''
            }));
            setStoreStockItems(formattedItems);
            setOriginalStoreStockItems(JSON.parse(JSON.stringify(formattedItems)));
          } else {
            setStoreStockItems([createEmptyStockItem()]);
            setOriginalStoreStockItems([createEmptyStockItem()]);
          }
        } else {
          // Mode: Batch/Expiry inactive - response has simple numbers
          console.log('📦 Simple stock mode detected - processing totals');
          const dispensary = data.dispensaryStock || 0;
          const store = data.storeStock || 0;
          setSimpleDispensaryStock(dispensary);
          setSimpleStoreStock(store);
          setOriginalSimpleDispensaryStock(dispensary);
          setOriginalSimpleStoreStock(store);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('❌ Error fetching drug quantities:', error);
        toast.error('Error fetching drug quantities: ' + error.message);
        setIsLoading(false);
      });
  };

  const fetchPrescriptionDetails = (drugData) => {
    setIsLoadingPrescription(true);
    
    console.log('🔍 Fetching prescription details for drug_id:', drugData.drug_id);
    
    const payload = {
      drugId: drugData.drug_id,
      drugName: drugData.drug_name || drugData.drugName,
      packaging: drugData.packaging,
      token,
      useBatchNumbers: useDrugBatchNumbers,
      useExpiryDate: useDrugExpiryDate,
      batchNumbersEnabled: useDrugBatchNumbers,
      expiryDateEnabled: useDrugExpiryDate
    };
    
    console.log('📤 Fetching prescription details with payload:', payload);
    
    fetch(urls.getprescriptiondetails, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('✅ Prescription details received:', data);
        
        let units = [];
        
        if (data.success) {
          // Update additional info if available
          if (data.additionalInfo) {
            setDrugDetailsState(prev => ({
              ...prev,
              additionalInfo: data.additionalInfo
            }));
          }
          
          // Handle the new response format with unitDetails array
          if (data.unitDetails && Array.isArray(data.unitDetails)) {
            units = data.unitDetails;
          } 
          // Handle old single unit format for backward compatibility
          else if (data.prescription_unit) {
            units = [{
              prescriptionUnit: data.prescription_unit,
              unitsPerPackaging: data.units_per_packaging,
            }];
          }
        }
        
        // If no units found, initialize with empty unit
        if (units.length === 0) {
          units = [{
            prescriptionUnit: '',
            unitsPerPackaging: '',
          }];
        }
        
        setPrescriptionUnits(units);
        setOriginalPrescriptionUnits(JSON.parse(JSON.stringify(units))); // Deep copy
        setIsLoadingPrescription(false);
      })
      .catch((error) => {
        console.error('❌ Error fetching prescription details:', error);
        toast.error('Error fetching prescription details: ' + error.message);
        
        // Initialize with empty unit on error
        const defaultUnits = [{
          prescriptionUnit: '',
          unitsPerPackaging: '',
        }];
        setPrescriptionUnits(defaultUnits);
        setOriginalPrescriptionUnits(JSON.parse(JSON.stringify(defaultUnits)));
        setIsLoadingPrescription(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDrugDetailsState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handlePrescriptionUnitChange = (index, field, value) => {
    const updatedUnits = [...prescriptionUnits];
    updatedUnits[index][field] = value;
    setPrescriptionUnits(updatedUnits);
  };

  const addPrescriptionUnit = () => {
    setPrescriptionUnits([...prescriptionUnits, {
      prescriptionUnit: '',
      unitsPerPackaging: '',
    }]);
  };

  const removePrescriptionUnit = (index) => {
    if (prescriptionUnits.length <= 1) {
      toast.error('At least one prescription unit is required');
      return;
    }
    const updatedUnits = [...prescriptionUnits];
    updatedUnits.splice(index, 1);
    setPrescriptionUnits(updatedUnits);
  };

  const handleUpdateDrug = () => {
    setIsUpdating(true);

    if (
      !drugDetailsState.drugName ||
      !drugDetailsState.packaging ||
      !drugDetailsState.warningPoint ||
      !drugDetailsState.costPrice ||
      !drugDetailsState.sellingPrice
    ) {
      toast.error('Please fill in all fields.');
      setIsUpdating(false);
      return;
    }

    const drugData = selectedDrug || drugDetails;
    
    const payload = {
      drugId: drugDetailsState.drugId,
      oldDetails: {
        drugName: drugData.drug_name || drugData.drugName,
        packaging: drugData.packaging,
        warningPoint: drugData.warning_point || drugData.warningPoint,
        costPrice: drugData.cost_price || drugData.costPrice,
        sellingPrice: drugData.selling_price || drugData.sellingPrice || '0',
      },
      newDetails: { 
        ...drugDetailsState,
        sellingPrice: drugDetailsState.sellingPrice || '0' 
      },
      token,
      useBatchNumbers: useDrugBatchNumbers,
      useExpiryDate: useDrugExpiryDate,
    };

    console.log('📤 Updating drug details with payload:', payload);

    fetch(urls.updatedrugdetails, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast.success('Drug details updated successfully!');
          setOriginalDrugDetails({ ...drugDetailsState });
          refreshDrugs();
        } else {
          toast.error(`Error: ${data.message || 'Failed to update drug details'}`);
        }
      })
      .catch((error) => {
        console.error('❌ Error updating drug details:', error);
        toast.error('An unexpected error occurred. Please try again later.');
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleUpdateStock = () => {
    setIsUpdatingStock(true);
  
    let payload;
    
    if (isBatchOrExpiryActive) {
      // Prepare batch stock data - filter out empty rows (quantity > 0 or has batch/expiry info)
      const filteredDispensaryItems = dispensaryStockItems.filter(
        item => item.quantity && parseInt(item.quantity) > 0
      );
      const filteredStoreItems = storeStockItems.filter(
        item => item.quantity && parseInt(item.quantity) > 0
      );
      
      // If no items with quantity, add at least one empty entry
      const dispensaryItemsToSend = filteredDispensaryItems.length > 0 ? filteredDispensaryItems : [createEmptyStockItem()];
      const storeItemsToSend = filteredStoreItems.length > 0 ? filteredStoreItems : [createEmptyStockItem()];
      
      payload = {
        drugId: drugDetailsState.drugId,
        drugName: drugDetailsState.drugName,
        packaging: drugDetailsState.packaging,
        token,
        costPrice: drugDetailsState.costPrice,
        sellingPrice: drugDetailsState.sellingPrice || '0',
        useBatchNumbers: useDrugBatchNumbers,
        useExpiryDate: useDrugExpiryDate,
        batchNumbersEnabled: useDrugBatchNumbers,
        expiryDateEnabled: useDrugExpiryDate,
        dispensaryStockItems: dispensaryItemsToSend.map(item => ({
          quantity: parseInt(item.quantity) || 0,
          batchNumber: item.batchNumber || '0000',
          expiryDate: formatDateForPayload(item.expiryDate) || '001/001/0001'
        })),
        storeStockItems: storeItemsToSend.map(item => ({
          quantity: parseInt(item.quantity) || 0,
          batchNumber: item.batchNumber || '0000',
          expiryDate: formatDateForPayload(item.expiryDate) || '001/001/0001'
        }))
      };
    } else {
      // Simple stock mode - only change the figures
      payload = {
        drugId: drugDetailsState.drugId,
        drugName: drugDetailsState.drugName,
        packaging: drugDetailsState.packaging,
        token,
        dispensaryStock: simpleDispensaryStock,
        storeStock: simpleStoreStock,
        costPrice: drugDetailsState.costPrice,
        sellingPrice: drugDetailsState.sellingPrice || '0',
        useBatchNumbers: useDrugBatchNumbers,
        useExpiryDate: useDrugExpiryDate,
        batchNumbersEnabled: useDrugBatchNumbers,
        expiryDateEnabled: useDrugExpiryDate,
      };
    }

    console.log('📤 Updating stock with payload:', payload);

    const endpoint = isBatchOrExpiryActive ? urls.updatestockfiguresbatch : urls.updatestockfigures;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast.success('Stock figures updated successfully!');
          
          if (isBatchOrExpiryActive) {
            setOriginalDispensaryStockItems(JSON.parse(JSON.stringify(dispensaryStockItems)));
            setOriginalStoreStockItems(JSON.parse(JSON.stringify(storeStockItems)));
          } else {
            setOriginalSimpleDispensaryStock(simpleDispensaryStock);
            setOriginalSimpleStoreStock(simpleStoreStock);
          }
          refreshDrugs();
        } else {
          toast.error(`Error: ${data.message || 'Failed to update stock figures'}`);
        }
      })
      .catch((error) => {
        console.error('❌ Error updating stock:', error);
        toast.error('An unexpected error occurred. Please try again later.');
      })
      .finally(() => {
        setIsUpdatingStock(false);
      });
  };

  const handleUpdatePrescription = () => {
    setIsUpdatingPrescription(true);

    // Validate all units
    for (let i = 0; i < prescriptionUnits.length; i++) {
      const unit = prescriptionUnits[i];
      if (!unit.prescriptionUnit || !unit.unitsPerPackaging) {
        toast.error(`Please complete all fields for unit ${i + 1}`);
        setIsUpdatingPrescription(false);
        return;
      }
    }

    const payload = {
      drugId: drugDetailsState.drugId,
      drugName: drugDetailsState.drugName,
      packaging: drugDetailsState.packaging,
      units: prescriptionUnits,
      additionalInfo: drugDetailsState.additionalInfo,
      token,
      useBatchNumbers: useDrugBatchNumbers,
      useExpiryDate: useDrugExpiryDate,
      batchNumbersEnabled: useDrugBatchNumbers,
      expiryDateEnabled: useDrugExpiryDate,
    };

    console.log('📤 Updating prescription settings with payload:', payload);

    fetch(urls.setprescriptiondetails, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast.success('Prescription settings updated successfully!');
          setOriginalPrescriptionUnits(JSON.parse(JSON.stringify(prescriptionUnits)));
        } else {
          toast.error(`Error: ${data.message || 'Failed to update prescription settings'}`);
        }
      })
      .catch((error) => {
        console.error('❌ Error updating prescription settings:', error);
        toast.error('An unexpected error occurred. Please try again later.');
      })
      .finally(() => {
        setIsUpdatingPrescription(false);
      });
  };

  const isDetailsChanged = () => {
    if (!originalDrugDetails) return false;
    
    return (
      drugDetailsState.drugName !== originalDrugDetails.drugName ||
      drugDetailsState.packaging !== originalDrugDetails.packaging ||
      drugDetailsState.warningPoint !== originalDrugDetails.warningPoint ||
      drugDetailsState.costPrice !== originalDrugDetails.costPrice ||
      drugDetailsState.sellingPrice !== originalDrugDetails.sellingPrice ||
      drugDetailsState.additionalInfo !== originalDrugDetails.additionalInfo
    );
  };

  const isStockChanged = () => {
    if (isBatchOrExpiryActive) {
      if (dispensaryStockItems.length !== originalDispensaryStockItems.length) return true;
      if (storeStockItems.length !== originalStoreStockItems.length) return true;
      
      const dispensaryChanged = dispensaryStockItems.some((item, idx) => {
        const original = originalDispensaryStockItems[idx] || {};
        return parseInt(item.quantity) !== parseInt(original.quantity) || 
               item.batchNumber !== original.batchNumber || 
               item.expiryDate !== original.expiryDate;
      });
      
      const storeChanged = storeStockItems.some((item, idx) => {
        const original = originalStoreStockItems[idx] || {};
        return parseInt(item.quantity) !== parseInt(original.quantity) || 
               item.batchNumber !== original.batchNumber || 
               item.expiryDate !== original.expiryDate;
      });
      
      return dispensaryChanged || storeChanged;
    } else {
      return simpleDispensaryStock !== originalSimpleDispensaryStock ||
             simpleStoreStock !== originalSimpleStoreStock;
    }
  };

  const isPrescriptionChanged = () => {
    if (prescriptionUnits.length !== originalPrescriptionUnits.length) return true;
    
    return prescriptionUnits.some((unit, index) => {
      const originalUnit = originalPrescriptionUnits[index] || {};
      return (
        unit.prescriptionUnit !== originalUnit.prescriptionUnit ||
        unit.unitsPerPackaging !== originalUnit.unitsPerPackaging
      );
    });
  };

  if (!isOpen) return null;

  // Dynamic styles based on theme
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: theme.background,
    borderRadius: '12px',
    maxWidth: '950px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '25px',
    boxShadow: normalizedTheme === 'blue' 
      ? '0 10px 30px rgba(37, 99, 235, 0.25)' 
      : '0 10px 30px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const closeIconStyle = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    cursor: 'pointer',
    color: theme.closeIcon,
    fontSize: '1.5rem',
    transition: 'color 0.2s ease',
  };

  const tabStyle = {
    display: 'flex',
    marginBottom: '25px',
    borderBottom: `1px solid ${theme.border}`,
    paddingBottom: '2px',
  };

  const tabButtonStyle = {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderBottom: `3px solid transparent`,
    marginRight: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: theme.tabInactive,
    transition: 'all 0.2s ease',
    borderRadius: '6px 6px 0 0',
  };

  const activeTabButtonStyle = {
    ...tabButtonStyle,
    borderBottom: `3px solid ${theme.tabActiveBorder}`,
    color: theme.tabActive,
    fontWeight: '600',
    backgroundColor: theme.primaryBg,
  };

  const formGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: theme.textSecondary,
    fontWeight: '500',
    fontSize: '14px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontSize: '14px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
  };

  const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: theme.disabled,
    marginBottom: '10px',
    transition: 'background-color 0.2s ease',
    fontSize: '14px',
    fontWeight: '500',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.primary,
  };

  const infoTextStyle = {
    backgroundColor: theme.infoBg,
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    color: theme.infoText,
    borderLeft: `4px solid ${theme.infoBorder}`,
  };

  const stockCardStyle = {
    backgroundColor: theme.unitCardBg,
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: `1px solid ${theme.unitCardBorder}`,
    position: 'relative',
  };

  const prescriptionCardStyle = {
    backgroundColor: theme.unitCardBg,
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: `1px solid ${theme.unitCardBorder}`,
    position: 'relative',
  };

  const removeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    color: theme.danger,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'color 0.2s ease',
  };

  const addButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 15px',
    backgroundColor: theme.addButtonBg,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  };

  const batchInfoBadgeStyle = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '15px',
    backgroundColor: theme.primaryBg,
    color: theme.primary,
    border: `1px solid ${theme.primaryLight}`,
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <FontAwesomeIcon
          icon={faTimes}
          style={closeIconStyle}
          onClick={onClose}
          onMouseOver={(e) => e.target.style.color = theme.closeIconHover}
          onMouseOut={(e) => e.target.style.color = theme.closeIcon}
        />
        <h2 style={{ color: theme.textPrimary, marginBottom: '25px', fontSize: '24px', fontWeight: '600' }}>
          Update Drug Settings
        </h2>
        
        {/* Hidden field to display drug_id for debugging */}
        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '10px', textAlign: 'right' }}>
          Drug ID: {drugDetailsState.drugId || 'N/A'}
        </div>
        
        {/* Batch/Expiry Info Badge */}
        {isBatchOrExpiryActive && (
          <div style={batchInfoBadgeStyle}>
            {useDrugBatchNumbers && useDrugExpiryDate && '📦 Batch Numbers + Expiry Dates Active'}
            {useDrugBatchNumbers && !useDrugExpiryDate && '📦 Batch Numbers Active'}
            {!useDrugBatchNumbers && useDrugExpiryDate && '📅 Expiry Dates Active'}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div style={tabStyle}>
          <button
            style={activeTab === 'details' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => setActiveTab('details')}
            onMouseOver={(e) => {
              if (activeTab !== 'details') {
                e.target.style.backgroundColor = theme.tabHoverBg;
                e.target.style.color = theme.tabHoverText;
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'details') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.tabInactive;
              }
            }}
          >
            Drug Details
          </button>
          <button
            style={activeTab === 'stock' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => setActiveTab('stock')}
            onMouseOver={(e) => {
              if (activeTab !== 'stock') {
                e.target.style.backgroundColor = theme.tabHoverBg;
                e.target.style.color = theme.tabHoverText;
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'stock') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.tabInactive;
              }
            }}
          >
            Stock Management
          </button>
          <button
            style={activeTab === 'prescription' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => setActiveTab('prescription')}
            onMouseOver={(e) => {
              if (activeTab !== 'prescription') {
                e.target.style.backgroundColor = theme.tabHoverBg;
                e.target.style.color = theme.tabHoverText;
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'prescription') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.tabInactive;
              }
            }}
          >
            Prescription Settings
          </button>
        </div>

        {isLoading && (activeTab === 'details' || activeTab === 'stock') ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: theme.primary }} />
          </div>
        ) : (
          <>
            {activeTab === 'details' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={formGroupStyle}>
                    <label htmlFor="drugName" style={labelStyle}>Drug Name</label>
                    <input
                      type="text"
                      id="drugName"
                      name="drugName"
                      style={inputStyle}
                      placeholder="Drug Name"
                      value={drugDetailsState.drugName}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                      onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label htmlFor="packaging" style={labelStyle}>Packaging</label>
                    <select
                      id="packaging"
                      name="packaging"
                      style={inputStyle}
                      value={drugDetailsState.packaging}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                      onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
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
                  <div style={formGroupStyle}>
                    <label htmlFor="warningPoint" style={labelStyle}>Minimum Stock Level</label>
                    <input
                      type="number"
                      id="warningPoint"
                      name="warningPoint"
                      style={inputStyle}
                      placeholder="Warning Point"
                      value={drugDetailsState.warningPoint}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                      onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label htmlFor="costPrice" style={labelStyle}>Cost Price</label>
                    <input
                      type="number"
                      id="costPrice"
                      name="costPrice"
                      style={inputStyle}
                      placeholder="Cost Price"
                      value={drugDetailsState.costPrice}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                      onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label htmlFor="sellingPrice" style={labelStyle}>Selling Price</label>
                    <input
                      type="number"
                      id="sellingPrice"
                      name="sellingPrice"
                      style={inputStyle}
                      placeholder="Selling Price"
                      value={drugDetailsState.sellingPrice}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                      onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={handleUpdateDrug}
                    disabled={!isDetailsChanged() || isUpdating}
                    style={!isDetailsChanged() ? buttonStyle : activeButtonStyle}
                    onMouseOver={(e) => {
                      if (isDetailsChanged() && !isUpdating) {
                        e.target.style.backgroundColor = theme.primaryHover;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (isDetailsChanged() && !isUpdating) {
                        e.target.style.backgroundColor = theme.primary;
                      }
                    }}
                  >
                    {isUpdating ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Update Drug Details'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'stock' && (
              <>
                {/* Pharmacy Stock Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: theme.textPrimary, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                    💊 Pharmacy Stock
                  </h3>
                  
                  {isBatchOrExpiryActive ? (
                    <>
                      {dispensaryStockItems.map((item, index) => (
                        <div key={index} style={stockCardStyle}>
                          <FontAwesomeIcon 
                            icon={faTrash} 
                            style={removeButtonStyle} 
                            onClick={() => removeDispensaryStockItem(index)}
                            title="Remove this stock entry"
                            onMouseOver={(e) => e.target.style.color = theme.dangerHover}
                            onMouseOut={(e) => e.target.style.color = theme.danger}
                          />
                          
                          <div style={{ display: 'grid', gridTemplateColumns: useDrugBatchNumbers && useDrugExpiryDate ? '1fr 1fr 1fr' : (useDrugBatchNumbers || useDrugExpiryDate ? '1fr 1fr' : '1fr'), gap: '15px' }}>
                            <div style={formGroupStyle}>
                              <label style={labelStyle}>Quantity *</label>
                              <input
                                type="number"
                                style={inputStyle}
                                placeholder="Quantity"
                                value={item.quantity}
                                onChange={(e) => updateDispensaryStockItem(index, 'quantity', e.target.value)}
                                onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                              />
                            </div>
                            
                            {useDrugBatchNumbers && (
                              <div style={formGroupStyle}>
                                <label style={labelStyle}>Batch Number</label>
                                <input
                                  type="text"
                                  style={inputStyle}
                                  placeholder="Batch Number"
                                  value={item.batchNumber === '0000' ? '' : item.batchNumber}
                                  onChange={(e) => updateDispensaryStockItem(index, 'batchNumber', e.target.value || '')}
                                  onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                  onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                                />
                              </div>
                            )}
                            
                            {useDrugExpiryDate && (
                              <div style={formGroupStyle}>
                                <label style={labelStyle}>Expiry Date</label>
                                <input
                                  type="date"
                                  style={inputStyle}
                                  value={formatDateForInput(item.expiryDate)}
                                  onChange={(e) => updateDispensaryStockItem(index, 'expiryDate', e.target.value || '')}
                                  onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                  onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        style={addButtonStyle} 
                        onClick={addDispensaryStockItem}
                        onMouseOver={(e) => e.target.style.backgroundColor = theme.addButtonHover}
                        onMouseOut={(e) => e.target.style.backgroundColor = theme.addButtonBg}
                      >
                        <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                        Add Pharmacy Stock Row
                      </button>
                    </>
                  ) : (
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Pharmacy Stock Quantity</label>
                      <input
                        type="number"
                        style={inputStyle}
                        value={simpleDispensaryStock}
                        onChange={(e) => setSimpleDispensaryStock(parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                        onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                      />
                    </div>
                  )}
                </div>

                {/* Store Stock Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: theme.textPrimary, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                    🏪 Store / Shelves Stock
                  </h3>
                  
                  {isBatchOrExpiryActive ? (
                    <>
                      {storeStockItems.map((item, index) => (
                        <div key={index} style={stockCardStyle}>
                          <FontAwesomeIcon 
                            icon={faTrash} 
                            style={removeButtonStyle} 
                            onClick={() => removeStoreStockItem(index)}
                            title="Remove this stock entry"
                            onMouseOver={(e) => e.target.style.color = theme.dangerHover}
                            onMouseOut={(e) => e.target.style.color = theme.danger}
                          />
                          
                          <div style={{ display: 'grid', gridTemplateColumns: useDrugBatchNumbers && useDrugExpiryDate ? '1fr 1fr 1fr' : (useDrugBatchNumbers || useDrugExpiryDate ? '1fr 1fr' : '1fr'), gap: '15px' }}>
                            <div style={formGroupStyle}>
                              <label style={labelStyle}>Quantity *</label>
                              <input
                                type="number"
                                style={inputStyle}
                                placeholder="Quantity"
                                value={item.quantity}
                                onChange={(e) => updateStoreStockItem(index, 'quantity', e.target.value)}
                                onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                              />
                            </div>
                            
                            {useDrugBatchNumbers && (
                              <div style={formGroupStyle}>
                                <label style={labelStyle}>Batch Number</label>
                                <input
                                  type="text"
                                  style={inputStyle}
                                  placeholder="Batch Number"
                                  value={item.batchNumber === '0000' ? '' : item.batchNumber}
                                  onChange={(e) => updateStoreStockItem(index, 'batchNumber', e.target.value || '')}
                                  onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                  onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                                />
                              </div>
                            )}
                            
                            {useDrugExpiryDate && (
                              <div style={formGroupStyle}>
                                <label style={labelStyle}>Expiry Date</label>
                                <input
                                  type="date"
                                  style={inputStyle}
                                  value={formatDateForInput(item.expiryDate)}
                                  onChange={(e) => updateStoreStockItem(index, 'expiryDate', e.target.value || '')}
                                  onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                                  onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        style={addButtonStyle} 
                        onClick={addStoreStockItem}
                        onMouseOver={(e) => e.target.style.backgroundColor = theme.addButtonHover}
                        onMouseOut={(e) => e.target.style.backgroundColor = theme.addButtonBg}
                      >
                        <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                        Add Store Stock Row
                      </button>
                    </>
                  ) : (
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Store Stock Quantity</label>
                      <input
                        type="number"
                        style={inputStyle}
                        value={simpleStoreStock}
                        onChange={(e) => setSimpleStoreStock(parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                        onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                      />
                    </div>
                  )}
                </div>

                {/* Total Stock Display */}
                <div style={infoTextStyle}>
                  <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                  <strong>Total Pharmacy Stock:</strong> {getTotalDispensaryStock()} units | 
                  <strong> Total Store Stock:</strong> {getTotalStoreStock()} units
                </div>

                <button
                  onClick={handleUpdateStock}
                  disabled={!isStockChanged() || isUpdatingStock}
                  style={!isStockChanged() ? buttonStyle : activeButtonStyle}
                  onMouseOver={(e) => {
                    if (isStockChanged() && !isUpdatingStock) {
                      e.target.style.backgroundColor = theme.primaryHover;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (isStockChanged() && !isUpdatingStock) {
                      e.target.style.backgroundColor = theme.primary;
                    }
                  }}
                >
                  {isUpdatingStock ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Update Stock Figures'}
                </button>
              </>
            )}

            {activeTab === 'prescription' && (
              <>
                {isLoadingPrescription ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: theme.primary }} />
                  </div>
                ) : (
                  <>
                    <div style={infoTextStyle}>
                      <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                      This section helps the system calculate the total number of packaging units needed for prescriptions. 
                      You can add multiple units for the same drug (e.g., 500mg tablets and 1g tablets).
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Drug Name</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={drugDetailsState.drugName}
                        disabled
                      />
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Packaging</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={drugDetailsState.packaging}
                        disabled
                      />
                    </div>
                    
                    <div style={formGroupStyle}>
                      <label htmlFor="additionalInfo" style={labelStyle}>
                        Composition (Generic names, composition, list the actual drugs that cause the therapeutic effects and any warnings etc.)
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        style={textareaStyle}
                        placeholder="Enter additional information about the drug (optional)"
                        value={drugDetailsState.additionalInfo}
                        onChange={handleInputChange}
                        onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                        onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                      />
                    </div>

                    {prescriptionUnits.map((unit, index) => (
                      <div key={index} style={prescriptionCardStyle}>
                        <FontAwesomeIcon 
                          icon={faTrash} 
                          style={removeButtonStyle} 
                          onClick={() => removePrescriptionUnit(index)}
                          title="Remove this unit"
                          onMouseOver={(e) => e.target.style.color = theme.dangerHover}
                          onMouseOut={(e) => e.target.style.color = theme.danger}
                        />
                        
                        <div style={formGroupStyle}>
                          <label style={labelStyle}>Prescription Unit *</label>
                          <select
                            style={inputStyle}
                            value={unit.prescriptionUnit}
                            onChange={(e) => handlePrescriptionUnitChange(index, 'prescriptionUnit', e.target.value)}
                            onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                            onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                          >
                            <option value="">Select Prescription Unit</option>
                            {availableUnits.map(unitOption => (
                              <option key={unitOption} value={unitOption}>{unitOption}</option>
                            ))}
                          </select>
                        </div>

                        <div style={formGroupStyle}>
                          <label style={labelStyle}>
                            Units per Packaging * (e.g., 500 for 500mg in a vial)
                          </label>
                          <input
                            type="number"
                            style={inputStyle}
                            placeholder="Enter units per packaging"
                            value={unit.unitsPerPackaging}
                            onChange={(e) => handlePrescriptionUnitChange(index, 'unitsPerPackaging', e.target.value)}
                            onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                            onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                          />
                        </div>
                      </div>
                    ))}

                    <button 
                      style={addButtonStyle} 
                      onClick={addPrescriptionUnit}
                      onMouseOver={(e) => e.target.style.backgroundColor = theme.addButtonHover}
                      onMouseOut={(e) => e.target.style.backgroundColor = theme.addButtonBg}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                      Add Unit
                    </button>

                    <button
                      onClick={handleUpdatePrescription}
                      disabled={!isPrescriptionChanged() || isUpdatingPrescription}
                      style={!isPrescriptionChanged() ? buttonStyle : activeButtonStyle}
                      onMouseOver={(e) => {
                        if (isPrescriptionChanged() && !isUpdatingPrescription) {
                          e.target.style.backgroundColor = theme.primaryHover;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (isPrescriptionChanged() && !isUpdatingPrescription) {
                          e.target.style.backgroundColor = theme.primary;
                        }
                      }}
                    >
                      {isUpdatingPrescription ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Update Prescription Settings'}
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
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
          theme={normalizedTheme === 'blue' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
}

export default UpdateStocksModal;