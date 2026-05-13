import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faXRay, faUser, faFileMedical, faCalendarAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import Resultmodal from './Resultmodal';
import RadiologyResultsModal2 from './RadiologyResultsModal2';
import './PatientsFiles.css';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import Walkin from './Walkin';

// ─── THEME COLORS ───────────────────────────────────────────────────────────
const colors = {
  blue: {
    primary: '#0a1e4a',        // Dark blue primary
    secondary: '#2563eb',       // Bright blue
    accent: '#16a34a',          // Green accent
    background: '#f0f4ff',      // Light blue background
    cardBg: '#ffffff',          // White cards
    cardBorder: '#d4e0ff',      // Light blue border
    textPrimary: '#0a1e4a',     // Dark blue text
    textSecondary: '#1e3a8a',   // Royal blue secondary
    textMuted: '#4b5563',       // Gray muted
    buttonPrimary: '#2563eb',   // Blue button
    buttonHover: '#1d4ed8',     // Darker blue hover
    statusInfo: '#e0edff',      // Light blue info
    statusInfoText: '#2563eb',  // Blue info text
    statusSuccess: '#dcfce7',   // Light green
    statusSuccessText: '#166534', // Dark green text
    tableHeader: '#e8f0fe',     // Light blue header
    inputBorder: '#cbd5e1',     // Gray border
    shadow: 'rgba(37, 99, 235, 0.1)', // Blue-tinted shadow
    iconColor: '#2563eb',       // Blue icons
    badgeBlue: { bg: '#dbeafe', text: '#1e40af' },
    badgeGreen: { bg: '#dcfce7', text: '#166534' },
  },
  white: {
    primary: '#0f172a',         // Dark slate primary
    secondary: '#3498db',       // Light blue secondary
    accent: '#27ae60',          // Green accent
    background: '#f8fafc',      // Light gray background
    cardBg: '#ffffff',          // White cards
    cardBorder: '#e2e8f0',      // Gray border
    textPrimary: '#0f172a',     // Dark slate text
    textSecondary: '#475569',   // Gray secondary
    textMuted: '#64748b',       // Light gray muted
    buttonPrimary: '#3498db',   // Blue button
    buttonHover: '#2980b9',     // Darker blue hover
    statusInfo: '#e8f4fc',      // Light blue info
    statusInfoText: '#3498db',  // Blue info text
    statusSuccess: '#d4edda',   // Light green
    statusSuccessText: '#155724', // Dark green text
    tableHeader: '#f1f5f9',     // Light gray header
    inputBorder: '#ddd',        // Gray border
    shadow: 'rgba(0,0,0,0.1)',  // Gray shadow
    iconColor: '#3498db',       // Blue icons
    badgeBlue: { bg: '#e8f4fc', text: '#3498db' },
    badgeGreen: { bg: '#d4edda', text: '#155724' },
  }
};

