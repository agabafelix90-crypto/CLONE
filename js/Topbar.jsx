import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faTimes, faSignOutAlt, faStar as faSolidStar, faCaretDown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Dynamic CSS import based on theme
function getTopbarStyles(themeColor) {
  // If theme is white, use topbar2.css, otherwise use topbar.css
  if (themeColor && themeColor.toLowerCase() === 'white') {
    return import('./Topbar2.css');
  }
  return import('./Topbar.css');
}

function getStartOfMonth() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start);
}

function getEndOfMonth() {
  const today = new Date();
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(end);
}

const normalizePermissions = (permissions = []) => {
  const aliasMap = {
    view_sales: ['sales'],
    view_inventory: ['store', 'selldrugs'],
    manage_employees: ['manage_employees'],
    access_radiographer: ['access-radiographer'],
    access_doctors_room: ['access-doctors-room'],
  };

  return Array.from(new Set(
    (permissions || []).flatMap((permission) => {
      const normalized = permission?.toString().trim().toLowerCase();
      if (!normalized) return [];
      return aliasMap[normalized] || [normalized];
    })
  ));
};

const CriticalNotification = () => {
  return (
    <div className="critical-notification">
      <FontAwesomeIcon icon={faExclamationTriangle} />
      <span>CRITICAL Patient Waiting</span>
    </div>
  );
};

