import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import LoadingSpinner from './LoadingSpinner';
import { FaCommentDots, FaThumbsUp, FaLightbulb } from 'react-icons/fa'; // Importing icons

function SuggestionBox() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClinicName = async () => {
    if (token === 'KIKAJJO') {
      setClinicName('KIKAJJO HEALTH CENTER AND MATERNITY HOME');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${urls.fetchclinicname}?token=${token}`);
      const data = await response.json();
      if (response.ok) {
        setClinicName(data.clinic_name);
      } else {
        throw new Error('Failed to fetch clinic name');
      }
    } catch (error) {
      toast.error('Error fetching clinic name');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!clinicName) return;
    setIsLoading(true);
    try {
      const response = await fetch(urls.fetchsuggestionbox, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_name: clinicName }),
      });
      const data = await response.json();
      if (response.ok) {
        setFeedbacks(data.feedbacks || []);
        setComments(data.feedbackTokens || []);
      } else {
        throw new Error('Failed to fetch suggestions');
      }
    } catch (error) {
      toast.error('Error fetching suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchClinicName();
    else navigate('/login');
  }, [token]);

  useEffect(() => {
    if (clinicName) fetchSuggestions();
  }, [clinicName]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', backgroundColor: '#f0f8ff' }}>
      <ToastContainer />
      {clinicName && <h2 style={{ fontSize: '28px', color: '#000', marginBottom: '20px', fontWeight: 'bold' }}>Client Suggestions, Feedbacks, and Comments</h2>}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}><LoadingSpinner /></div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1600px', gap: '-15px' }}>{/* Reduced the gap here */}
          {/* Left Section - Feedbacks and Comments */}
          <div style={{ flex: '0.48', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '22px', color: '#000', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <FaCommentDots style={{ color: '#28a745', marginRight: '10px' }} /> Feedbacks and Comments
            </h3>
            {comments.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {comments.map((item) => (
                  <li key={item.id} style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#d4edda', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', display: 'block', textAlign: 'left' }}>
                    <div style={{ marginBottom: '8px', color: '#000' }}>
                      <p><strong>{item.first_name} {item.last_name}</strong> offered feedback on services offered by <strong>{item.employee_name}</strong></p>
                    </div>
                    <div style={{ marginBottom: '8px', color: '#000' }}>
                      <p><strong>Rating:</strong> {item.response || 'No response available'}</p>
                    </div>
                    <div style={{ fontSize: '14px', color: '#000' }}>
                      <p><strong>Comment:</strong> {item.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#ff6f61', fontStyle: 'italic' }}>No feedbacks available.</p>
            )}
          </div>
  
          {/* Right Section - Suggestions */}
          <div style={{ flex: '0.48', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '22px', color: '#000', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <FaLightbulb style={{ color: '#ff9800', marginRight: '10px' }} /> Suggestions
            </h3>
            {feedbacks.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {feedbacks.map((suggestion) => (
                  <li key={suggestion.id} style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#d4edda', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ marginBottom: '8px', textAlign: 'left', color: '#000' }}>
                      <p><strong>Date and Time:</strong> {new Date(suggestion.feedback_date).toLocaleString()}</p>
                      <p><strong>Identity:</strong> {suggestion.identity}</p>
                      <p><strong>Suggestion:</strong> {suggestion.suggestion}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: '#ff6f61', fontStyle: 'italic' }}>No suggestions available.</p>}
          </div>
        </div>
      )}
    </div>
  );
  
}

export default SuggestionBox;
