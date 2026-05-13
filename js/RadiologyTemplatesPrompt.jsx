import React, { useState, useEffect, useRef } from 'react';
import { urls } from './config.dev';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  const backgroundColor = type === 'success' ? '#4caf50' : 
                         type === 'error' ? '#f44336' : 
                         type === 'warning' ? '#ff9800' : '#2196f3';
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: backgroundColor,
      color: 'white',
      padding: '15px 20px',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 3000,
      minWidth: '300px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '15px',
          fontWeight: 'bold'
        }}
      >
        ×
      </button>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

const RadiologyTemplatesPrompt = ({ token, onClose }) => {
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showNameError, setShowNameError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, template: null });
  const [editMode, setEditMode] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [toast, setToast] = useState(null);
  const editorRef = useRef(null);

  // Formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState('left');
  const [fontSize, setFontSize] = useState('3');
  const [fontFamily, setFontFamily] = useState('Arial');

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Close toast manually
  const closeToast = () => {
    setToast(null);
  };

  // Fetch existing templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(urls.fetchUltrasoundTemplates, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          // Filter out templates where employee_name is "Clinic Pro"
          const filteredTemplates = data.data.filter(template => 
            template.employee_name !== 'Clinic Pro' && template.employee_name !== null
          );
          setTemplates(filteredTemplates);
        } else {
          console.error('Unexpected response format:', data);
          setTemplates([]);
        }
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const handleFormat = (format, value = null) => {
    if (format === 'fontSize') {
      document.execCommand('fontSize', false, value);
      setFontSize(value);
    } else if (format === 'fontName') {
      document.execCommand('fontName', false, value);
      setFontFamily(value);
    } else {
      document.execCommand(format, false, null);
    }
    updateFormatState();
  };

  const handleAlignment = (align) => {
    document.execCommand('justifyLeft', false, null);
    if (align === 'left') document.execCommand('justifyLeft', false, null);
    else if (align === 'center') document.execCommand('justifyCenter', false, null);
    else if (align === 'right') document.execCommand('justifyRight', false, null);
    else if (align === 'justify') document.execCommand('justifyFull', false, null);
    setAlignment(align);
  };

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const container = selection.getRangeAt(0).commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container;
      
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        setFontFamily(computedStyle.fontFamily.split(',')[0].replace(/["']/g, ''));
      }
    }
  };

  const validateTemplateName = () => {
    if (!templateName.trim()) {
      setShowNameError(true);
      setSaveStatus('Please enter a template name');
      return false;
    }
    setShowNameError(false);
    return true;
  };

  const handleSaveTemplate = async () => {
    // Validate template name first
    if (!validateTemplateName()) {
      return;
    }

    if (!templateContent.trim()) {
      setSaveStatus('Template content cannot be empty');
      showToast('Template content cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      const templateData = {
        token: token,
        name: templateName.trim(),
        content: templateContent,
        format: 'html'
      };

      // Add ID and action if in edit mode
      if (editMode && currentTemplateId) {
        templateData.id = currentTemplateId;
        templateData.action = 'edit';
      }

      console.log('Saving template:', templateData);

      const response = await fetch(urls.saveTemplate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        
        // Check if the response indicates a duplicate name error
        if (result && result.error && result.error.includes('already exists')) {
          const errorMessage = 'A template with this name already exists in your clinic. Please use a different name.';
          setSaveStatus(errorMessage);
          showToast(errorMessage, 'error');
        } else {
          const successMessage = editMode ? 'Template updated successfully!' : 'Template saved successfully!';
          setSaveStatus(successMessage);
          showToast(successMessage, 'success');
          
          // Reset form
          setTemplateName('');
          setTemplateContent('');
          setEditMode(false);
          setCurrentTemplateId(null);
          
          if (editorRef.current) editorRef.current.innerHTML = '';
          
          await fetchTemplates();
          
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } else {
        const errorResult = await response.json();
        // Check if the error response indicates a duplicate name
        if (errorResult && errorResult.error && errorResult.error.includes('already exists')) {
          const errorMessage = 'A template with this name already exists in your clinic. Please use a different name.';
          setSaveStatus(errorMessage);
          showToast(errorMessage, 'error');
        } else {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          const errorMessage = `Failed to save template: ${response.status} ${response.statusText}`;
          setSaveStatus(errorMessage);
          showToast(errorMessage, 'error');
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      // Check if error message contains duplicate name indication
      if (error.message && error.message.includes('already exists')) {
        const errorMessage = 'A template with this name already exists in your clinic. Please use a different name.';
        setSaveStatus(errorMessage);
        showToast(errorMessage, 'error');
      } else {
        const errorMessage = `Error saving template: ${error.message}`;
        setSaveStatus(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirm.template) return;

    const { template, confirmText } = deleteConfirm;
    
    if (confirmText !== 'yes') {
      setSaveStatus('Please type "yes" to confirm deletion');
      showToast('Please type "yes" to confirm deletion', 'warning');
      return;
    }

    try {
      const response = await fetch(urls.deleteTemplate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          id: template.id
        })
      });

      if (response.ok) {
        const successMessage = 'Template deleted successfully!';
        setSaveStatus(successMessage);
        showToast(successMessage, 'success');
        setDeleteConfirm({ show: false, template: null, confirmText: '' });
        await fetchTemplates();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = 'Error deleting template. Please try again.';
      setSaveStatus(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const confirmDelete = (template) => {
    setDeleteConfirm({ 
      show: true, 
      template: template, 
      confirmText: '' 
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, template: null, confirmText: '' });
  };

  const loadTemplate = (template) => {
    setTemplateName(template.report_name);
    setTemplateContent(template.report);
    setEditMode(true);
    setCurrentTemplateId(template.id);
    setShowNameError(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = template.report;
    }
    showToast(`Loaded template: ${template.report_name}`, 'info');
  };

  const handleEditorChange = (e) => {
    setTemplateContent(e.target.innerHTML);
  };

  const clearEditor = () => {
    setTemplateName('');
    setTemplateContent('');
    setEditMode(false);
    setCurrentTemplateId(null);
    setShowNameError(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setSaveStatus('');
    showToast('Editor cleared. Ready to create new template.', 'info');
  };

  const handleTemplateNameChange = (e) => {
    setTemplateName(e.target.value);
    if (showNameError && e.target.value.trim()) {
      setShowNameError(false);
      setSaveStatus('');
    }
  };

  // Trash bin icon component
  const TrashIcon = () => (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="3,6 5,6 21,6"></polyline>
      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );

  // Microsoft Word-like styling without blue lines
  const wordLikeStyles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      fontFamily: 'Calibri, Arial, sans-serif'
    },
    header: {
      backgroundColor: '#2d6099',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #1e4a7a'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      height: 'calc(100vh - 120px)',
      backgroundColor: 'white'
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#f8f8f8',
      borderRight: '1px solid #e0e0e0',
      padding: '20px',
      overflowY: 'auto'
    },
    editorArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white'
    },
    toolbar: {
      backgroundColor: '#f3f3f3',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 15px',
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      whiteSpace: 'nowrap'
    },
    toolbarGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      marginRight: '15px',
      paddingRight: '15px',
      borderRight: '1px solid #d0d0d0',
      flexShrink: 0
    },
    toolbarButton: {
      padding: '6px 8px',
      backgroundColor: 'transparent',
      border: '1px solid transparent',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
      minWidth: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'black',
      fontWeight: 'normal'
    },
    toolbarButtonActive: {
      backgroundColor: '#e0e0e0',
      border: '1px solid #b0b0b0'
    },
    editor: {
      flex: 1,
      padding: '40px',
      fontSize: '12pt',
      lineHeight: '1.15',
      fontFamily: 'Calibri, Arial, sans-serif',
      overflowY: 'auto',
      backgroundColor: 'white',
      outline: 'none',
      minHeight: '200px'
    },
    statusBar: {
      backgroundColor: '#2d6099',
      color: 'white',
      padding: '5px 15px',
      fontSize: '12px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    actionButtons: {
      padding: '15px 20px',
      backgroundColor: '#f8f8f8',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    }
  };

  return (
    <div style={wordLikeStyles.container}>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            width: '400px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#d32f2f' }}>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete template "<strong>{deleteConfirm.template?.report_name}</strong>"?
              This action cannot be undone.
           
            </p>
            <p>Type "yes" to confirm:</p>
            <input
              type="text"
              value={deleteConfirm.confirmText}
              onChange={(e) => setDeleteConfirm(prev => ({ ...prev, confirmText: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                marginBottom: '15px'
              }}
              placeholder="Type 'yes' to confirm"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteConfirm.confirmText !== 'yes'}
                style={{
                  padding: '8px 15px',
                  backgroundColor: deleteConfirm.confirmText === 'yes' ? '#d32f2f' : '#f5f5f5',
                  color: deleteConfirm.confirmText === 'yes' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: deleteConfirm.confirmText === 'yes' ? 'pointer' : 'not-allowed'
                }}
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={wordLikeStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>
            Radiology Templates Editor {editMode && '(Editing)'}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '6px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Close
        </button>
      </div>

      {/* Main Content */}
      <div style={wordLikeStyles.mainContent}>
        {/* Sidebar - Templates List */}
        <div style={wordLikeStyles.sidebar}>
          <h3 style={{ marginBottom: '15px', fontSize: '14px', color: '#333' }}>
            Available Templates
          </h3>
          {templates.length === 0 ? (
            <p style={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
              No templates available
            </p>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {templates.map((template, index) => (
                <div
                  key={template.id || index}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    position: 'relative'
                  }}
                >
                  <div
                    onClick={() => loadTemplate(template)}
                    style={{ paddingRight: '60px' }}
                  >
                    <strong style={{ fontSize: '13px' }}>{template.report_name}</strong>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '11px',
                      marginTop: '4px'
                    }}>
                      Created by: {template.employee_name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(template);
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      padding: '4px 6px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                    title="Delete Template"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div style={wordLikeStyles.editorArea}>
          {/* Template Name Input */}
          <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f8f8',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Template Name (Required)"
                value={templateName}
                onChange={handleTemplateNameChange}
                style={{
                  width: '300px',
                  padding: '6px 10px',
                  border: `1px solid ${showNameError ? '#d32f2f' : '#ccc'}`,
                  borderRadius: '3px',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: showNameError ? '#ffebee' : 'white'
                }}
              />
              {showNameError && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  color: '#d32f2f',
                  fontSize: '11px',
                  marginTop: '2px'
                }}>
                  Please enter a template name
                </div>
              )}
            </div>
            
            {saveStatus && (
              <span style={{
                fontSize: '12px',
                color: saveStatus.includes('Error') || saveStatus.includes('already exists') ? '#d32f2f' : 
                       saveStatus.includes('successfully') ? '#388e3c' : '#1976d2'
              }}>
                {saveStatus}
              </span>
            )}
          </div>

          {/* Formatting Toolbar */}
          <div style={wordLikeStyles.toolbar}>
            {/* Font Group */}
            <div style={wordLikeStyles.toolbarGroup}>
              <select
                value={fontFamily}
                onChange={(e) => handleFormat('fontName', e.target.value)}
                style={{
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: '12px',
                  width: '120px'
                }}
              >
                <option value="Arial">Arial</option>
                <option value="Calibri">Calibri</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              
              <select
                value={fontSize}
                onChange={(e) => handleFormat('fontSize', e.target.value)}
                style={{
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  fontSize: '12px',
                  width: '60px',
                  marginLeft: '5px'
                }}
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

            {/* Formatting Group */}
            <div style={wordLikeStyles.toolbarGroup}>
              <button
                onClick={() => handleFormat('bold')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(isBold ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Bold"
              >
                <strong style={{ color: 'black' }}>B</strong>
              </button>
              <button
                onClick={() => handleFormat('italic')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(isItalic ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Italic"
              >
                <em style={{ color: 'black', fontStyle: 'italic' }}>I</em>
              </button>
              <button
                onClick={() => handleFormat('underline')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(isUnderline ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Underline"
              >
                <u style={{ color: 'black', textDecoration: 'underline' }}>U</u>
              </button>
            </div>

            {/* Alignment Group */}
            <div style={wordLikeStyles.toolbarGroup}>
              <button
                onClick={() => handleAlignment('left')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(alignment === 'left' ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Align Left"
              >
                <span style={{ color: 'black' }}>≡</span>
              </button>
              <button
                onClick={() => handleAlignment('center')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(alignment === 'center' ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Align Center"
              >
                <span style={{ color: 'black' }}>≡</span>
              </button>
              <button
                onClick={() => handleAlignment('right')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(alignment === 'right' ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Align Right"
              >
                <span style={{ color: 'black' }}>≡</span>
              </button>
              <button
                onClick={() => handleAlignment('justify')}
                style={{
                  ...wordLikeStyles.toolbarButton,
                  ...(alignment === 'justify' ? wordLikeStyles.toolbarButtonActive : {})
                }}
                title="Justify"
              >
                <span style={{ color: 'black' }}>≡</span>
              </button>
            </div>

            {/* List Group */}
            <div style={wordLikeStyles.toolbarGroup}>
              <button
                onClick={() => handleFormat('insertUnorderedList')}
                style={wordLikeStyles.toolbarButton}
                title="Bullet List"
              >
                <span style={{ color: 'black' }}>• List</span>
              </button>
              <button
                onClick={() => handleFormat('insertOrderedList')}
                style={wordLikeStyles.toolbarButton}
                title="Numbered List"
              >
                <span style={{ color: 'black' }}>1. List</span>
              </button>
            </div>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorChange}
            onKeyUp={updateFormatState}
            onMouseUp={updateFormatState}
            style={wordLikeStyles.editor}
            placeholder="Start typing your radiology template here..."
          />

          {/* Status Bar */}
          <div style={wordLikeStyles.statusBar}>
            <div>Words: {templateContent.split(/\s+/).filter(word => word.length > 0).length}</div>
            <div>Page 1</div>
          </div>

          {/* Action Buttons */}
          <div style={wordLikeStyles.actionButtons}>
            <button
              onClick={clearEditor}
              style={{
                padding: '8px 15px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              New Template
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              style={{
                padding: '8px 15px',
                backgroundColor: isSaving ? '#6c757d' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isSaving ? 'Saving...' : (editMode ? 'Update Template' : 'Save Template')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyTemplatesPrompt;