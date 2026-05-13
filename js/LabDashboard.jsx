import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import './LabDashboard.css';
import Topbar from './Topbar';
import Resultmodallab from './Resultmodallab';

function LabDashboard() {
  const [pendingLabTestsCount, setPendingLabTestsCount] = useState(0);
  const [recentLabTests, setRecentLabTests] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicDetails, setClinicDetails] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLabResultsModalOpen, setIsLabResultsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');

  // Filter patients based on search term :cite[2]
  const filteredLabTests = recentLabTests.filter(patient => {
    if (!searchTerm) return true;
    
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
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
            fetchPendingLabTestsCount(tokenFromUrl);
            fetchRecentLabTests(tokenFromUrl);
            fetchClinicDetails(tokenFromUrl);
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

  const fetchPendingLabTestsCount = async (token) => {
    try {
      const response = await fetch(urls.labtestscount, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setPendingLabTestsCount(data.total_pending);
      } else {
        throw new Error('Failed to fetch pending lab tests count');
      }
    } catch (error) {
      console.error('Error fetching pending lab tests count:', error);
    }
  };

  const fetchRecentLabTests = async (token) => {
    try {
      const response = await fetch(urls.alllab, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecentLabTests(data.patients || []);
      } else {
        throw new Error('Failed to fetch recent lab tests');
      }
    } catch (error) {
      console.error('Error fetching recent lab tests:', error);
    }
  };

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

  const handleShowLabResults = (patient) => {
    setSelectedPatient({
      ...patient,
      clinicDetails,
    });
    setIsLabResultsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLabResultsModalOpen(false);
  };

  useEffect(() => {
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      const interval = setInterval(() => fetchPendingLabTestsCount(tokenFromUrl), 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoToPendingLabTests = () => {
    const tokenFromUrl = params.get('token');
    navigate(`/lab?token=${tokenFromUrl}`);
  };

  const bounceKeyframes = `
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
  `;

  return (
    <>
      <style>{bounceKeyframes}</style>
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        paddingTop: '80px',
        boxSizing: 'border-box',
      
      }}>
        <Topbar token={urlToken} />

        {/* Alert Section */}
        <div style={{
          width: '100%',
          padding: '0 20px',
          boxSizing: 'border-box',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'flex-start'
        }}>
          {pendingLabTestsCount > 0 ? (
            <div
              onClick={handleGoToPendingLabTests}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ff6b35',
                color: 'white',
                border: '2px solid #ff6b35',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                animation: 'bounce 2s infinite',
                transition: 'all 0.3s ease',
                display: 'inline-block',
                width: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e55a2b';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6b35';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ⚠️ {pendingLabTestsCount} patient{pendingLabTestsCount > 1 ? 's' : ''} waiting for lab services
            </div>
          ) : (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: '2px solid #28a745',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: '500',
              display: 'inline-block',
              width: 'auto'
            }}>
              ✓ No patients waiting for lab services
            </div>
          )}
        </div>

        {/* Main Content Container */}
        <div style={{
          width: '100%',
          padding: '0 20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <h2 style={{
              fontSize: '30px',
              color: '#2c3e50',
              fontWeight: 'bold',
              margin: 0
            }}>
              Recent Lab Tests Done
            </h2>
            
            {/* Search Input */}
            <div style={{
              position: 'relative',
              minWidth: '300px'
            }}>
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingLeft: '40px',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  color: '#2c3e50',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#dee2e6';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d',
                fontSize: '18px'
              }}>
                🔍
              </span>
            </div>
          </div>

          {searchTerm && (
            <p style={{
              textAlign: 'left',
              color: '#6c757d',
              marginBottom: '20px',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Showing {filteredLabTests.length} patient{filteredLabTests.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </p>
          )}

          {/* Lab Tests Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            width: '100%',
            marginBottom: '40px'
          }}>
            {filteredLabTests.length === 0 ? (
              <p style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                fontSize: '18px',
                color: '#6c757d',
                padding: '40px'
              }}>
                {searchTerm ? 'No patients found matching your search.' : 'No recent lab tests available.'}
              </p>
            ) : (
              filteredLabTests.map((patient) => (
                <div
                  key={patient.file_id}
                  style={{
                    padding: '20px',
                    border: '1px solid #dee2e6',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Patient Name */}
                  <h3 style={{
                    color: '#2c3e50',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    marginBottom: '15px',
                    fontSize: '18px',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: '10px'
                  }}>
                    {patient.first_name} {patient.last_name}
                  </h3>

                  {/* Patient Details */}
                  <div style={{
                    color: 'black',
                    marginBottom: '15px',
                    flex: '1'
                  }}>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Age:</strong> {patient.age}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Sex:</strong> {patient.sex}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Contact:</strong> {patient.phone_number || 'N/A'}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Address:</strong> {patient.address || 'N/A'}
                    </p>
                    <p style={{
                      margin: '8px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      {patient.lab_test}
                    </p>
                  </div>

                  {/* Edit Results Button */}
                  <span
                    onClick={() => handleShowLabResults(patient)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      borderRadius: '5px',
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      marginTop: '10px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#007bff';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#007bff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Edit Results
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lab Results Modal */}
        {isLabResultsModalOpen && (
          <Resultmodallab
            patient={selectedPatient}
            clinicDetails={clinicDetails}
            onClose={handleCloseModal}
            token={urlToken}
          />
        )}
      </div>
    </>
  );
}

export default LabDashboard;