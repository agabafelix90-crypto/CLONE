import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';

function CreateReceipt() {
  const [clinicName] = useState('Sample Clinic Name');
  const [patientName] = useState('John Doe');
  const [paymentAmount] = useState(100); // Sample payment amount
  const [qrCodeValue] = useState('https://MEDCORE.com/feedback'); // Feedback link

  const generateReceipt = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    const heading = "Receipt for Payment";
    const headingWidth = doc.getStringUnitWidth(heading) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(heading, (doc.internal.pageSize.width - headingWidth) / 2, 30);

    doc.setFontSize(14);
    doc.text(`Clinic: ${clinicName}`, 20, 60);
    doc.text(`Patient: ${patientName}`, 20, 75);
    doc.text(`Amount Paid: $${paymentAmount}`, 20, 90);

    // Create QR Code as image data (Base64)
    const qrCodeCanvas = document.createElement('canvas');
    const qrCode = new QRCodeCanvas({ value: qrCodeValue, size: 50 });
    qrCode.render(qrCodeCanvas);  // Render QRCode to canvas
    
    const qrCodeImage = qrCodeCanvas.toDataURL('image/png'); // Convert canvas to Base64

    // Add the QR Code image to the PDF
    const qrSize = 50;
    const qrX = (doc.internal.pageSize.width - qrSize) / 2;
    const qrY = 120;
    doc.text("Scan QR for feedback:", qrX - 30, qrY - 10);
    doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.save("Receipt.pdf");
    window.open(doc.output('bloburl'), '_blank');
    toast.success('Receipt generated and opened successfully');
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      <h2 style={styles.heading}>Generate Payment Receipt</h2>

      <div style={styles.buttonContainer}>
        <button onClick={generateReceipt} style={styles.primaryButton}>
          Generate Receipt with QR Code
        </button>
      </div>

      <div style={styles.qrCodeContainer}>
        <QRCodeCanvas value={qrCodeValue} size={100} />
        <p style={styles.qrHeading}>Scan this QR Code for Patient Feedback</p>
      </div>
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
    marginTop: '10px',
  },
};

export default CreateReceipt;

