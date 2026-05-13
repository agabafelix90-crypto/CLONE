import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faChartLine, faCrown, faSpinner, faEye, faEyeSlash, faCircle } from '@fortawesome/free-solid-svg-icons';
import { resolveTheme, parseThemeFromSearch } from './themeUtils';
import Topbar from './Topbar';
import MissingDrugs from './MissingDrugs';
import PTmodal from './PTmodal';
import DetailedPerformanceModal from './DetailedPerformanceModal';

// Register components
ChartJS.register(ArcElement, Tooltip, Legend);

function getStartOfMonth() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start);
}

function getEndOfMonth() {
  const today = new Date();
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(end);
}

function Performance() {
  const [performanceData, setPerformanceData] = useState([]);
  const [detailedData, setDetailedData] = useState([]);
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getEndOfMonth());
  const [selectedSection, setSelectedSection] = useState('Overall');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dataAvailable, setDataAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState('');
  const [loadingSection, setLoadingSection] = useState(false);
  const navigate = useNavigate();
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [isPTModalOpen, setIsPTModalOpen] = useState(false);
  const [isDetailedPerformanceModalOpen, setIsDetailedPerformanceModalOpen] = useState(false);
  const [selectedEmployee2, setSelectedEmployee2] = useState(null);
  const [showLeftContainerHeaders, setShowLeftContainerHeaders] = useState(true);
  const [isPageAnimated, setIsPageAnimated] = useState(false);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState('white');

  useEffect(() => {
    // Trigger page animation
    setTimeout(() => setIsPageAnimated(true), 100);
    
    const token = getTokenFromUrlOrLocalStorage();
    performSecurityCheck(token);
  }, [startDate, endDate, selectedSection]);

  const getTokenFromUrlOrLocalStorage = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    return tokenFromUrl || localStorage.getItem('token');
  };
  
  const urlToken = getTokenFromUrlOrLocalStorage();
  const urlTheme = parseThemeFromSearch(window.location.search);

  const performSecurityCheck = async (token) => {
    try {
      const securityResponse = await fetch(urls.security, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        if (securityData.message === 'Session valid') {
          const themeColor = securityData.colour || '';
          setCurrentTheme(resolveTheme(urlTheme, themeColor));
          
          fetchPerformanceData(token);
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

  const fetchPerformanceData = async (token) => {
    try {
      setLoading(true);
      setLoadingSection(true);
      const response = await fetch(urls.fetchperformance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          startDate,
          endDate,
          section: selectedSection,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
        setDataAvailable(false);
      } else {
        data.sort((a, b) => b.percentage - a.percentage);
        setPerformanceData(data);
        setSelectedEmployee(data[0]?.employee_name || '');
        fetchDetailedPerformance(data[0]?.employee_name || '', token);
        setMessage('');
        setDataAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
      setLoadingSection(false);
    }
  };

  const fetchDetailedPerformance = async (employeeName, token) => {
    try {
      setLoadingEmployee(employeeName);
      const response = await fetch(urls.detailedperformance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeName, token }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        const groupedData = data.reduce((acc, item) => {
          const date = item.Date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(item);
          return acc;
        }, {});

        const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

        const sortedData = sortedDates.map(date => {
          const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
          return {
            date,
            dayOfWeek,
            items: groupedData[date],
          };
        });

        setDetailedData(sortedData);
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching detailed performance:', error);
    } finally {
      setLoadingEmployee('');
    }
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    const token = getTokenFromUrlOrLocalStorage();
    fetchPerformanceData(token);
  };

  const handleEmployeeClick = (employeeName) => {
    setSelectedEmployee(employeeName);
    const token = getTokenFromUrlOrLocalStorage();
    fetchDetailedPerformance(employeeName, token);
  };

  const handlePrintRanking = async () => {
    try {
      setLoadingPrint(true);
      const token = getTokenFromUrlOrLocalStorage();
      const rankingData = performanceData.map(item => ({
        name: item.employee_name,
        percentage: item.percentage,
      }));

      const response = await fetch(urls.printRanking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          rankings: rankingData,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(pdfUrl);

      if (!pdfWindow) {
        alert('Please allow popups for this website');
      }
    } catch (error) {
      console.error('Error printing ranking:', error);
    } finally {
      setLoadingPrint(false);
    }
  };

  const handleOpenPTModal = () => {
    setIsPTModalOpen(true);
  };

  const handleClosePTModal = () => {
    setIsPTModalOpen(false);
  };

  const handleOpenDetailedPerformanceModal = (employeeName) => {
    setSelectedEmployee2(employeeName);
    setIsDetailedPerformanceModalOpen(true);
  };

  const handleCloseDetailedPerformanceModal = () => {
    setIsDetailedPerformanceModalOpen(false);
  }

  const toggleLeftContainerHeaders = () => {
    setShowLeftContainerHeaders(!showLeftContainerHeaders);
  };

  const sectionButtons = [
    "Overall", "Triage", "Doctors Room", "Pharmacy", "Store",
    "DrugAdministration", "Cashier", "Laboratory", "Radiology",
    "Family Planning", "ANC", "Deliveries", "Client Feedbacks"
  ];

  const pieChartData = {
    labels: performanceData.map(item => item.employee_name),
    datasets: [
      {
        data: performanceData.map(item => item.percentage),
        backgroundColor: performanceData.map((_, index) =>
          `hsl(${(index * 360) / performanceData.length}, 70%, 60%)`
        ),
        borderWidth: 1,
        borderColor: '#fff',
      }
    ]
  };

  const getProgressBarColor = (percentage) => {
    if (percentage > 75) return '#27ae60';
    if (percentage > 50) return '#f39c12';
    if (percentage > 25) return '#e67e22';
    return '#e74c3c';
  };

  const containerAnimation = {
    opacity: isPageAnimated ? 1 : 0,
    transform: isPageAnimated ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.5s ease, transform 0.5s ease'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: currentTheme === 'blue' ? '#0a1e4a' : '#ffffff',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease'
    }}>
      <Topbar token={urlToken} themeColor={currentTheme} />
      <MissingDrugs token={urlToken} />

      <div style={{
        display: 'flex',
        flex: 1,
        padding: '20px',
        gap: '20px',
        overflow: 'hidden',
        height: 'calc(100vh - 80px)',
        marginTop: '45px'
      }}>
        {/* Left Container */}
        <div style={{
          flex: '0 0 65%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          position: 'relative',
          ...containerAnimation,
          transitionDelay: '0.1s'
        }}>
          <button
            onClick={toggleLeftContainerHeaders}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 100,
              padding: '6px 10px',
              backgroundColor: currentTheme === 'blue' ? '#2563eb' : '#3498db',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FontAwesomeIcon icon={showLeftContainerHeaders ? faEyeSlash : faEye} />
            {showLeftContainerHeaders ? 'Hide Headers' : 'Show Headers'}
          </button>

          {showLeftContainerHeaders && (
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #eee'
            }}>
              <h1 style={{
                margin: 0,
                color: '#000000',
                fontSize: '24px',
                fontWeight: '600'
              }}>Employee Qualitative and Quantitative Participation</h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '15px 0',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label style={{ fontSize: '14px', color: '#000000' }}>From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      color: '#000000'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label style={{ fontSize: '14px', color: '#000000' }}>To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      color: '#000000'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '10px'
              }}>
                {sectionButtons.map((section) => (
                  <button
                    key={section}
                    onClick={() => handleSectionChange(section)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: selectedSection === section ? (currentTheme === 'blue' ? '#2563eb' : '#3498db') : '#f0f0f0',
                      color: selectedSection === section ? '#ffffff' : '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {loadingSection && selectedSection === section ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      section
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {showLeftContainerHeaders && (
              <div style={{
                padding: '0 20px 15px 20px',
                borderBottom: '1px solid #eee'
              }}>
                <h2 style={{
                  margin: '15px 0 10px 0',
                  color: '#000000',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>Detailed Participation Summary</h2>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '15px'
                }}>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '20px' }}>
                      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                    </div>
                  ) : (
                    performanceData.map((item, index) => (
                      <button
                        key={item.employee_name}
                        onClick={() => handleEmployeeClick(item.employee_name)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: selectedEmployee === item.employee_name ? (currentTheme === 'blue' ? '#2563eb' : '#3498db') : '#f0f0f0',
                          color: selectedEmployee === item.employee_name ? '#ffffff' : '#000000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {loadingEmployee === item.employee_name ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <>
                            {index === 0 && <FontAwesomeIcon icon={faCrown} style={{ color: '#f1c40f' }} />}
                            {item.employee_name}
                          </>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#ffffff'
            }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                </div>
              ) : (
                detailedData.map((group) => (
                  <div key={group.date} style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      margin: '0 0 12px 0',
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      {`${group.dayOfWeek}, ${group.date}`}
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {group.items.map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '14px',
                          color: '#000000',
                          lineHeight: '1.5'
                        }}>
                          <FontAwesomeIcon 
                            icon={faCircle} 
                            style={{ 
                              fontSize: '6px', 
                              color: '#000000', // Black bullets for both themes
                              marginTop: '6px'
                            }} 
                          />
                          <span>
                            {item.time ? `At ${item.time} ` : ''}
                            {item.Sentence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Container */}
        <div style={{
          flex: '0 0 35%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          ...containerAnimation,
          transitionDelay: '0.2s'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#ffffff'
            }}>
              {dataAvailable ? (
                <>
                  <div style={{
                    height: '280px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <Doughnut
                      data={pieChartData}
                      options={{
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              boxWidth: 12,
                              padding: 10,
                              font: {
                                size: 11
                              },
                              color: '#000000'
                            }
                          }
                        },
                        maintainAspectRatio: false
                      }}
                    />
                  </div>

                  <h2 style={{
                    margin: '5px 0 15px 0',
                    color: '#000000',
                    fontSize: '16px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {selectedSection} Performance
                  </h2>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {performanceData.map((item) => (
                      <div
                        key={item.employee_name}
                        onClick={() => handleOpenDetailedPerformanceModal(item.employee_name)}
                        style={{
                          padding: '8px 0',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          borderBottom: '1px solid #f0f0f0',
                          ':hover': {
                            opacity: 0.8
                          }
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#000000'
                          }}>
                            {item.employee_name}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: getProgressBarColor(item.percentage)
                          }}>
                            {item.percentage}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${item.percentage}%`,
                            height: '100%',
                            backgroundColor: getProgressBarColor(item.percentage),
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: '#e74c3c'
                }}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div style={{
            padding: '15px 20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '10px',
            backgroundColor: '#ffffff'
          }}>
            <button
              onClick={handlePrintRanking}
              disabled={loadingPrint}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loadingPrint ? '#95a5a6' : (currentTheme === 'blue' ? '#2563eb' : '#3498db'),
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: loadingPrint ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FontAwesomeIcon icon={loadingPrint ? faSpinner : faPrint} spin={loadingPrint} />
              Print Ranking
            </button>

            <button
              onClick={handleOpenPTModal}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: currentTheme === 'blue' ? '#16a34a' : '#2ecc71',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FontAwesomeIcon icon={faChartLine} />
              Trends
            </button>
          </div>
        </div>
      </div>

      {isPTModalOpen && (
        <PTmodal isOpen={isPTModalOpen} onClose={handleClosePTModal} token={urlToken} />
      )}

      {isDetailedPerformanceModalOpen && (
        <DetailedPerformanceModal
          employeeName={selectedEmployee2}
          onClose={handleCloseDetailedPerformanceModal}
          startDate={startDate}
          endDate={endDate}
          token={urlToken}
        />
      )}
    </div>
  );
}

export default Performance;