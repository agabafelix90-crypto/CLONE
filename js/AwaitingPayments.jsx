import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { handleInvalidSession } from './authUtils';
import Topbar from './Topbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InvestigationReceiptModal from './InvestigationReceiptModal';
import FPreceipt from './FPreceipt';
import ConsultationReceiptModal from './ConsultationReceiptModal';
import PayPartialInvestigationsModal from './PayPartialInvestigationsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, 
  faSpinner, 
  faTimes, 
  faFileInvoiceDollar,
  faTrashAlt,
  faMicroscope,
  faUserMd,
  faProcedures,
  faMoneyCheckAlt,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

function AwaitingPayments() {
  const [activeTab, setActiveTab] = useState('investigations');
  const [patients, setPatients] = useState([]);
  const [familyPlanningPatients, setFamilyPlanningPatients] = useState([]);
  const [consultationPatients, setConsultationPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showFPReceiptModal, setShowFPReceiptModal] = useState(false);
  const [fpReceiptDetails, setFpReceiptDetails] = useState(null);
  const [showConsultationReceiptModal, setShowConsultationReceiptModal] = useState(false);
  const [consultationReceiptDetails, setConsultationReceiptDetails] = useState(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [promptDetails, setPromptDetails] = useState({ message: '', onConfirm: null });
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [selectedPatientForPartial, setSelectedPatientForPartial] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOptions, setCancelOptions] = useState({});
  const [selectedCancelTypes, setSelectedCancelTypes] = useState([]);

  // Color scheme for buttons
  const buttonColors = {
    primary: '#000000', // Black
    secondary: '#ffffff', // White
    success: '#10b981', // Emerald green
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Red
    info: '#3b82f6', // Blue
    purple: '#8b5cf6', // Purple
    pink: '#ec4899', // Pink
    indigo: '#6366f1', // Indigo
    teal: '#14b8a6', // Teal
    orange: '#f97316', // Orange
    lime: '#84cc16', // Lime
  };

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

          // Fetch all data initially
          await fetchAwaitingPayments(tokenFromUrl);
          await fetchFamilyPlanningPatients(tokenFromUrl);
          await fetchConsultationPatients(tokenFromUrl);
          
          const intervalId = setInterval(() => {
            fetchAwaitingPayments(tokenFromUrl);
            fetchFamilyPlanningPatients(tokenFromUrl);
            fetchConsultationPatients(tokenFromUrl);
          }, 300000);

          return () => clearInterval(intervalId);
        } else if (securityData.error === 'Session expired') {
          toast.warning('Session expired, redirecting to login...');
          handleInvalidSession(navigate, window.location.pathname + window.location.search);
        } else {
          toast.error('Session invalid, redirecting to login...');
          navigate('/login');
        }
      } else {
        throw new Error('Failed to perform security check');
      }
    } catch (error) {
      console.error('Error performing security check:', error);
      toast.error('Error performing security check, redirecting to login...');
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchTokenAndCheckSecurity();
  }, [navigate]);

  const fetchAwaitingPayments = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(urls.waitingpayment2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        throw new Error('Failed to fetch awaiting payments');
      }
    } catch (error) {
      console.error('Error fetching awaiting payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyPlanningPatients = async (token) => {
    try {
      const response = await fetch(urls.awaitingpaymentsFP2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
  
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setFamilyPlanningPatients(data);
        } else {
          setFamilyPlanningPatients([]);
        }
      } else {
        throw new Error('Failed to fetch family planning patients');
      }
    } catch (error) {
      console.error('Error fetching family planning patients:', error);
      setFamilyPlanningPatients([]);
    }
  };

  const fetchConsultationPatients = async (token) => {
    try {
      const response = await fetch(urls.waitingtopayconsultation, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
  
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setConsultationPatients(data);
        } else {
          setConsultationPatients([]);
        }
      } else {
        throw new Error('Failed to fetch consultation patients');
      }
    } catch (error) {
      console.error('Error fetching consultation patients:', error);
      setConsultationPatients([]);
    }
  };
  
  const showPaymentConfirmationPrompt = (message, onConfirmFull, onConfirmPartial = null) => {
    if (onConfirmPartial) {
      setPromptDetails({ 
        message, 
        onConfirmFull, 
        onConfirmPartial,
        showPaymentOptions: true 
      });
    } else {
      setPromptDetails({ 
        message, 
        onConfirm: onConfirmFull,
        showPaymentOptions: false 
      });
    }
    setShowCustomPrompt(true);
  };

  const handleConfirmPayment = async (patient) => {
    const { lab_tests, radiology_exams } = patient;
    let tests = [];
    if (lab_tests) tests = tests.concat(lab_tests);
    if (radiology_exams) tests = tests.concat(radiology_exams);

    const totalBill = tests.reduce((acc, test) => {
      const price = parseFloat(test.price);
      return isNaN(price) ? acc : acc + price;
    }, 0);
    
    const roundedTotalBill = Math.round(totalBill);
    
    showPaymentConfirmationPrompt(
      `How would ${patient.patient_name} like to pay UGX ${roundedTotalBill}?`,
      () => {
        processFullPayment(patient, tests, roundedTotalBill);
      },
      () => {
        setSelectedPatientForPartial({...patient, tests, totalBill: roundedTotalBill});
        setShowPartialPaymentModal(true);
      }
    );
  };

  const processFullPayment = async (patient, tests, roundedTotalBill) => {
    try {
      setConfirmingPayment(true);
      setProcessingAction('payment');
      setSelectedPatient(patient);
  
      const payload = {
        ...patient,
        totalBill: roundedTotalBill,
        token: urlToken,
      };
  
      const response = await fetch(urls.payinvestigations2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        toast.success('Payment successful');
        setReceiptDetails({ ...patient, tests, totalBill: roundedTotalBill });
        setShowReceiptModal(true);
        fetchAwaitingPayments(urlToken);
      } else {
        throw new Error('Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment. Please try again.');
    } finally {
      setConfirmingPayment(false);
      setProcessingAction(null);
    }
  };

  const handleFPConfirmPayment = async (patient) => {
    const roundedPrice = Math.round(parseFloat(patient.price));
    const confirmationMessage = `Confirm UGX ${roundedPrice} payment for Family Planning?`;
    
    showPaymentConfirmationPrompt(confirmationMessage, async () => {
      try {
        setConfirmingPayment(true);
        setProcessingAction('fp-payment');
        setSelectedPatient(patient);
    
        const payload = {
          ...patient,
          price: roundedPrice,
          token: urlToken,
        };
    
        const response = await fetch(urls.finishedpayingFP, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
    
        if (response.ok) {
          toast.success('Family Planning Payment successful');
          setFpReceiptDetails({ ...patient, token: urlToken, price: roundedPrice });
          setShowFPReceiptModal(true);
          fetchFamilyPlanningPatients(urlToken);
        } else {
          throw new Error('Failed to confirm Family Planning payment');
        }
      } catch (error) {
        console.error('Error confirming Family Planning payment:', error);
        toast.error('Failed to confirm Family Planning payment. Please try again.');
      } finally {
        setConfirmingPayment(false);
        setProcessingAction(null);
      }
    });
  };

  const handleConsultationConfirmPayment = async (patient) => {
    const roundedPrice = Math.round(parseFloat(patient.amount || patient.price));
    const confirmationMessage = `Confirm UGX ${roundedPrice} payment for Consultation?`;
    
    showPaymentConfirmationPrompt(confirmationMessage, async () => {
      try {
        setConfirmingPayment(true);
        setProcessingAction('consultation-payment');
        setSelectedPatient(patient);
  
        const payload = {
          ...patient,
          amount: roundedPrice,
          token: urlToken,
          service: 'Consultation'
        };
  
        const response = await fetch(urls.payconsultation, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          toast.success(data.message || 'Consultation Payment successful');
          setConsultationReceiptDetails({ ...patient, token: urlToken, amount: roundedPrice });
          setShowConsultationReceiptModal(true);
          fetchConsultationPatients(urlToken);
        } else {
          throw new Error(data.message || 'Failed to confirm Consultation payment');
        }
      } catch (error) {
        console.error('Error confirming Consultation payment:', error);
        toast.error(error.message || 'Failed to confirm Consultation payment. Please try again.');
      } finally {
        setConfirmingPayment(false);
        setProcessingAction(null);
      }
    });
  };

  const handleCreditTransaction = async (patient, serviceType) => {
    let endpoint = '';
    let payload = { token: urlToken };
    
    if (serviceType === 'investigations') {
      endpoint = urls.creditinvestigation2;
      payload = { ...payload, ...patient };
    } else if (serviceType === 'familyPlanning') {
      endpoint = urls.creditFP;
      payload = { ...payload, ...patient };
    } else if (serviceType === 'consultation') {
      endpoint = urls.creditconsultaion;
      payload = { ...payload, ...patient };
    }
    
    const confirmationMessage = `Process this as a credit transaction?`;
    
    showPaymentConfirmationPrompt(confirmationMessage, async () => {
      try {
        setProcessingAction(`credit-${serviceType}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
    
        if (response.ok) {
          toast.success('Credit transaction processed successfully');
          if (serviceType === 'investigations') fetchAwaitingPayments(urlToken);
          if (serviceType === 'familyPlanning') fetchFamilyPlanningPatients(urlToken);
          if (serviceType === 'consultation') fetchConsultationPatients(urlToken);
        } else {
          throw new Error('Failed to process credit transaction');
        }
      } catch (error) {
        console.error('Error processing credit transaction:', error);
        toast.error('Failed to process credit transaction. Please try again.');
      } finally {
        setProcessingAction(null);
      }
    });
  };

  const handleCancelService = async (patient, serviceType) => {
    let endpoint = '';
    let payload = { token: urlToken };
    
    if (serviceType === 'investigations') {
      endpoint = urls.cancelInvestigation;
      payload = { ...payload, ...patient };
    } else if (serviceType === 'familyPlanning') {
      endpoint = urls.cancelFP;
      payload = { ...payload, ...patient };
    } else if (serviceType === 'consultation') {
      endpoint = urls.cancelConsultation;
      payload = { ...payload, ...patient };
    }
    
    const confirmationMessage = `Cancel this service?`;
    
    showPaymentConfirmationPrompt(confirmationMessage, async () => {
      try {
        setProcessingAction(`cancel-${serviceType}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
    
        if (response.ok) {
          toast.success('Service cancelled successfully');
          if (serviceType === 'investigations') fetchAwaitingPayments(urlToken);
          if (serviceType === 'familyPlanning') fetchFamilyPlanningPatients(urlToken);
          if (serviceType === 'consultation') fetchConsultationPatients(urlToken);
        } else {
          throw new Error('Failed to cancel service');
        }
      } catch (error) {
        console.error('Error cancelling service:', error);
        toast.error('Failed to cancel service. Please try again.');
      } finally {
        setProcessingAction(null);
      }
    });
  };

  const handleCancelInvestigation = async (fileId, type) => {
    try {
      setProcessingAction('cancel-investigations');
      const response = await fetch(urls.cancelinvestigation, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileId: String(fileId),
          type: type
        }),
      });

      if (response.ok) {
        toast.success('Service cancelled successfully');
        fetchAwaitingPayments(urlToken);
      } else {
        throw new Error('Failed to cancel service');
      }
    } catch (error) {
      console.error('Error cancelling service:', error);
      toast.error('Failed to cancel service. Please try again.');
    } finally {
      setProcessingAction(null);
      setShowCancelModal(false);
    }
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
  };

  const handleCloseFPReceiptModal = () => {
    setShowFPReceiptModal(false);
  };

  const handleCloseConsultationReceiptModal = () => {
    setShowConsultationReceiptModal(false);
  };

  const handleClosePrompt = () => {
    setShowCustomPrompt(false);
    setPromptDetails({ message: '', onConfirm: null });
  };

  const handleNavigateToAllBills = () => {
    navigate(`/credits?token=${urlToken}`);
  };

  const handleNavigateToSalesPage = () => {
    navigate(`/salespage?token=${urlToken}`);
  };

  const handleShowCancelOptions = (patient) => {
    const { lab_tests, radiology_exams, file_id } = patient;
    const hasLab = lab_tests && lab_tests.length > 0;
    const hasRadiology = radiology_exams && radiology_exams.length > 0;

    if (hasLab && hasRadiology) {
      setCancelOptions({
        patient,
        hasLab,
        hasRadiology,
        fileId: file_id
      });
      setSelectedCancelTypes([]);
      setShowCancelModal(true);
    } else if (hasLab) {
      showPaymentConfirmationPrompt(
        'Are you sure you want to cancel the lab tests request?',
        () => handleCancelInvestigation(file_id, 'lab')
      );
    } else if (hasRadiology) {
      showPaymentConfirmationPrompt(
        'Are you sure you want to cancel the radiology exams request?',
        () => handleCancelInvestigation(file_id, 'radiology')
      );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'consultation':
        return renderConsultationPatients();
      case 'investigations':
        return renderInvestigationPatients();
      case 'familyPlanning':
        return renderFamilyPlanningPatients();
      default:
        return renderInvestigationPatients();
    }
  };

  const renderInvestigationPatients = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '32px', color: '#000000', marginBottom: '16px' }} />
          <p style={{ color: '#000000', fontSize: '14px', fontWeight: '500' }}>Loading investigation patients...</p>
        </div>
      );
    }
    
    if (patients.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <FontAwesomeIcon icon={faMicroscope} style={{ fontSize: '48px', color: '#cccccc', marginBottom: '16px' }} />
          <p style={{ color: '#000000', fontSize: '14px', fontWeight: '500' }}>No patients awaiting payments for investigations.</p>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {patients.map((patient, index) => {
          const { patient_name, file_id, contact_id, file_date, lab_tests, radiology_exams } = patient;
          let tests = [];
          if (lab_tests) tests = tests.concat(lab_tests);
          if (radiology_exams) tests = tests.concat(radiology_exams);

          const totalBill = tests.reduce((acc, test) => {
            const price = parseFloat(test.price);
            return isNaN(price) ? acc : acc + price;
          }, 0);
          
          const roundedTotalBill = Math.round(totalBill);

          return (
            <div 
              key={index} 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '16px', 
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '300px',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
              }}
            >
              {/* Header with name and total amount */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#000000', 
                  fontSize: '15px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  maxWidth: '60%'
                }}>
                  {patient_name.toUpperCase()}
                </h3>
                <div style={{ 
                  backgroundColor: buttonColors.info, 
                  color: '#ffffff', 
                  padding: '6px 10px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  UGX {roundedTotalBill}
                </div>
              </div>
              
              <div style={{ 
                marginBottom: '15px',
                flex: '1',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {/* Scrollbar styling */}
                <style>
                  {`
                    ::-webkit-scrollbar {
                      width: 4px;
                    }
                    ::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb {
                      background: #c1c1c1;
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                      background: #a8a8a8;
                    }
                  `}
                </style>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000'}}>File ID:</span> {file_id}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000'}}>OPD No:</span> {contact_id}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000'}}>Date:</span> {file_date}
                  </div>
                </div>
                
                {/* Lab Tests Section */}
                {lab_tests && lab_tests.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ 
                      margin: '0 0 6px 0', 
                      color: '#000000', 
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        backgroundColor: buttonColors.purple, 
                        color: '#ffffff', 
                        borderRadius: '3px', 
                        padding: '1px 4px', 
                        fontSize: '9px', 
                        marginRight: '6px',
                        fontWeight: '600'
                      }}>
                        LAB
                      </span>
                      LAB TESTS:
                    </h4>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '0',
                      listStyleType: 'none'
                    }}>
                      {lab_tests.map((test, idx) => (
                        <li key={idx} style={{ 
                          marginBottom: '4px',
                          padding: '4px',
                          color: '#000000',
                          display: 'flex',
                          justifyContent: 'space-between',
                          backgroundColor: idx % 2 === 0 ? '#f8f9fa' : 'transparent',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          <span>{test.name.replace('Lab Test: ', '')}</span>
                          <span style={{ fontWeight: '600', color: '#000000' }}>UGX {Math.round(parseFloat(test.price))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Radiology Exams Section */}
                {radiology_exams && radiology_exams.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ 
                      margin: '0 0 6px 0', 
                      color: '#000000', 
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        backgroundColor: buttonColors.teal, 
                        color: '#ffffff', 
                        borderRadius: '3px', 
                        padding: '1px 4px', 
                        fontSize: '9px', 
                        marginRight: '6px',
                        fontWeight: '600'
                      }}>
                        RAD
                      </span>
                      RADIOLOGY EXAMS:
                    </h4>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '0',
                      listStyleType: 'none'
                    }}>
                      {radiology_exams.map((exam, idx) => (
                        <li key={idx} style={{ 
                          marginBottom: '4px',
                          padding: '4px',
                          color: '#000000',
                          display: 'flex',
                          justifyContent: 'space-between',
                          backgroundColor: idx % 2 === 0 ? '#f8f9fa' : 'transparent',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          <span>{exam.name.replace('Radiology Exam: ', '')}</span>
                          <span style={{ fontWeight: '600', color: '#000000' }}>UGX {Math.round(parseFloat(exam.price))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Buttons - side by side */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                marginTop: '10px'
              }}>
                <button
                 onClick={() => handleShowCancelOptions(patient)}
                  disabled={processingAction === 'cancel-investigations'}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.danger, 
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: processingAction === 'cancel-investigations' ? 0.7 : 1
                  }}
                  onMouseOver={(e) => !processingAction && (e.currentTarget.style.backgroundColor = '#dc2626')}
                  onMouseOut={(e) => !processingAction && (e.currentTarget.style.backgroundColor = buttonColors.danger)}
                >
                  {processingAction === 'cancel-investigations' ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faTimes} />
                  )}
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmPayment(patient)} 
                  disabled={confirmingPayment || processingAction} 
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.success, 
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: confirmingPayment ? 'not-allowed' : 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseOut={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = buttonColors.success)}
                >
                  {confirmingPayment && processingAction === 'payment' ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faMoneyCheckAlt} />
                      Pay
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFamilyPlanningPatients = () => {
    if (familyPlanningPatients.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <FontAwesomeIcon icon={faProcedures} style={{ fontSize: '48px', color: '#cccccc', marginBottom: '16px' }} />
          <p style={{ color: '#000000', fontSize: '14px', fontWeight: '500' }}>No patients awaiting payments for family planning.</p>
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {familyPlanningPatients.map((patient, index) => {
          const roundedPrice = Math.round(parseFloat(patient.price));
          const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
          
          return (
            <div 
              key={index} 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '16px', 
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '300px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
              }}
            >
              {/* Delete Button - Top Right Corner */}
              <button
                onClick={() => handleCancelService(patient, 'familyPlanning')}
                disabled={processingAction === 'cancel-familyPlanning'}
                style={{ 
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: buttonColors.danger,
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '6px',
                  borderRadius: '4px',
                  zIndex: 10,
                  opacity: processingAction === 'cancel-familyPlanning' ? 0.7 : 1,
                  transition: 'opacity 0.2s ease'
                }}
                title="Delete this payment request"
                onMouseOver={(e) => !processingAction && (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => !processingAction && (e.currentTarget.style.backgroundColor = buttonColors.danger)}
              >
                {processingAction === 'cancel-familyPlanning' ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faTrashAlt} />
                )}
              </button>

              {/* Header with name and total amount */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f0f0f0',
                paddingRight: '30px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  maxWidth: '60%'
                }}>
                  {fullName.toUpperCase()}
                </h3>
                <div style={{ 
                  backgroundColor: buttonColors.pink,
                  color: '#ffffff', 
                  padding: '6px 10px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  UGX {roundedPrice}
                </div>
              </div>
              
              <div style={{ 
                marginBottom: '15px',
                flex: '1',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                <style>
                  {`
                    ::-webkit-scrollbar {
                      width: 4px;
                    }
                    ::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb {
                      background: #a8a8a8;
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                      background: '#8a8a8a';
                    }
                  `}
                </style>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ 
                    backgroundColor: '#f0f3f5',
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>OPD No:</span> {patient.opd_no || patient.contact_id}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>Age:</span> {patient.age}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>Sex:</span> {patient.sex}
                  </div>
                  {patient.phone_number && (
                    <div style={{ 
                      backgroundColor: '#f0f3f5', 
                      padding: '3px 6px', 
                      borderRadius: '3px',
                      fontSize: '11px',
                      color: '#000000',
                      fontWeight: '500'
                    }}>
                      <span style={{color: '#000000', fontWeight: '600'}}>Contact:</span> {patient.phone_number}
                    </div>
                  )}
                </div>
                
                {/* Family Planning Details */}
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ 
                    margin: '0 0 6px 0', 
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      backgroundColor: buttonColors.pink,
                      color: '#ffffff', 
                      borderRadius: '3px', 
                      padding: '1px 4px', 
                      fontSize: '9px', 
                      marginRight: '6px',
                      fontWeight: '700'
                    }}>
                      FP
                    </span>
                    FAMILY PLANNING:
                  </h4>
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '12px'
                  }}>
                    <p style={{ margin: '4px 0', color: '#000000' }}>
                      <strong style={{color: '#000000'}}>Method:</strong> {patient.method}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                marginTop: '10px'
              }}>
                <button
                  onClick={() => handleCreditTransaction(patient, 'familyPlanning')}
                  disabled={processingAction === 'credit-familyPlanning'}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.warning,
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: processingAction === 'credit-familyPlanning' ? 0.7 : 1
                  }}
                  onMouseOver={(e) => !processingAction && (e.currentTarget.style.backgroundColor = '#d97706')}
                  onMouseOut={(e) => !processingAction && (e.currentTarget.style.backgroundColor = buttonColors.warning)}
                >
                  {processingAction === 'credit-familyPlanning' ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faCreditCard} />
                  )}
                  Credit
                </button>
                <button
                  onClick={() => handleFPConfirmPayment(patient)} 
                  disabled={confirmingPayment || processingAction} 
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.success,
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: confirmingPayment ? 'not-allowed' : 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseOut={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = buttonColors.success)}
                >
                  {confirmingPayment && processingAction === 'fp-payment' ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faMoneyCheckAlt} />
                      Pay
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderConsultationPatients = () => {
    if (consultationPatients.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <FontAwesomeIcon icon={faUserMd} style={{ fontSize: '48px', color: '#cccccc', marginBottom: '16px' }} />
          <p style={{ color: '#000000', fontSize: '14px', fontWeight: '500' }}>No patients awaiting payments for consultation.</p>
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {consultationPatients.map((patient, index) => {
          const roundedPrice = Math.round(parseFloat(patient.amount || patient.price));
          
          return (
            <div 
              key={index} 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '16px', 
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '300px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
              }}
            >
              {/* Delete Button - Top Right Corner */}
              <button
                onClick={() => handleCancelService(patient, 'consultation')}
                disabled={processingAction === 'cancel-consultation'}
                style={{ 
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: buttonColors.danger,
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '6px',
                  borderRadius: '4px',
                  zIndex: 10,
                  opacity: processingAction === 'cancel-consultation' ? 0.7 : 1,
                  transition: 'opacity 0.2s ease'
                }}
                title="Delete this payment request"
                onMouseOver={(e) => !processingAction && (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => !processingAction && (e.currentTarget.style.backgroundColor = buttonColors.danger)}
              >
                {processingAction === 'cancel-consultation' ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faTrashAlt} />
                )}
              </button>

              {/* Header with name and total amount */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f0f0f0',
                paddingRight: '30px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  maxWidth: '60%'
                }}>
                  {patient.patient_name.toUpperCase()}
                </h3>
                <div style={{ 
                  backgroundColor: buttonColors.indigo,
                  color: '#ffffff', 
                  padding: '6px 10px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  UGX {roundedPrice}
                </div>
              </div>
              <div style={{ 
                marginBottom: '15px',
                flex: '1',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                <style>
                  {`
                    ::-webkit-scrollbar {
                      width: 4px;
                    }
                    ::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb {
                      background: '#a8a8a8';
                      border-radius: 2px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                      background: '#8a8a8a';
                    }
                  `}
                </style>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ 
                    backgroundColor: '#f0f3f5',
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>File ID:</span> {patient.file_id}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>OPD No:</span> {patient.contact_id}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>Age:</span> {patient.age}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>Sex:</span> {patient.sex}
                  </div>
                  <div style={{ 
                    backgroundColor: '#f0f3f5', 
                    padding: '3px 6px', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#000000',
                    fontWeight: '500'
                  }}>
                    <span style={{color: '#000000', fontWeight: '600'}}>Date:</span> {patient.file_date}
                  </div>
                  {patient.phone_number && (
                    <div style={{ 
                      backgroundColor: '#f0f3f5', 
                      padding: '3px 6px', 
                      borderRadius: '3px',
                      fontSize: '11px',
                      color: '#000000',
                      fontWeight: '500'
                    }}>
                      <span style={{color: '#000000', fontWeight: '600'}}>Contact:</span> {patient.phone_number}
                    </div>
                  )}
                </div>
                
                {/* Consultation Details */}
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ 
                    margin: '0 0 6px 0', 
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      backgroundColor: buttonColors.indigo,
                      color: '#ffffff', 
                      borderRadius: '3px', 
                      padding: '1px 4px', 
                      fontSize: '9px', 
                      marginRight: '6px',
                      fontWeight: '700'
                    }}>
                      CON
                    </span>
                    CONSULTATION:
                  </h4>
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '#f8f9fa', 
                    fontSize: '12px'
                  }}>
                    <p style={{ margin: '4px 0', color: '#000000' }}>
                      <strong style={{color: '#000000'}}>Service:</strong> Medical Consultation
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                marginTop: '10px'
              }}>
                <button
                  onClick={() => handleCreditTransaction(patient, 'consultation')}
                  disabled={processingAction === 'credit-consultation'}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.warning,
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: processingAction === 'credit-consultation' ? 0.7 : 1
                  }}
                  onMouseOver={(e) => !processingAction && (e.currentTarget.style.backgroundColor = '#d97706')}
                  onMouseOut={(e) => !processingAction && (e.currentTarget.style.backgroundColor = buttonColors.warning)}
                >
                  {processingAction === 'credit-consultation' ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faCreditCard} />
                  )}
                  Credit
                </button>
                <button
                  onClick={() => handleConsultationConfirmPayment(patient)} 
                  disabled={confirmingPayment || processingAction} 
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: buttonColors.success,
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: confirmingPayment ? 'not-allowed' : 'pointer', 
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseOut={(e) => !confirmingPayment && (e.currentTarget.style.backgroundColor = buttonColors.success)}
                >
                  {confirmingPayment && processingAction === 'consultation-payment' ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faMoneyCheckAlt} />
                      Pay
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      width: '100vw',
      margin: 0,
      padding: 0,
      overflowX: 'hidden'
    }}>
      <Topbar token={urlToken} />
      <ToastContainer />
      
      <div style={{
        padding: '90px 20px 30px 20px',
        width: '100%',
        margin: 0,
        boxSizing: 'border-box'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          flexWrap: 'wrap',
          gap: '15px',
          width: '100%'
        }}>
          <h1 style={{
            color: '#000000',
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            fontFamily: "'Inter', sans-serif"
          }}>
            Awaiting Payments
          </h1>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleNavigateToAllBills}
              style={{
                padding: '12px 20px',
                backgroundColor: buttonColors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#333333')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = buttonColors.primary)}
            >
              <FontAwesomeIcon icon={faFileInvoiceDollar} />
              All Patient Bills
            </button>
            <button
              onClick={handleNavigateToSalesPage}
              style={{
                padding: '12px 20px',
                backgroundColor: buttonColors.info,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = buttonColors.info)}
            >
              <FontAwesomeIcon icon={faReceipt} />
              All Sales 
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '25px',
          borderBottom: '2px solid #e0e0e0',
          padding: '0 0 10px 0',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          width: '100%'
        }}>
          <button
            onClick={() => setActiveTab('consultation')}
            style={{
              padding: '14px 24px',
              margin: '0 8px',
              backgroundColor: activeTab === 'consultation' ? buttonColors.indigo : 'transparent',
              color: activeTab === 'consultation' ? '#ffffff' : '#000000',
              border: 'none',
              borderBottom: activeTab === 'consultation' ? `3px solid ${buttonColors.indigo}` : 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <FontAwesomeIcon icon={faUserMd} />
            Consultation ({consultationPatients.length})
          </button>
          <button
            onClick={() => setActiveTab('investigations')}
            style={{
              padding: '14px 24px',
              margin: '0 8px',
              backgroundColor: activeTab === 'investigations' ? buttonColors.info : 'transparent',
              color: activeTab === 'investigations' ? '#ffffff' : '#000000',
              border: 'none',
              borderBottom: activeTab === 'investigations' ? `3px solid ${buttonColors.info}` : 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <FontAwesomeIcon icon={faMicroscope} />
            Lab/Radiology ({patients.length})
          </button>
          <button
            onClick={() => setActiveTab('familyPlanning')}
            style={{
              padding: '14px 24px',
              margin: '0 8px',
              backgroundColor: activeTab === 'familyPlanning' ? buttonColors.pink : 'transparent',
              color: activeTab === 'familyPlanning' ? '#ffffff' : '#000000',
              border: 'none',
              borderBottom: activeTab === 'familyPlanning' ? `3px solid ${buttonColors.pink}` : 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <FontAwesomeIcon icon={faProcedures} />
            Family Planning ({familyPlanningPatients.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          minHeight: '400px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderTabContent()}
        </div>
      </div>

      {/* Modals */}
      {showReceiptModal && (
        <InvestigationReceiptModal
          isOpen={showReceiptModal}
          onClose={handleCloseReceiptModal}
          details={receiptDetails}
          token={urlToken}
        />
      )}
    
      {showFPReceiptModal && (
        <FPreceipt
          details={fpReceiptDetails}
          onClose={handleCloseFPReceiptModal}
        />
      )}

      {showConsultationReceiptModal && (
        <ConsultationReceiptModal
          isOpen={showConsultationReceiptModal}
          onClose={handleCloseConsultationReceiptModal}
          details={consultationReceiptDetails}
          token={urlToken}
        />
      )}

      {showCustomPrompt && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={handleClosePrompt}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              padding: '28px',
              borderRadius: '12px',
              width: promptDetails.showPaymentOptions ? '480px' : '420px',
              maxWidth: '90%',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePrompt}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#000000';
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <h3 style={{ 
              margin: '0 0 18px 0', 
              color: '#000000', 
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
              fontFamily: "'Inter', sans-serif"
            }}>
              {promptDetails.showPaymentOptions ? 'Select Payment Method' : 'Confirm Action'}
            </h3>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              borderLeft: '4px solid #000000'
            }}>
              <p style={{ 
                color: '#000000', 
                margin: 0, 
                fontSize: '16px',
                lineHeight: '1.5',
                fontWeight: '500',
                textAlign: 'center',
                fontFamily: "'Inter', sans-serif"
              }}>
                {promptDetails.message}
              </p>
            </div>
            
            {promptDetails.showPaymentOptions ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      promptDetails.onConfirmPartial();
                      handleClosePrompt();
                    }}
                    style={{
                      padding: '14px 20px',
                      backgroundColor: buttonColors.warning,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#d97706';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = buttonColors.warning;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <FontAwesomeIcon icon={faMoneyCheckAlt} />
                    Partial Payment
                  </button>
                  <button
                    onClick={() => {
                      promptDetails.onConfirmFull();
                      handleClosePrompt();
                    }}
                    style={{
                      padding: '14px 20px',
                      backgroundColor: buttonColors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = buttonColors.success;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <FontAwesomeIcon icon={faCreditCard} />
                    Full Payment
                  </button>
                </div>
                
                <button
                  onClick={handleClosePrompt}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  onClick={handleClosePrompt}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    promptDetails.onConfirm();
                    handleClosePrompt();
                  }}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: buttonColors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = buttonColors.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPartialPaymentModal && (
        <PayPartialInvestigationsModal
          isOpen={showPartialPaymentModal}
          onClose={() => setShowPartialPaymentModal(false)}
          patient={selectedPatientForPartial}
          token={urlToken}
          refreshData={() => fetchAwaitingPayments(urlToken)}
        />
      )}
      
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '28px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 18px 0', 
              color: '#000000', 
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
              fontFamily: "'Inter', sans-serif"
            }}>
              Cancel Services
            </h3>
            
            <p style={{ 
              color: '#000000', 
              margin: '0 0 20px 0', 
              fontSize: '16px',
              textAlign: 'center',
              fontFamily: "'Inter', sans-serif"
            }}>
              Select which services to cancel:
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              {cancelOptions.hasLab && (
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedCancelTypes.includes('lab')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCancelTypes([...selectedCancelTypes, 'lab']);
                      } else {
                        setSelectedCancelTypes(selectedCancelTypes.filter(type => type !== 'lab'));
                      }
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{color: '#000000', fontFamily: "'Inter', sans-serif"}}>Lab Tests</span>
                </label>
              )}
              
              {cancelOptions.hasRadiology && (
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedCancelTypes.includes('radiology')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCancelTypes([...selectedCancelTypes, 'radiology']);
                      } else {
                        setSelectedCancelTypes(selectedCancelTypes.filter(type => type !== 'radiology'));
                      }
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{color: '#000000', fontFamily: "'Inter', sans-serif"}}>Radiology Exams</span>
                </label>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px'
            }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  color: '#000000',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCancelTypes.length === 0) {
                    toast.error('Please select at least one service to cancel');
                    return;
                  }
                  
                  const type = selectedCancelTypes.length === 2 ? 'both' : selectedCancelTypes[0];
                  handleCancelInvestigation(cancelOptions.fileId, type);
                }}
                disabled={selectedCancelTypes.length === 0}
                style={{
                  padding: '10px 18px',
                  backgroundColor: selectedCancelTypes.length === 0 ? '#cccccc' : buttonColors.danger,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedCancelTypes.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AwaitingPayments;