import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';

function EditFileModal({ fileId, token, employeeName, clinicalNotes: initialClinicalNotes, signsAndSymptoms: initialSignsAndSymptoms, diagnosis: initialDiagnosis, onClose }) {
    const navigate = useNavigate();
    const [clinicalNotes, setClinicalNotes] = useState(initialClinicalNotes);
    const [signsAndSymptoms, setSignsAndSymptoms] = useState(initialSignsAndSymptoms);
    const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
    const [submitting, setSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // Track if changes have been made

    useEffect(() => {
        console.log('Received props:', { fileId, token, employeeName, initialClinicalNotes, initialSignsAndSymptoms, initialDiagnosis });
    }, [fileId, token, employeeName, initialClinicalNotes, initialSignsAndSymptoms, initialDiagnosis]);

    useEffect(() => {
        // Check if any fields have been modified
        const hasChanges = clinicalNotes !== initialClinicalNotes ||
                           signsAndSymptoms !== initialSignsAndSymptoms ||
                           diagnosis !== initialDiagnosis;
        setIsDirty(hasChanges); // Update isDirty based on changes
    }, [clinicalNotes, signsAndSymptoms, diagnosis, initialClinicalNotes, initialSignsAndSymptoms, initialDiagnosis]);

    const generateRandomToast = () => {
        const messages = [
            'Form is being submitted...',
            'Please wait, processing your request...',
            'Submitting your data, hang tight!',
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        toast.info(randomMessage);
    };

    const submitForm = async () => {
        try {
            setSubmitting(true);

            const formData = {
                fileId,
                employeeName,
                clinicalNotes,
                signsAndSymptoms,
                diagnosis,
                token,
            };

            const submitResponse = await fetch(urls.editfile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (submitResponse.ok) {
                const responseData = await submitResponse.json();

                // Handle specific success message
                if (responseData.message === 'Data updated successfully') {
                    alert('Patient form submitted successfully.');
                    onClose(); // Close modal on success
                } else if (responseData.message === 'You did not make any changes!.') {
                    alert('No records were updated. Please check if the file ID exists.');
                } else {
                    alert('Unexpected response from server. Please try again later.');
                    console.error('Unexpected response from backend:', responseData);
                }
            } else {
                // Handle HTTP errors
                alert(`Error submitting patient data: ${submitResponse.statusText}`);
                console.error('Error submitting patient data:', submitResponse.statusText);
            }
        } catch (error) {
            // Handle network or other errors
            alert('Error submitting form. Please check your connection and try again.');
            console.error('Error submitting form:', error);
        } finally {
            setSubmitting(false); // Always reset the submitting state
        }
    };

    return (
        <div style={{
            position: 'fixed', 
            top: '0', 
            left: '0', 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            zIndex: '1000', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
        }}>
            <ToastContainer />
            <div style={{
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '8px', 
                width: '80%', // Make modal wider
                maxHeight: '90vh', // Leave space at top and bottom
                overflowY: 'auto', // Scrollable if content overflows
                position: 'relative'
            }}>
                <button 
                    onClick={onClose} 
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    &times; {/* Close button */}
                </button>
                <div className="signs-symptoms-section textarea-container">
                    <h2 style={{ textAlign: 'center', fontSize: '28px', textDecoration: 'underline' }}>EDIT PATIENT FILE</h2>
                    <h2>Presenting Complaints</h2>
                    <textarea
                        id="signs-and-symptoms"
                        rows="4"
                        value={signsAndSymptoms}
                        onChange={(e) => setSignsAndSymptoms(e.target.value)}
                        placeholder="Enter patient presenting complaints here..."
                        style={{
                            fontSize: '20px',
                            fontFamily: 'Arial, sans-serif',
                            height: '150px',
                            width: '100%',
                        }}
                    />
                </div>

                <div className="clinical-notes-section textarea-container">
                    <h2>Clinical Notes</h2>
                    <textarea
                        id="clinical-notes"
                        rows="6"
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="Enter clinical notes here..."
                        style={{
                            fontSize: '20px',
                            fontFamily: 'Arial, sans-serif',
                            height: '150px',
                            width: '100%',
                        }}
                    />
                </div>

                <div className="diagnosis-section textarea-container">
                    <h2>Diagnosis</h2>
                    <textarea
                        id="diagnosis"
                        rows="4"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter diagnosis here..."
                        style={{
                            fontSize: '20px',
                            fontFamily: 'Arial, sans-serif',
                            height: '150px',
                            width: '100%',
                        }}
                    />
                </div>

                <button onClick={submitForm} disabled={!isDirty || submitting} style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '18px',
                    cursor: (!isDirty || submitting) ? 'not-allowed' : 'pointer',
                    backgroundColor: (!isDirty || submitting) ? '#ccc' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    width: '100%',
                }}>
                    {submitting ? 'Submitting....' : 'Submit Changes'}
                </button>

                <footer style={{ marginTop: '20px', fontSize: '12px', textAlign: 'center', color: '#666' }}>
                    This software was created by MEDCORE Systems. For support or help contact +256700123457
                </footer>
            </div>
        </div>
    );
}

export default EditFileModal;

