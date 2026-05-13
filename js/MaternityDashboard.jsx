import React, { useEffect, useState } from 'react';
import './MaternityDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBaby, faBell, faList, faPlus } from '@fortawesome/free-solid-svg-icons';
import MotherPrompt from './MotherPrompt';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';

const MaternityDashboard = () => {
  const [antenatalCount, setAntenatalCount] = useState(0);
  const [expectedMothers, setExpectedMothers] = useState([]);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        setToken(tokenFromUrl);  // Store the token in state
        console.log('URL Token:', tokenFromUrl);

        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();

          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            setClinicName(securityData.clinic);  // Capture clinic name
            saveSessionToken(securityData.clinic_session_token);
          } else if (securityData.error === 'Session expired') {
            navigate(`/dashboard?token=${securityData.clinic_session_token}`);
          } else {
            navigate('/login');
          }
        } else {
          throw new Error('Failed to perform security check');
        }
      } catch (error) {
        console.error('Error performing security check:', error);
        navigate('/login');
      }
    };

    fetchTokenAndCheckSecurity();
  }, [navigate]);

  useEffect(() => {
    fetchAntenatalCount();
    fetchExpectedMothers();
  }, []);

  const fetchAntenatalCount = async () => {
    try {
      const response = await fetch('/api/antenatalCount');
      const data = await response.json();
      setAntenatalCount(data.count);
    } catch (error) {
      console.error('Error fetching antenatal count:', error);
    }
  };

  const fetchExpectedMothers = async () => {
    try {
      const response = await fetch('/api/expectedMothers');
      const data = await response.json();
      setExpectedMothers(data.mothers.slice(0, 10));
    } catch (error) {
      console.error('Error fetching expected mothers:', error);
    }
  };

  const handleOpenPrompt = () => {
    console.log('Opening MotherPrompt');
    console.log('Passing parameters to MotherPrompt:');
    console.log('Employee Name:', employeeName);
    console.log('Clinic Name:', clinicName);
    console.log('Token:', token);  // Include the token in the console log
    setIsPromptOpen(true);
  };

  const handleClosePrompt = () => {
    setIsPromptOpen(false);
  };
  // Handle "See All Mothers" navigation
  const handleSeeAllMothers = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    navigate(`/mothers/?token=${tokenFromUrl}`);  // Use an absolute path
  };
  
  return (
    <div className="maternity-dashboard-container">
      <header className="maternity-dashboard-header">
        <h1>Maternity Center Dashboard</h1>
        <p className="header-subtitle">Overview of Maternity Services</p>
      </header>
      
      <section className="maternity-dashboard-stats">
        <div className="maternity-stat-card">
          <FontAwesomeIcon icon={faBaby} className="stat-icon" />
          <h2>{antenatalCount}</h2>
          <p>Mothers on Antenatal Care</p>
        </div>
        
        <div className="maternity-stat-card">
          <FontAwesomeIcon icon={faBell} className="stat-icon" />
          <h2>Top 10 Expected Deliveries</h2>
          <ul className="expected-mothers-list">
            {expectedMothers.map((mother, index) => (
              <li key={index}>{mother.name}</li>
            ))}
          </ul>
        </div>
      </section>
      
      <section className="maternity-dashboard-actions">
      <button className="view-all-button" onClick={handleSeeAllMothers}>
          <FontAwesomeIcon icon={faList} />
          See All Mothers
        </button>
        <button className="add-mother-button" onClick={handleOpenPrompt}>
          <FontAwesomeIcon icon={faPlus} />
          Add New Mother
        </button>
      </section>

      {isPromptOpen && (
        <MotherPrompt 
          onClose={handleClosePrompt} 
          clinicName={clinicName} 
          employeeName={employeeName} 
          token={token} // Pass the token as a prop
        />
      )}
    </div>
  );
};

export default MaternityDashboard;
