import React, { useEffect, useState } from 'react';
import { urls } from './config.dev';

function MedicalBillModal({ fileId, billData, onClose, token }) {
    const [processedData, setProcessedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmingBill, setConfirmingBill] = useState(false);
    const [additionalRows, setAdditionalRows] = useState([]);
    const [drugSuggestions, setDrugSuggestions] = useState([]);
    const [existingBillData, setExistingBillData] = useState(null);
    const [activeTab, setActiveTab] = useState('current');
    const [procedures, setProcedures] = useState([]);

    // Format currency as UGX and round to nearest whole number
    const formatCurrency = (amount) => {
        const roundedAmount = Math.round(amount);
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
        }).format(roundedAmount);
    };

    // Round number to nearest whole number
    const roundNumber = (num) => {
        return Math.round(num);
    };

    // Prevent scroll wheel from changing input values
    const preventScrollWheelChange = (e) => {
        e.target.blur();
    };

    // Extract procedures from billData
    useEffect(() => {
        if (billData && Array.isArray(billData)) {
            const procedureItems = billData.filter(item => item.type === 'procedure');
            setProcedures(procedureItems.map(proc => ({
                id: proc.id || '',
                name: proc.name || '',
                price: roundNumber(parseFloat(proc.price) || 0),
                type: 'procedure'
            })));
        }
    }, [billData]);

    // Inline styles
    const styles = {
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px',
        },
        modalContainer: {
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        },
        modalHeader: {
            padding: '20px',
            borderBottom: '1px solid #eaeaea',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
        },
        modalHeading: {
            margin: 0,
            color: '#000000',
            fontSize: '1.5rem',
            fontWeight: '600',
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6c757d',
            fontWeight: 'bold',
            padding: '5px 10px',
        },
        modalContent: {
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
        },
        tabsContainer: {
            display: 'flex',
            borderBottom: '1px solid #dee2e6',
            marginBottom: '20px',
        },
        tabButton: {
            padding: '10px 20px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#495057',
            transition: 'all 0.2s ease',
        },
        activeTab: {
            borderBottom: '3px solid #007bff',
            color: '#007bff',
        },
        tableContainer: {
            overflowX: 'auto',
            marginBottom: '20px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        tableHeader: {
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid #dee2e6',
        },
        tableHeaderCell: {
            padding: '12px 15px',
            textAlign: 'left',
            fontWeight: '600',
            color: '#000000',
            fontSize: '0.9rem',
        },
        tableCell: {
            padding: '12px 15px',
            borderTop: '1px solid #dee2e6',
            verticalAlign: 'top',
        },
        input: {
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
        },
        paymentWarning: {
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '12px 15px',
            marginBottom: '20px',
            color: '#856404',
        },
        paidAmount: {
            fontWeight: 'bold',
            color: '#d63384',
        },
        billSummary: {
            backgroundColor: '#e9ecef',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
        },
        noBillMessage: {
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
            fontSize: '1.1rem',
        },
        totalBill: {
            textAlign: 'right',
            margin: '20px 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#000000',
        },
        actionButtons: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
        },
        button: {
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
        },
        confirmButton: {
            backgroundColor: '#28a745',
            color: 'white',
        },
        confirmButtonHover: {
            backgroundColor: '#218838',
        },
        printButton: {
            backgroundColor: '#17a2b8',
            color: 'white',
        },
        printButtonHover: {
            backgroundColor: '#138496',
        },
        addButton: {
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '8px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
        },
        errorContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#dc3545',
            fontSize: '1.1rem',
        },
        currentBillSummary: {
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            border: '1px solid #dee2e6',
        },
        summaryRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
        },
        summaryLabel: {
            fontWeight: '500',
        },
        summaryValue: {
            fontWeight: '600',
        },
        totalRow: {
            borderTop: '2px solid #dee2e6',
            paddingTop: '8px',
            marginTop: '8px',
        },
        proceduresSection: {
            margin: '20px 0',
            borderTop: '2px solid #dee2e6',
            paddingTop: '20px',
        },
        proceduresHeader: {
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#000000',
        },
        sectionHeader: {
            fontSize: '1.2rem',
            fontWeight: '600',
            margin: '20px 0 15px 0',
            color: '#000000',
            borderBottom: '2px solid #dee2e6',
            paddingBottom: '8px',
        },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const existingResponse = await fetch(urls.fetchdetailedbill, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileId, token }),
                });

                if (!existingResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const existingData = await existingResponse.json();
                
                if (typeof existingData === 'string' && existingData.includes("no bill yet")) {
                    setExistingBillData(null);
                } else if (existingData.success) {
                    setExistingBillData(existingData);
                }
                
                const processedResponse = await fetch(urls.calculatebill, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileId, billData }),
                });

                if (!processedResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const processedData = await processedResponse.json();
                setProcessedData(processedData);
                
                const drugResponse = await fetch(urls.fetchoriginaldrugs, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token }),
                });
                
                if (drugResponse.ok) {
                    const drugData = await drugResponse.json();
                    setDrugSuggestions(drugData);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fileId, billData, token]);

    const handleAddRow = () => {
        const defaultRow = { 
            drug: '', 
            packaging: '', 
            unitPrice: 0, 
            quantity: 0, 
            totalPrice: 0
        };
        setAdditionalRows([...additionalRows, { ...defaultRow }]);
    };

    const handleDrugChange = (index, value) => {
        const newRows = [...additionalRows];
        newRows[index].drug = value;
        
        // Auto-fill drug details if selected from datalist
        const selectedDrug = drugSuggestions.find(drug => 
            drug.drug_name === value
        );
        
        if (selectedDrug) {
            newRows[index].packaging = selectedDrug.packaging;
            newRows[index].unitPrice = roundNumber(parseFloat(selectedDrug.selling_price) || 0);
            
            if (newRows[index].quantity > 0) {
                newRows[index].totalPrice = roundNumber(newRows[index].unitPrice * newRows[index].quantity);
            }
        }
        
        setAdditionalRows(newRows);
    };

    const handleQuantityChange = (index, value) => {
        const newRows = [...additionalRows];
        newRows[index].quantity = parseInt(value) || 0;
        
        if (newRows[index].unitPrice > 0) {
            newRows[index].totalPrice = roundNumber(newRows[index].unitPrice * newRows[index].quantity);
        }
        
        setAdditionalRows(newRows);
    };

    const handleUnitPriceChange = (index, value) => {
        const newRows = [...additionalRows];
        newRows[index].unitPrice = roundNumber(parseFloat(value) || 0);
        
        if (newRows[index].quantity > 0) {
            newRows[index].totalPrice = roundNumber(newRows[index].unitPrice * newRows[index].quantity);
        }
        
        setAdditionalRows(newRows);
    };

    // Handle unit price change for processed data drugs
    const handleProcessedUnitPriceChange = (index, value) => {
        if (!processedData || !Array.isArray(processedData.bill)) return;
        
        const newProcessedData = { ...processedData };
        const newBill = [...newProcessedData.bill];
        
        newBill[index].unitPrice = roundNumber(parseFloat(value) || 0);
        
        if (newBill[index].quantity > 0) {
            newBill[index].totalPrice = roundNumber(newBill[index].unitPrice * newBill[index].quantity);
        }
        
        newProcessedData.bill = newBill;
        setProcessedData(newProcessedData);
    };

    const handleProcedurePriceChange = (index, value) => {
        const newProcedures = [...procedures];
        // Allow empty value (set to 0 if empty)
        newProcedures[index].price = value === '' ? 0 : roundNumber(parseFloat(value) || 0);
        setProcedures(newProcedures);
    };

    const getNewBillItems = () => {
        const processedItems = processedData && Array.isArray(processedData.bill) 
            ? processedData.bill
                .filter(item => item.drug && item.quantity > 0)
                .map(item => ({
                    drug: item.drug || "",
                    packaging: item.packaging || "",
                    unitPrice: roundNumber(item.unitPrice || 0),
                    quantity: item.quantity || 0,
                    totalPrice: roundNumber(item.totalPrice || 0),
                    type: 'drug'
                }))
            : [];
            
        const additionalItems = additionalRows
            .filter(row => row.drug && row.quantity > 0)
            .map(row => ({
                drug: row.drug || "",
                packaging: row.packaging || "",
                unitPrice: roundNumber(row.unitPrice || 0),
                quantity: row.quantity || 0,
                totalPrice: roundNumber(row.totalPrice || 0),
                type: 'drug'
            }));

        const procedureItems = procedures
            .filter(proc => proc.name && proc.price > 0)
            .map(proc => ({
                id: proc.id || "",
                name: proc.name || "",
                price: roundNumber(proc.price || 0),
                type: 'procedure'
            }));
        
        return [...processedItems, ...additionalItems, ...procedureItems];
    };

    const calculateNewTotalBill = () => {
        const allItems = getNewBillItems();
        let totalBill = allItems.reduce((acc, item) => {
            if (item.type === 'drug') {
                return acc + item.totalPrice;
            } else if (item.type === 'procedure') {
                return acc + item.price;
            }
            return acc;
        }, 0);
        totalBill = roundNumber(totalBill);
        return totalBill > 0 ? totalBill : 0;
    };

    const calculateCurrentBillTotals = () => {
        if (!existingBillData) {
            return { 
                drugsSubtotal: 0, 
                servicesSubtotal: 0, 
                totalPaid: 0, 
                discount: 0, 
                total: 0 
            };
        }
        
        // Calculate drugs subtotal
        const drugsSubtotal = existingBillData.rxbills && existingBillData.rxbills.length > 0
            ? existingBillData.rxbills.reduce((acc, bill) => 
                acc + roundNumber(parseFloat(bill.total_price || 0)), 0)
            : 0;
        
        // Calculate services subtotal
        const servicesSubtotal = existingBillData.service_payments && existingBillData.service_payments.length > 0
            ? existingBillData.service_payments.reduce((acc, service) => 
                acc + roundNumber(parseFloat(service.total_bill || 0)), 0)
            : 0;
        
        // Calculate total paid so far (sum of amount_paid_sofar for all services)
        const totalPaid = existingBillData.service_payments && existingBillData.service_payments.length > 0
            ? existingBillData.service_payments.reduce((acc, service) => 
                acc + roundNumber(parseFloat(service.amount_paid_sofar || 0)), 0)
            : 0;
        
        // Get discount (from drugs) - always 0 now
        const discount = 0;
        
        // Calculate total bill
        const total = roundNumber(drugsSubtotal + servicesSubtotal - discount);
        
        return { drugsSubtotal, servicesSubtotal, totalPaid, discount, total };
    };

    const handleConfirmBill = async () => {
        const totalBill = calculateNewTotalBill();
        if (totalBill <= 0) {
            alert("Total bill must be greater than zero. Please review the bill details.");
            return;
        }

        if (window.confirm("Make sure you and the patient have agreed on the payment. By clicking continue you confirm that the patient is willing to foot this bill.")) {
            setConfirmingBill(true);
            try {
                const response = await fetch(urls.confirmbill2, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileId,
                        totalBill,
                        discount: 0, // Always include discount as 0
                        billItems: getNewBillItems(),
                        token
                    }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const responseData = await response.json();
                
                if (responseData.message === "Bill data saved successfully and points updated") {
                    alert("Bill confirmed successfully! Points have been updated.");
                    onClose();
                } else {
                    alert("Bill confirmed successfully!");
                    onClose();
                }

            } catch (error) {
                console.error(error);
                alert("Failed to confirm bill. Please try again.");
            } finally {
                setConfirmingBill(false);
            }
        }
    };

    const getCurrentBillItems = () => {
        const items = [];
        
        // Add medications from current bill
        if (existingBillData.rxbills && existingBillData.rxbills.length > 0) {
            existingBillData.rxbills.forEach(bill => {
                items.push({
                    drug: bill.drug || "",
                    packaging: bill.packaging || "",
                    unitPrice: roundNumber(parseFloat(bill.unit_price) || 0),
                    quantity: parseInt(bill.quantity) || 0,
                    totalPrice: roundNumber(parseFloat(bill.total_price) || 0),
                    type: 'drug'
                });
            });
        }
        
        // Add services from current bill as procedures
        if (existingBillData.service_payments && existingBillData.service_payments.length > 0) {
            existingBillData.service_payments.forEach(service => {
                items.push({
                    id: service.id || "",
                    name: service.service_name || "",
                    price: roundNumber(parseFloat(service.total_bill) || 0),
                    type: 'procedure'
                });
            });
        }
        
        return items;
    };

    // Modify the handlePrintBill function
    const handlePrintBill = async (billType) => {
        let payload;
        
        if (billType === 'current') {
            // Prepare payload for current bill
            const currentTotals = calculateCurrentBillTotals();
            payload = {
                fileId,
                discount: 0, // Always 0
                totalBill: currentTotals.total,
                billItems: getCurrentBillItems(),
                token,
                billType: 'current'
            };
        } else {
            // Prepare payload for new bill
            payload = {
                fileId,
                discount: 0, // Always 0
                totalBill: calculateNewTotalBill(),
                billItems: getNewBillItems(),
                token,
                billType: 'new'
            };
        }

        try {
            const response = await fetch(urls.printbill, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to generate the bill');
            }

            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            window.open(pdfUrl, '_blank');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to print the bill. Please try again.');
        }
    };

    if (loading) {
        return (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContainer}>
                    <div style={styles.loadingContainer}>
                        Loading bill information...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContainer}>
                    <div style={styles.errorContainer}>
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalHeading}>Medical Bill for File ID: {fileId}</h2>
                    <button style={styles.closeButton} onClick={onClose}>&#10005;</button>
                </div>
                
                <div style={styles.modalContent}>
                    <div style={styles.tabsContainer}>
                        <button 
                            style={{...styles.tabButton, ...(activeTab === 'current' ? styles.activeTab : {})}}
                            onClick={() => setActiveTab('current')}
                        >
                            Current Bill
                        </button>
                        <button 
                            style={{...styles.tabButton, ...(activeTab === 'new' ? styles.activeTab : {})}}
                            onClick={() => setActiveTab('new')}
                        >
                            New Bill
                        </button>
                    </div>
                    
                    {activeTab === 'current' ? (
                        <div>
                            {existingBillData ? (
                                <>
                                    {existingBillData.bill_totals && existingBillData.bill_totals.amount_paid > 0 && (
                                        <div style={styles.paymentWarning}>
                                            Remember this patient already paid <span style={styles.paidAmount}>{formatCurrency(existingBillData.bill_totals.amount_paid)}</span>
                                        </div>
                                    )}
                                    
                                    {/* Display Medications */}
                                    {existingBillData.rxbills && existingBillData.rxbills.length > 0 && (
                                        <>
                                            <h3 style={styles.sectionHeader}>Medications</h3>
                                            <div style={styles.tableContainer}>
                                                <table style={styles.table}>
                                                    <thead style={styles.tableHeader}>
                                                        <tr>
                                                            <th style={styles.tableHeaderCell}>Drug</th>
                                                            <th style={styles.tableHeaderCell}>Packaging</th>
                                                            <th style={styles.tableHeaderCell}>Unit Price</th>
                                                            <th style={styles.tableHeaderCell}>Quantity</th>
                                                            <th style={styles.tableHeaderCell}>Total Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {existingBillData.rxbills.map((bill, index) => (
                                                            <tr key={index}>
                                                                <td style={styles.tableCell}>{bill.drug}</td>
                                                                <td style={styles.tableCell}>{bill.packaging}</td>
                                                                <td style={styles.tableCell}>{formatCurrency(bill.unit_price)}</td>
                                                                <td style={styles.tableCell}>{bill.quantity}</td>
                                                                <td style={styles.tableCell}>{formatCurrency(bill.total_price)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Display Services */}
                                    {existingBillData.service_payments && existingBillData.service_payments.length > 0 && (
                                        <>
                                            <h3 style={styles.sectionHeader}>Services</h3>
                                            <div style={styles.tableContainer}>
                                                <table style={styles.table}>
                                                    <thead style={styles.tableHeader}>
                                                        <tr>
                                                            <th style={styles.tableHeaderCell}>Service Name</th>
                                                            <th style={styles.tableHeaderCell}>Total Bill</th>
                                                            <th style={styles.tableHeaderCell}>Amount Paid So Far</th>
                                                            <th style={styles.tableHeaderCell}>Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {existingBillData.service_payments.map((service, index) => (
                                                            <tr key={index}>
                                                                <td style={styles.tableCell}>{service.service_name}</td>
                                                                <td style={styles.tableCell}>{formatCurrency(service.total_bill)}</td>
                                                                <td style={styles.tableCell}>{formatCurrency(service.amount_paid_sofar)}</td>
                                                                <td style={styles.tableCell}>{formatCurrency(service.balance)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div style={styles.currentBillSummary}>
                                        {existingBillData.rxbills && existingBillData.rxbills.length > 0 && (
                                            <div style={styles.summaryRow}>
                                                <span style={styles.summaryLabel}>Medications Subtotal:</span>
                                                <span style={styles.summaryValue}>{formatCurrency(calculateCurrentBillTotals().drugsSubtotal)}</span>
                                            </div>
                                        )}
                                        
                                        {existingBillData.service_payments && existingBillData.service_payments.length > 0 && (
                                            <div style={styles.summaryRow}>
                                                <span style={styles.summaryLabel}>Services Subtotal:</span>
                                                <span style={styles.summaryValue}>{formatCurrency(calculateCurrentBillTotals().servicesSubtotal)}</span>
                                            </div>
                                        )}
                                        
                                        <div style={{...styles.summaryRow, ...styles.totalRow}}>
                                            <span style={styles.summaryLabel}>Total Bill:</span>
                                            <span style={styles.summaryValue}>{formatCurrency(calculateCurrentBillTotals().total)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* ADD PRINT BUTTON FOR CURRENT BILL */}
                                    <div style={styles.actionButtons}>
                                        <button 
                                            style={{...styles.button, ...styles.printButton}}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = styles.printButtonHover.backgroundColor;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = styles.printButton.backgroundColor;
                                            }}
                                            onClick={() => handlePrintBill('current')}
                                        >
                                            Print Current Bill
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={styles.noBillMessage}>
                                    No bill yet for this file
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {existingBillData && existingBillData.bill_totals && existingBillData.bill_totals.amount_paid > 0 && (
                                <div style={styles.paymentWarning}>
                                    Remember this patient already paid <span style={styles.paidAmount}>{formatCurrency(existingBillData.bill_totals.amount_paid)}</span>
                                </div>
                            )}
                            
                            <div style={styles.tableContainer}>
                                <table style={styles.table}>
                                    <thead style={styles.tableHeader}>
                                        <tr>
                                            <th style={styles.tableHeaderCell}>Drug</th>
                                            <th style={styles.tableHeaderCell}>Packaging</th>
                                            <th style={styles.tableHeaderCell}>Unit Price (UGX)</th>
                                            <th style={styles.tableHeaderCell}>Quantity</th>
                                            <th style={styles.tableHeaderCell}>Total Price (UGX)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedData && Array.isArray(processedData.bill) && processedData.bill
                                            .filter(item => item.drug && item.quantity > 0)
                                            .map((item, index) => (
                                            <tr key={index}>
                                                <td style={styles.tableCell}>{item.drug}</td>
                                                <td style={styles.tableCell}>{item.packaging}</td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={roundNumber(item.unitPrice)} 
                                                        onChange={(e) => handleProcessedUnitPriceChange(index, e.target.value)}
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        readOnly
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={roundNumber(item.totalPrice)} 
                                                        readOnly
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {additionalRows.map((row, index) => (
                                            <tr key={index + (processedData?.bill?.length || 0)}>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        value={row.drug} 
                                                        onChange={(e) => handleDrugChange(index, e.target.value)}
                                                        list={`drugSuggestions-${index}`}
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                    <datalist id={`drugSuggestions-${index}`}>
                                                        {drugSuggestions.map((drug, i) => (
                                                            <option key={i} value={drug.drug_name}>
                                                                {drug.packaging} - {formatCurrency(drug.selling_price)}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        value={row.packaging} 
                                                        onChange={(e) => {
                                                            const newRows = [...additionalRows];
                                                            newRows[index].packaging = e.target.value;
                                                            setAdditionalRows(newRows);
                                                        }}
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={row.unitPrice === 0 ? '' : row.unitPrice}
                                                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={row.quantity === 0 ? '' : row.quantity}
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                                <td style={styles.tableCell}>
                                                    <input 
                                                        style={styles.input} 
                                                        type="number" 
                                                        value={roundNumber(row.totalPrice)} 
                                                        readOnly
                                                        onWheel={preventScrollWheelChange}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <button style={styles.addButton} onClick={handleAddRow}>+ Add Drug</button>
                            
                            {procedures.length > 0 && (
                                <div style={styles.proceduresSection}>
                                    <h3 style={styles.proceduresHeader}>Procedures</h3>
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table}>
                                            <thead style={styles.tableHeader}>
                                                <tr>
                                                    <th style={styles.tableHeaderCell}>Procedure Name</th>
                                                    <th style={styles.tableHeaderCell}>Price (UGX)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {procedures.map((procedure, index) => (
                                                    <tr key={index}>
                                                        <td style={styles.tableCell}>{procedure.name}</td>
                                                        <td style={styles.tableCell}>
                                                            <input 
                                                                style={styles.input} 
                                                                type="number" 
                                                                value={procedure.price === 0 ? '' : procedure.price}
                                                                onChange={(e) => handleProcedurePriceChange(index, e.target.value)}
                                                                onWheel={preventScrollWheelChange}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            <div style={styles.totalBill}>
                                <h3>Total Bill: {formatCurrency(calculateNewTotalBill())}</h3>
                            </div>
                            
                            <div style={styles.actionButtons}>
                                <button 
                                    style={{...styles.button, ...styles.confirmButton}}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = styles.confirmButtonHover.backgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = styles.confirmButton.backgroundColor;
                                    }}
                                    onClick={handleConfirmBill} 
                                    disabled={confirmingBill}
                                >
                                    {confirmingBill ? "Confirming Bill..." : "Confirm Bill"}
                                </button>
                               
                                {/* MODIFY THE PRINT BUTTON FOR NEW BILL */}
                                <button 
                                    style={{...styles.button, ...styles.printButton}}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = styles.printButtonHover.backgroundColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = styles.printButton.backgroundColor;
                                    }}
                                    onClick={() => handlePrintBill('new')}
                                >
                                    Print Bill
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MedicalBillModal;