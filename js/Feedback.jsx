import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import toast styling

import { urls } from './config.dev';
import './feedback.css';  // Import the CSS file for styling

const Feedback = () => {
  const { clinicName, token } = useParams();  // Extract clinicName and token from the URL parameters
  const [employeeData, setEmployeeData] = useState([]);  // Store employee data
  const [selectedRating, setSelectedRating] = useState('');  // Track the selected rating
  const [comment, setComment] = useState('');  // Track the comment input
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);  // Track feedback submission state
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);  // Track the current employee index
  const [isSubmitting, setIsSubmitting] = useState(false);  // Track submission status
  const [isTransitioning, setIsTransitioning] = useState(false);  // Track the transition state for employee change

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(urls.AskFeedback, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
  
        // Check if the response contains the error message for expired feedback
        if (data.status === 'error' && data.message === 'No feedback requests found for this token.') {
          toast.error('Sorry, this feedback request is expired.');
        } else {
          setEmployeeData(data.employees);  // Assuming the response contains a list of employees
        }
      } catch (error) {
        console.error('Error fetching feedback request:', error);
        toast.error('Error fetching feedback data. Please try again later.');
      }
    };
  
    fetchFeedback();  // Fetch feedback data when component loads
  }, [token]);  // Re-run if token changes
  

  const handleSubmit = async (employeeName) => {
    // Ensure both rating and comment are provided
    if (!selectedRating || !comment.trim()) {
      toast.error('Please provide both a rating and a comment.');
      return;
    }

    const feedbackData = {
      token,
      employeeName,
      rating: selectedRating,
      comment,
    };

    setIsSubmitting(true);  // Disable submission button during the process

    try {
      await fetch(urls.SubmitFeedback, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      toast.success('Feedback successfully submitted!');

      // Trigger transition to next employee
      setTimeout(() => {
        setIsSubmitting(false);
        setFeedbackSubmitted(true);
        setSelectedRating('');  // Reset selected rating
        setComment('');  // Clear comment input
        setIsTransitioning(true);  // Show transition message

        // Move to the next employee after 2 seconds
        setTimeout(() => {
          setIsTransitioning(false);  // Hide transition message
          setFeedbackSubmitted(false);  // Reset feedback submission state
          setCurrentEmployeeIndex((prevIndex) => prevIndex + 1);  // Move to next employee
        }, 2000);  // Transition message visible for 2 seconds
      }, 2000);  // Wait for 2 seconds before transitioning
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback. Please try again.');
      setIsSubmitting(false);  // Re-enable submit button if there’s an error
    }
  };

  const currentEmployee = employeeData[currentEmployeeIndex];  // Get current employee data based on index

  return (
    <div className="feedbackContainer">
      <h1 className="feedbackHeading">Feedback Collection for {clinicName}</h1>

      {/* Conditional rendering for "Moving to next employee" message */}
      {isTransitioning ? (
        <div className="transitionMessage fade-in">
          <p>Moving to the next employee...</p>
        </div>
      ) : (
        employeeData.length > 0 && currentEmployee ? (
          <div className="employeeFeedbackContainer">
            <div className="employeeCard">
              <h3 className="employeeName">Feedback request on {currentEmployee.name}</h3>
              <p>{currentEmployee.request}</p>

              <div className="ratingContainer">
                <p className="ratingPrompt">
                  Choose one of the options below to rate your experience with {currentEmployee.name}:
                </p>

                <div className="ratingCheckboxes">
                  {['Extremely Bad', 'Very Bad', 'Bad', 'Good', 'Very Good', 'Extremely Good'].map((option, index) => (
                    <div key={index} className="ratingCheckbox">
                      <input
                        type="checkbox"
                        id={`rating-${index}`}
                        name="rating"
                        value={option}
                        checked={selectedRating === option}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRating(option);
                          } else {
                            setSelectedRating('');  // Reset selected rating if unchecked
                          }
                        }}
                        disabled={selectedRating && selectedRating !== option}
                      />
                      <label htmlFor={`rating-${index}`}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              <h4 className="commentPrompt">Please insert your comment below</h4>

              <textarea
                className="commentBox"
                placeholder={`Please comment about ${currentEmployee.name}'s customer care, professionalism, smartness, and your general opinion.`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <button
                className="submitButton"
                onClick={() => handleSubmit(currentEmployee.name)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Please wait...' : 'Submit Feedback'}
              </button>

              {feedbackSubmitted && currentEmployeeIndex < employeeData.length - 1 && (
                <p className="thankYouMessage fade-in">Thank you for your feedback! Moving to the next employee...</p>
              )}
            </div>
          </div>
        ) : (
          <p>{employeeData.length === 0 ? 'Loading feedback request...' : 'Thank you for providing feedback! Bye'}</p>
        )
      )}

      {/* ToastContainer for displaying notifications */}
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default Feedback;
