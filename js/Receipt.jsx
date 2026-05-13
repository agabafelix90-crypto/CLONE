import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPrint, faTimes, faReceipt } from '@fortawesome/free-solid-svg-icons';

const Receipt = ({
  receiptDetails,
  setShowReceipt,
}) => {
  console.log('=== RECEIPT COMPONENT PROPS ===');
  console.log('receiptDetails:', receiptDetails);
  console.log('===============================');

  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [receiptSize, setReceiptSize] = useState('80mm');

  // Format currency with commas
  const formatCurrency = (amount) => {
    return amount ? Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  // Extract data from receiptDetails
  const {
    clinicName = '',
    town = '',
    district = '',
    ownersContact = '',
    patientName = '',
    patientAge = '',
    patientId = '',
    totalBill = 0,
    totalPaid = 0,
    balance = 0,
    paymentBreakdown = {},
    transactionDetails = {},
    totalBalanceDue = 0
  } = receiptDetails;

  // Extract payment breakdown details
  const {
    services = [],
    treatment = [],
    consultation = [],
    laboratory = [],
    radiology = [],
    family_planning = [],
    credits = []
  } = paymentBreakdown;

  // Extract transaction details
  const {
    amountReceived = 0,
    amountUsed = 0,
    change = 0
  } = transactionDetails;

  // FIXED: Calculate remaining balance correctly
  const remainingBalance = (totalBalanceDue || totalBill) - amountUsed;
  
  // Check if all bills are cleared based on the correct calculation
  const isAllBillsCleared = remainingBalance === 0;

  // Helper function to get display names for categories
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'laboratory': 'LAB',
      'radiology': 'RADIOLOGY',
      'consultation': 'CONSULTATION',
      'treatment': 'TREATMENT',
      'family_planning': 'FAMILY PLANNING',
      'services': 'SERVICES',
      'credits': 'DEBTS',
      'general': 'GENERAL'
    };
    return categoryMap[category] || category.toUpperCase();
  };

  // Clean descriptions
  const cleanDescription = (description, category) => {
    if (!description) return '';
    
    let cleaned = description.trim();
    
    if (category === 'laboratory') {
      cleaned = cleaned.replace(/^(Lab tests?:\s*)?Lab Test:\s*/i, '');
      cleaned = cleaned.replace(/^Laboratory:\s*/i, '');
      cleaned = cleaned.replace(/^Lab:\s*/i, '');
      cleaned = cleaned.replace(/\s+for file \d+$/i, '');
    } else if (category === 'radiology') {
      cleaned = cleaned.replace(/^(Radiology exams?:\s*)?Radiology Exam:\s*/i, '');
      cleaned = cleaned.replace(/^Radiology:\s*/i, '');
      cleaned = cleaned.replace(/^Radio:\s*/i, '');
      cleaned = cleaned.replace(/\s+for file \d+$/i, '');
    }
    
    return cleaned.trim();
  };

  // Function to wrap text for PDF - NEW FUNCTION
  const wrapText = (text, maxLength) => {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine === '' ? '' : ' ') + word;
      } else {
        if (currentLine !== '') {
          lines.push(currentLine);
        }
        // If a single word is longer than maxLength, break it
        if (word.length > maxLength) {
          for (let i = 0; i < word.length; i += maxLength) {
            lines.push(word.substring(i, i + maxLength));
          }
          currentLine = '';
        } else {
          currentLine = word;
        }
      }
    });

    if (currentLine !== '') {
      lines.push(currentLine);
    }

    return lines;
  };

  // Function to render payment details
  const renderPaymentDetails = () => {
    const sections = [];
    
    // Services payments
    if (services && services.length > 0) {
      services.forEach((service) => {
        sections.push({
          description: service.description || service.service_name || `MVA service`,
          amount: service.amount || 0,
          category: 'services'
        });
      });
    }
    
    // Treatment payments
    if (treatment && treatment.length > 0) {
      treatment.forEach((treatmentItem) => {
        sections.push({
          description: treatmentItem.description || `Treatment`,
          amount: treatmentItem.amount || 0,
          category: 'treatment'
        });
      });
    }
    
    // Consultation payments
    if (consultation && consultation.length > 0) {
      consultation.forEach((consult) => {
        sections.push({
          description: consult.description || `Consultation`,
          amount: consult.amount || 0,
          category: 'consultation'
        });
      });
    }
    
    // Laboratory payments
    if (laboratory && laboratory.length > 0) {
      laboratory.forEach((lab) => {
        const rawDescription = lab.description || `Laboratory Test`;
        const cleanedDescription = cleanDescription(rawDescription, 'laboratory');
        sections.push({
          description: cleanedDescription || 'Lab Test',
          amount: lab.amount || 0,
          category: 'laboratory'
        });
      });
    }
    
    // Radiology payments
    if (radiology && radiology.length > 0) {
      radiology.forEach((radio) => {
        const rawDescription = radio.description || `Radiology Service`;
        const cleanedDescription = cleanDescription(rawDescription, 'radiology');
        sections.push({
          description: cleanedDescription || 'Radio Service',
          amount: radio.amount || 0,
          category: 'radiology'
        });
      });
    }
    
    // Family Planning payments
    if (family_planning && family_planning.length > 0) {
      family_planning.forEach((fp) => {
        sections.push({
          description: fp.description || `Family Planning`,
          amount: fp.amount || 0,
          category: 'family_planning'
        });
      });
    }
    
    // Credits payments
    if (credits && credits.length > 0) {
      credits.forEach((credit) => {
        let description = credit.description || `Credit Payment`;
        if (description.toLowerCase().includes('unspecified credit payment')) {
          description = 'Debt on unspecified files';
        }
        sections.push({
          description: description,
          amount: credit.amount || 0,
          category: 'credits'
        });
      });
    }

    return sections;
  };

  const paymentSections = renderPaymentDetails();

  // Function to draw broken/dashed line
  const drawBrokenLine = (doc, x1, y1, x2, y2, dashLength = 2, gapLength = 1.5) => {
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    
    const totalLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dashCount = Math.floor(totalLength / (dashLength + gapLength));
    
    for (let i = 0; i < dashCount; i++) {
      const startDistance = i * (dashLength + gapLength);
      const endDistance = startDistance + dashLength;
      
      const startX = x1 + startDistance * Math.cos(angle);
      const startY = y1 + startDistance * Math.sin(angle);
      const endX = x1 + endDistance * Math.cos(angle);
      const endY = y1 + endDistance * Math.sin(angle);
      
      doc.line(startX, startY, endX, endY);
    }
  };

  const printReceipt = () => {
    setLoading(true);
    
    setTimeout(() => {
      if (receiptSize === '80mm') {
        print80mmReceipt();
      } else {
        printA4Receipt();
      }
      
      setLoading(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }, 500);
  };

  const print80mmReceipt = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 297],
      orientation: 'portrait'
    });

    let yPos = 5;
    const pageWidth = 80;
    const margin = 3;
    const maxCharsPerLine = 35; // Maximum characters per line for 80mm receipt
    
    // Set all text to bold
    doc.setFont('helvetica', 'bold');
    
    // Header Section
    doc.setFontSize(11);
    doc.text(clinicName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFontSize(8);
    doc.text(`${town}, ${district}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;
    doc.text(`Tel: ${ownersContact}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // Divider line
    drawBrokenLine(doc, margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    // Receipt title
    doc.setFontSize(10);
    doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // Date and time
    doc.setFontSize(7);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    doc.text(`Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
    
    // Client details
    doc.setFontSize(8);
    doc.text('CLIENT:', margin, yPos);
    yPos += 3;
    
    doc.setFontSize(7);
    doc.text(`Name: ${patientName || 'N/A'}`, margin, yPos);
    yPos += 2.5;
    doc.text(`Age: ${patientAge || 'N/A'} ID: ${patientId || 'N/A'}`, margin, yPos);
    yPos += 4;

    // Payment Breakdown Section
    if (paymentSections.filter(section => section.amount > 0).length > 0) {
      doc.setFontSize(8);
      doc.text('PAYMENTS:', margin, yPos);
      yPos += 3;
      
      doc.setFontSize(7);

      // Group payments by category
      const groupedPayments = {};
      paymentSections
        .filter(section => section.amount > 0)
        .forEach(section => {
          const category = section.category || 'general';
          if (!groupedPayments[category]) {
            groupedPayments[category] = [];
          }
          groupedPayments[category].push(section);
        });

      // Display each category
      Object.keys(groupedPayments).forEach(category => {
        const categoryPayments = groupedPayments[category];
        
        if (yPos > 280) {
          doc.addPage();
          yPos = 10;
        }
        
        doc.setFontSize(7);
        const categoryName = getCategoryDisplayName(category);
        doc.text(`${categoryName}:`, margin, yPos);
        yPos += 2.5;
        
        doc.setFontSize(7);
        
        // List items under category
        categoryPayments.forEach(section => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 10;
          }
          
          const wrappedDescription = wrapText(section.description, maxCharsPerLine);
          
          // Print each line of the wrapped description
          wrappedDescription.forEach((line, index) => {
            if (yPos > 280) {
              doc.addPage();
              yPos = 10;
            }
            
            if (index === wrappedDescription.length - 1) {
              // Last line - show amount on the same line if there's space
              const amountText = `UGX ${formatCurrency(section.amount)}`;
              const lineWithAmount = `${line} ${amountText}`;
              
              if (doc.getTextWidth(lineWithAmount) < (pageWidth - (margin * 2))) {
                doc.text(lineWithAmount, margin, yPos);
                yPos += 2.5;
              } else {
                doc.text(line, margin, yPos);
                yPos += 2.5;
                doc.text(amountText, margin + 5, yPos);
                yPos += 2.5;
              }
            } else {
              doc.text(line, margin, yPos);
              yPos += 2.5;
            }
          });
        });
        
        yPos += 1;
      });
      
      yPos += 2;
    }

    // Transaction Summary
    doc.setFontSize(8);
    doc.text('SUMMARY:', margin, yPos);
    yPos += 3;
    
    doc.setFontSize(7);
    
    const summaryItems = [
      { label: 'Total Due', amount: totalBalanceDue || totalBill },
      ,
      { label: 'Amount Paid', amount: amountUsed },
    ];
    
    summaryItems.forEach(item => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 10;
      }
      
      doc.text(`${item.label}: UGX ${formatCurrency(item.amount)}`, margin, yPos);
      yPos += 2.5;
    });
    
    yPos += 2;

    // Balance Section - FIXED: Use the correct remainingBalance calculation
    doc.setFontSize(9);
    
    doc.text(`BALANCE: UGX ${formatCurrency(remainingBalance)}`, margin, yPos);
    yPos += 4;
    
    // All Bills Cleared Message - FIXED: Use the correct isAllBillsCleared calculation
    if (isAllBillsCleared) {
      doc.setTextColor(0, 128, 0);
      doc.setFontSize(8);
      doc.text('*** ALL BILLS CLEARED ***', pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 4;
    }
    
    yPos += 6;
    
    // Footer
    doc.setFontSize(6);
    doc.text('Goods/services once sold are not returnable', pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;
    
    doc.setFontSize(5);
    doc.text('Software by Gold Quest E-Systems | Tel: 0786747733', pageWidth / 2, yPos, { align: 'center' });
    
    // Save and open PDF
    doc.save('payment_receipt.pdf');
    window.open(doc.output('bloburl'), '_blank');
  };

  const printA4Receipt = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    let yPos = 15;
    const pageWidth = 210;
    const margin = 20;
    const maxCharsPerLine = 60; // Maximum characters per line for A4 receipt
    
    // Set all text to bold
    doc.setFont('helvetica', 'bold');
    
    // Header Section
    doc.setFontSize(16);
    doc.text(clinicName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFontSize(10);
    doc.text(`${town}, ${district}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text(`Tel: ${ownersContact}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Divider line
    drawBrokenLine(doc, margin, yPos, pageWidth - margin, yPos, 3, 2);
    yPos += 6;
    
    // Receipt title
    doc.setFontSize(14);
    doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Date and time
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    doc.text(`Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    
    // Client details
    doc.setFontSize(12);
    doc.text('CLIENT DETAILS', margin, yPos);
    yPos += 4;
    
    doc.setFontSize(12);
    doc.text(`Name: ${patientName || 'N/A'}`, margin, yPos);
    doc.text(`Age: ${patientAge || 'N/A'} ID: ${patientId || 'N/A'}`, margin + 60, yPos);
    yPos += 6;

    // Payment Breakdown Section
    if (paymentSections.filter(section => section.amount > 0).length > 0) {
      doc.setFontSize(12);
      doc.text('PAYMENT BREAKDOWN', margin, yPos);
      yPos += 4;
      
      doc.setFontSize(9);
      
      // Group payments by category
      const groupedPayments = {};
      paymentSections
        .filter(section => section.amount > 0)
        .forEach(section => {
          const category = section.category || 'general';
          if (!groupedPayments[category]) {
            groupedPayments[category] = [];
          }
          groupedPayments[category].push(section);
        });

      // Display each category
      Object.keys(groupedPayments).forEach(category => {
        const categoryPayments = groupedPayments[category];
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        const categoryName = getCategoryDisplayName(category);
        doc.text(`${categoryName}:`, margin, yPos);
        yPos += 3.5;
        
        doc.setFontSize(9);
        
        // List items under category
        categoryPayments.forEach(section => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const wrappedDescription = wrapText(section.description, maxCharsPerLine);
          
          // Print each line of the wrapped description
          wrappedDescription.forEach((line, index) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            if (index === wrappedDescription.length - 1) {
              // Last line - show amount on the same line if there's space
              const amountText = `UGX ${formatCurrency(section.amount)}`;
              const lineWithAmount = `${line} ${amountText}`;
              
              if (doc.getTextWidth(lineWithAmount) < (pageWidth - (margin * 2))) {
                doc.text(lineWithAmount, margin + 5, yPos);
                yPos += 3.5;
              } else {
                doc.text(line, margin + 5, yPos);
                yPos += 3.5;
                doc.text(amountText, margin + 10, yPos);
                yPos += 3.5;
              }
            } else {
              doc.text(line, margin + 5, yPos);
              yPos += 3.5;
            }
          });
        });
        
        yPos += 2;
      });
      
      yPos += 4;
    }

    // Transaction Summary
    doc.setFontSize(12);
    doc.text('TRANSACTION SUMMARY', margin, yPos);
    yPos += 4;
    
    doc.setFontSize(9);
    
    const summaryItems = [
      { label: 'Total Amount Due', amount: totalBalanceDue || totalBill },
     
      { label: 'Amount Paid', amount: amountUsed },
    ];
    
    summaryItems.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(`${item.label}: UGX ${formatCurrency(item.amount)}`, margin, yPos);
      yPos += 4;
    });
    
    yPos += 6;

    // Balance Section - FIXED: Use the correct remainingBalance calculation
    doc.setFontSize(13);
    
    doc.text(`BALANCE: UGX ${formatCurrency(remainingBalance)}`, margin, yPos);
    yPos += 6;
    
    // All Bills Cleared Message - FIXED: Use the correct isAllBillsCleared calculation
    if (isAllBillsCleared) {
      doc.setTextColor(0, 128, 0);
      doc.text('*** ALL BILLS CLEARED ***', pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    }
    
    yPos += 10;
    
    // Footer
    doc.setFontSize(9);
    doc.text('Goods/services once sold are not returnable', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFontSize(7);
    doc.text('Software by Gold Quest E-Systems | Tel: 0786747733', pageWidth / 2, yPos, { align: 'center' });
    
    // Save and open PDF
    doc.save('payment_receipt.pdf');
    window.open(doc.output('bloburl'), '_blank');
  };

  useEffect(() => {
    const successTimer = setTimeout(() => {
      setShowSuccessMessage(true);
    }, 500);

    return () => {
      clearTimeout(successTimer);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: "'Courier New', Courier, monospace",
      padding: '10px',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      {loading ? (
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            borderRadius: '6px',
            color: '#27ae60',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          }}>
            <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
            Generating Receipt...
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '450px',
          width: '95%',
          maxHeight: '95vh',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button 
            onClick={() => setShowReceipt(false)}
            style={{
              position: 'sticky',
              top: '5px',
              right: '5px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#777',
              padding: '5px',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              float: 'right',
              zIndex: 10,
              marginBottom: '5px',
              alignSelf: 'flex-end',
              backgroundColor: 'rgba(255,255,255,0.9)'
            }}
            onMouseOver={(e) => {
              e.target.style.color = '#e74c3c';
              e.target.style.backgroundColor = '#f9f9f9';
            }}
            onMouseOut={(e) => {
              e.target.style.color = '#777';
              e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <div style={{ clear: 'both' }}></div>

          {/* Receipt Type Selection */}
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              border: '1px solid #1976d2',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setReceiptSize('80mm')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: receiptSize === '80mm' ? '#1976d2' : 'white',
                  color: receiptSize === '80mm' ? 'white' : '#1976d2',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                }}
              >
                80mm Receipt
              </button>
              <button
                onClick={() => setReceiptSize('A4')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: receiptSize === 'A4' ? '#1976d2' : 'white',
                  color: receiptSize === 'A4' ? 'white' : '#1976d2',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                }}
              >
                A4 Receipt
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 5px' }}>
            {/* Receipt Details Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontWeight: 'bold', 
                textAlign: 'center', 
                marginBottom: '15px',
                fontSize: '18px',
                color: '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Payment Receipt
              </div>
              
              {/* Client Details */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}>
                  Client Details
                </div>
                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '14px',
                  border: '1px solid #e9ecef',
                }}>
                  <div><strong>Name:</strong> {patientName || 'N/A'}</div>
                  <div style={{ marginTop: '5px' }}><strong>Age:</strong> {patientAge || 'N/A'} <strong>ID:</strong> {patientId || 'N/A'}</div>
                </div>
              </div>

              {/* Payment Breakdown */}
              {paymentSections.filter(section => section.amount > 0).length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#1a1a1a',
                    marginBottom: '8px',
                    fontSize: '14px',
                  }}>
                    Payment Breakdown
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    {(() => {
                      const groupedPayments = {};
                      paymentSections
                        .filter(section => section.amount > 0)
                        .forEach(section => {
                          const category = section.category || 'general';
                          if (!groupedPayments[category]) {
                            groupedPayments[category] = [];
                          }
                          groupedPayments[category].push(section);
                        });

                      return Object.keys(groupedPayments).map(category => (
                        <div key={category} style={{ marginBottom: '10px' }}>
                          <div style={{
                            fontWeight: 'bold',
                            color: '#1976d2',
                            marginBottom: '5px',
                            fontSize: '12px',
                            borderBottom: '1px solid #e0e0e0',
                            paddingBottom: '3px'
                          }}>
                            {getCategoryDisplayName(category)}
                          </div>
                          {groupedPayments[category].map((section, index) => (
                            <div key={index} style={{ marginBottom: '5px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ 
                                  color: '#1a1a1a', 
                                  fontSize: '13px',
                                  flex: '1',
                                  wordBreak: 'break-word',
                                  fontWeight: 'bold'
                                }}>
                                  {section.description}
                                </span>
                                <span style={{ 
                                  fontWeight: 'bold', 
                                  color: '#27ae60', 
                                  fontSize: '13px',
                                  whiteSpace: 'nowrap',
                                  fontFamily: "'Courier New', monospace"
                                }}>
                                  UGX {formatCurrency(section.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Transaction Summary */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}>
                  Transaction Summary
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  {[
                    { label: 'Total Amount Due', amount: totalBalanceDue || totalBill },
                    
                    { label: 'Amount Paid', amount: amountUsed },
                  ].map(item => (
                    <div key={item.label} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        color: '#1a1a1a', 
                        fontSize: '13px',
                        flex: '1',
                        fontWeight: 'bold'
                      }}>
                        {item.label}:
                      </span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Courier New', monospace"
                      }}>
                        UGX {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance - FIXED: Use the correct remainingBalance calculation */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  padding: '15px',
                  backgroundColor: isAllBillsCleared ? '#d4edda' : '#fff3cd',
                  borderRadius: '6px',
                  border: isAllBillsCleared ? '2px solid #c3e6cb' : '2px solid #ffeaa7'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: '#1a1a1a', 
                      fontSize: '15px',
                      flex: '1'
                    }}>
                      BALANCE:
                    </span>
                    <span style={{ 
                        fontWeight: 'bold', 
                        color: remainingBalance > 0 ? '#e74c3c' : '#27ae60',
                        fontSize: '15px',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Courier New', monospace"
                      }}>
                      UGX {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                  
                  {/* FIXED: Use the correct isAllBillsCleared calculation */}
                  {isAllBillsCleared && (
                    <div style={{ textAlign: 'center', color: '#155724', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
                      *** ALL BILLS CLEARED ***
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              fontSize: '11px',
              textAlign: 'center',
              color: '#6c757d',
              borderTop: '1px dashed #d0d0d0',
              paddingTop: '15px',
              marginBottom: '60px',
              fontWeight: 'bold'
            }}>
              <div style={{ marginBottom: '5px', fontStyle: 'italic' }}>
                Goods/services once sold are not returnable
              </div>
              <div>
                Software by Gold Quest E-Systems | Tel: 0786747733
              </div>
            </div>
          </div>

          {/* Sticky Print Button */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            padding: '12px 0',
            borderTop: '1px solid #e8e8e8',
            marginTop: 'auto',
            zIndex: 5
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={printReceipt}
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#1565c0';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 15px rgba(25, 118, 210, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#1976d2';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 10px rgba(25, 118, 210, 0.3)';
                }}
              >
                <FontAwesomeIcon icon={faPrint} />
                Print {receiptSize === '80mm' ? '80mm' : 'A4'} Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;