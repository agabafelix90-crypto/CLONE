import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faTrash, faTimes, faExclamationTriangle, faRobot } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import './TreatmentPlanModal.css';
import MedicalBillModal from './MedicalBillModal';

const cellStyle = {
    padding: '10px',
    border: '1px solid #ddd'
};

const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#e8f5e9',
    fontWeight: 'bold'
};

const availableUnits = [
    'grams (g)',
    'milligrams (mg)',
    'millilitres (ml)',
    'micrograms (mcg)',
    'International Units (IU)',
    'units',
    'milliequivalents (mEq)',
    'percentage (%)'
];

const frequencyMultipliers = {
    'once a day for': 1,
    'once noct for': 1,
    'twice daily for': 2,
    'stat for': 1,
    'tds for': 3,
    'OD': 1,
    'BID (bis in die) for': 2,
    'noct for': 1,
    '12 hourly for': 2,
    '24 hourly for': 1,
    '8 hourly for': 3,
    '6 hourly for': 4,
    '2 hourly for': 12,
    '3 hourly for': 8,
    'prn for': 1,
    'QD (quaque die) for': 1
};

const durationMultipliers = {
    'days': 1,
    'weeks': 7,
    'months': 30,
    'doses': 1,
    'days in': 1,
    'weeks in': 7,
    'months in': 30,
    'doses in': 1,
    'days then': 1,
    'weeks then': 7,
    'months then': 30,
    'doses then': 1
};

