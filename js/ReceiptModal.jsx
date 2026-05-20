import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';
import printJS from 'print-js';

const ReceiptModal = ({ receiptDetails = {}, onClose }) => {
  // Format currency with commas
  const formatCurrency = (amount) => {
    return Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Generate a random receipt number
  const receiptNumber = `RCPT-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  // Get current date and time in Uganda format
  const currentDate = new Date().toLocaleDateString('en-UG', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'Africa/Kampala'
  });
  
  const currentTime = new Date().toLocaleTimeString('en-UG', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kampala'
  });

  // Destructure with defaults
  const {
    clinicName = "Clinic Name",
    district = "District",
    town = "Town",
    ownersContact = "Contact",
    drugsSold = [],
    totalAmount = 0,
    employeeName = "Staff"
  } = receiptDetails;

  const handlePrintReceipt = () => {
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @media print {
            body {
              font-family: 'Courier New', monospace;
              width: 80mm;
              margin: 0 auto;
              padding: 5px;
              font-size: 14px;
              line-height: 1.2;
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              font-weight: bold !important;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .clinic-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 3px;
            }
            .receipt-title {
              font-weight: bold;
              text-decoration: underline;
              margin: 5px 0;
              text-align: center;
            }
            .divider {
              border-top: 2px solid #000;
              margin: 5px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .item-name {
              flex: 2;
              padding-right: 5px;
            }
            .item-price {
              flex: 1;
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              margin-top: 5px;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 12px;
            }
            @page {
              size: auto;
              margin: 5mm 5mm 5mm 5mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinicName}</div>
          <div>${district}, ${town}</div>
          <div>Tel: ${ownersContact}</div>
          <div class="divider"></div>
          <div>Receipt: ${receiptNumber}</div>
          <div>Date: ${currentDate} ${currentTime}</div>
          <div class="divider"></div>
        </div>

        <div class="receipt-title">SALE RECEIPT</div>

        ${drugsSold.map(item => `
          <div class="item-row">
            <div class="item-name">${item.quantity} x ${item.drug} (${item.packaging})</div>
            <div class="item-price">${formatCurrency(item.amount)}</div>
          </div>
          <div style="font-size: 12px; margin-left: 10px;">@ UGX ${formatCurrency(item.unitPrice)} each</div>
        `).join('')}

        <div class="divider"></div>

        <div class="item-row total-row">
          <div>TOTAL:</div>
          <div>UGX ${formatCurrency(totalAmount)}</div>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div>Served by: ${employeeName}</div>
          <div>** THANK YOU **</div>
          <div>Goods sold are not returnable</div>
          <div>Software by MEDCORE Systems</div>
          <div>Contact: +256 752 648844</div>
        </div>
      </body>
      </html>
    `;

    printJS({
      printable: receiptHtml,
      type: 'raw-html',
      documentTitle: 'Receipt',
      style: '@page { size: auto; margin: 5mm; }',
      css: `
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `
    });
  };

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
        borderRadius: '4px',
        maxWidth: '300px',
        width: '100%',
        fontFamily: "'Courier New', monospace"
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>RECEIPT PREVIEW</h2>
        
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{clinicName}</div>
          <div>{district}, {town}</div>
          <div>Tel: {ownersContact}</div>
          <div style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>
          <div>Receipt #: {receiptNumber}</div>
          <div>Date: {currentDate} {currentTime}</div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          {drugsSold.map((item, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{item.quantity} x {item.drug}</span>
                <span style={{ fontWeight: 'bold' }}>UGX {formatCurrency(item.amount)}</span>
              </div>
              <div style={{ fontSize: '12px', marginLeft: '10px', fontWeight: 'bold' }}>
                {item.packaging} @ UGX {formatCurrency(item.unitPrice)} each
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>UGX {formatCurrency(totalAmount)}</span>
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
          <div>Served by: {employeeName}</div>
          <div style={{ marginTop: '5px' }}>** THANK YOU **</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button 
            onClick={handlePrintReceipt}
            style={{
              padding: '10px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold'
            }}
          >
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          <button 
            onClick={onClose}
            style={{
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold'
            }}
          >
            <FontAwesomeIcon icon={faTimes} /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
