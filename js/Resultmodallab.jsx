import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { urls } from './config.dev';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function Resultmodallab({ patient, onClose, clinicDetails, token }) {
    console.log("Component props received:", {
        patient,
        clinicDetails,
        token // This is what we want to verify
    });
    const [labTests, setLabTests] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('view'); // 'view' or 'edit'
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [isChanged, setIsChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

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
            
            // Initialize editor with fetched content
            const resultsHtml = data.lab_results.join('<br/><br/>');
            setOriginalContent(resultsHtml);
            
            const blocksFromHtml = htmlToDraft(resultsHtml);
            const contentState = ContentState.createFromBlockArray(
                blocksFromHtml.contentBlocks,
                blocksFromHtml.entityMap
            );
            setEditorState(EditorState.createWithContent(contentState));
        })
        .catch(error => {
            setError(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
        
        // Compare with original content to detect changes
        const currentContent = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
        setIsChanged(currentContent !== originalContent);
    };

    const handlePrint = () => {
        const currentContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        
        fetch(urls.pdflab, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                labTests,
                labResults: currentContent.split('<br/><br/>'),
                clinicDetails,
                patient
            })
        })
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        })
        .catch(error => {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        });
    };

    const handleSaveChanges = () => {
        const rawContent = convertToRaw(editorState.getCurrentContent());
        const htmlContent = draftToHtml(rawContent);
        
        const payload = {
            file_id: patient.file_id,
            contact_id: patient.contact_id,
            results: htmlContent,
            raw_results: rawContent,
            totalLabTests: labTests.length,
            token: token
        };

        setIsLoading(true);

        fetch(urls.updatelabresults, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (response.ok) {
                toast.success('Lab results updated successfully!', { autoClose: 3000 });
                setIsChanged(false);
                setActiveTab('view');
                setOriginalContent(htmlContent); // Update original content
            } else {
                throw new Error('Failed to update lab results');
            }
        })
        .catch(error => {
            toast.error(error.message, { autoClose: 3000 });
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div className="custom-modal-overlay">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick draggable pauseOnHover />
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
                    width: 95%;
                    max-width: 1400px;
                    height: 92vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid green;
                    position: relative;
                    font-family: 'Times New Roman', Times, serif;
                    overflow: hidden;
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
                    z-index: 10;
                }

                .custom-modal-header {
                    padding: 40px 20px 0 20px;
                    background: white;
                    border-bottom: 1px solid #ddd;
                    position: relative;
                    z-index: 5;
                    flex-shrink: 0;
                }

                .custom-tabs {
                    display: flex;
                    margin-bottom: 0;
                    border-bottom: 1px solid #ddd;
                }

                .custom-tab {
                    padding: 8px 15px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    border-bottom: none;
                    margin-right: 5px;
                    background: #f5f5f5;
                }

                .custom-tab.active {
                    background: white;
                    border-color: #ddd;
                    border-bottom-color: white;
                    margin-bottom: -1px;
                    font-weight: bold;
                }

                .custom-main-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .custom-patient-info {
                    width: 280px;
                    padding: 20px;
                    background: #f9f9f9;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                    flex-shrink: 0;
                    position: relative;
                }

                .custom-results-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }

                .custom-results-header {
                    padding: 15px 20px;
                    background: white;
                    border-bottom: 1px solid #ddd;
                    flex-shrink: 0;
                    position: sticky;
                    top: 0;
                    z-index: 4;
                }

                .custom-results-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 20px;
                    position: relative;
                }

                .custom-editor-toolbar-sticky {
                    position: sticky;
                    top: 0;
                    z-index: 3;
                    background: white;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 10px;
                }

                .custom-editor-content-area {
                    min-height: 400px;
                    padding-bottom: 80px; /* Space for sticky buttons */
                }

                .custom-view-content {
                    white-space: pre-wrap;
                    font-family: 'Times New Roman', Times, serif;
                    padding: 15px;
                    line-height: 1.6;
                    padding-bottom: 80px; /* Space for sticky buttons */
                }

                .custom-button-area {
                    position: sticky;
                    bottom: 0;
                    background: white;
                    border-top: 1px solid #ddd;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                    z-index: 4;
                    box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
                }

                .custom-button-area button {
                    padding: 8px 16px;
                    margin: 0 5px;
                    border: 1px solid #ddd;
                    background: #f5f5f5;
                    cursor: pointer;
                    border-radius: 4px;
                }

                .custom-button-area button:hover {
                    background: #e9e9e9;
                }

                .custom-button-area button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
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

                /* Editor styling */
                .rdw-editor-main {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-family: 'Times New Roman', Times, serif !important;
                    line-height: 1.6 !important;
                    min-height: 300px;
                    border: 1px solid #ddd;
                    padding: 10px;
                }
                
                .rdw-editor-toolbar {
                    background-color: #ffffff !important;
                    border: 1px solid #d4d4d4 !important;
                    border-bottom: none !important;
                    margin: 0 !important;
                    padding: 8px !important;
                }
                
                .rdw-option-wrapper {
                    background-color: #ffffff !important;
                    border: 1px solid #d4d4d4 !important;
                    border-radius: 2px !important;
                    margin: 0 1px !important;
                }
                
                .rdw-option-wrapper:hover {
                    background-color: #f3f2f1 !important;
                    border-color: #bebebe !important;
                }
                
                .rdw-option-active {
                    background-color: #e1dfdd !important;
                    border-color: #8a8886 !important;
                }

                .custom-patient-info h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #333;
                    font-size: 18px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                }

                .custom-patient-info p {
                    margin: 8px 0;
                    line-height: 1.4;
                }

                .custom-patient-info ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }

                .custom-patient-info li {
                    margin: 5px 0;
                }
                `}
            </style>
            <div id="custom-modal-content" className="custom-modal-content">
                <button className="custom-close-btn" onClick={onClose}>×</button>
                
                <div className="custom-modal-header">
                    <div className="custom-tabs">
                        <div 
                            className={`custom-tab ${activeTab === 'view' ? 'active' : ''}`}
                            onClick={() => setActiveTab('view')}
                        >
                            View Results
                        </div>
                        <div 
                            className={`custom-tab ${activeTab === 'edit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('edit')}
                        >
                            Edit Results
                        </div>
                    </div>
                </div>

                <div className="custom-main-content">
                    <div className="custom-patient-info">
                        <h3>Patient Details</h3>
                        <div>
                            <p><strong>Name:</strong> {`${patient.first_name} ${patient.last_name}`}</p>
                            <p><strong>File ID:</strong> {patient.file_id}</p>
                            <p><strong>Age:</strong> {patient.age}</p>
                            <p><strong>Sex:</strong> {patient.sex}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                        </div>

                        <h3 style={{ marginTop: '30px' }}>LABORATORY TESTS</h3>
                        {loading ? (
                            <p>Loading tests...</p>
                        ) : error ? (
                            <p style={{ color: 'red' }}>{error}</p>
                        ) : (
                            <ul>
                                {labTests.map((test, index) => (
                                    <li key={index}>{test}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="custom-results-section">
                        <div className="custom-results-header">
                            <h3>LABORATORY RESULTS:</h3>
                        </div>

                        <div className="custom-results-content">
                            {loading ? (
                                <p>Fetching laboratory results, please wait...</p>
                            ) : error ? (
                                <p style={{ color: 'red' }}>{error}</p>
                            ) : activeTab === 'view' ? (
                                <div className="custom-view-content" 
                                    dangerouslySetInnerHTML={{ __html: draftToHtml(convertToRaw(editorState.getCurrentContent())) }} />
                            ) : (
                                <div className="custom-editor-content-area">
                                    <div className="custom-editor-toolbar-sticky">
                                        <Editor
                                            editorState={editorState}
                                            onEditorStateChange={onEditorStateChange}
                                            toolbar={{
                                                options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'history'],
                                                inline: {
                                                    options: ['bold', 'italic', 'underline', 'strikethrough'],
                                                },
                                                blockType: {
                                                    options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote'],
                                                },
                                                fontSize: {
                                                    options: [10, 12, 14, 16, 18, 24, 30],
                                                },
                                            }}
                                            wrapperClassName="custom-editor-wrapper"
                                            editorClassName="custom-editor-content"
                                            toolbarClassName="custom-editor-toolbar"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="custom-button-area">
    <div>
        <button 
            onClick={handlePrint}
            style={{
                backgroundColor: '#4a89dc',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                marginRight: '10px'
            }}
        >
            Print
        </button>
        <button 
            onClick={onClose}
            style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px'
            }}
        >
            Cancel
        </button>
    </div>
    {activeTab === 'edit' && (
        <button 
            onClick={handleSaveChanges} 
            disabled={!isChanged || isLoading}
            style={{ 
                backgroundColor: isChanged ? '#4CAF50' : '#cccccc', 
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px'
            }}
        >
            {isLoading ? (
                <span>Saving...</span>
            ) : (
                'Save Changes'
            )}
        </button>
    )}
</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Resultmodallab;