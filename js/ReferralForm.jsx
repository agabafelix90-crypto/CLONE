import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { urls } from './config.dev';

function ReferralForm() {
    const { token, fileId } = useParams();
    const location = useLocation();
    const [fileData, setFileData] = useState(null);
    const [clinicDetails, setClinicDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fromHealthUnit: '',
        dateOfReferral: new Date().toISOString().split('T')[0],
        patientName: '',
        patientSex: '',
        patientAge: '',
        patientOpdNo: '',
        historyAndSymptoms: '',
        diagnosis: '',
        reasonForReferral: '',
        yoursFaithfully: '',
        dateOfArrival: '',
        dateOfDischarge: '',
        treatmentGiven: '',
        treatmentToContinue: '',
        remarks: '',
        nameOfClinician: ''
    });
    const pdfRef = useRef();

    useEffect(() => {
        const fetchClinicDetails = async () => {
            try {
                const response = await fetch(urls.fetchclinicdetails, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch clinic details');
                }
                
                const data = await response.json();
                setClinicDetails(data);
                setFormData(prev => ({
                    ...prev,
                    fromHealthUnit: data.clinic_name || '',
                    yoursFaithfully: data.clinic_name || ''
                }));
            } catch (error) {
                console.error('Error fetching clinic details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClinicDetails();

        if (location.state?.fileData) {
            setFileData(location.state.fileData);
            const fileData = location.state.fileData.fileData;
            
            setFormData(prev => ({
                ...prev,
                patientName: `${fileData.first_name} ${fileData.last_name}`,
                patientSex: fileData.sex,
                patientAge: `${fileData.age} years`,
                patientOpdNo: fileData.opd_no,
                diagnosis: fileData.diagnosis || '',
                historyAndSymptoms: fileData.signs_and_symptoms || ''
            }));
        }
    }, [location.state, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const renderWithLineBreaks = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    const downloadPDF = () => {
        const input = pdfRef.current;
        
        // Hide all inputs and textareas before capturing
        const inputs = input.querySelectorAll('input, textarea');
        inputs.forEach(input => input.style.display = 'none');
        
        // Show all display divs
        const displayDivs = input.querySelectorAll('.display-content');
        displayDivs.forEach(div => div.style.display = 'block');
        
        // Set a fixed width for PDF generation
        const originalWidth = input.style.width;
        input.style.width = '210mm';
        
        html2canvas(input, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: input.scrollWidth,
            windowHeight: input.scrollHeight
        }).then((canvas) => {
            // Reset the width and visibility after capturing
            input.style.width = originalWidth;
            inputs.forEach(input => input.style.display = 'block');
            displayDivs.forEach(div => div.style.display = 'none');
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
        });
    };

    const renderTextareaField = (name, label, value, editable = true) => (
        <div style={{ 
            marginBottom: '20px',
            width: '100%',
            position: 'relative'
        }}>
            <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                fontSize: '14px'
            }}>{label}:</label>
            
            {editable ? (
                <>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleChange}
                        rows="4"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical',
                            wordBreak: 'break-word'
                        }}
                    />
                    
                    <div 
                        className="display-content"
                        style={{
                            display: 'none',
                            width: '100%',
                            padding: '10px 0',
                            fontSize: '14px',
                            minHeight: '80px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            borderBottom: '1px solid #eee',
                            marginBottom: '15px'
                        }}
                    >
                        {renderWithLineBreaks(value)}
                    </div>
                </>
            ) : (
                <div 
                    className="display-content"
                    style={{
                        width: '100%',
                        padding: '10px 0',
                        fontSize: '14px',
                        minHeight: '80px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        borderBottom: '1px solid #eee',
                        marginBottom: '15px'
                    }}
                >
                    {renderWithLineBreaks(value)}
                </div>
            )}
        </div>
    );

    const renderInputField = (name, label, value, type = 'text', editable = true) => (
        <div style={{ marginBottom: '15px' }}>
            <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                fontSize: '14px'
            }}>{label}:</label>
            {editable ? (
                <>
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <div 
                        className="display-content"
                        style={{
                            display: 'none',
                            width: '100%',
                            padding: '8px 0',
                            fontSize: '14px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '10px'
                        }}
                    >
                        {value}
                    </div>
                </>
            ) : (
                <div 
                    className="display-content"
                    style={{
                        width: '100%',
                        padding: '8px 0',
                        fontSize: '14px',
                        borderBottom: '1px solid #eee',
                        marginBottom: '10px'
                    }}
                >
                    {value}
                </div>
            )}
        </div>
    );

    if (loading) {
        return <p style={{ textAlign: 'center', fontSize: '16px' }}>Loading clinic details...</p>;
    }

    return (
        <div style={{
            width: '100%',
            margin: '0',
            padding: '0',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: '#333',
            lineHeight: '1.6',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                margin: '0 auto',
                padding: '20px',
                backgroundColor: 'white'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#000',
                    borderBottom: '2px solid #000',
                    paddingBottom: '10px'
                }}>REFERRAL FORM</h1>
                
                {fileData ? (
                    <div>
                        <div ref={pdfRef} style={{ 
                            padding: '25px',
                            backgroundColor: 'white',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            {/* Header Section */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '30px',
                                paddingBottom: '15px',
                                width: '100%',
                                borderBottom: '1px solid #000'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ 
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        marginBottom: '10px',
                                        color: '#000',
                                        wordBreak: 'break-word'
                                    }}>{clinicDetails?.clinic_name || 'HEALTH UNIT'}</h2>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>{clinicDetails?.sub_county || ''}, {clinicDetails?.district || ''}</p>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>Contact: {clinicDetails?.owners_contact || ''}</p>
                                </div>
                                <div style={{ 
                                    flex: 1,
                                    textAlign: 'right'
                                }}>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}><strong>File ID:</strong> {fileData.fileData.file_id}</p>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Referral Information */}
                            <div style={{ 
                                marginBottom: '25px',
                                paddingBottom: '15px',
                                width: '100%',
                                pageBreakInside: 'avoid'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '20px',
                                    width: '100%'
                                }}>
                                    {renderInputField("fromHealthUnit", "From Health Unit", formData.fromHealthUnit)}
                                    {renderInputField("dateOfReferral", "Date of Referral", formData.dateOfReferral, "date")}
                                </div>
                                
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    margin: '20px 0 10px',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '5px'
                                }}>Patient Details</h3>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '15px'
                                }}>
                                    {renderInputField("patientName", "Patient Name", formData.patientName)}
                                    {renderInputField("patientSex", "Sex", formData.patientSex)}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '15px'
                                }}>
                                    {renderInputField("patientAge", "Age", formData.patientAge)}
                                    {renderInputField("patientOpdNo", "OPD No", formData.patientOpdNo)}
                                </div>
                                
                                <p style={{
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    margin: '30px 0',
                                    textAlign: 'center',
                                    fontStyle: 'italic'
                                }}>
                                    Please attend to the above person whom we are referring to your health clinic for further action.
                                </p>
                                
                                {renderTextareaField("historyAndSymptoms", "History and Symptoms", formData.historyAndSymptoms)}
                                {renderTextareaField("diagnosis", "Diagnosis", formData.diagnosis)}
                                {renderTextareaField("reasonForReferral", "Reason for Referral", formData.reasonForReferral)}
                                
                                <div style={{ marginTop: '30px' }}>
                                    {renderInputField("yoursFaithfully", "Yours Faithfully", formData.yoursFaithfully)}
                                </div>
                            </div>

                            {/* To be completed at referral site */}
                            <div style={{ 
                                marginBottom: '25px',
                                borderTop: '2px solid #000',
                                paddingTop: '15px',
                                width: '100%',
                                pageBreakInside: 'avoid'
                            }}>
                                <h2 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    marginBottom: '15px',
                                    color: '#000',
                                    textAlign: 'center'
                                }}>TO BE COMPLETED AT REFERRAL SITE</h2>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '20px',
                                    width: '100%'
                                }}>
                                    {renderInputField("dateOfArrival", "Date of Arrival", formData.dateOfArrival, "date", false)}
                                    {renderInputField("dateOfDischarge", "Date of Discharge", formData.dateOfDischarge, "date", false)}
                                </div>
                                
                                {renderTextareaField("treatmentGiven", "Treatment Given", formData.treatmentGiven, false)}
                                {renderTextareaField("treatmentToContinue", "Treatment/Surveillance to be Continued", formData.treatmentToContinue, false)}
                                {renderTextareaField("remarks", "Remarks", formData.remarks, false)}
                                
                                <div style={{ marginTop: '20px' }}>
                                    {renderInputField("nameOfClinician", "Name of Clinician", formData.nameOfClinician, "text", false)}
                                </div>
                            </div>
                        </div>

                        {/* Generate PDF Button at Bottom */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '30px',
                            paddingTop: '20px',
                            borderTop: '1px solid #ddd',
                            width: '100%'
                        }}>
                            <button 
                                onClick={downloadPDF} 
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: '#000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.3s'
                                }}
                            >
                                PRINT
                            </button>
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', fontSize: '16px' }}>Loading patient data...</p>
                )}
            </div>
        </div>
    );
}

export default ReferralForm;