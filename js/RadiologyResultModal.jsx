import React, { useState, useRef, useEffect } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThirdTrimesterModal from './ThirdTrimesterModal';
import FirstTrimesterModal from './FirstTrimesterModal';
import SecondTrimesterModal from './SecondTrimesterModal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

function RadiologyResultModal({ patient, clinicDetails, token, onClose, totalRadiologyExams }) {
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState(null);
  const [showThirdTrimesterModal, setShowThirdTrimesterModal] = useState(false);
  const [showFirstTrimesterModal, setShowFirstTrimesterModal] = useState(false);
  const [showSecondTrimesterModal, setShowSecondTrimesterModal] = useState(false);
  const editorRef = useRef(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [showTrimesterDialog, setShowTrimesterDialog] = useState(false);
  const [selectedTrimester, setSelectedTrimester] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  useEffect(() => {
    // Start with empty editor
    const initialContent = '';
    setResults(initialContent);
    setHistory([initialContent]);
    setHistoryIndex(0);

    // Fetch ultrasound templates from backend
    fetchTemplates();
  }, []);

  // Separate effect to update format states
  useEffect(() => {
    const updateFormatState = () => {
      if (editorRef.current && document.activeElement === editorRef.current) {
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

    const handleMouseUp = () => {
      updateFormatState();
    };

    const handleKeyUp = () => {
      updateFormatState();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    if (editorRef.current) {
      editorRef.current.addEventListener('mouseup', handleMouseUp);
      editorRef.current.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener('mouseup', handleMouseUp);
        editorRef.current.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, []);

 const fetchTemplates = async () => {
  setTemplatesLoading(true);
  try {
    const response = await fetch(urls.fetchUltrasoundTemplates, {
      method: 'POST', // Changed to POST to send payload
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token // Include token in the payload
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        setTemplates(data.data);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } else {
      throw new Error('Failed to fetch templates');
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    toast.error('Failed to load ultrasound templates');
  } finally {
    setTemplatesLoading(false);
  }
};

  const formatRadiologyExams = (exams) => {
    if (!exams) return 'None';
    if (Array.isArray(exams)) return exams.join(', ');
    return exams;
  };

  // Organize templates by employee name, with "Clinic Pro" at the bottom
  const organizeTemplates = (templates) => {
    const clinicProTemplates = [];
    const otherTemplates = [];
    
    templates.forEach(template => {
      if (template.employee_name === 'Clinic Pro') {
        clinicProTemplates.push(template);
      } else {
        otherTemplates.push(template);
      }
    });
    
    return [...otherTemplates, ...clinicProTemplates];
  };

  // Fixed: Use debounced input handler to avoid interfering with typing
  const handleInputChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setResults(newContent);
      
      // Only update history after a short delay to avoid interrupting typing
      clearTimeout(window.historyTimeout);
      window.historyTimeout = setTimeout(() => {
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(newContent);
          return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
      }, 500);
    }
  };

  const executeCommand = (command, value = null) => {
    // Focus editor first
    editorRef.current.focus();
    
    // Execute command
    document.execCommand(command, false, value);
    
    // Update format states immediately
    setFormatStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
    
    // Save to history
    handleInputChange();
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setResults(history[newIndex]);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setResults(history[newIndex]);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const handleTemplateSelect = (template) => {
    if (editorRef.current) {
      const templateContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">${template.report.replace(/\n/g, '<br>')}</div>`;
      
      editorRef.current.innerHTML = templateContent;
      handleInputChange();
      editorRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(urls.submitradiologyresults, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_id: patient.file_id,
          contact_id: patient.contact_id,
          results: results,
          totalRadiologyExams: totalRadiologyExams,
          token: token
        })
      });
      
      if (response.ok) {
        toast.success('Radiology results submitted successfully!');
        setShowPrintDialog(true);
      } else {
        throw new Error('Failed to submit radiology results');
      }
    } catch (error) {
      console.error('Error submitting radiology results:', error);
      setError('Failed to submit results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    setShowPrintDialog(false);

    try {
      // Use the HTML content directly with formatting preserved
      const formattedResults = results;

      const printData = {
        clinicName: clinicDetails?.clinic_name || 'No Clinic Name Available',
        contact: clinicDetails?.owners_contact || 'No Contact Available',
        location: `${clinicDetails?.sub_county || ''}, ${clinicDetails?.district || ''}`,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientAge: patient.age,
        patientSex: patient.sex,
        radiologyTests: patient.radiology_exam || [],
        radiologyResults: formattedResults, // Send HTML content with formatting
        isHtmlContent: true // Flag to indicate HTML content
      };

      const response = await fetch(urls.pdfscan2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('PDF report generated successfully!');
    } catch (error) {
      setError("Failed to generate PDF");
      console.error("PDF generation error:", error);
      toast.error('Failed to generate PDF report');
    } finally {
      setPrintLoading(false);
      onClose();
    }
  };

  const handleObstetricReport = () => {
    setShowTrimesterDialog(true);
  };

  const handleTrimesterSelect = () => {
    setShowTrimesterDialog(false);
    if (selectedTrimester === '1') {
      setShowFirstTrimesterModal(true);
    } else if (selectedTrimester === '2') {
      setShowSecondTrimesterModal(true);
    } else if (selectedTrimester === '3') {
      setShowThirdTrimesterModal(true);
    }
  };

  const handlePrintDialogClose = (shouldPrint) => {
    if (shouldPrint) {
      handlePrint();
    } else {
      setShowPrintDialog(false);
      onClose();
    }
  };

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
      zIndex: 1000,
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
      overflow: 'hidden',
      padding: '20px',
    },
    rightPanel: {
      width: '70%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#3498db',
      margin: '0 0 20px 0',
      textAlign: 'center',
    },
    patientInfoContainer: {
      backgroundColor: '#ffffff',
      padding: '15px 20px',
      borderRadius: '6px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '20px',
      border: '1px solid #eee',
    },
    patientInfo: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '10px',
    },
    infoItem: {
      fontSize: '14px',
      margin: '5px 0',
    },
    infoLabel: {
      fontWeight: '600',
      color: '#555',
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
    templateSection: {
      flex: 1,
      overflowY: 'auto',
    },
    templateList: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #ddd',
      borderRadius: '5px',
      marginBottom: '15px',
    },
    templateItem: {
      padding: '10px 15px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      fontSize: '14px',
    },
    templateName: {
      fontWeight: '500',
      marginBottom: '2px',
    },
    templateAuthor: {
      fontSize: '12px',
      color: '#666',
      fontStyle: 'italic',
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
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '15px',
      padding: '15px 20px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e0e0e0',
    },
    submitButton: {
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
    obstetricButton: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      backgroundColor: '#2ecc71',
      color: 'white',
      fontWeight: '500',
      marginTop: '10px',
      width: '100%',
      fontSize: '14px',
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
      height: '100px',
    },
  };

  // Organize templates
  const organizedTemplates = organizeTemplates(templates);

  return (
    <>
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.leftPanel}>
            <div style={styles.sectionTitle}>Patient Information</div>
            
            <div style={styles.patientInfoContainer}>
              <div style={styles.patientInfo}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Name:</span> {`${patient.first_name} ${patient.last_name}`}
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Age/Sex:</span> {patient.age}/{patient.sex}
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>File ID:</span> {patient.file_id}
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Exams:</span> {formatRadiologyExams(patient.radiology_exam)}
                </div>
              </div>
            </div>

            <div style={styles.templateSection}>
              <div style={styles.sectionTitle}>Report Templates</div>
              
              {templatesLoading ? (
                <div style={styles.loadingContainer}>
                  <CircularProgress size={24} />
                </div>
              ) : (
                <>
                  <div style={styles.templateList}>
                    {organizedTemplates.map((template) => (
                      <div 
                        key={template.id}
                        style={styles.templateItem}
                        onClick={() => handleTemplateSelect(template)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={styles.templateName}>
                          {template.report_name}
                        </div>
                        <div style={styles.templateAuthor}>
                          by {template.employee_name}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                 {/* <button
                    style={styles.obstetricButton}
                    onClick={handleObstetricReport}
                  >
                    AI Obstetric Report Generator
                  </button>*/}
                </>
              )}
            </div>
          </div>

          <div style={styles.rightPanel}>
            <div style={styles.editorContainer}>
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

              <div
                ref={editorRef}
                style={styles.editor}
                contentEditable
                onInput={handleInputChange}
                suppressContentEditableWarning={true}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                style={{
                  ...styles.cancelButton,
                  ...(loading && styles.disabledButton)
                }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.submitButton,
                  ...(loading && styles.disabledButton),
                }}
                onClick={handleSubmit}
                disabled={loading || !results.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Results'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showTrimesterDialog} onClose={() => setShowTrimesterDialog(false)}>
        <DialogTitle>Select Pregnancy Trimester</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={selectedTrimester}
            onChange={(e) => setSelectedTrimester(e.target.value)}
          >
            <FormControlLabel 
              value="1" 
              control={<Radio />} 
              label="Early First Trimester (4 to 7 weeks)" 
            />
            <FormControlLabel 
              value="2" 
              control={<Radio />} 
              label="Late First Trimester and Early Second Trimester (8 to 14 weeks)" 
            />
            <FormControlLabel 
              value="3" 
              control={<Radio />} 
              label="Late 2nd Trimester and Third Trimester (18 to 40 weeks)" 
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTrimesterDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleTrimesterSelect} 
            color="primary" 
            disabled={!selectedTrimester}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPrintDialog} onClose={() => handlePrintDialogClose(false)}>
        <DialogTitle>Print Report</DialogTitle>
        <DialogContent>
          <p>Would you like to print a report of the radiology results?</p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handlePrintDialogClose(false)} 
            color="primary"
            disabled={printLoading}
          >
            No, Close
          </Button>
          <Button 
            onClick={() => handlePrintDialogClose(true)} 
            color="primary"
            disabled={printLoading}
            startIcon={printLoading ? <CircularProgress size={20} /> : null}
          >
            {printLoading ? 'Generating PDF...' : 'Yes, Print'}
          </Button>
        </DialogActions>
      </Dialog>

      {showFirstTrimesterModal && (
        <FirstTrimesterModal
          patient={patient}
          onClose={() => setShowFirstTrimesterModal(false)}
          clinicDetails={clinicDetails}
          token={token}
          totalRadiologyExams={totalRadiologyExams}
        />
      )}
      {showSecondTrimesterModal && (
        <SecondTrimesterModal
          patient={patient}
          onClose={() => setShowSecondTrimesterModal(false)}
          clinicDetails={clinicDetails}
          token={token}
          totalRadiologyExams={totalRadiologyExams}
        />
      )}
      {showThirdTrimesterModal && (
        <ThirdTrimesterModal
          patient={patient}
          onClose={() => setShowThirdTrimesterModal(false)}
          clinicDetails={clinicDetails}
          token={token}
          totalRadiologyExams={totalRadiologyExams}
        />
      )}
    </>
  );
}

export default RadiologyResultModal;