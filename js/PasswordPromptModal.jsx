import React from 'react';

function  PasswordPromptModal({ title, message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '5px',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ 
                    marginTop: 0,
                    color: '#333',
                    fontSize: '20px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '10px'
                }}>
                    {title}
                </h2>
                <p style={{
                    margin: '15px 0 20px',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: '#555'
                }}>
                    {message}
                </p>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '10px',
                    borderTop: '1px solid #eee',
                    paddingTop: '20px'
                }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#333',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9e9e9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                    >
                        Confirm Reverse
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PasswordPromptModal;