function Topbar({ token }) {
  const [permissions, setPermissions] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [message, setMessage] = useState('');
  const [dataAvailable, setDataAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRadiographerDropdownOpen, setIsRadiographerDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [isCashierDropdownOpen, setIsCashierDropdownOpen] = useState(false);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [currentAppointmentIndex, setCurrentAppointmentIndex] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(60);
  const [displayingReminder, setDisplayingReminder] = useState(false);
  const [isLabDropdownOpen, setIsLabDropdownOpen] = useState(false);
  const [isNurseDropdownOpen, setIsNurseDropdownOpen] = useState(false);
  const [isDispensaryDropdownOpen, setIsDispensaryDropdownOpen] = useState(false);
  const [isHomeDropdownOpen, setIsHomeDropdownOpen] = useState(false);
  const [totalReminders, setTotalReminders] = useState(0);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [starsVisible, setStarsVisible] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(false);
  const [themeColor, setThemeColor] = useState('');
  const [securityDataLoaded, setSecurityDataLoaded] = useState(false);
  const [setupType, setSetupType] = useState(null); // New state for setup type
  const [employeeName, setEmployeeName] = useState('');
  
  // New state for cash rewards
  const [employeeData, setEmployeeData] = useState(null);
  const [showRewards, setShowRewards] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [rewardsPosition, setRewardsPosition] = useState({ x: 0, y: 0 });

  // Loading states for navigation
  const [homeLoading, setHomeLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const startDate = getStartOfMonth();
  const endDate = getEndOfMonth();

  // Determine if setup is pharmacy
  const isPharmacySetup = setupType === 'pharmacy';

  // Load the appropriate CSS based on themeColor from security response
  useEffect(() => {
    const loadCSS = async () => {
      try {
        if (themeColor) {
          await getTopbarStyles(themeColor);
        } else {
          // Default to regular Topbar.css if no theme color yet
          await import('./Topbar.css');
        }
        setCssLoaded(true);
      } catch (error) {
        console.error('Error loading CSS:', error);
        // Fallback to default CSS
        await import('./Topbar.css');
        setCssLoaded(true);
      }
    };
    
    // Only load CSS if we have themeColor OR if we've determined there's no color (security data loaded but no color)
    if ((themeColor || securityDataLoaded) && !cssLoaded) {
      loadCSS();
    }
  }, [themeColor, cssLoaded, securityDataLoaded]);

  const handleMouseEnter = (setter) => () => setter(true);
  const handleMouseLeave = (setter) => () => setter(false);

  const toggleCashierDropdown = (e) => {
    e.stopPropagation();
    setIsCashierDropdownOpen(!isCashierDropdownOpen);
  };

  const handleCashierNavigation = () => {
    navigate(`/sales?token=${token}`);
  };

  const handleSalesPageNavigation = () => {
    navigate(`/salespage?token=${token}`);
  };

  const handleAwaitingPaymentsNavigation = () => {
    navigate(`/awaitingpayments?token=${token}`);
  };

  const handleSalesHistoryNavigation = () => {
    navigate(`/access-sales-details?token=${token}`);
  };

  const toggleDoctorDropdown = (e) => {
    e.stopPropagation();
    setIsDoctorDropdownOpen(!isDoctorDropdownOpen);
  };

  const handleDoctorNavigation = () => {
    navigate(`/access-doctors-room?token=${token}`);
  };

  const handleAttendToPatientNavigation = () => {
    navigate(`/attend-to-new-patient?token=${token}`);
  };

  const handleViewExistingFilesNavigation = () => {
    navigate(`/patientfiles?token=${token}`);
  };

  const toggleLabDropdown = (e) => {
    e.stopPropagation();
    setIsLabDropdownOpen(!isLabDropdownOpen);
  };

  const handleLabNavigation = () => {
    navigate(`/access-laboratory?token=${token}`);
  };

  const handlePendingLabTestsNavigation = () => {
    navigate(`/lab?token=${token}`);
  };

  const toggleNurseDropdown = (e) => {
    e.stopPropagation();
    setIsNurseDropdownOpen(!isNurseDropdownOpen);
  };

  const handleNurseNavigation = () => {
    navigate(`/access-nurse?token=${token}`);
  };

  const handlePatientFilesNavigation = () => {
    navigate(`/patientfiles2?token=${token}`);
  };

  const toggleDispensaryDropdown = (e) => {
    e.stopPropagation();
    setIsDispensaryDropdownOpen(!isDispensaryDropdownOpen);
  };

  const handleDispensaryNavigation = () => {
    navigate(`/selldrugs?token=${token}`);
  };

  const handleNonSaleStockRemovalNavigation = () => {
    navigate(`/remove-drugs?token=${token}`);
  };

  const handleSoldDrugsOverviewNavigation = () => {
    navigate(`/dispensed-and-sold?token=${token}`);
  };

  const handleNonSoldRemovedDrugsOverviewNavigation = () => {
    navigate(`/removed-drugs-equipment?token=${token}`);
  };

  const toggleHomeDropdown = (e) => {
    e.stopPropagation();
    setIsHomeDropdownOpen(!isHomeDropdownOpen);
  };

  const handleTriageNavigation = () => {
    navigate(`/triage?token=${token}`);
  };

  const handleDrugSettingsNavigation = () => {
    navigate(`/manageDrugs?token=${token}`);
  };

  const handleRadiologyNavigation = () => {
    navigate(`/access-radiographer?token=${token}`);
  };

  const handleRestockSuggestionsNavigation = () => {
    navigate(`/makeOrderForDrugs?token=${token}`);
  };

  const handleSetInvestigationsNavigation = () => {
    navigate(`/manageLaboratory?token=${token}`);
  };

  const handleSetProceduresNavigation = () => {
    navigate(`/manageServices?token=${token}`);
  };

  const handleSetCategoriesNavigation = () => {
    navigate(`/set-sales-expenses-categories?token=${token}`);
  };

  const handleInvoiceHistoryNavigation = () => {
    navigate(`/invoices?token=${token}`);
  };

  const handleStoreNavigation = () => {
    navigate(`/store?token=${token}`);
  };

  const handleRewardClick = () => {
    navigate(`/employeebalance?token=${token}`);
  };

  // New navigation handlers with loading states
  const handleStockNavigation = async () => {
    setStockLoading(true);
    try {
      await navigate(`/stocktracking/?token=${token}`);
    } finally {
      setStockLoading(false);
    }
  };

  const handleAppointmentsNavigation = async () => {
    setAppointmentsLoading(true);
    try {
      await navigate(`/patient-appointments/?token=${token}`);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleSubscriptionNavigation = async () => {
    setSubscriptionLoading(true);
    try {
      await navigate(`/makePayment/?token=${token}`);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Fetch session data including employee balance and theme color
  const fetchSessionData = async () => {
    try {
      const response = await fetch(urls.security, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmployeeData(data);
        
        // Store the employee name so permissions are fetched for the logged-in user
        if (data.employee_name) {
          setEmployeeName(data.employee_name);
        } else if (data.name) {
          setEmployeeName(data.name);
        }

        // Extract theme color from security response
        if (data.colour) {
          setThemeColor(data.colour);
        }
        
        // Extract setup type from security response
        if (data.set_up) {
          setSetupType(data.set_up);
        }
        
        // Show rewards if employee balance is greater than 0
        if (data.employee_balance > 0) {
          setShowRewards(true);
        }
      } else {
        console.error('Failed to fetch session data');
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      // Mark security data as loaded regardless of success/failure
      // This ensures we proceed even if the API call fails
      setSecurityDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchSessionData(); // Fetch session data on component mount
  }, [token]);

  useEffect(() => {
    const fetchClinicPermissions = async () => {
      const response = await fetch(urls.fetchpermissions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        return normalizePermissions(data.permissions || []);
      }

      return [];
    };

    const fetchPermissions = async () => {
      try {
        const endpoint = employeeName ? urls.fetchpermissions2 : urls.fetchpermissions;
        const payload = employeeName ? { token, employeeName } : { token };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const permissionSet = normalizePermissions(data.permissions || []);

          if (employeeName && data.success === false) {
            console.warn('Employee-specific permissions unavailable, falling back to clinic-level permissions:', data.message);
            const clinicPermissions = await fetchClinicPermissions();
            setPermissions(clinicPermissions);
          } else {
            setPermissions(permissionSet);
          }

          fetchPerformanceData(token, employeeName || data.name);
        } else {
          console.error('Failed to fetch permissions');
          const clinicPermissions = await fetchClinicPermissions();
          setPermissions(clinicPermissions);
          fetchPerformanceData(token, employeeName);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        const clinicPermissions = await fetchClinicPermissions();
        setPermissions(clinicPermissions);
        fetchPerformanceData(token, employeeName);
      }
    };

    if (token) {
      fetchPermissions();
    }
  }, [token, employeeName]);

  const fetchPerformanceData = async (token, employeeName) => {
    try {
      setLoading(true);
      const response = await fetch(urls.fetchperformance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          startDate,
          endDate,
          section: 'all',
        }),
      });

      const data = await response.json();
      const performanceResults = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : null;

      if (!performanceResults) {
        const errorMessage = data.error || 'No valid performance data received.';
        setMessage(errorMessage);
        setDataAvailable(false);
      } else {
        performanceResults.sort((a, b) => b.percentage - a.percentage);

        const loggedEmployee = performanceResults.find(emp => emp.employee_name === employeeName);
        const employeePosition = performanceResults.findIndex(emp => emp.employee_name === employeeName) + 1;

        if (loggedEmployee) {
          let stars = 0;
          if (employeePosition === 1) stars = 5;
          else if (employeePosition === 2) stars = 4;
          else if (employeePosition === 3) stars = 3;
          else if (employeePosition === 4) stars = 2;
          else if (employeePosition === 5) stars = 1;

          setSelectedEmployee(loggedEmployee.employee_name);
          setMessage(stars);
          setDataAvailable(true);

          // Trigger star animation shortly after data is set
          setTimeout(() => setStarsVisible(true), 100);
        } else {
          setMessage('Logged-in employee not found in the performance data');
          setDataAvailable(false);
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeToken = async () => {
    try {
      const response = await fetch(urls.dashboardtoken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      } else {
        console.error('Failed to fetch home token');
        return null;
      }
    } catch (error) {
      console.error('Error fetching home token:', error);
      return null;
    }
  };

  const handleHomeNavigation = async () => {
    setHomeLoading(true);
    try {
      const newToken = await fetchHomeToken();
      if (newToken) {
        navigate(`/dashboard?token=${newToken}`);
      }
    } finally {
      setHomeLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await fetch(urls.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        navigate('/login');
      } else {
        console.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const permissionRoutes = {
    cashier: '/sales',
    billing: '/credits',
    'drug-shelves': '/selldrugs',
    radiographer: '/access-radiographer',
    store: '/store',
    doctor: '/access-doctors-room',
    lab: '/access-laboratory',
    nurse: '/access-nurse',
    triage: '/triage',
  };

  const permissionLabels = {
    cashier: 'Cashier',
    billing: isPharmacySetup ? 'Credits' : 'Billing',
    'drug-shelves': isPharmacySetup ? 'Selling Page' : 'Pharmacy',
    radiographer: 'Radiographer',
    store: 'Store',
    doctor: 'Doctor',
    lab: 'Laboratory',
    nurse: 'Nurse',
    triage: 'Triage',
  };

  const permissionMap = {
    cashier: 'sales',
    billing: 'sales',
    'drug-shelves': 'selldrugs',
    radiographer: 'access-radiographer',
    store: 'store',
    doctor: 'access-doctors-room',
    lab: 'access-laboratory',
    nurse: 'access-nurse',
    'drug-settings': 'managedrugs',
    triage: 'triage',
  };

  const handleNavigation = (path) => {
    navigate(`${path}?token=${token}`);
  };

  const handlePerformanceClick = () => {
    navigate(`/employeePerformance?token=${token}`);
  };

  const toggleRadiographerDropdown = (e) => {
    e.stopPropagation();
    setIsRadiographerDropdownOpen(!isRadiographerDropdownOpen);
  };

  const handleRadiographerNavigation = () => {
    navigate(`/access-radiographer?token=${token}`);
  };

  const handlePendingRadiologyExamsNavigation = () => {
    navigate(`/radiology?token=${token}`);
  };

  useEffect(() => {
    let notificationInterval, displayNotification;

    const checkCriticalPatients = () => {
      if (permissions.includes('access-doctors-room')) {
        fetch(urls.checkcritical, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })
          .then(response => response.json())
          .then(data => {
            if (data.response === 'yes') {
              setIsCritical(true);
            } else {
              setIsCritical(false);
              clearInterval(notificationInterval);
              clearInterval(displayNotification);
            }
          })
          .catch(error => console.error('Error:', error));
      }
    };

    checkCriticalPatients();

    notificationInterval = setInterval(() => {
      checkCriticalPatients();
    }, 10000);

    const toggleNotification = () => {
      setIsCritical(prev => !prev);
    };

    displayNotification = setInterval(() => {
      if (isCritical) {
        toggleNotification();
        setTimeout(() => {
          toggleNotification();
        }, 5000);
      }
    }, 10000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(displayNotification);
    };
  }, [permissions, token]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(urls.appointments, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setAppointments(data);

            if (data[0].reminded === "no") {
              setDisplayingReminder(true);
            }

            setTotalReminders(data.filter(app => app.reminded === "no").length);
          } else {
            console.warn("No valid appointment data received.");
          }
        } else {
          throw new Error('Failed to fetch appointments');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [urls.appointments, token]);

  const handleReminderClick = async () => {
    const currentAppointment = appointments[currentAppointmentIndex];
    const confirmed = window.confirm(`Are you sure you have contacted ${currentAppointment.first_name} ${currentAppointment.last_name}?`);
    
    if (confirmed) {
        try {
            const response = await fetch(urls.deletereminder, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointment_id: currentAppointment.appointment_id,
                    token,
                }),
            });

            if (response.ok) {
                setAppointments(prev => {
                    const updated = prev.filter(app => app.appointment_id !== currentAppointment.appointment_id);
                    // Adjust currentAppointmentIndex if necessary
                    if (currentAppointmentIndex >= updated.length) {
                        setCurrentAppointmentIndex(Math.max(0, updated.length - 1));
                    }
                    return updated;
                });
                setDisplayingReminder(false);
                setTotalReminders(prev => prev - 1);
            } else {
                console.error('Failed to delete reminder:', response);
            }
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    }
  };

  const handleRewardsMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Show close button when mouse is in top 25% of the rewards notification
    if (mouseY < rect.height * 0.25) {
      setShowCloseButton(true);
    } else {
      setShowCloseButton(false);
    }
  };

  const handleCloseRewards = (e) => {
    e.stopPropagation();
    setShowRewards(false);
  };

  // Don't render anything until CSS is loaded AND security data has been fetched
  if (!cssLoaded || !securityDataLoaded) {
    return null; // Return nothing while waiting for both CSS and security data
  }

  // Define which buttons to show based on setup type
  const shouldShowButton = (buttonName) => {
    if (isPharmacySetup) {
      // Hide these buttons for pharmacy setup
      const hiddenButtons = ['triage', 'doctor', 'nurse', 'laboratory', 'radiographer'];
      return !hiddenButtons.includes(buttonName);
    }
    return true;
  };

  // Define which dropdown items to show in home menu
  const shouldShowHomeDropdownItem = (itemName) => {
    if (isPharmacySetup) {
      // Hide these items for pharmacy setup
      const hiddenItems = ['setInvestigations', 'setProcedures'];
      return !hiddenItems.includes(itemName);
    }
    return true;
  };

  // Get pharmacy mode buttons (buttons that would normally be in home dropdown)
  const getPharmacyModeButtons = () => {
    const buttons = [];
    
    if (permissions.includes('makeorderfordrugs')) {
      buttons.push({ id: 'restockSuggestions', label: 'Restock Suggestions', onClick: handleRestockSuggestionsNavigation });
    }
    
    if (permissions.includes('set-sales-expenses-categories')) {
      buttons.push({ id: 'setCategories', label: 'Set Categories', onClick: handleSetCategoriesNavigation });
    }
    
    if (permissions.includes('access-sales-details')) {
      buttons.push({ id: 'salesHistory', label: 'Sales History', onClick: handleSalesHistoryNavigation });
    }
    
    if (permissions.includes('managedrugs')) {
      buttons.push({ id: 'drugSettings', label: 'Set / Edit Drugs', onClick: handleDrugSettingsNavigation });
    }
    
    return buttons;
  };

  // Styles for dropdown container and items
  const dropdownContainerStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    minWidth: '100%',
    width: 'auto',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    marginTop: '2px',
    padding: '0',
  };

  const dropdownItemStyle = {
    width: '100%',
    textAlign: 'left',
    padding: '10px 16px',
    boxSizing: 'border-box',
    display: 'block',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    lineHeight: '1.4',
    minHeight: '38px',
  };

  return (
    <>
      {/* Keyframe injection via a style tag */}
      <style>{`
        @keyframes starDropIn {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.3) rotate(-20deg);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.2) rotate(5deg);
          }
          80% {
            transform: translateY(-3px) scale(0.95) rotate(-3deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes starPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 2px gold);
          }
          50% {
            filter: drop-shadow(0 0 8px gold) drop-shadow(0 0 14px orange);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        /* Dropdown styles - parent button width constraint */
        .topbar-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 100%;
          width: auto;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 1000;
          margin-top: 2px;
          padding: 0;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          box-sizing: border-box;
          display: block;
          background-color: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          white-space: normal;
          word-wrap: break-word;
          line-height: 1.4;
          min-height: 38px;
        }

        .dropdown-item:hover {
          background-color: #f5f5f5;
        }

        /* Ensure parent button has consistent width */
        .topbar-button {
          white-space: nowrap;
        }
      `}</style>

      <div className="topbar">
        {isCritical && <CriticalNotification />}
        
        {/* For pharmacy mode, show home dropdown with only logout button */}
        {isPharmacySetup ? (
          <div 
            className="topbar-dropdown"
            onMouseEnter={handleMouseEnter(setIsHomeDropdownOpen)}
            onMouseLeave={handleMouseLeave(setIsHomeDropdownOpen)}
            style={dropdownContainerStyle}
          >
            <button
              className="topbar-button"
              onClick={handleHomeNavigation}
              disabled={homeLoading}
            >
              {homeLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Loading...
                </>
              ) : (
                <>
                  Home Page
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className="topbar-button-icon"
                  />
                </>
              )}
            </button>

            {isHomeDropdownOpen && (
              <div className="dropdown-menu" style={dropdownMenuStyle}>
                <button 
                  onClick={handleLogout} 
                  className="dropdown-item"
                  disabled={logoutLoading}
                  style={dropdownItemStyle}
                >
                  {logoutLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Logging out...
                    </>
                  ) : (
                    'Log Out Clinic'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="topbar-dropdown"
            onMouseEnter={handleMouseEnter(setIsHomeDropdownOpen)}
            onMouseLeave={handleMouseLeave(setIsHomeDropdownOpen)}
            style={dropdownContainerStyle}
          >
            <button
              className="topbar-button"
              onClick={handleHomeNavigation}
              disabled={homeLoading}
            >
              {homeLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Loading...
                </>
              ) : (
                <>
                  Home Page
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className="topbar-button-icon"
                  />
                </>
              )}
            </button>

            {isHomeDropdownOpen && (
              <div className="dropdown-menu" style={dropdownMenuStyle}>
                <button 
                  onClick={handleStockNavigation} 
                  className="dropdown-item"
                  disabled={stockLoading}
                  style={dropdownItemStyle}
                >
                  {stockLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    'Stock Tracking'
                  )}
                </button>
                
                <button 
                  onClick={handleAppointmentsNavigation} 
                  className="dropdown-item"
                  disabled={appointmentsLoading}
                  style={dropdownItemStyle}
                >
                  {appointmentsLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    'Appointments'
                  )}
                </button>
                
                <button 
                  onClick={handleSubscriptionNavigation} 
                  className="dropdown-item"
                  disabled={subscriptionLoading}
                  style={dropdownItemStyle}
                >
                  {subscriptionLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    'Subscriptions'
                  )}
                </button>

                {permissions.includes('makeorderfordrugs') && (
                  <button onClick={handleRestockSuggestionsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                    Restock Suggestions
                  </button>
                )}
                
                {permissions.includes('managelaboratory') && shouldShowHomeDropdownItem('setInvestigations') && (
                  <button onClick={handleSetInvestigationsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                    Set Investigations
                  </button>
                )}
                
                {permissions.includes('set-sales-expenses-categories') && (
                  <>
                    {shouldShowHomeDropdownItem('setProcedures') && (
                      <button onClick={handleSetProceduresNavigation} className="dropdown-item" style={dropdownItemStyle}>
                        Set Procedures
                      </button>
                    )}
                    <button onClick={handleSetCategoriesNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Set Categories
                    </button>
                  </>
                )}
                
                {permissions.includes('access-sales-details') && (
                  <button onClick={handleSalesHistoryNavigation} className="dropdown-item" style={dropdownItemStyle}>
                    Financial Report
                  </button>
                )}

                {permissions.includes('managedrugs') && (
                  <button onClick={handleDrugSettingsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                    Set / Edit Drugs
                  </button>
                )}

                <button 
                  onClick={handleLogout} 
                  className="dropdown-item"
                  disabled={logoutLoading}
                  style={dropdownItemStyle}
                >
                  {logoutLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Logging out...
                    </>
                  ) : (
                    'Log Out Clinic'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Render pharmacy mode buttons horizontally if in pharmacy setup */}
        {isPharmacySetup && getPharmacyModeButtons().map((button) => (
          <button
            key={button.id}
            className="topbar-button"
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}

        {Object.keys(permissionRoutes).map((key) => {
          // Skip rendering for hidden buttons in pharmacy setup
          if (isPharmacySetup) {
            if (key === 'triage' || key === 'doctor' || key === 'nurse' || key === 'lab' || key === 'radiographer') {
              return null;
            }
          }

          const isActive = key === 'billing'
            ? permissions.includes('sales') || permissions.includes('editbills')
            : (permissionMap[key] && permissions.includes(permissionMap[key]));
          
          // Get the display label
          let displayLabel = permissionLabels[key] || 'Unknown';
          
          return (
            key !== 'performance' && (
              <div 
                key={key} 
                className="topbar-dropdown"
                style={dropdownContainerStyle}
                onMouseEnter={isActive ? handleMouseEnter(() => {
                  if (key === 'radiographer') setIsRadiographerDropdownOpen(true);
                  if (key === 'cashier') setIsCashierDropdownOpen(true);
                  if (key === 'doctor') setIsDoctorDropdownOpen(true);
                  if (key === 'lab') setIsLabDropdownOpen(true);
                  if (key === 'nurse') setIsNurseDropdownOpen(true);
                  if (key === 'drug-shelves') setIsDispensaryDropdownOpen(true);
                 
                }) : undefined}
                onMouseLeave={isActive ? handleMouseLeave(() => {
                  if (key === 'radiographer') setIsRadiographerDropdownOpen(false);
                  if (key === 'cashier') setIsCashierDropdownOpen(false);
                  if (key === 'doctor') setIsDoctorDropdownOpen(false);
                  if (key === 'lab') setIsLabDropdownOpen(false);
                  if (key === 'nurse') setIsNurseDropdownOpen(false);
                  if (key === 'drug-shelves') setIsDispensaryDropdownOpen(false);
                  
                }) : undefined}
              >
                {key === 'radiographer' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleRadiographerNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'drug-shelves' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleDispensaryNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'nurse' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleNurseNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'cashier' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleCashierNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'doctor' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleDoctorNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'lab' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleLabNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'store' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleStoreNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    <FontAwesomeIcon
                      icon={isActive ? faCaretDown : faLock}
                      className={`topbar-button-icon ${!isActive ? 'red-icon' : ''}`} 
                    />
                  </button>
                ) : key === 'triage' ? (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={isActive ? handleTriageNavigation : null}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    {!isActive && (
                      <FontAwesomeIcon
                        icon={faLock}
                        className="topbar-button-icon red-icon"
                      />
                    )}
                  </button>
                ) : (
                  <button
                    className={`topbar-button ${isActive ? '' : 'inactive'}`}
                    onClick={() => isActive && handleNavigation(permissionRoutes[key])}
                    disabled={!isActive}
                  >
                    {displayLabel}
                    {!isActive && (
                      <FontAwesomeIcon
                        icon={faLock}
                        className="topbar-button-icon red-icon"
                      />
                    )}
                  </button>
                )}
                
                {key === 'radiographer' && isRadiographerDropdownOpen && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handlePendingRadiologyExamsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Pending Radiology Exams
                    </button>
                  </div>
                )}
        
                {key === 'cashier' && isCashierDropdownOpen && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handleSalesPageNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Sales Page
                    </button>
                    <button onClick={handleAwaitingPaymentsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Pending Payments
                    </button>
                    {permissions.includes('access-sales-details') && (
                      <button onClick={handleSalesHistoryNavigation} className="dropdown-item" style={dropdownItemStyle}>
                        Sales History
                      </button>
                    )}
                  </div>
                )}
        
                {key === 'doctor' && isDoctorDropdownOpen && !isPharmacySetup && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handleAttendToPatientNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Attend to Patient
                    </button>
                    <button onClick={handleViewExistingFilesNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Existing Files
                    </button>
                  </div>
                )}
        
                {key === 'lab' && isLabDropdownOpen && !isPharmacySetup && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handlePendingLabTestsNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Pending Lab Tests
                    </button>
                  </div>
                )}
                
                {key === 'nurse' && isNurseDropdownOpen && !isPharmacySetup && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handlePatientFilesNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Patient Files
                    </button>
                  </div>
                )}
                
                {key === 'drug-shelves' && isDispensaryDropdownOpen && (
                  <div className="dropdown-menu" style={dropdownMenuStyle}>
                    <button onClick={handleNonSaleStockRemovalNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Non Sale Stock Removal
                    </button>
                    <button onClick={handleSoldDrugsOverviewNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Sold Drugs Overview
                    </button>
                    <button onClick={handleNonSoldRemovedDrugsOverviewNavigation} className="dropdown-item" style={dropdownItemStyle}>
                      Non Sold Removed Drugs Overview
                    </button>
                  </div>
                )}
              </div>
            )
          );
        })}

        {dataAvailable && (
          <div className="performance-section" onClick={handlePerformanceClick}>
            <h3 style={{ fontSize: '14px' }}>{selectedEmployee}</h3>
            <div className="stars">
              {Array.from({ length: 5 }).map((_, index) => {
                const isFilled = index < message;
                return (
                  <svg
                    key={index}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className={`star-icon ${isFilled ? 'filled' : 'empty'}`}
                    style={{
                      opacity: starsVisible ? 1 : 0,
                      animation: starsVisible
                        ? `starDropIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both${isFilled ? `, starPulseGlow 2.5s ease-in-out ${index * 0.08 + 0.6}s infinite` : ''}`
                        : 'none',
                      animationDelay: starsVisible ? `${index * 0.1}s` : '0s',
                      display: 'inline-block',
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    <path
                      d="M12 2.5l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2.5z"
                      style={{
                        fill: isFilled ? 'gold' : 'none',
                        stroke: isFilled ? 'goldenrod' : '#999',
                        strokeWidth: isFilled ? '0.5' : '1',
                      }}
                    />
                  </svg>
                );
              })}
            </div>
          </div>
        )}
        
        <button 
          className="topbar-button logout" 
          onClick={handleLogout} 
          style={{ display: 'none' }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
          Logout
        </button>
        
        {displayingReminder && appointments.length > 0 && (
          <div className="reminder" key={appointments[currentAppointmentIndex].appointment_id}>
            <FontAwesomeIcon 
              icon={faTimes} 
              className="close-icon" 
              onClick={() => setDisplayingReminder(false)} 
            />
            
            <div className="navigation">
              <button 
                className="arrow-button left-arrow" 
                onClick={() => setCurrentAppointmentIndex((prevIndex) => 
                  prevIndex > 0 ? prevIndex - 1 : appointments.length - 1
                )}
                disabled={appointments.length <= 1}
              >
                ←
              </button>

              <p>
                <strong>Reminder:</strong> Please contact the client, <strong>{appointments[currentAppointmentIndex]?.first_name} {appointments[currentAppointmentIndex]?.last_name}</strong>.
                <br />
                <strong>Reason:</strong> {appointments[currentAppointmentIndex]?.appointment_reason}
                <br />
                <strong>Message:</strong> {appointments[currentAppointmentIndex]?.appointment_message}
                <br />
                <strong>Patients Contact:</strong> {appointments[currentAppointmentIndex]?.phone_number}
                <br />
                <strong>Date of Appointment:</strong> {appointments[currentAppointmentIndex]?.date_of_appointment}
              </p>

              <button 
                className="arrow-button right-arrow" 
                onClick={() => setCurrentAppointmentIndex((prevIndex) => 
                  (prevIndex + 1) % appointments.length
                )}
                disabled={appointments.length <= 1}
              >
                →
              </button>
            </div>

            <button onClick={handleReminderClick}>
              Click here if the reminder was already made
            </button>

            {totalReminders > 1 && (
              <p>{totalReminders - 1} more reminders left.</p>
            )}
          </div>
        )}
      </div>

      {/* Cash Rewards Display - Bottom Left Corner */}
      {showRewards && employeeData && employeeData.employee_balance > 0 && (
        <div 
          onClick={handleRewardClick}
          onMouseMove={handleRewardsMouseMove}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            minWidth: '200px',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
            e.currentTarget.style.backgroundColor = '#222222';
          }}
          onMouseLeave={(e) => {
            setShowCloseButton(false);
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.backgroundColor = '#000000';
          }}
        >
          {/* Close button - only visible when hovering near the top */}
          {showCloseButton && (
            <div 
              onClick={handleCloseRewards}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F0F0';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <FontAwesomeIcon 
                icon={faTimes} 
                style={{ 
                  color: '#000000', 
                  fontSize: '12px',
                  fontWeight: 'bold'
                }} 
              />
            </div>
          )}
          
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '5px',
            color: '#FFD700',
          }}>
            🎉 Cash Rewards
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#FFFFFF',
          }}>
            UGX {employeeData.employee_balance.toLocaleString()}
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.8,
            marginTop: '5px',
            textAlign: 'center',
            color: '#CCCCCC',
          }}>
            Click to view details
          </div>
        </div>
      )}
    </>
  );
}

export default Topbar;