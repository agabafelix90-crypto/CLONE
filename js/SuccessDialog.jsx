import React from 'react';

const SuccessDialog = ({ onClose, onPrint, onNoPrint, printing, printSuccess }) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    },
    dialog: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      width: '450px',
      maxWidth: '90%',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      textAlign: 'center',
    },
    icon: {
      fontSize: '60px',
      color: '#4CAF50',
      marginBottom: '20px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '15px',
    },
    message: {
      fontSize: '16px',
      color: '#555',
      marginBottom: '25px',
      lineHeight: '1.5',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px',
    },
    primaryButton: {
      padding: '12px 25px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '120px',
    },
    secondaryButton: {
      padding: '12px 25px',
      backgroundColor: '#f8f9fa',
      color: '#555',
      border: '1px solid #ddd',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      minWidth: '120px',
    },
    loadingButton: {
      backgroundColor: '#95a5a6',
    },
    successMessage: {
      color: '#4CAF50',
      fontWeight: '500',
      marginTop: '15px',
    }
  };

  if (printSuccess) {
    return (
      <div style={styles.overlay}>
        <div style={styles.dialog}>
          <div style={styles.icon}>✓</div>
          <h2 style={styles.title}>Report Generated Successfully</h2>
          <p style={styles.message}>The lab report has been printed and results saved to patient records.</p>
          <div style={styles.successMessage}>Operation completed successfully!</div>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.secondaryButton} 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (printing) {
    return (
      <div style={styles.overlay}>
        <div style={styles.dialog}>
          <div style={styles.icon}>⏳</div>
          <h2 style={styles.title}>Generating PDF</h2>
          <p style={styles.message}>Please wait while we generate the lab report...</p>
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.primaryButton, ...styles.loadingButton }} 
              disabled
            >
              Processing...
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.icon}>✓</div>
        <h2 style={styles.title}>Results Submitted Successfully</h2>
        <p style={styles.message}>The laboratory results have been saved to the patient's record. Would you like to print the lab report now?</p>
        <div style={styles.buttonGroup}>
          <button 
            style={styles.secondaryButton} 
            onClick={onNoPrint}
          >
            No, Close
          </button>
          <button 
            style={styles.primaryButton} 
            onClick={onPrint}
          >
            Yes, Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog;