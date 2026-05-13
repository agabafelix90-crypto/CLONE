import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify'; // Import Toastify
import 'react-toastify/dist/ReactToastify.css'; // Import the styles
import { urls } from './config.dev'; // Import the urls object

const SubmitSuggestion = () => {
  // Extract the clinic name from the URL
  const { clinicName } = useParams();

  // State to hold the user's suggestion and their identity (optional)
  const [suggestion, setSuggestion] = useState('');
  const [identity, setIdentity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage loading state

  // Handle change in suggestion input
  const handleSuggestionChange = (e) => {
    setSuggestion(e.target.value);
  };

  // Handle change in identity input
  const handleIdentityChange = (e) => {
    setIdentity(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create the request message
    const requestMessage = {
      clinicName: clinicName,
      suggestion: suggestion,
      identity: identity ? identity : 'Anonymous',
    };

    try {
      setIsSubmitting(true); // Set loading state to true

      // Send the suggestion to the backend using the `urls.submitsuggestion` endpoint
      const response = await fetch(urls.submitsuggestion, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestMessage),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!'); // Show success toast
        setSuggestion(''); // Clear the suggestion field
        setIdentity(''); // Clear the identity field
      } else {
        toast.error('Something went wrong. Please try again later.'); // Show error toast
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false); // Set loading state to false
    }
  };

  // Inline styles for responsiveness
  const containerStyle = {
    padding: '20px',
    maxWidth: '600px',
    margin: 'auto',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  const headingStyle = {
    fontSize: '1.8rem',
    marginBottom: '10px',
  };

  const textStyle = {
    fontSize: '1rem',
    marginBottom: '20px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  };

  const disabledButtonStyle = {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  };

  const noteStyle = {
    marginTop: '20px',
    fontSize: '0.9rem',
    color: '#555',
  };

  // Media queries for responsiveness using inline styles
  const responsiveStyles = {
    '@media (max-width: 768px)': {
      padding: '15px',
    },
    '@media (max-width: 480px)': {
      padding: '10px',
      h1: { fontSize: '1.3rem' },
      inputStyle: { fontSize: '14px' },
      buttonStyle: { fontSize: '14px' },
      noteStyle: { fontSize: '0.8rem' },
    },
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Suggestion Box for {clinicName}</h1>
      <p style={textStyle}>We value your feedback! Please take a moment to provide a suggestion and your general opinion about the services provided at {clinicName}.</p>
      
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            rows="5"
            placeholder="Type your suggestion here..."
            value={suggestion}
            onChange={handleSuggestionChange}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Optional: Enter your name or remain anonymous"
            value={identity}
            onChange={handleIdentityChange}
            style={inputStyle}
          />
        </div>
        <div>
          <button
            type="submit"
            style={isSubmitting ? { ...buttonStyle, ...disabledButtonStyle } : buttonStyle}
            disabled={isSubmitting} // Disable the button while submitting
          >
            {isSubmitting ? 'Submitting...' : 'Submit My Opinion'}
          </button>
        </div>
      </form>

      <ToastContainer /> {/* Toast container for displaying the toasts */}
      
      <p style={noteStyle}>
        *You will remain anonymous unless you choose to share your identity in the suggestion above.
      </p>
    </div>
  );
};

export default SubmitSuggestion;
