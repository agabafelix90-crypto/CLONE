import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev';
import './TreatmentPlanModal.css';
import MedicalBillModal from './MedicalBillModal';

const cellStyle = {
    padding: '10px',
    border: '1px solid #ddd'
};

function TreatmentPlanModal({ onClose, maternityId, employeeName, token }) {
    const [treatmentPlanRows, setTreatmentPlanRows] = useState(
        [createEmptyRow()].map(row => ({ ...row, showButton: false }))
    );
    
    const [drugSuggestions, setDrugSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showMedicalBillModal, setShowMedicalBillModal] = useState(false);
    const [billData, setBillData] = useState([]);
    const [loading, setLoading] = useState(true); // Add loading state
    const [changesMade, setChangesMade] = useState(false); // Track if changes have been made
    const [infoBlocks, setInfoBlocks] = useState(Array(treatmentPlanRows.length).fill(false));
    const [infoTexts, setInfoTexts] = useState(Array(treatmentPlanRows.length).fill(''));

   
useEffect(() => {
        fetchExistingTreatmentRows();
    }, []);

    // Log the token whenever it changes
    useEffect(() => {
        console.log('Token received:', token);
    }, [token]);

    const fetchExistingTreatmentRows = () => {
        setLoading(true);
        const payload = {maternityId: maternityId};

        fetch(urls.fetchtreatmentrowsmother, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch existing treatment rows'))
            .then(data => {
                if (data && data.length > 0) {
                    const existingRows = data.map(row => ({
                        route: row.route,
                        drug: row.drug_name,
                        dosage: row.dosage,
                        frequency: row.frequency,
                        duration: row.duration,
                        durationUnit: row.duration_unit,
                        quantity: row.quantity,
                        packaging: row.packaging,
                        additionalInfo: row.additional_info // retain original value
                    }));

                    // Initialize infoTexts and infoBlocks
                    const initializedInfoTexts = existingRows.map(row =>
                        row.additionalInfo === 'N/A' ? '' : row.additionalInfo || ''
                    );

                    const initializedInfoBlocks = existingRows.map(row =>
                        row.additionalInfo !== 'N/A' && row.additionalInfo ? true : false
                    );

                    setInfoTexts(initializedInfoTexts);
                    setInfoBlocks(initializedInfoBlocks);
                    setTreatmentPlanRows([...existingRows, createEmptyRow()]);
                } else {
                    setTreatmentPlanRows([createEmptyRow()]);
                    setInfoTexts([]);
                    setInfoBlocks([]);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching existing treatment rows:', error);
                setLoading(false);
            });
    };

    
    useEffect(() => {
        const payload = { token: token };

        fetch(urls.fetchoriginaldrugs, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => setDrugSuggestions(data))
        .catch(error => console.error('Error fetching drug suggestions:', error));
    }, [token]);

    function createEmptyRow() {
        return {
            drug: '',
            packaging: '',
            route: '',
            dosage: '',
            frequency: '',
            duration: '',
            durationUnit: '',
            quantity: ''
        };
    }

    const handleDrugInputChange = (index, event) => {
        const value = event.target.value;
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].drug = value;
    
        // Auto-fill packaging based on selected drug
        const matchingDrug = drugSuggestions.find(drug => drug.drug_name.toLowerCase() === value.toLowerCase());
        if (matchingDrug) {
            updatedRows[index].packaging = matchingDrug.packaging;
        } else {
            updatedRows[index].packaging = ''; // Clear packaging if no match
        }
    
        setTreatmentPlanRows(updatedRows);
        setChangesMade(true); // Track changes
    
        if (value) {
            const filtered = drugSuggestions.filter(drug =>
                drug.drug_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSuggestions(filtered);
            setActiveSuggestionIndex(index);
        } else {
            setFilteredSuggestions([]);
            setActiveSuggestionIndex(null);
        }
    };
    

    const handleDrugQuantityChange = (index, event) => {
        const inputValue = event.target.value;
        const columnName = event.target.name;
    
        if (columnName === 'quantity' && !/^\d*$/.test(inputValue)) {
            return;
        }
    
        const newTreatmentPlanRows = [...treatmentPlanRows];
        newTreatmentPlanRows[index][columnName] = inputValue;
        setTreatmentPlanRows(newTreatmentPlanRows);
        setChangesMade(true); // Changes made flag
    };
    
    const handleButtonVisibility = (index, isVisible) => {
        const updatedRows = [...treatmentPlanRows];
        updatedRows[index].showButton = isVisible;
        setTreatmentPlanRows(updatedRows);
    
        // If making it visible, set a timeout to hide it after 5 seconds
        if (isVisible) {
            setTimeout(() => {
                // Check if the button is still visible before hiding it
                const currentRows = [...treatmentPlanRows];
                if (currentRows[index].showButton) {
                    currentRows[index].showButton = false;
                    setTreatmentPlanRows(currentRows);
                }
            }, 5000); // 5 seconds
        }
    };
    
    
    const renderDrugSuggestions = (index) => {
        return (
            <datalist id={`suggestions-list-${index}`}>
                {filteredSuggestions.map((suggestion, i) => (
                    <option 
                        key={i} 
                        value={suggestion.drug_name} 
                    >
                        {suggestion.drug_name}
                    </option>
                ))}
            </datalist>
        );
    };
    

    const handleSuggestionClick = (index, suggestion) => {
        const updatedRows = [...treatmentPlanRows];
        
        // Set drug name to the input field
        updatedRows[index].drug = suggestion.drug_name;
        
        // Set packaging to the quantity column
        updatedRows[index].quantity = suggestion.packaging; // Set packaging from suggestion to quantity
    
        setTreatmentPlanRows(updatedRows);
        setFilteredSuggestions([]); // Clear suggestions
        setActiveSuggestionIndex(null); // Reset active suggestion index
        setChangesMade(true); // Track changes
    };
    

    const handleTreatmentPlanChange = (index, field, value) => {
        const newRows = [...treatmentPlanRows];
        newRows[index][field] = value;
        setTreatmentPlanRows(newRows);
        setChangesMade(true); // Changes made flag
    };

    const addNewRow = async (index) => {
        // Validate existing rows
        if (!validateRows(treatmentPlanRows)) {
            toast.error('Failed, some parts of the prescription are missing. Ensure that all rows and columns of the prescription table have been filled.');
            return;
        }
        
    
        const newRows = [...treatmentPlanRows];
        newRows.splice(index + 1, 0, createEmptyRow()); // Insert new empty row
        setTreatmentPlanRows(newRows); // Update state with new rows
        setChangesMade(true); // Mark as changed
    
        // Prepare payload for backend
        const treatmentRowPayload = newRows.map(row => ({
            maternityId: maternityId,
            route: row.route,
            drug: row.drug,
            dosage: row.dosage,
            frequency: row.frequency,
            duration: row.duration,
            durationUnit: row.durationUnit,
            quantity: row.quantity,
            packaging: row.packaging
        }));
    
        try {
            const response = await fetch(urls.treatmentrowmother, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });
    
            if (!response.ok) {
                throw new Error('Failed to add new treatment rows');
            }
    
            console.log('New treatment rows added successfully');
        } catch (error) {
            console.error('Error updating treatment rows after deletion:', error);
            toast.error('The changes are not updating. Please check your network connectivity.');
        }
    
        // Scroll to new row
        setTimeout(() => {
            const rowElement = document.getElementById(`row-${index + 1}`);
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };
    

    const handleDeleteRow = async (index) => {
        // Check if there is only one row, and if so, prevent deletion
        if (treatmentPlanRows.length === 1) {
            toast.error('Cannot delete the First row. There must be at least one row.');
            return;
        }
    
        // Remove the row from the state
        const updatedRows = treatmentPlanRows.filter((_, rowIndex) => rowIndex !== index);
        setTreatmentPlanRows(updatedRows);
    
        // Prepare the payload with the remaining rows
        const treatmentRowPayload = updatedRows.map(row => ({
            maternityId: maternityId,
            route: row.route,
            drug: row.drug,
            dosage: row.dosage,
            frequency: row.frequency,
            duration: row.duration,
            durationUnit: row.durationUnit,
            quantity: row.quantity,
            packaging: row.packaging
        }));
    
        console.log("Payload to be submitted to treatmentRow after deletion:", treatmentRowPayload);
    
        try {
            // Send the updated payload to the backend
            const response = await fetch(urls.treatmentrowmother, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update treatment rows after deletion');
            }
    
            console.log('Treatment rows updated successfully after deletion');
        } catch (error) {
            console.error('Error updating treatment rows after deletion:', error);
            toast.error('The changes are not updating. Please check your network connectivity.');
        }
    };
    
    
    const validateRows = () => {
        let allRowsEmpty = true;

        for (const row of treatmentPlanRows) {
            const isRowFilled = row.route && row.drug && row.dosage && row.frequency && row.duration && row.durationUnit && row.quantity;

            if (isRowFilled) {
                allRowsEmpty = false;
            } else if (
                row.route ||
                row.drug ||
                row.dosage ||
                row.frequency ||
                row.duration ||
                row.durationUnit ||
                row.quantity
            ) {
                return false; // Some fields are filled, but not all
            }
        }

        return !allRowsEmpty; // Returns false if all rows are empty
    };


    const handleTreatmentPlanSubmit = async () => {
        // Directly use the token passed as a prop from the parent component
        if (!token) {
            alert('Token is missing. Please log in again.');
            return;
        }
    
        if (!validateRows()) {
            alert('Failed, some parts of the prescription are missing. Ensure that all rows and columns of the prescription table have been filled.');
            return;
        }
    
        setSubmitting(true);
    
      
    const employeeSentence = `By Doctor (${employeeName})`;
    const updatedTreatmentPlan = treatmentPlanRows.map((row, index) => {
        const infoText = infoTexts[index] ? `\n   ${infoTexts[index]}` : ''; // Move infoText to a new line
        return `• ${row.route} ${row.drug} ${row.dosage} ${row.frequency} ${row.duration} ${row.durationUnit} ----(${row.quantity} ${row.packaging})${infoText}`;
    }).join('\n');

    // Combine updated treatment plan with the employee sentence
    const updatedTreatmentPlanWithEmployee = `${updatedTreatmentPlan}\n${employeeSentence}`;

        const submitChangesPayload = {
            maternityId: maternityId,
            treatment_plan: updatedTreatmentPlanWithEmployee,
            token: token // Use the token prop here
        };
    
        try {
            // Submit changes payload
            const submitResponse = await fetch(urls.submitchangesmother, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitChangesPayload),
            });
    
            if (!submitResponse.ok) {
                alert('Failed to submit treatment plan changes');
                throw new Error('Failed to submit treatment plan changes');
            }
    
            alert('Changes submitted successfully!');
    
           // Prepare treatment row payload including additional info
    const treatmentRowPayload = treatmentPlanRows.map((row, index) => ({
        maternityId: maternityId,
        route: row.route,
        drug: row.drug,
        dosage: row.dosage,
        frequency: row.frequency,
        duration: row.duration,
        durationUnit: row.durationUnit,
        quantity: row.quantity,
        packaging: row.packaging,
        token: token, // Use the token prop here too
        additionalInfo: infoTexts[index] || null // Add additional info or null if not present
    }));
            console.log("Payload to be submitted to treatmentRow:", treatmentRowPayload);
    
            // Submit treatment rows payload
            const treatmentRowResponse = await fetch(urls.treatmentrowmother, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treatmentRowPayload),
            });
    
            if (!treatmentRowResponse.ok) {
                throw new Error('Failed to add new treatment rows');
            }
    
            console.log('New treatment rows added successfully');
    
            // Reset changesMade to false after successful responses
            setChangesMade(false);
    
        } catch (error) {
            console.error('Error during submission:', error);
            alert('Oops! Something went wrong. Please try checking your network connectivity.');
    
        } finally {
            setSubmitting(false);
       
        }
    };
    
    
 const handleSeeBillClick = () => {
        const nonEmptyRows = treatmentPlanRows.filter(row => row.drug && row.quantity); // Filter out empty rows
        const billData = nonEmptyRows.map(row => ({
            drug: row.drug,
            packaging: row.packaging,
            route: row.route,
            quantity: row.quantity
        }));
        setBillData(billData);
        setShowMedicalBillModal(true);
    };
    const handleCloseModal = () => {
        if (changesMade) {
            const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close without updating? If you proceed, your changes will not be saved.");
            if (confirmClose) {
                onClose();
            } else {
               
                
            }
            
        } else {
            onClose();
        }
    };
    const toggleInfoBlock = (index) => {
        const updatedInfoBlocks = [...infoBlocks];
        updatedInfoBlocks[index] = !updatedInfoBlocks[index];
        setInfoBlocks(updatedInfoBlocks);
    };

    const handleInfoTextChange = (index, value) => {
        const updatedInfoTexts = [...infoTexts];
        updatedInfoTexts[index] = value;
        setInfoTexts(updatedInfoTexts);
    };

    const constructTreatmentSentence = (row, additional) => {
        const treatmentSentence = `• ${row.route} ${row.drug} ${row.dosage} ${row.frequency} ${row.duration} ${row.durationUnit} ----(${row.quantity} ${row.packaging})`;
        
        // Add the additional text on a new line, preserving new lines in the text
        return additional ? `${treatmentSentence}\n   ${additional}` : treatmentSentence;
    };
    
    // When displaying the sentence, you can use this to ensure new lines are shown as breaks:
    const displayTreatmentSentence = sentence => {
      return sentence.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ));
    };
    
    
    useEffect(() => {
        fetchExistingTreatmentRows();
    }, [maternityId]);
   
    const handleCountForMe = async (index) => {
        const row = treatmentPlanRows[index];
    
        try {
            const response = await fetch(urls.countforme, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(row), // Send all row data
            });
    
            // Check if response is okay
            if (!response.ok) {
                console.error('Response not OK:', response.status);
                throw new Error('Failed to fetch count');
            }
    
            const data = await response.json();
    
            console.log('Response data:', data); // Debugging log
    
            // Ensure the data contains a quantity and update the row with the returned quantity
            if (data && Array.isArray(data) && data.length > 0 && typeof data[0].quantity === 'number') {
                const updatedRows = [...treatmentPlanRows];
                updatedRows[index].quantity = data[0].quantity; // Assuming the first object in the array contains the quantity
                setTreatmentPlanRows(updatedRows);
            } else {
                console.error('Invalid response format:', data);
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error:', error); // More detailed logging for errors
            alert('Failed to count. Please try again.');
        }
    };
  // Modal overlay style
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it sits above other content
  };

  // Modal content style
  const contentStyle = {
    backgroundColor: 'white',
    width: '95%', // Adjust the width of the modal as needed
    maxHeight: '90vh', // Max height of the modal (90% of the viewport)
    padding: '20px',
    overflowY: 'auto', // Enable scrolling if content exceeds the height
    borderRadius: '10px',
    position: 'relative',
  };
    return (
        <div style={overlayStyle}>
      <div style={contentStyle}>
        <div className="treatment-plan-container">
            <ToastContainer />
            <h3>Prescribe the drugs you want to give to the mother</h3>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div>
    {treatmentPlanRows.map((row, index) => (
        <p key={index} style={{ whiteSpace: 'pre-wrap', margin: '0', padding: '0' }}>
            {constructTreatmentSentence(row, infoTexts[index])}
        </p>
    ))}
</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Drug</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Drug Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treatmentPlanRows.map((row, index) => (
                                    <React.Fragment key={index}>
                                        <tr id={`row-${index}`}>
                                            <td style={cellStyle}>
                                                <select
                                                    value={row.route}
                                                    onChange={e => handleTreatmentPlanChange(index, 'route', e.target.value)}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="IV">IV</option>
                                                    <option value="IM">IM</option>
                                                    <option value="Tablets">Tablets</option>
                                                    <option value="Syrup">Syrup</option>
                                                    <option value="Capsules">Capsules</option>
                                                    <option value="Topical">Topical</option>
                                                    <option value="Rectal">Rectal</option>
                                                    <option value="Vaginal">Vaginal</option>
                                                    <option value="Sublingual">Sublingual</option>
                                                    <option value="Eyes">Eyes</option>
                                                    <option value="Inhalation">Inhalation</option>
                                                    <option value="Sub-Cuteneous">Sub-Cuteneous</option>
                                                    <option value="Intra-Dermal">Intra-Dermal</option>
                                                    <option value="ear">ear</option>
                                                    <option value="oral">oral</option>
                                                </select>
                                            </td>
                                            <td style={cellStyle}>
                                                <div className="drug-input-container">
                                                    <input
                                                        type="text"
                                                        value={row.drug}
                                                        onChange={e => handleDrugInputChange(index, e)}
                                                        onFocus={() => setFilteredSuggestions([])}
                                                        onClick={() => setActiveSuggestionIndex(index)}
                                                        list={`suggestions-list-${index}`}
                                                    />
                                                    {renderDrugSuggestions(index)}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <input
                                                    type="text"
                                                    value={row.dosage}
                                                    onChange={e => handleTreatmentPlanChange(index, 'dosage', e.target.value)}
                                                />
                                            </td>
                                            <td style={cellStyle}>
                                                <select
                                                    value={row.frequency}
                                                    onChange={e => handleTreatmentPlanChange(index, 'frequency', e.target.value)}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="once a day for">Once a day for</option>
                                                    <option value="once noct for">Once Noct for</option>
                                                    <option value="twice daily for">Twice Daily for</option>
                                                    <option value="stat for">Stat for</option>
                                                    <option value="tds for">tds for</option>
                                                    <option value="OD">OD for</option>
                                                    <option value="BID (bis in die) for">BID </option>
                                                    <option value="noct for">noct for</option>
                                                    <option value="12 hourly for">12 Hourly for</option>
                                                    <option value="24 hourly for">24 Hourly for</option>
                                                    <option value="8 hourly for">8 Hourly for</option>
                                                    <option value="2 hourly for">2 Hourly for</option>
                                                    <option value="3 hourly for">3 Hourly for</option>
                                                    <option value="prn for">prn</option>
                                                    
                                                 
                                                    <option value="QD (quaque die) for">QD quaque die for</option>
                                                </select>
                                            </td>
                                            <td style={cellStyle}>
                                                <input
                                                    type="number"
                                                    value={row.duration}
                                                    onChange={e => handleTreatmentPlanChange(index, 'duration', e.target.value)}
                                                    placeholder="Enter duration number"
                                                />
                                                <select
                                                    value={row.durationUnit}
                                                    onChange={e => handleTreatmentPlanChange(index, 'durationUnit', e.target.value)}
                                                >
                                                    <option value="">Select Duration Unit</option>
                                                    <option value="days">Days</option>
                                                    <option value="weeks">Weeks</option>
                                                    <option value="months">Months</option>
                                                    <option value="doses">Doses</option>
                                                    <option value="days in">Days in</option>
                                                    <option value="weeks in">Weeks in</option>
                                                    <option value="months in">Months in</option>
                                                    <option value="doses in">Doses in</option>
                                                    <option value="days then">Days then</option>
                                                    <option value="weeks then">Weeks then</option>
                                                    <option value="months then">Months then</option>
                                                    <option value="doses then">Doses then</option>
                                                </select>
                                            </td>
                                            <td style={{ ...cellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    {/* Display count button on hover */}
    <div 
        style={{
            position: 'absolute',
            top: '-30px',
            visibility: row.showButton ? 'visible' : 'hidden',
            opacity: row.showButton ? 1 : 0,
            transition: 'opacity 0.2s',
        }}
        onMouseLeave={() => handleButtonVisibility(index, false)}
    >
        <button 
            style={{
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: 'blue',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
            }}
            onClick={() => handleCountForMe(index)}
        >
            Count for me
        </button>
    </div>

    {/* Quantity input */}
    <input
        type="number"
        name="quantity"
        value={row.quantity || "0"}
        onChange={e => handleDrugQuantityChange(index, e)}
        placeholder="000"
        style={{ marginBottom: '4px' }}
        onMouseEnter={() => handleButtonVisibility(index, true)}
    />
    <span>{row.packaging}</span>
</td>



<td style={{ ...cellStyle, textAlign: 'right' }} className="row-actions">
    <button 
        style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }} 
        className="del-button" 
        onClick={() => handleDeleteRow(index)}
    >
        X
    </button>
    <button 
        style={{ marginLeft: '10px', backgroundColor: 'green', color: 'white' }} 
        className="add-button" 
        onClick={() => addNewRow(index)}
    >
        +
    </button>
    <button 
        style={{ marginLeft: '10px', backgroundColor: 'orange', color: 'white' }} 
        className="info-button" 
        onClick={() => toggleInfoBlock(index)}
    >
        <FontAwesomeIcon icon={faInfoCircle} />
    </button>
</td>


                                        </tr>
                                        {infoBlocks[index] && ( // Only render additional info input if the block is active
                                            <tr>
                                           <td colSpan={7} style={cellStyle}>
    <textarea
        value={infoTexts[index] || ''} // Ensure no undefined values
        onChange={e => handleInfoTextChange(index, e.target.value)}
        placeholder="Additional information..."
        style={{
            width: '100%',
            minHeight: '40px', // Minimum height to show it properly
            resize: 'vertical', // Allow vertical resizing
            backgroundColor: '#ebe8e8', // Light gray background for better readability
            fontFamily: 'Arial, sans-serif', // Suitable font for better readability
            fontSize: '14px', // Font size for better visibility
            border: '1px solid #ccc', // Light border for definition
            borderRadius: '4px', // Rounded corners for a modern look
            padding: '8px', // Padding for better spacing inside the textarea
            boxSizing: 'border-box', // Include padding and border in the element's total width and height
        }}
    />
</td>
                                          </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
          <div className="actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <button 
        className="add-row-button" 
        onClick={addNewRow} 
        style={{ 
            backgroundColor: '#28a745', // Green background for add button
            color: 'white', // White text
            border: 'none', // No border
            padding: '10px 15px', // Padding for button
            borderRadius: '5px', // Rounded corners
            cursor: 'pointer', // Pointer cursor on hover
            transition: 'background-color 0.3s' // Smooth transition
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} // Darker green on hover
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'} // Reset to original
    >
        +
    </button>

    <button 
        onClick={handleTreatmentPlanSubmit} 
        disabled={submitting} 
        style={{ 
            backgroundColor: submitting ? '#6c757d' : '#007bff', // Gray when submitting, blue otherwise
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '5px', 
            cursor: submitting ? 'not-allowed' : 'pointer', // Change cursor based on state
            transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#0056b3')} // Darker blue on hover
        onMouseOut={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#007bff')}
    >
        {submitting ? 'Please wait...' : 'Update Treatment Plan'}
    </button>

 

    {showMedicalBillModal && (
        <>
            <div 
                className="medical-bill-modal-overlay" 
                onClick={() => setShowMedicalBillModal(false)} 
                style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
                    zIndex: 1000 
                }} 
            />
            <MedicalBillModal 
                token={token} 
                maternityId={maternityId} 
                billData={billData} 
                onClose={() => setShowMedicalBillModal(false)} 
            />
        </>
    )}

    <button 
        className="btn btn-danger" 
        onClick={handleCloseModal} 
        style={{ 
            backgroundColor: '#dc3545', // Red background for close button
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')} // Darker red on hover
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
    >
        Close
    </button>
    
</div>
</div>
</div>
        </div>
    );
}

export default TreatmentPlanModal;