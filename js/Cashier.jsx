import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faHandHoldingUsd, faFlask } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';
import './Cashier.css';
import Topbar from './Topbar'; // Import the Topbar component

function Cashier() {
  const [liveSales, setLiveSales] = useState(null);
  const [liveExpenses, setLiveExpenses] = useState(null);
  const [liveCashAtHand, setLiveCashAtHand] = useState(null);
  const [awaitingPatientsCount, setAwaitingPatientsCount] = useState(0);
  const [employeeName, setEmployeeName] = useState('');
  const [securityChecked, setSecurityChecked] = useState(false);
  const [clinicSessionToken, setClinicSessionToken] = useState(null);
  const [shiftDate, setShiftDate] = useState('');
  const [shiftType, setShiftType] = useState('');
  
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token'); // Define urlToken here

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        // Perform the security check
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
            setSecurityChecked(true);
            setClinicSessionToken(securityData.clinic_session_token);

            // After security check, fetch the shift data
            await fetchShiftData(tokenFromUrl);

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

  // Function to fetch shift data from urls.checkshift
  const fetchShiftData = async (tokenFromUrl) => {
    try {
      const shiftResponse = await fetch(urls.checkshift, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenFromUrl }),
      });

      if (shiftResponse.ok) {
        const shiftData = await shiftResponse.json();
        setShiftDate(shiftData.shiftDate);
        setShiftType(shiftData.shiftType);

        // After fetching shift data, fetch live data
        fetchLiveData(tokenFromUrl, shiftData.shiftDate, shiftData.shiftType);
        fetchAwaitingPatientsCount(tokenFromUrl); // Fetch awaiting patients count
      } else {
        throw new Error('Failed to fetch shift data');
      }
    } catch (error) {
      console.error('Error fetching shift data:', error);
    }
  };

  // Function to fetch live sales data, now including shiftDate and shiftType
  const fetchLiveData = async (tokenFromUrl, shiftDate, shiftType) => {
    try {
      const response = await fetch(urls.live, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenFromUrl,
          shiftDate: shiftDate,
          shiftType: shiftType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiveSales(parseFloat(data.liveSales));
        setLiveExpenses(parseFloat(data.liveExpenses));
        setLiveCashAtHand(parseFloat(data.liveCashAtHand));
      } else {
        throw new Error('Failed to fetch live data');
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  // Function to fetch awaiting patients count
  const fetchAwaitingPatientsCount = async (token) => {
    try {
      const response = await fetch(urls.waitingpaymentcount, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json();
        setAwaitingPatientsCount(data.count);
      } else {
        throw new Error('Failed to fetch awaiting patients count');
      }
    } catch (error) {
      console.error('Error fetching awaiting patients count:', error);
    }
  };

  const greetings = ['Hi', 'Hello'];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  const handleGoToSalesPage = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    navigate(`/salespage/?token=${tokenFromUrl}`);
  };

  const handleGoToAwaitingPaymentsPage = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    navigate(`/awaitingpayments/?token=${tokenFromUrl}`);
  };

  return (
    <div className="cashier-page-container">
      <Topbar token={urlToken} />
      {/* Heading with Greeting */}
      <h1>{randomGreeting}, {employeeName}</h1>

      {/* Custom Dashboard Container */}
      <div className="cashier-custom-dashboard-container">
        {/* Live Info */}
        <div className="cashier-live-info">
          <div className="cashier-live-sales">
            <h3><FontAwesomeIcon icon={faMoneyBillWave} /> Live Sales</h3>
            <p className="cashier-live-data">{typeof liveSales === 'number' ? `Ugx ${liveSales.toFixed(2)}` : 'Loading...'}</p>
          </div>
          <div className="cashier-live-expenses">
            <h3><FontAwesomeIcon icon={faMoneyBillWave} /> Live Expenses</h3>
            <p className="cashier-live-data">{typeof liveExpenses === 'number' ? `Ugx ${liveExpenses.toFixed(2)}` : 'Loading...'}</p>
          </div>
          <div className="cashier-cash-at-hand">
            <h3><FontAwesomeIcon icon={faHandHoldingUsd} /> Live Cash at Hand</h3>
            <p className="cashier-live-data">{typeof liveCashAtHand === 'number' ? `Ugx ${liveCashAtHand.toFixed(2)}` : 'Loading...'}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="cashier-custom-dashboard-buttons">
          <button className="cashier-custom-dashboard-button" onClick={handleGoToSalesPage}>
            Go to Sales Page
          </button>
          <button className="cashier-custom-dashboard-button cashier-awaiting-patients" onClick={handleGoToAwaitingPaymentsPage}>
            <FontAwesomeIcon icon={faFlask} /> Lab/Scan Patients awaiting payment
            {awaitingPatientsCount > 0 && <span className="cashier-badge">{awaitingPatientsCount}</span>}
          </button>
          <footer className="footer2">
            This system was created by MEDCORE Systems. For support or help contact +256752648844
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Cashier;


