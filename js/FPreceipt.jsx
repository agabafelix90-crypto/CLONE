import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import printJS from 'print-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';

function FPreceipt({ isOpen, onClose, details, token }) {
  const [clinicDetails, setClinicDetails] = useState(null);
  const { patient_name, method, price } = details;
  const totalPrice = parseFloat(price) || 0;

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

  const handlePrintReceipt = () => {
    const currentDate = new Date().toLocaleString();
    const receiptHtml = `
      <html>
      <head>
        <style>
          @page { margin: 0; padding: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 5px;
            width: 80mm;
            font-size: 13px;
            color: #000;
            background: #fff;
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
          }
          .clinic-details {
            font-weight: 600;
            font-size: 11px;
            margin: 3px 0;
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
          }
          .receipt-details {
            margin: 5px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .detail-label {
            font-weight: 700;
          }
          .footer {
            font-size: 10px;
            text-align: center;
            margin-top: 10px;
            border-top: 2px dashed #000;
            padding-top: 8px;
            font-weight: 600;
          }
          .total-row {
            font-weight: 800;
            font-size: 14px;
          }
          .value {
            font-weight: 600;
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
        
        <div class="receipt-title">FAMILY PLANNING RECEIPT</div>
        <div class="divider"></div>
        
        <div class="receipt-details">
          <div class="detail-row">
            <span class="detail-label">Client Name:</span>
            <span class="value">${patient_name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Method:</span>
            <span class="value">${method || 'N/A'}</span>
          </div>
          <div class="divider"></div>
          
          <div class="detail-row total-row">
            <span>TOTAL PAYMENT:</span>
            <span>UGX ${formatCurrency(totalPrice)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div style="font-weight:700;">Thank you for your payment!</div>
          <div>Software by DEEPMINDS E-Systems</div>
          <div>Contact: 07786747733</div>
        </div>
      </body>
      </html>
    `;
  
    printJS({
      printable: receiptHtml,
      type: 'raw-html',
      documentTitle: 'Family Planning Receipt',
      style: '@page { size: auto; margin: 0mm; }',
      honorMarginPadding: true,
      honorColor: true
    });
  };

  if (!isOpen || !clinicDetails) return null;

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
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#e74c3c',
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
          }}>Family Planning Receipt</h4>
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
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            <span style={{ fontWeight: '700' }}>Method:</span>
            <span>{method}</span>
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
            <span>TOTAL PAYMENT:</span>
            <span>UGX {formatCurrency(totalPrice)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handlePrintReceipt}
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

        <div style={{ 
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '20px',
          color: '#7f8c8d',
          paddingTop: '15px',
          borderTop: '1px solid #ddd',
          fontWeight: '600'
        }}>
          <div>Software by DEEPMINDS E-Systems</div>
        </div>
      </div>
    </div>
  );
}

export default FPreceipt;