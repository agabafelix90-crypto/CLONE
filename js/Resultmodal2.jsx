import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { useNavigate } from 'react-router-dom';

function Resultmodal2({ patient, onClose, clinicDetails, token }) {
    const [labTests, setLabTests] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [formatting, setFormatting] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLabResults();
    }, []);

    const fetchLabResults = () => {
        setLoading(true);

        fetch(urls.fetchlabresults, {
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
                throw new Error('No laboratory results found for the provided file ID');
            }
        })
        .then(data => {
            setLabTests(data.lab_tests.map(test => test.replace('Lab Test: ', '')));
            setLabResults(data.lab_results);
            setFormatting(data.formatting);
        })
        .catch(error => {
            setError(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const renderFormattedText = (text, index) => {
        const style = {
            fontWeight: formatting[index]?.bold ? 'bold' : 'normal',
            fontStyle: formatting[index]?.italic ? 'italic' : 'normal',
            fontSize: formatting[index]?.fontSize || 'inherit',
            textDecoration: formatting[index]?.underlined ? 'underline' : 'none',
            textAlign: /^\d/.test(text) ? 'right' : 'left',
        };

        const paragraphs = text.split('\n').map((paragraph, i) => (
            <p key={i} style={style}>{paragraph}</p>
        ));

        return <div>{paragraphs}</div>;
    };

    const handleProceedToFile = () => {
        navigate(`/patient-file/${token}/${patient.file_id}`); // Navigate to the desired route with token and fileId
    };

    return (
        <div className="custom-modal-overlay">
            <style>
                {`
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                }

                .custom-modal-overlay {
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

                .custom-modal-content {
                    background: white;
                    width: 80%;
                    max-width: 1000px;
                    height: 80%;
                    max-height: 80vh;
                    overflow: auto;
                    padding: 20px;
                    box-sizing: border-box;
                    border: 1px solid green;
                    position: relative;
                    margin-top: 40px; /* Adds space at the top */
                }

                .custom-close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 24px;
                    color: red;
                    cursor: pointer;
                    background: none;
                    border: none;
                }

                .custom-modal-header-spacing {
                    margin-top: 40px; /* Additional spacing for content */
                }

                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        height: 100%;
                    }

                    .custom-modal-overlay {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background: transparent;
                        backdrop-filter: none;
                        display: block;
                    }

                    .custom-modal-content {
                        position: static;
                        width: 100%;
                        height: auto;
                        margin: 0;
                        border: none;
                        padding: 0;
                        page-break-inside: avoid;
                        box-sizing: border-box;
                    }

                    .custom-modal-content * {
                        visibility: visible;
                    }
                }

                .custom-left-align {
                    text-align: left;
                }

                .custom-results {
                    font-family: 'Times New Roman', Times, serif;
                }

                .custom-button-area {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                }

                .custom-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 20px;
                }

                .custom-header h1 {
                    font-size: 24px;
                    color: black;
                    margin: 0;
                }

                .custom-patient-details {
                    text-align: right;
                    margin-top: 20px;
                }

                .custom-patient-details h3 {
                    text-transform: uppercase;
                    margin: 0;
                    padding: 10px 0;
                }
                `}
            </style>
            <div id="custom-modal-content" className="custom-modal-content">
                <button className="custom-close-btn" onClick={onClose}>×</button>
                <div className="custom-modal-header-spacing">
                    <div className="custom-header">
                        <h1>{clinicDetails.clinic_name || 'LABORATORY RESULTS'}</h1>
                        <div style={{ textAlign: 'right' }}>
                            
                        </div>
                    </div>

                    <div className="custom-patient-details">
                        <h3>Patient Details</h3>
                        <div>
                            <p><strong>Name:</strong> {`${patient.name}`}</p>
                            <p><strong>Age:</strong> {patient.age}</p>
                            <p><strong>Sex:</strong> {patient.sex}</p>
                        </div>
                    </div>

                    <div className="custom-results">
                        <div className="custom-lab-tests">
                            <h3>LABORATORY TESTS DONE</h3>
                            {loading ? (
                                <p>Fetching laboratory results, please wait...</p>
                            ) : error ? (
                                <p>{error}</p>
                            ) : (
                                <div>
                                    {labTests.map((test, index) => (
                                        renderFormattedText(test, index)
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="custom-lab-results">
                            <h3>LABORATORY RESULTS:</h3>
                            {loading ? (
                                <p>Fetching laboratory results, please wait...</p>
                            ) : error ? (
                                <p>{error}</p>
                            ) : (
                                <div>
                                    {labResults.map((result, index) => (
                                        renderFormattedText(result.includes('pending') ? 'No lab results found for this File.' : result, index)
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="custom-button-area">
                        <button onClick={onClose}>Close</button>
                        {/* Add the proceed button */}
                        <button onClick={handleProceedToFile}>
                            Proceed to see {patient.name}'s file
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Resultmodal2;