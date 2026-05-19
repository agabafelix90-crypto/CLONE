// EmployeeBalance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { saveEmployeeSessionActivity, clearEmployeeSessionActivity, handleInvalidSession } from './authUtils';

// Import or define the nurse image (you'll need to add this image to your project)
const NURSE_IMAGE_URL = "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

// Network prefixes for validation
const NETWORK_PREFIXES = {
  mtn: ['77', '78', '76', '39'],
  airtel: ['70', '75', '74']
};

const EmployeeBalance = () => {
  const navigate = useNavigate();

  // State
  const [token, setToken] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeBalance, setEmployeeBalance] = useState(0);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showHowToEarn, setShowHowToEarn] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationInterval, setVerificationInterval] = useState(null);
  const [currentTransferId, setCurrentTransferId] = useState(null);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false);
  const [showNetworkConfirmation, setShowNetworkConfirmation] = useState(false);
  const [networkValidationInfo, setNetworkValidationInfo] = useState(null);
  const [phoneValidationError, setPhoneValidationError] = useState('');

  // Fetch token & validate session
  const fetchTokenAndCheckSecurity = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      if (!tokenFromUrl) {
        toast.error('No token found in URL');
        navigate('/login');
        return;
      }

      setToken(tokenFromUrl);
      setIsLoading(true);

      const response = await fetch(urls.security, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message === 'Session valid') {
          setEmployeeName(data.employee_name);
          setEmployeeBalance(data.employee_balance || 0);
          setPendingWithdrawal(data.pending_withdrawal || false);
          saveEmployeeSessionActivity();
        } else if (data.error === 'Session expired') {
          clearEmployeeSessionActivity();
          toast.warning('Session expired, redirecting to login...');
          handleInvalidSession(navigate, window.location.pathname + window.location.search);
        } else {
          clearEmployeeSessionActivity();
          toast.error('Invalid session');
          navigate('/login');
        }
      } else {
        throw new Error('Security check failed');
      }
    } catch (err) {
      toast.error('Connection error. Redirecting...');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenAndCheckSecurity();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (token) fetchTokenAndCheckSecurity();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // Clear verification interval on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Helper function to stop polling
  const stopPolling = () => {
    if (verificationInterval) {
      clearInterval(verificationInterval);
      setVerificationInterval(null);
      setIsPollingActive(false);
    }
  };

  // Verification function
  const verifyWithdrawalStatus = async (transferId) => {
    try {
      const response = await fetch(urls.verifyRewardWithdraw, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          transfer_id: transferId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const flutterwaveData = result.flutterwave_response?.data;
        const status = flutterwaveData?.status?.toUpperCase();
        const providerMessage = flutterwaveData?.provider_response?.message?.toLowerCase() || '';
        const providerType = flutterwaveData?.provider_response?.type || '';
        
        let statusMessage = result.message || `Transfer ${status}`;
        let displayStatus = status.toLowerCase();
        
        // Handle PENDING status - show sending animation instead of "failed"
        if (status === 'PENDING') {
          statusMessage = 'Sending money, please wait...';
          displayStatus = 'pending';
        }
        
        // Handle insufficient balance specifically
        else if (status === 'FAILED' && 
            (providerType === 'insufficient_balance' || 
             providerMessage.includes('insufficient') || 
             providerMessage.includes('not have sufficient balance'))) {
          statusMessage = 'Funds are currently not available. Please try again after 24 hours or contact support.';
          displayStatus = 'insufficient_balance';
        }
        
        // Handle other FAILED status
        else if (status === 'FAILED') {
          statusMessage = 'Transfer failed. Please try again.';
          displayStatus = 'failed';
        }
        
        // Handle SUCCESSFUL status
        else if (status === 'SUCCESSFUL') {
          statusMessage = 'Transfer successful!';
          displayStatus = 'successful';
          
          // Update pending withdrawal status on success
          setPendingWithdrawal(false);
        }

        // Update verification status
        setVerificationStatus({
          status: displayStatus,
          message: statusMessage,
          originalData: flutterwaveData
        });

        // Determine if we should stop polling
        const isFinalStatus = ['successful', 'failed', 'insufficient_balance'].includes(displayStatus);
        
        if (isFinalStatus) {
          stopPolling();
          
          // Handle different final statuses
          switch (displayStatus) {
            case 'successful':
              const amountAfterFee = employeeBalance - 1000;
              toast.success(`${amountAfterFee.toLocaleString()} UGX has been sent to your phone.`);
              
              setTimeout(() => {
                setVerificationStatus(null);
                setShowWithdrawal(false);
                setPhoneNumber('');
                setCurrentTransferId(null);
                setEmployeeBalance(0);
                setPendingWithdrawal(false);
              }, 3000);
              break;
              
            case 'failed':
              toast.error('Transfer failed. Please try again.');
              
              setTimeout(() => {
                setVerificationStatus(null);
                setCurrentTransferId(null);
                setPendingWithdrawal(false);
              }, 3000);
              break;
              
            case 'insufficient_balance':
              setTimeout(() => {
                setCurrentTransferId(null);
                setPendingWithdrawal(false);
              }, 3000);
              break;
          }
        }
        
        return displayStatus;
      } else {
        throw new Error(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error checking transfer status');
      return null;
    }
  };

  // Start verification polling
  const startVerificationPolling = (transferId) => {
    // Clear any existing interval
    stopPolling();

    // Initial verification
    verifyWithdrawalStatus(transferId);

    // Set up interval for polling every 10 seconds
    const interval = setInterval(() => {
      verifyWithdrawalStatus(transferId);
    }, 10000);

    setVerificationInterval(interval);
    setIsPollingActive(true);
  };

  // Validate phone number and network
  const validatePhoneAndNetwork = (number, network) => {
    // Reset previous errors
    setPhoneValidationError('');
    setNetworkValidationInfo(null);
    
    // Basic validation: must be 9 digits
    if (number.length !== 9) {
      setPhoneValidationError('Phone number must be exactly 9 digits');
      return false;
    }
    
    // Must start with 7
    if (!number.startsWith('7')) {
      setPhoneValidationError('Phone number must start with 7');
      return false;
    }
    
    // Must be only digits
    if (!/^\d+$/.test(number)) {
      setPhoneValidationError('Phone number can only contain digits');
      return false;
    }
    
    // Extract the prefix (first two digits after 7)
    const prefix = number.substring(0, 2);
    
    // Check if prefix matches network
    const correctNetwork = Object.entries(NETWORK_PREFIXES).find(([net, prefixes]) => 
      prefixes.some(p => prefix === p)
    );
    
    if (correctNetwork) {
      const [correctNetworkName] = correctNetwork;
      
      // If selected network doesn't match detected network, show confirmation
      if (correctNetworkName !== network) {
        setNetworkValidationInfo({
          detectedNetwork: correctNetworkName,
          selectedNetwork: network,
          phoneNumber: number,
          message: `This number (${prefix}) is typically registered as ${correctNetworkName.toUpperCase()}. Are you sure you want to use ${network.toUpperCase()}?`
        });
        return 'needs_confirmation';
      }
    }
    
    return true;
  };

  // Handle network confirmation
  const handleNetworkConfirmation = (confirmed) => {
    if (confirmed) {
      // Proceed with withdrawal
      processWithdrawal();
    } else {
      // Switch to detected network
      setSelectedNetwork(networkValidationInfo.detectedNetwork);
      setShowNetworkConfirmation(false);
      setNetworkValidationInfo(null);
      toast.info(`Network changed to ${networkValidationInfo.detectedNetwork.toUpperCase()}`);
    }
  };

  // Process withdrawal after validation
  const processWithdrawal = async () => {
    if (employeeBalance < 5000) {
      toast.error('Minimum withdrawal: 5,000 UGX');
      return;
    }

    setWithdrawalLoading(true);
    setPendingWithdrawal(true);
    setVerificationStatus({
      status: 'processing',
      message: 'Initiating transfer...'
    });

    try {
      const res = await fetch(urls.withdrawReward, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          phone_number: '256' + phoneNumber,
          amount: employeeBalance,
          network: selectedNetwork,
        }),
      });

      const result = await res.json();
      
      if (result.status === 'success' && result.data?.id) {
        const transferId = result.data.id;
        setCurrentTransferId(transferId);
        
        // Update verification status
        setVerificationStatus({
          status: 'pending',
          message: 'Sending money, please wait...'
        });
        
        // Start polling for verification (every 10 seconds)
        startVerificationPolling(transferId);
        setShowNetworkConfirmation(false);
        setNetworkValidationInfo(null);
        
      } else {
        toast.error(result.message || 'Withdrawal initiation failed');
        setVerificationStatus(null);
        setPendingWithdrawal(false);
        setShowNetworkConfirmation(false);
        setNetworkValidationInfo(null);
      }
    } catch (err) {
      toast.error('Network error. Try again.');
      setVerificationStatus(null);
      setPendingWithdrawal(false);
      setShowNetworkConfirmation(false);
      setNetworkValidationInfo(null);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Handle withdrawal button click
  const handleWithdrawal = async () => {
    // Check for pending withdrawal first
    if (pendingWithdrawal) {
      toast.error('You have a pending withdrawal. Please wait for it to complete.');
      return;
    }
    
    // Validate phone number and network
    const validationResult = validatePhoneAndNetwork(phoneNumber, selectedNetwork);
    
    if (validationResult === false) {
      // Validation failed - error is already set
      return;
    } else if (validationResult === 'needs_confirmation') {
      // Need user confirmation
      setShowNetworkConfirmation(true);
      return;
    }
    
    // All validations passed, proceed with withdrawal
    processWithdrawal();
  };

  // Handle phone number input change
  const handlePhoneNumberChange = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 9 digits and ensure it starts with 7
    let processedValue = digits.slice(0, 9);
    
    // If first digit is not 7 and user is typing, keep as is (they might be typing 7)
    if (processedValue.length > 0 && processedValue[0] !== '7') {
      // If it's the first character and not 7, don't update
      if (processedValue.length === 1) {
        return;
      }
    }
    
    setPhoneNumber(processedValue);
    
    // Clear validation errors when typing
    if (processedValue.length === 9) {
      // Validate as user types complete number
      validatePhoneAndNetwork(processedValue, selectedNetwork);
    } else {
      setPhoneValidationError('');
      setNetworkValidationInfo(null);
    }
  };

  // Reset verification and go back to balance view
  const resetVerification = () => {
    stopPolling();
    setVerificationStatus(null);
    setCurrentTransferId(null);
    setPendingWithdrawal(false);
  };

  // Format currency
  const formatCurrency = (amount) => amount.toLocaleString() + ' UGX';

  // Status display component
  const StatusDisplay = () => {
    if (!verificationStatus) return null;

    const { status, message } = verificationStatus;
    
    // Define status colors and icons
    const statusConfig = {
      new: { color: '#3b82f6', bgColor: '#dbeafe', icon: '🔄' },
      processing: { color: '#f59e0b', bgColor: '#fef3c7', icon: '⏳' },
      pending: { color: '#f59e0b', bgColor: '#fef3c7', icon: '⏳' },
      successful: { color: '#10b981', bgColor: '#d1fae5', icon: '✅' },
      failed: { color: '#ef4444', bgColor: '#fee2e2', icon: '❌' },
      insufficient_balance: { color: '#dc2626', bgColor: '#fee2e2', icon: '⚠️' },
    };

    const config = statusConfig[status] || statusConfig.new;

    return (
      <div style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}20`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '32px',
          marginBottom: '12px',
        }}>
          {status === 'pending' ? (
            <div style={{
              display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }}>⏳</div>
          ) : (
            config.icon
          )}
        </div>
        <p style={{
          color: config.color,
          fontWeight: '600',
          fontSize: '18px',
          marginBottom: '8px',
        }}>{message}</p>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          margin: 0,
        }}>
          {status === 'processing' || status === 'pending'
            ? 'Checking status every 10 seconds...'
            : status === 'successful'
            ? 'Transaction completed successfully!'
            : status === 'insufficient_balance'
            ? 'Please try again after 24 hours'
            : 'Transaction failed. Please try again.'}
        </p>
        
        {/* Show reset button for final states except successful and pending */}
        {(status === 'failed' || status === 'insufficient_balance') && (
          <button
            onClick={resetVerification}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.backgroundColor = '#fff';
            }}
          >
            Back to Balance
          </button>
        )}
        
        {/* Show stop polling button for pending status */}
        {status === 'pending' && isPollingActive && (
          <button
            onClick={stopPolling}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s',
              marginLeft: '8px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.backgroundColor = '#fff';
            }}
          >
            DO NOT CLOSE PAGE
          </button>
        )}
      </div>
    );
  };

  // Network Confirmation Modal
  const NetworkConfirmationModal = () => {
    if (!showNetworkConfirmation || !networkValidationInfo) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Network Confirmation Required
          </h3>
          
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <p style={{
              color: '#92400e',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '12px',
            }}>
              {networkValidationInfo.message}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px',
            }}>
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '12px',
                borderRadius: '8px',
                flex: 1,
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: '0 0 4px 0',
                }}>Selected Network:</p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#92400e',
                  margin: 0,
                }}>
                  {networkValidationInfo.selectedNetwork.toUpperCase()}
                </p>
              </div>
              
              <div style={{
                backgroundColor: '#d1fae5',
                padding: '12px',
                borderRadius: '8px',
                flex: 1,
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#065f46',
                  margin: '0 0 4px 0',
                }}>Detected Network:</p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#065f46',
                  margin: 0,
                }}>
                  {networkValidationInfo.detectedNetwork.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
          }}>
            <button
              onClick={() => handleNetworkConfirmation(false)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                fontWeight: '600',
                color: '#4b5563',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
            >
              Use {networkValidationInfo.detectedNetwork.toUpperCase()}
            </button>
            
            <button
              onClick={() => handleNetworkConfirmation(true)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
            >
              Continue with {networkValidationInfo.selectedNetwork.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e0e7ff',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your balance...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <NetworkConfirmationModal />

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '32px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#111827',
              margin: '0 0 8px 0',
            }}>Your Rewards Balance</h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0,
            }}>Track your earnings and withdraw instantly</p>
          </div>

          {/* Main Content - Two Column Layout for Balance View */}
          {!showWithdrawal && !verificationStatus ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              alignItems: 'center',
            }}>
              {/* Left Column - Balance Information */}
              <div>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  padding: '40px 32px',
                  textAlign: 'center',
                }}>
                  
                  {/* Status Display (if verifying) */}
                  {verificationStatus && <StatusDisplay />}

                  {/* Pending Withdrawal Warning */}
                  {pendingWithdrawal && !verificationStatus && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: '32px',
                        marginBottom: '12px',
                      }}>⏳</div>
                      <p style={{
                        color: '#92400e',
                        fontWeight: '600',
                        fontSize: '18px',
                        marginBottom: '8px',
                      }}>Pending Withdrawal in Progress</p>
                      <p style={{
                        color: '#92400e',
                        fontSize: '14px',
                        margin: 0,
                      }}>
                        You currently have a withdrawal transaction being processed. 
                        Please wait for it to complete before initiating a new withdrawal.
                      </p>
                      <button
                        onClick={resetVerification}
                        style={{
                          marginTop: '16px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#fff',
                          color: '#374151',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                        }}
                      >
                        Refresh Status
                      </button>
                    </div>
                  )}

                  {/* Balance View */}
                  <div style={{ marginBottom: '40px' }}>
                    <p style={{
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#6b7280',
                      marginBottom: '8px',
                    }}>Current Balance</p>
                    <p style={{
                      fontSize: '56px',
                      fontWeight: '800',
                      color: '#111827',
                      margin: '0 0 16px 0',
                      lineHeight: '1',
                    }}>{formatCurrency(employeeBalance)}</p>

                    {/* Eligibility Status */}
                    <div style={{
                      display: 'inline-block',
                      padding: '8px 20px',
                      borderRadius: '999px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: pendingWithdrawal 
                        ? '#fef3c7' 
                        : employeeBalance >= 5000 
                          ? '#d1fae5' 
                          : '#fef3c7',
                      color: pendingWithdrawal 
                        ? '#92400e' 
                        : employeeBalance >= 5000 
                          ? '#065f46' 
                          : '#92400e',
                      marginBottom: '32px',
                    }}>
                      {pendingWithdrawal 
                        ? '⏳ Withdrawal in Progress'
                        : employeeBalance >= 5000
                          ? '✓ Eligible for withdrawal'
                          : `Minimum allowed withdrawl is 5000, you Need ${formatCurrency(5000 - employeeBalance)} more`}
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <div style={{ marginBottom: '32px' }}>
                    <button
                      onClick={() => setShowWithdrawal(true)}
                      disabled={employeeBalance < 5000 || verificationStatus || pendingWithdrawal}
                      style={{
                        padding: '16px 48px',
                        borderRadius: '12px',
                        border: 'none',
                        background: employeeBalance >= 5000 && !verificationStatus && !pendingWithdrawal
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : '#d1d5db',
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: employeeBalance >= 5000 && !verificationStatus && !pendingWithdrawal 
                          ? 'pointer' 
                          : 'not-allowed',
                        transition: 'all 0.2s',
                        minWidth: '200px',
                        position: 'relative',
                      }}
                      onMouseOver={(e) => {
                        if (employeeBalance >= 5000 && !verificationStatus && !pendingWithdrawal) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(16,185,129,0.3)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {pendingWithdrawal ? 'Withdrawal in Progress' : 'Withdraw Money'}
                      {pendingWithdrawal && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}>!</span>
                      )}
                    </button>
                    
                    {/* Pending withdrawal tooltip */}
                    {pendingWithdrawal && (
                      <p style={{
                        color: '#92400e',
                        fontSize: '14px',
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#fffbeb',
                        borderRadius: '8px',
                        border: '1px solid #fde68a',
                      }}>
                        ⚠️ You have a pending withdrawal transaction. 
                        Please wait for it to complete before initiating a new withdrawal.
                      </p>
                    )}
                  </div>

                  {/* Collapsible How to Earn */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
                    <button
                      onClick={() => setShowHowToEarn(!showHowToEarn)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#4f46e5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto',
                      }}
                    >
                      How to Earn Rewards
                      <svg style={{
                        width: '20px',
                        height: '20px',
                        transition: 'transform 0.3s',
                        transform: showHowToEarn ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showHowToEarn && (
                      <div style={{
                        marginTop: '24px',
                        display: 'grid',
                        gap: '20px',
                        gridTemplateColumns: '1fr',
                        textAlign: 'left',
                      }}>
                        <div style={{
                          backgroundColor: '#eef2ff',
                          padding: '24px',
                          borderRadius: '16px',
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#c7d2fe',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                          }}>
                            <svg style={{ width: '24px', height: '24px', color: '#4f46e5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Quantitative Points</h4>
                          <p style={{ color: '#4b5563', fontSize: '15px', margin: 0 }}>Earn points by serving more patients across departments.</p>
                        </div>

                        <div style={{
                          backgroundColor: '#f0fdf4',
                          padding: '24px',
                          borderRadius: '16px',
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#bbf7d0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                          }}>
                            <svg style={{ width: '24px', height: '24px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0114 10z" />
                            </svg>
                          </div>
                          <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Qualitative Points</h4>
                          <p style={{ color: '#4b5563', fontSize: '15px', margin: 0 }}>Positive patient feedback via QR code adds points.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Nurse Visual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  padding: '40px',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    position: 'relative',
                  }}>
                    {/* Nurse Image */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${NURSE_IMAGE_URL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      borderRadius: '16px',
                    }} />
                    
                    {/* Overlay effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(0deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)',
                      borderRadius: '16px',
                    }} />
                    
                    {/* Phone Screen Mockup */}
                    <div style={{
                      position: 'absolute',
                      bottom: '40px',
                      right: '40px',
                      width: '120px',
                      height: '240px',
                      backgroundColor: '#1e293b',
                      borderRadius: '24px',
                      padding: '12px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      transform: 'rotate(5deg)',
                    }}>
                      {/* Phone notch */}
                      <div style={{
                        width: '40%',
                        height: '16px',
                        backgroundColor: '#1e293b',
                        borderRadius: '0 0 8px 8px',
                        margin: '0 auto',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }} />
                      
                      {/* Phone screen content */}
                      <div style={{
                        backgroundColor: '#ffffff',
                        height: '100%',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px',
                        }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>✓</span>
                        </div>
                        <p style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#10b981',
                          margin: '0 0 4px 0',
                          textAlign: 'center',
                        }}>Payment Received</p>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#111827',
                          margin: '0 0 8px 0',
                          textAlign: 'center',
                        }}>{formatCurrency(employeeBalance - 1000)}</p>
                        <p style={{
                          fontSize: '8px',
                          color: '#6b7280',
                          margin: 0,
                          textAlign: 'center',
                        }}>MEDCORE Rewards</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#111827',
                      margin: '0 0 16px 0',
                    }}>Your Hard Work Pays Off</h3>
                    <p style={{
                      fontSize: '16px',
                      color: '#4b5563',
                      lineHeight: '1.6',
                      marginBottom: '24px',
                    }}>
                      Every patient you serve brings you closer to your next reward. 
                      With MEDCORE Cash Rewards, your dedication to healthcare 
                      excellence is recognized and rewarded instantly.
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      backgroundColor: '#f0fdf4',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #bbf7d0',
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#065f46',
                        margin: 0,
                        fontWeight: '500',
                      }}>
                        Instant mobile money transfers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Withdrawal View (Full Width) */
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                padding: '40px 24px',
                textAlign: 'center',
              }}>
                
                {/* Status Display (if verifying) */}
                {verificationStatus && <StatusDisplay />}

                {/* Withdrawal View - Only show if not in verification */}
                {!verificationStatus && (
                  <>
                    <h2 style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#111827',
                      margin: '0 0 32px 0',
                    }}>Withdraw Rewards</h2>

                    <div style={{
                      backgroundColor: '#eff6ff',
                      padding: '24px',
                      borderRadius: '16px',
                      textAlign: 'center',
                      marginBottom: '24px',
                    }}>
                      <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>Available Balance</p>
                      <p style={{ fontSize: '48px', fontWeight: '800', color: '#1e40af', margin: 0 }}>
                        {formatCurrency(employeeBalance)}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '32px',
                      textAlign: 'left',
                    }}>
                      <p style={{ fontWeight: '600', color: '#92400e', margin: '0 0 4px 0' }}>Withdrawal Fee: 1,000 UGX</p>
                      <p style={{ color: '#92400e', margin: 0 }}>You will receive: {formatCurrency(employeeBalance - 1000)}</p>
                    </div>

                    {/* Network Selection */}
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                      <p style={{ fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Mobile Money Network</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { id: 'mtn', name: 'MTN', color: '#f59e0b', bg: '#fffbeb', border: '#fbbf24' },
                          { id: 'airtel', name: 'Airtel', color: '#dc2626', bg: '#fef2f2', border: '#f87171' }
                        ].map((net) => (
                          <button
                            key={net.id}
                            onClick={() => {
                              setSelectedNetwork(net.id);
                              // Re-validate phone number if it exists
                              if (phoneNumber.length === 9) {
                                validatePhoneAndNetwork(phoneNumber, net.id);
                              }
                            }}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              border: '2px solid',
                              borderColor: selectedNetwork === net.id ? net.border : '#e5e7eb',
                              backgroundColor: selectedNetwork === net.id ? net.bg : '#fff',
                              fontWeight: '600',
                              color: selectedNetwork === net.id ? '#111827' : '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '16px',
                            }}
                          >
                            {net.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div style={{ marginBottom: '32px', textAlign: 'left' }}>
                      <p style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        Phone Number ({selectedNetwork.toUpperCase()})
                      </p>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '16px',
                        }}>256</span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => handlePhoneNumberChange(e.target.value)}
                          placeholder="7XXXXXXXX"
                          maxLength="9"
                          style={{
                            width: '100%',
                            padding: '16px 16px 16px 64px',
                            borderRadius: '12px',
                            border: phoneValidationError 
                              ? '1px solid #ef4444' 
                              : networkValidationInfo
                                ? '1px solid #f59e0b'
                                : '1px solid #d1d5db',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff',
                            color: '#111827',
                          }}
                        />
                      </div>
                      
                      {/* Phone number validation error */}
                      {phoneValidationError && (
                        <p style={{
                          fontSize: '13px',
                          color: '#ef4444',
                          marginTop: '8px',
                          margin: '8px 0 0 0',
                          fontWeight: '500',
                        }}>
                          ⚠️ {phoneValidationError}
                        </p>
                      )}
                      
                      {/* Network validation info */}
                      {networkValidationInfo && !phoneValidationError && (
                        <div style={{
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fde68a',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                        }}>
                          <p style={{
                            fontSize: '13px',
                            color: '#92400e',
                            margin: 0,
                            fontWeight: '500',
                          }}>
                            ⚠️ This number prefix ({phoneNumber.substring(0, 2)}) is typically associated with {networkValidationInfo.detectedNetwork.toUpperCase()}. 
                            Please double-check your network selection.
                          </p>
                        </div>
                      )}
                      
                      {/* Valid phone number info */}
                      {!phoneValidationError && !networkValidationInfo && phoneNumber.length === 9 && (
                        <p style={{
                          fontSize: '13px',
                          color: '#10b981',
                          marginTop: '8px',
                          margin: '8px 0 0 0',
                          fontWeight: '500',
                        }}>
                          ✓ Valid phone number
                        </p>
                      )}
                      
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '8px',
                        margin: '8px 0 0 0',
                      }}>
                        Enter 9 digits starting with 7 (e.g., 7XXXXXXXX)
                      </p>
                      
                      {/* Network prefix info */}
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}>
                       
                      
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => {
                          setShowWithdrawal(false);
                          setPhoneNumber('');
                          setPhoneValidationError('');
                          setNetworkValidationInfo(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#fff',
                          fontWeight: '600',
                          color: '#4b5563',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                        }}
                      >Cancel</button>
                      <button
                        onClick={handleWithdrawal}
                        disabled={withdrawalLoading || phoneNumber.length !== 9 || pendingWithdrawal || phoneValidationError}
                        style={{
                          flex: 1,
                          padding: '16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: withdrawalLoading || phoneNumber.length !== 9 || pendingWithdrawal || phoneValidationError
                            ? '#9ca3af'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: withdrawalLoading || phoneNumber.length !== 9 || pendingWithdrawal || phoneValidationError 
                            ? 'not-allowed' 
                            : 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {withdrawalLoading ? 'Processing...' : 'Confirm'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        
        /* Responsive styles */
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            gridTemplateColumns: 1fr !important;
            gap: 24px !important;
          }
          
          div[style*="maxWidth: '1200px'"] {
            maxWidth: 640px !important;
          }
          
          div[style*="height: '300px'"] {
            height: 250px !important;
          }
        }
        
        @media (max-width: 768px) {
          div[style*="padding: '32px 16px'"] {
            padding: 24px 12px !important;
          }
          
          h1[style*="fontSize: '32px'"] {
            fontSize: 28px !important;
          }
          
          p[style*="fontSize: '56px'"] {
            fontSize: 48px !important;
          }
          
          div[style*="padding: '40px 32px'"] {
            padding: 32px 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default EmployeeBalance;
