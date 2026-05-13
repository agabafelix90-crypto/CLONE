import React, { useState, useEffect, useRef, useCallback } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

function RadiologyResultsModal5({ patient, onClose, clinicDetails }) {
    const [radiologyTests, setRadiologyTests] = useState([]);
    const [radiologyResults, setRadiologyResults] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printLoading, setPrintLoading] = useState(false);
    const [isChanged, setIsChanged] = useState(false);
    const [activeEditor, setActiveEditor] = useState(0);
    const [initialContentLoaded, setInitialContentLoaded] = useState(false);
    const editorRefs = useRef([]);
    const [formatStates, setFormatStates] = useState({
        bold: false,
        italic: false,
        underline: false
    });

    // Process and clean the radiology results
    const processRadiologyResults = (results) => {
        return results.map(result => {
            if (result === 'pending' || !result) {
                return '';
            }
            
            if (Array.isArray(result)) {
                result = result[1] || result[0] || '';
            }
            
            // Handle JSON string format that starts with [" and ends with ]
            if (typeof result === 'string' && result.startsWith('["') && result.endsWith('"]')) {
                try {
                    const parsed = JSON.parse(result);
                    result = parsed[0] || '';
                } catch (e) {
                    console.warn('Failed to parse JSON string result:', e);
                    result = result.slice(2, -2);
                }
            }
            
            let processed = result
                .replace(/\\\\n/g, '\n')
                .replace(/\\n/g, '\n')
                .replace(/\\\//g, '/')
                .replace(/<\\\/i>/g, '</i>')
                .replace(/<\\\/b>/g, '</b>')
                .replace(/<i>/g, '<i>')
                .replace(/<b>/g, '<b>')
                .replace(/<br\s*\/?>/gi, '<br>')
                .replace(/<br><br><br>/g, '<br><br>')
                .replace(/\*\*\*CONCLUSION\*\*\*<\\\/b><br><br>/gi, '<br><br><b>***CONCLUSION***</b><br><br>')
                .replace(/\*\*CONCLUSION\*\*<\\\/b><br><br>/gi, '<br><br><b>**CONCLUSION**</b><br><br>')
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .trim();
            
            return processed;
        });
    };

    const fetchRadiologyResults = useCallback(() => {
        setLoading(true);
        setInitialContentLoaded(false);

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
            const exams = data.radiology_exams || [];
            const results = data.radiology_results || [];

            const cleanedExams = exams.map(exam => exam.replace('Radiology Exam: ', ''));
            setRadiologyTests(cleanedExams);
            
            const processedResults = processRadiologyResults(results);
            setRadiologyResults(processedResults);
            
            // Mark initial content as loaded
            setInitialContentLoaded(true);
        })
        .catch(error => {
            setError(error.message);
            toast.error(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [patient.file_id]);

    useEffect(() => {
        fetchRadiologyResults();
    }, [fetchRadiologyResults]);

    // Update format states when selection changes
    useEffect(() => {
        const updateFormatState = () => {
            const activeRef = editorRefs.current[activeEditor];
            if (activeRef && document.activeElement === activeRef) {
                setFormatStates({
                    bold: document.queryCommandState('bold'),
                    italic: document.queryCommandState('italic'),
                    underline: document.queryCommandState('underline')
                });
            }
        };

        const handleSelectionChange = () => {
            updateFormatState();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [activeEditor]);

    const handleInputChange = useCallback(() => {
        setIsChanged(true);
    }, []);

    const executeCommand = useCallback((command, value = null) => {
        const editor = editorRefs.current[activeEditor];
        if (editor) {
            editor.focus();
            
            if (command === 'insertLineBreak') {
                document.execCommand('insertHTML', false, '<br><br>');
            } else {
                document.execCommand(command, false, value);
            }
            
            setFormatStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline')
            });
            
            setIsChanged(true);
        }
    }, [activeEditor]);

    const undo = useCallback(() => {
        document.execCommand('undo', false, null);
        setIsChanged(true);
    }, []);

    const redo = useCallback(() => {
        document.execCommand('redo', false, null);
        setIsChanged(true);
    }, []);

    const handleSaveRadiologyChanges = useCallback(() => {
        // Collect current content from all editors
        const updatedResults = editorRefs.current.map((editor, index) => {
            if (editor) {
                return editor.innerHTML;
            }
            return radiologyResults[index] || '';
        });

        // Filter out empty results
        const populatedResults = updatedResults.filter(result => {
            if (!result || result.trim() === '') return false;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            return textContent.trim() !== '';
        });

        const payload = {
            fileId: patient.file_id,
            radiologyResults: populatedResults.length > 0 ? populatedResults : [""],
        };

        setLoading(true);

        fetch(urls.updateradiologyresults, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (response.ok) {
                toast.success('Radiology results updated successfully!', { autoClose: 3000 });
                // Update state but don't interfere with editor content
                setRadiologyResults(updatedResults);
                setIsChanged(false);
            } else {
                throw new Error('Failed to update radiology results');
            }
        })
        .catch(error => {
            toast.error(error.message, { autoClose: 3000 });
        })
        .finally(() => {
            setLoading(false);
        });
    }, [patient.file_id, radiologyResults]);

   const handlePrint = useCallback(() => {
    setPrintLoading(true);
    
    // Collect current content from all editors WITH HTML FORMATTING
    const currentResults = editorRefs.current.map((editor, index) => {
        if (editor) {
            return editor.innerHTML;
        }
        return radiologyResults[index] || '';
    });
    
    // Send HTML content directly to preserve formatting
    const printData = {
        clinicName: clinicDetails?.clinic_name || 'No Clinic Name Available',
        contact: clinicDetails?.owners_contact || 'No Contact Available',
        location: `${clinicDetails?.sub_county || ''}, ${clinicDetails?.district || ''}`,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientAge: patient.age,
        patientSex: patient.sex,
        radiologyTests,
        radiologyResults: currentResults, // Send HTML content directly
        format: 'html' // Optional: Add a flag to indicate HTML content
    };

    fetch(urls.pdfscan, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url);
        toast.success('PDF generated successfully!');
    })
    .catch(error => {
        setError("Failed to generate PDF");
        console.error("PDF generation error:", error);
        toast.error('Failed to generate PDF');
    })
    .finally(() => {
        setPrintLoading(false);
    });
}, [clinicDetails, patient, radiologyTests, radiologyResults]);

    // Improved editor ref handler
    const handleEditorRef = useCallback((el, index) => {
        if (el) {
            editorRefs.current[index] = el;
            
            // Only set initial content once when data is loaded and editor is empty
            if (initialContentLoaded && radiologyResults[index] && !el.innerHTML.trim()) {
                el.innerHTML = radiologyResults[index];
            }
        }
    }, [radiologyResults, initialContentLoaded]);

    // Sync editor content when switching between tests
    useEffect(() => {
        if (initialContentLoaded) {
            const editor = editorRefs.current[activeEditor];
            const result = radiologyResults[activeEditor];
            
            if (editor && result && !editor.innerHTML.trim()) {
                editor.innerHTML = result;
            }
        }
    }, [activeEditor, radiologyResults, initialContentLoaded]);


    
    const styles = {
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '20px',
        },
        modalContent: {
            backgroundColor: '#fff',
            width: '95%',
            maxWidth: '1400px',
            height: '90vh',
            padding: '0',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
        },
        leftPanel: {
            width: '30%',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '20px',
        },
        rightPanel: {
            width: '70%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingBottom: '8px',
            borderBottom: '1px solid #eee',
            textAlign: 'center',
            textTransform: 'uppercase',
        },
        patientInfoContainer: {
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            border: '1px solid #eee',
        },
        infoItem: {
            fontSize: '14px',
            margin: '5px 0',
            color: '#555',
        },
        infoLabel: {
            fontWeight: '600',
            color: '#555',
        },
        testsSection: {
            flex: 1,
            overflowY: 'auto',
        },
        testList: {
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
        },
        testItem: {
            padding: '10px',
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            fontSize: '14px',
            borderRadius: '4px',
            marginBottom: '5px',
        },
        activeTestItem: {
            backgroundColor: '#e1f0ff',
            fontWeight: '600',
        },
        editorContainer: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 15px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            gap: '5px',
            flexWrap: 'wrap',
        },
        toolbarGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '0 10px',
            borderRight: '1px solid #ddd',
        },
        toolbarButton: {
            padding: '6px 8px',
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            transition: 'background-color 0.2s',
        },
        activeToolbarButton: {
            backgroundColor: '#b3d4fc',
        },
        currentTestHeader: {
            padding: '15px 20px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2c3e50',
        },
        editor: {
            flex: 1,
            padding: '20px',
            border: 'none',
            outline: 'none',
            overflowY: 'auto',
            fontFamily: "'Times New Roman', serif",
            fontSize: '12pt',
            lineHeight: '1.5',
            backgroundColor: 'white',
            margin: '0',
            caretColor: 'black',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
        },
        buttonGroup: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            padding: '15px 20px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e0e0e0',
        },
        saveButton: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#3498db',
            color: 'white',
            fontWeight: '500',
            transition: 'all 0.2s',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        printButton: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#2ecc71',
            color: 'white',
            fontWeight: '500',
            transition: 'all 0.2s',
            fontSize: '14px',
            minWidth: '150px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        cancelButton: {
            padding: '10px 20px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            color: '#555',
            fontWeight: '500',
            transition: 'all 0.2s',
            fontSize: '14px',
            minWidth: '100px',
        },
        disabledButton: {
            opacity: 0.6,
            cursor: 'not-allowed',
            backgroundColor: '#95a5a6',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '18px',
            color: '#555',
        },
    };

    return (
        <>
            <ToastContainer />
            <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                    {/* Left Panel */}
                    <div style={styles.leftPanel}>
                        <div style={styles.sectionTitle}>Patient Information</div>
                        <div style={styles.patientInfoContainer}>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Name:</span> {patient.first_name} {patient.last_name}
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Age/Sex:</span> {patient.age}/{patient.sex}
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>File ID:</span> {patient.file_id}
                            </div>
                        </div>

                        <div style={styles.testsSection}>
                            <div style={styles.sectionTitle}>Radiology Tests</div>
                            <div style={styles.testList}>
                                {radiologyTests.map((test, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            ...styles.testItem,
                                            ...(activeEditor === index && styles.activeTestItem)
                                        }}
                                        onClick={() => setActiveEditor(index)}
                                        onMouseEnter={(e) => {
                                            if (activeEditor !== index) {
                                                e.currentTarget.style.backgroundColor = '#f0f7ff';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeEditor !== index) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {test}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div style={styles.rightPanel}>
                        {loading ? (
                            <div style={styles.loadingContainer}>
                                <CircularProgress size={40} />
                                <span style={{ marginLeft: '15px' }}>Loading radiology results...</span>
                            </div>
                        ) : error ? (
                            <div style={styles.loadingContainer}>
                                <span style={{ color: '#e74c3c' }}>{error}</span>
                            </div>
                        ) : (
                            <div style={styles.editorContainer}>
                                {/* Toolbar */}
                                <div style={styles.toolbar}>
                                    <div style={styles.toolbarGroup}>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={undo}
                                            title="Undo"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <UndoIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={redo}
                                            title="Redo"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <RedoIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                    </div>
                                    
                                    <div style={styles.toolbarGroup}>
                                        <button 
                                            style={{
                                                ...styles.toolbarButton,
                                                ...(formatStates.bold && styles.activeToolbarButton)
                                            }}
                                            onClick={() => executeCommand('bold')}
                                            title="Bold"
                                            onMouseEnter={(e) => !formatStates.bold && (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                            onMouseLeave={(e) => !formatStates.bold && (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <FormatBoldIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={{
                                                ...styles.toolbarButton,
                                                ...(formatStates.italic && styles.activeToolbarButton)
                                            }}
                                            onClick={() => executeCommand('italic')}
                                            title="Italic"
                                            onMouseEnter={(e) => !formatStates.italic && (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                            onMouseLeave={(e) => !formatStates.italic && (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <FormatItalicIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={{
                                                ...styles.toolbarButton,
                                                ...(formatStates.underline && styles.activeToolbarButton)
                                            }}
                                            onClick={() => executeCommand('underline')}
                                            title="Underline"
                                            onMouseEnter={(e) => !formatStates.underline && (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                                            onMouseLeave={(e) => !formatStates.underline && (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <FormatUnderlinedIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                    </div>
                                    
                                    <div style={styles.toolbarGroup}>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={() => executeCommand('justifyLeft')}
                                            title="Align Left"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FormatAlignLeftIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={() => executeCommand('justifyCenter')}
                                            title="Align Center"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FormatAlignCenterIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={() => executeCommand('justifyRight')}
                                            title="Align Right"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FormatAlignRightIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                    </div>
                                    
                                    <div style={styles.toolbarGroup}>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={() => executeCommand('insertUnorderedList')}
                                            title="Bullet List"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FormatListBulletedIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                        <button 
                                            style={styles.toolbarButton}
                                            onClick={() => executeCommand('insertOrderedList')}
                                            title="Numbered List"
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FormatListNumberedIcon fontSize="small" style={{ color: '#000000' }} />
                                        </button>
                                    </div>
                                    
                                    <div style={styles.toolbarGroup}>
                                        <select 
                                            style={{...styles.toolbarButton, minWidth: '80px', color: '#000000' }}
                                            onChange={(e) => executeCommand('formatBlock', e.target.value)}
                                            title="Paragraph Format"
                                        >
                                            <option value="p">Normal</option>
                                            <option value="h1">Heading 1</option>
                                            <option value="h2">Heading 2</option>
                                            <option value="h3">Heading 3</option>
                                            <option value="pre">Code</option>
                                        </select>
                                        
                                        <select 
                                            style={{...styles.toolbarButton, minWidth: '60px', color: '#000000' }}
                                            onChange={(e) => executeCommand('fontSize', e.target.value)}
                                            title="Font Size"
                                            defaultValue="3"
                                        >
                                            <option value="1">8pt</option>
                                            <option value="2">10pt</option>
                                            <option value="3">12pt</option>
                                            <option value="4">14pt</option>
                                            <option value="5">18pt</option>
                                            <option value="6">24pt</option>
                                            <option value="7">36pt</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Current Test Header */}
                                <div style={styles.currentTestHeader}>
                                    {radiologyTests[activeEditor] || 'Select a test'}
                                </div>

                                {/* Editor Area */}
                                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                    {radiologyTests.map((test, index) => (
                                        <div
                                            key={index}
                                            ref={(el) => handleEditorRef(el, index)}
                                            style={{
                                                ...styles.editor,
                                                display: activeEditor === index ? 'block' : 'none',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                            }}
                                            contentEditable
                                            onInput={handleInputChange}
                                            suppressContentEditableWarning={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={styles.buttonGroup}>
                            <button
                                style={{
                                    ...styles.cancelButton,
                                    ...(loading && styles.disabledButton)
                                }}
                                onClick={onClose}
                                disabled={loading}
                            >
                                Close
                            </button>
                            <button
                                style={{
                                    ...styles.printButton,
                                    ...(printLoading && styles.disabledButton),
                                }}
                                onClick={handlePrint}
                                disabled={printLoading}
                            >
                                {printLoading ? (
                                    <>
                                        <CircularProgress size={16} style={{ marginRight: '8px', color: 'white' }} />
                                        Generating PDF...
                                    </>
                                ) : (
                                    'Print Results'
                                )}
                            </button>
                            <button
                                style={{
                                    ...styles.saveButton,
                                    ...(!isChanged && styles.disabledButton),
                                    ...(loading && styles.disabledButton),
                                }}
                                onClick={handleSaveRadiologyChanges}
                                disabled={!isChanged || loading}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={16} style={{ marginRight: '8px', color: 'white' }} />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RadiologyResultsModal5;