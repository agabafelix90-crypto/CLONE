import React from 'react';

const AddToWalletPrompt = ({ contactId, onClose }) => {
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  const buttonStyle = {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'purple',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Add to Pro-Wallet</h2>
        <p>Contact ID: {contactId}</p>
        <button onClick={onClose} style={buttonStyle}>Close</button>
      </div>
    </div>
  );
};

export default AddToWalletPrompt;
