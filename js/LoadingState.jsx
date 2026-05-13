import React from 'react';
import { ClipLoader } from 'react-spinners';

// LoadingState Component with inline CSS
const LoadingState = () => {
  return (
    <div style={styles.overlay}>
      <div style={styles.loaderContainer}>
        <ClipLoader color="#36d7b7" size={50} />
        <p style={styles.loadingText}>Sending message, please wait...</p>
      </div>
    </div>
  );
};

// Inline CSS Styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff', // Changed to white background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.5s ease-out', // Added fade-in effect to the overlay
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#36d7b7', // Updated color to match loader
    animation: 'bounce 1.5s infinite', // Adding bounce animation to loader
  },
  loadingText: {
    marginTop: '15px',
    fontSize: '18px',
    fontWeight: 500,
    textAlign: 'center',
    letterSpacing: '0.5px',
    animation: 'fadeInText 1s ease-out', // Added fade-in effect to text
  },
};

// Keyframe Animations for smooth transition
const keyframes = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes fadeInText {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

// Append keyframes to head for animation to work
const styleTag = document.createElement("style");
styleTag.innerHTML = keyframes;
document.head.appendChild(styleTag);

export default LoadingState;
