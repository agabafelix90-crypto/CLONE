import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import printJS from 'print-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes, faFileAlt, faReceipt } from '@fortawesome/free-solid-svg-icons';

function ConsultationReceiptModal({ isOpen, onClose, details, token }) {
  const [clinicDetails, setClinicDetails] = useState(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const { patient_name, file_id, contact_id, age, sex, amount, price } = details || {};

  useEffect(() => {
    if (token && isOpen) {
      const fetchClinicDetails = async () => {
        try {
          const response = await fetch(urls.fetchclinicdetails, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (!response.ok) throw new Error('Failed to fetch clinic details');
          const data = await response.json();
          setClinicDetails(data);
        } catch (error) {
          console.error('Error fetching clinic details:', error);
        }
      };

      fetchClinicDetails();
    }
  }, [token, isOpen]);

  const formatCurrency = (amount) => {
    return amount ? Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  const generateReceiptNumber = () => {
    return Math.floor(Math.random() * 900000) + 100000; // 6-digit number
  };

  const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    if (num === 0) return 'ZERO';

    let result = '';
    let thousandIndex = 0;

    while (num > 0) {
      let currentGroup = num % 1000;
      if (currentGroup !== 0) {
        let groupText = '';
        
        // Handle hundreds
        if (currentGroup >= 100) {
          groupText += ones[Math.floor(currentGroup / 100)] + ' HUNDRED ';
          currentGroup %= 100;
        }
        
        // Handle tens and ones
        if (currentGroup >= 20) {
          groupText += tens[Math.floor(currentGroup / 10)] + ' ';
          groupText += ones[currentGroup % 10] + ' ';
        } else if (currentGroup >= 10) {
          groupText += teens[currentGroup - 10] + ' ';
        } else if (currentGroup > 0) {
          groupText += ones[currentGroup] + ' ';
        }
        
        result = groupText + thousands[thousandIndex] + ' ' + result;
      }
      
      num = Math.floor(num / 1000);
      thousandIndex++;
    }
    
    return result.trim() + ' ONLY';
  };

  const handlePrintPOSReceipt = () => {
    const currentDate = new Date().toLocaleString();
    const consultationAmount = amount || price;
    const roundedAmount = Math.round(parseFloat(consultationAmount));
    
    const receiptHtml = `
      <html>
      <head>
        <style>
          @page { 
            margin: 2mm 5mm;
            padding: 0; 
            size: 80mm auto; 
          }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            width: 70mm;
            font-size: 13px;
            color: #000;
            background: #fff;
            word-wrap: break-word;
          }
          .header {
            text-align: center;
            margin-bottom: 5px;
          }
          .clinic-name {
            font-weight: 800;
            font-size: 16px;
            margin: 5px 0;
            letter-spacing: 0.5px;
            max-width: 100%;
          }
          .clinic-details {
            font-weight: 600;
            font-size: 11px;
            margin: 3px 0;
            max-width: 100%;
          }
          .divider {
            border-top: 2px solid #000;
            margin: 8px 0;
          }
          .receipt-title {
            font-weight: 800;
            text-align: center;
            margin: 8px 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            max-width: 100%;
          }
          .receipt-details {
            margin: 5px 0;
            max-width: 100%;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            flex-wrap: wrap;
          }
          .detail-label {
            font-weight: 700;
            max-width: 45%;
          }
          .footer {
            font-size: 10px;
            text-align: center;
            margin-top: 10px;
            border-top: 2px dashed #000;
            padding-top: 8px;
            font-weight: 600;
            max-width: 100%;
          }
          .total-row {
            font-weight: 800;
            font-size: 14px;
          }
          .value {
            max-width: 50%;
            word-break: break-word;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinicDetails?.clinic_name || 'CLINIC NAME'}</div>
          <div class="clinic-details">${clinicDetails?.district || ''}, ${clinicDetails?.sub_county || ''}</div>
          <div class="clinic-details">Tel: ${clinicDetails?.owners_contact || ''}</div>
          <div class="divider"></div>
          <div class="clinic-details">Date: ${currentDate}</div>
          <div class="divider"></div>
        </div>
        
        <div class="receipt-title">CONSULTATION PAYMENT RECEIPT</div>
        <div class="divider"></div>
        
        <div class="receipt-details">
          <div class="detail-row">
            <span class="detail-label">Client Name:</span>
            <span class="value" style="font-weight:600">${patient_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">File ID:</span>
            <span class="value" style="font-weight:600">${file_id || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">OPD No:</span>
            <span class="value" style="font-weight:600">${contact_id || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Age:</span>
            <span class="value" style="font-weight:600">${age || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sex:</span>
            <span class="value" style="font-weight:600">${sex || 'N/A'}</span>
          </div>
          <div class="divider"></div>
          
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="value" style="font-weight:600">CONSULTATION</span>
          </div>
          <div class="divider"></div>
          
          <div class="detail-row total-row">
            <span>TOTAL BILL:</span>
            <span>UGX ${formatCurrency(roundedAmount)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div style="font-weight:700;">Thank you for your payment!</div>
          <div>Software by DeepMind E-Systems</div>
          <div>Contact: 0786747733</div>
        </div>
      </body>
      </html>
    `;

    printJS({
      printable: receiptHtml,
      type: 'raw-html',
      documentTitle: 'Consultation Receipt',
      style: '@page { size: auto; margin: 2mm 5mm; }',
      honorMarginPadding: true,
      honorColor: true
    });
  };

  const handlePrintA4Receipt = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB');
    const formattedTime = currentDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    const receiptNumber = generateReceiptNumber();
    const consultationAmount = amount || price;
    const roundedAmount = Math.round(parseFloat(consultationAmount));
    
    const receiptHtml = `
      <html>
      <head>
        <style>
          @page { 
            margin: 20mm;
            size: A4;
          }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            color: #000;
            background: #fff;
            line-height: 1.4;
            max-height: 50vh;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .clinic-name {
            font-weight: bold;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
          }
          .details-section {
            margin-bottom: 25px;
            font-size: 14px;
          }
          .detail-line {
            margin-bottom: 8px;
          }
          .detail-label {
            text-transform: uppercase;
            font-weight: normal;
            display: inline-block;
            width: 150px;
          }
          .total-section {
            margin-bottom: 20px;
            font-size: 16px;
            text-align: right;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total-amount {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .amount-words {
            font-style: italic;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-style: italic;
            font-size: 16px;
          }
          .printed-info {
            text-align: center;
            margin-top: 25px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinicDetails?.clinic_name || 'CLINIC NAME'} CASH RECEIPT</div>
        </div>
        
        <div class="details-section">
          <div class="detail-line">
            <span class="detail-label">Received from:</span>
            <span>${patient_name || 'N/A'}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">Receipt No:</span>
            <span>${receiptNumber}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">OPD No:</span>
            <span>${contact_id || 'N/A'}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">File ID:</span>
            <span>${file_id || 'N/A'}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">Age:</span>
            <span>${age || 'N/A'}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">Sex:</span>
            <span>${sex || 'N/A'}</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">Service:</span>
            <span>CONSULTATION</span>
          </div>
          <div class="detail-line">
            <span class="detail-label">Pay Date:</span>
            <span>${formattedDate}</span>
          </div>
        </div>
        
        <div class="total-section">
          <div class="total-amount">Total Amount: UGX ${formatCurrency(roundedAmount)}</div>
          <div class="amount-words">(${numberToWords(roundedAmount)})</div>
        </div>
        
        <div class="footer">
          *** Thank you for choosing ${clinicDetails?.clinic_name || 'our clinic'} ***
        </div>
        
        <div class="printed-info">
          Printed on ${formattedDate} at ${formattedTime} from ClinicPro
        </div>
      </body>
      </html>
    `;

    printJS({
      printable: receiptHtml,
      type: 'raw-html',
      documentTitle: 'Consultation Cash Receipt',
      style: '@page { size: A4; margin: 20mm; }',
      honorMarginPadding: true,
      honorColor: false
    });
  };

  if (!isOpen || !clinicDetails) return null;

  const consultationAmount = amount || price;
  const roundedAmount = Math.round(parseFloat(consultationAmount));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'sticky',
            top: 0,
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#e74c3c',
            float: 'right',
            zIndex: 10,
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <h3 style={{ 
            marginBottom: '10px', 
            color: '#27ae60',
            fontWeight: '800',
            fontSize: '20px'
          }}>PAYMENT SUCCESSFUL</h3>
          <h4 style={{ 
            marginBottom: '15px',
            fontWeight: '700',
            fontSize: '18px'
          }}>Consultation Receipt</h4>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>Client Name:</span>
            <span>{patient_name}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>File ID:</span>
            <span>{file_id}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>OPD No:</span>
            <span>{contact_id}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>Age:</span>
            <span>{age}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>Sex:</span>
            <span>{sex}</span>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingLeft: '10px',
            fontWeight: '600'
          }}>
            <span>Service:</span>
           
            <span style={{ fontWeight: '700' }}>CONSULTATION</span>
          </div>

          <div style={{ 
            borderTop: '2px solid #000', 
            margin: '15px 0',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: '800',
            fontSize: '16px'
          }}>
            <span>TOTAL BILL:</span>
            <span>UGX {formatCurrency(roundedAmount)}</span>
          </div>
        </div>

        {!showPrintOptions ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowPrintOptions(true)}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '15px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
            >
              <FontAwesomeIcon icon={faPrint} />
              Print Receipt
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handlePrintPOSReceipt}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
            >
              <FontAwesomeIcon icon={faReceipt} />
              Print POS Receipt (80mm)
            </button>
            
            <button
              onClick={handlePrintA4Receipt}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
            >
              <FontAwesomeIcon icon={faFileAlt} />
              Print A4 Receipt 
            </button>

            <button
              onClick={() => setShowPrintOptions(false)}
              style={{
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Back
            </button>
          </div>
        )}

        <div style={{ 
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '20px',
          color: '#7f8c8d',
          paddingTop: '15px',
          borderTop: '1px solid #ddd',
          fontWeight: '600'
        }}>
          <div>Software by DeepMind E-Systems</div>
        </div>
      </div>
    </div>
  );
}

export default ConsultationReceiptModal;