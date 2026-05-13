import React, { useState, useEffect, useRef } from 'react';
import { urls } from './config.dev';
import { ToastContainer, toast } from 'react-toastify'; // Import toast functions
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import './TreatmentChatModal.css';

const cellStyle = {
    padding: '10px',
    border: '1px solid #ddd'
};

const drugNameCellStyle = {
    ...cellStyle,
    width: '40%' 
};

const drugQuantityCellStyle = {
    ...cellStyle,
    width: '10%' 
};

const nextDoseTimeCellStyle = {
    ...cellStyle,
    width: '25%' 
};


function TreatmentChatModal({
    onClose,
    maternityId,
    firstName,
    lastName,
    age,
    clinicName,
    token,
    employeeName,
  }) {
    const [treatmentPlanRows, setTreatmentPlanRows] = useState([{ drug: '', packaging: '', quantity: '', nextDoseDate: '', nextDoseTime: '' }]);
    const [drugSuggestions, setDrugSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [nextDose, setNextDose] = useState(''); // Changed to handle "File Closed"
    const [treatmentSentence, setTreatmentSentence] = useState('');
    const [nextDoseDate, setNextDoseDate] = useState(''); // Added state for next dose date
    const [nextDoseTime, setNextDoseTime] = useState(''); // Added state for next dose time
    const suggestionsRef = useRef(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDrugIndex, setSelectedDrugIndex] = useState(null);
    const quantityRefs = useRef([]); 
    const [isScrolling, setIsScrolling] = useState(false);

const handleWheel = (e) => {
    setIsScrolling(true);
    e.preventDefault();
};

const handleWheelEnd = () => {
    setIsScrolling(false);
};
// Log the received data using useEffect
useEffect(() => {
  console.log("Received props:", {
    onClose,
    maternityId,
    firstName,
    lastName,
    age,
    clinicName,
    token,
    employeeName,
  });
}, [onClose, maternityId, firstName, lastName, age, clinicName, token, employeeName]);

useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('wheel', handleWheelEnd, { passive: false });

    return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('wheel', handleWheelEnd);
    };
}, []);
    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        console.log('Token received:', token);
    }, [token]);

    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const response = await fetch(urls.fetchdispensary2, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token })
                });

                if (!response.ok) throw new Error('Error fetching drugs');

                const data = await response.json();
                setDrugSuggestions(data);
            } catch (error) {
                console.error('Error fetching drugs:', error);
            }
        };
        fetchDrugs();
    }, [token]);

    useEffect(() => {
        const updatedSentence = constructTreatmentSentence();
        setTreatmentSentence(updatedSentence);
    }, [treatmentPlanRows, nextDose]);

    const handleDrugInputChange = (index, event) => {
        const value = event.target.value;
        
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].drug = value;
        setTreatmentPlanRows(updatedRows);
    
        if (!value) {
            setFilteredSuggestions([]);
            setActiveSuggestionIndex(null);
            return;
        }
    
        const filtered = drugSuggestions.filter(drug =>
            drug.Drug.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setActiveSuggestionIndex(index);
    };
    
    useEffect(() => {
        const updatedSentence = constructTreatmentSentence();
        setTreatmentSentence(updatedSentence);
    }, [treatmentPlanRows, nextDose, nextDoseDate, nextDoseTime]); // Added nextDoseDate and nextDoseTime as dependencies
    
    const handleSuggestionClick = (index, suggestion) => {
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].drug = suggestion.Drug;
        updatedRows[index].packaging = suggestion.Packaging;
        updatedRows[index].quantity = '';
        setTreatmentPlanRows(updatedRows);
        setFilteredSuggestions([]);
        setActiveSuggestionIndex(null);
        setSelectedDrugIndex(index);

        // Focus on the quantity input of the selected row
        if (quantityRefs.current[index]) {
            quantityRefs.current[index].focus();
        }
    };
    

    const handleDrugQuantityChange = (index, e) => {
        const { value, key } = e.target;
        const newQuantity = parseInt(value, 10) || 0;
    
        // Update the quantity in the state
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].quantity = newQuantity;
        setTreatmentPlanRows(updatedRows);
    
        // If Enter key is pressed
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default Enter key behavior (form submit)
    
            // Create a new row
            addNewRow();
            
            // Focus on the "Drug Name" input in the new row
            const nextIndex = index + 1;
            if (quantityRefs.current[nextIndex]) {
                const nextInput = quantityRefs.current[nextIndex].previousElementSibling; // Get the previous sibling (Drug Name input)
                if (nextInput) {
                    nextInput.focus(); // Focus on the Drug Name input
                }
            }
        }
    };
    
    const addNewRow = () => {
        const lastRow = treatmentPlanRows[treatmentPlanRows.length - 1];
        
        // Check if the current row's required fields are filled
        if (!lastRow.drug || !lastRow.quantity) {
            toast.error('Please fill out the drug and quantity fields before adding a new row.');
            return; // Prevent adding a new row if fields are incomplete
        }
        
        // Add a new row
        const newRow = { drug: '', packaging: '', quantity: '', nextDoseDate: '', nextDoseTime: '' };
        setTreatmentPlanRows([...treatmentPlanRows, newRow]);
    
        // Focus on the "Drug Name" input in the newly created row
        // Ensure that the new row index is correct
        const nextRowIndex = treatmentPlanRows.length;
        setTimeout(() => {
            const newDrugInput = document.querySelector(`.treatment-chat-table tr:nth-child(${nextRowIndex + 2}) .drug-chat-input`);
            if (newDrugInput) {
                newDrugInput.focus();
            }
        }, 0); // Use setTimeout to ensure the new row is rendered before trying to focus
    };
    

    const removeRow = (index) => {
        if (treatmentPlanRows.length > 1) {
            const updatedRows = treatmentPlanRows.filter((_, i) => i !== index);
            setTreatmentPlanRows(updatedRows);
        }
    };
    const handleTreatmentPlanSubmit = async () => {
      let errorMessage = '';
  
      // Show initial toast message to inform user
      toast.info(`Hello ${employeeName}, please wait, we are submitting your chat.`);
  
      // Wait for 2 seconds before proceeding with the rest of the function
      await new Promise(resolve => setTimeout(resolve, 2000));
  
      // Check if all table cells are filled
      const incompleteRows = treatmentPlanRows.filter(row =>
          !row.drug || !row.quantity
      );
  
      if (incompleteRows.length > 0) {
          errorMessage = 'Some rows are incomplete. Please fill out all drug and quantity fields.';
      }
  
      if (errorMessage) {
          toast.error(errorMessage, { autoClose: 60000 }); // Toast duration set to 60 seconds
          return;
      }
  
      setSubmitting(true);
  
      // Include the token in the payload
      const payload = {
          maternityId,
          treatment_plan: treatmentSentence,
          table_data: treatmentPlanRows,
          employee_name: employeeName,
          token // Add token here
      };
  
      try {
          const response = await fetch(urls.submitchatMother, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
    
            const data = await response.json(); // Parse JSON body
    
            if (!response.ok) {
                // If response is not ok, throw the error message from the response
                const backendErrorMessage = data.error || 'Something went wrong.';
                // Handle detailed error message if provided
                const details = data.details
                    ? data.details.map(detail =>
                          `Drug: ${detail.drug}, Packaging: ${detail.packaging}, Requested: ${detail.requested}, Available: ${detail.available}, Shortfall: ${detail.shortfall}`
                      ).join('\n')
                    : '';
    
                throw new Error(`${backendErrorMessage}`);
            }
    
            if (data.success) {
                // Wait for 2 seconds before showing success toast
                setTimeout(() => {
                    toast.success('Success! Treatment plan submitted.');
                    // Delay closing the modal by 5 seconds
                    setTimeout(() => {
                        onClose();
                    }, 5000);
                }, 2000);
    
                // Send the same payload to `urls.assignAverage2`
                try {
                    const assignResponse = await fetch(urls.assignAverage2, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
    
                    const assignData = await assignResponse.json();
    
                    if (!assignResponse.ok) {
                        const assignErrorMessage = assignData.error || 'Failed to assign average.';
                        throw new Error(assignErrorMessage);
                    }
    
                    if (assignData.success) {
                        toast.success('Average successfully assigned!');
                    }
                } catch (assignError) {
                    console.error('Error assigning average:', assignError);
                    toast.error(`Error assigning average: ${assignError.message}`, { autoClose: 60000 });
                }
            }
        } catch (error) {
            console.error('Error submitting treatment plan:', error);
            // Wait for 2 seconds before showing the actual error from the backend
            setTimeout(() => {
                toast.error(`Error: ${error.message}`, { autoClose: 60000 }); // Toast duration set to 60 seconds
            }, 2000);
        } finally {
            setSubmitting(false);
        }
    };
  
    
    const constructTreatmentSentence = () => {
      const drugsList = treatmentPlanRows.map(row =>
          `${row.quantity} ${row.packaging} of ${row.drug}`
      ).join(', ');
  
      const currentDate = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = currentDate.toLocaleDateString('en-US', options);
      const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
      return `Date: ${formattedDate} ${formattedTime}\n${employeeName} administered ${drugsList}.`;
  };
  

    const modalOverlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark background
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      };
    
      const modalStyle = {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "10px",
        width: "90%",
        maxWidth: "900px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: 1100,
        overflow: "auto",
        maxHeight: "90vh",
      };
    
      const headerStyle = {
        marginBottom: "20px",
        textAlign: "center",
        color: "#333",
      };
    
      const tableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "20px",
      };
    
      const thTdStyle = {
        border: "1px solid #ccc",
        padding: "10px",
        textAlign: "left",
      };
    
      const buttonStyle = {
        padding: "10px 20px",
        margin: "5px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
      };
    
      const addRowButtonStyle = { ...buttonStyle, backgroundColor: "#4CAF50", color: "white" };
      const removeRowButtonStyle = { ...buttonStyle, backgroundColor: "#f44336", color: "white" };
    
      return (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <ToastContainer />
            <h3 style={headerStyle}>Treatment Chat</h3>
            <p style={{ fontSize: "small", color: "red", marginBottom: "13px" }}>
              Please chat everything you have given to this patient, however small, be it a syringe or cannula, to enable the system to make more accurate calculations.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Drug Name</th>
                  <th style={thTdStyle}>Packaging</th>
                  <th style={thTdStyle}>Quantity</th>
                  <th style={thTdStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {treatmentPlanRows.map((row, index) => {
                  const isDrugSelected = index === selectedDrugIndex;
                  const quantityInputStyle = {
                    pointerEvents: isDrugSelected ? "auto" : "none",
                    opacity: isDrugSelected ? 1 : 0.8,
                  };
    
                  return (
                    <tr key={index}>
                      <td style={thTdStyle}>
                        <input
                          type="text"
                          value={row.drug}
                          onChange={(e) => handleDrugInputChange(index, e)}
                          onFocus={() => setShowSuggestions(true)}
                          style={{ width: "100%" }}
                        />
                        {index === activeSuggestionIndex && filteredSuggestions.length > 0 && showSuggestions && (
                          <div
                            ref={suggestionsRef}
                            style={{
                              position: "absolute",
                              backgroundColor: "#fff",
                              border: "1px solid #ccc",
                              zIndex: 1200,
                            }}
                          >
                            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                              {filteredSuggestions.map((suggestion, i) => (
                                <li
                                  key={i}
                                  onClick={() => handleSuggestionClick(index, suggestion)}
                                  style={{
                                    padding: "5px 10px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #ccc",
                                  }}
                                >
                                  {suggestion.Drug} - {suggestion.Packaging} (Available: {suggestion.Quantity})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td style={thTdStyle}>{row.packaging}</td>
                      <td style={thTdStyle}>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleDrugQuantityChange(index, e)}
                          style={{ ...quantityInputStyle, width: "100%" }}
                          ref={(el) => (quantityRefs.current[index] = el)}
                        />
                      </td>
                      <td style={thTdStyle}>
                        <button
                          type="button"
                          onClick={addNewRow}
                          disabled={treatmentPlanRows.length >= 10}
                          style={addRowButtonStyle}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          style={removeRowButtonStyle}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
    
            <div>
              <h4>Preview</h4>
              <pre>{treatmentSentence}</pre>
            </div>
    
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                type="button"
                onClick={handleTreatmentPlanSubmit}
                disabled={submitting}
                style={{
                  ...buttonStyle,
                  backgroundColor: submitting ? "#ccc" : "#007BFF",
                  color: "white",
                }}
              >
                {submitting ? "Submitting..." : "Submit Chat"}
              </button>
              <button type="button" onClick={onClose} style={removeRowButtonStyle}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    export default TreatmentChatModal;