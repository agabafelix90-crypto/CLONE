import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import './FPMethods.css';

function FamilyPlanningMethods() {
  const [newMethod, setNewMethod] = useState({ name: '', price: '' });
  const [allMethods, setAllMethods] = useState([]);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(null);
  const [clinicName, setClinicName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');

    if (tokenFromUrl) {
      performSecurityCheck(tokenFromUrl);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const performSecurityCheck = async (token) => {
    try {
      const response = await fetch(urls.security, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error('Security check failed');

      const securityData = await response.json();
      handleSecurityResponse(securityData);
    } catch (error) {
      console.error('Error performing security check:', error);
      navigate('/login');
    }
  };

  const handleSecurityResponse = (data) => {
    if (data.message === 'Session valid') {
      setClinicName(data.clinic);
    } else if (data.error === 'Session expired') {
      navigate(`/dashboard?token=${data.clinic_session_token}`);
    } else {
      throw new Error('Invalid session');
    }
  };

  useEffect(() => {
    fetchAllMethods();
    
    // Set up an interval to fetch methods every 6 seconds
    const intervalId = setInterval(fetchAllMethods, 6000);

    // Clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchAllMethods = async () => {
    try {
      const response = await fetch(urls.allFamilyPlanningMethods, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: getTokenFromUrl() }),
      });

      if (!response.ok) throw new Error('Failed to fetch family planning methods');

      const data = await response.json();
      const sortedMethods = data.sort((a, b) => a.name.localeCompare(b.name));
      setAllMethods(sortedMethods);
    } catch (error) {
      console.error('Error fetching family planning methods:', error);
    }
  };

  const handleInputChange = ({ target: { name, value } }) => {
    setNewMethod((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddMethod = async () => {
    if (!newMethod.name || !newMethod.price) {
      alert("Please fill in all fields.");
      return;
    }

    setIsAddingMethod(true);

    try {
      const response = await fetch(urls.addFamilyPlanningMethod, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newMethod, token: getTokenFromUrl() }),
      });

      if (!response.ok) throw new Error('Failed to add family planning method');

      await response.json();
      alert('Family planning method added successfully');
      setNewMethod({ name: '', price: '' });
      fetchAllMethods(); // Refresh the list after adding a new method
    } catch (error) {
      alert(`Error adding family planning method: ${error.message}`);
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleDeleteMethod = async (methodName) => {
    const confirmDeletion = window.confirm(`Are you sure you want to delete ${methodName}?`);
    if (!confirmDeletion) return;

    setDeleteInProgress(methodName);

    try {
      const payload = {
        name: methodName,
        token: getTokenFromUrl(),
      };

      const response = await fetch(urls.deleteFamilyPlanningMethod, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to delete family planning method');

      await response.json();
      alert('Family planning method deleted successfully');
      fetchAllMethods();
    } catch (error) {
      alert(`Error deleting family planning method: ${error.message}`);
    } finally {
      setDeleteInProgress(null);
    }
  };

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };

  return (
    <div className="fp-methods-container">
      <h1>Family Planning Methods Used at {clinicName}</h1>

      <div className="add-method-section">
        <h2>Add New Family Planning Method</h2>
        <div className="add-method-form">
          <input
            type="text"
            name="name"
            placeholder="Method Name"
            value={newMethod.name}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={newMethod.price}
            onChange={handleInputChange}
          />
          <button onClick={handleAddMethod} disabled={isAddingMethod}>
            {isAddingMethod ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />} Add Method
          </button>
        </div>
      </div>

      <div className="methods-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {allMethods.map(method => (
              <tr key={method.method_id}>
                <td>{method.name}</td>
                <td>{method.price}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteMethod(method.name)} 
                    disabled={deleteInProgress === method.name}
                  >
                    {deleteInProgress === method.name ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrashAlt} />} Delete Method
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FamilyPlanningMethods;
