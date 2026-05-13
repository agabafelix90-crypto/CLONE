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

const LabTemplatesPrompt = ({ token, onClose }) => {
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
  const textareaRef = useRef(null);

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
      const response = await fetch(urls.fetchLabTemplates, {
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
        content: templateContent
      };

      // Add ID and action if in edit mode
      if (editMode && currentTemplateId) {
        templateData.id = currentTemplateId;
        templateData.action = 'edit';
      }

      console.log('Saving template:', templateData);

      const response = await fetch(urls.savelabtemplates, {
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
          
          if (textareaRef.current) textareaRef.current.value = '';
          
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
      const response = await fetch(urls.deletelabTemplate, {
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
    if (textareaRef.current) {
      textareaRef.current.value = template.report;
    }
    showToast(`Loaded template: ${template.report_name}`, 'info');
  };

  const handleEditorChange = (e) => {
    setTemplateContent(e.target.value);
  };

  const clearEditor = () => {
    setTemplateName('');
    setTemplateContent('');
    setEditMode(false);
    setCurrentTemplateId(null);
    setShowNameError(false);
    if (textareaRef.current) {
      textareaRef.current.value = '';
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

  // Simple styling without formatting toolbar
  const simpleStyles = {
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
      fontFamily: 'Arial, sans-serif'
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
    editor: {
      flex: 1,
      padding: '20px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: 'Arial, sans-serif',
      overflowY: 'auto',
      backgroundColor: 'white',
      outline: 'none',
      border: '1px solid #e0e0e0',
      margin: '10px',
      borderRadius: '4px',
      resize: 'none'
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
    <div style={simpleStyles.container}>
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
      <div style={simpleStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>
            Lab Templates Editor {editMode && '(Editing)'}
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
      <div style={simpleStyles.mainContent}>
        {/* Sidebar - Templates List */}
        <div style={simpleStyles.sidebar}>
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
        <div style={simpleStyles.editorArea}>
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

          {/* Simple Textarea Editor */}
          <textarea
            ref={textareaRef}
            value={templateContent}
            onChange={handleEditorChange}
            style={simpleStyles.editor}
            placeholder="Start typing your lab template here... Type normally with spaces where necessary. No formatting options available."
            rows={20}
          />

          {/* Status Bar */}
          <div style={simpleStyles.statusBar}>
            <div>Characters: {templateContent.length}</div>
            <div>Lines: {templateContent.split('\n').length}</div>
          </div>

          {/* Action Buttons */}
          <div style={simpleStyles.actionButtons}>
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

export default LabTemplatesPrompt;