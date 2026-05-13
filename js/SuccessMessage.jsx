import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const SuccessMessage = () => {
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background with slight opacity
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Make sure it overlays other content
  };

  const successContainerStyle = {
    display: 'flex',
    flexDirection: 'row', // Display icon and message in a row
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 140, 0, 0.8)', // Green background
    padding: '20px',
    borderRadius: '8px',
  };

  const textStyle = {
    color: 'white',
    marginLeft: '10px', // Space between icon and text
    fontWeight: 'bold',
  };

  return (
    <div style={overlayStyle}>
      <div style={successContainerStyle}>
        <FontAwesomeIcon icon={faCheckCircle} color="white" size="2x" />
        <p style={textStyle}>Submission Successful!</p>
      </div>
    </div>
  );
};

export default SuccessMessage;
