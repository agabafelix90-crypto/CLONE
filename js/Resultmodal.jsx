import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';

function Resultmodal({ patient, onClose, clinicDetails }) {
    const [labTests, setLabTests] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [htmlContent, setHtmlContent] = useState([]);
    const [formatting, setFormatting] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printLoading, setPrintLoading] = useState(false);

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
            // Filter out duplicate tests and results
            const uniqueTests = [...new Set(data.lab_tests.map(test => test.replace('Lab Test: ', '')))];
            const uniqueResults = [...new Set(data.lab_results)];
            const uniqueHtmlContent = [...new Set(data.html_content || [])];
            
            setLabTests(uniqueTests);
            setLabResults(uniqueResults);
            setHtmlContent(uniqueHtmlContent);
            setFormatting(data.formatting || {});
        })
        .catch(error => {
            setError(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handlePrint = () => {
        setPrintLoading(true);
        const printData = {
            clinicName: clinicDetails?.clinic_name || 'No Clinic Name Available',
            contact: clinicDetails?.owners_contact || 'No Contact Available',
            location: `${clinicDetails?.sub_county || ''}, ${clinicDetails?.district || ''}`,
            patientName: `${patient.first_name} ${patient.last_name}`,
            patientAge: patient.age,
            patientSex: patient.sex,
            labTests,
            labResults,
            htmlContent,
            formatting
        };

        fetch(urls.pdflab, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(printData)
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url);
        })
        .catch(error => {
            setError("Failed to generate PDF");
            console.error("PDF generation error:", error);
        })
        .finally(() => {
            setPrintLoading(false);
        });
    };

    // Function to safely render HTML content
    const renderHTML = (htmlString) => {
        return { __html: htmlString };
    };

    // Function to render results without duplication
    const renderResults = () => {
        if (htmlContent.length > 0) {
            // Remove duplicates from htmlContent
            const uniqueHtmlContent = [...new Set(htmlContent)];
            return uniqueHtmlContent.map((content, index) => (
                <div 
                    key={`html-${index}`} 
                    dangerouslySetInnerHTML={renderHTML(content)} 
                    style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'monospace' 
                    }} 
                />
            ));
        } else if (labResults.length > 0) {
            // Remove duplicates from labResults
            const uniqueResults = [...new Set(labResults)];
            return uniqueResults.map((result, index) => {
                const text = result.includes('pending') ? 'No lab results found for this File.' : result;
                const style = {
                    fontWeight: formatting[index]?.bold ? 'bold' : 'normal',
                    fontStyle: formatting[index]?.italic ? 'italic' : 'normal',
                    fontSize: formatting[index]?.fontSize || 'inherit',
                    textDecoration: formatting[index]?.underlined ? 'underline' : 'none',
                    textAlign: /^\d/.test(text) ? 'right' : 'left',
                    color: 'black',
                    backgroundColor: 'white',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                };

                const paragraphs = text.split('\n').map((paragraph, i) => (
                    <p key={i} style={style}>{paragraph}</p>
                ));

                return <div key={`result-${index}`}>{paragraphs}</div>;
            });
        }
        return null;
    };

    return (
        <div className="lab-modal-overlay">
            <style>
                {`
                .lab-modal-overlay {
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
                    padding: 20px;
                }
                
                .lab-modal-content {
                    background: white;
                    width: 95%;
                    max-width: 1400px;
                    height: 90%;
                    max-height: 90vh;
                    display: flex;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                }
                
                /* Close Button */
                .lab-close-button {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    font-size: 16px;
                    cursor: pointer;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .lab-close-button:hover {
                    background: #c82333;
                    transform: scale(1.1);
                }
                
                /* Left Sidebar */
                .lab-sidebar {
                    width: 320px;
                    min-width: 320px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 25px;
                    border-right: 1px solid #dee2e6;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                /* Fix for sidebar scrolling */
                .lab-sidebar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .lab-sidebar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .lab-sidebar::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                
                .lab-sidebar::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                
                /* Clinic Header - Changed to black */
                .clinic-header {
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #000000;
                }
                
                .clinic-name {
                    font-size: 22px;
                    font-weight: 700;
                    color: #000000;
                    margin-bottom: 10px;
                    line-height: 1.3;
                }
                
                .clinic-details {
                    font-size: 14px;
                    color: #333333;
                    line-height: 1.5;
                }
                
                .clinic-details strong {
                    color: #000000;
                }
                
                /* Patient Section */
                .patient-section {
                    margin-bottom: 25px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }
                
                /* Section Title - Changed to black */
                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #000000;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .patient-details {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .detail-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .detail-label {
                    font-size: 13px;
                    color: #666666;
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                
                .detail-value {
                    font-size: 15px;
                    color: #000000;
                    font-weight: 500;
                }
                
                /* Tests Section */
                .tests-section {
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    flex: 1;
                    min-height: 0; /* Important for flex scrolling */
                    overflow-y: auto;
                }
                
                /* Fix for tests list scrolling */
                .tests-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 5px;
                }
                
                .tests-list::-webkit-scrollbar {
                    width: 5px;
                }
                
                .tests-list::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .tests-list::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                
                .test-item {
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    
                    font-size: 14px;
                    color: #333333;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                
                .test-item:hover {
                    background: #e9ecef;
                    transform: translateX(2px);
                }
                
                /* Main Content Area */
                .lab-main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 25px;
                }
                
                /* Content Header - Changed to black */
                .content-header {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                   
                }
                
                .content-header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: #000000;
                    margin: 0 0 10px 0;
                }
                
                .subtitle {
                    font-size: 16px;
                    color: #666666;
                    margin: 0;
                }
                
                /* Results Container */
                .results-container {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 15px;
                }
                
                .results-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .results-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .results-container::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                
                .results-container::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                
                /* Results Content - Keeping green background */
                .results-content {
                    font-family: 'Times New Roman', serif;
                    font-size: 14pt;
                    line-height: 1.7;
                    color: #212529;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .lab-tests-section, .lab-results-section {
                    background: #ffff; /* Green background */
                    border-radius: 8px;
                    padding: 25px;
                    border: 1px solid #ffff;
                    margin-bottom: 20px;
                }
                
                /* Section Title - Changed to black */
                .section-title-main {
                    font-size: 20px;
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #000000;
                    text-transform: uppercase;
                }
                
                /* No Results */
                .no-results {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666666;
                    font-size: 16px;
                }
                
                /* Loading State */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666666;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(0, 0, 0, 0.2);
                    border-top: 4px solid #000000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                
                /* Error State */
                .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #dc3545;
                    text-align: center;
                    padding: 20px;
                }
                
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                
                /* Button Area */
                .lab-button-area {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                }
                
                .lab-button-area button {
                    padding: 12px 28px;
                    font-size: 16px;
                    font-weight: 500;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 120px;
                }
                
                .print-button {
                    background: linear-gradient(135deg, #000000 0%, #333333 100%);
                    color: white;
                }
                
                .print-button:hover:not(:disabled) {
                    background: linear-gradient(135deg, #333333 0%, #000000 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .close-button {
                   background: #dc3545;
                    color: white;
                }
                
                .close-button:hover {
                    background: linear-gradient(135deg, #333333 0%, #000000 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .lab-button-area button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .button-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 10px;
                }
                
                /* Print Styles */
                @media print {
                    .lab-modal-overlay {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background: transparent;
                        backdrop-filter: none;
                        display: block;
                        padding: 0;
                    }
                    
                    .lab-modal-content {
                        width: 100%;
                        height: auto;
                        max-width: none;
                        max-height: none;
                        box-shadow: none;
                        border-radius: 0;
                        display: block;
                    }
                    
                    .lab-sidebar {
                        display: none;
                    }
                    
                    .lab-close-button,
                    .lab-button-area {
                        display: none !important;
                    }
                    
                    .lab-main-content {
                        padding: 20px;
                    }
                    
                    .results-container {
                        overflow: visible;
                        padding-right: 0;
                    }
                    
                    .results-content {
                        font-size: 12pt;
                    }
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Responsive Design */
                @media (max-width: 1024px) {
                    .lab-modal-content {
                        width: 98%;
                        height: 95%;
                    }
                    
                    .lab-sidebar {
                        width: 300px;
                        min-width: 300px;
                    }
                }
                
                @media (max-width: 768px) {
                    .lab-modal-content {
                        flex-direction: column;
                        width: 100%;
                        height: 100%;
                        max-height: none;
                        border-radius: 0;
                    }
                    
                    .lab-sidebar {
                        width: 100%;
                        min-width: 100%;
                        max-height: 40vh;
                        border-right: none;
                        border-bottom: 1px solid #dee2e6;
                    }
                    
                    .lab-main-content {
                        flex: 1;
                        overflow-y: auto;
                    }
                    
                    .lab-modal-overlay {
                        padding: 0;
                    }
                }
                `}
            </style>
            
            <div className="lab-modal-content">
                
                
                {/* Left Sidebar */}
                <div className="lab-sidebar">
                    {/* Clinic Details */}
                   
                    
                    {/* Patient Details */}
                    <div className="patient-section">
                        <div className="section-title">Patient Details</div>
                        <div className="patient-details">
                            <div className="detail-item">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">
                                    {patient.first_name} {patient.last_name}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Age</span>
                                <span className="detail-value">{patient.age}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Gender</span>
                                <span className="detail-value">{patient.sex}</span>
                            </div>
                            
                            {patient.date && (
                                <div className="detail-item">
                                    <span className="detail-label">Date</span>
                                    <span className="detail-value">
                                        {new Date(patient.date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Laboratory Tests */}
                    {labTests.length > 0 && (
                        <div className="tests-section">
                            <div className="section-title">Laboratory Tests</div>
                            <div className="tests-list">
                                {/* Remove duplicate tests */}
                                {[...new Set(labTests)].map((test, index) => (
                                    <div key={index} className="test-item">
                                        {test}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Main Content Area */}
                <div className="lab-main-content">
                    <div className="content-header">
                        <h1>Laboratory Results</h1>
                       
                    </div>
                    
                    <div className="results-container">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Fetching laboratory results, please wait...</p>
                            </div>
                        ) : error ? (
                            <div className="error-container">
                                <div className="error-icon">⚠️</div>
                                <p style={{ fontSize: '18px', marginBottom: '10px' }}>Error Loading Results</p>
                                <p>{error}</p>
                            </div>
                        ) : labTests.length > 0 || labResults.length > 0 ? (
                            <>
                               
                                
                                {/* Laboratory Results Section */}
                                {(labResults.length > 0 || htmlContent.length > 0) && (
                                    <div className="lab-results-section">
                                        
                                        <div className="results-content">
                                            {renderResults()}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-results">
                                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No Laboratory Results Available</p>
                                <p>The patient has no laboratory results in the system.</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="lab-button-area">
                        <button 
                            onClick={handlePrint} 
                            disabled={printLoading || loading || (labResults.length === 0 && htmlContent.length === 0)}
                            className="print-button"
                        >
                            {printLoading ? (
                                <>
                                    <div className="button-spinner"></div>
                                    Generating PDF...
                                </>
                            ) : (
                                'Print Report'
                            )}
                        </button>
                        <button onClick={onClose} className="close-button">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Resultmodal;