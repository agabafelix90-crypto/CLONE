import React, { useState, useEffect } from 'react';
import Topbar from './Topbar';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock, faMoneyBillWave, faHandHoldingUsd, faUserPlus, faTrashAlt,
  faChartBar, faClipboardList, faAddressBook, faShoppingCart, faCalendar,
  faBirthdayCake, faMoneyBillAlt, faStore
} from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import { getTokenFromUrlOrSession } from './authUtils';
import JSEncrypt from 'jsencrypt';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import SettingsModal from './SettingsModal';

function EmployeeSettings() {
  console.log('EmployeeSettings component rendered');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [birthdayCount, setBirthdayCount] = useState(0);
  const [showAddEmployeePrompt, setShowAddEmployeePrompt] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [showSendMessagePrompt, setShowSendMessagePrompt] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [token, setToken] = useState(null);
  const [isLoadingAddEmployee, setIsLoadingAddEmployee] = useState(false);
  const [isLoadingUpdatePermissions, setIsLoadingUpdatePermissions] = useState(false);
  const [clinicSessionToken, setClinicSessionToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  
  // Initial permissions state
  const initialPermissions = {
    Store: false,
    selldrugs: false,
    'access-laboratory': false,
    sales: false,
    'access-radiographer': false,
    'view costs spent on treating patient': false,
    'makeOrderForDrugs': false,
    clinicStatistics: false,
    'maternity-dashboard': false,
    'access-doctors-room': false,
    'access-nurse': false,
    manageDrugs: false,
    triage: false,
    familyPlanning: false,
    manageLaboratory: false,
    'access-sales-details': false,
    'delete-sale': false,
    'sendwhatsappmessages': false,
    manageServices: false,
    editBills: false,
    'set-sales-expenses-categories': false // New permission for sales and expenses categories
  };

  const [selectedPermissions, setSelectedPermissions] = useState({...initialPermissions});

  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyd2UMPL8blglJo5Bifv0
hLIP50pki7ujRkQf3NEgba2HtA4nC4yzR2qC7+/DwfgMNWnDDIIyfGC9wZ8IZHL6
3L1nsoncPE8klToykvEfWlz0QYW9pX9zD7QxRPtLY0tqQzNr7UWgMBy70GFjE60R
MNdL6XPir3ghGym0HEEqbgC7zSz1mfWoQOK3jUyDHwKR7r7QbDVrysKe8ebsK5n/
BDnKHRfp8gEqZPFs7pcgPLY2o1lgchLfphVgoaWwOsBObGR3qtPyQ7PALvSQqIwe
XdeRvElGFTiEJrpbgK3X7w79cRdOXODeuM/WzNPaUb/dS6n6hOBlaY7iILgkZdBW
UwIDAQAB
-----END PUBLIC KEY-----`;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenAndCheckSecurity = async () => {
      try {
        const tokenFromUrl = getTokenFromUrlOrSession();
        if (!tokenFromUrl) {
          navigate('/login');
          return;
        }

        console.log('Resolved Token:', tokenFromUrl);

        const securityResponse = await fetch(urls.security, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          console.log('Security response:', securityData);

          if (securityData.message === 'Session valid') {
            setEmployeeName(securityData.employee_name);
            console.log('Clinic Session Token:', securityData.clinic_session_token);
            setClinicSessionToken(securityData.clinic_session_token);

            if (securityData.clinic_session_token) {
              setToken(securityData.clinic_session_token);
              console.log('New Token set:', securityData.clinic_session_token);
              fetchBirthdayCount(securityData.clinic_session_token);
            }
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

  const fetchBirthdayCount = async (token) => {
    try {
      console.log('Fetching Birthday Count with Token:', token);
      const response = await fetch(`${urls.birthdaycount}?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setBirthdayCount(data.birthday_count);
      } else {
        throw new Error('Failed to fetch birthday count');
      }
    } catch (error) {
      console.error('Error fetching birthday count:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log('Fetching Employees with Token:', token);
      const response = await fetch(`${urls.fetchemployees2}?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Employees data received:', data);
        setEmployees(data);
        console.log('Employees state set to:', data);
      } else {
        throw new Error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with token:', token);
    if (token) {
      console.log('Token exists, calling fetchEmployees');
      fetchEmployees();
      const interval = setInterval(fetchEmployees, 60000);
      return () => clearInterval(interval);
    } else {
      console.log('No token, skipping fetchEmployees');
    }
  }, [token]);

  const handleDeleteEmployee = async (employeeName, employeeRole, index) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${employeeName} from this platform?`);

    if (!confirmDelete) {
      return;
    }

    try {
      setLoadingIndex(index);
      const requestToken = token || getTokenFromUrlOrSession();
      if (!requestToken) {
        throw new Error('Missing session token');
      }

      const response = await fetch(urls.deleteEmployee, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employeeName,
          role: employeeRole,
          token: requestToken
        })
      });

      if (response.ok) {
        setEmployees(employees.filter(emp => emp.Name !== employeeName));
        alert(`${employeeName} deleted successfully.`);
      } else {
        throw new Error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(`Error deleting ${employeeName}: ${error.message}`);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleAddEmployee = async () => {
    try {
      setIsLoadingAddEmployee(true);
      const requestToken = token || getTokenFromUrlOrSession();
      if (!requestToken) {
        throw new Error('Missing session token');
      }

      const requestBody = {
        name: newEmployeeName,
        role: newEmployeeRole,
        employeePassword: newEmployeePassword,
        token: requestToken
      };

      const response = await fetch(urls.addemployee, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setShowAddEmployeePrompt(false);
        setNewEmployeeName('');
        setNewEmployeeRole('');
        setNewEmployeePassword('');
        fetchEmployees();
        alert('Employee added successfully');
      } else {
        throw new Error(responseData.message || responseData.error || 'Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee: ' + error.message);
    } finally {
      setIsLoadingAddEmployee(false);
    }
  };

  const handleMenuButtonClick = (pageName) => {
    const requestToken = token || getTokenFromUrlOrSession();
    navigate(`/${pageName}?token=${requestToken}`);
  };

  const handleBirthdaysButtonClick = () => {
    const requestToken = token || getTokenFromUrlOrSession();
    navigate(`/birthdays?token=${requestToken}`);
  };

  const handleGrantPermissions = (employee) => {
    setSelectedEmployee(employee);
    setSelectedPermissions({...initialPermissions});
    setLoginCode('');
    setSelectAll(false);
    setShowSendMessagePrompt(true);
  };

  const handleCancelPermissions = () => {
    setShowSendMessagePrompt(false);
    setSelectedPermissions({...initialPermissions});
    setLoginCode('');
    setSelectAll(false);
  };

  const handleUpdatePermissions = async () => {
    try {
      setIsLoadingUpdatePermissions(true);

      const requestToken = token || getTokenFromUrlOrSession();
      if (!requestToken) {
        throw new Error('Missing session token');
      }


      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(publicKey);
      const encryptedSecurityCode = encrypt.encrypt(loginCode.toString());

      const response = await fetch(urls.updatepermissions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: selectedEmployee.Name,
          permissions: selectedPermissions,
          token: requestToken,
          securityCode: encryptedSecurityCode,
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        setShowSendMessagePrompt(false);
        setSelectedPermissions({...initialPermissions});
        setLoginCode('');
        setSelectAll(false);
        alert('Permissions updated successfully');
      } else {
        throw new Error(responseData.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Error updating permissions: ' + error.message);
    } finally {
      setIsLoadingUpdatePermissions(false);
    }
  };

  const handleCheckboxChange = (permission) => {
    setSelectedPermissions((prevPermissions) => ({
      ...prevPermissions,
      [permission]: !prevPermissions[permission]
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShowModal = () => {
    const requestToken = getTokenFromUrlOrSession();
    if (requestToken) {
      setToken(requestToken);
    }
    setShowModal(true);
  };

  // Fetch permissions when the prompt is opened
  useEffect(() => {
    const fetchEmployeePermissions = async () => {
      if (showSendMessagePrompt && selectedEmployee) {
        try {
          setIsLoadingPermissions(true);

          const requestToken = token || getTokenFromUrlOrSession();
          if (!requestToken) {
            throw new Error('Missing session token');
          }

          const response = await fetch(urls.fetchpermissions2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeName: selectedEmployee.Name,
              token: requestToken,
            }),
          });

          const permissionsData = await response.json();

          // Check for actual success in the response data, not just HTTP status
          if (permissionsData.success !== false && permissionsData.permissions) {
            const fetchedPermissions = permissionsData.permissions || [];

            const mappedPermissions = {
              Store: fetchedPermissions.includes('store'),
              selldrugs: fetchedPermissions.includes('selldrugs'),
              'access-laboratory': fetchedPermissions.includes('access-laboratory'),
              sales: fetchedPermissions.includes('sales'),
              'access-radiographer': fetchedPermissions.includes('access-radiographer'),
              'view costs spent on treating patient': fetchedPermissions.includes('view costs spent on treating patient'),
              'makeOrderForDrugs': fetchedPermissions.includes('makeorderfordrugs'),
              clinicStatistics: fetchedPermissions.includes('clinicstatistics'),
              'access-doctors-room': fetchedPermissions.includes('access-doctors-room'),
              'access-nurse': fetchedPermissions.includes('access-nurse'),
              manageDrugs: fetchedPermissions.includes('managedrugs'),
              'maternity-dashboard': fetchedPermissions.includes('maternity-dashboard'),
              triage: fetchedPermissions.includes('triage'),
              manageLaboratory: fetchedPermissions.includes('managelaboratory'),
              'access-sales-details': fetchedPermissions.includes('access-sales-details'),
              'delete-sale': fetchedPermissions.includes('delete-sale'),
              familyPlanning: fetchedPermissions.includes('familyplanning'),
              manageServices: fetchedPermissions.includes('manageservices'),
              editBills: fetchedPermissions.includes('editbills'),
              sendwhatsappmessages: fetchedPermissions.includes('sendwhatsappmessages'),
              'set-sales-expenses-categories': fetchedPermissions.includes('set-sales-expenses-categories'),
            };

            setSelectedPermissions((prevPermissions) => ({
              ...prevPermissions,
              ...mappedPermissions,
            }));

            // Update selectAll based on all permissions
            const allChecked = Object.values(mappedPermissions).every(value => value);
            setSelectAll(allChecked);
          } else {
            throw new Error(permissionsData.message || 'Failed to fetch employee permissions');
          }
        } catch (error) {
          console.error('Error fetching permissions:', error);
          alert('Error fetching permissions: ' + error.message);
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    fetchEmployeePermissions();
  }, [showSendMessagePrompt, selectedEmployee]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // Create a new object with all permissions set to the newSelectAll value
    const updatedPermissions = {};
    Object.keys(selectedPermissions).forEach(key => {
      updatedPermissions[key] = newSelectAll;
    });
    
    setSelectedPermissions(updatedPermissions);
  };

  const extractTokenFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    setToken(token);
  };

  // useEffect to extract the token when the component mounts
  useEffect(() => {
    extractTokenFromURL();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <Topbar token={token} />
      <div className="admin-dashboard">
        <h1 className="admin-title">EMPLOYEE SETTINGS</h1>

        <div className="admin-employee-list">
          <h2>All Employees</h2>
          <table className="admin-employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Grant Permissions</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((employee, index) => (
                <tr key={employee.EmployeeID}>
                  <td>{employee.Name}</td>
                  <td>{employee.Role}</td>
                  <td>
                    {index !== 0 && (
                      <button onClick={() => handleGrantPermissions(employee)}>
                        Grant Permissions
                      </button>
                    )}
                  </td>
                  <td>
                    {index !== 0 && (
                      <button onClick={() => handleDeleteEmployee(employee.Name, employee.Role, index)}>
                        {loadingIndex === index ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faTrashAlt} />
                        )}
                        {' '} Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="admin-add-employee" onClick={() => setShowAddEmployeePrompt(true)}>
            <FontAwesomeIcon icon={faUserPlus} /> Add New Employee
          </button>

          {showAddEmployeePrompt && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content">
                <div className="admin-transaction-prompt">
                  <h2>Add New Employee</h2>
                  <input
                    type="text"
                    placeholder="Employee Name"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Employee Role"
                    value={newEmployeeRole}
                    onChange={(e) => setNewEmployeeRole(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Employee Password"
                    value={newEmployeePassword}
                    onChange={(e) => setNewEmployeePassword(e.target.value)}
                  />
                  <div className="admin-button-group">
                    <button onClick={() => {
                      setShowAddEmployeePrompt(false);
                      setNewEmployeeName('');
                      setNewEmployeeRole('');
                      setNewEmployeePassword('');
                    }}>Cancel</button>
                    <button className="action-button" onClick={handleAddEmployee} disabled={isLoadingAddEmployee}>
                      {isLoadingAddEmployee ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add This Employee'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSendMessagePrompt && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h2>Set Permissions for {selectedEmployee?.Name}</h2>
            {isLoadingPermissions ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <div className="admin-permissions-checkboxes">
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    Select/Deselect All
                  </label>
                </div>

                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.Store}
                      onChange={() => handleCheckboxChange('Store')}
                    />
                    Permit access to store
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.selldrugs}
                      onChange={() => handleCheckboxChange('selldrugs')}
                    />
                    Permit access dispensary or drug shelves
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['delete-sale']}
                      onChange={() => handleCheckboxChange('delete-sale')}
                    />
                    Allow delete a sale from the sales page records
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['access-laboratory']}
                      onChange={() => handleCheckboxChange('access-laboratory')}
                    />
                    Permit access laboratory section
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.sales}
                      onChange={() => handleCheckboxChange('sales')}
                    />
                    Allow access cashier dashboard
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['access-radiographer']}
                      onChange={() => handleCheckboxChange('access-radiographer')}
                    />
                    Permit access radiology section
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['view costs spent on treating patient']}
                      onChange={() => handleCheckboxChange('view costs spent on treating patient')}
                    />
                    Allow view costs spent on treating patient
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['makeOrderForDrugs']}
                      onChange={() => handleCheckboxChange('makeOrderForDrugs')}
                    />
                    Permit make order for drugs
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.clinicStatistics}
                      onChange={() => handleCheckboxChange('clinicStatistics')}
                    />
                    Permit access to clinic statistics
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['access-doctors-room']}
                      onChange={() => handleCheckboxChange('access-doctors-room')}
                    />
                    Permit access to Doctors section
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['access-nurse']}
                      onChange={() => handleCheckboxChange('access-nurse')}
                    />
                    Permit access to nurses section
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.manageDrugs}
                      onChange={() => handleCheckboxChange('manageDrugs')}
                    />
                    Permit manage drugs (add, delete, modify stock)
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.triage}
                      onChange={() => handleCheckboxChange('triage')}
                    />
                    Access the triage department
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['maternity-dashboard']}
                      onChange={() => handleCheckboxChange('maternity-dashboard')}
                    />
                    Access Maternity Dashboard
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.sendwhatsappmessages}
                      onChange={() => handleCheckboxChange('sendwhatsappmessages')}
                    />
                    Send SMS 
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.familyPlanning}
                      onChange={() => handleCheckboxChange('familyPlanning')}
                    />
                    Manage Family Planning settings
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.manageLaboratory}
                      onChange={() => handleCheckboxChange('manageLaboratory')}
                    />
                    Permit manage laboratory and radiology investigations
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['access-sales-details']}
                      onChange={() => handleCheckboxChange('access-sales-details')}
                    />
                    Permit access to Sales History Details
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.manageServices}
                      onChange={() => handleCheckboxChange('manageServices')}
                    />
                    Manage Services (add, edit, delete services)
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.editBills}
                      onChange={() => handleCheckboxChange('editBills')}
                    />
                    Edit Patient Bills
                  </label>
                </div>
                <div>
                  <label className="permission-label">
                    <input
                      type="checkbox"
                      checked={selectedPermissions['set-sales-expenses-categories']}
                      onChange={() => handleCheckboxChange('set-sales-expenses-categories')}
                    />
                    Set Sales and Expenses Categories
                  </label>
                </div>
              </div>
            )}
            <div className="admin-login-code-input">
              <label>
                Set Individual Password for {selectedEmployee?.Name}:
                <input
                  type="text"
                  value={loginCode}
                  placeholder={`Only numbers! If you don't want to change the password, leave it empty.`}
                  onChange={(e) => setLoginCode(e.target.value)}
                  style={{ fontSize: 'smaller' }}
                />
              </label>
            </div>
            <div className="admin-button-group">
              <button onClick={handleCancelPermissions}>Cancel</button>
              <button className="action-button" onClick={handleUpdatePermissions} disabled={isLoadingUpdatePermissions}>
                {isLoadingUpdatePermissions ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Update Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        This system was created by MEDCORE Systems. All rights reserved.
      </footer>
    </div>
  );
};

export default EmployeeSettings;
