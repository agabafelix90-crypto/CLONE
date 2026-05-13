import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import Resultmodal from './Resultmodal';
import RadiologyResultsModal2 from './RadiologyResultsModal2';
import './PatientsFiles.css';

function Walkin({ onClose }) {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLabResultsModalOpen, setIsLabResultsModalOpen] = useState(false);
    const [isRadiologyResultsModalOpen, setIsRadiologyResultsModalOpen] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [clinicDetails, setClinicDetails] = useState(null);
    const navigate = useNavigate();
    const abortControllerRef = useRef(new AbortController());
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchTokenAndCheckSecurity = async () => {
            try {
                const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
                const securityResponse = await fetch(urls.security, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenFromUrl }),
                });

                if (!securityResponse.ok) throw new Error('Security check failed');
                const securityData = await securityResponse.json();

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
            } catch (error) {
                console.error('Security check error:', error);
                navigate('/login');
            }
        };
        fetchTokenAndCheckSecurity();
    }, [navigate]);

    useEffect(() => {
        return () => {
            // Clean up the timeout when component unmounts
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            abortControllerRef.current.abort();
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        setPatients([]);

        // Clear any pending timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout to debounce the search
        searchTimeoutRef.current = setTimeout(() => {
            const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
            fetchPatients(tokenFromUrl);
        }, 500); // 500ms delay

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, selectedDate]);

    const fetchPatients = useCallback(async (tokenFromUrl) => {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            let apiUrl = `${urls.suggestfiles2}?query=${encodeURIComponent(searchQuery)}`;
            if (selectedDate) {
                apiUrl += `&date=${selectedDate}`;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenFromUrl }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Failed to fetch patients');
            const data = await response.json();
            setPatients(data);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching patient data:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDate]);

    const fetchClinicDetails = async (token) => {
        try {
            const response = await fetch(urls.fetchclinicdetails, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) throw new Error('Failed to fetch clinic details');
            const data = await response.json();
            setClinicDetails(data);
        } catch (error) {
            console.error('Error fetching clinic details:', error);
        }
    };

    const handleViewEditPatientFile = (fileId) => {
        const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
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

    const handleSearchChange = (event) => setSearchQuery(event.target.value);

    const handleDateChange = (event) => setSelectedDate(event.target.value);

    const handleClose = () => onClose();

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
    const formatLabTests = (labTests) => {
        if (!labTests) return null;
        try {
            const tests = JSON.parse(labTests);
            if (Array.isArray(tests) && tests.length > 0) {
                return tests.join(', ');
            }
            return null;
        } catch (e) {
            return labTests;
        }
    };

    const formatRadiologyExams = (radiologyExams) => {
        if (!radiologyExams) return null;
        try {
            const exams = JSON.parse(radiologyExams);
            if (Array.isArray(exams) && exams.length > 0) {
                return exams.join(', ');
            }
            return null;
        } catch (e) {
            return radiologyExams;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <div style={{
                maxWidth: '1200px',
                width: '95%',
                maxHeight: '90vh',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    flexShrink: 0,
                }}>
                    <div>
                        <h1 style={{
                            color: '#2c3e50',
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: 0,
                        }}>
                            Diagnostic Services Only Patients
                        </h1>
                        <p style={{
                            color: '#7f8c8d',
                            fontSize: '14px',
                            marginTop: '4px',
                        }}>
                            Patients who requested diagnostic services only
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            ':hover': {
                                backgroundColor: '#c0392b',
                            }
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Search and Filter Section */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                }}>
                    <div style={{
                        flex: '1',
                        minWidth: '300px',
                        position: 'relative',
                    }}>
                        <input
                            type="text"
                            placeholder="Search by patient name..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                fontSize: '14px',
                                border: '1px solid #dfe6e9',
                                borderRadius: '4px',
                                transition: 'border-color 0.2s',
                                ':focus': {
                                    outline: 'none',
                                    borderColor: '#3498db',
                                    boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
                                }
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#95a5a6',
                        }}>
                            🔍
                        </span>
                    </div>
                    
                    <div style={{
                        flex: '1',
                        minWidth: '250px',
                        position: 'relative',
                    }}>
                        <input
                            id="date-picker"
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                fontSize: '14px',
                                border: '1px solid #dfe6e9',
                                borderRadius: '4px',
                                transition: 'border-color 0.2s',
                                ':focus': {
                                    outline: 'none',
                                    borderColor: '#3498db',
                                    boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
                                }
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#95a5a6',
                        }}>
                            📅
                        </span>
                    </div>
                </div>

                {/* Patients List */}
                <div style={{
                    flex: '1',
                    overflowY: 'auto',
                    border: '1px solid #e1e5eb',
                    borderRadius: '6px',
                    // In the patient card div style, add:
minHeight: '300px', // or whatever height works best
display: 'flex',
flexDirection: 'column',
                }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                        }}>
                            <div style={{
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #3498db',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                animation: 'spin 1s linear infinite',
                            }}></div>
                        </div>
                    ) : patients.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '16px',
                            padding: '16px',
                        }}>
                            {patients.map(patient => (
                                <div
                                    key={patient.contact_id}
                                    style={{
                                        padding: '20px',
                                        border: '1px solid #e1e5eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        ':hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                        }
                                    }}
                                >
                                    {/* Patient Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        marginBottom: '12px',
                                    }}>
                                        <div>
                                            <h3 style={{
                                                color: '#2c3e50',
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                margin: '0 0 4px 0',
                                                textTransform: 'uppercase'
                                            }}>
                                                {`${patient.first_name} ${patient.last_name}`}
                                            </h3>
                                            <div style={{
                                                display: 'flex',
                                                gap: '16px',
                                                fontSize: '14px',
                                                color: '#7f8c8d',
                                            }}>
                                                <span>OPD: {patient.opd_no}</span>
                                                <span>File ID: {patient.file_id}</span>
                                                <span>Age: {patient.age}, {patient.sex}</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            color: '#7f8c8d',
                                            fontSize: '14px',
                                        }}>
                                            {formatDateTime(patient.date_time)}
                                        </div>
                                    </div>
                        
                                    {/* Patient Details */}
                                    <div style={{ flex: 1 }}>
                                        {patient.diagnosis && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p style={{
                                                    margin: '0',
                                                    fontSize: '14px',
                                                    color: '#34495e',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <strong style={{ color: '#2c3e50' }}>Diagnosis:</strong> {patient.diagnosis}
                                                </p>
                                            </div>
                                        )}
                        
                                        {formatLabTests(patient.lab_tests) && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <p style={{
                                                    margin: '0',
                                                    fontSize: '14px',
                                                    color: '#34495e',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <strong style={{ color: '#2c3e50' }}>Lab Tests:</strong> {formatLabTests(patient.lab_tests)}
                                                </p>
                                            </div>
                                        )}
                        
                                        {formatRadiologyExams(patient.radiology_exams) && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p style={{
                                                    margin: '0',
                                                    fontSize: '14px',
                                                    color: '#34495e',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <strong style={{ color: '#2c3e50' }}>Radiology Exams:</strong> {formatRadiologyExams(patient.radiology_exams)}
                                                </p>
                                            </div>
                                        )}
                        
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '16px',
                                            marginBottom: '16px',
                                        }}>
                                            {patient.lab_status_message && (
                                                <div 
                                                    onClick={() => patient.lab_status_message.includes('Click here') && handleShowLabResults(patient)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px',
                                                        borderRadius: '5px',
                                                        backgroundColor: patient.lab_status_message.includes('Click here') ? '#e8f4fc' : '#f5f5f5',
                                                        fontSize: '14px',
                                                        color: patient.lab_status_message.includes('Click here') ? '#3498db' : '#7f8c8d',
                                                        cursor: patient.lab_status_message.includes('Click here') ? 'pointer' : 'default',
                                                        transition: 'background-color 0.2s',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <span>🔬</span>
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
                                                        backgroundColor: patient.radiology_status_message.includes('Click here') ? '#e8f4fc' : '#f5f5f5',
                                                        fontSize: '14px',
                                                        color: patient.radiology_status_message.includes('Click here') ? '#3498db' : '#7f8c8d',
                                                        cursor: patient.radiology_status_message.includes('Click here') ? 'pointer' : 'default',
                                                        transition: 'background-color 0.2s',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <span>🖼️</span>
                                                    <span>{patient.radiology_status_message}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                        
                                    {/* View/Edit Button - Fixed to bottom and centered */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginTop: 'auto',
                                        paddingTop: '16px'
                                    }}>
                                        <button
                                            onClick={() => handleViewEditPatientFile(patient.file_id)}
                                            style={{
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '8px 16px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                transition: 'background-color 0.2s',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                ':hover': {
                                                    backgroundColor: '#2980b9',
                                                }
                                            }}
                                        >
                                            <span style={{ marginRight: '6px' }}>📝</span>
                                            View/Edit Patient File
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: '#7f8c8d',
                        }}>
                            <p style={{
                                fontSize: '16px',
                                margin: 0,
                            }}>
                                No patients found matching your criteria.
                            </p>
                        </div>
                    )}
                </div>

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
            </div>
        </div>
    );
}

export default Walkin;