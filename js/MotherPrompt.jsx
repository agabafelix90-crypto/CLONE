import React, { useState } from 'react';
import { urls } from './config.dev';
import './MotherPrompt.css';

const MotherPrompt = ({ onClose, employeeName, clinicName, token }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch female patients based on search query
  const fetchFemalePatients = async (query) => {
    try {
      const response = await fetch(urls.fetchfemales, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, searchQuery: query }),
      });

      if (!response.ok) throw new Error("Failed to fetch female patients");

      const data = await response.json();

      // Log the data to check its structure
      console.log("Fetched data:", data);

      // Ensure data.females exists and is an array
      if (data && Array.isArray(data)) {
        const sortedContacts = data.sort((a, b) =>
          a.first_name.localeCompare(b.first_name)
        );
        setSuggestions(sortedContacts);
      } else {
        console.warn("Expected 'females' array is missing in the response data.");
        setSuggestions([]); // Clear suggestions if data is not an array
      }
    } catch (error) {
      console.error("Error fetching female patients:", error);
      setSuggestions([]); // Clear suggestions on error
    }
  };

  // Handle search input and fetch suggestions from backend
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() !== '') {
      fetchFemalePatients(query);
    } else {
      setSuggestions([]); // Clear suggestions if input is empty
    }
  };

  // Select a patient from the suggestions
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (selectedPatient) {
      try {
        const response = await fetch(urls.AddNewMother, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact_id: selectedPatient.contact_id,
            token,
          }),
        });

        const data = await response.json();

        // Log the data to check what message is being returned
        console.log('Response Data:', data);

        // Check for specific responses and display appropriate alert
        if (data.message) {
          console.log('Alert Message:', data.message);
          if (data.message === "This client has already been inserted into the records and is ready to begin antenatal or go for a delivery. No need to insert again.") {
            alert(data.message); // Error message
          } else if (data.message === "This client is already having antenatal care here, so there is no need of inserting her as a new mother.") {
            alert(data.message);
          } else if (data.message === "This mother is already being handled in labor. She cannot be inserted again as a new mother.") {
            alert(data.message);
          } else if (data.message === "This mother has just had a delivery a few days ago. She cannot be pregnant again.") {
            alert(data.message);
          } else if (data.message === "This mother has a status of '...' Please check the status before inserting again.") {
            alert(data.message);
          } else if (data.message === "Mother record created successfully") {
            alert("New mother added successfully!"); // Success message
          }
        }

        onClose(); // Close the prompt after successful submission
      } catch (error) {
        console.error("Error adding new mother:", error);
      }
    }
  };

  return (
    <div className="mother-prompt-overlay">
      <div className="mother-prompt-content">
        <h2>Add New Mother</h2>

        {!showConfirmation ? (
          <form onSubmit={(e) => e.preventDefault()}>
            <label>
              Name:
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Start typing to search..."
                required
              />
            </label>
            {suggestions.length > 0 && (
              <div className="suggestions-listing">
                {suggestions.map((patient) => (
                  <div
                    key={patient.contact_id}
                    className="suggestion-item"
                    onClick={() => handleSelectPatient(patient)}  // Handle selection
                  >
                    <p><strong>{patient.first_name} {patient.last_name}</strong></p>
                    <p><strong>Phone:</strong> {patient.phone_number}</p>
                    <p><strong>Age:</strong> {patient.age} years old</p>
                    <p><strong>Sex:</strong> {patient.sex}</p>
                    <p><strong>Address:</strong> {patient.address || "No address provided"}</p>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={onClose} className="close-prompt-button">Close</button>
          </form>
        ) : (
          <div className="confirmation-section">
            <h3>Confirm Selection</h3>
            <p>Are you sure you want to add the following client as a mother?</p>
            <p><strong>Name:</strong> {`${selectedPatient.first_name} ${selectedPatient.last_name}`}</p>
            <p><strong>Phone:</strong> {selectedPatient.phone_number}</p>
            <p><strong>Age:</strong> {selectedPatient.age}</p>
            <p><strong>Sex:</strong> {selectedPatient.sex}</p>
            <p className="warning-text">This action is not reversible.</p>

            <button onClick={handleConfirm} className="confirm-button">Confirm</button>
            <button onClick={() => setShowConfirmation(false)} className="cancel-button">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotherPrompt;
