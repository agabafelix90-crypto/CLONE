import React from 'react';

const LoadingSpinner2 = () => {
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark background with slight opacity
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Make sure it overlays other content
  };

  const loadingContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background for the modal
    padding: '20px',
    borderRadius: '8px',
  };

  const spinnerStyle = {
    border: '8px solid #f3f3f3',
    borderTop: '8px solid #3498db',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 2s linear infinite',
  };

  const textStyle = {
    color: 'white',
    marginTop: '10px',
    fontWeight: 'bold',
  };

  return (
    <div style={overlayStyle}>
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={textStyle}>Submitting, please wait...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner2;