function PatientsFiles() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLabResultsModalOpen, setIsLabResultsModalOpen] = useState(false);
    const [isRadiologyResultsModalOpen, setIsRadiologyResultsModalOpen] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const [clinicDetails, setClinicDetails] = useState(null);
    const navigate = useNavigate();
    let abortController = new AbortController();
    const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [expandedFileId, setExpandedFileId] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('white'); // default theme

    // ── Check theme from security response ────────────────────────────────────
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

                    // Check theme color from security response
                    const themeColor = securityData.colour || '';
                    setCurrentTheme(resolveTheme(urlTheme, themeColor));

                    if (securityData.message === 'Session valid') {
                        setEmployeeName(securityData.employee_name);
                        saveSessionToken(securityData.clinic_session_token);
                        fetchPatients(tokenFromUrl);
                        await fetchClinicDetails(tokenFromUrl);
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

        fetchTokenAndCheckSecurity();
    }, [navigate]);

    // Get the active theme colors
    const theme = colors[currentTheme];

    // Rest of your existing useEffect hooks remain the same...
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        setPatients([]);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchPatients();
        }, 1000);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, selectedDate]);

    const fetchPatients = useCallback(() => {
        abortController.abort();
        abortController = new AbortController();

        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        let apiUrl = `${urls.suggestfiles}?query=${encodeURIComponent(searchQuery)}`;
        if (selectedDate) {
            apiUrl += `&date=${selectedDate}`;
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: tokenFromUrl }),
            signal: abortController.signal
        })
            .then(response => response.json())
            .then(data => {
                setPatients(data);
                setLoading(false);
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching patient data:', error);
                    setLoading(false);
                }
            });
    }, [searchQuery, selectedDate]);

    const fetchClinicDetails = async (token) => {
        try {
            const response = await fetch(urls.fetchclinicdetails, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });
            if (response.ok) {
                const data = await response.json();
                setClinicDetails(data);
            } else {
                throw new Error('Failed to fetch clinic details');
            }
        } catch (error) {
            console.error('Error fetching clinic details:', error);
        }
    };

    const handleViewEditPatientFile = (fileId) => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        navigate(`/patient-file/${tokenFromUrl}/${fileId}`);
    };

    const handleShowLabResults = (patient) => {
        setSelectedPatient(patient);
        setIsLabResultsModalOpen(true);
    };

    const handleShowRadiologyResults = (patient) => {
        setSelectedPatient(patient);
        setIsRadiologyResultsModalOpen(true);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSeePatientsForScanOrLab = () => {
        setIsWalkinModalOpen(true);
    };

    const formatDateTime = (dateTimeString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        };
        return new Date(dateTimeString).toLocaleString('en-US', options);
    };

    const toggleExpandFile = (fileId) => {
        if (expandedFileId === fileId) {
            setExpandedFileId(null);
        } else {
            setExpandedFileId(fileId);
            setTimeout(() => {
                const modal = document.querySelector(`[data-file-id="${fileId}"]`);
                if (modal) modal.scrollTop = 0;
            }, 10);
        }
    };

    // Add keyframe animation for spinner
    const spinnerStyle = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    return (
        <div style={{
            backgroundColor: theme.background,
            minHeight: '100vh',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            paddingBottom: '20px',
            color: theme.textPrimary,
            transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
            <style>{spinnerStyle}</style>
            
            {/* Pass themeColor to Topbar */}
            <Topbar token={urlToken} themeColor={currentTheme} />
            
            <div style={{
                padding: '15px',
                maxWidth: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
                paddingTop: '75px'
            }}>
                {/* Header Section - Updated with theme colors */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: theme.cardBg,
                    borderRadius: '8px',
                    boxShadow: `0 2px 10px ${theme.shadow}`,
                    width: '100%',
                    boxSizing: 'border-box',
                    border: `1px solid ${theme.cardBorder}`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                        gap: '10px'
                    }}>
                        <h1 style={{
                            fontSize: window.innerWidth < 768 ? '20px' : '24px',
                            color: theme.textPrimary,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: '600'
                        }}>
                            <FontAwesomeIcon icon={faFileMedical} style={{ color: theme.iconColor }} />
                            Patient Files Management
                        </h1>
                        <p style={{
                            fontSize: window.innerWidth < 768 ? '14px' : '16px',
                            color: theme.textSecondary,
                            margin: 0,
                            fontWeight: '500',
                            textAlign: window.innerWidth < 768 ? 'left' : 'right'
                        }}>{clinicDetails?.clinic_name || 'Clinic'}</p>
                    </div>
                </div>

                {/* Search and Filter Section - Updated with theme colors */}
                <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px',
                    width: '100%'
                }}>
                    {/* Search Input */}
                    <div style={{
                        flex: '1',
                        minWidth: window.innerWidth < 768 ? '100%' : '300px',
                        position: 'relative',
                        height: '40px'
                    }}>
                        <FontAwesomeIcon 
                            icon={faSearch} 
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: theme.textMuted
                            }} 
                        />
                        <input
                            type="text"
                            placeholder="Search by patient name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: '10px 10px 10px 40px',
                                borderRadius: '5px',
                                border: `1px solid ${theme.inputBorder}`,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: theme.cardBg,
                                color: theme.textPrimary,
                                transition: 'background-color 0.3s ease, border-color 0.3s ease'
                            }}
                        />
                    </div>
                    
                    {/* Date Picker */}
                    <div style={{
                        position: 'relative',
                        minWidth: window.innerWidth < 768 ? '100%' : 'auto',
                        height: '40px'
                    }}>
                        <FontAwesomeIcon 
                            icon={faCalendarAlt} 
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: theme.textMuted
                            }} 
                        />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                width: window.innerWidth < 768 ? '100%' : 'auto',
                                height: '100%',
                                padding: '10px 10px 10px 40px',
                                borderRadius: '5px',
                                border: `1px solid ${theme.inputBorder}`,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: theme.cardBg,
                                color: theme.textPrimary,
                                transition: 'background-color 0.3s ease, border-color 0.3s ease'
                            }}
                        />
                    </div>
                    
                    {/* Scan/Lab Button */}
                    <button 
                        onClick={handleSeePatientsForScanOrLab}
                        style={{
                            backgroundColor: theme.buttonPrimary,
                            color: 'white',
                            border: 'none',
                            height: '40px',
                            padding: '0 15px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background-color 0.3s',
                            whiteSpace: 'nowrap',
                            width: window.innerWidth < 768 ? '100%' : 'auto'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.buttonPrimary}
                    >
                        <FontAwesomeIcon icon={faUser} />
                        Scan/Lab Only Patients
                    </button>
                </div>

                {/* Patient Files Display */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        width: '100%'
                    }}>
                        <div style={{
                            border: `4px solid ${theme.tableHeader}`,
                            borderTop: `4px solid ${theme.buttonPrimary}`,
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{
                            marginTop: '15px',
                            color: theme.textSecondary,
                            fontWeight: '500'
                        }}>Loading patient files...</p>
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        overflowX: 'auto',
                        position: 'relative'
                    }}>
                        {patients.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth < 600 ? '1fr' : 
                                                  window.innerWidth < 900 ? 'repeat(2, 1fr)' : 
                                                  window.innerWidth < 1200 ? 'repeat(3, 1fr)' : 
                                                  'repeat(4, 1fr)',
                                gap: '15px',
                                width: '100%',
                                filter: expandedFileId ? 'blur(3px)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}>
                                {patients.map(patient => (
                                    <div 
                                        key={patient.contact_id} 
                                        data-file-id={patient.file_id}
                                        style={{
                                            backgroundColor: theme.cardBg,
                                            borderRadius: '8px',
                                            boxShadow: `0 2px 15px ${theme.shadow}`,
                                            padding: '15px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: '280px',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            border: `1px solid ${theme.cardBorder}`,
                                            position: expandedFileId === patient.file_id ? 'fixed' : 'relative',
                                            top: expandedFileId === patient.file_id ? '50%' : 'auto',
                                            left: expandedFileId === patient.file_id ? '50%' : 'auto',
                                            transform: expandedFileId === patient.file_id ? 'translate(-50%, -50%)' : 'none',
                                            zIndex: expandedFileId === patient.file_id ? 1000 : 'auto',
                                            maxWidth: expandedFileId === patient.file_id ? '800px' : 'none',
                                            maxHeight: expandedFileId === patient.file_id ? '90vh' : 'none',
                                            overflow: expandedFileId === patient.file_id ? 'auto' : 'hidden',
                                            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
                                        }}
                                    >
                                        {/* File Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '10px'
                                        }}>
                                            <div style={{
                                                borderBottom: `1px solid ${theme.tableHeader}`,
                                                paddingBottom: '10px',
                                                marginBottom: '10px',
                                                flex: 1
                                            }}>
                                                <h3 style={{
                                                    margin: '0 0 5px 0',
                                                    color: theme.textPrimary,
                                                    fontSize: '16px',
                                                    display: 'flex',
                                                    flexDirection: window.innerWidth < 400 ? 'column' : 'row',
                                                    justifyContent: 'space-between',
                                                    textTransform: 'uppercase',
                                                    gap: '5px',
                                                    fontWeight: '600'
                                                }}>
                                                    <span>{`${patient.first_name} ${patient.last_name}`}</span>
                                                    <span style={{
                                                        backgroundColor: theme.statusInfo,
                                                        color: theme.statusInfoText,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        alignSelf: 'flex-start'
                                                    }}>OPD: {patient.opd_no}</span>
                                                </h3>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    fontSize: '13px',
                                                    color: theme.textSecondary
                                                }}>
                                                    <span>{patient.age} years</span>
                                                    <span>{patient.sex}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Patient Details */}
                                        <div style={{
                                            flex: '1',
                                            marginBottom: '10px',
                                            overflow: 'hidden'
                                        }}>
                                            <p style={{
                                                margin: '0 0 8px 0',
                                                fontSize: '14px',
                                                color: theme.textPrimary,
                                                wordBreak: 'break-word',
                                                fontWeight: '500'
                                            }}>
                                                <strong style={{ color: theme.textSecondary, fontSize: '14px' }}>Visit:</strong> {formatDateTime(patient.date_time)}
                                            </p>
                                            
                                            {patient.diagnosis && (
                                                <p style={{
                                                    margin: '0 0 8px 0',
                                                    fontSize: '14px',
                                                    color: theme.textPrimary,
                                                    wordBreak: 'break-word',
                                                    fontWeight: '500'
                                                }}>
                                                    <strong style={{ color: theme.textSecondary, fontSize: '14px' }}>Diagnosis:</strong> {patient.diagnosis}
                                                </p>
                                            )}
                                            
                                            {patient.clinical_notes && (
                                                <p style={{
                                                    margin: '0 0 8px 0',
                                                    fontSize: '14px',
                                                    color: theme.textPrimary,
                                                    wordBreak: 'break-word',
                                                    fontWeight: '500'
                                                }}>
                                                    <strong style={{ color: theme.textSecondary, fontSize: '14px' }}>Notes:</strong> {patient.clinical_notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Lab and Radiology Status - Updated with theme colors */}
                                        <div style={{ marginBottom: '10px' }}>
                                            {patient.lab_status_message && (
                                                <div 
                                                    onClick={() => patient.lab_status_message.includes('Click here') && handleShowLabResults(patient)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px',
                                                        borderRadius: '5px',
                                                        backgroundColor: patient.lab_status_message.includes('Click here') ? theme.statusInfo : theme.tableHeader,
                                                        marginBottom: '6px',
                                                        fontSize: '12px',
                                                        color: patient.lab_status_message.includes('Click here') ? theme.statusInfoText : theme.textMuted,
                                                        cursor: patient.lab_status_message.includes('Click here') ? 'pointer' : 'default',
                                                        transition: 'background-color 0.2s',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faFlask} style={{ fontSize: '12px', flexShrink: 0, color: theme.iconColor }} />
                                                    <span>{patient.lab_status_message}</span>
                                                </div>
                                            )}

                                            {patient.radiology_status_message && (
                                                <div 
                                                    onClick={() => patient.radiology_status_message.includes('Click here') && handleShowRadiologyResults(patient)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px',
                                                        borderRadius: '5px',
                                                        backgroundColor: patient.radiology_status_message.includes('Click here') ? theme.statusInfo : theme.tableHeader,
                                                        fontSize: '12px',
                                                        color: patient.radiology_status_message.includes('Click here') ? theme.statusInfoText : theme.textMuted,
                                                        cursor: patient.radiology_status_message.includes('Click here') ? 'pointer' : 'default',
                                                        transition: 'background-color 0.2s',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faXRay} style={{ fontSize: '12px', flexShrink: 0, color: theme.iconColor }} />
                                                    <span>{patient.radiology_status_message}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount Spent */}
                                        {patient.amount && patient.amount !== '0.00' && (
                                            <div style={{
                                                marginBottom: '10px',
                                                fontSize: '14px',
                                                color: theme.statusSuccessText,
                                                fontWeight: '600'
                                            }}>
                                                <strong style={{ color: theme.textSecondary, fontSize: '14px' }}>Amount Spent On Pt:</strong> UGX {parseFloat(patient.amount).toLocaleString()}
                                            </div>
                                        )}

                                        {/* View/Edit Button */}
                                        <button 
                                            onClick={() => handleViewEditPatientFile(patient.file_id)}
                                            style={{
                                                backgroundColor: theme.buttonPrimary,
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                width: '100%',
                                                transition: 'background-color 0.3s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonHover}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.buttonPrimary}
                                        >
                                            View/Edit File
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: theme.cardBg,
                                padding: '20px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                boxShadow: `0 2px 10px ${theme.shadow}`,
                                width: '100%',
                                boxSizing: 'border-box',
                                border: `1px solid ${theme.cardBorder}`,
                                transition: 'background-color 0.3s ease, border-color 0.3s ease'
                            }}>
                                <p style={{
                                    color: theme.textSecondary,
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}>No patient files found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Modals - Pass theme if needed */}
                {isLabResultsModalOpen && selectedPatient && (
                    <Resultmodal 
                        patient={selectedPatient} 
                        onClose={() => setIsLabResultsModalOpen(false)} 
                        clinicDetails={clinicDetails}
                    />
                )}

                {isRadiologyResultsModalOpen && selectedPatient && (
                    <RadiologyResultsModal2 
                        patient={selectedPatient} 
                        onClose={() => setIsRadiologyResultsModalOpen(false)} 
                        clinicDetails={clinicDetails}
                    />
                )}

                {isWalkinModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: theme.cardBg,
                            borderRadius: '8px',
                            padding: '20px',
                            maxWidth: '95%',
                            maxHeight: '95%',
                            overflow: 'auto',
                            width: window.innerWidth < 768 ? '95%' : '800px',
                            boxSizing: 'border-box'
                        }}>
                            <Walkin token={urlToken} onClose={() => setIsWalkinModalOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Overlay for expanded file */}
                {expandedFileId && (
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            zIndex: 999,
                            cursor: 'pointer'
                        }}
                        onClick={() => setExpandedFileId(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default PatientsFiles;