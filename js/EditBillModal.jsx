import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';

const EditBillModal = ({ creditDetails, onClose, onSave }) => {
  // Console.log the received data
  console.log('Received creditDetails:', creditDetails);

  const [newBalance, setNewBalance] = React.useState(
    creditDetails.balance_remaining || creditDetails.net_balance || 0
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Saving new balance:', newBalance);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Prepare payload with credit_id, contact_id, and new_balance
      const payload = {
        credit_id: creditDetails.credit_id, // Get from creditDetails
        contact_id: creditDetails.contact_id, // Get from creditDetails
        new_balance: parseFloat(newBalance) // User input
      };
      
      console.log('Payload to save:', payload);
      await onSave(payload);
    } catch (error) {
      console.error('Error saving balance:', error);
      // Reset loading state on error
      setIsLoading(false);
    }
    // Note: Loading state should be reset by parent component after successful save
  };

  const handleDeleteDebt = async () => {
    if (!window.confirm('Are you sure you want to delete this unspecified file debt? This action cannot be undone.')) {
      return;
    }

    console.log('Deleting unspecified file debt');
    
    // Set deleting state
    setIsDeleting(true);
    
    try {
      // Prepare delete payload with token, contact_id, and new_balance as 0
      const deletePayload = {
        token: "1b8e3c70a1978c2d6e9e9c5d3995e5d4",
        contact_id: creditDetails.contact_id,
        new_balance: 0
      };
      
      console.log('Delete payload:', deletePayload);
      
      // Call onSave with the delete payload
      await onSave(deletePayload);
    } catch (error) {
      console.error('Error deleting debt:', error);
      // Reset deleting state on error
      setIsDeleting(false);
    }
    // Note: Deleting state should be reset by parent component after successful save
  };

  const isProcessing = isLoading || isDeleting;

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '95%',
        maxWidth: '700px',
        maxHeight: '85vh',
        height: 'auto',
        minHeight: '500px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: '0',
            color: '#333',
            fontSize: '22px',
            fontWeight: '600'
          }}>Update Balance (Unspecified Files)</h2>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'none',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              color: isProcessing ? '#ccc' : '#666',
              fontSize: '20px',
              opacity: isProcessing ? 0.5 : 1,
              padding: '5px',
              borderRadius: '4px'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{
          overflowY: 'auto',
          flexGrow: 1,
          paddingRight: '15px',
          marginBottom: '20px'
        }}>
          {/* Warning Message */}
          <div style={{
            marginBottom: '25px',
            padding: '18px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            color: '#856404'
          }}>
            <p style={{
              margin: '0',
              fontSize: '15px',
              fontWeight: '500',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#dc3545' }}>Important:</strong> Billing with unspecified files will not be supported in future updates. Please ensure that when billing patients, you use the "Approve Bill" button under the treatment plan creation table. Each bill must be attached to a patient file. Unspecified bill editing functionality will be removed soon.
            </p>
          </div>

          {/* Client Information Display */}
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#444',
              fontSize: '18px',
              fontWeight: '600'
            }}>Client Information</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              <div>
                <p style={{ margin: '8px 0', fontSize: '15px' }}>
                  <strong>Contact ID:</strong> {creditDetails.contact_id}
                </p>
                <p style={{ margin: '8px 0', fontSize: '15px' }}>
                  <strong>Credit ID:</strong> {creditDetails.credit_id}
                </p>
              </div>
              <div>
                <p style={{ margin: '8px 0', fontSize: '15px' }}>
                  <strong>Name:</strong> {creditDetails.details?.first_name} {creditDetails.details?.last_name}
                </p>
                <p style={{ margin: '8px 0', fontSize: '15px' }}>
                  <strong>Phone:</strong> {creditDetails.details?.phone_number}
                </p>
              </div>
            </div>
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#e7f3ff',
              borderRadius: '6px',
              border: '1px solid #b3d9ff'
            }}>
              <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#0066cc' }}>
                <strong>Current Balance:</strong> UGX {(creditDetails.balance_remaining || creditDetails.net_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Balance Update Form */}
          <form onSubmit={handleSubmit}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#444',
              fontSize: '18px',
              fontWeight: '600'
            }}>Update Balance</h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                New Balance Amount (UGX)
              </label>
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '15px',
                  backgroundColor: isProcessing ? '#f5f5f5' : 'white',
                  cursor: isProcessing ? 'not-allowed' : 'text',
                  opacity: isProcessing ? 0.7 : 1
                }}
                placeholder="Enter new balance amount"
                min="0"
                step="0.01"
                required
              />
            </div>
          </form>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'space-between',
          marginTop: 'auto',
          flexShrink: 0,
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          {/* Delete Debt Button */}
          <button 
            type="button"
            onClick={handleDeleteDebt}
            disabled={isProcessing}
            style={{
              backgroundColor: isProcessing ? '#e9ecef' : '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isProcessing ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '180px',
              justifyContent: 'center'
            }}
          >
            {isDeleting && (
              <FontAwesomeIcon 
                icon={faSpinner} 
                spin 
                style={{ fontSize: '14px' }}
              />
            )}
            {!isDeleting && <FontAwesomeIcon icon={faTrash} />}
            {isDeleting ? 'Deleting...' : 'Delete Unspecified Debt'}
          </button>

          <div style={{
            display: 'flex',
            gap: '15px'
          }}>
            <button 
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                backgroundColor: isProcessing ? '#e9ecef' : '#f5f5f5',
                color: isProcessing ? '#6c757d' : '#333',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isProcessing ? 0.6 : 1,
                minWidth: '100px'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{
                backgroundColor: isProcessing ? '#6c757d' : '#2196f3',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '160px',
                justifyContent: 'center'
              }}
            >
              {isLoading && (
                <FontAwesomeIcon 
                  icon={faSpinner} 
                  spin 
                  style={{ fontSize: '14px' }}
                />
              )}
              {isLoading ? 'Saving...' : 'Save New Balance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBillModal;