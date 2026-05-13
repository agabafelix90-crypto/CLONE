import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';

function RadiologyResultsModal3({ patient, onClose, clinicDetails, token }) {
    const [labTests, setLabTests] = useState([]);
    const [radiologyTests, setRadiologyTests] = useState([]);
    const [radiologyResults, setRadiologyResults] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printLoading, setPrintLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Clinic Details: ", clinicDetails);
        fetchRadiologyResults();
    }, [patient.file_id]);

    const fetchRadiologyResults = () => {
        setLoading(true);

        fetch(urls.fetchradiologyresults, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileId: patient.file_id })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('No radiology results found for the provided file ID');
            }
        })
        .then(data => {
            if (data.radiology_exams && data.radiology_exams.length > 0) {
                const tests = data.radiology_exams.map(test => test.replace('Radiology Exam: ', ''));
                setRadiologyTests(tests);
            } else {
                setRadiologyTests([]);
            }
            setRadiologyResults(data.radiology_results || []);
        })
        .catch(error => {
            setError(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };
    const handleProceedToFile = () => {
        navigate(`/patient-file/${token}/${patient.file_id}`); // Navigate to the desired route with token and fileId
    };

    return (
        <div className="radiology-modal-overlay">
            <style>
                {`
                .radiology-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .radiology-modal-content {
                    background: white;
                    width: 80%;
                    max-width: 1000px;
                    height: 80%;
                    max-height: 80vh;
                    overflow: auto;
                    padding: 20px;
                    padding-top: 60px; /* Add padding to create space for the close button */
                    box-sizing: border-box;
                    border: 1px solid green;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .radiology-close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: red;
                    z-index: 10; /* Ensure it stays above other content */
                }
                .radiology-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                .radiology-header h1 {
                    font-size: 24px;
                    margin: 0;
                    text-align: left;
                    color: black;
                }
                .radiology-header div {
                    text-align: right;
                    color: black;
                }
                .radiology-patient-details {
                    text-align: right;
                    margin-top: 20px;
                }
                .radiology-patient-details h3 {
                    text-transform: uppercase;
                }
                .radiology-results {
                    font-family: 'Times New Roman', Times, serif;
                    flex: 1;
                    overflow-y: auto;
                }
                .radiology-results h3, .radiology-results h4 {
                    font-weight: bold;
                    text-decoration: underline;
                    font-size: 25px;
                }
                .radiology-results pre, .radiology-results p {
                    font-family: 'Times New Roman', Times, serif;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    text-align: left;
                }
                .radiology-button-area {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(0, 0, 0, 0.2);
                    border-top: 3px solid #000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media print {
                    .radiology-modal-overlay {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background: transparent;
                        backdrop-filter: none;
                        display: block;
                    }
                    .radiology-modal-content {
                        position: static;
                        width: 100%;
                        height: auto;
                        margin: 0;
                        border: none;
                        padding: 0;
                        page-break-inside: avoid;
                        box-sizing: border-box;
                    }
                    .radiology-modal-content * {
                        visibility: visible;
                    }
                }
                `}
            </style>
            <div className="radiology-modal-content">
                <button className="radiology-close-button" onClick={onClose}>X</button>
                <div className="radiology-header">
                    <h1>{clinicDetails?.clinic_name ? clinicDetails.clinic_name : 'RADIOLOGY RESULTS'}</h1>
                    
                </div>

                <div className="radiology-patient-details">
                    <h3>Patient Details</h3>
                    <div>
                        <p><strong>Name:</strong> {`${patient.name}`}</p>
                        <p><strong>Age:</strong> {patient.age}</p>
                        <p><strong>Sex:</strong> {patient.sex}</p>
                    </div>
                </div>

                <div className="radiology-results">
                    {loading ? (
                        <p>Fetching patient results, please wait...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <div>
                            {radiologyTests.length > 0 && (
                                <div>
                                    <h3>Radiology Exams Conducted</h3>
                                    <ul>
                                        {radiologyTests.map((test, index) => (
                                            <li key={index}>{test}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {radiologyResults.length > 0 && (
                                <div>
                                    <h4>Findings:</h4>
                                    <pre>{radiologyResults.join('\n')}</pre>
                                </div>
                            )}
                            {(radiologyTests.length === 0 && radiologyResults.length === 0) && (
                                <p>No radiology results available</p>
                            )}
                        </div>
                    )}
                </div>
                
                <button 
  onClick={onClose} 
  style={{
    display: 'inline-block',
    padding: '0', // Remove padding
    marginLeft: '0', // Adjust margin as needed
    backgroundColor: '#007bff', // Button color
    color: '#fff', // Text color
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease'
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
>
  Close
</button>
<button onClick={handleProceedToFile}>
                            Proceed to see {patient.name}'s file
                        </button>
                    </div>
                </div>
            
        
    );
}

export default RadiologyResultsModal3;
