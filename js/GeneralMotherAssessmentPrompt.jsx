import React, { useEffect, useState } from 'react';
import { urls } from './config.dev'; // Importing the backend URLs
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons'; // Adding FontAwesome icons

const GeneralMotherAssessmentPrompt = ({ maternityId, age, clinicName, firstName, lastName, onClose }) => {
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch assessment data from the backend when the component mounts
  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        const payload = {
          maternityId,
          age,
          clinicName,
        };

        const response = await fetch(urls.motherAIassesment, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch assessment data: ${response.statusText}`);
        }

        const data = await response.json();
        setAssessmentData(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [maternityId, age, clinicName]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.heading}>
            MEDCORE Assessment of Mother in Labour {firstName} {lastName}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.closeIcon}>
    <path d="M6 18L18 6M6 6l12 12"></path>
  </svg>
</button>

        </div>

        <div style={styles.content}>
          {loading && (
            <div style={styles.loadingContainer}>
              <i className="fas fa-spinner fa-spin" style={styles.spinner}></i>
              <p style={styles.loadingText}>AI is thinking...</p>
            </div>
          )}
          {error && <p style={styles.error}>{error}</p>}

          {assessmentData && (
            <div style={styles.assessmentDetails}>
              <h3 style={styles.subHeading}>Assessment Information</h3>
              {assessmentData.answer ? (
                <div
                  style={styles.assessmentText}
                  dangerouslySetInnerHTML={{ __html: assessmentData.answer }}
                />
              ) : (
                <p style={styles.noData}>No detailed assessment available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly transparent background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '15px',
    width: '85%',
    maxWidth: '950px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    maxHeight: '80vh', // Limit the height of the modal
    overflowY: 'auto', // Enable vertical scrolling if content exceeds maxHeight
    fontFamily: "'Arial', sans-serif",
    animation: 'fadeIn 0.3s ease-out', // Smooth fade-in animation
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '26px',
    color: '#333',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#d9534f', // Red color for the close button
    fontSize: '24px',
    transition: 'color 0.3s',
  },
  closeButtonHover: {
    color: '#ff5c5c', // Red color on hover
  },
  closeIcon: {
    fontSize: '24px',
    color: '#d9534f', // Red close icon color
  },
  content: {
    fontSize: '16px',
    color: '#444',
    lineHeight: '1.8',
    padding: '10px 0',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px 0',
  },
  spinner: {
    fontSize: '30px',
    color: '#0056b3',
    marginRight: '10px',
  },
  loadingText: {
    color: '#0056b3',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  assessmentDetails: {
    marginTop: '20px',
  },
  subHeading: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#444',
    marginBottom: '15px',
  },
  assessmentText: {
    whiteSpace: 'pre-wrap', // This ensures that line breaks are respected
    fontSize: '16px',
    color: '#333',
    lineHeight: '1.7',
  },
  noData: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#888',
  },
};

export default GeneralMotherAssessmentPrompt;