function TreatmentPlanModal({ onClose, fileId, employeeName, token }) {
    // Use a ref to track if component is mounted
    const isMounted = useRef(true);
    
    const [treatmentPlanRows, setTreatmentPlanRows] = useState([]);
    const [drugSuggestions, setDrugSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showMedicalBillModal, setShowMedicalBillModal] = useState(false);
    const [billData, setBillData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changesMade, setChangesMade] = useState(false);
    const [infoBlocks, setInfoBlocks] = useState([]);
    const [infoTexts, setInfoTexts] = useState([]);
    const [showUnitDropdown, setShowUnitDropdown] = useState(null);
    const [dosageInputs, setDosageInputs] = useState([]);
    const [totalBill, setTotalBill] = useState(0);
    const [showRouteDropdown, setShowRouteDropdown] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedProcedures, setSelectedProcedures] = useState([]);
    const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
    const [hoveredDrug, setHoveredDrug] = useState(null);
    const [validationPending, setValidationPending] = useState([]);
    
    // AI Suggestion State
    const [aiSuggestion, setAiSuggestion] = useState({ 
        message: '', 
        type: '', // 'warning', 'info', 'error'
        visible: false,
        loading: false 
    });
    const [aiFeatureEnabled, setAiFeatureEnabled] = useState(true);

    // Refs for cleanup
    const dropdownRef = useRef(null);
    const tooltipRef = useRef(null);
    const aiMessageRef = useRef(null);
    const aiTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Helper function to get drug ID by drug name
    const getDrugIdByName = useCallback((drugName) => {
        const drug = drugSuggestions.find(d => d.drug_name === drugName);
        return drug ? drug.drug_id : null;
    }, [drugSuggestions]);

    // Set isMounted ref on mount/unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            // Clean up any pending timers or requests
            if (aiTimerRef.current) {
                clearTimeout(aiTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Safe state update helper
    const safeSetState = useCallback((setter, value) => {
        if (isMounted.current) {
            setter(value);
        }
    }, []);

    useEffect(() => {
        fetchExistingTreatmentRows();
        fetchDrugSuggestions();
        fetchServices();
    }, []);

    useEffect(() => {
        console.log('Token received:', token);
    }, [token]);

    useEffect(() => {
        calculateTotalBill();
    }, [treatmentPlanRows, drugSuggestions, selectedProcedures]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUnitDropdown(null);
            }
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setTooltip({ ...tooltip, visible: false });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tooltip]);

    // Auto-hide AI message after 30 seconds - with cleanup
    useEffect(() => {
        if (aiSuggestion.visible && !aiSuggestion.loading) {
            aiTimerRef.current = setTimeout(() => {
                safeSetState(setAiSuggestion, prev => ({ ...prev, visible: false }));
            }, 30000);
        }
        return () => {
            if (aiTimerRef.current) {
                clearTimeout(aiTimerRef.current);
            }
        };
    }, [aiSuggestion.visible, aiSuggestion.loading, safeSetState]);

    // AI Suggestion Functions with abort controller
    const fetchAiSuggestion = async (prescriptionData) => {
        if (!aiFeatureEnabled || !isMounted.current) return;
        
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        safeSetState(setAiSuggestion, prev => ({ ...prev, loading: true, visible: true }));
        
        try {
            const response = await fetch(urls.aiPrescriptionSuggestion, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prescriptionData),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Failed to fetch AI suggestion');
            }

            const data = await response.json();
            
            // Only update state if component is still mounted
            if (!isMounted.current) return;
            
            // Handle AI response based on the expected format
            let suggestionText = '';
            let suggestionType = 'info';
            
            if (data.aiResponse) {
                const aiResponse = data.aiResponse.trim().toLowerCase();
                
                if (aiResponse === 'none' || aiResponse === 'good') {
                    suggestionText = 'Good work - prescription looks appropriate';
                    suggestionType = 'info';
                } else {
                    suggestionText = data.aiResponse;
                    suggestionType = data.aiResponse.toLowerCase().includes('warning') ? 'warning' : 'info';
                }
            } else if (data.suggestion) {
                const suggestion = data.suggestion.trim().toLowerCase();
                
                if (suggestion === 'none' || suggestion === 'good') {
                    suggestionText = 'Good work - prescription looks appropriate';
                    suggestionType = 'info';
                } else {
                    suggestionText = data.suggestion;
                    suggestionType = data.suggestion.toLowerCase().includes('warning') ? 'warning' : 'info';
                }
            } else {
                safeSetState(setAiSuggestion, prev => ({ ...prev, loading: false, visible: false }));
                return;
            }

            if (suggestionText && suggestionText.trim() !== '') {
                safeSetState(setAiSuggestion, {
                    message: suggestionText,
                    type: suggestionType,
                    visible: true,
                    loading: false
                });
            } else {
                safeSetState(setAiSuggestion, prev => ({ ...prev, loading: false, visible: false }));
            }
        } catch (error) {
            // Don't log aborted requests as errors
            if (error.name === 'AbortError') {
                console.log('AI suggestion fetch aborted');
                return;
            }
            
            console.error('Error fetching AI suggestion:', error);
            if (isMounted.current) {
                safeSetState(setAiSuggestion, prev => ({ ...prev, loading: false }));
            }
        }
    };

    const handleAddRowWithAi = async (index) => {
        if (!validateRows(treatmentPlanRows)) {
            toast.error('Failed, some parts of the prescription are missing. Ensure that all rows and columns of the prescription table have been filled.');
            return;
        }

        const newRow = createEmptyRow();
        
        const newRows = [...treatmentPlanRows];
        newRows.splice(index + 1, 0, newRow);
        
        const newInfoTexts = [...infoTexts];
        newInfoTexts.splice(index + 1, 0, '');
        safeSetState(setInfoTexts, newInfoTexts);
        
        const newInfoBlocks = [...infoBlocks];
        newInfoBlocks.splice(index + 1, 0, false);
        safeSetState(setInfoBlocks, newInfoBlocks);
        
        const newDosageInputs = [...dosageInputs];
        newDosageInputs.splice(index + 1, 0, '');
        safeSetState(setDosageInputs, newDosageInputs);
        
        safeSetState(setTreatmentPlanRows, newRows);
        safeSetState(setChangesMade, true);

        try {
            // Prepare treatment row payload with drug IDs
            const treatmentRowPayload = newRows.map(row => ({
                fileId: fileId,
                route: row.route,
                drug: row.drug,
                drug_id: getDrugIdByName(row.drug), // Include drug ID
                dosage: row.dosage,
                frequency: row.frequency,
                duration: row.duration,
                durationUnit: row.durationUnit,
                quantity: row.quantity,
                packaging: row.packaging
            }));

            const response = await fetch(urls.treatmentrow, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });

            if (!response.ok) {
                console.warn('Failed to save new row to backend, but keeping in UI');
            }

            // Prepare data for AI suggestion
            if (aiFeatureEnabled && isMounted.current) {
                const prescriptionSentences = newRows
                    .filter(row => row.drug && row.dosage && row.frequency)
                    .map((row, idx) => {
                        const additionalInfo = newInfoTexts[idx] || '';
                        return constructTreatmentSentence(row, additionalInfo);
                    })
                    .join('\n');

                const drugsWithInfo = newRows
                    .filter(row => row.drug)
                    .map(row => {
                        const drugInfo = drugSuggestions.find(d => d.drug_name === row.drug);
                        return {
                            drug: row.drug,
                            drug_id: drugInfo?.drug_id || null,
                            compositionaboutthisdrug: drugInfo?.additional_info || 'No composition data'
                        };
                    });

                const aiPayload = {
                    token: token,
                    fileId: fileId,
                    prescriptionSentences: prescriptionSentences,
                    drugs: drugsWithInfo,
                    procedures: selectedProcedures
                };

                await fetchAiSuggestion(aiPayload);
            }

        } catch (error) {
            console.warn('Network error saving new row, but keeping in UI:', error);
        }

        if (isMounted.current) {
            setTimeout(() => {
                const rowElement = document.getElementById(`row-${newRow.id}`);
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };

    // Tooltip management
    const showTooltip = (content, event) => {
        if (!content) return;
        
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        safeSetState(setTooltip, { visible: true, content, x, y });
    };

    const hideTooltip = () => {
        safeSetState(setTooltip, { ...tooltip, visible: false });
    };

    const getDrugAdditionalInfo = (drugName) => {
        const drug = drugSuggestions.find(d => d.drug_name === drugName);
        if (!drug) return null;
        
        if (drug.additional_info && drug.additional_info !== 'N/A' && drug.additional_info.trim() !== '') {
            return drug.additional_info;
        }
        
        return "No information available for this drug. Please visit drug settings to add information about generic names, brand equivalents, and clinical guidelines to assist doctors in making informed prescribing decisions.";
    };

    const getDrugQuantityInfo = (drugName) => {
        const drug = drugSuggestions.find(d => d.drug_name === drugName);
        if (!drug) return null;
        
        if (!drug.unit_packaging || drug.unit_packaging.trim() === '') {
            return "No quantity per unit was set for this drug. Please visit drug settings to configure unit packaging information to enable automatic quantity calculations.";
        }
        
        return null;
    };

    const validateDrugQuantity = async (index) => {
        const row = treatmentPlanRows[index];
        if (!row.drug || !row.quantity) return true;

        const drugInfo = drugSuggestions.find(drug => 
            drug.drug_name.toLowerCase() === row.drug.toLowerCase()
        );

        if (!drugInfo) return true;

        const requestedQuantity = parseInt(row.quantity);
        const availableQuantity = parseInt(drugInfo.quantity) || 0;

        if (availableQuantity === 0) {
            const proceed = window.confirm(
                `⚠️ ${row.drug} is currently OUT OF STOCK.\n\nAvailable quantity: 0 ${drugInfo.packaging}\nRequested quantity: ${requestedQuantity} ${drugInfo.packaging}\n\nDo you want to continue with this prescription?`
            );
            if (!proceed) {
                const updatedRows = [...treatmentPlanRows];
                updatedRows[index].quantity = '';
                safeSetState(setTreatmentPlanRows, updatedRows);
                return false;
            }
            return true;
        }

        if (requestedQuantity > availableQuantity) {
            const proceed = window.confirm(
                `⚠️ Quantity exceeds available stock for ${row.drug}.\n\nAvailable quantity: ${availableQuantity} ${drugInfo.packaging}\nRequested quantity: ${requestedQuantity} ${drugInfo.packaging}\n\nDo you want to continue with this prescription?`
            );
            if (!proceed) {
                const updatedRows = [...treatmentPlanRows];
                updatedRows[index].quantity = availableQuantity.toString();
                safeSetState(setTreatmentPlanRows, updatedRows);
                return false;
            }
            return true;
        }

        return true;
    };

    const fetchServices = () => {
        const payload = { token: token };
        fetch(urls.fetchservices, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && isMounted.current) {
                safeSetState(setServices, data.data);
            }
        })
        .catch(error => console.error('Error fetching services:', error));
    };

    const fetchDrugSuggestions = () => {
        const payload = { token: token };
        fetch(urls.fetchprescriptiondrugs, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            if (isMounted.current) {
                safeSetState(setDrugSuggestions, data);
            }
        })
        .catch(error => console.error('Error fetching drug suggestions:', error));
    };

    const fetchExistingTreatmentRows = () => {
        safeSetState(setLoading, true);
        const payload = { fileId: fileId };
    
        fetch(urls.fetchtreatmentrows2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch existing treatment rows'))
            .then(data => {
                if (!isMounted.current) return;
                
                if (data && data.procedures && Array.isArray(data.procedures)) {
                    safeSetState(setSelectedProcedures, data.procedures.map(proc => ({
                        id: proc.id,
                        name: proc.name,
                        price: proc.price
                    })));
                }
    
                if (data && data.treatmentPlan && Array.isArray(data.treatmentPlan)) {
                    const existingRows = data.treatmentPlan.map((row, index) => ({
                        id: row.id || `existing-${index}`,
                        route: row.route,
                        drug: row.drug_name,
                        drug_id: row.drug_id, // Include drug ID from existing data
                        dosage: row.dosage,
                        frequency: row.frequency,
                        duration: row.duration,
                        durationUnit: row.duration_unit,
                        quantity: row.quantity,
                        packaging: row.packaging,
                        additionalInfo: row.additional_info
                    }));
    
                    const initializedInfoTexts = existingRows.map(row =>
                        row.additionalInfo === 'N/A' ? '' : row.additionalInfo || ''
                    );
    
                    const initializedInfoBlocks = existingRows.map(row =>
                        row.additionalInfo !== 'N/A' && row.additionalInfo ? true : false
                    );
    
                    const initializedDosageInputs = existingRows.map(row => row.dosage || '');
    
                    safeSetState(setInfoTexts, initializedInfoTexts);
                    safeSetState(setInfoBlocks, initializedInfoBlocks);
                    safeSetState(setDosageInputs, initializedDosageInputs);
                    safeSetState(setTreatmentPlanRows, [...existingRows, createEmptyRow()]);
                } else if (data && Array.isArray(data)) {
                    const existingRows = data.map((row, index) => ({
                        id: row.id || `existing-${index}`,
                        route: row.route,
                        drug: row.drug_name,
                        drug_id: row.drug_id, // Include drug ID from existing data
                        dosage: row.dosage,
                        frequency: row.frequency,
                        duration: row.duration,
                        durationUnit: row.duration_unit,
                        quantity: row.quantity,
                        packaging: row.packaging,
                        additionalInfo: row.additional_info
                    }));
    
                    const initializedInfoTexts = existingRows.map(row =>
                        row.additionalInfo === 'N/A' ? '' : row.additionalInfo || ''
                    );
    
                    const initializedInfoBlocks = existingRows.map(row =>
                        row.additionalInfo !== 'N/A' && row.additionalInfo ? true : false
                    );
    
                    const initializedDosageInputs = existingRows.map(row => row.dosage || '');
    
                    safeSetState(setInfoTexts, initializedInfoTexts);
                    safeSetState(setInfoBlocks, initializedInfoBlocks);
                    safeSetState(setDosageInputs, initializedDosageInputs);
                    safeSetState(setTreatmentPlanRows, [...existingRows, createEmptyRow()]);
                } else {
                    safeSetState(setTreatmentPlanRows, [createEmptyRow()]);
                    safeSetState(setInfoTexts, ['']);
                    safeSetState(setInfoBlocks, [false]);
                    safeSetState(setDosageInputs, ['']);
                }
                safeSetState(setLoading, false);
            })
            .catch(error => {
                console.error('Error fetching existing treatment rows:', error);
                if (isMounted.current) {
                    safeSetState(setLoading, false);
                }
            });
    };

    function createEmptyRow() {
        return {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            drug: '',
            drug_id: null,
            packaging: '',
            route: '',
            dosage: '',
            frequency: '',
            duration: '',
            durationUnit: '',
            quantity: ''
        };
    }

    const handleProcedureSelect = (procedure) => {
        const isAlreadySelected = selectedProcedures.some(p => p.id === procedure.id);
        if (!isAlreadySelected) {
            const newProcedure = {
                id: procedure.id,
                name: procedure.name,
                price: procedure.price
            };
            safeSetState(setSelectedProcedures, [...selectedProcedures, newProcedure]);
            safeSetState(setChangesMade, true);
        }
        safeSetState(setShowProcedureDropdown, false);
    };

    const handleRemoveProcedure = (procedureId) => {
        safeSetState(setSelectedProcedures, selectedProcedures.filter(p => p.id !== procedureId));
        safeSetState(setChangesMade, true);
    };

    const formatPrice = (price) => {
        const numPrice = parseFloat(price) || 0;
        return `UGX ${Math.round(numPrice).toLocaleString()}`;
    };

    const handleDrugInputChange = (index, event) => {
        const value = event.target.value;
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].drug = value;

        const matchingDrug = drugSuggestions.find(drug => drug.drug_name.toLowerCase() === value.toLowerCase());
        if (matchingDrug) {
            updatedRows[index].packaging = matchingDrug.packaging;
            updatedRows[index].drug_id = matchingDrug.drug_id; // Set drug ID when drug is selected
        } else {
            updatedRows[index].packaging = '';
            updatedRows[index].drug_id = null;
        }

        safeSetState(setTreatmentPlanRows, updatedRows);
        safeSetState(setChangesMade, true);

        if (value) {
            const filtered = drugSuggestions.filter(drug =>
                drug.drug_name.toLowerCase().includes(value.toLowerCase())
            );
            safeSetState(setFilteredSuggestions, filtered);
            safeSetState(setActiveSuggestionIndex, index);
        } else {
            safeSetState(setFilteredSuggestions, []);
            safeSetState(setActiveSuggestionIndex, null);
        }
    };

    const handleDrugQuantityChange = async (index, event) => {
        const inputValue = event.target.value;
        const columnName = event.target.name;

        if (columnName === 'quantity' && !/^\d*$/.test(inputValue)) {
            return;
        }

        const newTreatmentPlanRows = [...treatmentPlanRows];
        newTreatmentPlanRows[index][columnName] = inputValue;
        safeSetState(setTreatmentPlanRows, newTreatmentPlanRows);
        safeSetState(setChangesMade, true);

        if (columnName === 'quantity' && inputValue && parseInt(inputValue) > 0) {
            const isValid = await validateDrugQuantity(index);
            if (!isValid) {
                return;
            }
        }
    };

    const renderDrugSuggestions = (index) => {
        return (
            <datalist id={`suggestions-list-${index}`}>
                {filteredSuggestions.map((suggestion, i) => {
                    const quantity = suggestion.quantity || 0;
                    const isOutOfStock = quantity === 0;
                    
                    return (
                        <option 
                            key={i} 
                            value={suggestion.drug_name}
                            style={{
                                color: isOutOfStock ? 'red' : 'inherit',
                                fontWeight: isOutOfStock ? 'bold' : 'normal'
                            }}
                        >
                            {suggestion.drug_name} - {isOutOfStock 
                                ? 'OUT OF STOCK' 
                                : `(${quantity} ${suggestion.packaging}) available`
                            }
                        </option>
                    );
                })}
            </datalist>
        );
    };

    const handleSuggestionClick = (index, suggestion) => {
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].drug = suggestion.drug_name;
        updatedRows[index].drug_id = suggestion.drug_id; // Set drug ID when suggestion is clicked
        updatedRows[index].packaging = suggestion.packaging;
        safeSetState(setTreatmentPlanRows, updatedRows);
        safeSetState(setFilteredSuggestions, []);
        safeSetState(setActiveSuggestionIndex, null);
        safeSetState(setChangesMade, true);
        
        if (suggestion.quantity === 0) {
            toast.warning(`${suggestion.drug_name} is currently out of stock!`);
        }
    };

    const handleTreatmentPlanChange = (index, field, value) => {
        const newRows = [...treatmentPlanRows];
        newRows[index][field] = value;
        safeSetState(setTreatmentPlanRows, newRows);
        safeSetState(setChangesMade, true);
        
        if (field === 'dosage' || field === 'frequency' || field === 'duration' || field === 'durationUnit') {
            calculateQuantity(index);
        }
    };

    const handleDosageInputChange = (index, value) => {
        const newDosageInputs = [...dosageInputs];
        newDosageInputs[index] = value;
        safeSetState(setDosageInputs, newDosageInputs);
        
        const newRows = [...treatmentPlanRows];
        newRows[index].dosage = value;
        safeSetState(setTreatmentPlanRows, newRows);
        safeSetState(setChangesMade, true);
    };

    const handleDeleteRow = async (index) => {
        if (treatmentPlanRows.length === 1) {
            toast.error('Cannot delete the first row. There must be at least one row.');
            return;
        }

        const updatedRows = treatmentPlanRows.filter((_, rowIndex) => rowIndex !== index);
        const updatedInfoTexts = infoTexts.filter((_, i) => i !== index);
        const updatedInfoBlocks = infoBlocks.filter((_, i) => i !== index);
        const updatedDosageInputs = dosageInputs.filter((_, i) => i !== index);

        safeSetState(setTreatmentPlanRows, updatedRows);
        safeSetState(setInfoTexts, updatedInfoTexts);
        safeSetState(setInfoBlocks, updatedInfoBlocks);
        safeSetState(setDosageInputs, updatedDosageInputs);
        safeSetState(setChangesMade, true);

        try {
            // Prepare treatment row payload with drug IDs
            const treatmentRowPayload = updatedRows.map(row => ({
                fileId: fileId,
                route: row.route,
                drug: row.drug,
                drug_id: row.drug_id || getDrugIdByName(row.drug), // Include drug ID
                dosage: row.dosage,
                frequency: row.frequency,
                duration: row.duration,
                durationUnit: row.durationUnit,
                quantity: row.quantity,
                packaging: row.packaging
            }));

            const response = await fetch(urls.treatmentrow, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });

            if (!response.ok) {
                throw new Error('Failed to update treatment rows after deletion');
            }
        } catch (error) {
            console.error('Error updating treatment rows after deletion:', error);
            toast.warning('Row was removed locally but may not be saved on server. Check your connection.');
        }
    };

    const validateRows = () => {
        let allRowsEmpty = true;

        for (const row of treatmentPlanRows) {
            const isRowFilled = row.route && row.drug && row.dosage && row.frequency && row.duration && row.durationUnit && row.quantity;

            if (isRowFilled) {
                allRowsEmpty = false;
            } else if (
                row.route ||
                row.drug ||
                row.dosage ||
                row.frequency ||
                row.duration ||
                row.durationUnit ||
                row.quantity
            ) {
                return false;
            }
        }

        return !allRowsEmpty;
    };

    const handleTreatmentPlanSubmit = async () => {
        if (!token) {
            alert('Token is missing. Please log in again.');
            return;
        }

        for (let i = 0; i < treatmentPlanRows.length; i++) {
            const row = treatmentPlanRows[i];
            if (row.drug && row.quantity) {
                const isValid = await validateDrugQuantity(i);
                if (!isValid) {
                    toast.error(`Please adjust the quantity for ${row.drug} before submitting.`);
                    return;
                }
            }
        }

        if (!validateRows()) {
            alert('Failed, some parts of the prescription are missing. Ensure that all rows and columns of the prescription table have been filled.');
            return;
        }

        safeSetState(setSubmitting, true);

        const employeeSentence = `By Doctor (${employeeName})`;
        const updatedTreatmentPlan = treatmentPlanRows.map((row, index) => {
            const infoText = infoTexts[index] ? `\n   ${infoTexts[index]}` : '';
            return `• ${row.route} ${row.drug} ${row.dosage} ${row.frequency} ${row.duration} ${row.durationUnit} ----(${row.quantity} ${row.packaging})${infoText}`;
        }).join('\n');

        const proceduresText = selectedProcedures.length > 0
            ? '\n\nProcedures:\n' + selectedProcedures.map(proc => `• ${proc.name}`).join('\n')
            : '';

        const updatedTreatmentPlanWithEmployee = `${updatedTreatmentPlan}${proceduresText}\n${employeeSentence}`;

        const submitChangesPayload = JSON.parse(JSON.stringify({
            fileId: fileId,
            treatment_plan: updatedTreatmentPlanWithEmployee,
            token: token,
            procedures: selectedProcedures.map(proc => ({
                id: proc.id,
                name: proc.name,
                price: proc.price
            }))
        }));

        try {
            const submitResponse = await fetch(urls.submitchanges2, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitChangesPayload),
            });

            if (!submitResponse.ok) {
                throw new Error('Failed to submit treatment plan changes');
            }

            // Prepare treatment row payload with drug IDs
            const treatmentRowPayload = treatmentPlanRows.map((row, index) => ({
                fileId: fileId,
                route: row.route,
                drug: row.drug,
                drug_id: row.drug_id || getDrugIdByName(row.drug), // Include drug ID
                dosage: row.dosage,
                frequency: row.frequency,
                duration: row.duration,
                durationUnit: row.durationUnit,
                quantity: row.quantity,
                packaging: row.packaging,
                token: token,
                additionalInfo: infoTexts[index] || null,
                procedures: selectedProcedures.map(proc => ({
                    id: proc.id,
                    name: proc.name,
                    price: proc.price
                }))
            }));

            const treatmentRowResponse = await fetch(urls.treatmentrow, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });

            if (!treatmentRowResponse.ok) {
                throw new Error('Failed to save treatment rows');
            }

            toast.success('Changes submitted successfully!');
            safeSetState(setChangesMade, false);

        } catch (error) {
            console.error('Error during submission:', error);
            toast.error('Oops! Something went wrong. Please check your network connectivity.');
        } finally {
            if (isMounted.current) {
                safeSetState(setSubmitting, false);
            }
        }
    };

    const handleSeeBillClick = () => {
        const nonEmptyRows = treatmentPlanRows.filter(row => row.drug && row.quantity);
        const billData = nonEmptyRows.map(row => ({
            drug: row.drug,
            drug_id: row.drug_id || getDrugIdByName(row.drug), // Include drug ID in bill data
            packaging: row.packaging,
            route: row.route,
            quantity: row.quantity,
            type: 'drug'
        }));
        
        const procedureBillData = selectedProcedures.map(proc => ({
            id: proc.id,
            name: proc.name,
            price: proc.price,
            type: 'procedure'
        }));
        
        safeSetState(setBillData, [...billData, ...procedureBillData]);
        safeSetState(setShowMedicalBillModal, true);
    };

    const handleCloseModal = () => {
        if (changesMade) {
            const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close without updating? If you proceed, your changes will not be saved.");
            if (confirmClose) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const toggleInfoBlock = (index) => {
        const updatedInfoBlocks = [...infoBlocks];
        updatedInfoBlocks[index] = !updatedInfoBlocks[index];
        safeSetState(setInfoBlocks, updatedInfoBlocks);
    };

    const handleInfoTextChange = (index, value) => {
        const updatedInfoTexts = [...infoTexts];
        updatedInfoTexts[index] = value;
        safeSetState(setInfoTexts, updatedInfoTexts);
        safeSetState(setChangesMade, true);
    };

    const constructTreatmentSentence = (row, additional) => {
        const treatmentSentence = `• ${row.route} ${row.drug} ${row.dosage} ${row.frequency} ${row.duration} ${row.durationUnit} ----(${row.quantity} ${row.packaging})`;
        return additional ? `${treatmentSentence}\n ${additional}` : treatmentSentence;
    };

    const parseDosage = (dosageString) => {
        if (!dosageString) return { value: null, unit: null };
        
        const match = dosageString.match(/(\d+(\.\d+)?)\s*([a-zA-Z%]+)/);
        if (match) {
            return {
                value: parseFloat(match[1]),
                unit: match[3].toLowerCase()
            };
        }
        
        const valueMatch = dosageString.match(/(\d+(\.\d+)?)/);
        if (valueMatch) {
            return {
                value: parseFloat(valueMatch[1]),
                unit: null
            };
        }
        
        return { value: null, unit: null };
    };

    const calculateQuantity = (index) => {
        const row = treatmentPlanRows[index];
        if (!row.drug || !row.dosage || !row.frequency || !row.duration || !row.durationUnit) {
            return;
        }

        const drugInfo = drugSuggestions.find(drug => 
            drug.drug_name.toLowerCase() === row.drug.toLowerCase()
        );

        if (!drugInfo || !drugInfo.unit_packaging) {
            return;
        }

        const dosageInfo = parseDosage(row.dosage);
        if (!dosageInfo.value) {
            return;
        }

        const availableUnits = drugInfo.units ? drugInfo.units.split(',') : [];
        const unitPackaging = drugInfo.unit_packaging ? drugInfo.unit_packaging.split(',') : [];
        
        if (availableUnits.length !== unitPackaging.length) {
            return;
        }

        let conversionFactor = 1;
        let foundMatch = false;
        
        for (let i = 0; i < availableUnits.length; i++) {
            const unit = availableUnits[i].trim().toLowerCase();
            
            if (dosageInfo.unit && unit.includes(dosageInfo.unit)) {
                conversionFactor = parseFloat(unitPackaging[i]);
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            for (let i = 0; i < availableUnits.length; i++) {
                const unit = availableUnits[i].trim().toLowerCase();
                
                if ((unit.includes('mg') && (!dosageInfo.unit || dosageInfo.unit.includes('mg'))) ||
                    (unit.includes('g') && (!dosageInfo.unit || dosageInfo.unit.includes('g'))) ||
                    (unit.includes('ml') && (!dosageInfo.unit || dosageInfo.unit.includes('ml'))) ||
                    (unit.includes('mcg') && (!dosageInfo.unit || dosageInfo.unit.includes('mcg')))) {
                    conversionFactor = parseFloat(unitPackaging[i]);
                    foundMatch = true;
                    break;
                }
            }
        }

        let frequencyMultiplier = 1;
        if (row.frequency.includes('twice') || row.frequency.includes('BID') || row.frequency.includes('12 hourly')) {
            frequencyMultiplier = 2;
        } else if (row.frequency.includes('tds') || row.frequency.includes('8 hourly')) {
            frequencyMultiplier = 3;
        } else if (row.frequency.includes('2 hourly')) {
            frequencyMultiplier = 12;
        } else if (row.frequency.includes('3 hourly')) {
            frequencyMultiplier = 8;
        } else if (row.frequency.includes('6 hourly')) {
            frequencyMultiplier = 4;
        }

        let durationMultiplier = parseFloat(row.duration);
        if (row.durationUnit.includes('week')) {
            durationMultiplier *= 7;
        } else if (row.durationUnit.includes('month')) {
            durationMultiplier *= 30;
        }

        const perDoseAmpules = Math.ceil(dosageInfo.value / conversionFactor);
        const totalDoses = frequencyMultiplier * durationMultiplier;
        let quantity = perDoseAmpules * totalDoses;

        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].quantity = quantity.toString();
        safeSetState(setTreatmentPlanRows, updatedRows);
        safeSetState(setChangesMade, true);
    };

    const handleUnitSelect = (index, unit) => {
        const currentDosage = dosageInputs[index] || '';
        
        let newDosage = currentDosage;
        const unitMatch = currentDosage.match(/(\d+(\.\d+)?)\s*([a-zA-Z%]+)/);
        
        if (unitMatch) {
            newDosage = currentDosage.replace(unitMatch[3], unit.split(' ')[0]);
        } else {
            const valueMatch = currentDosage.match(/(\d+(\.\d+)?)/);
            if (valueMatch) {
                newDosage = `${currentDosage} ${unit.split(' ')[0]}`;
            } else {
                newDosage = currentDosage;
            }
        }
        
        handleDosageInputChange(index, newDosage);
        safeSetState(setShowUnitDropdown, null);
        
        setTimeout(() => calculateQuantity(index), 100);
    };

    const calculateRowPrice = (row) => {
        if (!row?.drug || !row?.quantity) return 0;
        
        const drugInfo = drugSuggestions.find(drug => 
            drug?.drug_name?.toLowerCase() === row.drug.toLowerCase()
        );
        
        if (!drugInfo || !drugInfo.selling_price) return 0;
        
        const quantity = parseInt(row.quantity) || 0;
        const sellingPrice = parseFloat(drugInfo.selling_price) || 0;
        
        return quantity * sellingPrice;
    };

    const calculateTotalBill = () => {
        let total = 0;
        
        treatmentPlanRows.forEach(row => {
            total += calculateRowPrice(row);
        });
        
        selectedProcedures.forEach(proc => {
            total += parseFloat(proc.price) || 0;
        });
        
        safeSetState(setTotalBill, total);
    };

    const getDrugStockInfo = (drugName) => {
        const drug = drugSuggestions.find(d => d.drug_name === drugName);
        if (!drug) return null;
        
        const quantity = parseInt(drug.quantity) || 0;
        if (quantity === 0) {
            return {
                status: 'out-of-stock',
                message: 'OUT OF STOCK',
                available: 0
            };
        }
        
        return {
            status: 'in-stock',
            message: `${quantity} ${drug.packaging} available`,
            available: quantity
        };
    };

    return (
        <div className="treatment-plan-container">
            <ToastContainer />
            
            {/* AI Suggestion Message - Chat Bubble Style */}
            {aiSuggestion.visible && (
                <div 
                    ref={aiMessageRef}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        width: '400px',
                        maxWidth: '90vw',
                        backgroundColor: aiSuggestion.type === 'warning' ? '#fff3cd' : '#d1ecf1',
                        border: `1px solid ${aiSuggestion.type === 'warning' ? '#ffeaa7' : '#bee5eb'}`,
                        borderRadius: '12px',
                        padding: '15px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    <style>
                        {`
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
                            @keyframes thinking {
                                0% { transform: rotate(0deg); }
                                25% { transform: rotate(5deg); }
                                50% { transform: rotate(0deg); }
                                75% { transform: rotate(-5deg); }
                                100% { transform: rotate(0deg); }
                            }
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            .thinking-animation {
                                animation: thinking 1.5s infinite;
                            }
                            .chat-bubble {
                                position: relative;
                            }
                            .chat-bubble::after {
                                content: '';
                                position: absolute;
                                top: 50%;
                                right: -8px;
                                transform: translateY(-50%);
                                width: 0;
                                height: 0;
                                border-left: 8px solid ${aiSuggestion.type === 'warning' ? '#fff3cd' : '#d1ecf1'};
                                border-top: 8px solid transparent;
                                border-bottom: 8px solid transparent;
                            }
                        `}
                    </style>
                    
                    <div className="chat-bubble" style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        {/* Robot Profile Picture */}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: aiSuggestion.type === 'warning' ? '#856404' : '#0c5460',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <FontAwesomeIcon 
                                icon={faRobot} 
                                className={aiSuggestion.loading ? 'thinking-animation' : ''}
                                style={{
                                    color: 'white',
                                    fontSize: '18px'
                                }} 
                            />
                        </div>
                        
                        {/* Message Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                            }}>
                                <strong style={{
                                    color: aiSuggestion.type === 'warning' ? '#856404' : '#0c5460',
                                    fontSize: '14px'
                                }}>
                                    AI Prescription Assistant
                                </strong>
                                <button
                                    onClick={() => safeSetState(setAiSuggestion, prev => ({ ...prev, visible: false }))}
                                    style={{
                                        background: 'none',
                                        border: 'none',
 
                                        cursor: 'pointer',
                                        color: aiSuggestion.type === 'warning' ? '#856404' : '#0c5460',
                                        fontSize: '16px',
                                        padding: '0 4px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            {aiSuggestion.loading ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: aiSuggestion.type === 'warning' ? '#856404' : '#0c5460'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        border: `2px solid ${aiSuggestion.type === 'warning' ? '#856404' : '#0c5460'}`,
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <span style={{ fontSize: '13px' }}>Analyzing prescription...</span>
                                </div>
                            ) : (
                                <div style={{
                                    color: aiSuggestion.type === 'warning' ? '#856404' : '#0c5460',
                                    fontSize: '13px',
                                    lineHeight: '1.4'
                                }}>
                                    {aiSuggestion.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Global Tooltip */}
            {tooltip.visible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: tooltip.y,
                        left: tooltip.x,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        maxWidth: '300px',
                        zIndex: 9999,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        border: '1px solid #555'
                    }}
                >
                    {tooltip.content}
                </div>
            )}
            
            <h3>Treatment Plan</h3>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div>
                        {treatmentPlanRows.map((row, index) => (
                            <p key={row.id} style={{ whiteSpace: 'pre-wrap', margin: '0', padding: '0' }}>
                                {constructTreatmentSentence(row, infoTexts[index])}
                            </p>
                        ))}
                      
                        {selectedProcedures.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <strong>Procedures/Services:</strong>
                                {selectedProcedures.map(proc => (
                                    <p key={proc.id} style={{ margin: '0', padding: '0' }}>
                                        • {proc.name}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Procedures Section */}
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        border: '1px solid #ddd', 
                        borderRadius: '5px',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <h4>Add Procedures/Services</h4>
                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                            <button 
                                onClick={() => setShowProcedureDropdown(!showProcedureDropdown)}
                                style={{
                                    backgroundColor: '#54a366ff',
                                    color: 'white',
                                    border: 'none',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#218838';
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#28a745';
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Add Procedure/Service"
                            >
                                +
                            </button>
                            {showProcedureDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    zIndex: 10,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    minWidth: '100px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    marginTop: '5px'
                                }}>
                                    {services.map(service => (
                                        <div 
                                            key={service.id}
                                            style={{
                                                padding: '10px 15px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f1f1f1',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                                            onClick={() => handleProcedureSelect(service)}
                                        >
                                            <span>{service.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {formatPrice(service.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {selectedProcedures.length > 0 && (
                            <div>
                                <strong>Selected Procedures/Services:</strong>
                                {selectedProcedures.map(proc => (
                                    <div key={proc.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 0',
                                        borderBottom: '1px solid #eee',
                                        animation: 'fadeIn 0.3s ease'
                                    }}>
                                        <span>{proc.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {formatPrice(proc.price)}
                                            </span>
                                            <button 
                                                onClick={() => handleRemoveProcedure(proc.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '5px',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Remove Procedure"
                                            >
                                                <svg 
                                                    width="20" 
                                                    height="20" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="trash-icon"
                                                >
                                                    <path d="M3 6H5H21" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M10 11V17" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M14 11V17" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {selectedProcedures.length === 0 && (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '20px', 
                                color: '#6c757d', 
                                fontStyle: 'italic' 
                            }}>
                                No procedures selected
                            </div>
                        )}
                    </div>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={headerCellStyle}>Route</th>
                                    <th style={headerCellStyle}>Drug</th>
                                    <th style={headerCellStyle}>Dosage</th>
                                    <th style={headerCellStyle}>Frequency</th>
                                    <th style={headerCellStyle}>Duration</th>
                                    <th style={headerCellStyle}>Drug Quantity</th>
                                    <th style={headerCellStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treatmentPlanRows.map((row, index) => {
                                    const rowPrice = calculateRowPrice(row);
                                    const stockInfo = getDrugStockInfo(row.drug);
                                    const additionalInfo = getDrugAdditionalInfo(row.drug);
                                    const quantityInfo = getDrugQuantityInfo(row.drug);
                                    
                                    return (
                                        <React.Fragment key={row.id}>
                                            <tr id={`row-${row.id}`}>
                                                <td style={cellStyle}>
                                                    <div style={{ position: "relative", width: "100%" }}>
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={row.route || ""}
                                                            placeholder="Select route"
                                                            onClick={() => setShowRouteDropdown(showRouteDropdown === index ? null : index)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "6px 12px",
                                                                borderRadius: "6px",
                                                                border: "1px solid #ddd",
                                                                cursor: "pointer",
                                                                background: "#fff",
                                                                color: "#000",
                                                            }}
                                                        />
                                                        
                                                        {showRouteDropdown === index && (
                                                            <div
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "50%",
                                                                    left: "100%",
                                                                    transform: "translateY(-50%)",
                                                                    zIndex: 10,
                                                                    background: "white",
                                                                    color: "black",
                                                                    borderRadius: "6px",
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                                                    minWidth: "120px",
                                                                    padding: "8px 0",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "50%",
                                                                        left: "-8px",
                                                                        transform: "translateY(-50%)",
                                                                        width: 0,
                                                                        height: 0,
                                                                        borderTop: "8px solid transparent",
                                                                        borderBottom: "8px solid transparent",
                                                                        borderRight: "8px solid #000",
                                                                    }}
                                                                ></div>

                                                                {["IV","IM","Oral","Tablets","Syrup","Capsules","Topical","Rectal","Vaginal","Sublingual","Eyes","Inhalation","Sub-Cuteneous","Intra-Dermal","ear","oral"].map(option => (
                                                                    <div
                                                                        key={option}
                                                                        onClick={() => {
                                                                            handleTreatmentPlanChange(index, 'route', option);
                                                                            setShowRouteDropdown(null);
                                                                        }}
                                                                        style={{
                                                                            padding: "6px 12px",
                                                                            cursor: "pointer",
                                                                            transition: "background 0.2s",
                                                                        }}
                                                                        onMouseEnter={e => (e.currentTarget.style.background = "#333")}
                                                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                                    >
                                                                        {option}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td style={cellStyle}>
                                                    <div className="drug-input-container">
                                                        <input
                                                            type="text"
                                                            value={row.drug}
                                                            onChange={e => handleDrugInputChange(index, e)}
                                                            onFocus={() => setFilteredSuggestions([])}
                                                            onClick={() => setActiveSuggestionIndex(index)}
                                                            onMouseEnter={(e) => {
                                                                if (row.drug) {
                                                                    const info = getDrugAdditionalInfo(row.drug);
                                                                    if (info) {
                                                                        showTooltip(info, e);
                                                                    }
                                                                }
                                                            }}
                                                            onMouseMove={(e) => {
                                                                if (row.drug && tooltip.visible) {
                                                                    showTooltip(getDrugAdditionalInfo(row.drug), e);
                                                                }
                                                            }}
                                                            onMouseLeave={hideTooltip}
                                                            list={`suggestions-list-${index}`}
                                                            style={{
                                                                border: stockInfo?.status === 'out-of-stock' ? '2px solid #dc3545' : '1px solid #ddd',
                                                                backgroundColor: stockInfo?.status === 'out-of-stock' ? '#fff5f5' : 'white'
                                                            }}
                                                        />
                                                        {renderDrugSuggestions(index)}
                                                        {stockInfo?.status === 'out-of-stock' && (
                                                            <FontAwesomeIcon 
                                                                icon={faExclamationTriangle} 
                                                                style={{ 
                                                                    color: '#dc3545', 
                                                                    marginLeft: '5px',
                                                                    cursor: 'help'
                                                                }}
                                                                title="This drug is out of stock"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={cellStyle}>
                                                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                                                        <input
                                                            type="text"
                                                            value={dosageInputs[index] || ''}
                                                            onChange={e => handleDosageInputChange(index, e.target.value)}
                                                            onFocus={() => setShowUnitDropdown(index)}
                                                            style={{ paddingRight: '30px', width: '100%' }}
                                                            onMouseEnter={(e) => {
                                                                if (row.drug && quantityInfo) {
                                                                    showTooltip(quantityInfo, e);
                                                                }
                                                            }}
                                                            onMouseMove={(e) => {
                                                                if (row.drug && quantityInfo && tooltip.visible) {
                                                                    showTooltip(quantityInfo, e);
                                                                }
                                                            }}
                                                            onMouseLeave={hideTooltip}
                                                        />
                                                        <span 
                                                            className="unit-dropdown-toggle"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowUnitDropdown(showUnitDropdown === index ? null : index);
                                                            }}
                                                        >
                                                            ▼
                                                        </span>
                                                        {showUnitDropdown === index && (
                                                            <div
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "50%",
                                                                    left: "100%",
                                                                    transform: "translateY(-50%)",
                                                                    zIndex: 10,
                                                                    background: "#000",
                                                                    color: "#fff",
                                                                    borderRadius: "6px",
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                                                    minWidth: "100px",
                                                                    padding: "8px 0",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "50%",
                                                                        left: "-8px",
                                                                        transform: "translateY(-50%)",
                                                                        width: 0,
                                                                        height: 0,
                                                                        borderTop: "8px solid transparent",
                                                                        borderBottom: "8px solid transparent",
                                                                        borderRight: "8px solid #000",
                                                                    }}
                                                                ></div>

                                                                {availableUnits.map((unit) => (
                                                                    <div
                                                                        key={unit}
                                                                        onClick={() => {
                                                                            handleUnitSelect(index, unit);
                                                                            setShowUnitDropdown(null);
                                                                        }}
                                                                        style={{
                                                                            padding: "6px 12px",
                                                                            cursor: "pointer",
                                                                            transition: "background 0.2s",
                                                                        }}
                                                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                                    >
                                                                        {unit}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={cellStyle}>
                                                    <select
                                                        value={row.frequency}
                                                        onChange={e => handleTreatmentPlanChange(index, 'frequency', e.target.value)}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="once a day for">Once a day for</option>
                                                        <option value="once noct for">Once Noct for</option>
                                                        <option value="twice daily for">Twice Daily for</option>
                                                        <option value="stat for">Stat for</option>
                                                        <option value="tds for">tds for</option>
                                                        <option value="OD">OD for</option>
                                                        <option value="BID (bis in die) for">BID </option>
                                                        <option value="noct for">noct for</option>
                                                        <option value="12 hourly for">12 Hourly for</option>
                                                        <option value="24 hourly for">24 Hourly for</option>
                                                        <option value="8 hourly for">8 Hourly for</option>
                                                        <option value="6 hourly for">6 Hourly for</option>
                                                        <option value="2 hourly for">2 Hourly for</option>
                                                        <option value="3 hourly for">3 Hourly for</option>
                                                        <option value="prn for">prn</option>
                                                        <option value="QD (quaque die) for">QD quaque die for</option>
                                                    </select>
                                                </td>
                                                <td style={cellStyle}>
                                                    <input
                                                        type="number"
                                                        value={row.duration}
                                                        onChange={e => handleTreatmentPlanChange(index, 'duration', e.target.value)}
                                                        placeholder="Enter duration number"
                                                    />
                                                    <select
                                                        value={row.durationUnit}
                                                        onChange={e => handleTreatmentPlanChange(index, 'durationUnit', e.target.value)}
                                                    >
                                                        <option value="">Select Duration Unit</option>
                                                        <option value="days">Days</option>
                                                        <option value="weeks">Weeks</option>
                                                        <option value="months">Months</option>
                                                        <option value="doses">Doses</option>
                                                        <option value="days in">Days in</option>
                                                        <option value="weeks in">Weeks in</option>
                                                        <option value="months in">Months in</option>
                                                        <option value="doses in">Doses in</option>
                                                        <option value="days then">Days then</option>
                                                        <option value="weeks then">Weeks then</option>
                                                        <option value="months then">Months then</option>
                                                        <option value="doses then">Doses then</option>
                                                    </select>
                                                </td>
                                                <td style={{ ...cellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        value={row.quantity || "0"}
                                                        onChange={e => handleDrugQuantityChange(index, e)}
                                                        placeholder="000"
                                                        style={{ 
                                                            marginBottom: '4px',
                                                            border: stockInfo?.status === 'out-of-stock' ? '2px solid #dc3545' : '1px solid #ddd',
                                                            backgroundColor: stockInfo?.status === 'out-of-stock' ? '#fff5f5' : 'white'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (row.drug && stockInfo) {
                                                                const message = stockInfo.status === 'out-of-stock' 
                                                                    ? `OUT OF STOCK - No ${row.packaging} available` 
                                                                    : `${stockInfo.available} ${row.packaging} available in stock`;
                                                                showTooltip(message, e);
                                                            }
                                                        }}
                                                        onMouseMove={(e) => {
                                                            if (row.drug && stockInfo && tooltip.visible) {
                                                                const message = stockInfo.status === 'out-of-stock' 
                                                                    ? `OUT OF STOCK - No ${row.packaging} available` 
                                                                    : `${stockInfo.available} ${row.packaging} available in stock`;
                                                                showTooltip(message, e);
                                                            }
                                                        }}
                                                        onMouseLeave={hideTooltip}
                                                    />
                                                    <span>{row.packaging}</span>
                                                    {rowPrice > 0 && (
                                                        <div 
                                                            style={{
                                                                marginTop: '4px',
                                                                backgroundColor: '#f0f0f0',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                border: '1px solid #ddd'
                                                            }}
                                                        >
                                                            {formatPrice(rowPrice)}
                                                        </div>
                                                    )}
                                                    {stockInfo && (
                                                        <div style={{
                                                            marginTop: '2px',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            color: stockInfo.status === 'out-of-stock' ? '#dc3545' : '#28a745',
                                                            textAlign: 'center'
                                                        }}>
                                                            {stockInfo.message}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ 
                                                    ...cellStyle, 
                                                    textAlign: 'right',
                                                    minWidth: '120px',
                                                    whiteSpace: 'nowrap',
                                                    position: 'sticky',
                                                    right: 0,
                                                    backgroundColor: 'white',
                                                    zIndex: 1
                                                }} className="row-actions">
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-end',
                                                        gap: '4px',
                                                        flexShrink: 0,
                                                    }}>
                                                        <style>
                                                        {`
                                                            @keyframes shake {
                                                                0% { transform: rotate(0deg); }
                                                                25% { transform: rotate(-15deg); }
                                                                50% { transform: rotate(15deg); }
                                                                75% { transform: rotate(-10deg); }
                                                                100% { transform: rotate(0deg); }
                                                            }
                                                        `}
                                                        </style>

                                                        <button
                                                            onClick={() => handleDeleteRow(index)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: window.innerWidth <= 768 ? '2px' : '4px',
                                                                width: window.innerWidth <= 768 ? '28px' : '36px',
                                                                height: window.innerWidth <= 768 ? '28px' : '36px',
                                                                minWidth: window.innerWidth <= 768 ? '28px' : '36px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: '6px',
                                                                flexShrink: 0,
                                                            }}
                                                            title="Delete Row"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                                size="2x"
                                                                style={{
                                                                    color: 'red',
                                                                    transition: 'color 0.2s',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.animation = 'shake 0.4s';
                                                                    e.currentTarget.style.color = '#cc0000';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.animation = 'none';
                                                                    e.currentTarget.style.color = 'red';
                                                                }}
                                                            />
                                                        </button>
                                                        
                                                        <button 
                                                            style={{ 
                                                                backgroundColor: '#28a745', 
                                                                color: 'white',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: window.innerWidth <= 768 ? '2px 4px' : '4px 8px',
                                                                fontSize: window.innerWidth <= 768 ? '11px' : '14px',
                                                                fontWeight: 'bold',
                                                                borderRadius: '4px',
                                                                width: window.innerWidth <= 768 ? '24px' : '28px',
                                                                height: window.innerWidth <= 768 ? '24px' : '28px',
                                                                minWidth: window.innerWidth <= 768 ? '24px' : '28px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'background-color 0.2s',
                                                                flexShrink: 0
                                                            }} 
                                                            className="add-button" 
                                                            onClick={() => handleAddRowWithAi(index)}
                                                            title="Add Row with AI Analysis"
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                                                        >
                                                            +
                                                        </button>
                                                        
                                                        <button 
                                                            style={{ 
                                                                backgroundColor: '#fd7e14', 
                                                                color: 'white',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: window.innerWidth <= 768 ? '2px 3px' : '4px 6px',
                                                                fontSize: window.innerWidth <= 768 ? '10px' : '12px',
                                                                fontWeight: 'bold',
                                                                borderRadius: '4px',
                                                                width: window.innerWidth <= 768 ? '24px' : '28px',
                                                                height: window.innerWidth <= 768 ? '24px' : '28px',
                                                                minWidth: window.innerWidth <= 768 ? '24px' : '28px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'background-color 0.2s',
                                                                flexShrink: 0
                                                            }} 
                                                            className="info-button" 
                                                            onClick={() => toggleInfoBlock(index)}
                                                            title="Additional Info"
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e8650e'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#fd7e14'}
                                                        >
                                                            ℹ
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {infoBlocks[index] && (
                                                <tr>
                                                    <td colSpan={7} style={cellStyle}>
                                                        <textarea
                                                            value={infoTexts[index] || ''}
                                                            onChange={e => handleInfoTextChange(index, e.target.value)}
                                                            placeholder="Additional information..."
                                                            style={{
                                                                width: '100%',
                                                                minHeight: '40px',
                                                                resize: 'vertical',
                                                                backgroundColor: '#ebe8e8',
                                                                fontFamily: 'Arial, sans-serif',
                                                                fontSize: '14px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                padding: '8px',
                                                                boxSizing: 'border-box',
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #000',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        textAlign: 'center',
                        color: '#000'
                    }}>
                        <div style={{ marginBottom: '10px' }}>
                            Expected Treatment Bill: {formatPrice(totalBill)}
                        </div>
                        {selectedProcedures.length > 0 && (
                            <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                                (Includes {selectedProcedures.length} procedure{selectedProcedures.length > 1 ? 's' : ''})
                            </div>
                        )}
                    </div>
                    
                    <div className="actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
                        <button 
                            className="add-row-button" 
                            onClick={() => handleAddRowWithAi(treatmentPlanRows.length - 1)} 
                            style={{ 
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '10px 15px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        >
                            +
                        </button>
    
                        <button 
                            onClick={handleTreatmentPlanSubmit} 
                            disabled={submitting} 
                            style={{ 
                                backgroundColor: submitting ? '#6c757d' : '#007bff',
                                color: 'white', 
                                border: 'none', 
                                padding: '10px 15px', 
                                borderRadius: '5px', 
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#0056b3')}
                            onMouseOut={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#007bff')}
                        >
                            {submitting ? 'Please wait...' : 'Update Treatment Plan'}
                        </button>
    
                        <button 
                            onClick={handleSeeBillClick} 
                            style={{ 
                                backgroundColor: '#17a2b8',
                                color: 'white', 
                                border: 'none', 
                                padding: '10px 15px', 
                                borderRadius: '5px', 
                                cursor: 'pointer', 
                                transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#138496')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#17a2b8')}
                        >
                            Draft Patient Treatment Bill
                        </button>
    
                        {showMedicalBillModal && (
                            <>
                                <div 
                                    className="medical-bill-modal-overlay" 
                                    onClick={() => safeSetState(setShowMedicalBillModal, false)} 
                                    style={{ 
                                        position: 'fixed', 
                                        top: 0, 
                                        left: 0, 
                                        right: 0, 
                                        bottom: 0, 
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        zIndex: 1000 
                                    }} 
                                />
                                <MedicalBillModal 
                                    token={token} 
                                    fileId={fileId} 
                                    billData={billData} 
                                    onClose={() => safeSetState(setShowMedicalBillModal, false)} 
                                />
                            </>
                        )}
    
                        <button 
                            className="btn btn-danger" 
                            onClick={handleCloseModal} 
                            style={{ 
                                backgroundColor: '#dc3545',
                                color: 'white', 
                                border: 'none', 
                                padding: '10px 15px', 
                                borderRadius: '5px', 
                                cursor: 'pointer', 
                                transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                        >
                            Close
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default TreatmentPlanModal;