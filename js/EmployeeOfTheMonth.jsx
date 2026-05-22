import React, { useEffect, useState, useRef, useCallback } from 'react';
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

  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getPreviousMonthDates = useCallback(() => {
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    const previousMonth = monthNames[firstDayLastMonth.getMonth()];
    
    if (isMounted.current) {
      setPreviousMonthName(previousMonth);
    }

    return {
      startDate: firstDayLastMonth.toISOString().split('T')[0],
      endDate: lastDayLastMonth.toISOString().split('T')[0],
    };
  }, []);

  const fetchEmployeeOfTheMonth = useCallback(() => {
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
        if (!isMounted.current) return;

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
        if (!isMounted.current) return;
        setLoading(false);
        console.error('Error fetching performance data:', error);
      });
  }, [token, getPreviousMonthDates]);

  useEffect(() => {
    if (!token) {
      if (isMounted.current) setLoading(false);
      return;
    }

    fetch(`${urls.fetchclinicname}?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted.current) return;

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
        if (isMounted.current) {
          fetchEmployeeOfTheMonth();
        }
      });

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [token, fetchEmployeeOfTheMonth]);

  const today = new Date();
  const isWithinCelebrationPeriod = today.getDate() >= 1 && today.getDate() <= 4;

  if (loading) return null;

  if (suspensionStatus === 'suspended') {
    return (
      <div style={{ padding: '12px', background: '#ffe6e6', color: '#900', borderRadius: '8px', margin: '12px 0' }}>
        This clinic is currently suspended and employee performance data is unavailable.
      </div>
    );
  }

  if (suspensionStatus === 'risk') {
    return (
      <div style={{ padding: '12px', background: '#fff4cc', color: '#7a5d00', borderRadius: '8px', margin: '12px 0' }}>
        This clinic is at risk of suspension. Employee of the Month data will be displayed once the status clears.
      </div>
    );
  }

  if (!isWithinCelebrationPeriod || !topEmployee) return null;

  const animationStyle = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;

  return (
    <>
      <style>{animationStyle}</style>
      <div style={{ position: 'relative', padding: '16px', background: '#111827', borderRadius: '12px', color: '#fff', marginTop: '16px' }}>
        {celebration && (
          <div style={{ animation: 'pulse 1.5s ease-in-out infinite', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
              <FontAwesomeIcon icon={faTrophy} style={{ color: '#ffd700', fontSize: '1.4rem' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>Employee of the Month</span>
              <FontAwesomeIcon icon={faMedal} style={{ color: '#ffd700', fontSize: '1.4rem' }} />
            </div>
            <p style={{ margin: 0, textAlign: 'center' }}>
              Congratulations to <strong>{topEmployee.employee_name}</strong> for outstanding performance in {previousMonthName}.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default EmployeeOfTheMonth;