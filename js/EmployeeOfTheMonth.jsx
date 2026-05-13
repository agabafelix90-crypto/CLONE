import React, { useEffect, useState } from 'react';
import { urls } from './config.dev';
import { faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function EmployeeOfTheMonth({ token }) {
  const [topEmployee, setTopEmployee] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [previousMonthName, setPreviousMonthName] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspensionData, setSuspensionData] = useState(null);
  const [suspensionStatus, setSuspensionStatus] = useState('none');

  const getPreviousMonthDates = () => {
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const previousMonth = monthNames[firstDayLastMonth.getMonth()];
    setPreviousMonthName(previousMonth);
    return {
      startDate: firstDayLastMonth.toISOString().split('T')[0],
      endDate: lastDayLastMonth.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    fetch(`${urls.fetchclinicname}?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    })
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (data && data.suspension_reason) {
          setSuspensionData(data);

          const riskDate = new Date(data.risk_display_date);
          const suspDate = new Date(data.suspension_date);
          riskDate.setHours(0, 0, 0, 0);
          suspDate.setHours(0, 0, 0, 0);

          if (today >= suspDate) {
            setSuspensionStatus('suspended');
            setLoading(false);
          } else if (today >= riskDate && today < suspDate) {
            setSuspensionStatus('risk');
            setLoading(false);
          } else {
            fetchEmployeeOfTheMonth();
          }
        } else {
          fetchEmployeeOfTheMonth();
        }
      })
      .catch(err => {
        console.error('Error checking suspension:', err);
        fetchEmployeeOfTheMonth();
      });
  }, [token]);

  const fetchEmployeeOfTheMonth = () => {
    const { startDate, endDate } = getPreviousMonthDates();
    const payload = {
      token,
      startDate,
      endDate,
      section: "Overall",
    };

    fetch(urls.fetchperformance2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data && data.length > 0) {
          const topEmployeeData = data.reduce((prev, curr) =>
            prev.percentage > curr.percentage ? prev : curr
          );
          setTopEmployee(topEmployeeData);
          setCelebration(true);
        }
      })
      .catch(error => {
        setLoading(false);
        console.error('Error fetching performance data:', error);
      });
  };

  const today = new Date();
  const isWithinCelebrationPeriod = today.getDate() >= 1 && today.getDate() <= 4;

  if (loading) return null;

  if (suspensionStatus === 'suspended') {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000000',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
      }}>
        <style>{`
          @keyframes pulse-red {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            92% { opacity: 1; }
            93% { opacity: 0.3; }
            94% { opacity: 1; }
            96% { opacity: 0.5; }
            97% { opacity: 1; }
          }
        `}</style>
        <div style={{
          color: '#ff2222',
          fontSize: 'clamp(14px, 3vw, 18px)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: '32px',
          animation: 'pulse-red 2s infinite',
          fontFamily: 'monospace',
        }}>
          ⚠ SYSTEM ALERT ⚠
        </div>

        <div style={{
          color: '#ffffff',
          fontSize: 'clamp(28px, 6vw, 64px)',
          fontWeight: '900',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          lineHeight: 1.1,
          marginBottom: '40px',
          fontFamily: 'monospace',
          animation: 'flicker 5s infinite',
        }}>
          ACCOUNT SUSPENDED
        </div>

        <div style={{
          width: '80px',
          height: '2px',
          backgroundColor: '#ff2222',
          marginBottom: '40px',
        }} />

        <div style={{
          color: '#cccccc',
          fontSize: 'clamp(13px, 2.5vw, 18px)',
          lineHeight: '1.9',
          maxWidth: '640px',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}>
          <p style={{ marginBottom: '16px' }}>
            SORRY FOR THE INCONVENIENCE.
          </p>
          <p style={{ marginBottom: '16px', color: '#ff6666' }}>
            ALL YOUR DATA MIGHT BE LOST SOON AND MIGHT NOT BE RECOVERED.
          </p>
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>
            SETTLE THE ISSUE AT YOUR EARLIEST CONVENIENCE.
          </p>
        </div>

        {suspensionData?.clinic_name && (
          <div style={{
            marginTop: '48px',
            color: '#555',
            fontSize: '12px',
            fontFamily: 'monospace',
            letterSpacing: '0.15em',
          }}>
            CLINIC: {suspensionData.clinic_name}
          </div>
        )}
      </div>
    );
  }

  if (suspensionStatus === 'risk') {
    const suspDate = new Date(suspensionData.suspension_date);
    const daysLeft = Math.ceil((suspDate - new Date()) / (1000 * 60 * 60 * 24));

    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '250px',
            right: 0,
            height: '40px',
            color: '#ff4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.1em',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <span style={{ margin: '0 5px' }}>⚠️</span>
          <span>
            ACCOUNT SUSPENSION RISK — {daysLeft} DAY{daysLeft !== 1 ? 'S' : ''} REMAINING — {suspensionData.suspension_reason}
          </span>
          <span style={{ margin: '0 5px' }}>⚠️</span>
        </div>
      </div>
    );
  }

  if (!isWithinCelebrationPeriod || !topEmployee) return null;

  const animationStyle = `
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
  `;

  return (
    <>
      <style>{animationStyle}</style>
      <div style={{ position: 'relative' }}>
        {celebration && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: '250px',
              right: 0,
              height: '60px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon icon={faTrophy} style={{ margin: '0 5px', animation: 'bounce 1s infinite', color: '#ffcc00' }} />
            <FontAwesomeIcon icon={faMedal} style={{ margin: '0 5px', animation: 'bounce 1s infinite', color: '#ffcc00' }} />
            <span style={{ margin: '0 10px', fontSize: '1.2em', fontWeight: 'bold', textAlign: 'center', color: 'yellow' }}>
              🎉🎉 Employee of the Month for {previousMonthName} is{' '}
              <span style={{ color: 'yellow', fontWeight: 'bold', fontSize: 'larger' }}>
                {topEmployee.employee_name}
              </span>. Your efforts are appreciated. 🎉🎉
            </span>
            <FontAwesomeIcon icon={faMedal} style={{ margin: '0 5px', animation: 'bounce 1s infinite', color: '#ffcc00' }} />
            <FontAwesomeIcon icon={faTrophy} style={{ margin: '0 5px', animation: 'bounce 1s infinite', color: '#ffcc00' }} />
          </div>
        )}
      </div>
    </>
  );
}

export default EmployeeOfTheMonth;