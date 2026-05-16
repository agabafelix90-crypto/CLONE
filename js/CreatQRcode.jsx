import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { handleInvalidSession } from './authUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from "jspdf";

function CreatQRcode() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const qrCodeRef = useRef(null);

  const fetchClinicName = async () => {
  try {
    if (token === 'KIKAJJO') {
      // Set the clinic name as "KIKAJJO HEALTH CENTER AND MATERNITY HOME" if the token is KIKAJJO
      setClinicName('KIKAJJO HEALTH CENTER AND MATERNITY HOME');
    } else {
      const response = await fetch(`${urls.fetchclinicname}?token=${token}`);
      const data = await response.json();
      if (response.ok) {
        setClinicName(data.clinic_name);
      } else if (data.error === "Session expired") {
        handleInvalidSession(navigate, window.location.pathname + window.location.search);
      } else {
        throw new Error('Failed to fetch clinic name');
      }
    }
  } catch (error) {
    console.error('Error fetching clinic name:', error);
    toast.error('Error fetching clinic name');
  }
};


  const generateQRCode = () => {
    if (clinicName) {
      // Replace spaces with %20
      const formattedClinicName = clinicName.replace(/ /g, '%20');
      const qrLink = `https://clinicprosystem.com/submitsuggestion/${formattedClinicName}`;
      setQrCode(qrLink);
    }
  };
  

  const printQRCode = () => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  const heading = "SCAN ME";
  const headingWidth = doc.getStringUnitWidth(heading) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(heading, (doc.internal.pageSize.width - headingWidth) / 2, 30);

  // Add the message before the QR Code
  const message = "For any feedbacks, suggestions, want to report bad service, or comment about good service, please scan this code.";
  doc.setFontSize(14);
  doc.text(message, 20, 60, { maxWidth: 180 });

  if (qrCodeRef.current) {
    const base64QR = qrCodeRef.current.toDataURL();
    const qrSize = 120;
    const qrX = (doc.internal.pageSize.width - qrSize) / 2;
    const qrY = 80; // Adjusted to give space for the message

    doc.addImage(base64QR, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.save("QR_Code_Suggestion.pdf");
    window.open(doc.output('bloburl'), '_blank');
    toast.success('PDF generated and opened successfully');
  } else {
    toast.error('QR Code is missing');
  }
};


  useEffect(() => {
    if (token) {
      fetchClinicName();
    } else {
      toast.error('Token is missing');
      navigate('/login');
    }
  }, [token, navigate]);

  return (
    <div style={styles.container}>
      <ToastContainer />

      <h2 style={styles.heading}>Generate Suggestion QR Code</h2>

      <div style={styles.buttonContainer}>
        <button onClick={generateQRCode} style={styles.primaryButton}>
          Generate Suggestion QR Code
        </button>

        <button 
          onClick={printQRCode} 
          style={styles.warningButton} 
          disabled={!clinicName || !qrCode}
        >
          Print QR Code
        </button>
      </div>

      {qrCode && (
        <div style={styles.qrCodeContainer}>
          <h3 style={styles.qrHeading}>Scan this QR Code for Suggestions:</h3>
          <QRCodeCanvas value={qrCode} size={256} ref={qrCodeRef} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f9',
    minHeight: '100vh',
  },
  heading: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  warningButton: {
    backgroundColor: '#f39c12',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  qrCodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
  },
  qrHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '10px',
  },
};

export default CreatQRcode;
