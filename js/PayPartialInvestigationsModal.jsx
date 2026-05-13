import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { urls } from './config.dev';

function PayPartialInvestigationsModal({ isOpen, onClose, patient, token, refreshData }) {
  const [tests, setTests] = useState([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [creditedTotal, setCreditedTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: selection, 1: confirmation
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  useEffect(() => {
    if (isOpen && patient) {
      if (patient.tests) {
        const initialTests = patient.tests.map(test => ({
          ...test,
          price: parseFloat(test.price) || 0,
          isSelected: false,
          paymentStatus: null // null: not asked, true: pay now, false: credit
        }));
        setTests(initialTests);
        setCurrentTestIndex(0);
        setCurrentStep(0);

        const totalBill = parseFloat(patient.totalBill) || 0;
        setCreditedTotal(0);
        setPaidTotal(totalBill);
      }

      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, patient]);

  const handleTestDecision = (payNow) => {
    const updatedTests = [...tests];
    updatedTests[currentTestIndex] = {
      ...updatedTests[currentTestIndex],
      isSelected: !payNow, // isSelected means "to be credited"
      paymentStatus: payNow
    };
    
    setTests(updatedTests);
    
    // Move to next test or finish
    if (currentTestIndex < tests.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
    } else {
      // All tests have been processed, move to confirmation
      updateTotals(updatedTests);
      setCurrentStep(1);
    }
  };

  const updateTotals = (testsArray) => {
    const credited = testsArray.filter(t => t.isSelected);
    const paid = testsArray.filter(t => !t.isSelected);
    
    setCreditedTotal(credited.reduce((sum, t) => sum + t.price, 0));
    setPaidTotal(paid.reduce((sum, t) => sum + t.price, 0));
  };

  const goBackToTest = (index) => {
    setCurrentTestIndex(index);
    setCurrentStep(0);
  };

  const processPayment = async () => {
    const creditedTests = tests.filter(t => t.isSelected);
    const paidTests = tests.filter(t => !t.isSelected);

    if (creditedTests.length === 0) {
      alert('Please select at least one test to credit.');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        token,
        patient_id: patient.patient_id,
        file_id: patient.file_id,
        contact_id: patient.contact_id,
        paid_tests: paidTests.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price
        })),
        credited_tests: creditedTests.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price
        })),
        paid_total: paidTotal,
        credited_total: creditedTotal
      };

      const response = await fetch(urls.paypartialinvestigations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert('Payment processed successfully!');
        refreshData();
        onClose();
      } else {
        alert(`Payment failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('An error occurred while processing the payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentTest = tests[currentTestIndex];
  const creditedTests = tests.filter(t => t.isSelected);
  const paidTests = tests.filter(t => !t.isSelected);
  const progress = tests.length > 0 ? ((currentTestIndex + 1) / tests.length) * 100 : 0;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '25px',
          borderRadius: '10px',
          width: '600px',
          maxWidth: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #eeeeee',
            paddingBottom: '10px'
          }}
        >
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            {currentStep === 0 ? 'Test Payment Selection' : 'Confirm Payment'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#000000',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>

        {patient ? (
          <div>
            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}
            >
              <p style={{ margin: '8px 0', color: '#000000' }}>
                <strong>Patient:</strong> {patient.patient_name}
              </p>
              <p style={{ margin: '8px 0', color: '#000000' }}>
                <strong>File ID:</strong> {patient.file_id} | <strong>OPD No:</strong> {patient.contact_id}
              </p>
              <p style={{ margin: '8px 0', fontWeight: 'bold', color: '#28a745' }}>
                <strong>Total Bill:</strong> UGX {patient.totalBill}
              </p>
            </div>

            {currentStep === 0 ? (
              // Step 1: Individual test selection
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#000000' }}>
                      Test {currentTestIndex + 1} of {tests.length}
                    </span>
                    <span style={{ color: '#000000' }}>
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <div style={{
                    height: '10px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: '#28a745',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                {currentTest && (
                  <div
                    style={{
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <h3 style={{ color: '#000000', marginBottom: '10px' }}>{currentTest.name}</h3>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745', marginBottom: '20px' }}>
                      UGX {Math.round(currentTest.price)}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                      <button
                        onClick={() => handleTestDecision(true)}
                        style={{
                          padding: '12px 25px',
                          backgroundColor: '#28a745',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleTestDecision(false)}
                        style={{
                          padding: '12px 25px',
                          backgroundColor: '#ffc107',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}
                      >
                        Credit Later
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                  <p>Select "Pay Now" to pay for this test immediately</p>
                  <p>Select "Credit Later" to add this test to the credit list</p>
                </div>
              </div>
            ) : (
              // Step 2: Confirmation
              <div>
                <h3 style={{ color: '#000000', marginBottom: '15px', textAlign: 'center' }}>
                  Review Your Selection
                </h3>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  {/* Tests to Pay Now */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#000000', marginBottom: '10px' }}>
                      Tests to Pay Now
                    </h4>
                    <div
                      style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid #dddddd',
                        borderRadius: '5px',
                        padding: '10px'
                      }}
                    >
                      {paidTests.map((test, index) => (
                        <div
                          key={test.id}
                          style={{
                            padding: '8px',
                            marginBottom: '8px',
                            border: '1px solid #cccccc',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#d4edda',
                            cursor: 'pointer'
                          }}
                          onClick={() => goBackToTest(index)}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#000000' }}>{test.name}</div>
                            <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                              UGX {Math.round(test.price)}
                            </div>
                          </div>
                          <span style={{ color: '#28a745' }}>✓</span>
                        </div>
                      ))}
                      {paidTests.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#000000', padding: '20px' }}>
                          No tests to pay now
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#28a745',
                        color: '#ffffff',
                        padding: '10px',
                        borderRadius: '5px',
                        marginTop: '10px',
                        fontWeight: 'bold'
                      }}
                    >
                      Total to Pay: UGX {Math.round(paidTotal)}
                    </div>
                  </div>

                  {/* Tests to Credit */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#000000', marginBottom: '10px' }}>
                      Tests to Credit
                    </h4>
                    <div
                      style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid #dddddd',
                        borderRadius: '5px',
                        padding: '10px'
                      }}
                    >
                      {creditedTests.map((test, index) => (
                        <div
                          key={test.id}
                          style={{
                            padding: '8px',
                            marginBottom: '8px',
                            border: '1px solid #cccccc',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#fff3cd',
                            cursor: 'pointer'
                          }}
                          onClick={() => goBackToTest(index)}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#000000' }}>{test.name}</div>
                            <div style={{ color: '#856404', fontWeight: 'bold' }}>
                              UGX {Math.round(test.price)}
                            </div>
                          </div>
                          <span style={{ color: '#ffc107' }}>⏱</span>
                        </div>
                      ))}
                      {creditedTests.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#000000', padding: '20px' }}>
                          No tests to credit
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ffc107',
                        color: '#000000',
                        padding: '10px',
                        borderRadius: '5px',
                        marginTop: '10px',
                        fontWeight: 'bold'
                      }}
                    >
                      Total Credited: UGX {Math.round(creditedTotal)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', margin: '15px 0', color: '#6c757d' }}>
                  <p>Click on any test to change your selection</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#000000' }}>No patient data available</p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            marginTop: '25px',
            borderTop: '1px solid #eeeeee',
            paddingTop: '20px'
          }}
        >
          {currentStep === 1 && (
            <button
              onClick={() => setCurrentStep(0)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              disabled={isProcessing}
            >
              Back to Selection
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            disabled={isProcessing}
          >
            Cancel
          </button>
          {currentStep === 1 ? (
            <button
              onClick={processPayment}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: isProcessing ? 0.7 : 1
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              disabled={tests.some(t => t.paymentStatus === null)}
            >
              Review Selection
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PayPartialInvestigationsModal;