import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faEye, faEyeSlash, faChartLine, faUsers } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function PTmodal({ token, onClose }) {
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [visibleEmployees, setVisibleEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const currentYear = new Date().getFullYear();

  // Minimal color palette with primary accent
  const colorPalette = [
    '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5'
  ];

  // Consistent color assignment function
  const getEmployeeColor = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  useEffect(() => {
    fetchPerformanceTrends();
  }, []);

  const fetchPerformanceTrends = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(urls.performanceTrends, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }

      const { firstEmployee, performanceTrends: trends } = data;
      
      if (!trends || trends.length === 0) {
        setErrorMessage('No performance data available');
        return;
      }

      const firstEmployeeExists = trends.some(employee => 
        employee.name.trim().toLowerCase() === firstEmployee?.trim().toLowerCase()
      );

      const initialEmployee = firstEmployeeExists ? firstEmployee : trends[0].name;
      const visibility = trends.reduce((acc, employee) => {
        acc[employee.name] = employee.name === initialEmployee;
        return acc;
      }, {});

      setPerformanceTrends(trends);
      setVisibleEmployees(visibility);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to load performance trends');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployee = (name) => {
    setVisibleEmployees(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleToggleAll = () => {
    const allVisible = performanceTrends.every(emp => visibleEmployees[emp.name]);
    const newVisibility = performanceTrends.reduce((acc, employee) => {
      acc[employee.name] = !allVisible;
      return acc;
    }, {});
    setVisibleEmployees(newVisibility);
  };

  const filteredEmployees = performanceTrends.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLineGraphData = () => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    const datasets = performanceTrends
      .filter(employee => visibleEmployees[employee.name])
      .map((employee) => {
        const employeeIndex = performanceTrends.findIndex(e => e.name === employee.name);
        const data = labels.map((_, monthIndex) => 
          monthIndex < employee.monthlyScores.length ? parseInt(employee.monthlyScores[monthIndex]) : null
        );

        return {
          label: employee.name,
          data: data,
          borderColor: getEmployeeColor(employeeIndex),
          backgroundColor: getEmployeeColor(employeeIndex) + '20',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        };
      });
  
    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: '#111827',
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const { data } = chart;
            if (data.datasets.length) {
              return data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.borderColor,
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                pointStyle: 'circle',
                hidden: !chart.isDatasetVisible(i),
                index: i
              }));
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (context) => `${context[0].label} ${currentYear}`,
          label: (context) => `${context.dataset.label}: ${context.parsed.y} pts`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#6b7280' }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#6b7280' },
        beginAtZero: true
      },
    }
  };

  const visibleCount = Object.values(visibleEmployees).filter(Boolean).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        width: '95%',
        height: '90%',
        maxWidth: '1400px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#2563eb', fontSize: '20px' }} />
            <h2 style={{ margin: 0, color: '#111827', fontWeight: '600', fontSize: '20px' }}>
              Performance Trends {currentYear}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '16px'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100% - 80px)'
          }}>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#2563eb' }} />
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading performance data...</p>
          </div>
        ) : errorMessage ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100% - 80px)'
          }}>
            <p style={{ color: '#dc2626', marginBottom: '16px' }}>{errorMessage}</p>
            <button
              onClick={fetchPerformanceTrends}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', height: 'calc(100% - 80px)' }}>
            {/* Chart Area */}
            <div style={{
              flex: 1,
              padding: '24px',
              backgroundColor: '#fff',
              borderRight: '1px solid #e5e7eb'
            }}>
              {visibleCount > 0 ? (
                <>
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      backgroundColor: '#2563eb10',
                      color: '#2563eb',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {visibleCount} selected
                    </span>
                  </div>
                  <div style={{ height: 'calc(100% - 40px)' }}>
                    <Line data={getLineGraphData()} options={chartOptions} />
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: '#9ca3af'
                }}>
                  <FontAwesomeIcon icon={faEyeSlash} size="2x" style={{ marginBottom: '12px' }} />
                  <p>Select employees to view trends</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{
              width: '320px',
              backgroundColor: '#f9fafb',
              padding: '20px',
              overflowY: 'auto'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FontAwesomeIcon icon={faUsers} style={{ color: '#2563eb' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Employees</h3>
                </div>
                
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}
                />

                <button
                  onClick={handleToggleAll}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {performanceTrends.every(emp => visibleEmployees[emp.name]) ? 'Hide All' : 'Show All'}
                </button>
              </div>

              {filteredEmployees.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>No matches found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredEmployees.map((employee, index) => {
                    const isVisible = visibleEmployees[employee.name];
                    const color = getEmployeeColor(index);
                    
                    return (
                      <div
                        key={employee.name}
                        onClick={() => handleToggleEmployee(employee.name)}
                        style={{
                          padding: '12px',
                          backgroundColor: isVisible ? '#2563eb10' : 'transparent',
                          border: `1px solid ${isVisible ? color + '40' : '#e5e7eb'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: color,
                          opacity: isVisible ? 1 : 0.3
                        }} />
                        <span style={{ flex: 1, color: isVisible ? '#111827' : '#6b7280' }}>
                          {employee.name}
                        </span>
                        <FontAwesomeIcon 
                          icon={isVisible ? faEye : faEyeSlash} 
                          style={{ color: isVisible ? color : '#9ca3af' }} 
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PTmodal;