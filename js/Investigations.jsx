import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev'; 
import './Investigations.css';
import labSvg from './images/lab.svg'; // Import the SVG image

function Investigations() {
  const [newInvestigation, setNewInvestigation] = useState({ name: '', category: '', price: '' });
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingInvestigation, setIsAddingInvestigation] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(null);
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
      const securityResponse = await fetch(urls.security, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!securityResponse.ok) {
        throw new Error('Security check failed');
      }

      const securityData = await securityResponse.json();
      if (securityData.message === 'Session valid') {
        setEmployeeName(securityData.employee_name);
      } else if (securityData.error === 'Session expired') {
        navigate(`/dashboard?token=${securityData.clinic_session_token}`);
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Error performing security check:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchAllInvestigations();

    const interval = setInterval(fetchAllInvestigations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllInvestigations = () => {
    fetch(urls.allinvestigations, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: getTokenFromUrl() }),
    })
      .then(response => response.json())
      .then(data => {
        const sortedInvestigations = data.sort((a, b) => a.name.localeCompare(b.name));
        setAllInvestigations(sortedInvestigations);
      })
      .catch(error => {
        console.error('Error fetching investigations:', error);
      });
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewInvestigation(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddInvestigation = () => {
    setIsAddingInvestigation(true);

    if (!newInvestigation.name || !newInvestigation.category || !newInvestigation.price) {
      alert("Please fill in all fields.");
      setIsAddingInvestigation(false);
      return;
    }

    fetch(urls.inputInvestigation, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...newInvestigation, token: getTokenFromUrl() }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          throw new Error(errData.message || 'Failed to add investigation');
        });
      }
      return response.json();
    })
    .then(data => {
      alert('Investigation added successfully');
      setNewInvestigation({ name: '', category: '', price: '' });
      fetchAllInvestigations();
    })
    .catch(error => {
      alert(`Error adding investigation: ${error.message}`);
    })
    .finally(() => {
      setIsAddingInvestigation(false);
    });
  };

  const handleDeleteInvestigation = (investigationName, investigationCategory) => {
    const confirmDeletion = window.confirm(`Are you sure you want to delete ${investigationName} (${investigationCategory})?`);

    if (confirmDeletion) {
      setDeleteInProgress(investigationName);

      const payload = {
        name: investigationName,
        category: investigationCategory,
        token: getTokenFromUrl(),
      };

      fetch(urls.deleteInvestigation, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || 'Failed to delete investigation');
          });
        }
        return response.json();
      })
      .then(data => {
        alert('Investigation deleted successfully');
        fetchAllInvestigations();
      })
      .catch(error => {
        alert(`Error deleting investigation: ${error.message}`);
      })
      .finally(() => {
        setDeleteInProgress(null);
      });
    }
  };

  const filteredInvestigations = allInvestigations.filter(investigation => investigation.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  };

  return (
    <div className="investigations-container">
      <h1>Laboratory Tests and Radiology Examinations done at this facility. </h1>
      
      <div className="add-investigation-section">
        <h2>Add New Investigation</h2>
        <img src={labSvg} alt="lab Icon" className="lab-icon" />
        <div className="add-investigation-form">
          <input type="text" name="name" placeholder="Investigation Name" value={newInvestigation.name} onChange={handleInputChange} />
          <select name="category" value={newInvestigation.category} onChange={handleInputChange}>
            <option value="">Select Category</option>
            <option value="lab">Lab</option>
            <option value="radiology">Radiology</option>
          </select>
          <input type="number" name="price" placeholder="Price" value={newInvestigation.price} onChange={handleInputChange} />
          <button onClick={handleAddInvestigation} disabled={isAddingInvestigation}>
            {isAddingInvestigation ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />} Add Investigation
          </button>
        </div>
      </div>
      <div className="search-investigations">
        <input type="text" placeholder="Search investigations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
       
      </div>
      <div className="investigations-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigations.map(investigation => (
              <tr key={investigation.investigation_id}>
                <td>{investigation.name}</td>
                <td>{investigation.category}</td>
                <td>{investigation.price}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteInvestigation(investigation.name, investigation.category)} 
                    disabled={deleteInProgress === investigation.name}
                  >
                    {deleteInProgress === investigation.name ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrashAlt} />} Delete Investigation
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

export default Investigations;
