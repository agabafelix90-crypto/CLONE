import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, 
  faSpinner, 
  faTimes,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

function CreditInvestigationModal({ token, fileId, onClose }) {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tests, setTests] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [creditedAmount, setCreditedAmount] = useState(0);

  useEffect(() => {
    fetchPaymentDetails();
  }, [token, fileId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(urls.waitingpayment2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, file_id: fileId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
        
        // Combine all tests (both lab and radiology)
        if (data && data.length > 0) {
          const allTests = [
            ...(data[0].lab_tests || []),
            ...(data[0].radiology_exams || [])
          ];
          setTests(allTests);
        }
      } else {
        throw new Error('Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const processCredit = async () => {
    if (tests.length === 0) {
      setError('No tests available to credit.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const payload = {
        token,
        patient_id: paymentData[0].contact_id,
        file_id: paymentData[0].file_id,
        contact_id: paymentData[0].contact_id,
        credited_tests: tests.map(t => ({
          id: t.id || 0,
          name: t.name,
          price: t.price,
          type: t.type || 'lab'
        })),
        credited_total: tests.reduce((sum, test) => sum + parseFloat(test.price), 0)
      };

      const response = await fetch(urls.paypartialinvestigations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setCreditedAmount(data.credited_total);
        setSuccess(true);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(`Credit failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Credit processing error:', error);
      setError('An error occurred while processing the credit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '24px', marginBottom: '15px', color: '#3498db' }} />
          <p style={{ margin: 0, color: '#2c3e50' }}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!paymentData || paymentData.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>No payment data found.</p>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const patient = paymentData[0];
  const totalBill = tests.reduce((sum, test) => sum + parseFloat(test.price), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        width: '650px',
        maxWidth: '90%',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f1f2f6',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#2c3e50',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '10px', color: '#3498db' }} />
            Credit Investigations
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#e74c3c'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#c33',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{error}</span>
          </div>
        )}
        
        {success ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px'
          }}>
            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '64px', color: '#27ae60', marginBottom: '20px' }} />
            <h3 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>Credit Processed Successfully!</h3>
            <p style={{ color: '#2c3e50', fontSize: '18px', margin: '0 0 20px 0' }}>
              Total Amount Credited: <strong>UGX {creditedAmount.toLocaleString()}</strong>
            </p>
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
              This modal will close automatically...
            </p>
          </div>
        ) : (
          <>
            {/* Patient Information */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              borderLeft: '4px solid #3498db'
            }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #dfe6e9', paddingBottom: '8px' }}>
                Patient Details
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>Name:</span>
                <span style={{ color: '#2c3e50' }}>{patient.patient_name}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>File Date:</span>
                <span style={{ color: '#2c3e50' }}>{new Date(patient.file_date).toLocaleString()}</span>
              </div>
            </div>
            
            {/* Tests to Credit */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '1px solid #dfe6e9', paddingBottom: '8px' }}>
                Investigations to Credit
              </h3>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #dfe6e9', borderRadius: '6px' }}>
                {tests.map((test, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < tests.length - 1 ? '1px solid #dfe6e9' : 'none'
                  }}>
                    <span style={{ color: '#2c3e50' }}>{test.name}</span>
                    <span style={{ fontWeight: '600', color: '#e74c3c' }}>UGX {parseFloat(test.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Total Bill */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              border: '2px solid #dfe6e9'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Total Amount to Credit</h3>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#e74c3c' }}>
                UGX {totalBill.toLocaleString()}
              </div>
            </div>
            
            {/* Credit Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={processCredit}
                disabled={processing}
                style={{
                  padding: '12px 30px',
                  backgroundColor: processing ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  if (!processing) e.target.style.backgroundColor = '#219653';
                }}
                onMouseOut={e => {
                  if (!processing) e.target.style.backgroundColor = '#27ae60';
                }}
              >
                {processing ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faCreditCard} />
                )}
                Credit All Investigations
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CreditInvestigationModal;