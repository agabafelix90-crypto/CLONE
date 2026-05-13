import React, { useState, useRef, useEffect } from 'react';

const InvestigationModal = ({ 
    title, 
    tests, 
    selectedTests, 
    setSelectedTests, 
    onSubmit, 
    onClose, 
    submitting 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    const scrollableListRef = useRef(null);

    // Store the current scroll position when modal opens
    const scrollPositionRef = useRef({ x: 0, y: 0 });

    // Sort tests alphabetically and filter based on search term
    const filteredTests = [...tests]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(test => 
            test.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Calculate total amount for selected tests
    const calculateTotalAmount = () => {
        return selectedTests.reduce((total, testName) => {
            const test = tests.find(t => t.name === testName);
            return total + (test ? Math.round(test.price) : 0);
        }, 0);
    };

    const totalAmount = calculateTotalAmount();
    const selectedCount = selectedTests.length;

    // Handle clicks inside modal to prevent closing
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    // Handle test selection
    const handleTestSelect = (testName) => {
        setSelectedTests(prev => 
            prev.includes(testName)
                ? prev.filter(t => t !== testName)
                : [...prev, testName]
        );
    };

    // Handle modal close with scroll preservation
    const handleClose = () => {
        // Restore the original scroll position before closing
        window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
        onClose();
    };

    // Focus search input when modal opens and store scroll position
    useEffect(() => {
        // Store current scroll position
        scrollPositionRef.current = {
            x: window.scrollX,
            y: window.scrollY
        };

        // Focus search input without causing scroll
        if (searchInputRef.current) {
            const input = searchInputRef.current;
            // Use setTimeout to ensure this runs after the modal is rendered
            setTimeout(() => {
                input.focus({ preventScroll: true });
            }, 0);
        }

        // Manually scroll the test list to top
        if (scrollableListRef.current) {
            scrollableListRef.current.scrollTop = 0;
        }
    }, []);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        // Store current scroll position again to be safe
        scrollPositionRef.current = {
            x: window.scrollX,
            y: window.scrollY
        };

        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = 'unset';
            // Restore scroll position when component unmounts
            requestAnimationFrame(() => {
                window.scrollTo(scrollPositionRef.current.x, scrollPositionRef.current.y);
            });
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }} onClick={handleClose}>
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                width: '500px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                overflow: 'hidden'
            }} onClick={handleModalClick}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#000',
                    marginTop: 0,
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {title}
                    <button onClick={handleClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#7f8c8d',
                        padding: '0 5px'
                    }}>×</button>
                </h2>
                
                {/* Search input */}
                <div style={{ marginBottom: '15px' }}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* Selected tests summary */}
                {selectedCount > 0 && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '12px 15px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            <span style={{ color: '#000' }}>
                                {selectedCount} test{selectedCount !== 1 ? 's' : ''} selected
                            </span>
                            <span style={{ 
                                color: '#27ae60',
                                fontWeight: '600'
                            }}>
                                Total: UGX {totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Tests list */}
                <div 
                    ref={scrollableListRef}
                    style={{ 
                        flex: 1,
                        overflowY: 'auto',
                        marginBottom: '20px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        maxHeight: '350px'
                    }}
                >
                    {filteredTests.length > 0 ? (
                        filteredTests.map(test => (
                            <div key={test.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 15px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: selectedTests.includes(test.name) ? '#f5f5f5' : 'white',
                                transition: 'background-color 0.2s'
                            }}>
                                <input
                                    type="checkbox"
                                    id={`test-${test.name}`}
                                    checked={selectedTests.includes(test.name)}
                                    onChange={() => handleTestSelect(test.name)}
                                    style={{
                                        marginRight: '12px',
                                        cursor: 'pointer',
                                        accentColor: '#27ae60'
                                    }}
                                />
                                <label 
                                    htmlFor={`test-${test.name}`} 
                                    style={{
                                        flex: 1,
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#000'
                                    }}
                                >
                                    {test.name}
                                </label>
                                <span style={{
                                    color: '#000',
                                    fontWeight: '500',
                                    fontSize: '13px'
                                }}>UGX {Math.round(test.price).toLocaleString()}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#777'
                        }}>
                            No tests found matching your search
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee'
                }}>
                    <button onClick={handleClose} style={{
                        backgroundColor: '#e0e0e0',
                        color: '#333',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>
                        Cancel
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSubmit();
                        }} 
                        disabled={submitting || selectedTests.length === 0}
                        style={{
                            backgroundColor: selectedTests.length > 0 ? '#27ae60' : '#cccccc',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: selectedTests.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {submitting ? 'Submitting...' : `Submit (${selectedTests.length} selected)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvestigationModal;