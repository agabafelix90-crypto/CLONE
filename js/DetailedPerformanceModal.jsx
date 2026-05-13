import React, { useState, useEffect } from "react";
import { urls } from './config.dev';

const DetailedPerformanceModal = ({ employeeName, startDate, endDate, token, onClose }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employeeName && startDate && endDate) {
      const fetchPerformanceData = async () => {
        try {
          const response = await fetch(urls.fetchDetailedperformance2, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeName,
              startDate,
              endDate,
              token,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch performance data');
          }

          const data = await response.json();
          setPerformanceData(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchPerformanceData();
    }
  }, [employeeName, startDate, endDate]);

  if (!employeeName) return null;

  // CSS Styles
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#ffffff',
      width: '85%',
      maxWidth: '900px',
      maxHeight: '90vh',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      position: 'relative',
      color: '#333',
      overflowY: 'auto',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#666',
      fontSize: '1.5rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      '&:hover': {
        color: '#333',
      }
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      color: '#2c3e50',
      borderBottom: '1px solid #eee',
      paddingBottom: '1rem',
    },
    loadingError: {
      textAlign: 'center',
      padding: '2rem',
      color: '#d9534f',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#495057',
      margin: '1.5rem 0 1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #eee',
    },
    statItem: {
      display: 'flex',
      justifyContent: 'space-between',
      backgroundColor: '#f9f9f9',
      padding: '0.8rem 1rem',
      marginBottom: '0.8rem',
      borderRadius: '6px',
      '&:hover': {
        backgroundColor: '#f1f1f1',
      }
    },
    statLabel: {
      fontWeight: '500',
      color: '#555',
    },
    statValue: {
      fontWeight: '600',
      color: '#2c3e50',
    },
    drugStats: {
      backgroundColor: '#f9f9f9',
      padding: '1.5rem',
      borderRadius: '8px',
      marginTop: '1.5rem',
    },
    drugStatItem: {
      marginBottom: '0.8rem',
      paddingBottom: '0.8rem',
      borderBottom: '1px dashed #eee',
      '&:last-child': {
        borderBottom: 'none',
      }
    },
    closeButtonBottom: {
      backgroundColor: '#d9534f',
      color: 'white',
      border: 'none',
      padding: '0.8rem 2rem',
      borderRadius: '6px',
      marginTop: '2rem',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '1rem',
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
      '&:hover': {
        backgroundColor: '#c9302c',
      }
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <button 
          onClick={onClose} 
          style={styles.closeButton}
          aria-label="Close modal"
        >
          ×
        </button>

        <div style={{ padding: '1rem' }}>
          <h2 style={styles.header}>
            Performance Report: <span style={{ textTransform: 'uppercase', color: '#3498db' }}>{employeeName}</span><br />
            <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#777' }}>
              {startDate} to {endDate}
            </span>
          </h2>

          {loading && <p style={styles.loadingError}>Loading performance data...</p>}
          {error && <p style={{ ...styles.loadingError, color: '#d9534f' }}>{error}</p>}

          {performanceData && (
            <>
              <div>
                <h3 style={styles.sectionTitle}>Performance Metrics</h3>
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Days Worked:</span>
                    <span style={styles.statValue}>{performanceData.totalDaysWorked}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Drugs Taken From Store:</span>
                    <span style={styles.statValue}>{performanceData.drugsTakenFromStore}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Drugs Inserted Into Store:</span>
                    <span style={styles.statValue}>{performanceData.drugsInsertedIntoStore}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Lab Tests Done:</span>
                    <span style={styles.statValue}>{performanceData.totalLabTestsDone}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Radiology Exams Done:</span>
                    <span style={styles.statValue}>{performanceData.totalRadiologyExamsDone}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Times Received Money as Cashier:</span>
                    <span style={styles.statValue}>{performanceData.totalReceivedMoney}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Triaged:</span>
                    <span style={styles.statValue}>{performanceData.totalTriaged}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Mothers Delivered:</span>
                    <span style={styles.statValue}>{performanceData.totalMothersDelivered}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Most Rated Feedback:</span>
                    <span style={styles.statValue}>{performanceData.mostRatedFeedback}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Patients Clerked & Prescribed:</span>
                    <span style={styles.statValue}>{performanceData.clerkedAndPrescribed}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Mothers Provided Antenatal Care:</span>
                    <span style={styles.statValue}>{performanceData.totalANCProvided}</span>
                  </div>
                  
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Patients Provided Family Planning:</span>
                    <span style={styles.statValue}>{performanceData.totalFamilyPlanning}</span>
                  </div>
                </div>
              </div>

              <div style={styles.drugStats}>
                <h3 style={styles.sectionTitle}>Drug Administration Details</h3>
                
                <div style={styles.drugStatItem}>
                  <div style={styles.statLabel}>Total drugs administered to patients:</div>
                  <div style={styles.statValue}>{performanceData.administeredDrugsCount}</div>
                </div>
                
                <div style={styles.drugStatItem}>
                  <div style={styles.statLabel}>Patients administered drugs to:</div>
                  <div style={styles.statValue}>{performanceData.administeredDrugsPatientsCount}</div>
                </div>
                
                <div style={styles.drugStatItem}>
                  <div style={styles.statLabel}>Drugs used when serving inpatients:</div>
                  <div style={styles.statValue}>{performanceData.usedDrugsCount}</div>
                </div>
                
                <div style={styles.drugStatItem}>
                  <div style={styles.statLabel}>Most administered inpatient drugs:</div>
                  <div style={styles.statValue}>
                    {performanceData.mostUsedDrugPackagingCombination?.length > 0
                      ? performanceData.mostUsedDrugPackagingCombination
                          .map(({ Drug, Packaging, totalQuantity }) => 
                            `${totalQuantity} ${Packaging} of ${Drug}`
                          )
                          .join(', ')
                      : 'None recorded'}
                  </div>
                </div>
                
                <div style={styles.drugStatItem}>
                  <div style={styles.statLabel}>Most sold over-the-counter drugs:</div>
                  <div style={styles.statValue}>
                    {performanceData.mostSoldDrugPackagingCombination?.length > 0
                      ? performanceData.mostSoldDrugPackagingCombination
                          .map(({ Drug, Packaging, totalQuantity }) => 
                            `${totalQuantity} ${Packaging} of ${Drug}`
                          )
                          .join(', ')
                      : 'None recorded'}
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose} 
                style={styles.closeButtonBottom}
              >
                Close Report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedPerformanceModal;