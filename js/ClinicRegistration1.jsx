import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClinicRegistration1.css';

function ClinicRegistration1() {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://static-bundles.visme.co/forms/vismeforms-embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="clinic-registration-1">
      <h2>Welcome to Clinic-Pro</h2>
      <p>Your Partner in Efficient Clinic Management</p>
      <p>
        Clinic-Pro helps manage your clinic, facilitating seamless communication between doctors and other departments online.
        Send lab requests, maintain sales records, schedule appointments, and keep track of patient birthdays.
      </p>
      <h3>Register and Let's Get Started!</h3>
      <div className="visme_d" 
           data-title="Custom Form" 
           data-url="w46xxwmz-custom-form?fullPage=true" 
           data-domain="forms" 
           data-full-page="true" 
           data-min-height="100vh" 
           data-form-id="74103">
      </div>
      <div className="form-buttons">
        <button type="button" onClick={() => navigate('/login')}>
          Already have an account? Sign in
        </button>
        <button type="button" onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ClinicRegistration1;
