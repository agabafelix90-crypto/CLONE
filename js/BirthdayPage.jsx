import React, { useState, useEffect } from 'react';
import './BirthdayPage.css'; // Style for BirthdayPage
import { urls } from './config.dev'; // Importing urls from config.dev

function BirthdayPage() {
  const [patients, setPatients] = useState([]);
  const [showSendMessagePrompt, setShowSendMessagePrompt] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [employeeName, setEmployeeName] = useState('');

 
  

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        // Extract employee name from URL path
        const employee = window.location.pathname.split('/').pop();
  
        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ employeeName: employee }), // Send employee name in the request body
        });
  
        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          if (securityData.message === 'accepted') {
            // Proceed with fetching patients if security check is accepted
            fetchPatientsWithBirthdays();
          } else if (securityData.redirect_url) {
            // Redirect if backend returns a redirect URL
            // Delay redirection by 20 seconds for debugging
            setTimeout(() => {
              window.location.href = securityData.redirect_url;
            }, 1000);
          } else {
            throw new Error('Security check failed');
          }
        } else {
          throw new Error('Failed to perform security check');
        }
      } catch (error) {
        console.error('Error performing security check:', error);
      }
    };
  
    fetchSecurity();
  }, []);
  
  
  const fetchPatientsWithBirthdays = async () => {
    try {
      const response = await fetch(urls.birthdays);
      if (response.ok) {
        const data = await response.json();
        setPatients(data || []); // Set patients to data or an empty array if data is undefined
      } else {
        throw new Error('Failed to fetch patients with birthdays');
      }
    } catch (error) {
      console.error('Error fetching patients with birthdays:', error);
    }
  };

  


  

  const handleSendReminder = async () => {
    try {
      if (!selectedPatient) {
        throw new Error('No selected patient to send reminder');
      }
  
      const payload = {
        phoneNumber: selectedPatient.phone_number,
        message: message
      };
  
      const response = await fetch(urls.whatsapp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        alert('Reminder sent successfully via WhatsApp');
        // Reload the page after 10 seconds
        setTimeout(() => {
          window.location.reload();
        }, 10000);
      } else {
        const responseData = await response.json(); // Parse response body as JSON
        throw new Error(responseData); // Throw an error with the response data
      }
    } catch (error) {
      console.error('Error sending reminder:', error.message);
    }
  };

  const handleCancel = () => {
    setShowSendMessagePrompt(false);
  };

  const handleSendBirthdayWishes = async (phone, message) => {
    try {
      const response = await fetch(urls.whatsapp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message }),
      });
      if (response.ok) {
        // Message sent successfully
        console.log('Birthday wishes sent successfully!');
      } else {
        throw new Error('Failed to send birthday wishes');
      }
    } catch (error) {
      console.error('Error sending birthday wishes:', error);
    }
  };

  return (
    <div className="birthday-page">
      <h1>Patients with Birthdays today</h1>
      {patients.length > 0 ? (
        <div className="patient-list">
          {patients.map((patient) => (
            <div key={patient.contact_id} className="patient-card">
              <h2>{patient.first_name} {patient.last_name}</h2>
              <p>Date of Birth: {patient.dob}</p>
              <p>Phone Number: {patient.phone_number}</p>
              <p>Age: {patient.age}</p>
              <p>Sex: {patient.sex}</p>
              <p>Religion: {patient.religion}</p>
              <button onClick={() => {
    setSelectedPatient(patient);
    setShowSendMessagePrompt(true);
    setMessage(`Hello, warm greeting from LifeSure Medicare, your quality medical service provider. We wish ${patient.first_name} ${patient.last_name} a happy birthday.`);
}} disabled>
  Send Birthday Wishes
</button>

            </div>
          ))}
        </div>
      ) : (
        <p>No birthdays for any patients today.</p>
      )}
      {showSendMessagePrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Send Reminder</h2>
            <p>{message}</p>
            <button onClick={handleSendReminder}>Send Reminder</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BirthdayPage;