import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import './Patientappointments.css';
import { faCalendarPlus, faTimes, faUser, faPhone, faVenusMars, faPrayingHands, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    appointmentReason: '',
    appointmentMessage: '',
    appointmentDate: ''
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showScheduleAppointmentPrompt, setShowScheduleAppointmentPrompt] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [confirmingAppointment, setConfirmingAppointment] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(true); // Changed to true initially
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
  
        console.log('URL Token:', tokenFromUrl);
  
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
            saveSessionToken(securityData.clinic_session_token);
            fetchAppointments(tokenFromUrl);
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

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
  
      let url = showAllAppointments ? `${urls.appointments}?filter=all` : urls.appointments;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: tokenFromUrl })
      });
  
      if (response.ok) {
        const data = await response.json();
        const appointments = data.appointments || data;
        setAppointments(appointments);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [showAllAppointments]);

  const toggleAppointments = () => {
    setShowAllAppointments(!showAllAppointments);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (name === 'patientName') {
      fetchSuggestions(value);
    }
  };

  const fetchSuggestions = async (partialName) => {
    try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        console.log('name:', partialName);
        console.log('token:', tokenFromUrl);

        const url = `${urls.suggest}?name=${encodeURIComponent(partialName)}&token=${encodeURIComponent(tokenFromUrl)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message) {
                setSearchError(data.message);
                setSuggestions([]);
            } else {
                setSearchError('');
                setSuggestions(data);
            }
        } else {
            throw new Error('Failed to fetch suggestions');
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedPatient(suggestion);
    setNewAppointment({
      patientName: `${suggestion.first_name} ${suggestion.last_name}`,
      appointmentReason: '',
      appointmentMessage: '',
      appointmentDate: ''
    });
    setSuggestions([]);
  };

  const handleConfirmAppointment = async () => {
    if (
      !newAppointment.patientName ||
      !newAppointment.appointmentReason ||
      !newAppointment.appointmentMessage ||
      !newAppointment.appointmentDate
    ) {
      alert('Please fill in all fields before confirming the appointment.');
      return;
    }
  
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newAppointment.appointmentDate)) {
      alert('Invalid date format. Please use YYYY-MM-DD format.');
      return;
    }
  
    setConfirmingAppointment(true);
  
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
  
      const payload = {
        ...newAppointment,
        phoneNumber: selectedPatient.phone_number,
        age: selectedPatient.age,
        sex: selectedPatient.sex,
        religion: selectedPatient.religion,
        dob: selectedPatient.dob,
        token: tokenFromUrl
      };
  
      const response = await fetch(urls.confirmappointment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setNewAppointment({
          patientName: '',
          appointmentReason: '',
          appointmentMessage: '',
          appointmentDate: ''
        });
        fetchAppointments();
        setShowScheduleAppointmentPrompt(false);
      } else {
        throw new Error('Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
    } finally {
      setConfirmingAppointment(false);
    }
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
      padding: '32px'
    }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700',
          color: '#1e293b',
          margin: 0
        }}>
          Appointment Management
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowScheduleAppointmentPrompt(true)} 
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              e.currentTarget.style.backgroundColor = '#5a6fd8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.backgroundColor = '#667eea';
            }}
          >
            <FontAwesomeIcon icon={faCalendarPlus} /> Schedule Appointment
          </button>
          <button 
            onClick={toggleAppointments} 
            style={{ 
              padding: '12px 24px',
              backgroundColor: showAllAppointments ? '#f5576c' : '#4facfe',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 172, 254, 0.4)';
              e.currentTarget.style.backgroundColor = showAllAppointments ? '#e74c5c' : '#3da1f7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
              e.currentTarget.style.backgroundColor = showAllAppointments ? '#f5576c' : '#4facfe';
            }}
          >
            {showAllAppointments ? 'Today Only' : 'All Appointments'}
          </button>
        </div>
      </div>
  
      {/* Modal */}
      {showScheduleAppointmentPrompt && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            width: '90%', 
            maxWidth: '700px',
            maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header - Fixed */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#667eea',
              color: 'white'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                Schedule New Appointment
              </h2>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div className="transaction-prompt">
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#334155',
                    fontSize: '14px'
                  }}>
                    Patient Name
                  </label>
                  <input 
                    type="text" 
                    name="patientName" 
                    placeholder="Search for patient..." 
                    value={newAppointment.patientName} 
                    onChange={handleInputChange} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      borderRadius: '8px', 
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Suggestions List */}
                {(suggestions.length > 0 || searchError) && (
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: '0 0 20px 0',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {searchError ? (
                      <li style={{ 
                        padding: '12px 16px', 
                        color: '#64748b',
                        fontSize: '14px'
                      }}>
                        {searchError}
                      </li>
                    ) : (
                      suggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          onClick={() => handleSelectSuggestion(suggestion)} 
                          style={{ 
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < suggestions.length - 1 ? '1px solid #e2e8f0' : 'none',
                            transition: 'background-color 0.2s ease',
                            fontSize: '14px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#667eea' }} />
                          {`${suggestion.first_name} ${suggestion.last_name}`}
                        </li>
                      ))
                    )}
                  </ul>
                )}
  
                {/* Patient Details */}
                {selectedPatient && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 16px 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Patient Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          <FontAwesomeIcon icon={faPhone} /> Phone Number
                        </label>
                        <input 
                          type="text" 
                          value={selectedPatient.phone_number} 
                          readOnly 
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px',
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                          
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block',
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          Age
                        </label>
                        <input 
                          type="text" 
                          value={selectedPatient.age} 
                          readOnly 
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px',
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          <FontAwesomeIcon icon={faVenusMars} /> Sex
                        </label>
                        <input 
                          type="text" 
                          value={selectedPatient.sex} 
                          readOnly 
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px',
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          <FontAwesomeIcon icon={faPrayingHands} /> Religion
                        </label>
                        <input 
                          type="text" 
                          value={selectedPatient.religion} 
                          readOnly 
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px',
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          <FontAwesomeIcon icon={faBirthdayCake} /> Date of Birth
                        </label>
                        <input 
                          type="text" 
                          value={selectedPatient.dob} 
                          readOnly 
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px',
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
  
                {/* Appointment Details */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#334155',
                    fontSize: '14px'
                  }}>
                    Appointment Reason
                  </label>
                  <input 
                    type="text" 
                    name="appointmentReason" 
                    placeholder="e.g., Regular checkup, Follow-up..." 
                    value={newAppointment.appointmentReason} 
                    onChange={handleInputChange} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      borderRadius: '8px', 
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#334155',
                    fontSize: '14px'
                  }}>
                    Appointment Date
                  </label>
                  <input 
                    type="date" 
                    name="appointmentDate" 
                    value={newAppointment.appointmentDate} 
                    onChange={handleInputChange} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      borderRadius: '8px', 
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#334155',
                    fontSize: '14px'
                  }}>
                    Appointment Message
                  </label>
                  <textarea 
                    name="appointmentMessage" 
                    placeholder="Additional notes or instructions..." 
                    value={newAppointment.appointmentMessage} 
                    onChange={handleInputChange}
                    rows="4"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px',
                      borderRadius: '8px', 
                      border: '2px solid #e2e8f0',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                onClick={() => setShowScheduleAppointmentPrompt(false)} 
                style={{ 
                  padding: '10px 24px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
              {confirmingAppointment ? (
                <div style={{ 
                  padding: '10px 24px',
                  color: '#667eea',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  Processing...
                </div>
              ) : (
                <button 
                  onClick={handleConfirmAppointment} 
                  style={{ 
                    padding: '10px 24px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                    e.currentTarget.style.backgroundColor = '#5a6fd8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.backgroundColor = '#667eea';
                  }}
                >
                  Confirm Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
  
      {/* Appointments List */}
      <div>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {showAllAppointments ? 'All Appointments' : 'Today\'s Appointments'}
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {appointments.map((appointment) => (
            <div 
              key={appointment.appointment_id} 
              style={{
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '16px',
                color: '#1e293b',
                paddingBottom: '12px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#667eea' }} />
                {`${appointment.first_name} ${appointment.last_name}`}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Age:</span>
                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{appointment.age}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Phone:</span>
                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{appointment.phone_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Date:</span>
                  <span style={{ color: '#667eea', fontWeight: '600' }}>{appointment.date_of_appointment}</span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                    REASON
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.5' }}>
                    {appointment.appointment_reason}
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                    MESSAGE
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.5', maxHeight: '80px', overflowY: 'auto' }}>
                    {appointment.appointment_message}
                  </div>
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: appointment.reminded === 'Yes' ? '#d1fae5' : '#fef3c7',
                  color: appointment.reminded === 'Yes' ? '#065f46' : '#92400e'
                }}>
                  {appointment.reminded === 'Yes' ? '✓ Reminded' : '⏳ Pending Reminder'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {appointments.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <h3 style={{ color: '#64748b', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No Appointments Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              {showAllAppointments ? 'There are no appointments scheduled.' : 'There are no appointments for today.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientAppointments;