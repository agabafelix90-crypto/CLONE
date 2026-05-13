import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';

const BillingInvoiceModal = ({ fileId, token, date, opdNo, contactId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const [billingData, setBillingData] = useState(null);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (fileId && token) {
            fetchBillingData();
        }
    }, [fileId, token]);

    useEffect(() => {
        if (billingData) {
            const totals = calculateTotals();
            if (totals.total === 0) {
                setStatusMessage('File has no bill yet');
            } else if (totals.unpaid === 0 && totals.total > 0) {
                setStatusMessage('Bill fully cleared');
            } else {
                setStatusMessage('');
            }
        }
    }, [billingData]);

    const fetchBillingData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(urls.fileInvoice, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    fileId: fileId,
                    token: token
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setBillingData(data.data[0]);
            } else {
                throw new Error('Failed to fetch billing data');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintInvoice = async () => {
        if (!billingData) return;
        
        setPrintLoading(true);
        try {
            const response = await fetch(urls.printinvoice2, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId: fileId,
                    token: token,
                    date: date,
                    opdNo: opdNo,
                    contactId: contactId,
                    billingData: billingData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
            console.error('Error printing invoice:', err);
        } finally {
            setPrintLoading(false);
        }
    };
const calculateTotals = () => {
    if (!billingData) return { paid: 0, unpaid: 0, total: 0 };
    
    const consultationPaid = billingData.consultation?.paid || 0;
    const consultationUnpaid = billingData.consultation?.unpaid || 0;
    
    const labPaid = billingData.lab_investigations?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const labUnpaid = billingData.lab_investigations?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    
    const radiologyPaid = billingData.radiology_investigations?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    const radiologyUnpaid = billingData.radiology_investigations?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid) || 0), 0) || 0;
    
    const servicesPaidFromPaid = billingData.services?.paid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid_sofar) || 0), 0) || 0;
    const servicesPaidFromUnpaid = billingData.services?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.amount_paid_sofar) || 0), 0) || 0;
    const servicesPaid = servicesPaidFromPaid + servicesPaidFromUnpaid;
    
    const servicesUnpaid = billingData.services?.unpaid?.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0) || 0;
    
    // FIXED: Properly include treatment payments
    const treatmentPaid = parseFloat(billingData.treatment?.amount_paid) || 0;
    const treatmentUnpaid = parseFloat(billingData.treatment?.balance) || 0;
    
    // Also include the total_balance from the root level if it exists
    const totalBalanceFromRoot = parseFloat(billingData.total_balance) || 0;
    
    const paid = consultationPaid + labPaid + radiologyPaid + servicesPaid + treatmentPaid;
    const unpaid = consultationUnpaid + labUnpaid + radiologyUnpaid + servicesUnpaid + treatmentUnpaid;
    
    // Use the root total_balance if it's more accurate, otherwise calculate
    const total = totalBalanceFromRoot > 0 ? (paid + totalBalanceFromRoot) : (paid + unpaid);
    
    return {
        paid,
        unpaid: totalBalanceFromRoot > 0 ? totalBalanceFromRoot : unpaid,
        total
    };
};
    // Check if a section has data
    const hasConsultationData = () => {
        return billingData && billingData.consultation && 
               (billingData.consultation.paid > 0 || 
                billingData.consultation.unpaid > 0 ||
                (billingData.consultation.details && billingData.consultation.details.length > 0));
    };

    const hasLabData = () => {
        return billingData && billingData.lab_investigations && 
               (billingData.lab_investigations.paid?.length > 0 || 
                billingData.lab_investigations.unpaid?.length > 0);
    };

    const hasRadiologyData = () => {
        return billingData && billingData.radiology_investigations && 
               (billingData.radiology_investigations.paid?.length > 0 || 
                billingData.radiology_investigations.unpaid?.length > 0);
    };

    const hasServicesData = () => {
        return billingData && billingData.services && 
               (billingData.services.paid?.length > 0 || 
                billingData.services.unpaid?.length > 0);
    };

  const hasTreatmentData = () => {
    return billingData && billingData.treatment && 
           (parseFloat(billingData.treatment.amount_paid) > 0 || 
            parseFloat(billingData.treatment.balance) > 0 ||
            parseFloat(billingData.treatment.total_bill) > 0 ||
            (billingData.treatment.details && billingData.treatment.details.length > 0));
};

    // Inline styles
    const styles = {
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        modalContent: {
            background: 'white',
            borderRadius: '8px',
            width: '900px',
            maxWidth: '95%',
            maxHeight: '95%',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        modalHeaderH2: {
            margin: 0,
            fontSize: '1.5rem',
            color: '#2c3e50',
            fontWeight: '600',
        },
        statusBadge: {
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            backgroundColor: '#28a745',
            color: 'white',
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '5px 10px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
        },
        closeButtonHover: {
            backgroundColor: '#e9ecef',
        },
        modalBody: {
            padding: '24px',
        },
        modalFooter: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e0e0e0',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
        },
        btnPrimary: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
        },
        btnSecondary: {
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
        },
        btnSuccess: {
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
        },
        disabledButton: {
            opacity: 0.65,
            cursor: 'not-allowed',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            color: '#6c757d',
        },
        errorContainer: {
            padding: '16px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#721c24',
        },
        section: {
            marginBottom: '28px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        },
        sectionHeader: {
            backgroundColor: '#e9ecef',
            padding: '14px 20px',
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '500',
            borderBottom: '1px solid #dee2e6',
            color: '#212529',
        },
        sectionContent: {
            padding: '20px',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '16px',
            fontSize: '0.95rem',
            tableLayout: 'fixed',
        },
        tableHeader: {
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderBottom: '2px solid #dee2e6',
            textAlign: 'left',
            fontWeight: '600',
            color: '#212529',
        },
        tableCell: {
            padding: '12px',
            borderBottom: '1px solid #dee2e6',
            textAlign: 'left',
            verticalAlign: 'top',
            wordWrap: 'break-word',
        },
        tableRow: {
            transition: 'background-color 0.15s',
        },
        tableRowHover: {
            backgroundColor: '#f8f9fa',
        },
        amountCell: {
            textAlign: 'right',
            fontFamily: 'monospace',
            fontWeight: '500',
        },
        totalRow: {
            fontWeight: '600',
            backgroundColor: '#f8f9fa',
        },
        summaryContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginTop: '28px',
        },
        summaryBox: {
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        },
        summaryPaid: {
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
        },
        summaryUnpaid: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
        },
        summaryTotal: {
            backgroundColor: '#cce5ff',
            color: '#004085',
            border: '1px solid #b8daff',
        },
        summaryLabel: {
            fontSize: '0.95rem',
            fontWeight: '500',
            marginBottom: '8px',
        },
        summaryValue: {
            fontSize: '1.6rem',
            fontWeight: '700',
            margin: '0',
        },
        subsectionHeader: {
            fontSize: '1.1rem',
            fontWeight: '500',
            margin: '20px 0 12px 0',
            color: '#212529',
            paddingBottom: '8px',
            borderBottom: '1px solid #dee2e6',
        },
        // Column width styles
        colName: {
            width: '40%',
        },
        colAmount: {
            width: '20%',
        },
        colStatus: {
            width: '20%',
        },
        colDate: {
            width: '20%',
        },
        colDrug: {
            width: '30%',
        },
        colPackaging: {
            width: '20%',
        },
        colUnitPrice: {
            width: '15%',
        },
        colQuantity: {
            width: '10%',
        },
        colTotalPrice: {
            width: '15%',
        },
        colServiceName: {
            width: '40%',
        },
        colTotalBill: {
            width: '20%',
        },
        colBalance: {
            width: '20%',
        },
    };

    const totals = calculateTotals();
    const [hoverClose, setHoverClose] = useState(false);
    const [hoverRow, setHoverRow] = useState(null);

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalHeaderH2}>Billing Invoice</h2>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                        {statusMessage && (
                            <span style={styles.statusBadge}>
                                {statusMessage}
                            </span>
                        )}
                        <button 
                            style={{
                                ...styles.closeButton,
                                ...(hoverClose ? styles.closeButtonHover : {})
                            }} 
                            onClick={onClose}
                            onMouseEnter={() => setHoverClose(true)}
                            onMouseLeave={() => setHoverClose(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
                
                <div style={styles.modalBody}>
                    {error && (
                        <div style={styles.errorContainer}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    
                    {loading ? (
                        <div style={styles.loadingContainer}>
                            <p>Loading billing data...</p>
                        </div>
                    ) : billingData ? (
                        <>
                            {/* Consultation Section - Only show if has data */}
                            {hasConsultationData() && (
                                <div style={styles.section}>
                                    <h3 style={styles.sectionHeader}>Consultation</h3>
                                    <div style={styles.sectionContent}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{...styles.tableHeader, ...styles.colDate}}>Date</th>
                                                    <th style={{...styles.tableHeader, ...styles.colAmount}}>Amount (UGX)</th>
                                                    <th style={{...styles.tableHeader, ...styles.colStatus}}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billingData.consultation.details.map((item, index) => (
                                                    <tr 
                                                        key={index} 
                                                        style={{
                                                            ...styles.tableRow,
                                                            ...(hoverRow === `consultation-${index}` ? styles.tableRowHover : {})
                                                        }}
                                                        onMouseEnter={() => setHoverRow(`consultation-${index}`)}
                                                        onMouseLeave={() => setHoverRow(null)}
                                                    >
                                                        <td style={{...styles.tableCell, ...styles.colDate}}>
                                                            {item.date || 'N/A'}
                                                        </td>
                                                        <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                            {parseFloat(item.amount || 0).toLocaleString()} 
                                                        </td>
                                                        <td style={{...styles.tableCell, ...styles.colStatus}}>
                                                            <span style={{
                                                                ...styles.statusBadge,
                                                                backgroundColor: item.status === 'paid' ? '#28a745' : '#dc3545',
                                                                fontSize: '0.8rem',
                                                                padding: '4px 10px',
                                                            }}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                               
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Lab Investigations Section - Only show if has data */}
                            {hasLabData() && (
                                <div style={styles.section}>
                                    <h3 style={styles.sectionHeader}>Lab Investigations</h3>
                                    <div style={styles.sectionContent}>
                                        {billingData.lab_investigations.paid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Paid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colName}}>Test Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount (UGX)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.lab_investigations.paid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `lab-paid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`lab-paid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colName}}>{item.test_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}

                                        {billingData.lab_investigations.unpaid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Unpaid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colName}}>Test Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount (UGX)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.lab_investigations.unpaid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `lab-unpaid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`lab-unpaid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colName}}>{item.test_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Radiology Investigations Section - Only show if has data */}
                            {hasRadiologyData() && (
                                <div style={styles.section}>
                                    <h3 style={styles.sectionHeader}>Radiology Investigations</h3>
                                    <div style={styles.sectionContent}>
                                        {billingData.radiology_investigations.paid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Paid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colName}}>Exam Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount (UGX)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.radiology_investigations.paid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `radiology-paid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`radiology-paid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colName}}>{item.exam_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}

                                        {billingData.radiology_investigations.unpaid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Unpaid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colName}}>Exam Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount (UGX)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.radiology_investigations.unpaid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `radiology-unpaid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`radiology-unpaid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colName}}>{item.exam_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Services Section - Only show if has data */}
                            {hasServicesData() && (
                                <div style={styles.section}>
                                    <h3 style={styles.sectionHeader}>Services</h3>
                                    <div style={styles.sectionContent}>
                                        {billingData.services.paid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Paid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colServiceName}}>Service Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount (UGX)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.services.paid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `services-paid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`services-paid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colServiceName}}>{item.service_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid_sofar || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}

                                        {billingData.services.unpaid.length > 0 && (
                                            <>
                                                <h4 style={styles.subsectionHeader}>Unpaid</h4>
                                                <table style={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{...styles.tableHeader, ...styles.colServiceName}}>Service Name</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colTotalBill}}>Total Bill</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colAmount}}>Amount Paid</th>
                                                            <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colBalance}}>Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingData.services.unpaid.map((item, index) => (
                                                            <tr 
                                                                key={index}
                                                                style={{
                                                                    ...styles.tableRow,
                                                                    ...(hoverRow === `services-unpaid-${index}` ? styles.tableRowHover : {})
                                                                }}
                                                                onMouseEnter={() => setHoverRow(`services-unpaid-${index}`)}
                                                                onMouseLeave={() => setHoverRow(null)}
                                                            >
                                                                <td style={{...styles.tableCell, ...styles.colServiceName}}>{item.service_name}</td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colTotalBill}}>
                                                                    {parseFloat(item.total_bill || 0).toLocaleString()} 
                                                                </td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colAmount}}>
                                                                    {parseFloat(item.amount_paid_sofar || 0).toLocaleString()} 
                                                                </td>
                                                                <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colBalance}}>
                                                                    {parseFloat(item.balance || 0).toLocaleString()} 
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Treatment Section - Only show if has data */}
                         {/* Treatment Section - Only show if has data */}
{hasTreatmentData() && (
    <div style={styles.section}>
        <h3 style={styles.sectionHeader}>Treatment</h3>
        <div style={styles.sectionContent}>
            {/* ADD THIS SUMMARY ROW FOR TREATMENT PAYMENTS */}
            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                <strong>Treatment Summary:</strong> 
                Total Bill: {parseFloat(billingData.treatment?.total_bill || 0).toLocaleString()} UGX | 
                Amount Paid: {parseFloat(billingData.treatment?.amount_paid || 0).toLocaleString()} UGX | 
                Balance: {parseFloat(billingData.treatment?.balance || 0).toLocaleString()} UGX
            </div>
            
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.tableHeader, ...styles.colDrug}}>Drug</th>
                        <th style={{...styles.tableHeader, ...styles.colPackaging}}>Packaging</th>
                        <th style={{...styles.tableHeader, ...styles.colQuantity}}>Quantity</th>
                        <th style={{...styles.tableHeader, ...styles.amountCell, ...styles.colTotalPrice}}>Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    {billingData.treatment.details.map((item, index) => (
                        <tr 
                            key={index}
                            style={{
                                ...styles.tableRow,
                                ...(hoverRow === `treatment-${index}` ? styles.tableRowHover : {})
                            }}
                            onMouseEnter={() => setHoverRow(`treatment-${index}`)}
                            onMouseLeave={() => setHoverRow(null)}
                        >
                            <td style={{...styles.tableCell, ...styles.colDrug}}>{item.drug}</td>
                            <td style={{...styles.tableCell, ...styles.colPackaging}}>{item.packaging}</td>
                            <td style={{...styles.tableCell, ...styles.colQuantity}}>{item.quantity}</td>
                            <td style={{...styles.tableCell, ...styles.amountCell, ...styles.colTotalPrice}}>
                                {parseFloat(item.total_price || 0).toLocaleString()} 
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}

                            {/* Summary Section - Always show if there's any data */}
                            {(hasConsultationData() || hasLabData() || hasRadiologyData() || hasServicesData() || hasTreatmentData()) && (
                              <div style={styles.summaryContainer}>
    <div style={{...styles.summaryBox, ...styles.summaryTotal}}>
        <div style={styles.summaryLabel}>Total Bill</div>
        <div style={styles.summaryValue}>{totals.total.toLocaleString()} UGX</div>
    </div>
    <div style={{...styles.summaryBox, ...styles.summaryPaid}}>
        <div style={styles.summaryLabel}>Amount Paid</div>
        <div style={styles.summaryValue}>{totals.paid.toLocaleString()} UGX</div>
    </div>
    <div style={{...styles.summaryBox, ...styles.summaryUnpaid}}>
        <div style={styles.summaryLabel}>Pending Balance</div>
        <div style={styles.summaryValue}>{totals.unpaid.toLocaleString()} UGX</div>
    </div>
</div>
                            )}
                        </>
                    ) : (
                        !error && <p style={{textAlign: 'center', color: '#6c757d', padding: '20px'}}>No billing data available</p>
                    )}
                    
                    <div style={styles.modalFooter}>
                        <button 
                            style={{
                                ...styles.btnSecondary,
                                ...((loading || printLoading) ? styles.disabledButton : {})
                            }} 
                            onClick={onClose}
                            disabled={loading || printLoading}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                        >
                            Close
                        </button>
                        <button 
                            style={{
                                ...styles.btnPrimary,
                                ...((loading || printLoading) ? styles.disabledButton : {})
                            }} 
                            onClick={fetchBillingData}
                            disabled={loading || printLoading}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#0069d9'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                        {billingData && (
                            <button 
                                style={{
                                    ...styles.btnSuccess,
                                    ...((loading || printLoading) ? styles.disabledButton : {})
                                }} 
                                onClick={handlePrintInvoice}
                                disabled={loading || printLoading}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                            >
                                {printLoading ? 'Generating PDF...' : 'Print Invoice'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingInvoiceModal;